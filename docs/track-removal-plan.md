# Track B and Healing Removal Plan

## Status

**Planning only. No Track B or Healing code, routes, files, or database data have been removed.**

Implementation must not begin until this plan is approved and the items in **Needs a decision** are resolved.

## Scope and non-negotiable constraints

This change will:

- Remove the unused legacy Track B program backed by `daily_content`.
- Remove the unused Track C / Healing program.
- Preserve the current Track A participant experience, content, progress, onboarding, workbook, surveys, snapshots, certificates, resources, and admin editing behavior.
- Preserve the nullable `users.track` column and the product concept of assigning a user to a current or future program.
- Preserve preliminary modules because Track A onboarding and Track A snapshots still use them.
- Add a small server-side safeguard that prevents the last active admin from being deactivated, demoted, or permanently deleted.
- Use a new forward database migration. Historical migrations will not be rewritten.

This change will not add enterprise audit logging, reauthentication, formal retention controls, large-roster optimization, or a new permissions system.

## Planned end state

- Track A is the only currently implemented and selectable program.
- Track B and Healing pages, routes, editors, API endpoints, seed logic, storage methods, schema models, and dedicated database tables no longer exist.
- A participant assigned to Track A continues through the existing Track A flow.
- A participant with no current program, or an unknown future program value, does not fall back to retired Track B behavior. The dashboard shows a small neutral “no current program assigned” state instead.
- Admin user forms allow Track A or no assignment; they do not offer B or C.
- Generic program storage remains possible through `users.track`.
- The last active admin cannot be removed from active administration through any existing user-management route.

## Application files

### Delete

These files are dedicated to retired programs and have no Track A responsibility:

| File | Action |
| --- | --- |
| `client/src/pages/HealingDashboard.tsx` | Delete the Healing dashboard and Healing certificate entry point. |
| `client/src/pages/HealingLesson.tsx` | Delete the Healing lesson page. |
| `client/src/pages/HealingJournal.tsx` | Delete the Healing journal/answer page. |
| `client/src/components/layout/HealingLayout.tsx` | Delete the Healing-only navigation and layout. |
| `client/src/components/lesson/HealingLessonFlow.tsx` | Delete the Healing lesson renderer, answer flow, and completion flow. |
| `client/src/hooks/use-content.ts` | Delete the Track B `daily_content` query hook. Do not delete the separate Track A content hook. |
| `client/src/hooks/use-content-summaries.ts` | Delete the Track B dashboard-summary hook. |

Two additional deletions depend on decisions below:

- `client/src/hooks/use-track-requirements.ts`
- `scripts/import-content.ts`

### Edit — client

| File | Planned action |
| --- | --- |
| `client/src/App.tsx` | Remove Healing imports, `HealingProtectedRoute`, `/healing` routes, Track C redirects, and the `excludeTrackC` behavior. Preserve participant, mentor, admin, Track A, messaging, collection, journal, and resource routes. |
| `client/src/pages/Dashboard.tsx` | Remove Track B content requests and the legacy non-Track-A detail flow; remove the Track C redirect and B/C branching. Keep the existing Track A grid, lesson, prelim, workbook, prayer, answer, and completion behavior unchanged. Add only a neutral unassigned-program state for participants whose track is not `A`. |
| `client/src/components/DayGridView.tsx` | Remove `trackBSummaries`, the Track B period selector, non-A rendering branches, and `isTrackB` propagation. Preserve Track A titles, modules, prelim gating, workbook gating, certificate behavior, and day cards. |
| `client/src/components/DayCard.tsx` | Remove the `isTrackB` prop and Track B-only display rules. Preserve Track A card styling and behavior. |
| `client/src/pages/Admin.tsx` | Remove the Track A/B/Healing content selector, legacy Track B `ContentManagementView`, and `HealingAdminView`; open the existing Track A editor directly. Remove B/C options from user creation and assignment controls, remove Track B from survey filters, simplify progress rendering to the Track A behavior, and remove Healing-only imports/types/helpers while retaining helpers used by prelim and Track A editors. Keep a generic program/track display where useful, showing Track A or unassigned rather than defaulting to B. |
| `client/src/pages/ProfilePage.tsx` | Remove the Track C `HealingLayout` branch and use the normal layout. |
| `client/src/pages/Resources.tsx` | Remove the Track C `HealingLayout` branch. Preserve Track A workbook unlock and all shared resources. |
| `client/src/pages/MentorProgram.tsx` | Remove the obsolete `trackBSummaries={undefined}` prop. Preserve the Track A mentor preview. |
| `client/src/pages/MentorPortal.tsx` | Remove the fallback that labels a missing assignment as Track B. Display Track A, the stored future program identifier, or unassigned. |
| `client/src/pages/MenteeDetails.tsx` | Remove the fallback that labels a missing assignment as Track B. Preserve Track A answers, completion details, and mentor tools. |

