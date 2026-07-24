-- Migration: Add manual_day_override column to users
-- Allows admins to unlock days for a specific participant independently
-- of the global cohort start date (e.g. holdovers from a previous cohort).

ALTER TABLE users ADD COLUMN IF NOT EXISTS manual_day_override INTEGER;
