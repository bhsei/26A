# AdoptAJob

Team A's mobile job-matching proof of concept for the Software Engineering
course. AdoptAJob applies a swipe-based interaction to hiring: recruiters
publish company and job cards, candidates build a profile progressively from
their background and feedback, and a recruiter accepts or declines a candidate
who liked a card.

Repository: `bhsei/26A`

## What works

The repository currently contains:

- the Software Requirements Specification v0.1;
- the approved initialization baseline and execution sequence;
- the required project directories and documentation placeholders;
- the document-review Issue template;
- repository rules for local secrets and generated files.

The initialization work is being delivered as small, reviewable commits. The
runtime services and mobile shell are not available yet.

## What is deliberately unfinished

The following items are intentionally not implemented at this stage:

- backend API, authentication and database migrations;
- matching service and ranking strategy;
- PostgreSQL Compose environment;
- synthetic seed generator;
- Expo mobile application;
- OpenAPI contract and architecture design;
- automated tests, coverage checks and GitHub Actions;
- remote deployment.

The proof of concept is local-only. Do not treat this repository as a
production service or as a place to store real candidate, recruiter or company
data.

## Product scope

### Initial scope

- candidate and recruiter accounts;
- optional candidate onboarding;
- recruiter company and job cards;
- candidate feed with Like and Pass actions;
- accessible button alternatives to swipe gestures;
- progressive ranking inputs and later green/red flag behavior;
- recruiter review and acceptance of interested candidates.

Only candidates swipe. For the current POC assumption, a match is created
after a candidate likes a card and the recruiter accepts. Recruiter-side
candidate swiping is out of scope.

### Out of scope

Payments, premium plans, a web client, video interviews, external job-board
integrations, push notifications outside the app, recruiter analytics
dashboards and multi-language UI are not part of this initialization.

## Technology and service map

| Component | Planned technology | Responsibility |
|---|---|---|
| Mobile app | React Native, Expo and TypeScript | Android-first candidate and recruiter UI |
| Backend API | Node.js, Fastify, TypeScript and Prisma | REST/JSON API, authentication, authorization and schema migrations |
| Database | PostgreSQL 16 | Persistent application data |
| Matching service | Python, FastAPI, Pydantic and `psycopg` | Internal ranked-card HTTP endpoint |
| Local orchestration | Docker Compose | Local database and service startup |

The backend is the single owner of the PostgreSQL schema and migrations. The
matching service will use a read-only database role. This prevents two
migration tools from competing over the same database.

## Prerequisites

The complete quick start will require:

1. Git.
2. Docker Desktop with Docker Compose.
3. Node.js LTS and npm for backend and mobile development.
4. Python 3.12 and `uv` for matching-service development.
5. An Android 10+ emulator or device for the mobile POC.

The prerequisites are documented here ahead of the service scaffolds. The
commands below become executable as the corresponding initialization commits
land.

## Quick start

### Current repository state

At the current initialization stage, there is no runnable service yet. Clone the
repository and inspect the baseline:

```powershell
git clone https://github.com/bhsei/26A.git
cd 26A
git status
```

Read the [initialization plan](plans/INIT_PLAN.md) before adding service code.

### Target local POC workflow

Once the service commits are complete, the intended workflow is:

1. Copy `.env.example` to `.env` and fill only local, non-committed values.
2. Start the database and services:

   ```powershell
   docker compose up
   ```

3. Apply the committed database migration.
4. Load synthetic seed data.
5. Start the Expo app and connect it to the local backend.
6. Open the health endpoints and verify that the demo candidate receives a
   non-empty feed.

The exact migration, seed and Expo commands will be added to the component
READMEs when those components exist.

## Environment and data policy

- Never commit `.env`, tokens, passwords, JWT secrets or API keys.
- `.env.example` contains names and documentation only, never usable secrets.
- Use synthetic companies, cards, candidates, backgrounds and test fixtures.
- Never commit real CVs, production exports, message contents or other real
  personal data.
- Ranking must not use gender, age, ethnicity, nationality, religion,
  disability, marital status or photos.
- The current legal assumption is GDPR. The team must confirm the final
  jurisdiction and retention policy before privacy behavior is implemented.

## Common commands

