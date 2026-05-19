# Catholic Freedom Workbook — Build Prompt

A prompt for building the Catholic Freedom Workbook as a Toolkit resource in the Lumen Fidei app. Paste the section below the divider into Replit Agent (or Cursor, Claude Code, v0, etc.).

This prompt should be handed to the agent **alongside** `catholic-prayer-content.md`, which is the source of truth for prayer text, the 23-section schema, the User Profile spec, and the Catholic Truth Library spec. This prompt describes the *build*; the content file is the *contract*.

A few notes before you paste:

- **The Workbook is a resource, not a course.** Don't let the agent rebuild it as a series of dated lessons. It sits in the Toolkit alongside the Captivity Builder, always available, no schedule. Sessions are optional scaffolding inside it.
- **Run the discovery phase first.** Same pattern as before — the prompt opens by asking the agent to read your existing slide system and Toolkit registry before writing anything. If the agent tries to skip ahead, stop it.
- **Build in phases.** The prompt suggests five phases (shell → simple sections → special sections → user profile → prayer renders). Don't let the agent attempt the whole thing in one shot.
- **The content file is the contract.** Every schema field name, prayer slot, and rendering rule lives in `catholic-prayer-content.md`. The agent should treat it as authoritative — schemas drift, prayers break.
- **Two new patterns are introduced in this build.** The `in_prayer_textarea` node type (for ephemeral day-of input in the Daily Prayer and Generational Renunciation Prayer) and the User Profile (a small persistent store separate from the Workbook). Both are described in the content file and below.
- **The Catholic Truth Library is a content dependency.** The agent does not author its entries. Without it, Section 6's deeper path can't ship. Section 6's fast path (name a lie, save it) can ship immediately. The deeper path comes online when the library is populated.
- **If anything below contradicts the existing Lumen Fidei codebase, the existing pattern wins.** Flag it during discovery.

---

# Build prompt — paste below this line

## Goal

Add a new tool to the Lumen Fidei Toolkit called the **Freedom Workbook**. It is a persistent, user-scoped store of 23 structured sections, plus three auto-rendered Catholic prayers that pull from those sections. Plus a separate small **User Profile** store for identity/family information used by the Daily Prayer.

The Workbook is a **resource, not a course**. There is no daily schedule, no required order, no completion lock. The user opens it whenever they want, adds to whichever section is on their mind, and saves. When they're ready, they tap into the relevant prayer and read aloud — the blanks are already filled in from their entries.

The three prayers are:

1. **Personal Deliverance Prayer** — 17 pages. Pray once with intention, after working through the Workbook. May be repeated under spiritual direction.
2. **Generational Renunciation Prayer** — 17 pages. Pray once a day for three days after completing the Personal Deliverance Prayer.
3. **Daily Prayer** — 14 pages. Daily, indefinitely. Open-ended. No end date. Soft streak counter, never a deadline.

You will receive a file called `catholic-prayer-content.md` alongside this prompt. **That file is the source of truth for all prayer text, the 23-section schema, the User Profile spec, and the Catholic Truth Library spec.** Read it first.

## Before you write any code — discovery phase

Read these files and report back what you find. Do not write code yet.

1. The Toolkit registry — where `captivity_builder` and any other tools are registered, surfaced in the nav, and dispatched.
2. The Captivity Builder component itself — match its conventions for state, persistence, surfacing (slide-embedded vs. standalone), and styling.
3. The user data store — how `captivity_builder` saves its library (database table, localStorage, both). The Workbook and User Profile will use the same pattern.
4. The slide type registry and renderer — specifically `text`, `text_input`, `single_select`, `multi_select`, and `chat_flow`. The Workbook will introduce one new slide type (`workbook_link`) that follows their conventions.
5. **Any references in the codebase to "Breaking Lies"** — that tool is being removed and folded into Workbook Section 6. Identify what currently uses it, what data it stores, and what user-facing surfaces link to it. We will migrate that data into Section 6 and delete the standalone tool.
6. The main app navigation — confirm the Toolkit entry is already wired from the Captivity Builder build.
7. `catholic-prayer-content.md` itself — confirm you can read it and have the full 23-section schema, the prayer text, the User Profile spec, and the Catholic Truth Library spec in mind before writing.

