# Lumen Fidei - 30-Day Spiritual Program

## Overview

Lumen Fidei is a full-stack web application designed for a 30-day spiritual program. It supports three user roles: Participants, Mentors, and Admins. The platform delivers time-gated daily spiritual content, tracks user progress through specific requirements (A, B, C), facilitates real-time messaging between mentors and participants, and provides a comprehensive system for spiritual growth and community building. The project aims to offer a serene and professional spiritual experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS with shadcn/ui (New York style)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Framework**: Express 5 on Node.js
- **Language**: TypeScript (ES modules)
- **Authentication**: Passport.js with local strategy and express-session
- **Security**: bcryptjs for password hashing, rate limiting, role-based access control, and data isolation.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Key Tables**: `users`, `dailyContent`, `trackAContent`, `trackAModules`, `userAnswers`, `messages`, `trackRequirements`, `prayerCompletions`, `practiceResources`.
- **Track System**: Two distinct program tracks:
  - **Track A**: Single daily activity per day. Content stored in `trackAContent` table with columns: `id`, `dayNumber`, `weekNumber`, `centralTheme`, `slides` (JSON array of `{type, content}` objects). The `slides` column is a jsonb array where each element has a `type` (one of 7 types: text, multi_select, single_select, media, text_input, action, quiz) and `content` (string; for quiz type, content is a JSON string with `questions` array and `results` mapping). At runtime, LessonFlow expands each quiz slide into N question slides + 1 result slide. The `quiz_result` type only exists at runtime, never in DB. Participants mark one completion per day (uses "morning" period). Seed data in `server/track-a-content-data.ts`.
  - **Track B**: Morning and evening meditations (the original program). Content stored in `dailyContent` table. Participants mark both morning and evening completions. Seed data in `server/content-data.ts`.
- **Track Assignment**: Admin assigns participants to Track A or B via the Users tab. Dashboard renders different content based on the user's track.
- **Content**: 30 days of structured spiritual content per track, with embedded video support. Practice resources include various prayers and spiritual exercises.
- **Assignment Field**: Optional text field per day for custom assignments (e.g., "Message your mentor about..."). If blank, no assignment section shown to participants.
- **Daily Examen**: Displayed as a modal button in evening section to save screen space (Track B only).

### Dashboard Architecture
- **Grid + Detail Pattern**: Dashboard uses a two-mode view:
  - **Grid mode** (default): 2-column card grid showing all 30 days grouped by week, with a sticky dark header showing current week theme. Days show as active (green), completed (green + check), or locked (dimmed + lock icon). Responsive: 1-column on mobile.
  - **Detail mode (Track B)**: Clicking a day card opens the full content view with morning/evening tabs. "Back to Overview" button returns to grid.
  - **Lesson flow (Track A)**: Clicking a day card launches a Duolingo-style multi-screen lesson flow (see below).
- **Key Components**: `DayCard`, `DayGridView`, `StickyWeekHeader`, `WeekSection`, `PeriodSelectionDialog`, `OverviewGuideModal` (all in `client/src/components/`)
- **Sunday Cards**: Days 8, 15, 22, 29 are "Go to Mass" Sundays — non-clickable, col-span-2 cards with Church icon. Day 1 is also a Sunday but has intro content so it stays clickable. Detection: `day > 1 && (day - 1) % 7 === 0`.
- **Week Themes**: Track A uses dynamic module data from `trackAModules` table (fetched via `/api/track-a-modules`). Each module has a title, subtitle, and optional custom imageUrl. Falls back to rotating default images if no custom image is set.
- **Track A Modules**: `trackAModules` table stores week-level metadata (weekNumber, title, subtitle, imageUrl). Admin can edit module titles/subtitles and upload custom images via the module management UI.
- **Per-Day Images**: Each day in `trackAContent` has an optional `imageUrl` column. Admin can upload a custom image per day in the slide editor. The participant dashboard uses per-day images as day card backgrounds, falling back to a rotating set of default images. Day cards display the photo without a gradient overlay (just a subtle dark scrim for text readability).
- **Image Upload**: `POST /api/admin/upload-image` (multer, 5MB limit, PNG/JPG/WebP only). Uploaded images stored in `attached_assets/` and served as static files.
- **Locked Day Tooltip**: Hovering locked cards shows "This lesson unlocks on [date]" calculated from cohort start date.
- **Overview & Guide Modal**: Clicking "Overview & Guide" in sticky header opens a modal with week description and lesson flow instructions.
- **Past Day Completion**: Users can complete missed past days (server allows dayNumber ≤ currentDay, not just ===). Future days still blocked.
- **Track B Period Selection**: When a Track B user clicks a day card, a dialog offers "Morning Meditation" or "Evening Meditation" before entering detail view.
- **Content Access**: Participants can view current day and all past days (not future). Backend time-gates using `day > currentDay`.
- **Content Summaries**: `GET /api/content-summaries` provides lightweight day data for the grid (Track B). Track A grid data comes from `GET /api/track-a-content` (returns summaries for non-admins).