The following commands are the planned development checks. They become
available as each component is initialized:

```powershell
# Local services
docker compose up
docker compose down

# Backend
npm ci
npm test
npm run lint
npm run format:check

# Matching service
uv sync --locked
uv run pytest --cov=app --cov-fail-under=60
uv run ruff check .
uv run black --check .

# Mobile
npm ci
npx expo start
```

Run commands from the relevant component directory unless a README says
otherwise. Do not run a destructive seed command against data that must be
kept.

## Planned service endpoints

| Service | Endpoint | Purpose | Status |
|---|---|---|---|
| Backend | `GET /health` | Service and database health | Planned |
| Backend | `GET /ready` | Local readiness diagnostics | Planned |
| Backend | REST/JSON routes | Authentication, cards, feed and swipes | Planned |
| Matching service | `GET /health` | Service health | Planned |
| Matching service | Internal ranking route | Candidate ID in; ordered card IDs and scores out | Planned |

The backend and matching service will propagate a request ID and log timestamp,
endpoint, status and duration without passwords, tokens, message contents or
CV files. API errors will use the shape
`{ "code": "string", "message": "string" }`.

## Planned iterations

| Iteration | Focus |
|---|---|
| 1 | Accounts, security, recruiter cards, feed, Like and Pass |
| POC | One-week local proof of concept: load cards and record 20 swipes |
| 2 | Flags, adaptive ranking, matching and chat |
| 3 | Learned-preferences view, card preview, applications, unmatch and reports |

The POC is timeboxed to one week and must not expand into payments, web,
video, external job boards or analytics.

## Project structure

```text
README.md                         Project overview and local workflow
plans/                            Project plans and schedules
docs/requirements/                SRS and requirement artifacts
docs/design/                      Architecture and OpenAPI contract
docs/testing/                     Test plan, cases and traceability
docs/release/                     Release and final-delivery material
src/backend/                      Node.js REST API and database owner
src/matching-service/              Python ranking service
src/mobile/                        React Native and Expo application
tests/                            Cross-component, load and manual test assets
assets/                            Synthetic project media and diagrams
worklogs/                          Team and individual activity records
weekly-reports/                    Weekly progress presentations
.github/ISSUE_TEMPLATE/            Document-review workflow
```

Each component has its own README with setup, run and test instructions once
its implementation commit is complete.

## Team ownership

| Member | Initial responsibility |
|---|---|
| Qiu | PostgreSQL schema, Prisma migrations, seed data and fixtures |
| Nils | Python matching service, project management and traceability |
| Peter | Authentication, security, Android validation and CI |
| Jean-Baptiste | Architecture, OpenAPI, backend API integration and data boundaries |
| Lewis | Front-end/mobile work with Peter, manual testing and accessibility review |

Lewis and Peter will agree their detailed front-end/mobile split before the
mobile shell is implemented. The team recognizes that mobile UI design is a
risk area and will use a small shared component/theme vocabulary plus early
Android accessibility checks.

## Documentation map

- [Software Requirements Specification](docs/requirements/SRS.md)
- [Initialization plan](plans/INIT_PLAN.md)
- [Design documentation](docs/design/README.md)
- [Testing documentation](docs/testing/README.md)
- [Release documentation](docs/release/README.md)
- [Contribution workflow](CONTRIBUTING.md)
- [Backend README](src/backend/README.md)
- [Matching-service README](src/matching-service/README.md)
- [Mobile README](src/mobile/README.md)
- [Document-review Issue template](.github/ISSUE_TEMPLATE/document-review.md)

## Initialization definition of done

Initialization is complete when a fresh clone can start the local database,
backend and matching service with one documented command in under 15 minutes;
the seed creates at least 10 companies, 50 job cards and 10 candidates; a demo
candidate receives a non-empty feed; CI is green; coverage gates are enforced;
and all required documentation and traceability artifacts are present.

## Licence and open decisions

MIT is the proposed open-source licence and will be added only after team
approval. The remaining confirmations are the final GDPR scope and retention
policy, the exact Lewis/Peter front-end split, and JWT/session semantics.

See the [initialization plan](plans/INIT_PLAN.md) for the commit sequence,
risks, ownership details and verification steps.
