# Lumen Fidei - 30-Day Spiritual Program

## Overview

This is a full-stack web application for a 30-day spiritual program called "Lumen Fidei" (Light of Faith). The platform supports three user roles: Participants who follow daily prayers and submit reflections, Mentors who guide assigned participants, and Admins who manage users and assignments. The application features time-gated daily content, track-based requirements (A, B, C), real-time messaging between mentors and participants, and a calm, professional spiritual theme.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a feature-based organization with pages, hooks, and components separated. Custom hooks abstract API calls for authentication, users, content, answers, and chat functionality.

### Backend Architecture
- **Framework**: Express 5 running on Node.js
- **Language**: TypeScript with ES modules
- **Authentication**: Passport.js with local strategy and express-session
- **Session Storage**: MemoryStore (development) with connect-pg-simple available for production

The server uses a modular structure with separate files for routes, authentication, database access, and storage abstraction. API routes are defined using a shared route specification pattern.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Drizzle Kit with `db:push` command for schema synchronization

**Core Tables**:
- `users`: Stores all user data with role (participant/mentor/admin), track assignment (A/B/C), mentor relationships, and start dates for time-gating. Passwords are hashed with bcrypt.
- `dailyContent`: 30 days of structured content including morningScriptureRef, morningScriptureText, morningMeditation, morningPrayer, eveningCatechismRef, eveningCatechism, eveningSummary, and eveningQuestions (JSON array)
- `userAnswers`: Participant daily reflection submissions linked to user and day
- `messages`: Chat messages between mentors and participants
- `trackRequirements`: Week-by-week morning/evening prayer requirements for each track (A, B, C). References practice names that match entries in practiceResources.
- `prayerCompletions`: Tracks when users mark morning/evening prayers as complete. Has unique constraint on (userId, dayNumber, period) to prevent duplicates.
- `practiceResources`: Full text content for prayers and practice instructions (Prayer Against Retaliation, Miracle Prayer, Examen, Lectio Divina, Silence, Rosary). Includes type (prayer/practice), duration, and order fields.

### Week Structure
- 5 weeks with 6 days each (30 days total)
- Reflection days: 6, 12, 18, 24, 30 (isReflectionDay=true)
- Reflection days show weekly review prompt instead of standard morning/evening tabs

### Week Themes
- **Week 1**: God's Loving Plan for Humanity (Trinity, angels, Original Sin, afterlife)
- **Week 2**: Turning Away From Sin (wounds, sins, commandments, spiritual warfare)
- **Week 3**: Jesus Christ The Messiah (baptism, healing, Good Shepherd, Crucifixion, Resurrection)
- **Week 4**: Grace, Our Defense Against Evil (sacraments, Eucharist, Mary, sacramentals)
- **Week 5**: Scripture: The Truth of God's Word (Psalms, inspiration, Sabbath rest, Gospels)

### Content Structure
- **Morning**: Scripture reference, scripture text, meditation for Lectio Divina
- **Evening**: Catechism or activity content (may include embedded videos), 1 reflection question
- Videos are embedded using `[VIDEO:youtubeId]` format in eveningCatechism field
- ContentWithMedia component parses and renders embedded YouTube videos

### Content Import
- CSV import script at `scripts/import-content.ts`
- Sanitizes PDF artifacts, balances long text, detects YouTube links
- Run with: `npx tsx scripts/import-content.ts "path/to/file.csv"`

### Practice Resources Content
The practiceResources table contains full content for:
- **Prayer Against Retaliation**: Protection prayer for spiritual warfare
- **Miracle Prayer**: Surrender and commitment to Christ
- **Examen – St Ignatius**: 5-step daily reflection practice (10-15 min)
- **Lectio Divina – 10 Minutes**: 4-movement Scripture prayer
- **Silence – 5 Minutes**: Contemplative awareness practice
- **Rosary – OP + 1 Decade**: Opening prayers plus one decade meditation

### Prayer Completion Tracking
Users can mark morning and evening prayers as complete via buttons on the Dashboard. A day is considered "complete" when BOTH morning and evening prayers are marked. Progress is calculated based on days with both prayers completed.

