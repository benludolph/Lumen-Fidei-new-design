-- Explicitly approved development-only deletion. Do not run on production.
-- Re-run the inventory and obtain approval if affected assignments change.
BEGIN;
LOCK TABLE users IN SHARE ROW EXCLUSIVE MODE;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE track IN ('B','C') AND id NOT IN (9,11))
     OR EXISTS (SELECT 1 FROM users WHERE id IN (9,11) AND (track NOT IN ('B','C') OR track IS NULL))
  THEN RAISE EXCEPTION 'B/C assignments changed: review required'; END IF;
  IF EXISTS (SELECT 1 FROM messages WHERE sender_id IN (9,11) OR receiver_id IN (9,11))
  THEN RAISE EXCEPTION 'Linked messages changed: review required'; END IF;
END $$;
DELETE FROM prelim_completions WHERE user_id IN (9,11);
DELETE FROM user_answers WHERE user_id IN (9,11);
DELETE FROM prayer_completions WHERE user_id IN (9,11);
DELETE FROM survey_responses WHERE user_id IN (9,11) OR track IN ('B','C');
DELETE FROM chat_flow_responses WHERE user_id IN (9,11);
DELETE FROM users WHERE id IN (9,11) AND track IN ('B','C');
DELETE FROM track_requirements WHERE track IN ('B','C');
COMMIT;
-- Retired content tables are removed by the development schema diff.
