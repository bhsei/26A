# AdoptAJob Project Changelog

This changelog records repository milestones and the decisions that changed
the implementation direction. It is maintained in English because project
documentation and commit messages use English.

## Attribution policy

The **Responsible contributor** field records the person responsible for the
work area or documentation update. Git commit authors and timestamps remain
the authoritative evidence of who created each commit. This distinction keeps
the project attribution accurate and auditable.

Jean-Baptiste SIMON is the responsible contributor for the backend,
backend integration, architecture alignment and the planning documents
(`plans/CHANGELOG.md` and `plans/BACKLOG.md`).

## Implemented milestones

### Repository foundation

- **Responsible contributor:** Jean-Baptiste SIMON
- **Status:** Completed
- **Evidence:** `.gitignore`, `.env.example`, repository folders and
  documentation placeholders
- **Change:** Established the required repository structure, local secret
  exclusions, synthetic-data policy and document-review workflow.

### Project documentation baseline

- **Responsible contributors:** Jean-Baptiste SIMON for the
  planning/architecture alignment; team members for their reviewed documents
- **Status:** Completed
- **Evidence:** `README.md`, `CONTRIBUTING.md`,
  `.github/pull_request_template.md`
- **Change:** Documented project scope, local-only POC constraints, contribution
  rules, review process, technology direction and team responsibilities.

### PostgreSQL foundation

- **Responsible contributor:** Alba (Qiu Runxiao)
- **Status:** Completed
- **Evidence:** `docker-compose.yml`,
  `src/backend/prisma/schema.prisma`,
  `src/backend/prisma/migrations/`,
  `src/backend/prisma.config.ts`,
  `src/backend/package.json`,
  `src/backend/package-lock.json`
- **Change:** Added PostgreSQL Compose setup, Prisma configuration, the initial
  relational schema and its first migration.

### Database design documentation

- **Responsible contributors:** Alba (PostgreSQL) and Levis (Neo4j boundary)
- **Status:** Completed as a design baseline
- **Evidence:** `docs/design/database.md`,
  `docs/design/database-uml.mmd`, `docs/design/database-uml.png`
- **Change:** Documented relational entities, constraints, privacy deletion
  behavior, the minimized Neo4j projection and the proposed harmonization
  boundary.

### Neo4j architecture alignment

- **Responsible contributors:** Jean-Baptiste SIMON for the
  architecture documentation; Levis for the graph responsibility; Alba for
  the relational boundary; Nils for matching ownership
- **Status:** Documentation aligned; implementation pending
- **Evidence:** `docs/requirements/SRS.md`,
  `docs/design/Architecture_Design.md`, `docs/design/database.md`,
  `README.md`, component READMEs
- **Change:** Confirmed PostgreSQL as relational source of truth, Neo4j as the
  matching graph projection, candidate-only swiping, recruiter acceptance, and
  the Alba/Levis harmonization responsibility.

## Commit references for `dev`

This section tracks the `dev` branch, not `main`. The `dev` branch currently
points to `abc3608` and contains the architecture, database and SRS alignment
commits listed below. The author and committer are kept separate because some
commits were authored by a teammate and committed by Jean-Baptiste.