After reading, report back:

- The stack and framework, naming conventions, and persistence pattern. These should match what was already established for the Captivity Builder — confirm.
- How the Captivity Builder library data is structured in storage. The Workbook will use a parallel structure: one top-level key per user, with 23 sub-keys (one per section) plus a separate User Profile object.
- Whether there are any existing helpers for rendering a "template with user data injected inline" (probably not, but worth checking — if there is one, the prayer render should use it).
- The current Breaking Lies tool inventory (data shape, surfaces, navigation).
- Anything in the existing code that conflicts with the spec.

**Wait for my confirmation before writing code.**

## Removed: Breaking Lies standalone tool

There was previously a standalone Toolkit tool called Breaking Lies. **It is being removed.** Its entire spiritual operation — pick a lying spirit, pick a Scripture, claim a counter-truth — is now Section 6 of the Workbook ("Lies & Truths"). Section 6's design absorbs it cohesively and feeds both the Personal Deliverance Prayer (renunciation-level) and the Daily Prayer (truth-claiming level on Page 7).

After Section 6 ships, delete the standalone Breaking Lies component, registry entry, and any navigation. Existing user entries from Breaking Lies should be migrated into Section 6 — see "Data migration" below.

## What the tool is, top to bottom

### Surface 1 — Toolkit standalone (primary)

A new entry in the Toolkit nav: "Freedom Workbook." Tapping it opens the **Workbook shell** — an index of all 23 sections with completion state (empty / N entries). Tapping any section opens the section editor (list builder, two-stage editor for Section 6, or checklist for Section 14). The shell also has CTAs to begin each of the three prayers.

### Surface 2 — Slide-embedded link (secondary)

A new slide type called `workbook_link`. Renders inside a Lumen Fidei course day as a card that says something like "Open your Workbook and work on Section 5 — Occult & False Spiritual Power" with a button that deep-links into that section of the Workbook. The slide is marked complete when the user returns from the Workbook (any time spent counts). This is how the existing 30-day Lumen Fidei course nudges users toward specific sections at appropriate moments without taking ownership of the data.

### Surface 3 — Optional session wrapper

Inside the Workbook shell, a "Begin a session" button. When tapped, the app picks 1–2 sections the user hasn't filled (or invites them to choose) and runs a short flow: opening prayer → section editor(s) → closing prayer. Bookend prayers are in the content file (Part 5). This gives users who want pacing protection a contained session without forcing it on everyone.

### Surface 4 — Three prayer entries (each a Toolkit card)

The three prayers are each surfaced as separate Toolkit cards alongside the Workbook itself:

- **Personal Deliverance Prayer** — opens the rendered 17-page prayer. Single attestation ("I prayed this") with a timestamp.
- **Generational Renunciation Prayer** — opens the rendered 17-page prayer. Counter: "Day N of 3."
- **Daily Prayer** — opens the rendered 14-page prayer. Soft streak counter ("12 days with the Lord"). No end date. Streak resets on missed day, but the prayer remains accessible every day regardless of streak state.

User taps any card → prayer opens in `<PrayerRender>` → reads aloud, page by page → taps "Mark complete" at the end → returns to the Toolkit.

## Component architecture

Build these in this order:

