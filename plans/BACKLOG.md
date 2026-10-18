# AdoptAJob Project Backlog

This backlog replaces the initialization plan as the operational source for
remaining work. Items are grouped by dependency and include the responsible
contributor, deliverable and verification target.

## Ownership and attribution

| Area | Responsible contributor |
|---|---|
| Planning, architecture alignment and backend | Jean-Baptiste SIMON |
| Relational database and PostgreSQL migrations | Alba (Qiu Runxiao) |
| Matching research, algorithm evaluation and Python service | Nils Förg |
| Mobile design and React Native/Expo implementation | Peter (Shek) |
| Neo4j graph model and graph implementation | Levis Bangoh |
| PostgreSQL-to-Neo4j harmonization and deduplication | Alba and Levis |

Responsible contributor means the person accountable for delivering or
coordinating the item. Commit authors and review evidence remain recorded by
Git.

## Status values

- **Done:** evidence exists in the repository and has been reviewed.
- **In progress:** implementation or review has started.
- **Planned:** dependency is known and work has not started.
- **Blocked:** work cannot proceed until the stated dependency is resolved.

## W5 Jean-Baptiste setup focus

The project is still before application implementation. This week's setup
should prepare the backend boundary without pretending that business routes
already work:

1. Create `docs/design/openapi.yaml` for health, authentication, cards, feed,
   swipe and the internal matching endpoint.
2. Scaffold the Fastify TypeScript application in `src/backend/src/` with
   configuration loading, request IDs, structured redacted logging and the
   `{code,message}` error shape.
3. Add the backend package scripts and locked dependencies for linting,
   formatting, tests and coverage.
4. Run the backend against the existing PostgreSQL Compose service and keep
   Prisma as the only PostgreSQL migration owner.
5. Record the exact commands, decisions and hours in
   `worklogs/individual/`.

The first useful implementation slice is `API-001`, followed by
`BACKEND-001` through the health, request-ID and error-contract foundations.
Do not implement matching logic, Neo4j writes or mobile screens in this
slice.

## Initialization plan status

| Original commit | Current status | Current evidence or next action |
|---|---|---|
| 01 - Repository skeleton | Done | Repository structure, ignore rules and placeholders are committed. |
| 02 - Root README | Done | `README.md` is committed and points to the current project records. |
| 03 - Contribution workflow | Done | `CONTRIBUTING.md` and the pull-request template are committed. |
| 04 - Project plan and Gantt | Not started | Create `plans/PROJECT_PLAN.md`; keep M1-M3 dates and mark M4-M7 TBD. |
| 05 - Architecture and OpenAPI skeleton | Partial | Architecture is documented; `docs/design/openapi.yaml` is still missing. |
| 06 - Database schema, migration and Compose | Done for the current baseline | PostgreSQL, Prisma schema, migration and local Compose setup are present. |
| 07 - Backend scaffold | Not started | Start after `API-001`; no Fastify application source or backend tests exist yet. |
| 08 - Matching-service scaffold | Not started | Nils owns this after the internal contract is agreed. |
| 09 - Synthetic seed generator | Partial | Deterministic mock SQL exists; the required 10/50/10 Prisma seed generator is still planned. |
| 10 - Mobile Expo shell | Not started | Peter owns the mobile prototype and Expo setup. |
| 11 - GitHub Actions CI | Not started | Add after component tests and locked commands exist. |
| 12 - Testing and traceability skeleton | Not started | Add requirement/test mapping before broad implementation. |
| 13 - Worklogs and weekly report | Partial | Placeholder READMEs exist; actual hours and evidence still need recording. |

## Completed work

