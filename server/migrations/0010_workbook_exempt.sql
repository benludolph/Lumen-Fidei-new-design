-- Add workbook_exempt flag to users
-- When true, the participant is exempt from the deliverance workbook
ALTER TABLE users ADD COLUMN IF NOT EXISTS workbook_exempt boolean NOT NULL DEFAULT false;
