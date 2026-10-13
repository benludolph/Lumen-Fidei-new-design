-- Additive only. Apply to preview; combined Stage 1/2 release remains unpublished.
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS faith_tradition text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS workbook_intro_acknowledged boolean NOT NULL DEFAULT false;