### Edit — server and shared code

| File | Planned action |
| --- | --- |
| `server/auth.ts` | Remove the hard-coded `"A" | "B" | "C"` session-user track union while keeping `track` nullable. The exact replacement depends on the `users.track` typing decision below. |
| `server/routes.ts` | Remove Track B daily-content endpoints, summaries, admin writes, seed/update blocks, and backup/restore handling. Remove all Healing participant/admin endpoints, certificate handling, runtime table bootstrapping, seed logic, and middleware. Simplify admin progress, participant details, and exports to the existing Track A calculations. Preserve Track A, prelim, answer, prayer-completion, workbook, snapshot, survey, resource, messaging, and shared certificate routes. Add the last-active-admin guard described below. |
| `server/storage.ts` | Remove Track B `dailyContent` imports, interface methods, and implementations. Remove Healing imports, interface methods, and implementations. Preserve shared answer/prayer/resource methods and all Track A/prelim/workbook/snapshot methods. Add the minimal active-admin lookup/count helper needed by the guard if a direct query in the route is not sufficient. Handle `trackRequirements` according to the decision below. |
| `server/content-data.ts` | Remove only the `dailyContentData` Track B export. Preserve `practiceResourcesData`; do not treat ministry wording inside resource data as Healing feature code. |
| `shared/schema.ts` | Remove the `dailyContent` table model and insert/select types. Remove `healingModules`, `healingContent`, `healingCompletions`, `healingAnswers`, and their insert/select types. Preserve `users.track`, Track A tables/types, prelim tables/types, shared answers, prayer completions, surveys, resources, workbook data, and snapshots. Adjust the application type of `users.track` according to the decision below. |
| `shared/routes.ts` | Remove the Track B content API contract, Track B admin content-write contract, related imports/types, and `daily_content` backup/restore shapes. Preserve user track fields, Track A contracts, shared answer/prayer/resource contracts, and snapshots. Handle the unused Track Requirements contract according to the decision below. |

### Edit — project documentation

| File | Planned action |
| --- | --- |
| `replit.md` | Remove the Track B seed-data pointer and update the product description from two active program tracks to one current program with a retained future program-assignment concept. Correct only statements made stale by this removal. |
| `docs/admin-audit.md` | Remove or revise findings that describe Track B or Healing as active admin features. Keep the audit’s scale-appropriate framing and the last-active-admin recommendation. |

### Add

| File | Planned action |
| --- | --- |
| `migrations/<generated-removal-migration>.sql` | Add a forward migration that performs preflight checks, removes retired rows/settings, and drops the five dedicated retired-program tables in dependency-safe order. The final path/name depends on the migration-path decision below. |
| `migrations/meta/<generated-snapshot>.json` and `migrations/meta/_journal.json` | Add/update only if generated by the project’s confirmed Drizzle migration workflow. |

No historical migration or migration snapshot will be edited by hand.

## API and runtime removal details

### Track B

Remove:

- `GET /api/content`
- `GET /api/content/:day`
- `GET /api/content-summaries`
- `POST /api/admin/content`
- Track B content summary calculation
- Track B `daily_content` backup and restore handling
- Startup seeding from `dailyContentData`
- Startup correction/update blocks that mutate legacy daily content
- Track B-specific branches in admin progress and exports

Preserve similarly named Track A routes such as `/api/track-a-content`; they are separate and must not change.

### Healing

Remove:

- `requireHealingAccess`
- All `/api/healing/...` participant routes
- All `/api/admin/healing/...` module/content/template routes
- Healing completion and answer writes
- Healing module/content reads
- Healing certificate generation
- Healing background setting reads/writes
- Runtime `CREATE TABLE IF NOT EXISTS` blocks for Healing tables
- The 20-module Healing seed routine

The shared Track A certificate assets and Track A certificate route remain.

## Last-active-admin safeguard

The safeguard will be implemented server-side and applied consistently to:

- Generic `PATCH /api/users/:id` updates that set an active admin to inactive.
- Generic `PATCH /api/users/:id` updates that change an active admin to a non-admin role.
- `POST /api/admin/users/:id/deactivate`.
- Permanent `DELETE /api/users/:id`.

Before one of those operations removes active-admin status:

1. Load the target user.
2. If the target is not both `role = 'admin'` and `is_active = true`, continue normally.
3. Count active users whose role is `admin`.
4. If the target is the last active admin, reject the operation with a clear client-safe error.
5. Otherwise, allow the operation.

This is intentionally a small operational safeguard, not a new permissions or audit system. Reactivation and promotion remain allowed.

## Database plan

