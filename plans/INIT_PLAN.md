# AdoptAJob Initialization Plan

This plan covers the commits needed to turn the current repository into a
runnable, documented foundation. It does not implement product features. Every
commit is intended to leave `main` buildable and documented.

## 1. Open questions and assumptions

### Decisions recorded

- Commit messages use the course format `W<N> - summary; description`. The
  team will replace `W<N>` with the applicable week number when each commit is
  created.
- The current project assumption is GDPR. The team should confirm the final
  legal scope before implementing the privacy notice and retention behavior.
- Only candidates swipe. A match is created after a candidate likes a card and
  the recruiter accepts; recruiter-side candidate swiping is out of scope for
  the POC.
- MIT is the proposed open-source licence. The team must approve it before a
  licence file is added.
- Lewis and Peter will share front-end and mobile work. Their exact split is
  intentionally left open; both should review the mobile shell and
  accessibility behavior.
- No remote deployment is planned. The initialization and POC target local
  execution with Docker Compose.

### Remaining confirmations

1. Confirm the final GDPR scope and the exact privacy/retention policy.
2. Approve the MIT licence before adding the licence file.
3. Agree on the detailed Lewis/Peter front-end and mobile work split.

### Assumptions for initialization

- Use `W<N>` in this plan as a placeholder; replace it with the applicable
  week number when creating each commit.
- Use TypeScript for the Node backend and Expo mobile app, Python for the
  matching service, and PostgreSQL 16 in local development.
- Use Fastify + Prisma for the backend. The backend owns the schema and all
  migrations; the matching service uses a read-only PostgreSQL role and
  `psycopg`, so two migration systems never compete.
- Use FastAPI + Pydantic for the matching service, with a replaceable ranking
  strategy and deterministic mock implementation.
- Pin direct dependency versions and commit each component lock file. Version
  numbers below are policy targets; the implementation commit must record the
  exact versions selected at that time.
- Use Expo SDK pinned to a compatible stable release, React Navigation, and
  Android API 29+ as the Android 10 baseline. iOS is best effort.
- Use ESLint and Prettier for TypeScript, Ruff and Black for Python, Vitest for
  backend tests, pytest for matching-service tests, and Jest/React Native
  Testing Library for mobile tests.
- Use the proposed MIT licence only after team approval; no licence file is
  created by this plan before that decision.
- All seed data, fixtures, screenshots, and examples are synthetic. Demo
  credentials, tokens, real CVs, and real personal data are forbidden.
- Iteration 1 includes accounts, security, cards, feed, and like/pass. Flags,
  adaptive ranking, matching, and chat are scaffolded only where contracts
  require them; Iteration 3 and out-of-scope products are not scaffolded.
- The POC is local-only and does not include a remote deployment target.

## 2. Final repository tree

The tree below is the target initialization layout. Component unit tests live
beside their component in `src/backend/tests`, `src/matching-service/tests`,
and `src/mobile/__tests__`; repository-level contract, load, manual, and
traceability assets live in `tests/`.

```text
26A/
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── document-review.md
├── .gitignore
├── .env.example
├── README.md
├── docker-compose.yml
├── plans/
│   ├── INIT_PLAN.md
│   └── PROJECT_PLAN.md
├── src/
│   ├── backend/
│   │   ├── README.md
│   │   ├── package.json
│   │   ├── package-lock.json
│   │   ├── tsconfig.json
│   │   ├── prisma/schema.prisma
│   │   ├── prisma/migrations/...
│   │   ├── src/{app.ts,server.ts,config.ts,errors.ts,request-id.ts}
│   │   ├── src/routes/{health,auth,feed}.ts
│   │   └── tests/{health,auth,errors,request-id}.test.ts
│   ├── matching-service/
│   │   ├── README.md
│   │   ├── pyproject.toml
│   │   ├── uv.lock
│   │   ├── app/{main.py,config.py,models.py,ranking.py}
│   │   └── tests/{test_health,test_ranking,test_contract}.py
│   └── mobile/
│       ├── README.md
│       ├── package.json
│       ├── package-lock.json
│       ├── app.json
│       ├── tsconfig.json
│       ├── src/{navigation,screens,components,api,theme}
│       └── __tests__/navigation.test.tsx
├── tests/
│   ├── contracts/{openapi,matching}.test.*
│   ├── load/README.md
│   ├── manual/README.md
│   ├── traceability.csv
│   └── fixtures/synthetic/
├── docs/
│   ├── requirements/SRS.md
│   ├── design/{Architecture_Design.md,openapi.yaml}
│   ├── testing/{Test_Plan.md,Test_Cases.md,Traceability.md}
│   └── release/README.md
├── worklogs/
│   ├── team/README.md
│   └── individual/README.md
├── weekly-reports/
│   └── W01/Weekly_Report_W01.pptx
└── assets/
    └── README.md
```

