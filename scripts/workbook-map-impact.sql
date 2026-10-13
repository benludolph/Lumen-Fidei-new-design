-- Read-only, counts-only. No answers, entry_data, profile values or identity columns.
-- Compare each correction independently to the original SERVER map, then all together.
WITH old_map(section_id, category_id) AS (
 VALUES (1,1),(4,1),(8,1),(9,1),(11,1),(13,1),(14,1),(18,1),(24,1),
 (5,2),(12,2),(19,2),(20,2),(21,2),(15,3),(16,3),(17,3),(22,3),(23,3),
 (6,4),(7,4),(2,5),(3,5),(10,5)
), scenarios(scenario) AS (VALUES ('old'),('14'),('24'),('25'),('all')),
maps AS (
 SELECT scenario, section_id,
 CASE WHEN scenario IN ('14','all') AND section_id=14 THEN 5
      WHEN scenario IN ('24','all') AND section_id=24 THEN 4
      ELSE category_id END category_id
 FROM scenarios CROSS JOIN old_map
 UNION ALL SELECT scenario,25,3 FROM scenarios WHERE scenario IN ('25','all')
), eligible AS (
 SELECT id FROM users WHERE role NOT IN ('admin','superuser')
 AND track='A' AND NOT COALESCE(workbook_exempt,false)
 -- is_active is intentionally not filtered: the endpoints do not filter it.
), signals AS (
 SELECT user_id, section_id FROM workbook_entries
 UNION SELECT user_id, section_id FROM workbook_attestations
), categories(category_id, trigger_day) AS (VALUES (1,7),(2,9),(3,11),(4,12),(5,15)),
states AS (
 SELECT e.id, s.scenario,c.category_id,
 EXISTS(SELECT 1 FROM signals x JOIN maps m ON m.section_id=x.section_id
   WHERE x.user_id=e.id AND m.scenario=s.scenario AND m.category_id=c.category_id) filled,
 EXISTS(SELECT 1 FROM prayer_completions p WHERE p.user_id=e.id
   AND p.period='morning' AND p.day_number=c.trigger_day) prayer
 FROM eligible e CROSS JOIN scenarios s CROSS JOIN categories c
), readiness AS (
 SELECT id, scenario, bool_and(filled) ready FROM states GROUP BY id,scenario
), differences AS (
 SELECT n.id,n.scenario,
 bool_or((n.filled OR n.prayer) AND NOT (o.filled OR o.prayer)) unlock_gain,
 bool_or((o.filled OR o.prayer) AND NOT (n.filled OR n.prayer)) unlock_loss,
 bool_or(n.filled<>o.filled) category_readiness_change,
 bool_or(nr.ready AND NOT oldr.ready) ready_gain,
 bool_or(oldr.ready AND NOT nr.ready) ready_loss
 FROM states n JOIN states o ON o.id=n.id AND o.category_id=n.category_id AND o.scenario='old'
 JOIN readiness nr ON nr.id=n.id AND nr.scenario=n.scenario
 JOIN readiness oldr ON oldr.id=n.id AND oldr.scenario='old'
 WHERE n.scenario<>'old' GROUP BY n.id,n.scenario
), participant_totals AS (
 SELECT id,
 bool_or(unlock_gain OR unlock_loss) any_unlock,
 bool_or(ready_gain OR ready_loss) any_ready,
 bool_or(unlock_gain OR unlock_loss OR ready_gain OR ready_loss) any_change,
 count(*) FILTER (WHERE scenario<>'all' AND (unlock_gain OR unlock_loss OR ready_gain OR ready_loss)) causes,
 bool_or(scenario='all' AND (unlock_gain OR unlock_loss)) full_unlock,
 bool_or(scenario<>'all' AND (unlock_gain OR unlock_loss)) individual_unlock,
 bool_or(scenario='all' AND (ready_gain OR ready_loss)) full_ready,
 bool_or(scenario<>'all' AND (ready_gain OR ready_loss)) individual_ready
 FROM differences GROUP BY id
)
SELECT json_build_object(
 'eligible_participants',(SELECT count(*) FROM eligible),
 'by_scenario',(SELECT json_agg(t) FROM (
   SELECT scenario,count(*) FILTER(WHERE unlock_gain) unlock_gains,
   count(*) FILTER(WHERE unlock_loss) unlock_losses,
   count(*) FILTER(WHERE unlock_gain OR unlock_loss) unlock_changed_deduplicated,
   count(*) FILTER(WHERE ready_gain) readiness_gains,
   count(*) FILTER(WHERE ready_loss) readiness_losses,
   count(*) FILTER(WHERE ready_gain OR ready_loss) readiness_changed_deduplicated,
   count(*) FILTER(WHERE category_readiness_change) category_readiness_changed,
   count(*) FILTER(WHERE unlock_gain OR unlock_loss OR ready_gain OR ready_loss) changed_deduplicated
   FROM differences GROUP BY scenario ORDER BY scenario
 )t),
 'deduplicated_totals',(SELECT json_build_object(
   'any_scenario_unlock',count(*) FILTER(WHERE any_unlock),
   'any_scenario_readiness',count(*) FILTER(WHERE any_ready),
   'any_scenario_either',count(*) FILTER(WHERE any_change),
   'overlapping_individual_causes',count(*) FILTER(WHERE causes>1),
   'combined_only_unlock',count(*) FILTER(WHERE full_unlock AND NOT individual_unlock),
   'combined_only_readiness',count(*) FILTER(WHERE full_ready AND NOT individual_ready)
 ) FROM participant_totals)
) AS impact;
