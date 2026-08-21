# Admin Area Audit

**Audit date:** August 21, 2026  
**Scope:** Full admin experience, supporting server/storage paths, and comparison with participant and mentor experiences  
**Method:** Read-only code inspection plus an authenticated, read-only walkthrough at desktop and mobile widths  

## Executive verdict

The admin area is broad and functional, but it is not yet an admin-grade control plane.

It can manage people, cohorts, content, progress, messages, surveys, testimonies, backups, and migrations from one place. That breadth is a real strength. The weakness is that the surface has grown faster than its operational safeguards and information architecture. High-impact actions are mixed with routine settings, progress means different things across tracks, destructive operations are unevenly protected, backup coverage is incomplete, and the entire experience is concentrated in one 10,000-line page.

The participant experience is substantially more coherent because it has one primary job: consume the assigned program and record progress. The mentor experience is also correctly narrower: supervise assigned participants, review their progress/reflections, and message them. The admin experience should not simply combine those two roles. It needs a distinct operational model built around:

1. Safe people and cohort lifecycle management
2. Accurate program-wide status and exception handling
3. Draft, preview, publish, and recovery workflows for content
4. Audited handling of sensitive participant data
5. Guardrails for destructive and database-wide actions

### Bottom line

- **Product capability:** Strong breadth
- **Day-to-day usability:** Adequate for a small roster, increasingly cumbersome as data and content grow
- **Data integrity and recovery:** Material gaps
- **Role coherence:** Fragmented
- **Scalability:** Not ready for a substantially larger roster or longer operating history
- **Accessibility:** Inconsistent
- **Recommended posture:** Stabilize safety and data correctness before investing in visual polish

## What is working

- Admin-only routing and server-side role checks exist for most privileged operations.
- People management covers the core lifecycle: creation, role/track assignment, mentor assignment, activation, password reset, progress overrides, and deletion.
- Track A has the beginning of a safer content workflow through snapshots, variants, and a participant-style preview route.
- Mentor access is intentionally scoped to assigned participants rather than the entire roster.
- Participant content uses focused, purpose-built experiences rather than exposing administrative complexity.
- Restore is executed inside a database transaction; a failed restore is designed to roll back.
- The backup UI explicitly warns that uploaded media is excluded. The problem is not that this limitation is hidden; the problem is that the resulting file cannot serve as a complete disaster-recovery backup.
- The live walkthrough found every top-level admin section reachable at both desktop and mobile widths.

## Role comparison

| Concern | Participant | Mentor | Admin | Assessment |
|---|---|---|---|---|
| Primary job | Complete assigned program | Supervise assigned participants | Operate the whole program | Correct separation in principle |
| Navigation | Focused journey/support navigation | Mentee/program navigation | Legacy admin shell plus access to mentor routes | Admin navigation is the least coherent |
| Progress | Personal, track-specific | Per-assigned-participant | Program-wide table | Admin and mentor definitions do not cover Healing correctly |
| Content | Consume unlocked content | Preview Track A | Edit Tracks A, B, and Healing | Preview capability does not match edit capability |
| Messages | Personal inbox | Assigned-participant communication | Manually selected conversation lookup/deletion | Admin lacks a real triage/moderation workflow |
| Sensitive reflections | Own responses | Assigned mentee responses | Broad roster access and exports | Privilege is expected, but access is not audited |
| Destructive actions | Minimal | Minimal | User, conversation, content, cohort, and restore actions | Safeguards are not proportional to impact |

## Severity model

- **Critical:** Plausible broad or irreversible data loss, privilege compromise, or serious confidentiality breach
- **High:** Incorrect program operation, misleading staff decisions, unsafe lifecycle actions, or incomplete recovery
- **Medium:** Material workflow friction, role incoherence, scale risk, or maintainability risk
- **Low:** Localized usability, accessibility, or polish issue

No unauthenticated critical vulnerability was identified in this read-only audit. The highest risks are authenticated administrative actions with insufficient data-integrity, recovery, and accountability controls.

---

## Findings

## High severity

### H1. User deletion is neither transactional nor complete for all user-owned records

**Evidence**

