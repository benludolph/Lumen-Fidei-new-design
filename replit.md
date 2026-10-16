# Lumen Fidei

Lumen Fidei is a full-stack spiritual formation app with cohort-based lessons, progress tracking, mentor-participant messaging, and the Deliverance Workbook. User roles are `participant`, `mentor`, `admin`, and `superuser`.

## Commands

- **Development**: `npm run dev` — starts `server/index.ts` with tsx.
- **Typecheck**: `npm run check`.
- **Build**: `npm run build` — runs `script/build.ts` to build the client and server.
- **Production start**: `npm start` — runs `dist/index.cjs` after building.
- **Database schema push**: `npm run db:push` — changes the database; do not run as a routine verification step.

## Stack

- **Frontend**: React 18, TypeScript, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui, React Hook Form.
- **Backend**: Node.js, Express 5, TypeScript.
- **Database and validation**: PostgreSQL, Drizzle ORM, Zod.
- **Authentication**: Passport local strategy, express-session, bcryptjs.
- **Build tools**: Vite and esbuild.

## Project map

- `client/src/App.tsx` — client routing and protected-page setup.
- `client/src/pages/` — page components; `Admin.tsx` contains much of the admin interface.
- `client/src/components/lesson/` — lesson player and slide components.
- `client/src/components/TrackManagement.tsx` — admin track management.
- `client/src/components/workbook/` — participant workbook sections, sessions, and prayer rendering.
- `client/src/components/workbook-admin/` — workbook editor, content provider, and isolated previews.
- `client/src/hooks/` — client data and interaction hooks.
- `client/src/lib/queryClient.ts` — API request helpers and query client.
- `client/src/index.css` — shared styling and typography; font assets are in `client/public/fonts/`.
- `server/` — backend source; `index.ts` configures and starts Express.
- `server/routes.ts` — primary API routes and startup seeding.
- `server/auth.ts` — authentication and session setup.
- `server/storage.ts` — database storage operations.
- `server/db.ts` — PostgreSQL connection and Drizzle instance.
- `server/tracks.ts`, `server/track-context.ts`, `server/track-db.ts` — track APIs and request-scoped database access.
- `server/track-a-content-data.ts` — initial Track A lesson content.
- `server/content-data.ts` — practice/resource seed content, not a separate Track B lesson implementation.
- `server/workbook-content.ts` — workbook editorial APIs, including revision-checked draft, apply, and discard operations.
- `shared/schema.ts` — database tables, related validation schemas, and types.
- `shared/workbook-categories.ts` — workbook category mapping.
- `shared/workbook-content.ts`, `shared/workbook-content-defaults.json`, `shared/workbook-prayer-copy.ts` — editable workbook text catalog, initial content, protected structure, and personalized prayer wording.
- `drizzle.config.ts` — Drizzle configuration pointing to `shared/schema.ts`.
- `script/` — build, export, migration, and focused test scripts.
- `scripts/` — post-merge setup, schema SQL, and maintenance scripts.
- `migrations/` and `server/migrations/` — existing SQL migrations.
- `docs/` — feature notes and release instructions.
- `artifacts/mockup-sandbox/` — separate design-preview sandbox, not the main application.

## How the app fits together

- **Tracks** share the Track A lesson schema and editor/player mechanics. Admins can create new, initially empty draft tracks; do not assume separate Track B/C implementations. Some table, hook, and component names still contain `trackA`.
- **Scheduling** is handled in `server/routes.ts`, including `calendarDaysToProgramDay()`. The program skips Sundays; future lessons are gated, while past-day review and completion are supported. Admin/superuser access and day overrides affect gating.
- **Lessons** store slides as JSON. A quiz slide can expand into multiple question/result steps at runtime.
- **Messaging** uses HTTP requests and query polling (`client/src/hooks/use-chat.ts`), not a WebSocket chat transport.
- **Workbook wording** is global across tracks. Saved drafts are separate from applied participant content. Preview uses synthetic answers; text editing must preserve field keys, stored option values, prayer insertions, and unlock rules. See `docs/workbook-content-editing.md`.
- **Media** includes database-backed uploads and static project assets. Upload limits and serving handlers are defined in `server/routes.ts`; do not assume all media has the same limit or storage path.
- **Configuration** is read from environment variables, not an assumed checked-in `.env` file. Core settings include `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Keep secret values out of code and documentation.

## Working constraints and checks

- **Never bold IvyOra.** Preserve the installed font's natural appearance, including inherited heading/emphasis styles; other fonts may still use bold.
- **Workbook release** requires explicit owner approval. Do not publish workbook revisions incidentally with unrelated fixes; consult `docs/workbook-combined-release-approval.md`.
- **Database changes** need scoped review. Read `scripts/post-merge.sh` and the relevant migration before running setup; do not treat schema reconciliation as permission to delete records.
- **Verification**: use `npm run check` for TypeScript. Focused scripts include `npx tsx script/test-track-isolation.ts`, `npx tsx script/test-workbook-content.ts`, and `npx tsx script/test-workbook-discard.ts`. Review scripts before running database-dependent checks.
- Use simple, everyday language when reporting work.