| ID | Task | Responsible | Status | Evidence |
|---|---|---|---|---|
| REPO-001 | Establish repository structure and ignore rules | Jean-Baptiste | Done | `.gitignore`, `.env.example`, repository folders |
| REPO-002 | Document project scope and local workflow | Jean-Baptiste | Done | `README.md` |
| REPO-003 | Document contribution and review workflow | Jean-Baptiste | Done | `CONTRIBUTING.md`, `.github/` |
| DB-001 | Start PostgreSQL locally with Docker Compose | Alba (Qiu Runxiao) | Done | `docker-compose.yml` |
| DB-002 | Define the Prisma relational schema | Alba (Qiu Runxiao) | Done | `src/backend/prisma/schema.prisma` |
| DB-003 | Add the initial PostgreSQL migration | Alba (Qiu Runxiao) | Done | `src/backend/prisma/migrations/` |
| DB-004 | Document the relational model and constraints | Alba (Qiu Runxiao) | Done | `docs/design/database.md` |
| DB-005 | Produce the database UML source and image | Alba (Qiu Runxiao) | Done | `docs/design/database-uml.mmd`, `.png` |
| DB-006 | Add deterministic synthetic mock fixtures | Alba (Qiu Runxiao) | Done | `tests/fixtures/synthetic/mock-data.sql` |
| ARCH-001 | Align architecture with PostgreSQL and Neo4j responsibilities | Jean-Baptiste SIMON | Done | `docs/design/Architecture_Design.md` |
| REQ-001 | Record candidate-only swiping and recruiter acceptance | Jean-Baptiste SIMON | Done | `docs/requirements/SRS.md` |

## Planning and architecture

| ID | Task | Responsible | Dependency | Deliverable | Status |
|---|---|---|---|---|---|
| PLAN-001 | Populate this changelog from verified Git history | Jean-Baptiste SIMON | Git history | `plans/CHANGELOG.md` | Done |
| PLAN-002 | Maintain this backlog as the current work source | Jean-Baptiste SIMON | None | `plans/BACKLOG.md` | Done |
| PLAN-003 | Define detailed project schedule and verb-based Mermaid Gantt | Jean-Baptiste | ARCH-001, API-001 | `plans/PROJECT_PLAN.md` | Planned |
| ARCH-002 | Validate the architecture document with all owners | Jean-Baptiste | ARCH-001 | Review evidence | Planned |
| ARCH-003 | Define the canonical PostgreSQL-to-Neo4j data mapping | Alba, Levis | DB-002 | Mapping document or design section | Planned |
| ARCH-004 | Define graph freshness, retry, deletion and reconciliation policy | Alba, Levis | ARCH-003 | Design decision | Planned |
| API-001 | Create the OpenAPI 3 baseline | Jean-Baptiste | ARCH-001 | `docs/design/openapi.yaml` | Planned |
| API-002 | Validate public/mobile and internal/matching contracts | Jean-Baptiste, Peter, Nils | API-001 | Validated OpenAPI and review evidence | Planned |

## Backend work

| ID | Task | Responsible | Dependency | Deliverable | Status |
|---|---|---|---|---|---|
| BACKEND-001 | Scaffold the Fastify TypeScript application | Jean-Baptiste | API-001, DB-002 | `src/backend/src/` and scripts | Planned |
| BACKEND-002 | Implement `GET /health` and readiness checks | Jean-Baptiste | BACKEND-001 | Backend health routes and tests | Planned |
| BACKEND-003 | Implement request ID generation and propagation | Jean-Baptiste | BACKEND-001 | Request-ID hook and tests | Planned |
| BACKEND-004 | Implement the `{code,message}` error contract | Jean-Baptiste | BACKEND-001, API-001 | Error handler and contract tests | Planned |
| BACKEND-005 | Implement authentication and authorization boundaries | Jean-Baptiste | BACKEND-002, DB-002 | Auth routes, JWT/session boundary and tests | Planned |
| BACKEND-006 | Implement recruiter company and card routes | Jean-Baptiste | BACKEND-005, API-002 | Protected card endpoints and tests | Planned |
| BACKEND-007 | Implement candidate feed and idempotent swipes | Jean-Baptiste | BACKEND-005, MATCH-002 | Feed/swipe routes and persistence tests | Planned |
| BACKEND-008 | Integrate the backend with the matching service | Jean-Baptiste | BACKEND-007, MATCH-001, API-002 | Internal client, timeout and fallback tests | Planned |
| BACKEND-009 | Add backend lint, formatting, coverage and component README | Jean-Baptiste | BACKEND-001 | Backend quality checks | Planned |