- The route manually deletes several record types and then deletes the user: `server/routes.ts:1389-1400`.
- The storage operation performs sequential deletes without a transaction: `server/storage.ts:267-278`.
- Several earlier user-owned tables do not declare database foreign keys with cascade behavior, including preliminary completions, survey responses, and chat-flow responses: `shared/schema.ts:127-184`.
- Newer tables such as Healing completions, guided-prayer responses, workbook data, profile data, and lesson progress do use cascading foreign keys: `shared/schema.ts:260-303`, `shared/schema.ts:313-399`, and `shared/schema.ts:478-506`.

**Impact**

The current operation can fail partway through and leave a partially deleted account. It can also leave orphaned records in tables not covered by either the manual delete sequence or a cascading foreign key. That is both a data-integrity problem and a privacy/retention problem because an administrator is told that all related data has been removed.

**Required direction**

- Define one explicit deletion policy for every user-owned table.
- Add missing foreign keys where appropriate.
- Execute deletion in one transaction.
- Prefer reversible deactivation/anonymization for normal operations.
- Reserve permanent deletion for a separately authorized, audited workflow.
- Return and record a per-table deletion summary rather than making an unverified blanket claim.

### H2. Administrative user updates expose a generic, over-broad mutation surface

**Evidence**

- `PATCH /api/users/:id` accepts `insertUserSchema.partial()` and passes the result to generic storage: `server/routes.ts:470-483`.
- The storage layer applies the supplied partial object directly to the user row: `server/storage.ts:259-264`.
- The underlying insert schema includes identity, password, role, account state, track, cohort, progress override, variant, and exemption fields: `shared/schema.ts:22-37` and `shared/schema.ts:512-515`.
- The UI exposes role changes, password reset, activation, track/cohort-affecting settings, mentor assignment, manual day override, and workbook exemption from the same user row: `client/src/pages/Admin.tsx:267-628`.

**Impact**

The server does not encode a policy difference between ordinary profile edits and security-sensitive actions. A compromised or mistaken admin session can change another account's role, credentials, and operating state through a broad update mechanism. There is no visible protection against self-demotion/self-lockout, no forced reason, and no audit record.

**Required direction**

- Replace the generic route with narrow commands such as `change-role`, `assign-track`, `deactivate`, and `set-day-override`.
- Never accept password through the generic user schema.
- Require reauthentication for role changes, password replacement, and permanent deletion.
- Prevent the last active admin from being demoted or deactivated.
- Record actor, target, before/after values, timestamp, and reason for every privileged change.

### H3. The progress dashboard reports a 30-day prayer model for tracks that do not use that model

**Evidence**

- Admin progress loads users and prayer completions, then calculates days completed and today's morning/evening state in application memory: `server/routes.ts:1429-1513`.
- Healing has its own module-based completion and answer tables: `shared/schema.ts:239-277`.
- Participants assigned to Track C are redirected to the Healing experience rather than the 30-day dashboard: `client/src/pages/Dashboard.tsx:283-310`.
- The admin table still presents a universal 30-day model: `client/src/pages/Admin.tsx:989-1220`.
- The mentor portal and mentee detail views also derive progress from 30-day/prayer concepts: `client/src/pages/MentorPortal.tsx:18-30`, `client/src/pages/MentorPortal.tsx:111-123`, and `client/src/pages/MenteeDetails.tsx:142-158`.

**Impact**

Healing participants can appear to have zero or stale progress even when they are completing modules. Staff can make incorrect outreach, compliance, or graduation decisions from the dashboard. The same conceptual error leaks into mentor supervision.

This is not only a missing column. It is a domain-definition problem: Track A, Track B, and Healing do not share one completion unit.

**Required direction**

- Define a canonical progress contract per track.
- Return track-specific units and labels from one server-side progress service.
- Use prayer completion only where prayer completion is the actual completion rule.
- Use Healing module completion for Track C.
- Make admin, mentor, and participant summaries consume the same definitions.
- Add explicit states for not started, in progress, completed, exempt, and blocked.

### H4. Cohort lifecycle actions can clear data without an atomic transition

**Evidence**

- Cohort start-date updates only verify that the value is a string: `server/routes.ts:1543-1555`.
- New-cohort creation passes the input to `new Date(...)` without first rejecting an invalid date: `server/routes.ts:1632-1665`.
- Starting a cohort can clear all prayer completions and then archive/create cohort records without wrapping the full sequence in one transaction: `server/routes.ts:1632-1665`.
- Cohort creation, start-date changes, completion clearing, backup/restore, timer migration, and bulk timer updates are presented together in Settings: `client/src/pages/Admin.tsx:1223-1863`.

**Impact**

