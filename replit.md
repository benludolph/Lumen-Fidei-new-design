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
- `trackRequirements`: Week-by-week morning/evening prayer requirements for each track (A, B, C)

### Security
- Passwords are hashed using bcryptjs before storage
- API responses are sanitized to never expose password hashes
- Session-based authentication with secure cookies

### Time-Gating Logic
User progress is calculated from their `startDate` field. Current day = difference between now and start date + 1, clamped between 1 and 30. Users can only access content for their current day and previous days.

### Track-Based Requirements
Track A: Abstinence Fridays only
Track B: Fasting Fridays and Sunday Rosary  
Track C: Full requirements (implied by the tier structure)

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