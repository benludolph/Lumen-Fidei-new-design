import pg from "pg";
import { readFileSync } from "fs";

const { Client } = pg;

const PROD_URL = "https://lumen-fidei.app";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

const client = new Client({ connectionString: DATABASE_URL });
await client.connect();
console.log("Connected to dev database");

const missing = JSON.parse(readFileSync("/tmp/missing-images.json", "utf8"));
console.log(`Images to sync: ${missing.length}`);

let success = 0;
let failed = 0;

for (let i = 0; i < missing.length; i++) {
  const filename = missing[i];
  const url = `${PROD_URL}/api/images/${encodeURIComponent(filename)}`;

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) {
      if (i < 5 || (i + 1) % 20 === 0) {
        console.log(`  [${i + 1}/${missing.length}] SKIP ${filename} (HTTP ${resp.status})`);
      }
      failed++;
      continue;
    }

    const mimeType = resp.headers.get("content-type")?.split(";")[0] || "image/webp";
    const buffer = Buffer.from(await resp.arrayBuffer());
    const base64 = buffer.toString("base64");

    await client.query(
      `INSERT INTO uploaded_images (filename, mime_type, data)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [filename, mimeType, base64]
    );

    success++;
    if ((i + 1) % 20 === 0 || i === missing.length - 1) {
      console.log(`  [${i + 1}/${missing.length}] ${success} synced, ${failed} skipped`);
    }
  } catch (err) {
    console.log(`  [${i + 1}/${missing.length}] ERROR ${filename}: ${err.message}`);
    failed++;
  }
}

await client.end();
console.log(`\nDone. ${success} images synced, ${failed} failed/skipped.`);
