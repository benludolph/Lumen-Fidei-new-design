DROP TABLE IF EXISTS "guided_prayer_responses";

CREATE TABLE "guided_prayer_responses" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "day_number" integer NOT NULL,
  "slide_index" integer NOT NULL,
  "variables" jsonb NOT NULL,
  "completed_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX "gpr_user_day_slide_unique" ON "guided_prayer_responses" ("user_id", "day_number", "slide_index");
