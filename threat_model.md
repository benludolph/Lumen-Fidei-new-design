# Threat Model

## Project Overview

Lumen Fidei is a full-stack React + Express + PostgreSQL application for a 30-day spiritual formation program with three main roles: participant, mentor, and admin. Production traffic enters through a single Express server, which serves both the API and the frontend, uses session-based authentication with Passport local auth, and stores application data in PostgreSQL through Drizzle ORM.

Production assumptions for this repository:
- `NODE_ENV` is `production` in deployed environments.
- TLS between browser and platform edge is handled by the platform.
- `artifacts/mockup-sandbox/` is development-only and should not be treated as production-reachable unless separately wired in.

## Assets

- **User accounts and sessions** — email addresses, password hashes, session cookies, password reset tokens. Compromise enables account takeover.
- **Role-restricted program data** — participant answers, survey responses, prayer completions, mentor assignments, unread message state, and admin dashboards. Exposure would leak sensitive personal and spiritual information.
- **Private communications** — mentor/participant/admin messages and mentor profile data. These require strong server-side authorization boundaries.
- **Administrative control plane** — user management, cohort settings, content editing, Track A imports/exports, backup/restore, snapshots, testimony management, and media uploads. Compromise gives broad integrity impact across the whole application.
- **Uploaded media and generated artifacts** — user-uploaded images/audio/video and generated certificates. These can affect storage, content integrity, and data exposure if mishandled.
- **Application secrets and external service credentials** — database connection string, session secret, Resend credentials, MassTimes API key, reset-link base URL. Leakage can enable deeper compromise.

## Trust Boundaries

- **Browser to API** — every client request crosses into untrusted server input. The server must validate and authorize all requests regardless of client behavior.
- **Authenticated vs unauthenticated users** — login, password reset, and any bootstrap behavior must not expose privileged actions to unauthenticated users.
- **Participant vs mentor vs admin** — mentor/participant messaging, user-profile access, exports, and admin management features must be enforced server-side.
- **API to database** — the server has direct read/write access to the full application dataset. Route-layer flaws can become full data compromise.
- **API to third-party services** — password reset email delivery and confession-finder lookups cross to external services and must not leak secrets or accept attacker-controlled destinations.
- **Production vs dev-only code** — `artifacts/`, ad hoc scripts, and mockup code should usually be ignored unless production reachability is demonstrated.

## Scan Anchors

- **Production entry points:** `server/index.ts`, `server/routes.ts`, `server/auth.ts`, `server/storage.ts`, `shared/routes.ts`, `shared/schema.ts`
- **Highest-risk server areas:** auth/session handling in `server/auth.ts`; role checks and sensitive routes in `server/routes.ts`; startup seed/migration helpers near the bottom of `server/routes.ts`; data access helpers in `server/storage.ts`
- **Public/auth/admin surfaces:** public auth reset endpoints in `server/auth.ts` and `server/routes.ts`; authenticated participant/mentor APIs throughout `server/routes.ts`; admin APIs under `/api/admin/*`
- **Usually dev-only:** `artifacts/mockup-sandbox/`, `scripts/`, one-off import helpers, and local assets unless the server explicitly serves them in production

## Threat Categories

### Spoofing

The application uses local username/password login with server-side sessions. The system must only create privileged users through controlled admin flows, must never ship known default credentials into production startup paths, and must avoid returning credential material to the client. Password reset tokens must be unguessable, single-use, and expire quickly.

### Tampering

Admins can modify content, cohort settings, testimonies, snapshots, imports, backups, and restores. Participants can submit answers, prayer completions, and survey/chat-flow responses. The server must treat all request bodies as untrusted, validate them server-side, and ensure state-changing routes cannot be triggered outside the intended authorization context.

### Information Disclosure

The application stores sensitive participant reflections, mentor relationships, survey data, and chat messages. API responses, logs, exports, and profile endpoints must never expose password fields, reset tokens, or cross-user data beyond the caller’s allowed scope. Error handling and logging must avoid leaking secrets or sensitive records.

### Denial of Service

The service accepts media uploads, large admin restore payloads, CSV imports, and external-service lookups. Public and authenticated endpoints must apply appropriate size limits and rate limits so that uploads, restore/import flows, or repeated auth attempts cannot exhaust resources.

### Elevation of Privilege

The most important boundary is participant/mentor/admin separation. All user lookup, messages, answers, prayer completion access, admin exports, backup/restore, and content-management actions must enforce server-side role checks and relationship checks. Any startup bootstrap path, missing authorization check, or session abuse that gives non-admins admin capabilities is high risk.