A failure after completion deletion but before cohort creation can leave the program in an inconsistent state. Clearing global prayer completions is also a larger operation than the cohort-oriented language suggests. Weak date validation can create invalid or unexpected schedule state.

**Required direction**

- Validate ISO date values and business constraints before mutation.
- Execute archive, create, assignment, and any reset in one transaction.
- Scope resets to the intended cohort and completion domain.
- Produce a dry-run summary before execution.
- Require a typed confirmation showing exact participant and record counts.
- Move this workflow into a dedicated Cohort Operations area rather than routine settings.

### H5. Backup and restore do not constitute full disaster recovery

**Evidence**

- Backup exports a limited set of content/configuration tables: `server/routes.ts:2285-2342`.
- Restore replaces those tables inside a transaction: `server/routes.ts:2344-2413`.
- The contract includes only prelim modules, Track A content/modules, daily content, overlays, resources, cohort settings, and an optional uploaded-images field: `shared/routes.ts:408-450`.
- Healing content, testimonies, Track A snapshots/variants, workbook modules, wrap prayers, users, messages, participant responses, and progress data are not part of this file.
- Backup reads its tables in parallel outside a database-consistent snapshot: `server/routes.ts:2285-2342`.
- The UI warns that uploaded files are excluded: `client/src/pages/Admin.tsx:1622-1799`.

**Impact**

The current feature is a partial content/configuration export, not a complete backup. Restoring it can reproduce only part of the application state, and the exported tables may not all represent the exact same point in time. Calling it a general backup creates false confidence during an incident.

**Required direction**

- Rename the existing feature to accurately describe its scope, such as **Content configuration export**.
- Define separate recovery products:
  - content versioning and rollback,
  - participant-data export/retention,
  - full database disaster recovery,
  - media/object recovery.
- If the JSON restore remains, version every included table schema and reject unknown/incompatible shapes rather than relying on broad passthrough records.
- Generate the export from a consistent database snapshot.
- Show included and excluded domains before download and restore.

### H6. Destructive actions are not protected consistently or proportionally

**Evidence**

- Permanent user deletion is available from each user row with a normal confirmation flow: `client/src/pages/Admin.tsx:267-628`.
- An entire conversation can be deleted permanently: `client/src/pages/Admin.tsx:8461-8673` and `server/routes.ts:2428-2435`.
- Testimony parts and entire testimonies can be deleted directly from icon buttons without a confirmation step: `client/src/pages/Admin.tsx:9911-9926` and `client/src/pages/Admin.tsx:9971-10015`.
- Healing module deletion uses a native `confirm(...)` prompt: `client/src/pages/Admin.tsx:10370-10379`.
- Track A has snapshots, but equivalent rollback/versioning was not found for Track B, Healing, testimonies, or message deletion: `server/routes.ts:2148-2269`.
- No administrative audit-log model or write path was found for these actions.

**Impact**

Safeguards depend on which part of the page implemented the action rather than the action's blast radius. Some content can be destroyed by a single icon click. There is no reliable answer to who changed or deleted something, when it happened, or what the previous value was.

**Required direction**

- Introduce one reusable privileged-action pattern.
- Require confirmation with affected item names and counts.
- Require typed confirmation and reauthentication for irreversible data deletion.
- Prefer soft delete or versioned rollback for content.
- Add an append-only admin audit log.
- Separate ordinary editing from a clearly labeled Danger Zone.

### H7. Sensitive participant data is broadly accessible and exportable without accountability controls

**Evidence**

- Admin user details expose participant identity, daily answers, and completion history: `client/src/pages/Admin.tsx:631-882`.
- Answer and user CSV exports are exposed as admin operations: `client/src/pages/Admin.tsx:2198-2264` and `server/routes.ts:1815-1939`.
- Mentors see only assigned participants through the mentor API and UI: `client/src/pages/MentorPortal.tsx:44-128` and `client/src/pages/MenteeDetails.tsx:138-338`.
- No access log, export log, export reason, or data-retention control was found for administrative viewing/export.

**Impact**

Admin-wide access may be necessary, but these are personal reflections and program records, not ordinary catalog data. Without accountability controls, the application cannot demonstrate who accessed or exported sensitive participant information.

**Required direction**

- Log sensitive record views and exports.
- Require a purpose/reason for broad exports.
- Minimize exported fields by default and separate identity from reflection content where possible.
- Add explicit retention and deletion rules.
- Preserve the mentor rule that only assigned participants are visible.

