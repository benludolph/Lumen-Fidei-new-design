# Shared curriculum and cutover

## Boundaries

- Track A retains its existing identity (`A`), lesson IDs, URLs, calendar, content,
  variants and participant records. Physical `track_a_*` table names and API paths
  are compatibility names; they now serve every track.
- Curriculum ownership includes modules, lessons, prelims, prayers, testimonies,
  requirements, settings, overlays, snapshots, lesson workbooks, answers, chat-flow
  variables, survey responses, completions and resume positions.
- Accounts, mentor relationships, messages, profiles, personal deliverance-workbook
  entries/attestations/streaks, uploaded assets, prayer-resource definitions and
  cohorts remain shared. Cohorts identify a group of people, not lesson content.
  Each track has its own start-date setting.
- Saved lesson prayers retain their source-track context. Personal workbook records
  remain associated with the person when their assigned curriculum changes.
- Participants cannot select a different curriculum through a request header.
  Administrators select a track; mentors can inspect an assigned mentee's track.
  Assignment changes do not convert or delete completion records.
- New tracks are blank drafts. Publishing requires modules, titled lessons with
  slides, consecutive days and a start date. Drafts cannot be assigned.
- Backups restore only their originating track (legacy backups belong to A);
  restoring curriculum never replaces shared prayer resources or uploaded images.

## Reviewed removal

The user explicitly approved permanent deletion of both B/C accounts and their
linked B/C records, not reassignment or archival.

The development inventory contained 30 B lessons; 20 C modules and 20 C lessons;
two C completions; two B/C accounts; and three preliminary completions belonging
to those accounts. The reviewed accounts had no messages, profiles, personal
workbook records, saved answers, surveys, chat-flow answers, guided prayers,
lesson resume positions, password-reset tokens, or mentees.

The separately inspected production inventory had 30 B lessons, 20 C modules,
20 C lessons, and no B/C accounts or participant records. **These are separate
inventories, not an assumption that development and production match.**

Development removal is recorded in
`migrations/retire-reviewed-bc-development.sql`. Its assignment guard aborts if
the reviewed accounts change tracks or new B/C assignments appear.
`script/migrate-shared-tracks-dev.ts` applies only the development schema change;
it adds A-default scope columns without rewriting existing lesson rows, replaces
day/position uniqueness with compound track keys, and removes the five retired
tables. It is not a production migration or a startup routine.

## Deployment and recovery

No production cutover was authorized or performed as part of development work.
Before publishing:

1. Repeat the production read-only inventory, including assignments and every
   linked personal-data table. If it differs, obtain approval for the exact
   changed deletion scope before publishing.
2. Take a restorable database checkpoint/backup. Confirm Track A counts and
   content fingerprints, and verify shared accounts/messages/assets separately.
3. Review the managed Publish schema diff. Scope columns default existing rows to
   A; `tracks` is a **new table**, not a rename of a retired table. Do not drop
   `session`, shared resources, accounts, or any unrelated table.
4. Use the managed Publish migration for production schema changes, not either
   development-only script. The application inserts the preserved A track
   identity idempotently after schema application; it never creates tables.
5. Verify Track A participant and mentor access, then author/publish/assign a blank
   track. Confirm Day 1 isolation, restart persistence and old Healing redirects.

Permanent removal has no inverse data migration. If recovery is needed, restore
both application code and database from the same pre-cutover checkpoint. A code
rollback alone cannot restore deleted content or accounts. A curriculum JSON
export is not a backup of participant records.

## Verification commands

`npm run check`, `npm run build`, and
`npx tsx script/test-track-isolation.ts`.

The database isolation test uses a transaction and rolls back its fixtures.
Raw maintenance SQL is not automatically scoped: every such query must carry
`track_id` (or `track` for surveys). Day reordering moves dependent answers,
completions, resume positions, lesson-workbook references, flow/overlay contexts
and snapshot schedules in the same transaction.
