ALTER TABLE "practice_resources" ADD COLUMN IF NOT EXISTS "subtitle" text;--> statement-breakpoint
ALTER TABLE "practice_resources" ADD COLUMN IF NOT EXISTS "image_url" text;--> statement-breakpoint
ALTER TABLE "practice_resources" ADD COLUMN IF NOT EXISTS "audio_url" text;