1. **`<WorkbookShell>`** — the index page. Lists all 23 sections with their status. Surfaces CTAs for the three prayers and "Begin a session."
2. **`<SectionView>`** — renders one section. Dispatches to either `<ListBuilder>` (for most sections), `<LiesAndTruthsEditor>` (for Section 6), or `<PatternsChecklist>` (for Section 14) based on the section's schema type.
3. **`<ListBuilder>`** — a configurable structured-list primitive. Takes a `schema` prop describing what each entry needs. Renders existing entries, an "Add entry" form, per-entry edit/delete. Writes to the Workbook section it's bound to. This is the workhorse — 21 of 23 sections use it.
4. **`<LiesAndTruthsEditor>`** — the unique two-stage component for Section 6. See "Section 6 in detail" below.
5. **`<PatternsChecklist>`** — the checklist component for Section 14. Flat list of checkboxes plus an "Other (free-text)" input.
6. **`<UserProfileEditor>`** — the editor for the User Profile (separate from the Workbook). Lives in app Settings. Surfaced once during onboarding (or first open of Daily Prayer) if profile is empty, with a "Skip for now" option.
7. **`<PrayerRender>`** — a paginated reader for a prayer. Takes a `prayerId` (`personal_deliverance` | `generational_renunciation` | `daily`) and renders the corresponding template, paginated by section. Each page is one screen of prayer text with the user's Workbook entries (and User Profile fields) injected inline. User-injected spans get a distinct visual treatment (subtle highlight background, info-color text) so the user can see at a glance what came from their own data. Supports the `in_prayer_textarea` node type for ephemeral day-of input — see below.
8. **`<SessionWrapper>`** — wraps one or more `<SectionView>` instances between an opening prayer and a closing prayer. Used by Surface 3.
9. **`workbook_link` slide type** — the simple slide type for Surface 2.

## The 23 sections — schemas

**See Part 1 of `catholic-prayer-content.md` for the full schema table.** It includes field names, types, required/optional status, and which prayer slots each field feeds.

A few important points the agent should not miss:

- Field names use **snake_case** and must match the prayer slot expectations exactly. The agent should not rename or alias fields.
- Two sections have **boolean fields that filter prayer rendering**: Section 2 (`is_family_harm` filters into Generational Renunciation Page 9), Section 22 (`for_healing` filters into the healing requests on multiple pages).
- Two sections have **enum fields that route content**: Section 3 (`whose` ∈ Father / Mother / Family/Childhood) and Section 21 (`kind` ∈ Curse against family / Blood contract/ritual bond).
- One section, **Section 14**, is a checklist plus optional free-text values, not a list builder.
- One section, **Section 6**, is a two-stage list builder — see below.

## Section 6 in detail — Lies & Truths

This is the most spiritually loaded section, and the only one with a two-stage entry flow. **It absorbs the spiritual work that used to live in the standalone Breaking Lies tool.**

**Fields** (full table in content file, Part 1):

- `lie` (textarea, required) — "What lie are you carrying?"
- `spoken_by` (text, optional) — "Who spoke this over you?"
- `lying_spirit` (enum of 12 options, optional) — Destruction, Hopelessness, Weakness, Condemnation, Fear, Rejection, Shame, Unworthiness, Isolation, Anxiety, Self-hatred, Confusion. Selecting one unlocks Scripture suggestions.
- `scripture_reference` (text, optional) — picked from suggestions filtered by `lying_spirit`, or "Browse all," or free entry.
- `scripture_text` (textarea, optional) — auto-filled from the Catholic Truth Library when reference is picked. Editable.
- `truth_statement` (textarea, optional) — **auto-filled** from the Catholic Truth Library based on the chosen Scripture. First-person counter-truth. User can edit lightly, but the app does the rewriting work.

**Two-stage user flow:**

1. **Fast path** — User taps "Add a lie." A simple form: `lie` (textarea), `spoken_by` (text, skippable). Save. Entry persists with just those fields. Status updates to "1 lie named."
2. **Deeper path** — Below each saved entry, a button labeled *"Claim a truth against this."* Tapping opens the second stage: pick a lying spirit from the 12 options (with one-line lie summaries displayed — see content file) → see 2–3 Scripture suggestions from the Catholic Truth Library for that spirit → pick one → `scripture_text` and `truth_statement` auto-fill from the library entry → user can read, optionally edit, save. Status updates to "1 lie named, 1 truth claimed."