`...` means generated migration files or ordinary component subfiles, not an
invitation to add extra services. The root `README.md` links to each component
README and each required course deliverable.

## 3. Technology decisions

| Component | Tool | Version policy | Why | SRS IDs |
|---|---|---|---|---|
| Mobile | React Native + Expo, TypeScript, React Navigation | Pin Expo SDK, Node engine, packages, and `package-lock.json`; Android API 29+ | Required client stack, fast Android POC, accessible button alternatives | REQ-INT-001..004, REQ-PORT-001, REQ-POC-001 |
| Backend API | Node.js LTS + Fastify + TypeScript | Pin Node major in `.nvmrc`/`engines`; lock npm dependencies | Small HTTP surface, schema validation, good request hooks and testing | REQ-INT-005..007, REQ-SEC-001..007, REQ-OBS-001..003 |
| Persistence | PostgreSQL 16 + Prisma | Backend owns `schema.prisma` and committed Prisma migrations; matching role is read-only | Type-safe schema, one migration owner, reproducible local database | REQ-INST-001, REQ-INST-002, REQ-FUNC-001..023 |
| Matching service | Python 3.12 + FastAPI + Pydantic + psycopg | Pin Python floor, dependencies in `pyproject.toml` and `uv.lock`; no migrations | Clear internal HTTP contract and replaceable ranking boundary | REQ-INT-006, REQ-REL-002, REQ-ML-001..006 |
| Backend tests | Vitest + Fastify injection + Prisma test database | Pin versions and run in CI; collect coverage with V8 | Fast isolated API and unit tests without a live HTTP port | REQ-INT-007, REQ-REL-001, REQ-MAINT-002 |
| Matching tests | pytest + pytest-cov + HTTPX | Pin in `pyproject.toml`/`uv.lock`; minimum 60% gate | Native Python testing and contract/algorithm fixtures | REQ-INT-006, REQ-ML-001..005, REQ-MAINT-002 |
| Mobile tests | Jest + React Native Testing Library | Pin with mobile lock file | Navigation, loading, empty-state, and accessible-action coverage | REQ-INT-001..004 |
| Formatting/lint | ESLint + Prettier; Ruff + Black | Config committed per component; CI runs check-only commands | Required style checks and consistent diffs | REQ-MAINT-003 |
| API contract | OpenAPI 3 YAML + a validator | Contract file reviewed with every route change | Single client/server contract | REQ-INT-005..007 |
| Local orchestration | Docker Compose | Pin PostgreSQL image by major/minor and health checks | One-command backend/matching/database startup | REQ-INST-001, REQ-OBS-003 |
| CI | GitHub Actions | Pin action major versions and use lock-file installs | Tests on every push to `main` | REQ-BUILD-001..002 |

No Neo4j, payments, web client, video, external job-board integration, or
analytics dashboard is initialized.

## 4. Commit-by-commit sequence

Commands shown after each commit are run from the repository root. Before every
commit, run `git pull --rebase`; stage only the listed files; then run
`git push origin main` after verification. Replace `W<N>` with the agreed week.

### Commit 01 — repository skeleton

- **Message:** `W<N> - Repository skeleton; establish the required project tree`
- **Files:** `.gitignore`, `.env.example`, `src/*/README.md`,
  `tests/{load,manual}/README.md`, `docs/release/README.md`,
  `worklogs/{team,individual}/README.md`, `assets/README.md`,
  `.github/ISSUE_TEMPLATE/document-review.md`, empty directory keepers where
  Git requires them.
- **Contents:** Ignore `.env`, tokens, local databases, build output,
  `node_modules`, Python virtual environments, coverage, and IDE files.
  Document-only READMEs explain each folder. The issue template contains the
  exact review title format and one-comment fields: Location, Type, Finding,
  Recommendation.
