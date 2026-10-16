# Backend API

This directory will contain the Node.js and TypeScript REST/JSON backend API.
It owns the PostgreSQL schema and database migrations.

> **Status:** Only the database foundation exists (Prisma schema, first
> migration and the PostgreSQL Compose service). API routes, authentication
> and tests are added by later initialization commits. Do not add credentials,
> tokens or real personal data.

## Prerequisites

- Node.js 22 LTS (see `.nvmrc`) and npm.
- Docker Desktop with Docker Compose.

## Database setup

Run from the repository root unless stated otherwise.

1. Create a `.env` file in the repository root (it is ignored by Git) with
   these variables. Choose your own local password and use the same values in
   `DATABASE_URL`:

   ```bash
   POSTGRES_DB=adoptajob
   POSTGRES_USER=adoptajob
   POSTGRES_PASSWORD=<your-local-password>
   POSTGRES_PORT=5432
   DATABASE_URL=postgresql://adoptajob:<your-local-password>@localhost:5432/adoptajob?schema=public
   ```

   Docker Compose reads the `POSTGRES_*` values and Prisma reads
   `DATABASE_URL` from this same file.

2. Start PostgreSQL 16 and wait until it is healthy:

   ```bash
   docker compose up -d postgres
   docker compose ps
   ```

3. Install dependencies and apply the committed migrations:

   ```bash
   cd src/backend
   npm ci
   npm run db:deploy
   npm run db:generate
   ```

## Database commands

| Command | Purpose |
|---------|---------|
| `npm run db:deploy` | Apply committed migrations (safe to repeat). |
| `npm run db:migrate -- --name <change>` | Create and apply a new migration after editing `prisma/schema.prisma`. |
| `npm run db:status` | Show which migrations are applied. |
| `npm run db:reset` | **Destructive:** drop the local database and reapply all migrations. |
| `npm run db:generate` | Regenerate the Prisma client in `node_modules/.generated/prisma` (not committed). |
| `npm run db:validate` | Validate `prisma/schema.prisma`. |

## Schema ownership

- `prisma/schema.prisma` and `prisma/migrations/` are the only source of the
  database schema. Never change tables by hand or from another service.
- Tables and columns use snake_case so the matching service can read them
  with plain SQL through its read-only role (added with the matching service).
- Integrity rules that Prisma cannot express (salary range, swipe decisions,
  CV size, published date) are `CHECK` constraints at the end of the
  migration SQL.
- No protected attributes (gender, age, nationality, photos, etc.) are stored,
  so they cannot become ranking inputs (REQ-COMP-004).

## Data model

| Table | Purpose | SRS |
|-------|---------|-----|
| `users` | Candidates and recruiters, password hash, privacy consent | REQ-FUNC-001..004, REQ-SEC-001, REQ-COMP-001 |
| `companies` | Company shared by one or more recruiters | REQ-FUNC-003 |
| `candidate_profiles`, `candidate_tags` | Optional candidate background | REQ-FUNC-005..006 |
| `tags`, `card_tags` | Fixed tag vocabulary used for ranking | REQ-FUNC-008, REQ-ML-001 |
| `cards` | Company and job cards with draft/published status | REQ-FUNC-008..011 |
| `swipes` | One like or pass per candidate and card; likes carry the recruiter decision | REQ-FUNC-011..017, REQ-REL-001 |
| `flags` | Green and red flags | REQ-FUNC-014..015, REQ-ML-003..004 |
| `matches`, `messages` | Accepted likes and their chat | REQ-FUNC-017..020, REQ-FUNC-022 |
| `applications` | Application message and CV reference (file stored outside the DB) | REQ-FUNC-021 |
| `reports` | User reports for moderation | REQ-FUNC-023 |

Deleting a user cascades to their profile, swipes, flags, matches and
messages (REQ-FUNC-004). Cards and companies remain.
