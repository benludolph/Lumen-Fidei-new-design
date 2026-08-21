import type { PoolClient } from "pg";
import { pool } from "./db";

/**
 * Idempotent schema setup for the reusable program model.
 *
 * Existing deployments predate Drizzle migrations, so this runs before route
 * registration in both development and production. The transaction-scoped
 * advisory lock makes concurrent autoscale starts safe.
 */
export async function applyProgramSchema(client: PoolClient): Promise<void> {
  await client.query("SELECT pg_advisory_xact_lock(hashtext('lumen-program-schema-v1'))");

  await client.query(`
    CREATE TABLE IF NOT EXISTS programs (
      id serial PRIMARY KEY,
      key text NOT NULL,
      name text NOT NULL,
      description text,
      is_active boolean NOT NULL DEFAULT true,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT programs_key_unique UNIQUE (key)
    );

    CREATE TABLE IF NOT EXISTS program_releases (
      id serial PRIMARY KEY,
      program_id integer NOT NULL,
      release_number integer NOT NULL,
      label text,
      status text NOT NULL DEFAULT 'draft',
      curriculum jsonb NOT NULL,
      published_at timestamp,
      created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by integer,
      CONSTRAINT program_releases_program_id_fkey
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      CONSTRAINT program_releases_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS program_releases_program_number_unique
      ON program_releases (program_id, release_number);

    CREATE TABLE IF NOT EXISTS program_enrollments (
      id serial PRIMARY KEY,
      user_id integer NOT NULL,
      program_id integer NOT NULL,
      release_id integer NOT NULL,
      cohort_id integer,
      enrolled_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      status text NOT NULL DEFAULT 'active',
      CONSTRAINT program_enrollments_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT program_enrollments_program_id_fkey
        FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      CONSTRAINT program_enrollments_release_id_fkey
        FOREIGN KEY (release_id) REFERENCES program_releases(id) ON DELETE RESTRICT,
      CONSTRAINT program_enrollments_cohort_id_fkey
        FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS program_enrollments_user_program_unique
      ON program_enrollments (user_id, program_id);

    CREATE TABLE IF NOT EXISTS release_lesson_progress (
      id serial PRIMARY KEY,
      enrollment_id integer NOT NULL,
      lesson_key text NOT NULL,
      slide_index integer NOT NULL DEFAULT 0,
      completed boolean NOT NULL DEFAULT false,
      completed_at timestamp,
      updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT release_lesson_progress_enrollment_id_fkey
        FOREIGN KEY (enrollment_id) REFERENCES program_enrollments(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS rlp_enrollment_lesson_unique
      ON release_lesson_progress (enrollment_id, lesson_key);

    CREATE INDEX IF NOT EXISTS rlp_enrollment_idx
      ON release_lesson_progress (enrollment_id);
  `);
}

export async function ensureProgramSchema(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await applyProgramSchema(client);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}