### Admin Progress Dashboard
Admins have a "Progress" tab showing all participants with:
- Current day in program (1-30)
- Days completed (both prayers marked)
- Progress bar visualization
- Today's morning/evening completion status
- Assigned mentor name
- Graduation status badge (Passed/At Risk/On Track) based on 80% threshold

### Cohort Graduation Tracking (Added January 2026)
The program tracks participant graduation status with an 80% completion threshold:
- **Threshold**: 24/30 days completed (80%)
- **Status Badges**:
  - "Passed" (green): 80%+ completion
  - "At Risk" (yellow): Below 80% and cohort still in progress
  - "On Track" (blue): On pace to meet threshold
- **Summary Statistics**: Shows total participants, passed count, at-risk count, and average completion rate

### Admin Password Reset
Admins can reset any user's password via a dialog in the Users tab:
- Password input with 6-character minimum validation
- Uses secure bcryptjs hashing before storage
- Admin-only access enforced on API endpoint

### Multiple Cohort Support (Added January 2026)
Admins can start new cohorts via the Settings tab:
- Set new cohort start date
- Optionally clear all prayer completion records for a fresh start
- Current cohort status displayed (start date, current day, status)
- `clearAllPrayerCompletions` storage method removes all prayer records

### Mobile Responsive Design
Dashboard is fully responsive with:
- Collapsible day selector grid on mobile
- Stacked layout (morning above evening) on small screens
- Collapsible track requirements panel
- Tested at 400px viewport width

### Security
- Passwords are hashed using bcryptjs before storage
- API responses are sanitized to never expose password hashes
- Session-based authentication with secure cookies

### Cohort-Based Time-Gating (Updated January 2026)
The program now uses a **cohort-based** approach where all users start together on an admin-configurable date:
- **cohortSettings table**: Stores key-value settings including `cohort_start_date`
- **Admin Settings tab**: Allows admins to set/update the cohort start date
- **Current day calculation**: `currentDay = floor((today - cohortStartDate) / 1 day) + 1`, clamped between 0 and 30
- **Access control**: Users can ONLY access the current day's content - previous days are locked with "missed" indicators, future days are locked
- All time-gating uses cohort start date (not per-user startDate) for content, prayer completions, and progress tracking

### Dashboard Layout (Updated January 2026)
- **Left column (col-span-3)**: Day timeline with weeks 1-5 and days 1-6 per week
- **Main content (col-span-9)**: Full-width content area with Morning/Evening tabs
- **No right sidebar**: Track requirements panel removed for cleaner layout

### Morning Prayers Feature
The Morning tab includes a "Morning Prayers" card with clickable buttons that open modals:
- **Prayer Against Retaliation**: Protection prayer for spiritual warfare
- **Miracle Prayer**: Surrender and commitment to Christ
Prayer texts are stored as constants in Dashboard.tsx (PRAYER_TEXTS object)

### Examination of Conscience
The Evening tab includes an "Examination of Conscience" section with the 5-step Daily Examen:
1. Give Thanks
2. Ask for Light
3. Review the Day
4. Face Your Shortcomings
5. Look Forward

### Admin Content Management (Added January 2026)
Admins can view and edit all 30 days of content via the Content tab:
- **Day Selector Grid**: 30-day grid organized by week (5 weeks × 6 days)
- **View Mode**: Displays morning content (scripture ref, text, meditation) and evening content (catechism ref, content with embedded videos, reflection questions)
- **Edit Mode**: Full form with all content fields including weekTheme, morningPrayer, eveningSummary
- **Reflection Days**: Days 6, 12, 18, 24, 30 marked with badge
- **Time-gate Independent**: Admins can view/edit any day regardless of cohort time-gating
- Form properly resets when switching between days to prevent stale data

## External Dependencies

### Database
- PostgreSQL database (required, configured via `DATABASE_URL` environment variable)
- Drizzle ORM for type-safe database queries
- drizzle-zod for schema validation integration

### UI Component Libraries
- shadcn/ui (Radix UI primitives with Tailwind styling)
- Lucide React for icons
- Embla Carousel for carousel components
- date-fns for date manipulation

### Authentication & Sessions
- Passport.js with passport-local strategy
- express-session with memorystore

### Build & Development
- Vite for frontend bundling with React plugin
- esbuild for server bundling
- TypeScript for type checking
- Replit-specific Vite plugins for development experience