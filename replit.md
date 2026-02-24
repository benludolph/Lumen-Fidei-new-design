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
- **Key Tables**: `users`, `dailyContent`, `trackAContent`, `userAnswers`, `messages`, `trackRequirements`, `prayerCompletions`, `practiceResources`.
- **Track System**: Two distinct program tracks:
  - **Track A**: Single daily activity per day. Content stored in `trackAContent` table with fields: centralTheme, mainConcepts, dailyScripture, catechism, reflectionCommentary, prayers, journalAssignment, videoResource, songTitle. Participants mark one completion per day (uses "morning" period). Seed data in `server/track-a-content-data.ts`.
  - **Track B**: Morning and evening meditations (the original program). Content stored in `dailyContent` table. Participants mark both morning and evening completions. Seed data in `server/content-data.ts`.
- **Track Assignment**: Admin assigns participants to Track A or B via the Users tab. Dashboard renders different content based on the user's track.
- **Content**: 30 days of structured spiritual content per track, with embedded video support. Practice resources include various prayers and spiritual exercises.
- **Assignment Field**: Optional text field per day for custom assignments (e.g., "Message your mentor about..."). If blank, no assignment section shown to participants.
- **Daily Examen**: Displayed as a modal button in evening section to save screen space (Track B only).

### Core Features
- **User Roles**: Participant, Mentor, Admin.
- **Time-Gating**: Cohort-based content release, where all users progress together from an admin-defined start date.
- **Progress Tracking**: Users mark prayers complete, and an admin dashboard visualizes participant progress, completion rates, and graduation status (80% threshold).
- **Messaging**: Real-time, role-based chat system with unread message notifications.
- **Onboarding**: Day 0 onboarding with an introduction video and participant agreement.
- **Admin Capabilities**: User management (reset passwords, delete users), content management (view/edit all daily content), cohort management (set start dates, clear completions), user details view (profile, progress, prayer completions, full answer history with filtering and CSV export), and data export (CSV for users, answers, progress).
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