| Milestone | Commit | Author | Committed by |
|---|---|---|---|
| Initial repository README | [`e7857e8`](https://github.com/bhsei/26A/commit/e7857e8cbedf845a8ce6e6f791f2aa2aafa9c3a0) | albaqiu | albaqiu |
| SRS v0.1 | [`5ce738a`](https://github.com/bhsei/26A/commit/5ce738afddb759bfbfea79610b6f0f2cd7f178d5) | albaqiu | Jean-Baptiste SIMON |
| Initialization plan | [`69014a7`](https://github.com/bhsei/26A/commit/69014a752f9321db2acbcc92dc02e1fef5b214c4) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Repository hygiene | [`c937657`](https://github.com/bhsei/26A/commit/c937657d473a5ff73a550ff838e9481b2c633174) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Repository skeleton | [`de71a2d`](https://github.com/bhsei/26A/commit/de71a2d7038736d298ef26d2523ef587fb7ec5a1) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Root README | [`4cf7548`](https://github.com/bhsei/26A/commit/4cf75486886a90e9639e6d6f6314633b60a27aa7) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Contribution workflow | [`4cdb4d4`](https://github.com/bhsei/26A/commit/4cdb4d4a305cf0a8b11ec7309d880cfcc5240839) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Architecture baseline | [`c6ad5bf`](https://github.com/bhsei/26A/commit/c6ad5bf1e948b1b41f1bf0d854d77c8520d8a133) | Peter Richard Shekidele | Jean-Baptiste SIMON |
| SRS v0.2 | [`22eebb4`](https://github.com/bhsei/26A/commit/22eebb4e03f13333f27d79c2c65317ae83f3b3b4) | albaqiu | Jean-Baptiste SIMON |
| Database foundation | [`bbed6fb`](https://github.com/bhsei/26A/commit/bbed6fbcdb27569d758121a190d4ae7c9b73015d) | albaqiu | Jean-Baptiste SIMON |
| Database design v0.1 | [`284a8cb`](https://github.com/bhsei/26A/commit/284a8cb36d6e047f91fd6f82e8830b5aab702f6d) | albaqiu | Jean-Baptiste SIMON |
| SRS v0.3 | [`c95e77a`](https://github.com/bhsei/26A/commit/c95e77a3cbeea1ff39156046eb57e506bee03d5c) | albaqiu | Jean-Baptiste SIMON |
| Synthetic data | [`671cb06`](https://github.com/bhsei/26A/commit/671cb06bc17f33adee21b4c83cefd11daf78a584) | albaqiu | Jean-Baptiste SIMON |
| Documentation ownership | [`b23e55f`](https://github.com/bhsei/26A/commit/b23e55f5be86bda0d1d43a16e40e57d7835f26b5) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Architecture alignment | [`1f1e6e3`](https://github.com/bhsei/26A/commit/1f1e6e3f5a2c0997494d3a3d0e4cf2b9fa0eb979) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| Database architecture | [`7ef695d`](https://github.com/bhsei/26A/commit/7ef695d34955163a15ee8f4fb5c023c08ec8b6ac) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |
| SRS v0.4 | [`abc3608`](https://github.com/bhsei/26A/commit/abc3608dd0dd08b2b71732dabc67b35624064b15) | Jean-Baptiste SIMON | Jean-Baptiste SIMON |

The current changelog and backlog edits are not included in this branch
history until they are committed. The database documentation reference to
`61ba7d3` is not present in the visible `dev` history and must not be treated
as an authoritative commit reference without local verification.

## Current uncommitted work and commit split

The four documentation commits previously proposed are already present on
`dev` as `b23e55f`, `1f1e6e3`, `7ef695d` and `abc3608`. They must not be
recreated. The local working-tree status supplied by the contributor contains
only these changes:

- modified: `README.md`, `CONTRIBUTING.md`,
  `docs/design/database.md`, `tests/fixtures/synthetic/README.md`;
- deleted: `plans/INIT_PLAN.md`;
- untracked: `plans/BACKLOG.md`, `plans/CHANGELOG.md`.

Split this work into two commits:

### Commit A - Replace the initialization plan

Files:

- `plans/INIT_PLAN.md` (delete);
- `plans/BACKLOG.md` (add);
- `plans/CHANGELOG.md` (add).

Purpose: replace the historical initialization plan with the operational
backlog and the verified `dev` branch history. This is one coherent planning
records change.

### Commit B - Update references to the new planning records

Files:

- `README.md`;
- `CONTRIBUTING.md`;
- `docs/design/database.md`;
- `tests/fixtures/synthetic/README.md`.

Purpose: update links and references from `INIT_PLAN.md` to `BACKLOG.md` and
`CHANGELOG.md`. No architecture, SRS or database-model redesign belongs in
this commit; those changes are already committed on `dev`.

Suggested commit messages are:

```text
W<N> - Planning records; replace the initialization plan with verified history and backlog
W<N> - Documentation references; point project guides to the backlog and changelog
```

The second commit depends on the first because its links target the new
planning files. Before staging, run `git status --short`, `git diff --name-status`
and `git diff --check` locally.

## Next milestones

- Select and evaluate the matching algorithm on synthetic fixtures.
- Define the PostgreSQL-to-Neo4j canonical mapping, freshness, retry and
  reconciliation policy.
- Create and validate the OpenAPI contract.
- Implement the Jean-Baptiste-owned backend API and its matching boundary.
- Implement the Nils-owned matching service and the Levis/Alba graph pipeline.
- Implement Peter's mobile prototype and Expo application.
- Add seed data, tests, CI and the local swipe-feed POC.
