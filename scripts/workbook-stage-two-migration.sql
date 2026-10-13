-- Approved copy-only preservation plan. Never select answer data into logs.
-- All-or-nothing, rerunnable, and safe after participants edit/delete copied rows.
BEGIN;
SELECT pg_advisory_xact_lock(21120261013);
LOCK TABLE workbook_entries IN SHARE ROW EXCLUSIVE MODE;
CREATE TEMP TABLE workbook_before_retirement ON COMMIT DROP AS SELECT * FROM workbook_entries;
CREATE TABLE IF NOT EXISTS workbook_entry_retirements (
  source_entry_id integer PRIMARY KEY REFERENCES workbook_entries(id) ON DELETE CASCADE,
  user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_entry_id integer REFERENCES workbook_entries(id) ON DELETE SET NULL,
  target_section_id integer NOT NULL,
  copied_at timestamp NOT NULL DEFAULT now()
);

-- Unknown legacy enum values must be reviewed, not guessed or silently rewritten.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM workbook_entries
    WHERE section_id = 21
      AND coalesce(entry_data->>'kind', '') NOT IN ('Blood contract/ritual bond', 'Curse against family')
  ) THEN
    RAISE EXCEPTION 'Stage 2 stopped: unmapped section 21 kind; originals unchanged. Review counts before proceeding.';
  END IF;
END $$;

CREATE TEMP TABLE workbook_retirement_copies ON COMMIT DROP AS
SELECT e.id AS source_entry_id, e.user_id, e.section_id AS source_section_id,
       nextval(pg_get_serial_sequence('workbook_entries','id'))::integer AS target_entry_id,
       CASE e.section_id
         WHEN 8 THEN 11 WHEN 9 THEN 1 WHEN 18 THEN 1 WHEN 10 THEN 3
         WHEN 12 THEN 5 WHEN 19 THEN 5 WHEN 17 THEN 16
         WHEN 21 THEN CASE WHEN e.entry_data->>'kind' = 'Blood contract/ritual bond' THEN 5 ELSE 6 END
       END AS target_section_id,
       e.entry_data || CASE e.section_id
         WHEN 8 THEN jsonb_build_object('addiction', coalesce(e.entry_data->>'idol',''))
         WHEN 9 THEN jsonb_build_object('sin', coalesce(e.entry_data->>'pattern',''))
         WHEN 18 THEN jsonb_build_object('sin', coalesce(e.entry_data->>'agreement',''),
           'how', 'I encouraged, approved, or went along with it')
         WHEN 10 THEN jsonb_build_object('what', coalesce(e.entry_data->>'event',''),
           'coping', coalesce(e.entry_data->>'sinful_response',''), 'whose', 'Someone else')
         WHEN 12 THEN '{}'::jsonb
         WHEN 19 THEN jsonb_build_object('spirit_named', coalesce(e.entry_data->>'name',''),
           'practice', 'Devotion to a named spirit or deity')
         WHEN 17 THEN jsonb_build_object('group',
           concat_ws(' — ', nullif(btrim(e.entry_data->>'group'),''), nullif(btrim(e.entry_data->>'titles_or_roles'),'')),
           'name_or_description', 'Lodge membership')
         WHEN 21 THEN CASE WHEN e.entry_data->>'kind' = 'Blood contract/ritual bond'
           THEN jsonb_build_object('practice', coalesce(e.entry_data->>'description',''), 'kind', 'A spell, curse, or pact I made')
           ELSE jsonb_build_object('lie', coalesce(e.entry_data->>'description',''), 'spoken_by', 'A curse spoken over me or my family') END
       END AS entry_data, e.created_at
FROM workbook_entries e
WHERE e.section_id IN (8,9,10,12,17,18,19,21)
  AND NOT EXISTS (SELECT 1 FROM workbook_entry_retirements r WHERE r.source_entry_id = e.id);

INSERT INTO workbook_entries (id,user_id,section_id,entry_data,position,created_at)
SELECT c.target_entry_id,c.user_id,c.target_section_id,c.entry_data,
  coalesce((SELECT max(e.position) FROM workbook_entries e
    WHERE e.user_id=c.user_id AND e.section_id=c.target_section_id), -1)
    + row_number() OVER (PARTITION BY c.user_id,c.target_section_id ORDER BY c.source_entry_id)::integer,
  c.created_at
FROM workbook_retirement_copies c;

INSERT INTO workbook_entry_retirements (source_entry_id,user_id,target_entry_id,target_section_id)
SELECT source_entry_id,user_id,target_entry_id,target_section_id FROM workbook_retirement_copies;

-- Verify within the transaction, without returning entry contents.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM workbook_retirement_copies c
    LEFT JOIN workbook_entries e ON e.id=c.target_entry_id
    WHERE e.id IS NULL OR e.user_id<>c.user_id OR e.section_id<>c.target_section_id
      OR e.entry_data IS DISTINCT FROM c.entry_data
  ) THEN RAISE EXCEPTION 'Stage 2 copy verification failed; transaction rolled back.'; END IF;
  IF EXISTS (
    SELECT 1 FROM workbook_before_retirement b LEFT JOIN workbook_entries e ON e.id=b.id
    WHERE e.id IS NULL OR to_jsonb(e) IS DISTINCT FROM to_jsonb(b)
  ) THEN RAISE EXCEPTION 'Stage 2 original-row preservation failed; transaction rolled back.'; END IF;
END $$;
SELECT source_section_id, target_section_id, count(*)::integer AS copied_entries,
       count(DISTINCT user_id)::integer AS participants
FROM workbook_retirement_copies GROUP BY source_section_id,target_section_id
ORDER BY source_section_id,target_section_id;
COMMIT;