## Medium severity

### M1. The admin area is a 10,000-line monolith with state-only navigation

**Evidence**

- `client/src/pages/Admin.tsx:55-10647` contains people, progress, content, cohort operations, settings, backup/restore, messages, surveys, testimonies, migrations, and multiple content editors.
- Top-level tabs are local component state rather than URL-addressable routes: `client/src/pages/Admin.tsx:72-229`.
- Track A, Track B, and Healing selection is also local state: `client/src/pages/Admin.tsx:233-264`.

**Impact**

Admins cannot bookmark or share a precise destination, browser back/forward behavior is weak, and a refresh loses the working context. The file has become a high-conflict change surface where unrelated features can regress one another.

**Required direction**

- Split the admin area into routed sections:
  - `/admin/people`
  - `/admin/progress`
  - `/admin/content/:track`
  - `/admin/messages`
  - `/admin/surveys`
  - `/admin/cohorts`
  - `/admin/operations`
- Keep filters, selected cohort, selected content item, and edit mode in the URL where useful.
- Move each domain's data access and mutations into focused modules.

### M2. Navigation and layout behavior are inconsistent across roles

**Evidence**

- Admin uses the legacy `Shell`/`Sidebar`, while participant and mentor pages use `DashboardLayout`: `client/src/pages/Admin.tsx:72-229`, `client/src/components/layout/Shell.tsx`, and `client/src/components/layout/DashboardLayout.tsx`.
- The legacy sidebar gives admins Mentorship and Admin Portal links but hides the normal support section: `client/src/components/layout/Sidebar.tsx:55-113`.
- Admins are allowed into mentor routes: `client/src/App.tsx:43-106`.
- `DashboardLayout` distinguishes mentor from non-mentor behavior, so an admin entering mentor surfaces does not receive a coherent admin navigation model: `client/src/components/layout/DashboardLayout.tsx`.
- In the live walkthrough, `/mentor` showed an empty assigned-mentees state for the admin account, and `/dashboard` rendered blank in that admin session.

**Impact**

Role switching is implicit and confusing. An administrator can enter a mentor screen while still being an administrator, but the screen behaves like an unassigned mentor and the surrounding navigation changes.

**Required direction**

- Use one modern shell and shared visual system.
- Keep role-specific information architecture.
- If admins need mentor-context access, provide an explicit **View mentor experience** or **View as mentor** mode with a clear banner and exit action.
- Do not treat admin as a participant fallback in shared layout branching.

### M3. Content editing capability exceeds preview and release-safety capability

**Evidence**

- Admins can edit Track A, Track B, and Healing content: `client/src/pages/Admin.tsx:2282-8448` and `client/src/pages/Admin.tsx:10110-10647`.
- Only Track A has a participant-style preview route: `client/src/App.tsx:70-75`.
- Track A admin preview links to that route: `client/src/pages/Admin.tsx:7816`.
- Mentor program preview also covers Track A only: `client/src/pages/MentorProgram.tsx:8-52`.
- The Healing editor can reorder, create, edit, and delete modules, but no equivalent full participant preview route was identified: `client/src/pages/Admin.tsx:10110-10647`.
- The Track A read-only panel summarizes many complex slides as text rather than rendering the actual interaction: `client/src/pages/Admin.tsx:8395-8442`.

**Impact**

Admins can publish changes they cannot validate in the actual participant experience. Interactive slides, gating behavior, media, responsive layout, and accessibility can differ substantially from a text summary.

**Required direction**

- Use the same rendering primitives for participant delivery and admin preview.
- Add full preview for Track B and Healing.
- Support participant state simulation: track, cohort day, workbook exemption, content variant, completed prerequisites, and mobile width.
- Add draft/publish status and version rollback for every editable content domain.

### M4. Admin messaging is a conversation deletion utility, not an operational inbox

**Evidence**

- The admin must select two users before any conversation is shown: `client/src/pages/Admin.tsx:8461-8673`.
- The API exposes only fetch-between-two-users and delete-between-two-users operations: `server/routes.ts:2416-2436`.
- The participant/mentor messaging experience has conversation-level unread state and a contact list, but those capabilities are not used by the admin management screen: `client/src/pages/Messages.tsx`.

**Impact**

An admin cannot see which conversations need attention, search across conversations, review unread or flagged threads, or understand why a conversation should be inspected. The screen optimizes for deletion rather than support or moderation.