- **Commands:** `git pull --rebase`; `git status --short`
- **SRS:** REQ-COMP-005, REQ-MAINT-001, REQ-ML-005
- **Verification:** `git check-ignore .env`; inspect the tree and confirm no
  secret, credential, or real-person data is present.
- **Owner:** Jean-Baptiste (structure); Peter (security review).

### Commit 02 — root README

- **Message:** `W<N> - Root README; document the project foundation and scope`
- **Files:** `README.md`
- **Contents:** Honest “What works” and “What is deliberately unfinished”;
  numbered quick start; `docker compose up` flow; component endpoint table;
  common commands; annotated tree; candidate/recruiter roles; seed warning;
  team ownership; project map; security/data policy; links to SRS, design,
  testing, plans, worklogs, and release docs.
- **Commands:** `git pull --rebase`; Markdown link check if available
- **SRS:** REQ-INST-001, REQ-MAINT-001, REQ-COST-001, REQ-COMP-005
- **Verification:** A new reader can identify setup, scope, unfinished work,
  and all component locations without opening source code.
- **Owner:** Nils.

### Commit 03 — contribution and Git workflow

- **Message:** `W<N> - Contribution workflow; formalize review and commit rules`
- **Files:** `CONTRIBUTING.md`, `.github/pull_request_template.md`
- **Contents:** `git pull --rebase`, one coherent unit per commit, exact
  `W<N> - summary; description` convention, branch/issue review practice,
  secret and synthetic-data rules, required local checks, and GitHub Issue
  document-review procedure.
- **Commands:** `git pull --rebase`; `git diff --check`
- **SRS:** REQ-COMP-005, REQ-CM-001, REQ-BUILD-002
- **Verification:** Follow the documented workflow on a disposable branch and
  confirm the review template links to the issue template.
- **Owner:** Nils (project process); Lewis (review usability).

### Commit 04 — project plan and Gantt

- **Message:** `W<N> - Project plan; add milestones, iterations and schedule`
- **Files:** `plans/PROJECT_PLAN.md`
- **Contents:** scope and non-goals, team ownership, dependency order,
  Iteration 1–3 boundaries, one-week REQ-POC-001 before M4, Mermaid gantt with
  M1/M2/M3 on 2026-10-14 and M4–M7 marked TBD, risks, and decision log
  entries for the two SRS open issues.
- **Commands:** `git pull --rebase`; render/inspect Mermaid in GitHub preview
- **SRS:** REQ-DEAD-001, REQ-POC-001, REQ-CM-001
- **Verification:** Check that M1–M3 dates are exact and no pending decision is
  represented as settled.
- **Owner:** Nils.

### Commit 05 — architecture and OpenAPI skeleton

- **Message:** `W<N> - Architecture baseline; define service boundaries and API contract`
- **Files:** `docs/design/Architecture_Design.md`, `docs/design/openapi.yaml`
- **Contents:** context/container/deployment views, trust boundaries, backend
  schema ownership, read-only matching DB access, request-ID flow, health and
  readiness approach, fallback boundary, privacy/non-discrimination boundary,
  and a minimal valid OpenAPI 3 contract for health, auth, cards, feed, swipe,
  and matching. Mark unresolved match rule and jurisdiction as open.
- **Commands:** `git pull --rebase`; OpenAPI validator; `git diff --check`
- **SRS:** REQ-INT-005..007, REQ-REL-002, REQ-OBS-001..003,
  REQ-COMP-003..004, REQ-INST-001
- **Verification:** The OpenAPI file validates and every initially planned
  route has request/response/error shapes.
- **Owner:** Jean-Baptiste; Peter reviews security boundaries.

### Commit 06 — database schema, migration, and Compose

- **Message:** `W<N> - Database foundation; add schema migration and local services`
- **Files:** `docker-compose.yml`, `src/backend/prisma/schema.prisma`,
  `src/backend/prisma/migrations/...`, `src/backend/.env.example`,
  `src/backend/package.json`, `src/backend/package-lock.json`
- **Contents:** Users/roles, companies, cards/tags, candidate background,
  swipes/flags, recruiter decisions, matches/messages placeholders needed by
  the contract, request-safe timestamps and idempotency keys. Add a
  PostgreSQL-only Compose service with a healthcheck and non-secret env
  wiring. The later backend and matching-service commits extend this Compose
  file with their containers and separate read-only matching DB credentials.
  The migration is the only schema owner.
