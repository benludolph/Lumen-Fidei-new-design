CREATE TABLE IF NOT EXISTS "guided_prayer_responses" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "context_key" text NOT NULL,
  "variables" jsonb NOT NULL,
  "completed_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "gpr_user_context_unique" ON "guided_prayer_responses" ("user_id", "context_key");
