# Jean-Baptiste SIMON - Individual Worklog

## 2026-10-18

### API and backend foundation

- **Tasks:** API-001, API-002 preparation, BACKEND-001
- **Work:** Added the OpenAPI 3 baseline for the public backend and internal
  matching boundary; created the Fastify application factory, configuration
  loader, request-ID hook, redacted logger setup, health/readiness routes,
  explicit unimplemented auth/feed boundaries and initial tests.
- **Evidence:** `docs/design/openapi.yaml`,
  `src/backend/src/`, `src/backend/tests/app.test.ts`,
  `src/backend/tsconfig.json`, `src/backend/package.json`
- **Estimated preparation:** 2 hours before implementation, covering the
  architecture review, route inventory and contract drafting.
- **Implementation time:** Record the measured duration after the local Node.js
  toolchain is available; no unverified duration is claimed here.
- **Validation:** `git diff --check` passed. TypeScript, Vitest and OpenAPI
  validation could not run because Node.js/npm and a YAML validation tool are
  not available in the current shell.
- **Blocker:** Install or expose Node.js 22/npm, then run `npm install`,
  `npm run typecheck`, `npm test` and an OpenAPI 3 validator. The lockfile must
  be regenerated before BACKEND-001 is marked Done.
- **Next action:** Complete API-002 validation with Peter and Nils, regenerate
  `package-lock.json`, then resolve any TypeScript or test failures.

## 2026-10-28

### Backend dependency setup

- **Task:** BACKEND-001
- **Commit:** `f6d19ea`
- **Work:** Installed the backend dependencies and committed the generated
  lockfile.
- **Evidence:** `src/backend/package-lock.json`
- **Validation:** `npm install` completed successfully; `npm run typecheck`,
  `npm test` and `npm run build` completed successfully. The test suite
  reported three passing tests.
- **Environment note:** The repository requests Node.js 22, while this setup
  used Node.js 24.20.0 and npm 11.19.0. The engine warning must be resolved
  or explicitly accepted before release.
- **Security note:** npm reported five audit findings (two moderate, one high
  and two critical). They require review before using `npm audit fix --force`.

## 2026-11-01

### Team B SRS peer review

- **Task:** RECORD-001
- **Commit:** `ed246b4`
- **Work:** Reviewed Team B's SRS v0.5 and recorded 15 findings: one severe,
  nine moderate and five minor.
- **Evidence:** `worklogs/individual/jean-baptiste-simon/Team_B_SRS_Review_Report.md`
- **Review issue:** `https://github.com/bhsei/26B/issues/2`
- **Result:** Revision recommended before Team B freezes its SRS v1.0 baseline.

## 2026-11-02

### OpenAPI validation and dependency security

- **Tasks:** API-002, BACKEND-009
- **Work:** Completed the OpenAPI metadata and public-security corrections,
  added explicit health/readiness error responses, and updated the backend
  dependency policy. Fastify is pinned to `5.12.7`; Ajv's vulnerable
  transitive `fast-uri` release is constrained to `3.1.9`.
- **Evidence:** `docs/design/openapi.yaml`,
  `src/backend/package.json`, `src/backend/package-lock.json`
- **Validation:** Redocly validation passed with one expected warning for the
  local `localhost` server URL. `npm run typecheck`, `npm test` (3 tests),
  `npm run build` and `npm audit --omit=dev` passed. The production audit
  reports zero vulnerabilities.
- **Environment note:** Node.js `24.20.0` was used although the project
  engine policy remains Node.js `22.x`; npm continues to report `EBADENGINE`.
- **Next action:** Implement `BACKEND-005` authentication after confirming
  the JWT/session choice and Prisma field compatibility with Alba.

## 2026-11-21

### Kotlin, matching and PostgreSQL MVP integration

- **Tasks:** BACKEND-005, BACKEND-006, BACKEND-007, BACKEND-008,
  API-002 and matching contract alignment
- **Work:** Replaced the backend 501 authentication and feed boundaries with
  JWT registration/login/session routes, scrypt password verification,
  candidate profile persistence, published-card feed ranking, idempotent
  swipe persistence and recruiter card/interested-candidate/match routes.
  Aligned the public routes and JSON shapes with Peter's Kotlin client and
  the OpenAPI 1.0 contract. Updated the matching service to expose
  `GET /health` and `POST /internal/rank`, preserve the 1-second caller
  timeout contract and return card IDs with scores. Added backend and
  matching Dockerfiles and Compose services.
