import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import sanitizeHtml from "sanitize-html";
import { getTableName } from "drizzle-orm";
import type { Express } from "express";
import * as people from "../server/features/people/routes";
import * as profile from "../server/features/profile/routes";
import * as responses from "../server/features/responses/routes";
import * as messages from "../server/features/messages/routes";
import * as resources from "../server/features/resources/routes";
import * as cohorts from "../server/features/cohorts/routes";
import * as backups from "../server/features/backups/routes";
import * as workbook from "../server/features/workbook/routes";
import { pool, db } from "../server/db";
import { storage } from "../server/storage";
import { withTrack } from "../server/track-context";

// Never permit a missed mock to connect to the development or production DB.
pool.query = (() => { throw new Error("Real SQL is forbidden in this test."); }) as any;
pool.connect = (() => { throw new Error("Real database connections are forbidden in this test."); }) as any;

const source = readFileSync("server/routes.ts", "utf8");
const parse = (text: string) => ts.createSourceFile("routes.ts", text, ts.ScriptTarget.Latest, true);
const registrations: Record<string, Function> = { ...people, ...profile, ...responses, ...messages, ...resources, ...cohorts, ...backups, ...workbook };
const featureSources = ["people", "profile", "responses", "messages", "resources", "cohorts", "backups", "workbook"]
  .map(name => readFileSync(`server/features/${name}/routes.ts`, "utf8"));
const declarations = new Map<string, ts.FunctionDeclaration>();
for (const text of featureSources) {
  for (const node of parse(text).statements) {
    if (ts.isFunctionDeclaration(node) && node.name) declarations.set(node.name.text, node);
  }
}

function routeSequence(text: string, expand: boolean): string[] {
  const root = parse(text);
  const register = root.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "registerRoutes") as ts.FunctionDeclaration;
  const result: string[] = [];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.expression.getText() === "app") {
        result.push(node.getText());
        return;
      }
      if (expand && ts.isIdentifier(node.expression) && declarations.has(node.expression.text)) {
        visit(declarations.get(node.expression.text)!.body!);
        return;
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(register.body!);
  return result;
}

const helperNames = ["calendarDaysToProgramDay", "computeCurrentProgramDay", "effectiveCurrentDay", "requireAuth", "requireRole", "sanitizeUser", "sanitizeUsers", "stripHtml"];
const helpers = parse(source).statements.filter(node => ts.isFunctionDeclaration(node) && helperNames.includes(node.name?.text ?? ""));
assert.equal(helpers.length, helperNames.length);
// Exercise the actual centralized helper implementations without importing
// registerRoutes, which also initializes authentication and seeds the database.
const dependencies: any = new Function("sanitizeHtml", ts.transpile(
  helpers.map(node => node.getText()).join("\n") + `\nreturn {${helperNames.join(",")}};`,
  { target: ts.ScriptTarget.ES2022 },
))(sanitizeHtml);

const baselineIndex = process.argv.indexOf("--baseline");
if (baselineIndex >= 0) {
  const ref = process.argv[baselineIndex + 1];
  assert.ok(ref && /^[a-zA-Z0-9._/-]+$/.test(ref), "Supply a Git ref after --baseline.");
  const before = execFileSync("git", ["show", `${ref}:server/routes.ts`], { encoding: "utf8" });
  assert.deepEqual(routeSequence(source, true), routeSequence(before, false), "Every route URL, handler, middleware and registration order must match the baseline.");
  const beforeHelpers = parse(before).statements.filter(node => ts.isFunctionDeclaration(node) && helperNames.includes(node.name?.text ?? ""));
  assert.deepEqual(helpers.map(node => node.getText()), beforeHelpers.map(node => node.getText()), "Centralized helper behavior must be unchanged.");
  console.log("PASS: complete route/middleware order and handler text match the pre-extraction baseline.");
}