**The user does not author the truth.** The whole point of Section 6 is that the user is carrying a lie that has convinced them — asking them to generate the truth from scratch is asking them to do the very thing the lie is preventing. The app does the rewriting. The library entry provides a pre-authored first-person counter-truth derived from the chosen Scripture. The user only confirms or lightly personalizes.

**Status display in WorkbookShell:** "N lies named, M truths claimed" — nudges users back to the deeper work without forcing it.

**Truth statement preview (recommended UX):** After Scripture is picked and `truth_statement` auto-fills, show a small preview card: *"Your declaration will read: 'I reject the lie that [lie]. The Lord reminds me: [truth_statement]. As Scripture says, [scripture_reference]: "[scripture_text]"'"* — this shows the user how their inputs become prayer and builds their literacy for the Daily Prayer's Renewal of the Mind page.

**Catholic Truth Library access pattern:**

The library is a static content asset (JSON). See "Catholic Truth Library" section below and Part 7 of the content file. The editor reads from it at runtime via a simple helper:

```ts
getSuggestedScriptures(spirit: LyingSpirit): TruthLibraryEntry[]
getTruthLibraryEntry(spirit: LyingSpirit, reference: string): TruthLibraryEntry | null
```

**Empty library behavior:** If the library is empty or partial when Section 6's deeper path is opened, the Scripture-picker shows whatever is available for the chosen spirit, plus "Browse all" and "Free entry" options. If a spirit has no entries yet, the picker says "Library entries for this spirit are being prepared. You can pick a Scripture freely or save your lie for now." The fast path remains fully functional regardless of library state.

## Section 14 in detail — Dominant spiritual patterns checklist

Flat list of named patterns. Stored as a flat array of checked names plus an optional free-text "Other" entry.

Categories (full list in content file, Part 1): Death, Infirmity, Divination, Rebellion, Lying, Rage, Manipulation, Domination, Control, Fear, Rejection, Lust, Shame, Addiction, Violence, Hatred, Confusion, Despair, Unbelief, Poverty, Suicide, Abuse, Occult bondage, False worship, Pride, Self-hatred, Bitterness, Accusation, Mental torment, Spiritual blindness, *Other (free-text)*.

For the `[spirits_to_renounce]` slot, the renderer joins checked names as `"every spirit of X, every spirit of Y, and every spirit of Z"` (each prefixed with "every spirit of," joined with commas, final "and").

Put the categories list in a single data file (`patterns_data.ts` or similar) — not hardcoded inside the component — so it can be revised without touching component code.

## User Profile — separate from Workbook

The User Profile is a small, persistent data structure **separate from the Workbook**. It holds *who the user is and who they love*, not *what they're bringing to God for cleansing*. The Workbook is repentance and renunciation; the Profile is identity and family.

**Fields** (full spec in content file, Part 6):

- `family_members` — list of names
- `spouse_name` — text
- `children_names` — list of names
- `chronic_issues` — list of text entries (long-term issues the user wants to detach from their identity)
- `chronic_identity_labels` — list of text entries (the false identity labels the user wants to renounce, e.g., "anxious person," "broken one," "addict")

**Storage:** Same persistence pattern as the Workbook (parallel top-level key per user). One Profile per user. Last-write-wins.

**Onboarding:** When the user first opens the Daily Prayer with an empty Profile, prompt them to set it up. Provide a clear "Skip for now" option — the prayer must render gracefully with an empty Profile (entire paragraphs for spouse/children should omit if their fields are empty, not render as "For my spouse, ").

**Settings access:** Profile fields are editable from a dedicated Settings screen at any time.

## Prayer templates

Three prayers. Each is a template with named slots that pull from specific Workbook sections, User Profile fields, or in-prayer textareas.

