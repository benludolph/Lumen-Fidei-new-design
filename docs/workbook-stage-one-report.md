# Freedom Workbook — Stage 1 delivery

Historical Stage 1 handoff. Stage 2 supersedes the all-25-sections/prayers-unchanged boundary below; see `docs/workbook-stage-two-report.md`. The combined release still requires approval.

Update: the owner approved the combined release on October 13, 2026. See `docs/workbook-combined-release-approval.md` for the refreshed counts, approval scope and release handoff. No publication or production migration was performed by that review.

## Release boundary

Preview only. Nothing was published and no production data was changed. Stage 1 and Stage 2 must ship together after the prayer rewrite and eight-section retirement. Warn the owner before shipping any unrelated change from this branch. There is deliberately no feature flag.

All 25 sections remain visible. Entries, attestations and streaks are not migrated or reset. The three prayer templates and `PrayerRender.tsx` are byte-for-byte unchanged. The legacy `Family/Childhood` stored value remains the value behind the displayed `Family / Childhood` option, preserving existing prayer filters.

## Production counts-only impact

Queried October 13, 2026 using the production read-only database tool, then rerun after correcting the baseline to include unchanged section 10 in category 5. The corrected query returned the same counts below. **These are production counts, not development counts.**

`scripts/workbook-map-impact.sql` uses section IDs/record existence, attestations, morning completion day/period and account eligibility only. It does not select entry data, answers, profiles, names, emails or per-participant result rows. Intermediate joins remain inside the database; the only returned row is an aggregate.

The comparison uses the original **server** map: 14 and 24 in category 1, 25 absent. Each correction is evaluated independently against that baseline, and then all three together. The eligible set is 34 accounts with Track A, non-admin/non-superuser role, and no workbook exemption. The existing endpoints do not filter `is_active`, so this analysis does not invent that filter. Admin/superuser, exempt and non-A outcomes are unchanged by the map.

| Correction versus original map | Participants gaining unlock(s) | Losing unlock(s) | Week 4 readiness gains | Week 4 readiness losses | Any unlock/readiness change, deduplicated |
|---|---:|---:|---:|---:|---:|
| Section 14 → category 5 | 1 | 0 | 0 | 0 | 1 |
| Section 24 → category 4 | 0 | 0 | 0 | 0 | 0 |
| Section 25 → category 3 | 0 | 0 | 0 | 0 | 0 |
| Full corrected map | 1 | 0 | 0 | 0 | 1 |

- Deduplicated people with an unlock change across any scenario: **1**.
- Deduplicated people with a Week 4 readiness change across any scenario: **0**.
- Deduplicated people with either change across any scenario: **1**.
- People affected by more than one individual cause: **0**. Scenario totals are overlapping comparisons and must not be summed as distinct people.
- Combined-only unlock effects: **0**; combined-only readiness effects: **0**.
- Category-level data-readiness changes (distinct from all-five Week 4 readiness): **1** for section 14 alone and the full map; **0** for 24 or 25 alone.

The map correction changes how existing records contribute to derived status, not stored progress. Unlock days remain 7, 9, 11, 12 and 15. No readiness thresholds, completion requirements, Track A checks or exemption rules were changed to compensate.

## Exact-copy and exception report

No approved theological paragraphs were rewritten. All 17 revised section names, paragraph blocks and specified standard field labels/types/options/placeholders/defaults pass source-spec comparison.

No unmatched fields or labels remain. Fields marked unchanged retain their previous definitions; unknown saved keys survive updates. New-entry defaults do not rewrite existing answers.

Explicit presentation/copy choices:

1. The shared teaching label is exactly **“What the Catholic Church teaches”**, as approved, rather than the attachment's paragraph marker “What the Church teaches.”
2. For answered non-Catholics, the heading is **“Bring to the Lord”**, followed by the exact standard replacement paragraph and the exact supplied table line. Where no table line exists, only `Confession` is replaced with `confession to God` in that section's supplied guidance.
3. The non-Catholic introduction replaces only point 2 with the supplied alternate. Points 1 and 3 remain verbatim, including their Confession wording. No further theological edits were inferred.
4. The non-Catholic closing third paragraph is exactly: “Give me the courage to confess my sins and turn from them, and the patience to let You heal my wounds.”
5. Section 5 uses the detailed heading **“Occult, false worship, and spiritual mixture”**; the overview/table abbreviates this as “Occult, false worship, and mixture.” The detailed section heading is authoritative for the section.
6. Section 2's “On God and yourself” note is placed after its Confession block to follow the approved order, without changing its text.
7. No exact combined care-contact sentence was supplied. The added line on 3 and 25 is: **“U.S. Suicide & Crisis Lifeline: 988. Ministry contact: Ben Ludolph, Spiritual Healing Ministry, bludolph@archchicago.org, 708-735-0908.”** Phone/email values are actionable links.
8. Section 6's existing picker label “Step 1 — Which spirit spoke this lie?” becomes **“What the lie says”**. The internal `lying_spirit` key stays unchanged.
9. Section 14 deliberately omits teaching and Confession blocks; section 23 deliberately omits Confession. No filler was written.

