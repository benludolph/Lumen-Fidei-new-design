-- Migration: Add workbook_streaks table
-- Task #97: Deliverance Workbook — Prayers & Daily Renewal
-- Run once against the production database.

CREATE TABLE IF NOT EXISTS workbook_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prayer_id TEXT NOT NULL CHECK (prayer_id IN ('prayer_1', 'prayer_2', 'prayer_3')),
  count INTEGER NOT NULL DEFAULT 0,
  last_completed_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS wb_streaks_user_prayer_unique
  ON workbook_streaks(user_id, prayer_id);
