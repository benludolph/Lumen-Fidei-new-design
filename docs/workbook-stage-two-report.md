# Freedom Workbook — Stage 2 (preview only)

## Release boundary

Stage 1 and Stage 2 must be released together, only after owner approval. This work does not publish either stage or modify production entries. The October 13 revised-prayers attachment is the source for all three prayers; its final paragraph authorizes the revised-content mapping table as the copy-and-preserve plan.

## Implementation and copy choices

- The 17 retained sections are the only active workbook sections. Retired IDs remain reserved. Direct retired-section reads/writes and attestation changes are blocked; deletion cannot remove archived originals.
- The prayers have 13, 9 and 7 possible pages respectively. Empty pages/optional fields are omitted, faith is required before prayer access, and Catholic/non-Catholic branches use the saved answer. Daily inputs remain component-local and disappear when the prayer closes.
- The family-dead child's sentence follows the new prayer text (“…part of our family, and I mourn this child now”), rather than the conflicting “unchanged” format note.
- Existing section option values include final periods that the prayer filter table omits. Both exact variants are accepted when reading; no saved enum values are rewritten.
- Scripture references/verses are only included together when both exist. No empty quotation or invented Scripture is supplied.
- Unknown keys and original rows remain intact. No unlock days, streak requirements, readiness thresholds, or role/exemption rules were changed.

## Preservation

`scripts/workbook-stage-two-migration.sql` copies every retired entry under the supplied mapping. Fields not mentioned in the map remain on the copy too. Lodge group and role are joined with “ — ”. Existing retained entries are never overwritten. Copies are appended in stable source-ID order and retain creation timestamps.

A transaction and copy ledger prevent partial migrations and duplicate copies. Deleted destinations are recorded as deleted, not recopied; edited copies are not overwritten on rerun. Unknown section 21 kinds abort the migration rather than guessing. The transaction verifies all pre-existing rows remain exactly equal and every newly copied destination matches its expected content, without returning answers.

Original attestations and streaks are left untouched. Retired attestations no longer contribute to the active map; they are not converted into new declarations on behalf of participants.

The development-only runner is included in post-merge setup. Production application of the SQL is a separate, approval-gated release operation, not an application-startup side effect.

## Counts-only production preflight — October 13, 2026

These are read-only production counts. Only section 21's routing enum was examined inside the database; no answers, profiles, identities or per-participant results were returned.

| Source → destination | Entries | Participants (overlap across rows) |
|---|---:|---:|
| 8 → 11 | 45 | 13 |
| 9 → 1 | 42 | 14 |
| 10 → 3 | 19 | 11 |
| 12 → 5 | 21 | 13 |
| 17 → 16 | 7 | 6 |
| 18 → 1 | 31 | 12 |
| 19 → 5 | 18 | 11 |
| 21 blood contracts → 5 | 1 | 1 |
| 21 curses → 6 | 23 | 13 |

Total planned copies: **207**. Unmapped section 21 entries: **0**. Archived attestations: **70**.

Among **34** eligible participants, Stage 2 versus the Stage 1 map projects **0 unlock gains, 0 unlock losses, 0 Week 4 readiness gains, and 0 readiness losses**. Stage 1's separate 14/24/25 counts remain in its report (one unlock gain, no readiness change); Stage 2 does not undo that analysis. Repeat both counts-only preflights before any eventual release because production data can change.

Development migration copied **3 entries** (one each from 9, 10 and 18), with original-row and destination verification inside the transaction. No participant answers were opened for review.

## Verification

- `npm run check`
- `npm run build` (existing Browserslist, PostCSS and bundle-size warnings only)
- `npx tsx script/test-workbook-stage-one.ts`
- `npx tsx script/test-workbook-stage-two.ts`
- `npx tsx script/test-workbook-stage-two-migration.ts`

Migration regression tests use synthetic temporary tables only and cover every mapping, ownership, unchanged originals, unknown fields, legacy values, reruns, edited/deleted copies and unknown-enum rollback. Rendering regression tests cover page counts, empty states, faith paths, profile arrays, enum aliases, and retired-source exclusion.

Sensitive data classes already present are faith, family relationships, health/wounds and free-text reflections. No new sensitive fields, analytics, third-party transmissions, or persisted day-of inputs were added. Workbook/profile response-body logging remains suppressed; migration output is aggregate counts only.

### Signed-in browser results and limitation

A synthetic development participant verified the 17-section overview, retired direct-route non-editability, the mandatory faith gate and all three choices, full 13/9-page and sparse 2/3-page Prayer 1/2 output, other/self/God branches, checked themes, profile persistence, and entry editing with unknown-key preservation. No real participant answers were inspected.

The current curriculum contains no PrayerLink slide or prayer_3 reference, and the Resources workbook exposes only prayers 1 and 2. Daily Prayer browser interaction could not be reached without changing curriculum. A focused temporary browser mount also failed at a test-module import before mounting. Therefore daily textarea close/reopen and network behavior were **not browser-verified**. They are covered by render regression assertions for empty/filled/fresh state and inspection of component-local state (no persistence call), not claimed as a successful browser test. No curriculum or unlock rule was changed to manufacture a test route.