- **Evidence:** `src/backend/src/routes/`, `src/backend/src/auth.ts`,
  `src/backend/src/password.ts`, `src/matching-service/src/`,
  `docs/design/openapi.yaml`, `docker-compose.yml`
- **Validation:** Backend typecheck and build pass; Vitest reports 26 passing
  tests; Redocly validates OpenAPI with only the documented localhost
  server warning; matching TypeScript build passes; Prisma schema validates.
- **Blocker:** Docker is unavailable in the current shell, so live
  Compose/PostgreSQL startup and end-to-end HTTP verification are pending.
  Node 24.20.0 remains outside the project's Node 22 engine policy.
- **Next action:** Run `docker compose up`, seed the database, verify the
  Kotlin registration/feed/swipe/recruiter flows and then document measured
  test evidence and commit IDs.

## 2026-11-22

### V0 contract and implementation conformity pass

- **Tasks:** API-002, BACKEND-002 to BACKEND-008, and database/model
  conformity review
- **Work completed:** Reviewed the SRS v1.0, the SAD 1.2, the API contract
  and the Kotlin client before changing implementation behavior. Reconciled
  the public API with the Android route family and the newest contract:
  registration now accepts lowercase or uppercase role input, requires
  display name and consent, returns `token` plus `user`, uses scrypt password
  verification, and issues JWT access tokens with at most 24-hour expiry.
  Added server-side JWT revocation for logout. Aligned candidate profile DTO
  fields with the Android wrapper and camelCase JSON, including `userId`.
- **Matching integration:** Changed the backend-to-matcher call to
  `POST /internal/matching/rank`, propagated `X-Request-Id`, added shared-key
  authentication, preserved the 1-second timeout and retained recency fallback
  for unavailable ranking. Added `matchScore` and the contract source values
  `MATCHING_SERVICE` / `POSTGRESQL_FALLBACK` to feed results.
- **Transactions and authorization:** Added database-backed idempotency-key
  storage and replay/conflict behavior for swipes, strengthened published-card
  and candidate-role checks, and added recruiter match DTO fields. Verified
  the one-match-per-recruiter/card/candidate cardinality in Prisma and SQL.
  Updated readiness to query PostgreSQL and probe the matching health endpoint.
- **API normalization:** Updated Fastify 404 and validation handling to the
  `{code,message}` contract, corrected consent and credential status codes,
  and aligned recruiter card and match response serialization with the target
  contract. Updated the OpenAPI document for readiness, lowercase/case-insensitive
  roles, 8-character passwords, API-key auth and matching fallback values.
- **Reproducibility work:** Added consent fields and a revoked-token table to
  the Prisma model and migration, extended `.env.example` and Docker Compose
  with the internal matching key, and set demo seed accounts to consented
  synthetic users.
- **Estimated preparation:** 2 to 3 hours of contract cross-reading and
  workstream planning, including the SRS, SAD, API contract, Kotlin routes,
  Prisma model and matching implementation.
- **Implementation time:** Several continuous implementation blocks were
  reconstructed from the 2026-11-21 and 2026-11-22 conversation and the
  resulting diff. These blocks cover route implementation, DTO corrections,
  migration/configuration changes, validation and documentation; exact
  wall-clock durations were not measured and are not represented as measured
  times. This work is attributable to Jean-Baptiste SIMON.
- **Validation:** Backend Prisma schema validation passed. Backend
  typecheck and build passed. Backend Vitest passed 26 tests. Matching-service
  build passed. `git diff --check` passed. Live Docker, Android, PostgreSQL and
  matching-service HTTP flows remain pending because Docker/runtime services
  were not available for a complete end-to-end run.
- **Evidence:** `docs/requirements/SRS.md`,
  `docs/design/SAD.md`, `docs/design/API_CONTRACT.md`,
  `docs/design/openapi.yaml`, `src/backend/src/`,
  `src/backend/prisma/schema.prisma`,
  `src/backend/prisma/migrations/20261121180737_match_per_recruiter/migration.sql`,
  `src/matching-service/src/`, `docker-compose.yml`, `.env.example`.
- **Blocker:** Run Node 22, Docker Compose, migrations and seed, then execute
  the manual V0 test guide. The live end-to-end acceptance gate could not be
  claimed from static checks alone.
- **Next action:** Commit the implementation in small coherent batches,
  push `dev`, execute the manual Android/API flow, capture Docker and HTTP
  evidence, and update this worklog and the planning records with commit IDs.
