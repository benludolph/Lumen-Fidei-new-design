CREATE TABLE IF NOT EXISTS workbook_editorial_content (
  id text PRIMARY KEY,
  draft jsonb NOT NULL,
  applied jsonb NOT NULL,
  revision integer NOT NULL DEFAULT 0,
  updated_at timestamp NOT NULL DEFAULT now()
);