**The full prayer text lives in `catholic-prayer-content.md` (Parts 2, 3, and 4). Render verbatim. Do not paraphrase, smooth, or "improve" the prayer text.**

Templates should live in a single file (`prayer_templates.ts` or similar) as a typed structure — a paginated list of pages, each with mixed static text and slot nodes.

### Slot syntax in the content file

Two slot types appear in the prayers:

**`{{INJECT: <source>, format=<fmt> using \`<field>\`}}`** — pulls from a Workbook section or User Profile field and formats the result. Format options:

- `items_comma` — comma-joined list with final "and" (e.g., "anger, lust, and despair")
- `names_comma` — same, for name fields
- `patterns_comma` — same, for Section 14 checked patterns
- `spirits_with_every_prefix` — each pattern prefixed with "every spirit of," joined with commas and final "and"
- `infirmities_each` — one statement per line, formatted as "[infirmity name], go in the Name of Jesus Christ."
- `lies_with_truths` — for Daily Prayer Page 7. Each Section 6 entry with a non-empty `truth_statement` rendered as a multi-line block: "I reject the lie that **[lie]**. The Lord reminds me: **[truth_statement]**. As Scripture says, [scripture_reference]: \"[scripture_text]\""
- `text` — raw text value (single field)

Some slots include filters like `skip empties` or `where is_family_harm=true` or `where kind="Curse against family"`. These are evaluated before formatting.

**`{{IN_PRAYER_TEXTAREA: "<placeholder>"}}`** — a new node type. Renders as an inline textarea in the prayer page itself. User can type a short response in the moment of prayer. Input is **ephemeral** — not saved to the Workbook. Renders inline if filled, omits gracefully if empty. Used by:

- Daily Prayer Pages 2 (3 textareas) and 6 (1 textarea)
- Generational Renunciation Prayer Page 14 (1 textarea)

### Page 7 of the Daily Prayer — empty-state handling

Page 7 ("Renewal of the Mind through Scripture") is the key feedback loop of the app. If the user has not yet claimed any truths in Section 6, render the empty-state block defined in the content file. Otherwise, iterate over all Section 6 entries where `truth_statement` is non-empty and render each as a `lies_with_truths` block.

### Three prayers — page counts

| Prayer | Pages | Cadence |
|---|---|---|
| Personal Deliverance Prayer | 17 | Once, with intention. May repeat under spiritual direction. |
| Generational Renunciation Prayer | 17 | Once a day for 3 days. |
| Daily Prayer | 14 | Daily, indefinitely. Open-ended. |

### Daily Prayer naming

Render the Daily Prayer as **"Daily Prayer"** in all UI labels, navigation, and copy. Do not call it "Daily Renewal" or "Prayer #3." Earlier drafts used those names; they're retired.

## Catholic Truth Library — content dependency

A content asset, not code. Powers Section 6's deeper path. Without it, Section 6 ships fast path only.

**Structure** (full spec in content file, Part 7):

```typescript
type LyingSpirit =
  | 'destruction' | 'hopelessness' | 'weakness' | 'condemnation'
  | 'fear' | 'rejection' | 'shame' | 'unworthiness'
  | 'isolation' | 'anxiety' | 'self_hatred' | 'confusion';

type TruthLibraryEntry = {
  spirit: LyingSpirit;
  scripture_reference: string;  // e.g., "Philippians 4:6-7"
  scripture_text: string;        // verse text in chosen Catholic translation
  first_person_truth: string;    // pre-authored first-person counter-truth
};

type CatholicTruthLibrary = TruthLibraryEntry[];
```

**Authoring scope:** 8–12 entries per spirit × 12 spirits = ~100–144 entries total.

**The agent must not author entries.** Build the data structure, the loader, and the access helpers. Ship with the file empty or partially populated. Section 6's deeper path adapts to library state as described above.

