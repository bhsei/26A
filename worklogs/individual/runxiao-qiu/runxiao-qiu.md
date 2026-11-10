# Runxiao Qiu - Individual Worklog

## 2026-10-10

### Repository creation

- **Commit:** `e7857e8`
- **Work:** Created the project repository with its initial README.
- **Evidence:** `README.md`

## 2026-10-11

### SRS first complete version

- **Commit:** `5ce738a`
- **Work:** Wrote the first complete version of the Software Requirements
  Specification (v0.1).
- **Evidence:** `docs/requirements/SRS.md`

## 2026-10-16

### Database foundation

- **Tasks:** DB-001, DB-002, DB-003
- **Commit:** `bbed6fb`
- **Work:** Added the Docker Compose service for local PostgreSQL, defined the
  Prisma relational schema and created the initial migration.
- **Evidence:** `docker-compose.yml`, `src/backend/prisma/schema.prisma`,
  `src/backend/prisma/migrations/20261016045740_init/migration.sql`,
  `src/backend/README.md`

### Database design document

- **Tasks:** DB-004, DB-005
- **Commit:** `284a8cb`
- **Work:** Documented the PostgreSQL model and its constraints, the planned
  Neo4j graph, and produced the database UML source and image.
- **Evidence:** `docs/design/database.md`, `docs/design/database-uml.mmd`,
  `docs/design/database-uml.png`

### Synthetic mock data

- **Task:** DB-006
- **Commit:** `671cb06`
- **Work:** Added deterministic synthetic fixtures for local development and
  tests.
- **Evidence:** `tests/fixtures/synthetic/mock-data.sql`,
  `tests/fixtures/synthetic/README.md`

### SRS v0.2 and v0.3

- **Commits:** `22eebb4`, `c95e77a`
- **Work:** Adjusted the requirements (v0.2) and updated the SRS to adopt the
  Neo4j graph store for ranking (v0.3).
- **Evidence:** `docs/requirements/SRS.md`

## 2026-10-28

### SRS v0.5 and v0.6

- **Commits:** `4583777`, `dffce51`, `40484bb`
- **Work:** Removed REQ-CM-001 and closed the open issues (v0.5), corrected
  typos, and revised the SRS after reviewing it against the product (v0.6).
- **Evidence:** `docs/requirements/SRS.md`

## 2026-10-29

### SRS v0.7

- **Commit:** `58bc095`
- **Work:** Added rationales to the requirements and aligned them with the
  template format.
- **Evidence:** `docs/requirements/SRS.md`

## 2026-11-02

### Team C SRS peer review

- **Task:** RECORD-001
- **Work:** Reviewed Team C's SRS v1.1 and recorded 15 findings: one severe,
  eight moderate and six minor.
- **Evidence:** `worklogs/individual/runxiao-qiu/Team_C_SRS_Review_Report.md`
- **Review issue:** `https://github.com/bhsei/26C/issues/10`
- **Result:** Revision recommended before Team C uses its SRS as the baseline
  for the next development phase.

## 2026-11-04

### SRS v0.8 peer review corrections

- **Commit:** `7cf9678`
- **Work:** Checked the Group F (8 findings) and Team E (13 findings) reviews
  of SRS v0.7 against the SRS and applied the corrections that needed no team
  decision: REQ-SEC-004 raised to Must, privacy notice contents extended in
  REQ-COMP-001, measurable acceptance criteria for REQ-MAINT-002, REQ-OBS-003,
  REQ-REL-002, REQ-SEC-006, REQ-ML-004 and others, proxy review and scope
  limits for fairness and ranking, and versioned design references.
- **Evidence:** `docs/requirements/SRS.md`
- **Review issues:** `https://github.com/bhsei/26A/issues/1`,
  `https://github.com/bhsei/26A/issues/2`

### SRS v0.8 team decisions after peer review

- **Commit:** `ead59c3`
- **Work:** Recorded the team decisions on the reviews: only Job Cards create
  matches, each accepting recruiter gets a separate match and chat, and
  applications are for the match's Job Card (F-04); split REQ-FUNC-003 into
  company creation (Must) and the new REQ-FUNC-025 invitation code (Should)
  (F-03); opened Appendix B issues 5 to 13 for the findings still to be
  decided.
- **Evidence:** `docs/requirements/SRS.md`
- **Review issues:** `https://github.com/bhsei/26A/issues/1`,
  `https://github.com/bhsei/26A/issues/2`

## 2026-11-10

### MVP schema alignment with SRS v0.8

- **Commit:** `c59448b`
- **Work:** Checked every data-related requirement of SRS v0.8 against the
  PostgreSQL schema and added one migration for the MVP gaps: green and red
  flags became swipe actions so each card gets exactly one swipe
  (REQ-FUNC-011, 014, 015), likes on Company Cards carry no recruiter decision
  (REQ-FUNC-012), Job Cards require a location and contract type
  (REQ-FUNC-008), new `invitation_codes` table (REQ-FUNC-025), cards are
  soft-deleted with a `DELETED` status so matches stay visible (REQ-FUNC-009),
  and only recruiters can belong to a company (REQ-FUNC-003). Updated the mock
  data to the new schema. Verified the migrations on a fresh database and
  tested every new constraint with valid and invalid rows.
- **Evidence:** `src/backend/prisma/schema.prisma`,
  `src/backend/prisma/migrations/20261110042731_mvp_schema_alignment/migration.sql`,
  `tests/fixtures/synthetic/mock-data.sql`,
  `tests/fixtures/synthetic/README.md`

### Database design v0.2 and UML

- **Commit:** `b8c564a`
- **Work:** Updated the database design document to v0.2 with the new tables,
  modelling decisions, integrity rules and indexes, and recorded the gaps that
  need backend decisions as open issues 7 to 12 (token revocation, deleted
  accounts in matches, inactivity, age confirmation, one match per recruiter,
  notification state). Redrew the UML diagram with every column, one line per
  foreign key and all enumerations.
- **Evidence:** `docs/design/database.md`, `docs/design/database-uml.mmd`,
  `docs/design/database-uml.png`

### Synthetic seed data

- **Task:** SEED-001
- **Commit:** `9c3bed8`
- **Work:** Added `npm run db:seed`, a repeatable generator of synthetic demo
  data (REQ-INST-002, REQ-ML-005). By default it creates 10 companies in 5
  sectors, 14 recruiters, invitation codes, 10 candidates (including a demo
  account and a cold-start account for REQ-ML-002), 50 published Job Cards
  plus one Company Card per company, draft, unpublished and deleted cards, and
  swipes of all four actions. `--cards 1000` produces the load-test size for
  REQ-PERF-001. Added 23 tests that check the sizes, the demo feed
  (TC-INST-002), repeatability and the database rules without a database.
- **Evidence:** `src/backend/prisma/seed.ts`, `src/backend/prisma/seed/`,
  `src/backend/tests/seed.test.ts`, `src/backend/README.md` (Seed data)
- **Result:** The default seed loads in about 1 s and the 1,000-card seed in
  about 3 s; typecheck and all 26 backend tests pass.
