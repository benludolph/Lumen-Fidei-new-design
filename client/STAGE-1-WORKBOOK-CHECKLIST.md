# Stage 1 workbook review checklist

Historical Stage 1 checklist: Stage 2 now retires the eight legacy sections and replaces the prayers. Use `docs/workbook-stage-two-report.md` for the current release boundary and verification.

Preview only; do not publish separately from Stage 2. See `docs/workbook-stage-one-report.md` for verification and production impact results.

## Common checks

- At workbook page, resource list, direct section route, lesson sheet, and category session, an unanswered participant must select one of the three exact faith answers. No option is preselected. Failed saves must not allow continuing.
- Reload and access from another browser: the answer and introduction acknowledgment come from the participant profile, not browser storage.
- Change the answer later in My Profile without changing family, spouse, children, chronic issues, identity labels, or other profile fields.
- Before the first category session, read the three-point introduction. Check the alternate second point for both non-Catholic answers; acknowledge and confirm it does not reappear.
- Category sessions begin with the approved opening prayer and end with the approved Catholic or non-Catholic closing prayer.
- The Resources “Begin a session” action uses the same introduction acknowledgment and approved faith-specific session prayers.
- For every revised section, check Why it matters → closed-by-default Catholic teaching disclosure → Confession or Bring to the Lord → extra note → Invitation → fields. Empty optional blocks must be absent.
- Repeat revised-section checks in both direct routes and lesson sheets/category sessions.
- Edit an existing entry that includes unknown fields and a legacy enum selection: neither may be discarded or silently rewritten.
- Verify the same unlock days, Track A restrictions, exemption screens, attestations, and readiness rules. Category-map corrections may change derived readiness, not stored progress.

## Revised sections

| ID | Title | Specific review |
| --- | --- | --- |
| 1 | Sins to bring to Confession | sin; how defaults to I did this only for new entries; seeking and exact placeholder |
| 2 | People I am releasing | person; who_kind new-entry default; what; existing is_family_harm; On God and yourself after Confession |
| 3 | Wounds I carry | five Source options; Family / Childhood still stores Family/Childhood; what; lie_believed; coping; presence; Care note and both care contacts |
| 4 | Sexuality and chastity | sin; person_or_partner; Abuse is a wound |
| 5 | Occult, false worship, and spiritual mixture | practice is textarea; kind new-entry default; spirit_named |
| 6 | Lies and the truth | What the lie says; unseen, helplessness, false_father supplied by truth library; Scripture and truth selection; unknown saved fields remain |
| 7 | Vows I made | vow; when_made |
| 11 | What I run to | addiction; what_it_gives and exact placeholder |
| 13 | People I have hurt | harm; amends_owed |
| 14 | The thread | exactly 17 checklist choices; other_freetext; father_word; hidden old checked values remain stored; no teaching or Confession |
| 15 | Patterns in my family line | pattern_or_sin; side options |
| 16 | Family members of concern | name_or_description; groups_or_sins_involved; group |
| 20 | Objects in my home | object; plan options with no invented default |
| 22 | Body and mind | infirmity and for_healing unchanged |
| 23 | Blessing for those after me | concern; blessing; no Confession block |
| 24 | Bonds that still hold me | unchanged person_or_relationship, how_formed, still_pulls_at_me; category 4 |
| 25 | The family dead | unchanged name, circumstance, notes, named_now; category 3; both care contacts |

## Unchanged boundary

- Sections 8, 9, 10, 12, 17, 18, 19, 21 remain visible, in their original categories, with original copy and fields.
- prayer-templates.ts and PrayerRender.tsx remain untouched; confirm the three existing prayer outputs are unchanged, including legacy Family/Childhood filters.
- No saved entries, attestations, streaks, or enum values are migrated.
- Sources and Acknowledgments contains the exact approved Sean Tobin acknowledgment.

## Copy choices and dependencies

- No approved theological paragraphs were rewritten.
- Detailed section 5 heading takes precedence over the abbreviated title in the structure/table: “Occult, false worship, and spiritual mixture.”
- Quoted labels/options/placeholders retain their supplied punctuation, including periods within quotation marks.
- The non-Catholic introduction uses the supplied alternate second point only; the first and third points retain their approved wording.
- Care line uses the approved U.S. label and actual ministry contact; the attachment did not supply an exact sentence for the combined contact line.
- Shared workbook categories and partial profile persistence are implemented.
- The three added ESV passages were checked against ESV.org.
