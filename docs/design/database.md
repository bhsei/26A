# Database Design
## For AdoptAJob

Version 0.2  
Prepared by Alba (Qiu Runxiao), database owner  
Software Engineering course, Team A (repository `bhsei/26A`)  
2026-11-10

## Table of Contents
<!-- TOC -->
* [1. Purpose and Scope](#1-purpose-and-scope)
* [2. Architecture Decisions](#2-architecture-decisions)
* [3. PostgreSQL Data Model](#3-postgresql-data-model)
* [4. Integrity Rules](#4-integrity-rules)
* [5. Indexes](#5-indexes)
* [6. Privacy and Deletion](#6-privacy-and-deletion)
* [7. Neo4j Graph Store (planned)](#7-neo4j-graph-store-planned)
* [8. Local Setup and Change Process](#8-local-setup-and-change-process)
* [9. Open Issues](#9-open-issues)
<!-- TOC -->

## Revision History

| Name | Date | Reason For Changes | Version |
|------|------|--------------------|---------|
| Alba (Qiu Runxiao) | 2026-10-16 | First version: PostgreSQL data model and planned Neo4j graph store | 0.1 |
| Alba (Qiu Runxiao) | 2026-11-10 | Align with SRS v0.8 for the MVP: flags become swipe actions, Company Card likes carry no decision, Job Card fields enforced, invitation codes added, cards soft-deleted, only recruiters belong to a company | 0.2 |

## 1. Purpose and Scope

This document describes how AdoptAJob stores its data and why. It covers the
PostgreSQL schema that is implemented (migrations `20261016045740_init` and
`20261110042731_mvp_schema_alignment`) and the Neo4j graph store the team has
agreed to add.

It complements the [architecture document](Architecture_Design.md), section
6.2, which asks for tables, indexes, constraints and relationships to be
documented alongside the schema. The schema itself is code and lives in
[`src/backend/prisma/schema.prisma`](../../src/backend/prisma/schema.prisma);
the SQL that creates it is in
[`src/backend/prisma/migrations/`](../../src/backend/prisma/migrations/).

| Store | Role | Status |
|-------|------|--------|
| PostgreSQL 16 | Main database and single source of truth for all application data | Implemented; synthetic demo data from `npm run db:seed` (see the [backend README](../../src/backend/README.md#seed-data)) |
| Neo4j 5 Community | Harmonized graph projection used by the matching service | Planned, owner: Levis |

## 2. Architecture Decisions

| # | Decision | Reason | Alternative considered |
|---|----------|--------|------------------------|
| D1 | **PostgreSQL is the source of truth.** Every write from the app goes to PostgreSQL through the backend. | Transactions, foreign keys and constraints protect accounts, swipes and matches. One place to back up, seed and delete data. | Writing to both databases from the API (harder to keep consistent). |
| D2 | **The backend owns the schema** through Prisma migrations. No other service creates or changes tables. | One migration history, no conflicting schema changes (see the project backlog and architecture document). | Each service managing its own tables. |
| D3 | **The matching pipeline reads canonical data from PostgreSQL and writes only the approved Neo4j projection.** | PostgreSQL remains the relational source of truth while the graph receives only normalized, minimized data. | Letting the matching service write application data directly. |
| D4 | **snake_case table and column names** (`swipes.candidate_id`). | The matching service and the Neo4j sync use plain SQL; snake_case avoids quoted identifiers. Prisma maps them to camelCase in TypeScript. | Prisma's default PascalCase names. |
| D5 | **Ranking signals are expressed through tags.** Cards and candidate backgrounds link to a fixed tag vocabulary. | REQ-ML-001 to 004 compare a candidate's background, likes and flags with cards; shared tags make that comparison simple and explainable. | Free-text matching. |
| D6 | **Neo4j is added as a minimized graph projection, rebuilt from PostgreSQL.** The app never writes to Neo4j directly. | The team wants "candidates who liked the same jobs also liked these" recommendations, which are short path queries in a graph but many joins in SQL. A rebuildable projection keeps D1 and D2 intact. | PostgreSQL only; Apache AGE (graph queries inside PostgreSQL). |
| D7 | **The feed must work without Neo4j.** The graph only adds an extra score. | Keeps REQ-REL-002 (fallback feed) true and limits the risk of the new component. | Making Neo4j a required dependency. |
| D8 | **No protected attributes are stored** in either database. | Ranking must not use gender, age, ethnicity, nationality, religion, disability, marital status or photos (REQ-COMP-004). If the data does not exist, it cannot be used. | Storing them and filtering in code. |

## 3. PostgreSQL Data Model

![UML class diagram of the AdoptAJob PostgreSQL schema](database-uml.png)

The diagram source is [`database-uml.mmd`](database-uml.mmd) (Mermaid). Boxes
use the real table names and list every column with its PostgreSQL type;
`PK` = primary key, `FK` = foreign key, `UQ` = unique, `?` = nullable. Each
line is one foreign key and is labelled with its column, so a table with two
foreign keys to `users` (for example `matches.candidate_id` and
`matches.recruiter_id`) has two lines. A filled diamond means the rows on the
other end are deleted with the parent (`ON DELETE CASCADE`); a hollow diamond
or plain arrow means the link becomes `NULL` (`ON DELETE SET NULL`). Dashed
arrows point to the enumeration a column uses.

### 3.1 Tables

| Table | Purpose | Key fields | SRS |
|-------|---------|------------|-----|
| `users` | Candidates and recruiters | `email` (unique), `password_hash`, `role`, `company_id`, `privacy_consent_at`, `privacy_notice_version` | REQ-FUNC-001..004, REQ-SEC-001, REQ-COMP-001 |
| `companies` | Company shared by one or more recruiters | `name`, `sector` | REQ-FUNC-003, REQ-ML-002 |
| `invitation_codes` | Single-use codes to join an existing company | `company_id`, `code` (unique), `created_by_id`, `used_by_id`, `used_at` | REQ-FUNC-025 |
| `candidate_profiles` | Optional candidate background | `education_level`, `years_experience` (all nullable) | REQ-FUNC-005..006 |
| `tags` | Fixed vocabulary loaded by the seed | `type` (skill, role, sector, location, contract), `slug`, `label` | REQ-FUNC-008, REQ-ML-001 |
| `card_tags` | Tags of a card | `card_id`, `tag_id` | REQ-FUNC-008, REQ-ML-001 |
| `candidate_tags` | Desired roles, skills, locations and contract types of a candidate | `candidate_id`, `tag_id` | REQ-FUNC-005, REQ-ML-001 |
| `cards` | Company and job cards | `kind`, `status` (draft, published, unpublished, deleted), `title`, `description`, `location`, `contract_type`, salary range, `perks`, `image_url`, `published_at` | REQ-FUNC-008..011 |
| `swipes` | One action per candidate and card (like, pass, green flag or red flag); likes on Job Cards carry the recruiter decision | `action`, `decision` (pending, accepted, declined), `decided_at` | REQ-FUNC-011..017, REQ-REL-001, REQ-ML-003..004 |
| `matches` | Accepted likes | `candidate_id`, `recruiter_id`, `card_id`, `ended_at` | REQ-FUNC-017..019, REQ-FUNC-022, REQ-ML-006 |
| `messages` | Chat messages inside a match | `body` (max 1,000 characters) | REQ-FUNC-020 |
| `applications` | Application message and CV reference | `message`, `cv_storage_key`, `cv_size_bytes` | REQ-FUNC-021 |
| `reports` | User reports for moderation | `target_type`, `target_id`, `reason` | REQ-FUNC-023 |

### 3.2 Modelling decisions

| Decision | Reason |
|----------|--------|
| A recruiter belongs to one company; several recruiters can share it. Candidates belong to none. | "Create or join a company" (REQ-FUNC-003). |
| Deleting a card sets its status to `DELETED` instead of removing the row. | REQ-FUNC-009: existing matches on a deleted card stay visible as "Position closed". The card leaves every feed (only `PUBLISHED` cards are shown) and the backend leaves pending likes on deleted cards out of the interested-candidates list. Rows are physically removed only when the whole company is deleted. |
| A recruiter joins an existing company with a single-use invitation code. | REQ-FUNC-025. The backend marks a code used with one conditional update (`WHERE used_at IS NULL`), so two recruiters cannot use the same code. If the recruiter later deletes their account, `used_by_id` becomes `NULL` but `used_at` stays, so the code remains used. |
| Swipes and recruiter decisions share one table. | The recruiter decides on a like, so the decision belongs to that row. |
| Green and red flags are swipe actions, not a separate table. | REQ-FUNC-011: each card receives exactly one swipe (like, pass, green flag or red flag). One table with one unique key enforces that. |
| Any swipe removes the card from the feed, flags included. | REQ-FUNC-011, REQ-FUNC-014 and REQ-FUNC-015. |
| Only likes on Job Cards carry a recruiter decision. | REQ-FUNC-012: a like on a Company Card is a ranking signal only and adds the candidate to no interested-candidates list. The backend sets `PENDING` from the card kind; a `CHECK` only guarantees that passes and flags never carry a decision, because a `CHECK` cannot read the card's kind. |
| A match is created only by a recruiter accepting a like. | REQ-ML-006: the final decision is always the recruiter's. |
| `reports.target_id` has no foreign key. | A report must survive the deletion of the card, user or message it points to. |
| CV files are stored outside the database. | Only the storage key and size are kept; large binary files do not belong in PostgreSQL. |
| Primary keys are UUIDs generated by PostgreSQL (`gen_random_uuid()`), except `tags` (integer). | IDs cannot be guessed from the API, and rows inserted with plain SQL (seed, tests) get IDs too. Tags are a small internal list. |
| All timestamps are `timestamptz`. | No time-zone ambiguity between services. |

## 4. Integrity Rules

Rules Prisma cannot express are `CHECK` constraints at the end of each
migration.

| Rule | Constraint | SRS |
|------|------------|-----|
| One swipe (like, pass or flag) per candidate and card; a retried request does not create a second row | `UNIQUE (candidate_id, card_id)` on `swipes` | REQ-FUNC-011, REQ-REL-001 |
| One match per candidate and card | `UNIQUE (candidate_id, card_id)` on `matches` | REQ-FUNC-017 |
| One application per match | `UNIQUE (match_id)` on `applications` | REQ-FUNC-021 |
| Only likes carry a decision; passes and flags never do | `swipes_decision_check` | REQ-FUNC-012, REQ-FUNC-017 |
| A decision time needs a decision | `swipes_decided_at_check` | REQ-FUNC-017 |
| A Job Card has a location and a contract type | `cards_job_fields_check` | REQ-FUNC-008 |
| Only recruiters have a company | `users_company_role_check` | REQ-FUNC-003 |
| Invitation codes are unique and not blank; a code with a user is marked used | `UNIQUE (code)`, `invitation_codes_code_not_blank_check`, `invitation_codes_used_check` | REQ-FUNC-025 |
| A published card has a publish date | `cards_published_at_check` | REQ-REL-002 |
| Salary values are positive and min ≤ max | `cards_salary_positive_check`, `cards_salary_range_check` | REQ-FUNC-008 |
| Years of experience between 0 and 60 | `candidate_profiles_years_experience_check` | REQ-FUNC-005 |
| Messages are 1 to 1,000 characters | `VARCHAR(1000)`, `messages_body_not_blank_check` | REQ-FUNC-020 |
| CV at most 5 MB | `applications_cv_size_check` | REQ-FUNC-021 |

Rules that need other tables are validated by the backend: every card has at
least one tag, and a like gets a `PENDING` decision only when the card is a Job
Card.

## 5. Indexes

| Index | Used by | SRS |
|-------|---------|-----|
| `cards (status, published_at DESC)` | Published cards for the feed; most-recent fallback and cold start | REQ-FUNC-011, REQ-REL-002, REQ-ML-002 |
| `swipes (candidate_id, card_id)` (unique) | Excluding cards a candidate already swiped | REQ-FUNC-011 |
| `swipes (card_id, action, decision)` | Interested-candidates list per card; flag signals for ranking | REQ-FUNC-016, REQ-ML-003..004 |
| `invitation_codes (code)` (unique), `invitation_codes (company_id)` | Looking up a code; listing a company's codes | REQ-FUNC-025 |
| `card_tags (tag_id)`, `candidate_tags (tag_id)` | Finding cards that share tags | REQ-ML-001 |
| `matches (recruiter_id, created_at DESC)`, `matches (candidate_id, created_at DESC)` | Matches list, most recent first | REQ-FUNC-019 |
| `messages (match_id, created_at)` | Loading a chat in order | REQ-FUNC-020 |
| `users (company_id)`, `cards (company_id)` | Company members and cards | REQ-FUNC-003, REQ-SEC-003 |
| `reports (target_type, target_id)` | Finding reports about one target | REQ-FUNC-023 |

## 6. Privacy and Deletion

- **Account deletion** (REQ-FUNC-004): deleting a row in `users` cascades to the
  user's profile, tags, swipes (flags included), matches (as candidate or
  recruiter), messages and reports. Cards and companies remain;
  `cards.created_by_id`, `invitation_codes.created_by_id` and
  `invitation_codes.used_by_id` become `NULL`.
- **Passwords** are stored only as adaptive hashes (`password_hash`,
  REQ-SEC-001); hashing is done by the backend.
- **Consent** is recorded with a timestamp and the privacy-notice version
  (REQ-COMP-001).
- **Synthetic data only** in development, tests and the repository
  (REQ-ML-005). No real personal data is committed.
- **Neo4j** stores only the minimized identifiers, tags, status, publish date,
  sector and permitted relationships described in section 7. Deleted accounts
  disappear from it on the next sync.

## 7. Neo4j Graph Store (planned)

Owner: Levis. Not implemented yet. The graph is part of the matching
architecture, while the synchronization implementation, algorithm selection
and operational checks remain to be completed.

### 7.1 Why a graph

Tag overlap in PostgreSQL already ranks cards similar in content to those a
candidate liked (REQ-ML-001 to 004). The graph adds similarity by behaviour:
cards liked by candidates who liked the same cards.

```cypher
(me:Candidate)-[:LIKED]->(:Card)<-[:LIKED]-(other:Candidate)-[:LIKED]->(rec:Card)
```

This is a single path pattern in Cypher; in SQL it needs several self-joins on
`swipes`, and longer paths (related skills, same sector or company) become
harder to write and maintain.

### 7.2 Graph model

Only IDs, tags and relationships are copied. No names, emails, passwords,
messages, CVs or protected attributes.

```text
(:Candidate {id})
(:Card {id, status, publishedAt})
(:Company {id, sector})
(:Tag {id, type, slug})

(:Candidate)-[:LIKED|PASSED|GREEN_FLAGGED|RED_FLAGGED {at}]->(:Card)
(:Card)-[:HAS_TAG]->(:Tag)
(:Candidate)-[:HAS_TAG]->(:Tag)
(:Card)-[:OF_COMPANY]->(:Company)
```

Each node label has a uniqueness constraint on `id`.

| Graph element | PostgreSQL source |
|---------------|-------------------|
| `Candidate` | `users` where `role = 'CANDIDATE'` |
| `Card` | `cards` |
| `Company` | `companies` |
| `Tag` | `tags` |
| `LIKED`, `PASSED`, `GREEN_FLAGGED`, `RED_FLAGGED` | `swipes.action` |
| `HAS_TAG` | `card_tags`, `candidate_tags` |
| `OF_COMPANY` | `cards.company_id` |

### 7.3 Synchronisation

- A harmonization pipeline jointly designed by Alba and Levis reads canonical
  PostgreSQL data with the approved access boundary and writes Neo4j through
  the official driver.
- Proposed first version: **full rebuild** (clear the graph, then load nodes
  and relationships in batches with `UNWIND`). The trigger and cadence remain
  open and must be selected with the matching algorithm.
- Because the graph is rebuilt, deleted accounts and cards disappear on the next
  run. The maximum delay must be documented with the script.
- The sync never writes to PostgreSQL.

### 7.4 Use in ranking

The matching service (Nils) combines both scores:

```text
score = tag-overlap score (PostgreSQL, REQ-ML-001..004)
      + weight × number of similar candidates who liked the card (Neo4j)
```

If Neo4j does not answer in time, the matching service uses the PostgreSQL score
alone, so the feed keeps working (D7, REQ-REL-002). Cards the candidate already
swiped (liked, passed or flagged) are never recommended.

### 7.5 Costs and risks

| Risk | Mitigation |
|------|------------|
| The graph lags behind PostgreSQL (a passed card could reappear) | The feed filter in PostgreSQL removes swiped cards regardless of the graph score. |
| Personal data copied into the graph | Copy only the fields in 7.2; a test checks that no email or name exists in Neo4j. |
| Deleted accounts remain in the graph | Full rebuild; a test checks that a deleted user is gone after the next sync. |
| Extra container (about 1 GB RAM) | Limit the heap in Compose; Neo4j is optional for running the app. |
| Two databases in tests and CI | Graph tests run separately from backend tests. |
| Docker Hub blocked on the team network | Use a VPN or a registry mirror to pull the image. |

## 8. Local Setup and Change Process

Setup steps and database commands are in the
[backend README](../../src/backend/README.md). Summary:

1. Put the database variables in the root `.env` file (listed in the backend
   README).
2. Start PostgreSQL with `docker compose up -d`.
3. In `src/backend`, run `npm ci` and `npm run db:deploy`.

To change the schema:

1. Edit `src/backend/prisma/schema.prisma`.
2. Run `npm run db:migrate -- --name <change>` to create a new migration.
   Committed migrations are never edited.
3. Update this document and the UML diagram, then commit the schema, migration
   and documentation together.

## 9. Open Issues

| # | Issue | Owner | Status |
|---|-------|-------|--------|
| 1 | Update the backlog with the actual database and architecture work already completed. | Jean-Baptiste | Open |
| 2 | Define the canonical PostgreSQL-to-Neo4j field mapping and deduplication rules. | Alba, Levis | Open |
| 3 | Select and evaluate the matching algorithm on synthetic graph fixtures. | Nils | Open |
| 4 | Implement the Neo4j pipeline, including freshness, retry, idempotency and deletion checks. | Alba, Levis | Open |
| 5 | Load synthetic seed data with overlapping candidate likes so graph ranking has patterns to find. | Alba, Nils | In progress: `npm run db:seed` creates shared likes from matching backgrounds; Nils to confirm they are enough for REQ-ML-007. |
| 6 | Confirm the GDPR retention and deletion policy for both stores. | Team | Open |
| 7 | Decide how sign-out and account deletion invalidate tokens (REQ-SEC-002); a `users.tokens_valid_after` column is proposed. | Alba, Jean-Baptiste | Open |
| 8 | Keep matches visible as "Account deleted" for the other party (REQ-FUNC-004): match user columns would become nullable with `ON DELETE SET NULL` instead of cascading. Depends on SRS open issue 11. | Alba, Jean-Baptiste | Open |
| 9 | Record inactivity for the 12-month retention rule (REQ-COMP-001), e.g. `users.last_active_at`. | Alba, Jean-Baptiste | Open |
| 10 | Record the 18+ confirmation given at registration (REQ-FUNC-001), e.g. `users.adult_confirmed_at`. | Alba, Jean-Baptiste | Open |
| 11 | Allow one match per accepting recruiter (REQ-FUNC-017): `UNIQUE (candidate_id, card_id)` on `matches` should include `recruiter_id`. The SRS must also say how a second recruiter can accept a candidate that REQ-FUNC-016 already removed from the interested list. Iteration 2. | Alba, Jean-Baptiste | Open |
| 12 | Store what each user has already seen, so the app can show match and like indicators (REQ-FUNC-018, REQ-FUNC-024). Iteration 2. | Alba, Jean-Baptiste | Open |