- **Commands:** `git pull --rebase`; `docker compose config`; Prisma migration
  deploy against a clean database
- **SRS:** REQ-INST-001..002, REQ-REL-001..002, REQ-SEC-001,
  REQ-FUNC-001..023, REQ-ML-005
- **Verification:** Clean Compose startup reaches database health; migration
  applies once and is repeatable. The final Compose verification after Commit
  08 confirms matching credentials cannot write.
- **Owner:** Qiu.

### Commit 07 — backend scaffold

- **Message:** `W<N> - Backend scaffold; add health, request IDs and API foundations`
- **Files:** `src/backend/src/{app.ts,server.ts,config.ts,errors.ts,request-id.ts}`,
  `src/backend/src/routes/{health,auth,feed}.ts`,
  `src/backend/tests/{health,auth,errors,request-id}.test.ts`,
  backend lint/format/coverage configs and package scripts.
- **Contents:** Fastify app factory; `GET /health`; optional `/ready`;
  validated auth stub with password-hash boundary and JWT configuration;
  standard `{code,message}` errors; generated/propagated request ID;
  structured redacted logging; feed timeout boundary ready for the 1-second
  matching fallback; no fake success for unimplemented business operations.
- **Commands:** `npm ci`; `npm run lint`; `npm run format:check`;
  `npm test -- --coverage`
- **SRS:** REQ-INT-007, REQ-SEC-001..007, REQ-REL-001..002,
  REQ-OBS-001..003, REQ-MAINT-002..003
- **Verification:** Tests cover health, malformed input, auth failures,
  request-ID propagation, redacted logs, and error shape; coverage gate is
  configured at 60%.
- **Owner:** Peter (security); Jean-Baptiste (API).

### Commit 08 — matching-service scaffold

- **Message:** `W<N> - Matching service scaffold; add ranked-feed contract and mock strategy`
- **Files:** `src/matching-service/{pyproject.toml,uv.lock,README.md}`,
  `src/matching-service/app/{main.py,config.py,models.py,ranking.py}`,
  `src/matching-service/tests/{test_health,test_ranking,test_contract}.py`
- **Contents:** FastAPI `GET /health`; internal ranking endpoint accepting
  candidate ID and returning ordered card IDs with scores; strategy protocol;
  deterministic mock ranking; cold-start most-recent-first behavior with
  three-sector fixture; read-only DB adapter; explicit 1-second caller-side
  timeout contract; no protected attributes or photos as inputs.
- **Commands:** `uv sync --locked`; `uv run ruff check .`; `uv run black --check .`;
  `uv run pytest --cov=app --cov-fail-under=60`
- **SRS:** REQ-INT-006, REQ-REL-002, REQ-OBS-001..003,
  REQ-COMP-004, REQ-ML-001..005, REQ-MAINT-002..003
- **Verification:** Contract fixture is score-descending; cold start covers
  three sectors; protected fields are absent from ranking inputs.
- **Owner:** Nils.

### Commit 09 — synthetic seed generator

- **Message:** `W<N> - Synthetic seed data; add reproducible demo dataset`
- **Files:** `src/backend/prisma/seed.ts`, `assets/README.md`,
  `tests/fixtures/synthetic/README.md`, seed scripts in backend package files
- **Contents:** A visibly destructive local-only seed warning; at least 10
  companies, 50 published job cards, 10 candidates, tags and deterministic
  backgrounds; hashed non-demo passwords generated at runtime or documented
  through environment variables, never committed. No protected ranking inputs,
  real CVs, or real names.
- **Commands:** `docker compose up -d`; migration deploy; `npm run seed`;
  query counts; `docker compose down`
- **SRS:** REQ-INST-002, REQ-ML-002, REQ-ML-005, REQ-COMP-004
- **Verification:** Counts are 10/50/10 or greater and a synthetic candidate's
  feed is non-empty; rerunning produces the same logical dataset.
- **Owner:** Qiu (data); Nils (generator).

### Commit 10 — mobile Expo shell

- **Message:** `W<N> - Mobile shell; add Expo navigation and accessible screen placeholders`
- **Files:** `src/mobile/{package.json,package-lock.json,app.json,tsconfig.json}`,
  `src/mobile/src/{navigation,screens,components,api,theme}`,
  `src/mobile/__tests__/navigation.test.tsx`, `src/mobile/README.md`
