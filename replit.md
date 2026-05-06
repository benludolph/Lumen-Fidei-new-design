# Lumen Fidei

Lumen Fidei is a full-stack web application for a 30-day spiritual program, offering time-gated content, progress tracking, and mentor-participant messaging across three user roles: Participant, Mentor, and Admin.

## Run & Operate

- **Run Dev**: `npm run dev`
- **Build**: `npm run build`
- **Typecheck**: `npm run typecheck`
- **Codegen**: `drizzle-kit generate`
- **DB Push**: `drizzle-kit push`
- **Env Vars**: `DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

## Stack

- **Frontend**: React 18, TypeScript, Wouter, TanStack React Query, Tailwind CSS, shadcn/ui (New York style), React Hook Form, Zod
- **Backend**: Node.js (ES modules), Express 5, TypeScript
- **Authentication**: Passport.js (local strategy), express-session, bcryptjs
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Build Tool**: Vite, esbuild

## Where things live

- **Frontend Source**: `client/src/`
- **Backend Source**: `server/src/`
- **Database Schema**: `server/src/db/schema.ts`
- **API Routes**: `server/src/routes.ts`
- **Environment Variables**: `.env`
- **Main CSS/Theming**: `client/src/index.css`
- **Font Files**: `client/public/fonts/`
- **Track A Seed Data**: `server/track-a-content-data.ts`
- **Track B Seed Data**: `server/content-data.ts`
- **Lesson Flow Components**: `client/src/components/lesson/`

## Architecture decisions

- **Time-Gating Logic**: Uses `calendarDaysToProgramDay()` utility in `server/routes.ts` for cohort-based content release, allowing past day review but blocking future content.
- **Image/Audio Storage**: All user-uploaded images and audio are stored as base64 in the `uploaded_images` database table for persistence and served via a unified `GET /api/images/:filename` endpoint.
- **Dashboard Layouts**: Implements distinct "Grid" (gothic cathedral aesthetic) and "Detail/Lesson Flow" (clean, white background) modes to separate content browsing from consumption.
- **Track A Lesson Flow**: Designed as a Duolingo-style stepped lesson with a state machine, supporting various interactive slide types and dynamic quiz expansion at runtime.
- **Dynamic Content Styling**: Uses CSS variables (`--surface-ground`, `--surface-base`, etc.) for theming, ensuring consistent design across the application.

## Product

- **User Roles**: Participant, Mentor, Admin with specific capabilities.
- **Content Delivery**: 30 days of time-gated spiritual content, supporting two distinct program tracks (A and B).
- **Progress Tracking**: Users mark daily completions, visualized in an admin dashboard with completion rates and graduation status.
- **Real-time Messaging**: Secure, role-based chat between mentors and participants with unread notifications.
- **Admin Management**: Comprehensive tools for user, content, cohort, and message management, including a visual slide editor for Track A content.
- **Mobile Responsiveness**: Fully optimized for mobile devices.

## User preferences

Preferred communication style: Simple, everyday language.

## Gotchas

- **Image/Audio Uploads**: Maximum file sizes are enforced (5MB for images, 15MB for audio).
- **Sunday Banners**: Sundays are visual breaks in the dashboard grid; they are not program days and have no associated content or completion tracking.
- **Track A Quiz Slides**: A single quiz slide in the database (`slides` JSON) expands into multiple question slides and a result slide at runtime.
- **Past Day Completion**: Participants can complete missed past days, but future days remain locked until their scheduled unlock date.

## Pointers

- **shadcn/ui Docs**: `https://ui.shadcn.com/docs`
- **Drizzle ORM Docs**: `https://orm.drizzle.team/docs/overview`
- **React Hook Form Docs**: `https://react-hook-form.com/get-started`
- **Tailwind CSS Docs**: `https://tailwindcss.com/docs`
- **Passport.js Docs**: `http://www.passportjs.org/docs/`
- **Zod Docs**: `https://zod.dev/`