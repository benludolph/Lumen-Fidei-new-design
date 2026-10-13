# Freedom Workbook — combined release approval

## Owner decision — October 13, 2026

The owner explicitly selected **“Approve the combined release”**, with no additional conditions, after reviewing the Stage 1 and Stage 2 reports together and the refreshed production counts below.

Approval covers:

- Stage 1's revised sections and documented copy choices, together with Stage 2's three revised prayers and 17 active sections.
- The child-prayer sentence ending **“…part of our family, and I mourn this child now”**, following the revised prayer text rather than the conflicting “unchanged” format note.
- Copying retired entries into retained sections while preserving archived originals, unknown fields, existing retained entries, attestations and streaks.
- The disclosed Daily Prayer limitation: close/reopen and network behavior were not browser-verified. Existing render assertions and component-local state inspection are not a substitute for a completed browser test.

This records content and release-plan approval, **not publication or execution of a production migration**. This fork has made no production writes. Both stages remain a single release unit.

## Refreshed production preflight

Both existing scripts were rerun through the production read-only query tool on October 13, 2026. Both succeeded and exactly matched the reports. Only aggregate counts were returned; no participant answers or identities were printed.

| Check | Refreshed result |
|---|---|
| Eligible participants | 34 |
| Section 14 correction | 1 unlock gain; 0 losses; 0 Week 4 readiness changes |
| Section 24 correction | 0 unlock or Week 4 readiness changes |
| Section 25 correction | 0 unlock or Week 4 readiness changes |
| Full Stage 1 correction | 1 unlock gain; 0 losses; 0 Week 4 readiness changes |
| Stage 2 versus Stage 1 | 0 unlock gains/losses or Week 4 readiness gains/losses |
| Planned copied entries | 207 |
| Unmapped section 21 entries | 0 |
| Archived attestations retained | 70 |

Copy counts by source → destination: 8 → 11: **45**; 9 → 1: **42**; 10 → 3: **19**; 12 → 5: **21**; 17 → 16: **7**; 18 → 1: **31**; 19 → 5: **18**; 21 → 5: **1**; 21 → 6: **23**.

## Coordinated release handoff

The following are release-time actions, not actions performed by this review:

1. Work from the merged combined version. Obtain confirmation for the actual production operation; this task's approval form explicitly did not trigger publication or production writes.
2. Immediately before the release, rerun `scripts/workbook-map-impact.sql` and `scripts/workbook-stage-two-impact.sql` against production as counts-only, read-only checks. Compare with the baseline above. If any count changes, review the differences with the owner before proceeding. Stop for any unmapped section 21 entries; never guess their destination.
3. Confirm the production database's supported schema and data-operation paths before scheduling the migration. The production query tool used here is read-only and cannot execute the copy transaction. For Replit-managed schema, use the supported publish-time schema process, not a custom production schema runner. The existing copy script includes ledger DDL; do not blindly run it as a workaround for production access restrictions.
4. Coordinate the approved copy-and-preserve operation in `scripts/workbook-stage-two-migration.sql` with the combined application release. Prevent participant workbook writes during the cutover so legacy edits cannot occur after their one-time copy. Do not expose the retired-section application behavior before the copies are available. Establish the authorized execution path and ordering before beginning; if unavailable, keep the release on hold.
5. Preserve the transaction, source-row and destination verification, stable ordering, and copy-ledger rerun behavior. Return aggregate results only. Never overwrite retained entries, delete archived originals, convert attestations, or modify unlock days/readiness thresholds.
6. Verify the aggregate copy results against the fresh preflight, account for prior ledger entries on a rerun, and confirm both stages are active together before reopening participant access. If verification fails, stop and investigate without exposing answers or deleting preserved originals.

Production execution remains separate from this completed review and approval.

## Supporting reports

- `docs/workbook-stage-one-report.md`
- `docs/workbook-stage-two-report.md`
