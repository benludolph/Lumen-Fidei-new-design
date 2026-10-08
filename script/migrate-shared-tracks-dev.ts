/**
 * DEVELOPMENT ONLY. Production schema changes belong to Publish.
 * Run: NODE_ENV=development npx tsx script/migrate-shared-tracks-dev.ts
 */
import { pool } from "../server/db";
import { getTableConfig } from "drizzle-orm/pg-core";
import * as schema from "../shared/schema";

if (process.env.NODE_ENV !== "development") throw new Error("Development migration only");
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(`CREATE TABLE IF NOT EXISTS tracks (
    id text PRIMARY KEY, name text NOT NULL, status text NOT NULL DEFAULT 'draft',
    created_at timestamp NOT NULL DEFAULT now())`);
  await client.query("INSERT INTO tracks (id,name,status) VALUES ('A','Track A','published') ON CONFLICT DO NOTHING");
  for (const table of Object.values(schema)) {
    if (!table || typeof table !== "object" || !("trackId" in table)) continue;
    const config = getTableConfig(table as any);
    const name = config.name;
    if (!/^[a-z_]+$/.test(name)) throw new Error("Invalid table name");
    await client.query(`ALTER TABLE "${name}" ADD COLUMN IF NOT EXISTS track_id text NOT NULL DEFAULT 'A'`);
    const constraints = await client.query(
      "SELECT conname,contype,pg_get_constraintdef(oid) AS def FROM pg_constraint WHERE conrelid=$1::regclass AND contype IN ('u','p')", [name]);
    for (const constraint of constraints.rows) {
      if (constraint.contype === "p" && name !== "module_overlays") continue;
      if (constraint.def.includes("track_id")) continue;
      await client.query(`ALTER TABLE "${name}" DROP CONSTRAINT "${constraint.conname.replaceAll('"','""')}"`);
    }
    for (const idx of config.indexes) {
      const { name: indexName, columns, unique } = idx.config;
      if (!unique || !indexName) continue;
      const names = columns.map((c: any) => c.name);
      if (!names.includes("track_id") && names.includes("id")) continue;
      // Global workbook module IDs/testimony IDs already disambiguate these keys.
      if (!names.includes("track_id")) continue;
      await client.query(`DROP INDEX IF EXISTS "${indexName}"`);
      await client.query(`CREATE UNIQUE INDEX "${indexName}" ON "${name}" (${names.map(n => `"${n}"`).join(",")})`);
    }
  }
  // Schema reconciliation must not perform retirement/deletion. Legacy data
  // remains untouched until the separately reviewed retirement is applied.
  await client.query("COMMIT");
  console.log("Development shared-track schema applied.");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  client.release();
  await pool.end();
}