- **Contents:** Expo Android-first app shell with role-aware navigation and
  placeholders for sign-in/registration, onboarding, feed, card detail,
  matches, chat, profile, card builder/list, and interested candidates.
  Include visible button alternatives, loading/error/empty states, API base URL
  from environment, accessible labels, and no fabricated backend behavior.
- **Commands:** `npm ci`; `npm run lint`; `npm test`; `npx expo start`
- **SRS:** REQ-INT-001..004, REQ-PORT-001, REQ-MAINT-001, REQ-POC-001
- **Verification:** Android emulator/device reaches every placeholder within
  three taps from its role home; tests verify navigation and button labels.
- **Owner:** Peter (Android/security); Lewis (UI review); Jean-Baptiste (API
  integration). Nobody currently lists mobile UI design as a strength.

### Commit 11 — GitHub Actions CI

- **Message:** `W<N> - Continuous integration; run component checks on pushes to main`
- **Files:** `.github/workflows/ci.yml`, any lockfile-install configuration
- **Contents:** Separate Node backend, Python matching, and mobile jobs;
  PostgreSQL service for backend tests; locked installs; lint, format checks,
  unit tests, coverage thresholds, OpenAPI validation, and secret/synthetic-data
  checks. Trigger on pushes to `main` and pull requests. Do not print secrets.
- **Commands:** `git pull --rebase`; run the exact CI commands locally
- **SRS:** REQ-BUILD-001..002, REQ-MAINT-002..003, REQ-ML-005
- **Verification:** A deliberately failing branch is rejected, then the clean
  branch is green with artifacts showing test and coverage results.
- **Owner:** Peter (CI/security); Nils (Python job).

### Commit 12 — testing and traceability skeleton

- **Message:** `W<N> - Test traceability; map SRS requirements to executable evidence`
- **Files:** `docs/testing/{Test_Plan.md,Test_Cases.md,Traceability.md}`,
  `tests/traceability.csv`, `tests/contracts/README.md`, `tests/manual/README.md`,
  `tests/load/README.md`
- **Contents:** Test IDs exactly `TC-<REQ ID>-<n>`; one row for every SRS
  requirement; verification method, owner, fixture, and status; contract/load/
  manual test boundaries; performance thresholds; privacy, non-discrimination,
  observability, fallback, and POC evidence plans.
- **Commands:** `git pull --rebase`; script/check that every SRS ID has a row
  and every test ID follows the required pattern
- **SRS:** All requirements in SRS Section 4, especially REQ-PERF-*,
  REQ-SEC-*, REQ-REL-*, REQ-ML-*, REQ-POC-001
- **Verification:** Automated consistency check reports no missing, duplicate,
  or malformed requirement/test IDs.
- **Owner:** Nils (traceability); Lewis (manual test usability).

### Commit 13 — worklogs and weekly report

- **Message:** `W<N> - Project records; add worklog and weekly-report templates`
- **Files:** `worklogs/team/README.md`, `worklogs/individual/README.md`,
  `weekly-reports/W01/Weekly_Report_W01.pptx`
- **Contents:** Worklog templates with date, contributor, task, evidence,
  blockers, decisions, and next action. The W01 deck contains scope,
  architecture, owners, progress, risks, and the M1–M3 status; it must contain
  no secrets or real personal data.
- **Commands:** `git pull --rebase`; open the PPTX and inspect all slides
- **SRS:** REQ-DEAD-001, REQ-COMP-005, REQ-CM-001
- **Verification:** The deck opens, names the correct repository/team, and
  links its claims to committed artifacts.
- **Owner:** Nils (coordination); all members supply evidence.

## 5. README outlines

### Root README

1. Project purpose and product scope.
2. What works / deliberately unfinished.
3. Technology and service map.
4. Prerequisites and numbered quick start.
5. Environment variables and secret policy.
6. Common commands and test/coverage commands.
7. API/service/health endpoint table.
8. Seed warning and synthetic-data policy.
9. Candidate/recruiter roles and planned iterations.
10. Annotated project tree and team ownership.
11. Links to requirements, architecture, testing, plan, worklogs, release
    material, and contribution rules.
12. Licence status and open decisions.

