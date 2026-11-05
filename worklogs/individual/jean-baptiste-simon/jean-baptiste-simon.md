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
