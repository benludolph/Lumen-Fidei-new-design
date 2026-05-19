CREATE TABLE IF NOT EXISTS "workbook_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "section_id" integer NOT NULL,
  "entry_data" jsonb NOT NULL,
  "position" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "we_user_section_idx" ON "workbook_entries" ("user_id", "section_id");

CREATE TABLE IF NOT EXISTS "workbook_attestations" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "section_id" integer NOT NULL,
  "attested_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "wa_user_section_unique" ON "workbook_attestations" ("user_id", "section_id");