**Required direction**

- Clarify the product purpose: support inbox, safeguarding review, moderation, or data administration.
- Add a conversation index with search, unread/flagged state, participants, last activity, and assignment.
- Keep permanent deletion out of the primary workflow.
- Add retention and audit context.

### M5. Survey reporting is incomplete and moves aggregation work to the browser

**Evidence**

- Survey results are fetched as response rows and aggregated in the UI: `client/src/pages/Admin.tsx:8834-8924`.
- Filters only represent Tracks A and B; Healing is absent: `client/src/pages/Admin.tsx:8834-8924`.
- The schema comment and data model describe survey tracks as A or B: `shared/schema.ts:161-172`.
- Chart styling hard-codes a green utility color rather than using the broader design tokens: `client/src/pages/Admin.tsx:8834-8924`.

**Impact**

The page will become slower as response history grows, and the report does not represent the full program. The lack of respondent context for free text may be a valid privacy choice, but it is not presented as an explicit anonymity policy.

**Required direction**

- Aggregate counts server-side with cohort, date, track, day/module, and question filters.
- Define whether text responses are anonymous, pseudonymous, or identifiable.
- Include Healing where surveys are supported, or explicitly state that they are not.
- Use shared chart and theme tokens.

### M6. List and reporting implementations will degrade with roster and history growth

**Evidence**

- The People table renders the full returned roster with no pagination or virtualization: `client/src/pages/Admin.tsx:55-229`.
- Every `UserRow` creates an observer for the same content-variant query: `client/src/pages/Admin.tsx:375-378`.
- Admin progress loads all users and all prayer completions and performs filtering/aggregation in application memory: `server/routes.ts:1429-1513`.
- Progress returns identity and status for the whole selected cohort without pagination: `shared/routes.ts:269-287`.
- Survey aggregation is performed in the browser: `client/src/pages/Admin.tsx:8834-8924`.

**Impact**

The current design is acceptable for a small program but creates unnecessary browser work, server memory use, and response size as cohorts and history accumulate.

**Required direction**

- Add server-side pagination, sorting, and filtering.
- Compute progress and survey aggregates in SQL.
- Fetch shared reference data once at the parent level.
- Add indexes aligned with cohort, user, completion, and submitted-at queries.
- Define performance budgets for 100, 1,000, and 10,000 participants.

### M7. Shared API contracts cover only part of the privileged surface

**Evidence**

- `shared/routes.ts:229-452` defines contracts for a subset of admin operations.
- Many high-impact routes—content variants, snapshots, message deletion, Healing CRUD, testimony CRUD, migration tools, and bulk updates—are declared directly in `server/routes.ts`.
- Client code mixes shared API helpers, raw `fetch`, and literal endpoint strings throughout `client/src/pages/Admin.tsx`.

**Impact**

Validation, response types, error behavior, and permission expectations can drift between client and server. This is especially risky in the control plane, where endpoint mistakes have a larger blast radius.

**Required direction**

- Define all admin commands and responses in one shared contract layer.
- Use consistent validation and error envelopes.
- Generate or centralize typed client calls.
- Add authorization and contract tests for every privileged route.

### M8. The `admin` and `superuser` roles have inconsistent capabilities

**Evidence**

- `superuser` is a first-class stored role: `shared/schema.ts:22-37`.
- Participant dashboard code accepts `superuser` as a participant-like role: `client/src/pages/Dashboard.tsx:283-290`.
- Admin routing and most admin APIs require literal `admin`: `client/src/App.tsx:43-106` and numerous `requireRole('admin')` routes in `server/routes.ts`.
- Some read endpoints explicitly permit both `admin` and `superuser`, while adjacent write endpoints permit only `admin`, for example wrap-prayer access: `server/routes.ts:654-669`.

**Impact**

The role name implies elevated access, but actual capabilities vary by route. Future developers cannot safely infer what the role means, and authorization regressions are likely.

**Required direction**

- Decide whether `superuser` is a test persona, participant override, or privileged operator.
- Express capabilities as named permissions rather than scattered role-string checks.
- Add a role/permission matrix and automated endpoint tests.

### M9. Operational tools are mixed with routine settings

**Evidence**

- Cohort configuration, completion clearing, backup/restore, bulk timer changes, and a timer-to-scripture migration are all rendered in the Settings area: `client/src/pages/Admin.tsx:1223-1863`.
- Migration and bulk-update endpoints operate across stored content: `server/routes.ts:3249-3375`.