const routes: { method: string; url: string; handlers: Function[] }[] = [];
const app = Object.fromEntries(["get", "post", "put", "patch", "delete"].map(method =>
  [method, (url: string, ...handlers: Function[]) => routes.push({ method, url, handlers })],
));
const limiterCalls: string[] = [];
for (const name of ["writeLimiter", "messageLimiter", "uploadLimiter"]) dependencies[name] = (_req: unknown, _res: unknown, next: Function) => { limiterCalls.push(name); next(); };
dependencies.upload = { single: () => (_req: unknown, _res: unknown, next: Function) => next() };
dependencies.hashPassword = async () => "synthetic-hash";
dependencies.validateTrackAssignment = async (track: string) => { if (track === "invalid") throw Error("Invalid synthetic assignment"); };

// Register in the same order as the real application, not alphabetical order.
const mainFunction = parse(source).statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === "registerRoutes") as ts.FunctionDeclaration;
for (const node of mainFunction.body!.statements) {
  if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression) && ts.isIdentifier(node.expression.expression)) {
    registrations[node.expression.expression.text]?.(app as unknown as Express, dependencies);
  }
}
assert.equal(routes.length, 58);

const now = new Date("2026-10-19T00:00:00Z");
const users: any[] = [
  { id: 1, role: "participant", name: "Synthetic participant", email: "participant@example.test", mentorId: 2, track: "A", password: "synthetic-hash" },
  { id: 2, role: "mentor", name: "Synthetic mentor", email: "mentor@example.test", track: "A", password: "synthetic-hash" },
  { id: 3, role: "admin", name: "Synthetic admin", email: "admin@example.test", track: "A", password: "synthetic-hash" },
  { id: 4, role: "participant", name: "Unassigned synthetic participant", mentorId: 9, track: "A" },
  { id: 5, role: "superuser", name: "Synthetic superuser", track: "A" },
];
const calls: { name: string; args: any[] }[] = [];
const mock = (name: string, handler: (...args: any[]) => any) => {
  (storage as any)[name] = async (...args: any[]) => { calls.push({ name, args }); return handler(...args); };
};
mock("getUser", id => users.find(user => user.id === id));
mock("getAllUsers", () => users);
mock("getUsersByRole", role => users.filter(user => user.role === role));
mock("getUserByUsername", () => undefined);
mock("getConversationPartnerIds", () => [2]);
mock("createUser", value => ({ id: 99, ...value }));
mock("updateUser", (id, value) => ({ ...users.find(user => user.id === id), ...value }));
mock("deleteUser", () => undefined);
mock("getUserPrayerCompletions", () => []);
mock("getUserAnswers", () => []);
mock("getAllTrackAContent", () => []);
mock("getCohortSetting", () => null);
mock("getMenteeActivitySummary", () => []);
mock("getMessages", () => [{ id: 10, content: "Synthetic message" }]);
mock("getMessagesBetweenUsers", () => []);
mock("deleteMessagesBetweenUsers", () => 2);
mock("getUnreadMessageCount", () => 1);
mock("getUnreadMessageCountsBySender", () => ({ "2": 1 }));
mock("markMessagesAsRead", () => undefined);
mock("markAllMessagesAsRead", () => undefined);
mock("createMessage", value => ({ id: 10, ...value }));
mock("getUserProfile", () => undefined);
mock("upsertUserProfile", (userId, value) => ({ userId, ...value }));
mock("getWorkbookSummary", () => ({}));
mock("getWorkbookEntries", () => []);
mock("upsertWorkbookEntry", (userId, sectionId, entryData, position, id) => ({ id: id ?? 10, userId, sectionId, entryData, position }));
for (const name of ["deleteWorkbookEntry", "setWorkbookAttestation", "clearWorkbookAttestation"]) mock(name, () => undefined);
const workbookModule = { id: 1, dayNumber: 7, title: "Synthetic module", slides: [], completionMessage: null };
mock("getAllLessonWorkbookModules", () => [workbookModule]);
mock("getLessonWorkbookModule", id => id === 1 ? workbookModule : undefined);
mock("getLessonWorkbookCompletionsByUser", () => []);
mock("completeLessonWorkbookModule", (userId, workbookModuleId) => ({ userId, workbookModuleId }));
mock("upsertLessonWorkbookModule", value => ({ id: 1, ...value }));
mock("deleteLessonWorkbookModule", () => undefined);
const cohort = { id: 1, name: "Synthetic cohort", startDate: now, endDate: null, status: "active", createdAt: now };
mock("listCohorts", () => [cohort]);
mock("getActiveCohort", () => cohort);
mock("createCohort", () => cohort);
mock("archiveCohort", () => undefined);
mock("setCohortSetting", () => undefined);
mock("clearAllPrayerCompletions", () => 0);
mock("getAllPracticeResources", () => [{ id: 1, name: "Sample" }]);
mock("getPracticeResourceById", id => id === 1 ? { id, name: "Sample" } : undefined);
mock("getPracticeResourceByName", name => name === "Sample" ? { id: 1, name } : undefined);
mock("updatePracticeResourceById", (id, value) => ({ id, ...value }));
mock("getGuidedPrayerResponse", () => undefined);
mock("upsertGuidedPrayerResponse", (userId, dayNumber, slideIndex, variables) => ({ userId, dayNumber, slideIndex, variables }));
mock("getGuidedPrayerResponsesByUserId", () => []);
mock("createUserAnswer", value => ({ id: 1, ...value }));
mock("getJournalEntries", () => []);

