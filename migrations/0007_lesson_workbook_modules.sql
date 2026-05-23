CREATE TABLE IF NOT EXISTS "lesson_workbook_modules" (
  "id" serial PRIMARY KEY NOT NULL,
  "day_number" integer NOT NULL,
  "title" text NOT NULL,
  "slides" json,
  "completion_message" text,
  CONSTRAINT "lesson_workbook_modules_day_number_unique" UNIQUE("day_number")
);

CREATE TABLE IF NOT EXISTS "lesson_workbook_completions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "workbook_module_id" integer NOT NULL REFERENCES "lesson_workbook_modules"("id") ON DELETE cascade,
  "completed_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "lesson_workbook_completions_user_module_unique" UNIQUE("user_id", "workbook_module_id")
);