### Backend README

Purpose; what works/unfinished; Node and PostgreSQL prerequisites; `.env`
setup; migration and seed commands; local and Compose startup; route table;
schema/migration ownership; auth and error/request-ID conventions; tests,
lint, format and coverage; project map; security and logging exclusions; API
contract link; next steps.

### Matching-service README

Purpose; what works/unfinished; Python/`uv` setup; environment variables;
`/health` and ranking endpoint table; request/response example with synthetic
IDs; strategy boundary and mock behavior; cold-start and fallback contract;
read-only DB policy; tests, Ruff, Black and coverage; project map; protected
attribute exclusion; next steps.

### Mobile README

Purpose; Android-first support and iOS best effort; what works/unfinished;
Node/Expo setup; environment/API URL; numbered emulator/device quick start;
screen/navigation table; accessibility and button alternatives; loading/error/
empty states; tests/lint; project map; POC scope; next steps.

## 6. Ownership and UI risk

| Member | Suggested initialization ownership |
|---|---|
| Qiu | PostgreSQL schema, Prisma migrations, seed data, data fixtures |
| Nils | Python matching service, project management, traceability |
| Peter | Authentication/security, Android validation, CI and secret checks |
| Jean-Baptiste | Architecture, OpenAPI, backend API integration and data boundaries |
| Lewis | Manual testing, review coordination, accessibility and UI acceptance; share front-end/mobile work with Peter |

Nobody lists mobile UI design as a strength. Treat this as a delivery risk:
Lewis and Peter share a lightweight design/accessibility review, Peter validates
Android interaction, and the team agrees on a small component/theme vocabulary
before the POC. Use platform-native accessible controls and user-test the shell
before visual polish work.

## 7. Definition of done: initialization complete

- A fresh clone follows the root README and starts PostgreSQL, backend, and
  matching service with `docker compose up` in under 15 minutes.
- All direct dependencies are pinned and all component lock files are
  committed.
- `GET /health` exists for every service; request IDs and `{code,message}`
  errors are tested.
- Backend owns one committed migration history; matching DB access is
  read-only.
- Seed creates at least 10 companies, 50 cards, and 10 candidates using only
  synthetic data; a demo candidate receives a non-empty feed.
- Backend and matching unit-test coverage gates are at least 60%.
- ESLint/Prettier and Ruff/Black pass locally and in CI.
- GitHub Actions is green on a push to `main`.
- The Expo Android shell reaches all required initial screens and exposes
  visible alternatives to swipe actions.
- OpenAPI validates; traceability contains every SRS requirement and a valid
  test/artifact mapping.
- M1, M2, and M3 artifacts are easy to find; worklogs and W01 report are
  populated.
- No secrets, tokens, real personal data, or protected ranking inputs are in
  the repository.

## 8. Risks and decisions before Iteration 1

| Risk/decision | Impact | Required action |
|---|---|---|
| GDPR scope and retention policy need confirmation | Privacy notice, retention, export/delete behavior may be incomplete | Confirm the final GDPR scope and update SRS/design before privacy implementation |
| MIT licence needs approval | The public repository may not have a clear licence | Approve MIT before adding a licence file |
| Front-end/mobile ownership is not split in detail | Work may be duplicated or left uncovered | Lewis and Peter agree the detailed split before the mobile shell |
| POC is local-only | Review sessions depend on a prepared laptop and Docker | Document local prerequisites and rehearse the Compose startup |
| No established mobile UI designer | Accessibility and usability regressions | Assign UI reviewer, define component vocabulary, test on Android early |
| Ranking may accidentally use protected data | Compliance and fairness violation | Code review schema and ranking inputs; add negative fixtures |
| Matching service outage | Feed availability and performance risk | Implement 1-second timeout and most-recent-first fallback; add load test |
| Seed is destructive | Accidental data loss in shared environments | Local-only warning, synthetic DB, explicit environment guard |
| JWT/session design may drift | Security and revocation gaps | Confirm token expiry, password hashing, sign-out semantics before Iteration 1 |
| POC schedule is only one week | Integration work may crowd out tests | Freeze POC scope to load cards and record 20 swipes; defer polish |

The team should confirm the GDPR scope, licence, JWT/session semantics, and
detailed Lewis/Peter mobile ownership before Iteration 1 feature work begins.