### Track A Lesson Flow (Multi-Screen)
- **Pattern**: Duolingo-style stepped lesson with loading → slides → completion screens. Fully mobile responsive.
- **Components** (all in `client/src/components/lesson/`):
  - `LessonFlow.tsx` — Orchestrator with state machine: loading → slides → complete. Reads slides directly from `content.slides` JSON array.
  - `LessonLoadingScreen.tsx` — Full-screen dark overlay with day number, theme title, glowing cross, auto-advances after ~2s.
  - `LessonSlide.tsx` — Individual content slide. Supports 8 types: text, multi_select, single_select, media, text_input, action, quiz, quiz_result. Multi/single select parse ☐/- lines as options. Media auto-detects YouTube/images/links. Text_input saves responses via useCreateAnswer. Action shows "Mark as Done" button. Quiz shows one question at a time with A/B/C/D options; quiz_result shows dominant-letter personality result. All slides render uniformly on white background with Afacad font, no Cards/colored boxes/titles.
  - `LessonProgressBar.tsx` — White header (76px) with subtle shadow, X button (48px touch target), green (#00b57a) progress bar on light gray track, no step count text.
  - `LessonCompletionScreen.tsx` — Calm completion screen with checkmark animation, glow effect, sparkles, encouraging message.
- **Slide Order**: Determined by the order of slides in the `slides` JSON array. Admin can reorder freely via the visual slide editor.
- **Navigation**: Gray Back button (ArrowLeft) and black Continue button (ArrowRight) at bottom with justify-between layout. Back on first slide shows "Exit". Continue on last slide shows "Finish" (still black). Text_input draft state is lifted to LessonFlow so it persists across slide navigation.
- **Completion**: Hitting "Continue" on completion screen auto-marks the day as complete and returns to grid.
- **CSS Animations**: Defined in `client/src/index.css` with `lesson-` prefix. Includes slide transitions, glow effects, sparkle particles, cross glow. Responsive sizing for mobile.

### Core Features
- **User Roles**: Participant, Mentor, Admin.
- **Time-Gating**: Cohort-based content release, where all users progress together from an admin-defined start date. Participants can review past days but not access future ones.
- **Progress Tracking**: Users mark prayers complete, and an admin dashboard visualizes participant progress, completion rates, and graduation status (80% threshold).
- **Messaging**: Real-time, role-based chat system with unread message notifications.
- **Onboarding**: Day 0 onboarding with an introduction video and participant agreement.
- **Admin Capabilities**: User management (reset passwords, delete users), content management (view/edit all daily content), cohort management (set start dates, clear completions), user details view (profile, progress, prayer completions, full answer history with filtering and CSV export), and data export (CSV for users, answers, progress).
- **Track A Admin Editor**: Visual slideshow builder in Admin.tsx → TrackAContentManagementView. Day selector with 30-day grid, central theme input, and ordered slide list. Each slide card shows type badge (color-coded), content preview, and action buttons (move up/down, delete, expand/collapse). Add Slide button with type dropdown. Slides saved as JSON array to `/api/admin/track-a-content`.
- **Mobile Responsiveness**: Full optimization for mobile devices, including adaptive navigation, layouts, and content display.
- **Theming**: Custom typography with Afacad font (Semibold for headings/titles), and spiritual imagery for login.

## External Dependencies

### Database
- PostgreSQL
- Drizzle ORM
- drizzle-zod

### UI Components
- shadcn/ui (based on Radix UI)
- Lucide React (icons)
- Embla Carousel
- date-fns

### Authentication
- Passport.js
- passport-local
- express-session
- memorystore (development)

### Build Tools
- Vite
- esbuild
- TypeScript