**Impact**

Routine settings users are placed next to database-wide tools. The visual hierarchy does not communicate the difference between configuration, maintenance, migration, and recovery.

**Required direction**

- Separate **Program Settings**, **Cohort Operations**, **Content Maintenance**, and **Recovery**.
- Hide one-time migrations after they are completed or move them to a controlled maintenance interface.
- Require dry runs and show affected counts for bulk changes.

## Low severity

### L1. Tab and status interactions have accessibility gaps

**Evidence**

- The Track A/Track B/Healing selector uses custom buttons without tablist/tab semantics or `aria-selected`: `client/src/pages/Admin.tsx:233-264`.
- The progress table relies heavily on compact icons and color to communicate today's status: `client/src/pages/Admin.tsx:989-1220`.
- The wide progress table does not have a clearly defined responsive table strategy in its immediate container: `client/src/pages/Admin.tsx:989-1220`.
- The mobile walkthrough showed the top-level tab strip wrapping into several rows, adding substantial vertical overhead.

**Impact**

Keyboard and assistive-technology users receive weaker state information. Dense data becomes harder to scan on narrow screens.

**Required direction**

- Use semantic tabs with keyboard navigation.
- Pair every status color/icon with readable text.
- Add a mobile card/list treatment or an intentional horizontal-scroll region with pinned identity columns.
- Keep tap targets at least 44px where possible.

### L2. Some protected pages fail silently instead of rendering explicit states

**Evidence**

- `Admin()` returns `null` when the current user is not an admin: `client/src/pages/Admin.tsx:70-71`.
- `MentorPortal()` returns `null` for unsupported roles: `client/src/pages/MentorPortal.tsx:44-51`.
- Participant dashboard code can also return `null` during role redirects: `client/src/pages/Dashboard.tsx:283-290`.
- The live admin-session walkthrough observed a blank `/dashboard`.

**Impact**

Route, session, or role mistakes appear as blank screens rather than actionable denied, redirecting, or loading states.

**Required direction**

- Centralize route guards.
- Render explicit loading, redirecting, forbidden, and not-found states.
- Test every role against every protected route.

### L3. The Settings view currently emits invalid DOM nesting

**Evidence**

- The authenticated Settings walkthrough produced React's `validateDOMNesting` warning: a `<div>` was rendered as a descendant of `<p>`.
- The warning was observed while rendering Settings content in `client/src/pages/Admin.tsx:1223-1863`, where card descriptions and richer child markup are combined.

**Impact**

The visible page still renders, but invalid structure can produce inconsistent screen-reader behavior and future hydration/rendering issues.

**Required direction**

- Replace paragraph-based description wrappers when they contain block elements.
- Add a console-clean UI test for all top-level admin tabs.

---

## Target role and product model

### Share across participant, mentor, and admin

These should be shared because they represent the same concepts, not because every role should see the same navigation:

- Design tokens, typography, responsive shell primitives, buttons, forms, tables, empty states, and error states
- The actual lesson/slide rendering components
- Track-aware progress definitions and server-side progress calculations
- Message thread rendering
- Content media handling
- Preview rendering and responsive simulation
- Authentication, route-guard, and permission primitives

### Keep mentor-only

- Assigned-mentee roster
- Assigned participant progress and reflections
- Unread messages from assigned participants
- Contextual outreach and follow-up
- Program preview needed to support assigned participants

Mentors should not gain general user lifecycle, cohort, export, restore, or program-wide content powers.

### Keep admin-only

- User and role lifecycle management
- Cohort creation, transition, archive, and reset
- Program-wide reporting
- Content authoring, draft/publish, versioning, and rollback
- Broad export and retention operations
- Backup/recovery controls
- Moderation or safeguarding access
- Bulk and destructive operations
- Audit history

Admin access to a mentor experience should be an explicit supervised/view-as mode, not an accidental consequence of route permissions.

---

## Sequenced remediation plan

## Phase 0 — Define the operating contract

**Goal:** Stop adding more behavior to ambiguous roles and metrics.

1. Write a capability matrix for participant, mentor, admin, and superuser.
2. Define completion/progress semantics for Track A, Track B, and Healing.
3. Classify data by sensitivity and define view/export/retention rules.
4. Classify every admin mutation as routine, privileged, destructive, bulk, migration, or recovery.
5. Rename the current backup feature to match its actual scope.