### Drop with the new forward migration

Drop child tables before parent tables:

1. `healing_answers`
2. `healing_completions`
3. `healing_content`
4. `healing_modules`
5. `daily_content`

### Delete retired configuration/data

- Delete `cohort_settings` row with key `healing_certificate_bg`.
- Delete any `track_requirements` rows for retired track identifiers B and C while preserving all A rows.
- Handle historical B/C `survey_responses` only according to the decision below.
- Handle Healing-linked `uploaded_images` only according to the decision below.

### Preflight checks immediately before migration

The implementation will query and report:

- Users currently assigned to B or C.
- Row counts for all five tables to be dropped.
- B/C rows in `track_requirements`.
- B/C rows in `survey_responses`.
- The Healing certificate-background setting.
- Candidate uploaded images referenced by Healing content.

If any user is still assigned to B or C, the destructive migration will stop rather than silently reassign or delete that user.

### Preserve

The following tables/columns are not retired-program tables and will remain:

- `users`, including `users.track`
- `track_a_content`
- `track_a_modules`
- `track_a_snapshots`
- `prelim_modules`
- `prelim_completions`
- `user_answers`
- `prayer_completions`
- `survey_responses`
- `chat_flow_responses`
- `practice_resources`
- `uploaded_images`
- `lesson_workbook_modules`
- `lesson_workbook_completions`
- `lesson_progress`
- guided-prayer and shared resource tables
- `track_requirements` itself, unless a later explicitly approved redesign removes it

`user_answers` and `prayer_completions` are shared by current Track A features. They must not be dropped or broadly cleared. Their rows do not carry a reliable historical program identifier, so preserving them is the only safe default for Track A.

## Explicit no-change / preserve list

These files were reviewed because names or text could look related, but they are not removal targets:

| File or area | Reason to preserve |
| --- | --- |
| `client/src/hooks/use-track-a-content.ts` | Current Track A content API hook. |
| `client/src/hooks/use-answers.ts` | Shared by current Track A lesson slides, Captivity Builder, Toolkit, dashboard, and mentor views. |
| `client/src/hooks/use-prayer-completions.ts` | Current Track A completion behavior. |
| `client/src/components/lesson/LessonFlow.tsx` | Current Track A lesson renderer. |
| `client/src/components/lesson/LessonSlide.tsx` | Current Track A slides and shared survey/answer behavior. |
| `client/src/components/lesson/CaptivityBuilderSlide.tsx` | Current Track A answer/toolkit feature. |
| `client/src/components/workbook/**` | Current Track A workbook; “healing” in curriculum language is not Track C code. |
| `client/src/pages/ProgramOverview.tsx` | Current Track A curriculum and a useful Track A-only access guard. Ordinary “healing” copy remains. |
| `client/src/pages/CaptivityBuilderResource.tsx` | Current Track A saved-answer resource. |
| `client/src/pages/PrayerToolkit.tsx` | Current Track A saved-answer resource. |
| `client/src/components/lesson/CrossGridSlide.tsx` | Current Track A curriculum. |
| `client/src/components/lesson/PotBandageScene.tsx` | Current Track A curriculum. |
| `client/src/components/lesson/OverviewGuideModal.tsx` | Current Track A curriculum. |
| `client/src/components/lesson/WeekTransitionCinematic.tsx` | Current Track A curriculum. |
| `client/src/pages/SmsOptin.tsx` | Ministry/legal wording, not Track C implementation. |
| `client/src/pages/SmsPrivacy.tsx` | Ministry/legal wording, not Track C implementation. |
| `client/src/pages/Sources.tsx` | Ministry/source wording, not Track C implementation. |
| `server/track-a-content-data.ts` | Current Track A seed/content source. |
| `server/email.ts` | Shared ministry email wording, not Track C implementation. |
| `server/assets/certificate/certificate-bg.png` | Used by the Track A certificate route. |
| `server/assets/certificate/custom-font.otf` | Used by the Track A certificate route. |
| `migrations/0000_init.sql` | Historical migration; do not rewrite. |
| `migrations/meta/0000_snapshot.json` through current historical snapshots | Historical migration metadata; do not rewrite. |
| `server/migrations/**` | Existing unrelated manual migrations; use only if the migration-path decision says this is the active deployment convention. |
| `artifacts/mockup-sandbox/**` | Separate design artifact with no production retired-track implementation. |

## Implementation order after approval

1. Resolve every item in **Needs a decision**.
2. Run read-only database preflight queries and confirm no B/C users.
3. Remove client routes, pages, components, hooks, and retired UI branches.
4. Remove server routes, middleware, runtime table creation, seed logic, backup/restore support, and retired storage methods.
5. Remove retired shared route contracts and schema definitions.
6. Add the last-active-admin guard.
7. Generate the forward migration through the confirmed migration workflow.
8. Review the generated SQL and ensure drop order and row cleanup are correct.
9. Update `replit.md` and `docs/admin-audit.md`.
10. Run the full verification checklist before applying the destructive migration to any non-development database.