## Matching, graph and data pipeline

| ID | Task | Responsible | Dependency | Deliverable | Status |
|---|---|---|---|---|---|
| MATCH-001 | Compare candidate matching algorithms on synthetic data | Nils | DB-002, ARCH-003 | Evaluation report and selected algorithm | Planned |
| MATCH-002 | Define the internal ranking request/response contract | Nils, Jean-Baptiste | API-001, MATCH-001 | Contract tests and schemas | Planned |
| MATCH-003 | Scaffold the FastAPI matching service | Nils | MATCH-002 | `src/matching-service/` implementation | Planned |
| MATCH-004 | Implement the deterministic baseline and cold start | Nils | MATCH-003 | Ranking strategy and tests | Planned |
| GRAPH-001 | Implement Neo4j graph model and constraints | Levis | ARCH-003 | Neo4j schema/setup | Planned |
| GRAPH-002 | Implement the PostgreSQL-to-Neo4j harmonization pipeline | Alba, Levis, Nils | GRAPH-001, ARCH-004 | Pipeline and idempotency tests | Planned |
| GRAPH-003 | Integrate graph relationships into selected ranking algorithm | Nils, Levis | MATCH-001, GRAPH-002 | Ranking integration and fallback tests | Planned |
| GRAPH-004 | Verify graph minimization and deletion behavior | Levis, Alba | GRAPH-002 | Privacy and reconciliation evidence | Planned |

## Mobile and POC

| ID | Task | Responsible | Dependency | Deliverable | Status |
|---|---|---|---|---|---|
| MOBILE-001 | Produce the mobile UI prototype | Peter (Shek) | API-001 | Approved prototype | Planned |
| MOBILE-002 | Scaffold the Expo navigation shell | Peter (Shek) | MOBILE-001, API-002 | `src/mobile/` implementation | Planned |
| MOBILE-003 | Connect mobile authentication and feed screens | Peter, Jean-Baptiste | BACKEND-005, BACKEND-007 | Working mobile/API flow | Planned |
| MOBILE-004 | Validate accessible button alternatives and Android behavior | Peter | MOBILE-002 | Manual test evidence | Planned |
| POC-001 | Load cards and persist twenty candidate swipes locally | Peter, Jean-Baptiste, Alba | BACKEND-007, MOBILE-003, DB-003 | `TC-POC-001` evidence | Planned |

## Seed, quality and records

| ID | Task | Responsible | Dependency | Deliverable | Status |
|---|---|---|---|---|---|
| SEED-001 | Generate synthetic companies, cards, candidates and graph patterns | Alba, Nils | DB-003, GRAPH-002 | Reproducible seed | Planned |
| TEST-001 | Create SRS traceability and test-case skeleton | Jean-Baptiste, Nils | API-001 | `docs/testing/`, `tests/traceability.csv` | Planned |
| TEST-002 | Add backend unit and integration tests with 60% coverage | Jean-Baptiste | BACKEND-001 | Backend test report | Planned |
| TEST-003 | Add matching and graph tests with 60% coverage | Nils, Levis | MATCH-003, GRAPH-002 | Matching test report | Planned |
| CI-001 | Add GitHub Actions for locked installs, lint and tests | Jean-Baptiste, Nils, Peter | TEST-002, TEST-003 | `.github/workflows/ci.yml` | Planned |
| RECORD-001 | Record actual individual hours and work evidence | All members | None | `worklogs/individual/` | In progress |
| RECORD-002 | Record meetings and approved meeting photographs | All members | Team consent | `assets/meetings/`, worklog entries | Planned |

## Blocking decisions

1. Nils must select the matching algorithm and its evaluation criteria.
2. Alba and Levis must approve the canonical mapping, deduplication rules,
   freshness target, retry policy and deletion behavior for Neo4j.
3. Jean-Baptiste and Peter must validate the OpenAPI boundary before parallel
   backend/mobile implementation.
4. The team must confirm the GDPR retention policy for both stores.
5. The team must approve the proposed MIT licence before adding a licence file.
