# Backend API

This directory will contain the Node.js and TypeScript REST/JSON backend API.
It owns the PostgreSQL schema and database migrations. It also exposes the
integration boundary used to send approved application data and matching
requests to the Python matching service.

> **Status:** The Fastify application foundation and OpenAPI baseline now
> exist. Health and readiness are available, while authentication, feed
> persistence and matching integration remain explicit `501 Not Implemented`
> boundaries. Do not add credentials, tokens or real personal data.

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

4. Optionally load synthetic demo data (see [Seed data](#seed-data)):

   ```bash
   npm run db:seed
   ```

5. Start the backend in development mode:

   ```bash
   npm run dev
   ```

   The API listens on `http://localhost:3000` by default. Check `GET /health`
   and `GET /ready` before using application routes.

## Database commands

| Command | Purpose |
|---------|---------|
| `npm run db:deploy` | Apply committed migrations (safe to repeat). |
| `npm run db:migrate -- --name <change>` | Create and apply a new migration after editing `prisma/schema.prisma`. |
| `npm run db:status` | Show which migrations are applied. |
| `npm run db:reset` | **Destructive:** drop the local database and reapply all migrations. |
| `npm run db:seed` | **Destructive:** empty every table and load synthetic demo data (see below). |
| `npm run db:generate` | Regenerate the Prisma client in `node_modules/.generated/prisma` (not committed). |
| `npm run db:validate` | Validate `prisma/schema.prisma`. |
| `npm run dev` | Start the Fastify server with file watching. |
| `npm run build` | Compile TypeScript to `dist/`. |
| `npm run typecheck` | Type-check `src/`, then `prisma/` (seed) and `tests/` without emitting files. |
| `npm test` | Run backend tests. |

## Seed data

`npm run db:seed` loads a synthetic dataset for demos and tests (REQ-INST-002).
It empties every application table first and refuses to run unless
`DATABASE_URL` points to `localhost`.

| Option | Default | Meaning |
|--------|---------|---------|
| `--cards <n>` | 50 | Published Job Cards. Each company also gets one published Company Card on top. `--cards 1000` gives the load-test size (REQ-PERF-001). |
| `--candidates <n>` | 10 | Candidate accounts, the two demo candidates included. |
| `--companies <n>` | max(10, cards / 25) | Companies, spread over 5 sectors. |
| `--seed <n>` | 2026 | Random seed. The same seed always gives the same data and IDs. |

Pass options after `--`, for example `npm run db:seed -- --cards 1000`.

The default run creates 10 companies in 5 sectors, 14 recruiters (every third
company has a second recruiter who joined with an invitation code), 10
candidates, 45 tags, 50 published Job Cards and 10 published Company Cards
(60 cards in the feed) plus one draft, one unpublished and
one deleted card, and about 100 swipes of all four actions. No matches are
created.

Demo accounts, all with the password `adoptajob-demo`:

| Email | Account |
|-------|---------|
| `candidate.demo@example.test` | Candidate with a background and a few swipes |
| `candidate.new@example.test` | Candidate who skipped onboarding: no background, no swipes (cold start, REQ-ML-002) |
| `recruiter.demo@example.test` | Recruiter of the first company |

Passwords are hashed with scrypt (`scrypt$N$r$p$salt$hash`, in
`prisma/seed/password.ts`); sign-in must verify the same format.

The code is in `prisma/seed.ts` (database writes) and `prisma/seed/`
(generator, word lists, password hashing). The generator never touches the
database, so `tests/seed.test.ts` checks its output, including the database
rules, without one. The small hand-written dataset with fixed IDs in
`tests/fixtures/synthetic/mock-data.sql` remains for tests that need exact
expected results.

## Schema ownership

- `prisma/schema.prisma` and `prisma/migrations/` are the only source of the
  database schema. Never change tables by hand or from another service.
- Tables and columns use snake_case so the data pipeline and matching service
  can consume a stable relational representation.
- Integrity rules that Prisma cannot express (salary range, swipe decisions,
  CV size, published date) are `CHECK` constraints at the end of the
  migration SQL.
- No protected attributes (gender, age, nationality, photos, etc.) are stored,
  so they cannot become ranking inputs (REQ-COMP-004).
- PostgreSQL remains the source of truth; Neo4j stores only the approved graph
  projection produced by the harmonization pipeline.

## Data model

The tables, relationships, constraints, indexes and design decisions
(including the planned Neo4j graph store) are documented in
[`docs/design/database.md`](../../docs/design/database.md), with a UML diagram.
