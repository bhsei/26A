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
