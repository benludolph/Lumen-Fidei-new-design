import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
const migration = readFileSync("scripts/workbook-stage-two-migration.sql", "utf8")
  .replace("CREATE TABLE IF NOT EXISTS workbook_entry_retirements", "CREATE TEMP TABLE IF NOT EXISTS workbook_entry_retirements");
await client.connect();
try {
  // Temporary tables shadow public tables. Only synthetic entries are read by this test.
  await client.query(`
    CREATE TEMP TABLE users (id integer PRIMARY KEY);
    INSERT INTO users VALUES (1),(2);
    CREATE TEMP TABLE workbook_entries (
      id serial PRIMARY KEY,user_id integer NOT NULL REFERENCES users(id),
      section_id integer NOT NULL,entry_data jsonb NOT NULL,position integer NOT NULL DEFAULT 0,
      created_at timestamp NOT NULL DEFAULT now());
    CREATE TEMP TABLE workbook_entry_retirements (
      source_entry_id integer PRIMARY KEY REFERENCES workbook_entries(id) ON DELETE CASCADE,
      user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_entry_id integer REFERENCES workbook_entries(id) ON DELETE SET NULL,
      target_section_id integer NOT NULL,copied_at timestamp NOT NULL DEFAULT now());
  `);
  const seeds = [
    [8,{idol:"synthetic idol",extra:"kept"},11,{addiction:"synthetic idol",extra:"kept"}],
    [9,{pattern:"synthetic pattern"},1,{sin:"synthetic pattern"}],
    [18,{agreement:"synthetic agreement"},1,{sin:"synthetic agreement",how:"I encouraged, approved, or went along with it"}],
    [10,{event:"synthetic event",sinful_response:"synthetic response"},3,{what:"synthetic event",coping:"synthetic response",whose:"Someone else"}],
    [12,{practice:"synthetic practice",kind:"legacy kind"},5,{practice:"synthetic practice",kind:"legacy kind"}],
    [19,{name:"synthetic name"},5,{spirit_named:"synthetic name",practice:"Devotion to a named spirit or deity"}],
    [21,{description:"synthetic pact",kind:"Blood contract/ritual bond"},5,{practice:"synthetic pact",kind:"A spell, curse, or pact I made"}],
    [21,{description:"synthetic curse",kind:"Curse against family"},6,{lie:"synthetic curse",spoken_by:"A curse spoken over me or my family"}],
    [17,{group:"synthetic lodge",titles_or_roles:"synthetic role"},16,{group:"synthetic lodge — synthetic role",name_or_description:"Lodge membership"}],
  ] as const;
  for (const [section,data] of seeds) await client.query(
    "INSERT INTO workbook_entries(user_id,section_id,entry_data) VALUES(1,$1,$2)",[section,data],
  );
  await client.query("INSERT INTO workbook_entries(user_id,section_id,entry_data) VALUES(2,3,$1)",[{whose:"Family/Childhood",what:"synthetic retained",extra:"untouched"}]);
  const originals = (await client.query("SELECT * FROM workbook_entries ORDER BY id")).rows;
  await client.query(migration);
  for (let i=0;i<seeds.length;i++) {
    const [,data,target,mapped] = seeds[i];
    const {rows} = await client.query("SELECT e.* FROM workbook_entries e JOIN workbook_entry_retirements r ON r.target_entry_id=e.id WHERE r.source_entry_id=$1",[i+1]);
    assert.equal(rows[0].section_id,target);
    assert.equal(rows[0].user_id,1);
    assert.deepEqual(rows[0].entry_data,{...data,...mapped});
  }
  assert.deepEqual((await client.query("SELECT * FROM workbook_entries WHERE id<=10 ORDER BY id")).rows,originals);
  await client.query(migration);
  assert.equal(Number((await client.query("SELECT count(*) FROM workbook_entries")).rows[0].count),19);
  // Edited/deleted copies must not be overwritten or resurrected on retry.
  await client.query("UPDATE workbook_entries SET entry_data='{\"addiction\":\"edited\"}' WHERE id=(SELECT target_entry_id FROM workbook_entry_retirements WHERE source_entry_id=1)");
  await client.query("DELETE FROM workbook_entries WHERE id=(SELECT target_entry_id FROM workbook_entry_retirements WHERE source_entry_id=2)");
  await client.query(migration);
  assert.equal(Number((await client.query("SELECT count(*) FROM workbook_entries")).rows[0].count),18);
  assert.equal((await client.query("SELECT entry_data->>'addiction' AS value FROM workbook_entries WHERE id=(SELECT target_entry_id FROM workbook_entry_retirements WHERE source_entry_id=1)")).rows[0].value,"edited");
  await client.query("INSERT INTO workbook_entries(user_id,section_id,entry_data) VALUES(1,21,'{\"kind\":\"unmapped\"}')");
  await assert.rejects(client.query(migration));
  await client.query("ROLLBACK");
  assert.equal(Number((await client.query("SELECT count(*) FROM workbook_entry_retirements")).rows[0].count),9);
  console.log("Stage 2 migration: all mappings, original preservation, ownership, reruns, deletion, edits and unknown-enum rollback passed (synthetic temporary tables only).");
} catch (error) {
  // This connection reads only the synthetic temporary tables, never participant data.
  console.error("Stage 2 synthetic migration test failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
} finally {
  await client.end();
}
