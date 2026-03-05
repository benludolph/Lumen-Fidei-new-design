CREATE TABLE "cohort_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "daily_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_number" integer NOT NULL,
	"week_number" integer NOT NULL,
	"week_title" text NOT NULL,
	"morning_scripture_ref" text NOT NULL,
	"morning_scripture_text" text NOT NULL,
	"morning_meditation" text NOT NULL,
	"morning_prayer" text,
	"evening_catechism_ref" text,
	"evening_catechism" text,
	"evening_summary" text,
	"evening_questions" json,
	"assignment" text,
	"is_reflection_day" boolean DEFAULT false NOT NULL,
	"is_mentor_day" boolean DEFAULT false NOT NULL,
	CONSTRAINT "daily_content_day_number_unique" UNIQUE("day_number")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"sender_id" integer NOT NULL,
	"receiver_id" integer NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "practice_resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"content" text NOT NULL,
	"duration" text,
	"order" integer DEFAULT 0,
	CONSTRAINT "practice_resources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "prayer_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"day_number" integer NOT NULL,
	"period" text NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "track_a_content" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_number" integer NOT NULL,
	"week_number" integer NOT NULL,
	"central_theme" text NOT NULL,
	"subtitle" text,
	"slides" json,
	"image_url" text,
	"completion_message" text,
	"saint_id" text,
	CONSTRAINT "track_a_content_day_number_unique" UNIQUE("day_number")
);
--> statement-breakpoint
CREATE TABLE "track_a_modules" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_number" integer NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"image_url" text,
	CONSTRAINT "track_a_modules_week_number_unique" UNIQUE("week_number")
);
--> statement-breakpoint
CREATE TABLE "track_requirements" (
	"id" serial PRIMARY KEY NOT NULL,
	"track" text NOT NULL,
	"week_number" integer NOT NULL,
	"morning_practices" json NOT NULL,
	"evening_practices" json NOT NULL,
	"additional_requirements" json
);
--> statement-breakpoint
CREATE TABLE "uploaded_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"data" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uploaded_images_filename_unique" UNIQUE("filename")
);
--> statement-breakpoint
CREATE TABLE "user_answers" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"day_number" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'participant' NOT NULL,
	"track" text,
	"mentor_id" integer,
	"start_date" timestamp,
	"agreement_signed_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "user_day_period_unique" ON "prayer_completions" USING btree ("user_id","day_number","period");