**Loading pattern:** Bundle the JSON as a static asset, load at startup. No remote fetch.

**Where the library file lives:** Recommend `src/data/catholic_truth_library.json` or equivalent for your stack. Document the path clearly so the content authors (separate from the agent) know where to put their work.

## Lumen Fidei integration — the `workbook_link` slide type

A simple new slide type. Slide config has:

```ts
{
  type: 'workbook_link',
  section_id: 5, // which Workbook section this slide points to
  prompt: 'Open Section 5 of your Workbook — Occult & False Spiritual Power. Add what you remember. Take your time.',
  cta_label: 'Open Workbook'
}
```

The slide renders the prompt text and the CTA. CTA navigates to the corresponding section of the Workbook. The slide is marked complete the moment the user navigates back to the course (regardless of whether they added entries — adding entries is between them and God, not the app's business). On revisit, the slide shows how many entries are currently in that section as a soft indicator.

Note: `section_id` is a Workbook section number (1–23), not a database row ID.

## Data model

```ts
type WorkbookState = {
  userId: string;
  sections: {
    personal_sins: PersonalSinEntry[];
    people_to_forgive: PersonToForgiveEntry[];
    family_childhood_wounds: FamilyWoundEntry[];
    sexual_sin: SexualSinEntry[];
    occult: OccultEntry[];
    lies_and_truths: LieAndTruthEntry[];           // Section 6 — special schema
    vows: VowEntry[];
    idolatry: IdolatryEntry[];
    pride_rebellion: PrideEntry[];
    trauma: TraumaEntry[];
    addictions: AddictionEntry[];
    false_religion: FalseReligionEntry[];
    harm_to_others: HarmEntry[];
    dominant_patterns: {                            // Section 14 — checklist + free-text
      checked: string[];
      other_freetext: string;
    };
    generational_sins: GenerationalSinEntry[];
    ancestors_of_concern: AncestorEntry[];
    lodges_societies: LodgeEntry[];
    agreement_sins: AgreementSinEntry[];
    named_spirits: NamedSpiritEntry[];
    objects: ObjectEntry[];
    curses_and_contracts: CurseOrContractEntry[];   // has `kind` enum
    infirmities: InfirmityEntry[];                  // has `for_healing` boolean
    future_generation_concerns: FutureConcernEntry[];
  };
  attestations: {
    personal_deliverance_completed_at: ISODate | null;
    generational_renunciation_days_completed: number; // 0-3
    generational_renunciation_last_completed: ISODate | null;
    daily_prayer_streak: number;                    // soft motivator, no cap
    daily_prayer_last_completed: ISODate | null;
  };
  updated_at: ISODate;
}

type UserProfile = {
  userId: string;
  family_members: string[];
  spouse_name: string;          // empty string if no spouse / opted to skip
  children_names: string[];
  chronic_issues: string[];
  chronic_identity_labels: string[];
  updated_at: ISODate;
}
```

Section field-level types should be derived from the schema table in `catholic-prayer-content.md` Part 1.

Save on every entry add/edit/delete (debounced ~500ms). No "Save" button — entries persist immediately, the same way the Captivity Builder library does. Same pattern for the User Profile.

## Data migration — from Breaking Lies to Section 6

If the existing Breaking Lies tool has stored user data, migrate it into Section 6 of the Workbook. The mapping should be straightforward:

- Each Breaking Lies entry → one Section 6 entry
- The lie text → `lie`
- The spirit the user picked → `lying_spirit`
- The Scripture the user picked → `scripture_reference`, with `scripture_text` looked up from the Catholic Truth Library if available
- The personalized rebuke prayer output from Breaking Lies → discarded (we're not preserving it; the new Section 6 generates its own truth statement via the library)
- Any new fields not present in Breaking Lies (`spoken_by`, `truth_statement`) → left empty; user can fill them in

Write the migration as a one-shot script that runs on first load of the new build for any user with existing Breaking Lies data, then marks itself complete and never runs again. Confirm the migration with me before running it in production.

After migration, delete the Breaking Lies component, registry entry, navigation, and storage table/keys.

## What's out of scope for this build

- **Editing entries from the prayer view.** Eventually we'll let the user tap a highlighted span inside the prayer to jump back to the Workbook entry and edit it. Not in this build.
- **Sharing/export.** Some users may want to share their Workbook with a confessor or pastor. Not in this build.
- **Multi-device sync conflicts.** Last-write-wins is fine.
- **Translation switching for the Catholic Truth Library.** Pick one translation (RSV-CE, NABRE, or Douay-Rheims) and use it consistently. Translation choice as a setting is a future build.
- **Reminders/notifications for prayer streaks.** Add later.
- **Catholic Truth Library content authoring.** This is a writing project, not a coding task. The agent ships the data structure and the access pattern, not the entries.

## Suggested build order

Five phases. Show me what you built after each phase and wait for review before continuing.

**Phase 1 — Shell + one simple section end-to-end.** Build `<WorkbookShell>`, `<SectionView>`, and `<ListBuilder>`. Wire up just **Section 2 (People to forgive)** — schema includes the `is_family_harm` boolean, which exercises both a simple text field and a boolean. Get persistence working. Get the styling right. Confirm with me before moving on.

**Phase 2 — All other ListBuilder sections.** Add the schemas for the remaining `list_builder` sections (1, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 21, 22, 23). These should fall out of the `<ListBuilder>` primitive once the schema-driven rendering works. Sections 21 and 22 exercise the enum and boolean filter patterns.

**Phase 3 — Special sections.** Build `<LiesAndTruthsEditor>` (Section 6, two-stage flow, integrates with Catholic Truth Library). Build `<PatternsChecklist>` (Section 14, checklist + free-text). Migrate Breaking Lies data into Section 6. Delete the standalone Breaking Lies tool.

**Phase 4 — User Profile.** Build `<UserProfileEditor>` and its Settings entry. Wire up the empty-profile prompt on first open of Daily Prayer. Profile must save and load correctly before the Daily Prayer is built.

**Phase 5 — Prayer renders.** Build `<PrayerRender>` with support for both `{{INJECT}}` and `{{IN_PRAYER_TEXTAREA}}` slot types. Wire up the three prayers in order: Personal Deliverance Prayer first (most slots, exercises the widest range of `INJECT` formats), then Generational Renunciation Prayer (adds `in_prayer_textarea` and enum-filtered slots), then Daily Prayer (adds User Profile slots and the Page 7 empty-state block). Build `<SessionWrapper>` and the `workbook_link` slide type once the prayer render is stable.

## Styling

Match the Captivity Builder. Same surfaces, same typography, same component aesthetic. User-injected spans inside prayer text get a subtle highlight — info-color background with info-color text — clearly distinct from prayer body text but not loud. `in_prayer_textarea` fields use the same visual treatment as injected spans when filled (so the user sees their own words highlighted alongside their Workbook entries), and a slightly dimmer placeholder treatment when empty.

## Final notes

The Workbook will eventually have several thousand words of user-generated content across 23 sections for a thorough user. The shell, section editors, and prayer pages all need to handle this volume gracefully — virtualized lists if needed, lazy-loaded prayer pages, no jank.

Once the build is done, run through each prayer yourself with seed data and verify the auto-injection visually. If the prayers read naturally aloud — no awkward grammar where the slots got injected, no broken sentences, no orphaned commas after empty slots — the build is correct.

The Catholic Truth Library will ship empty or partial initially. That is expected. Section 6's fast path serves users fully; the deeper path comes online as content is added.

Throughout the build, **the content file (`catholic-prayer-content.md`) is the contract.** If you find yourself making a judgment call about field names, prayer wording, slot syntax, or schema details — re-read the content file. If it's not in the content file, ask me. Don't invent.
