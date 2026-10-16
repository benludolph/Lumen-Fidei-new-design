import assert from "node:assert/strict";
import express, { type RequestHandler } from "express";
import { once } from "node:events";
import { pool } from "../server/db";
import { registerWorkbookContentRoutes } from "../server/workbook-content";
import { DEFAULT_WORKBOOK_DOCUMENT } from "../shared/workbook-content";

// One connection keeps every route query scoped to this temporary table.
// Never read or overwrite the real editorial row.
pool.options.max = 1;
const connection = await pool.connect();
await connection.query(`CREATE TEMP TABLE workbook_editorial_content (
  id text PRIMARY KEY, draft jsonb NOT NULL, applied jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0, updated_at timestamp NOT NULL DEFAULT now()
)`);
connection.release();
const app = express();
app.use(express.json());
const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.header("x-test-role") !== "admin") { res.sendStatus(403); return; }
  next();
};
const pass: RequestHandler = (_req, _res, next) => next();
registerWorkbookContentRoutes(app, pass, requireAdmin, pass);
const server = app.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const base = `http://127.0.0.1:${address.port}`;
async function request(path: string, body?: unknown, role = "admin") {
  return fetch(`${base}/api/admin/workbook-content${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json", "x-test-role": role },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
try {
  const initial = await (await request("")).json();
  const applied = structuredClone(DEFAULT_WORKBOOK_DOCUMENT);
  applied.texts["sections.1.name"] = "Synthetic applied wording, not the default";
  applied.texts["sections.1.teaching"] = "";
  const draft = structuredClone(applied);
  draft.texts["sections.1.name"] = "Synthetic saved draft";
  await pool.query("UPDATE workbook_editorial_content SET draft=$1, applied=$2, revision=7 WHERE id='workbook'", [draft, applied]);
  for (const role of ["participant", "mentor", ""]) {
    assert.equal((await request("/discard-draft", { revision: 7 }, role)).status, 403);
  }
  for (const body of [{}, { revision: -1 }, { revision: 7.5 }, { revision: "7" }, { revision: 7, document: draft }]) {
    assert.equal((await request("/discard-draft", body)).status, 400);
  }
  assert.equal((await request("/discard-draft", { revision: initial.revision })).status, 409);
  const before = await (await request("")).json();
  assert.deepEqual(before, { draft, applied, revision: 7 });
  const response = await request("/discard-draft", { revision: 7 });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { draft: applied, applied, revision: 8 });
  assert.deepEqual(await (await request("")).json(), { draft: applied, applied, revision: 8 }, "restored draft persists on a fresh read");
  // A discard racing another discard must not silently accept the same revision.
  const results = await Promise.all([
    request("/discard-draft", { revision: 8 }),
    request("/discard-draft", { revision: 8 }),
  ]);
  assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
  assert.deepEqual(await (await request("")).json(), { draft: applied, applied, revision: 9 });
  console.log("Workbook discard: exact applied copy, fresh-read persistence, unchanged applied content, revision increments, stale/concurrent conflicts, request validation and admin middleware passed (synthetic temporary table only).");
} finally {
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  await pool.end();
}
