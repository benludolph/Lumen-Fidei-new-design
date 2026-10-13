#!/bin/bash
set -e
npm install

# Ensure user_profiles table exists (idempotent — drizzle-kit push prompts interactively for new tables)
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(\`
  CREATE TABLE IF NOT EXISTS \"user_profiles\" (
    \"id\" serial PRIMARY KEY,
    \"user_id\" integer NOT NULL UNIQUE REFERENCES \"users\"(\"id\") ON DELETE CASCADE,
    \"family_members\" text[] NOT NULL,
    \"spouse_name\" text NOT NULL DEFAULT '',
    \"children_names\" text[] NOT NULL,
    \"chronic_issues\" text[] NOT NULL,
    \"chronic_identity_labels\" text[] NOT NULL,
    \"updated_at\" timestamp DEFAULT now() NOT NULL
  )
\`).then(() => { console.log('user_profiles: ok'); pool.end(); }).catch(e => { console.error(e.message); pool.end(); process.exit(1); });
"

# Apply the shared-track schema without interactive rename prompts or dropping
# legacy tables. Retirement is a separate, explicitly reviewed operation.
NODE_ENV=development npx tsx script/migrate-shared-tracks-dev.ts

# Add only the preview workbook profile columns; never migrate participant answers.
node -e "
const { Pool } = require('pg');
const fs = require('fs');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query(fs.readFileSync('scripts/workbook-stage-one-schema.sql', 'utf8'))
  .then(() => pool.end())
  .catch(e => { console.error(e.message); pool.end(); process.exitCode = 1; });
"