const databaseCalls: { operation: string; table: string; value?: any }[] = [];
let failRestore = false;
let committed = false;
function builder(operation: string, table?: any): any {
  const query: any = {
    from(source: any) { return builder(operation, source); },
    where() { return query; }, orderBy() { return query; }, limit() { return query; },
    values(value: any) {
      if (failRestore) throw Error("Synthetic transaction failure");
      databaseCalls.push({ operation, table: getTableName(table), value });
      return query;
    },
    onConflictDoUpdate() { return query; },
    then(resolve: Function, reject: Function) { return Promise.resolve([]).then(resolve as any, reject as any); },
  };
  if (table && operation === "delete") databaseCalls.push({ operation, table: getTableName(table) });
  return query;
}
Object.assign(db, {
  select: () => builder("select"),
  insert: (table: any) => builder("insert", table),
  delete: (table: any) => builder("delete", table),
  transaction: async (work: Function) => { committed = false; await work(db); committed = true; },
});

let checks = 0;
async function request(method: string, url: string, options: any = {}) {
  const route = routes.find(route => route.method === method && route.url === url);
  assert.ok(route, `${method} ${url}`);
  const actor = options.actor === null ? undefined : options.actor ?? users[0];
  const req: any = { body: options.body ?? {}, params: options.params ?? {}, query: options.query ?? {}, file: options.file, user: actor, isAuthenticated: () => !!actor };
  const res: any = {
    statusCode: 200, headers: {},
    status(code: number) { this.statusCode = code; return this; },
    json(value: any) { this.body = value; return this; },
    send(value: any) { this.body = value; return this; },
    sendStatus(code: number) { this.statusCode = code; return this; },
    setHeader(key: string, value: string) { this.headers[key] = value; return this; },
  };
  for (const handler of route.handlers) {
    let next = false;
    await handler(req, res, () => { next = true; });
    if (!next) break;
  }
  checks++;
  return res;
}