**Exit criteria**

- Every privileged endpoint maps to an explicit capability.
- Every dashboard metric has a documented source and track-specific meaning.
- Every destructive action has an assigned safeguard level.

## Phase 1 — Protect data and privileged actions

**Goal:** Remove the highest data-integrity and accountability risks.

1. Replace generic user updates with narrow commands.
2. Make permanent user deletion complete and transactional.
3. Add missing foreign keys/cascades or explicit deletion handlers.
4. Add an append-only admin audit log.
5. Add reauthentication, typed confirmation, reasons, and affected-count previews to high-impact actions.
6. Add soft delete/version history where recovery is possible.
7. Remove or isolate one-time migration controls from everyday Settings.

**Exit criteria**

- No privileged mutation writes through a generic partial-user object.
- User deletion either completes fully or changes nothing.
- Every sensitive/destructive operation records actor, target, time, reason, and outcome.
- Testimony/content deletion cannot occur from one unconfirmed icon click.

## Phase 2 — Correct progress and cohort operations

**Goal:** Make staff decisions trustworthy.

1. Build a server-side, track-aware progress service.
2. Use it for admin progress, mentor cards, mentee detail, and participant summaries.
3. Add Healing module progress and track-appropriate labels.
4. Validate cohort dates and transition rules.
5. Make cohort transitions atomic and cohort-scoped.
6. Add dry runs and impact summaries for resets.

**Exit criteria**

- The same participant has consistent progress in participant, mentor, and admin views.
- Healing progress is based on Healing modules.
- A failed cohort transition cannot partially clear or change state.

## Phase 3 — Restructure the admin information architecture

**Goal:** Turn the admin page into an operable product rather than a feature container.

1. Introduce URL-addressable admin sections.
2. Split People, Progress, Content, Messages, Surveys, Cohorts, and Operations into focused modules.
3. Adopt the modern shared shell while preserving admin-specific navigation.
4. Add explicit loading, forbidden, empty, and error states.
5. Preserve filters and selected records in URLs.

**Exit criteria**

- Admins can bookmark and share exact destinations.
- Browser back/forward works predictably.
- No single admin page owns unrelated operational domains.
- Admin, mentor, and participant routes have deterministic role behavior.

## Phase 4 — Complete content operations

**Goal:** Let admins validate and recover every change they can publish.

1. Reuse participant renderers for all admin previews.
2. Add full preview for Track B and Healing.
3. Add draft/publish state for all editable content.
4. Add version history and rollback for Track B, Healing, testimonies, overlays, and shared resources.
5. Add preview personas for track, day, prerequisites, exemption, variant, and viewport.
6. Turn the current partial backup into a clearly scoped export and define a separate disaster-recovery process.

**Exit criteria**

- Every publishable item can be previewed in its real participant renderer.
- Every published content change has an author, timestamp, version, and rollback path.
- Recovery documentation accurately states what can and cannot be restored.

## Phase 5 — Scale, reporting, and accessibility

**Goal:** Make the control plane durable as use grows.

1. Add server-side pagination, filtering, and sorting to People and Progress.
2. Aggregate progress and survey results in SQL.
3. Add a real admin conversation index if admin messaging is required.
4. Add cohort/date/track survey filters and an explicit anonymity policy.
5. Implement semantic tabs, non-color status labels, responsive data views, and console-clean rendering.
6. Add role-by-route end-to-end tests and authorization tests for every admin API.
7. Establish roster-size performance tests and export limits.

**Exit criteria**

- Core admin screens remain responsive at the expected multi-year roster size.
- All top-level admin routes pass keyboard, screen-reader structure, and mobile checks.
- No protected route renders a blank page for an unsupported role.

---

## Recommended priority order

1. **Transactional, complete user deletion**
2. **Narrow and audited privileged user commands**
3. **Track-aware progress, especially Healing**
4. **Atomic cohort transitions and reset safeguards**
5. **Honest backup/recovery boundaries**
6. **Consistent protection and rollback for destructive content/data actions**
7. **Admin routing and codebase decomposition**
8. **Full Track B/Healing preview and release workflow**
9. **Pagination/server-side aggregation**
10. **Messaging, survey, and accessibility improvements**

Visual redesign should follow—not precede—the safety, progress, and operational-model work. A more polished version of the current structure would still have the same data and role risks.