## Verification checklist

### Static and build checks

- Run TypeScript type checking.
- Run the production build.
- Search the production codebase for:
  - Healing route/component/table identifiers
  - `dailyContent` / `daily_content`
  - Track B and Track C selectable values
  - B/C fallback labels
- Confirm remaining uses of the word “healing” are Track A curriculum, ministry language, or other approved shared copy.
- Confirm historical migration files are unchanged.

### Track A regression checks

- Participant login and Track A dashboard grid.
- Prelim completion gate.
- Day unlock/gating.
- Track A lesson flow and resume behavior.
- Workbook sheets, workbook completion, and exemptions.
- Prayer/answer saving, Toolkit, and resources.
- Surveys and admin survey results for Track A.
- Track A certificate.
- Mentor participant details and messaging.
- Admin Track A content editor, preview, snapshots, user management, progress, backup, and restore.

### Removed behavior checks

- Former Healing routes follow the approved deep-link behavior.
- No Track B or C options appear in admin user/content/survey controls.
- No Track B daily-content or Healing API route is registered.
- Server startup no longer creates or seeds retired tables.
- Backup payloads no longer contain `daily_content`.

### Last-admin checks

- The only active admin cannot be deactivated.
- The only active admin cannot be demoted.
- The only active admin cannot be permanently deleted.
- A non-admin can still be deactivated/deleted according to existing rules.
- When two active admins exist, one may be deactivated, demoted, or deleted.
- Reactivating or promoting an admin still works.

### Migration checks

- Test the migration against a disposable/development database first.
- Confirm all five retired tables are gone.
- Confirm Track A, prelim, answer, prayer, workbook, survey, resource, and snapshot tables and row counts are intact.
- Confirm B/C `track_requirements` rows and the Healing certificate setting are gone.
- Confirm the app starts cleanly after migration with no missing-table queries.

## Needs a decision

### 1. `users.track` application typing

The database column is nullable text, but application types currently hard-code A/B/C.

**Recommended:** keep the nullable text column and change application typing to `string | null`. Current forms and routes should accept only the currently supported value `A` or no assignment, while leaving the storage model open for a future named program model.

Alternative: narrow the application type to `"A" | null` now. This is stricter but would need another type migration when the next program is introduced.

### 2. Unused Track Requirements API and hook

The `track_requirements` table has Track A seed data, but the client API/hook currently has no callers.

**Recommended:** keep the table and Track A rows, but remove the unused client hook, shared API contract, server route, and storage method. A future program system can expose a purpose-built API when it is actually needed.

Alternative: retain the API/storage surface narrowed to Track A and change the hook type to `"A" | null`.

### 3. Historical B/C survey responses

The `survey_responses` table remains because Track A uses it.

**Recommended:** inspect counts first. If B/C rows exist, delete only rows whose `track` is B or C. If historical reporting is desired, preserve them even though the retired choices disappear from the UI.

### 4. Healing media in `uploaded_images`

Healing content may refer to images stored in the generic `uploaded_images` table. The schema does not label uploaded rows by program, and deleting by filename guess could remove shared or Track A media.

**Recommended:** before dropping Healing tables, resolve their referenced image URLs to exact uploaded-image rows. Delete only rows proven to be Healing-only and unreferenced elsewhere. If that proof cannot be made, preserve the uploaded rows.

### 5. Former Healing deep links

Choose the result for `/healing`, `/healing/journal`, and `/healing/module/:number`:

- **Recommended:** redirect authenticated users to `/dashboard`.
- Alternative: show the normal not-found page.

### 6. Migration execution path

The project has both Drizzle’s `migrations/` directory and a separate `server/migrations/` directory of manual migrations.

**Recommended:** confirm the deployment process, then create the removal migration only in the path that production actually runs. Prefer Drizzle’s generated `migrations/` flow if it is the active schema-deployment mechanism.

### 7. Legacy CSV importer

`scripts/import-content.ts` imports directly into the retired `daily_content` table. It is Track B tooling even though its “Spiritual Healing Ministry” text is not part of the dedicated Track C feature.

**Recommended:** delete the script with Track B. It cannot remain type-correct after the `dailyContent` schema export is removed.

Alternative: archive the source CSV/import logic outside the runnable TypeScript project before deletion if the ministry wants a historical content artifact.

## Approval gate

After the decisions above are answered and this plan is approved, implementation can begin. Until then, no retired files, routes, schema definitions, database rows, or tables should be deleted.