The Sources acknowledgment is exactly:

> The approach of the revised Freedom Workbook, including its framing of deliverance as encounter with the Father's love and its work of replacing lies with truth, draws on Sean Tobin, Big God, Little Devil.

ESV verification source: https://www.esv.org/Genesis+16:13;1+Corinthians+10:13;Luke+15:20/

The displayed passages exclude verse numbers, cross-references and footnotes; LORD capitalization and verse words are retained. Summaries and first-person truths match the supplied table.

## Persistence and privacy

- Nullable faith response; no inference and no preselected answer. Both new and existing unanswered participants are asked at workbook access, not through public registration.
- Faith and introduction acknowledgment persist per participant. Profile updates are partial and preserve unrelated fields.
- Workbook updates merge unknown keys server-side and retain authenticated ownership/section checks.
- Workbook/profile API response bodies are not captured by the response logger. No third-party analytics or replay SDK is present in the client, and no sensitive instrumentation was added.
- Only the development database received the two additive profile columns. The idempotent post-merge script provisions those columns for preview.

## Verification

- `npm run check`: passed.
- `npm run build`: passed. Existing non-blocking warnings concern Browserslist age, PostCSS source metadata and bundle size; no build errors.
- `npx tsx script/test-workbook-stage-one.ts`: passed. Covers all 17 section names/copy, standard field contracts, defaults, all 25 mappings, 17 pattern choices, legacy enum compatibility, session prayers, three library additions, and hashes of all eight untouched section definitions and prayer files.
- Preview workflow restarted and serving on port 5000 without startup errors.
- Signed-in browser verification passed using synthetic development accounts only: first-access choices with no default, exploring-faith persistence, introduction timing and acknowledgment across reload/session, keyboard-operable closed teaching, new-entry defaults, section 14 legacy/unknown-field retention, section 23 omission, sections 3/25 care resources, later Catholic and other-tradition profile changes preserving unrelated profile data, faith-specific closing prayers, and direct-route/session consistency.
- Completion checks also identified the separate Resources “Begin a session” wrapper. It now uses the same persisted introduction gate, approved opening prayer and faith-specific closing prayers. The follow-up was confirmed by typecheck and regression assertions covering both session entry points; no second broad browser pass was run.
- Regression checks now verify all 24 original server-map assignments (25 was absent), including section 10, to prevent an incomplete impact baseline.
- A second existing unanswered synthetic profile retained null faith and false acknowledgment; authenticated API reads isolated it from the first account's entries. Its workbook overview remained locked before Week 2, so its gate was not separately exercised in the browser. The same shared gate handles new and existing unanswered profiles when workbook content is accessible.
- Actual direct section URL is `/resources/tools/freedom-workbook/1`; the unregistered `/resources/freedom-workbook/section/1` returns 404 and was not added.
- Exempt and non-A policy branches were checked in the unchanged endpoint code and existing page guards, not by a second browser journey. Non-blocking browser TrustedHTML/WebGPU warnings did not interrupt the tested flow.
- Per-section in-app review checklist: `client/STAGE-1-WORKBOOK-CHECKLIST.md`.

## Changed files

Frontend:
- `client/src/components/workbook/section-definitions.ts`
- `client/src/components/workbook/SectionGuidance.tsx` (new)
- `client/src/components/workbook/WorkbookAccessGate.tsx` (new)
- `client/src/components/workbook/CategorySession.tsx`
- `client/src/components/workbook/SessionWrapper.tsx`
- `client/src/components/workbook/SectionView.tsx`
- `client/src/components/workbook/ListBuilder.tsx`
- `client/src/components/workbook/LiesAndTruthsEditor.tsx`
- `client/src/components/workbook/PatternsChecklist.tsx`
- `client/src/components/workbook/UserProfileEditor.tsx`
- `client/src/components/workbook/WorkbookShell.tsx`
- `client/src/hooks/use-workbook-profile.ts` (new)
- `client/src/data/workbook-revised.ts` (new)
- `client/src/data/patterns_data.ts`
- `client/src/data/truth_library.ts`
- `client/src/data/catholic_truth_library.json`
- `client/src/pages/WorkbookPage.tsx`
- `client/src/pages/Sources.tsx`

Backend/shared:
- `shared/workbook-categories.ts` (new)
- `shared/schema.ts`
- `server/routes.ts`
- `server/storage.ts`
- `server/index.ts`

Setup, checks and documentation:
- `scripts/workbook-stage-one-schema.sql` (new)
- `scripts/workbook-map-impact.sql` (new)
- `scripts/post-merge.sh`
- `script/test-workbook-stage-one.ts` (new)
- `client/STAGE-1-WORKBOOK-CHECKLIST.md` (new)
- `docs/workbook-stage-one-report.md` (new)
