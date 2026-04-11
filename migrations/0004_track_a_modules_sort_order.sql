ALTER TABLE "track_a_modules" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;
UPDATE "track_a_modules" SET "sort_order" = "week_number";
