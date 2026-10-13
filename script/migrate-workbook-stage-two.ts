import { readFileSync } from "node:fs";
import pg from "pg";

// Preview only. Production execution requires a separately approved release.
if (process.env.NODE_ENV !== "development") {
  throw new Error("Stage 2 migration is preview-only; production release is not approved.");
}
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const results = await pool.query(readFileSync("scripts/workbook-stage-two-migration.sql", "utf8"));
  const resultList = Array.isArray(results) ? results : [results];
  for (const result of resultList) {
    if (result.fields?.some(field => field.name === "copied_entries")) {
      console.log(JSON.stringify({ environment: "development", copies: result.rows }));
    }
  }
} catch {
  // PostgreSQL diagnostics can contain field values. Never print the raw error.
  console.error("Stage 2 migration failed and was rolled back. Check schema and counts-only unmapped-kind preflight.");
  process.exitCode = 1;
} finally {
  await pool.end();
}