async function main() {
  for (const route of routes) {
    const result = await request(route.method, route.url, { actor: null });
    assert.ok([401, 403].includes(result.statusCode), `Anonymous access: ${route.method} ${route.url}`);
  }
  for (const route of routes.filter(route => route.url.startsWith("/api/admin/"))) {
    for (const actor of [users[0], users[1], users[4]]) {
      // Despite its URL, this existing endpoint also permits mentors.
      if (route.url === "/api/admin/guided-prayer-responses" && actor.role === "mentor") continue;
      assert.equal((await request(route.method, route.url, { actor })).statusCode, 403, route.url);
    }
  }
  const message = await request("post", "/api/messages", { body: { receiverId: 2, content: "<b>Sample</b><script>ignored()</script>" } });
  assert.equal(message.statusCode, 201);
  assert.equal(message.body.content, "Sample");
  assert.equal(message.body.senderId, 1);
  assert.equal((await request("post", "/api/messages", { body: { receiverId: 4, content: "Sample" } })).statusCode, 403);
  assert.equal((await request("get", "/api/messages/:otherUserId", { params: { otherUserId: "4" } })).statusCode, 403);
  assert.equal((await request("get", "/api/messages/:otherUserId", { actor: users[1], params: { otherUserId: "4" } })).statusCode, 403);
  assert.equal((await request("get", "/api/messages/:otherUserId", { actor: users[1], params: { otherUserId: "1" } })).statusCode, 200);
  await request("post", "/api/messages/mark-read", { body: { senderId: 2 } });
  assert.deepEqual(calls.at(-1), { name: "markMessagesAsRead", args: [2, 1] });
  await request("post", "/api/messages/mark-read", { body: {} });
  assert.deepEqual(calls.at(-1), { name: "markAllMessagesAsRead", args: [1] });
  assert.deepEqual((await request("get", "/api/messages/unread/count")).body, { count: 1 });
  assert.equal((await request("get", "/api/admin/messages/:userId1/:userId2", { actor: users[2], params: { userId1: "bad", userId2: "2" } })).statusCode, 400);
  assert.equal((await request("delete", "/api/admin/messages/:userId1/:userId2", { actor: users[2], params: { userId1: "1", userId2: "2" } })).body.count, 2);

  const contacts = await request("get", "/api/users");
  assert.equal(contacts.body.length, 1);
  assert.ok(!("password" in contacts.body[0]));
  assert.equal((await request("get", "/api/users/:id", { params: { id: "4" } })).statusCode, 403);
  assert.equal((await request("get", "/api/users/:id", { params: { id: "2" } })).body.id, 2);
  const created = await request("post", "/api/users", { actor: users[2], body: { name: "New synthetic user", email: "NEW@example.test", password: "synthetic-password", role: "participant", track: "A" } });
  assert.equal(created.statusCode, 201);
  assert.equal(created.body.email, "new@example.test");
  assert.equal(created.body.cohortId, 1);
  assert.ok(!("password" in created.body));
  assert.equal((await request("post", "/api/admin/users/:id/deactivate", { actor: users[2], params: { id: "bad" } })).statusCode, 400);
  assert.equal((await request("post", "/api/admin/users/:id/reactivate", { actor: users[2], params: { id: "999" } })).statusCode, 404);
  assert.equal((await request("get", "/api/admin/users/:id/details", { actor: users[2], params: { id: "1" } })).statusCode, 200);

  assert.equal((await request("get", "/api/user-profile")).body.userId, 1);
  assert.equal((await request("put", "/api/user-profile", { body: { faithTradition: "invalid" } })).statusCode, 400);
  assert.equal((await request("put", "/api/user-profile", { body: { familyMembers: ["Synthetic relative"] } })).body.userId, 1);
  const renamed = await request("patch", "/api/user/name", { body: { name: "Synthetic name" } });
  assert.equal(renamed.body.id, 1);
  assert.ok(!("password" in renamed.body));
  assert.equal((await request("post", "/api/mentor/upload-photo", { actor: users[1] })).statusCode, 400);
  assert.equal((await request("post", "/api/admin/mentor/:mentorId/upload-photo", { actor: users[2], params: { mentorId: "2" } })).statusCode, 400);

  assert.equal((await request("get", "/api/admin/cohorts", { actor: users[2] })).body[0].startDate, now.toISOString());
  assert.equal((await request("get", "/api/admin/cohorts/active", { actor: users[2] })).body.id, 1);
  assert.equal((await request("get", "/api/cohort/start-date", { actor: users[4] })).body.currentDay, 30);
  assert.equal((await request("get", "/api/cohort/start-date", { actor: { ...users[0], manualDayOverride: 12 } })).body.currentDay, 12);
  assert.equal((await request("post", "/api/admin/cohort-settings", { actor: users[2], body: {} })).statusCode, 400);
  const newCohort = await request("post", "/api/admin/cohort/start-new", { actor: users[2], body: { name: "Synthetic next cohort", startDate: "2026-10-19", clearCompletions: false } });
  assert.equal(newCohort.statusCode, 200);
  assert.equal(newCohort.body.cohortId, 1);

  assert.deepEqual((await request("get", "/api/workbook/summary", { actor: { ...users[0], workbookExempt: true } })).body, {});
  assert.equal((await request("get", "/api/workbook/:sectionId", { params: { sectionId: "8" } })).statusCode, 410);
  assert.equal((await request("post", "/api/workbook/:sectionId", { params: { sectionId: "1" }, body: {} })).statusCode, 400);
  const entry = await request("post", "/api/workbook/:sectionId", { params: { sectionId: "1" }, body: { entryData: { sin: "Synthetic entry" } } });
  assert.equal(entry.body.userId, 1);
  await request("delete", "/api/workbook/entry/:id", { params: { id: "10" } });
  assert.deepEqual(calls.at(-1), { name: "deleteWorkbookEntry", args: [10, 1] });
  assert.equal((await request("post", "/api/workbook/attest/:sectionId", { params: { sectionId: "1" } })).statusCode, 204);
  assert.equal((await request("get", "/api/workbook/week4-ready")).body.ready, false);
  assert.deepEqual((await request("get", "/api/workbook/unlock-status", { actor: users[4] })).body.unlockedCategories, [1, 2, 3, 4, 5]);
  const lockedModules = await request("get", "/api/workbook-modules");
  assert.ok(!("slides" in lockedModules.body[0]));
  assert.equal((await request("get", "/api/workbook-modules/:id", { params: { id: "1" } })).statusCode, 403);
  assert.equal((await request("post", "/api/workbook-completions/:id", { params: { id: "1" } })).statusCode, 403);
  assert.equal((await request("post", "/api/workbook-completions/:id", { actor: users[2], params: { id: "1" } })).statusCode, 200);
  assert.equal((await request("post", "/api/admin/workbook-modules", { actor: users[2], body: {} })).statusCode, 400);

  const backup = await withTrack("synthetic-B", () => request("get", "/api/admin/backup", { actor: users[2] }));
  assert.equal(backup.body.trackId, "synthetic-B");
  assert.equal(backup.body.version, 1);
  assert.equal((await request("post", "/api/admin/restore", { actor: users[2], body: {} })).statusCode, 400);
  assert.equal((await request("post", "/api/admin/restore", { actor: users[2], body: backup.body })).statusCode, 400);
  backup.body.data.track_a_content = [{ id: 999, dayNumber: 1, weekNumber: 1, centralTheme: "Synthetic lesson", trackId: "untrusted-track" }];
  const restored = await withTrack("synthetic-B", () => request("post", "/api/admin/restore", { actor: users[2], body: backup.body }));
  assert.equal(restored.statusCode, 200);
  assert.equal(restored.body.counts.track_a_content, 1);
  assert.ok(committed);
  const insert = databaseCalls.find(call => call.table === "track_a_content" && call.operation === "insert")!;
  assert.equal(insert.value.trackId, "synthetic-B");
  assert.ok(!("id" in insert.value));
  failRestore = true;
  const originalError = console.error;
  console.error = () => {};
  try {
    assert.equal((await withTrack("synthetic-B", () => request("post", "/api/admin/restore", { actor: users[2], body: backup.body }))).statusCode, 500);
    assert.equal(committed, false);
  } finally { console.error = originalError; failRestore = false; }

  assert.equal((await request("get", "/api/practice-resources/:idOrName", { params: { idOrName: "1" } })).body.id, 1);
  assert.equal((await request("get", "/api/practice-resources/:idOrName", { params: { idOrName: "missing" } })).statusCode, 404);
  assert.equal((await request("get", "/api/guided-prayer-responses", { query: {} })).statusCode, 400);
  assert.equal((await request("get", "/api/admin/guided-prayer-responses", { actor: users[1], query: { userId: "4" } })).statusCode, 403);
  assert.equal((await request("get", "/api/admin/guided-prayer-responses", { actor: users[1], query: { userId: "1" } })).statusCode, 200);
  assert.equal((await request("post", "/api/answers", { body: { dayNumber: 1, content: "<b>Synthetic answer</b>" } })).body.content, "Synthetic answer");
  assert.equal((await request("get", "/api/journal", { actor: users[1] })).statusCode, 403);
  assert.ok(limiterCalls.includes("messageLimiter"));
  assert.ok(limiterCalls.includes("writeLimiter"));
  assert.ok(limiterCalls.includes("uploadLimiter"));
  console.log(`PASS: ${routes.length} extracted routes, ${checks} isolated requests; permissions, message access, ownership, profiles, cohorts, workbook gating, backup/restore and track scoping. No real SQL or external services.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => pool.end());
