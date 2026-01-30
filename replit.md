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
- **Key Tables**: `users`, `dailyContent`, `userAnswers`, `messages`, `trackRequirements`, `prayerCompletions`, `practiceResources`.
- **Content**: 30 days of structured morning and evening spiritual content, with embedded video support. Practice resources include various prayers and spiritual exercises.

### Core Features
- **User Roles**: Participant, Mentor, Admin.
- **Time-Gating**: Cohort-based content release, where all users progress together from an admin-defined start date.
- **Progress Tracking**: Users mark prayers complete, and an admin dashboard visualizes participant progress, completion rates, and graduation status (80% threshold).
- **Messaging**: Real-time, role-based chat system with unread message notifications.
- **Onboarding**: Day 0 onboarding with an introduction video and participant agreement.
- **Admin Capabilities**: User management (reset passwords, delete users), content management (view/edit all daily content), cohort management (set start dates, clear completions), and data export (CSV for users, answers, progress).
- **Mobile Responsiveness**: Full optimization for mobile devices, including adaptive navigation, layouts, and content display.
- **Theming**: Custom typography with Afacad and Cormorant Garamond fonts, and spiritual imagery for login.

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