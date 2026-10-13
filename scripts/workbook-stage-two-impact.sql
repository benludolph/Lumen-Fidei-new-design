-- Counts only. The only answer field examined is the enum needed to route section 21.
-- No answer text, profile data, names, IDs, or individual outcomes leave the database.
WITH stage1_map(section_id,category_id) AS (
 VALUES (1,1),(4,1),(8,1),(9,1),(11,1),(13,1),(18,1),
 (5,2),(12,2),(19,2),(20,2),(21,2),(15,3),(16,3),(17,3),(22,3),(23,3),(25,3),
 (6,4),(7,4),(24,4),(2,5),(3,5),(10,5),(14,5)
), final_map AS (
 SELECT * FROM stage1_map WHERE section_id NOT IN (8,9,10,12,17,18,19,21)
), copies AS (
 SELECT user_id, section_id AS source_section_id,
 CASE section_id WHEN 8 THEN 11 WHEN 9 THEN 1 WHEN 18 THEN 1 WHEN 10 THEN 3
 WHEN 12 THEN 5 WHEN 19 THEN 5 WHEN 17 THEN 16
 WHEN 21 THEN CASE entry_data->>'kind' WHEN 'Blood contract/ritual bond' THEN 5
 WHEN 'Curse against family' THEN 6 ELSE NULL END END AS target_section_id
 FROM workbook_entries WHERE section_id IN (8,9,10,12,17,18,19,21)
), eligible AS (
 SELECT id FROM users WHERE role NOT IN ('admin','superuser') AND track='A'
 AND NOT coalesce(workbook_exempt,false)
), signals AS (
 SELECT user_id,section_id FROM workbook_entries
 UNION SELECT user_id,section_id FROM workbook_attestations
), projected AS (
 SELECT s.* FROM signals s JOIN final_map m USING(section_id)
 UNION SELECT user_id,target_section_id FROM copies WHERE target_section_id IS NOT NULL
), categories(category_id,trigger_day) AS (VALUES (1,7),(2,9),(3,11),(4,12),(5,15)),
states AS (
 SELECT e.id,c.category_id,
 EXISTS(SELECT 1 FROM signals s JOIN stage1_map m USING(section_id)
   WHERE s.user_id=e.id AND m.category_id=c.category_id) old_filled,
 EXISTS(SELECT 1 FROM projected s JOIN final_map m USING(section_id)
   WHERE s.user_id=e.id AND m.category_id=c.category_id) new_filled,
 EXISTS(SELECT 1 FROM prayer_completions p WHERE p.user_id=e.id
   AND p.period='morning' AND p.day_number=c.trigger_day) prayer
 FROM eligible e CROSS JOIN categories c
), changes AS (
 SELECT id,
 bool_or((new_filled OR prayer) AND NOT (old_filled OR prayer)) unlock_gain,
 bool_or((old_filled OR prayer) AND NOT (new_filled OR prayer)) unlock_loss,
 bool_and(new_filled) AND NOT bool_and(old_filled) ready_gain,
 bool_and(old_filled) AND NOT bool_and(new_filled) ready_loss
 FROM states GROUP BY id
)
SELECT json_build_object(
 'copy_counts',(SELECT json_agg(x) FROM (
   SELECT source_section_id,target_section_id,count(*) entries,count(DISTINCT user_id) participants
   FROM copies GROUP BY source_section_id,target_section_id ORDER BY source_section_id,target_section_id
 ) x),
 'unmapped_section21_entries',(SELECT count(*) FROM copies WHERE target_section_id IS NULL),
 'retired_attestations',(SELECT count(*) FROM workbook_attestations WHERE section_id IN (8,9,10,12,17,18,19,21)),
 'eligible_participants',(SELECT count(*) FROM eligible),
 'unlock_gains',(SELECT count(*) FROM changes WHERE unlock_gain),
 'unlock_losses',(SELECT count(*) FROM changes WHERE unlock_loss),
 'week4_readiness_gains',(SELECT count(*) FROM changes WHERE ready_gain),
 'week4_readiness_losses',(SELECT count(*) FROM changes WHERE ready_loss),
 'changed_participants_deduplicated',(SELECT count(*) FROM changes WHERE unlock_gain OR unlock_loss OR ready_gain OR ready_loss)
) AS impact;
