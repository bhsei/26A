# AdoptAJob

## Software Architecture Document (SAD)

**Document ID:** 26A-SAD-001\
**Revision:** 1.5 --- Reconciliation and review-ready draft\
**Date:** 26 November 2026\
**Project:** AdoptAJob, Team 26A, Beihang University\
**Repository:** https://github.com/bhsei/26A\
**Document owner:** Peter Richard Shekidele\
**Status:** For technical review; not yet approved

> **Baseline statement.** This SAD reconciles diverged `main` and `dev`
> branches. `main` is the primary implementation reference in this
> revision; `dev` is documented as a competing branch state. The two
> matching services are not described as integrated. Source presence
> does not prove a successful build, test, deployment or end-to-end
> demonstration.

## Document control

  --------------------------------------------------------------------------------
  Item                                Value
  ----------------------------------- --------------------------------------------
  Revision                            1.5

  Supersedes                          Revisions 1.0--1.4

  Branch comparison                   `main` 4 commits ahead; `dev` 2 commits
                                      ahead

  Common base                         `a921065d9dbd85906da1696bb04262f66a70bb16`

  API description                     `docs/design/openapi.yaml`, observed
                                      `info.version: 1.0.0`

  API design contract                 `docs/design/API_CONTRACT.md`, API v1

  Database design                     `main` v0.4; `dev` v0.5

  Review status                       Draft for team review
  --------------------------------------------------------------------------------

Branch names are mutable. Record the final full commit SHA before
submission. [Compare main and
dev](https://github.com/bhsei/26A/compare/main...dev).

## Revision history

  -----------------------------------------------------------------------
  Revision                            Summary
  ----------------------------------- -----------------------------------
  1.0--1.3                            Earlier architecture drafts

  1.4                                 Initial branch reconciliation and
                                      viewpoint corrections

  1.5                                 Stronger evidence labels, interface
                                      crosswalk, data qualifications,
                                      security boundaries, acceptance
                                      gates and review checklist
  -----------------------------------------------------------------------

## Table of Contents

-   [1 Documentation Roadmap](#1-documentation-roadmap)
    -   [1.1 Purpose and Scope](#11-purpose-and-scope)
    -   [1.2 Stakeholders](#12-stakeholders)
    -   [1.3 Viewpoint Definitions](#13-viewpoint-definitions)
    -   [1.4 View Documentation Rules](#14-view-documentation-rules)
    -   [1.5 Related Artifacts](#15-related-artifacts)
    -   [1.6 Change and Review Process](#16-change-and-review-process)
-   [2 Architecture Background](#2-architecture-background)
    -   [2.1 Problem and Context](#21-problem-and-context)
    -   [2.2 Architectural Drivers](#22-architectural-drivers)
    -   [2.3 Decisions and Alternatives](#23-decisions-and-alternatives)
    -   [2.4 Quality Attribute
        Scenarios](#24-quality-attribute-scenarios)
    -   [2.5 Product-Line Reuse](#25-product-line-reuse)
-   [3 Architecture Views](#3-architecture-views)
    -   [3.1 Module View](#31-module-view)
    -   [3.2 Component-and-Connector
        View](#32-component-and-connector-view)
    -   [3.3 Allocation View](#33-allocation-view)
    -   [3.4 Data View](#34-data-view)
-   [4 Relations Among Views and
    Reconciliation](#4-relations-among-views-and-reconciliation)
-   [5 Referenced Materials](#5-referenced-materials)
-   [6 Repository Directory](#6-repository-directory)
-   [7 Sample Figures and Tables](#7-sample-figures-and-tables)
-   [Appendix A Reconciliation Log and Acceptance
    Gates](#appendix-a-reconciliation-log-and-acceptance-gates)
-   [Appendix B Interface Contract
    Crosswalk](#appendix-b-interface-contract-crosswalk)
-   [Appendix C Review Checklist](#appendix-c-review-checklist)

# 1 Documentation Roadmap

This Software Architecture Document (SAD) describes AdoptAJob using the
SEI *Views and Beyond* approach. It separates required behavior, design
intent, branch-specific implementation and verified behavior. Its
purpose is to give developers, reviewers and the acquirer a consistent
architectural reference without concealing unresolved integration work.

## 1.1 Purpose and Scope

AdoptAJob is an Android-first recruitment application. Candidates create
a profile, browse company/job cards and express interest or pass.
Recruiters manage cards and review candidate interest. A match is
created only after the recruiter accepts the relevant candidate
interest, as specified by the Software Requirements Specification (SRS).

The system boundary includes: 1. Native Android client using Kotlin and
Jetpack Compose. 2. Node.js/TypeScript Fastify API gateway. 3.
PostgreSQL 16 relational persistence, managed by the backend through
Prisma. 4. A separate matching service with two incompatible branch
implementations: Express/TypeScript on `main`; FastAPI/Python on `dev`.
5. Docker Compose local development environment. 6. Neo4j as a proposed
derived graph projection, not an established live dependency.

Production hosting, a web client, payment processing and external
job-board integrations are outside the documented scope unless added to
the approved SRS.

**Evidence vocabulary**

  -----------------------------------------------------------------------
  Label                               Meaning
  ----------------------------------- -----------------------------------
  Required                            Stated in approved requirements

  Designed                            Described in a design artifact

  Present                             Source/configuration/schema exists
                                      on the named branch

  Tested                              A test exercises the behavior;
                                      passing status must be separately
                                      evidenced

  Build-verified                      A recorded build passed for the
                                      stated commit

  Demonstrated                        A recorded end-to-end run proves
                                      the workflow

  Planned                             Intended, but implementation
                                      evidence is insufficient

  Divergent                           Branch-specific implementation
                                      differs

  Unverified                          Not executed or independently
                                      validated in this review
  -----------------------------------------------------------------------

## 1.2 Stakeholders

  --------------------------------------------------------------------------
  Stakeholder             Concerns                Relevant views
  ----------------------- ----------------------- --------------------------
  Candidate               Onboarding, feed        Component-and-connector;
                          relevance, privacy,     Data
                          reliable interactions   

  Recruiter               Company-scoped access,  Component-and-connector;
                          card management,        Data
                          candidate review        

  Acquirer / course       Scope, schedule,        All
  sponsor                 deliverable             
                          completeness,           
                          acceptance evidence     

  Course evaluator        SRS traceability,       All
                          architecture            
                          consistency,            
                          reproducibility         

  Project team /          Ownership, interfaces,  Module; Allocation
  maintainers             tests, deployment,      
                          change impact           

  Security/privacy        Authentication,         Component-and-connector;
  reviewer                authorization,          Data
                          minimization,           
                          retention, deletion,    
                          fairness                

  QA / peer reviewer      Contract compatibility, Component-and-connector;
                          failure handling,       Allocation
                          regression coverage     
  --------------------------------------------------------------------------

### Team responsibility mapping

  Member                    Recorded responsibility
  ------------------------- -------------------------------------------------------
  Peter Richard Shekidele   Android client and SAD coordination
  Jean-Baptiste Simon       Fastify backend, API gateway and integration
  Nils Förg                 Matching algorithm and service
  Alba (Qiu Runxiao)        PostgreSQL schema, Prisma and data quality
  Levis Bangoh              Neo4j design and data harmonization jointly with Alba

Responsibilities record project ownership, not proof of completion or
approval.

## 1.3 Viewpoint Definitions

This SAD uses the four view types: - **Module:** source-code units,
dependencies and responsibilities. - **Component-and-connector:**
runtime processes, connectors, protocols, interactions and trust
boundaries. - **Allocation:** mapping software to devices, processes,
containers and execution environments. - **Data:** information entities,
relationships, ownership, constraints and lifecycle.

Runtime behavior belongs in component-and-connector; deployment mapping
belongs in allocation; information structure belongs in data. These are
the view-type names used throughout this document.

## 1.4 View Documentation Rules

Each view identifies purpose, elements, relationships, interfaces,
constraints, rationale, variability and limitations. Diagrams are
explanatory; source, schema and migrations are implementation evidence.

Diagram conventions: solid lines indicate relationships represented in
named source/configuration; dashed lines indicate planned, optional,
alternative or unintegrated relationships. Separate `main` and `dev`
subgraphs denote alternatives, not simultaneous runtime components.
Captions state the status represented. A diagram does not prove a build
or runtime test passed.

## 1.5 Related Artifacts

  ------------------------------------------------------------------------
  Artifact                             Authority / purpose
  ------------------------------------ -----------------------------------
  `docs/requirements/SRS.md`           Normative product requirements

  `docs/design/API_CONTRACT.md`        Intended API v1 contract

  `docs/design/openapi.yaml`           Machine-readable API description;
                                       observed version 1.0.0

  `docs/design/database.md`            Database design and proposed graph
                                       projection

  `src/backend/prisma/schema.prisma`   Physical relational schema evidence
  and migrations                       

  Backend/matching source              Branch-specific implementation
                                       evidence

  Docker Compose and Dockerfiles       Local runtime allocation

  Android Gradle project               Native Android build and client
  ------------------------------------------------------------------------

When artifacts disagree, record the discrepancy. A design document does
not override contradictory source evidence.

## 1.6 Change and Review Process

1.  Open a GitHub issue titled `SAD review: <section or artifact>`.
2.  Include section/figure/table, branch and full SHA, observed defect,
    expected behavior and supporting file/line or test output.
3.  Classify as editorial, architecture decision, interface/schema,
    implementation-status, security/privacy or deployment.
4.  Assign the affected component owner and an independent reviewer.
5.  For implementation changes, update source, schema, contract or tests
    first; then update the SAD and record the commit.
6.  Reviewer records Approved, Changes requested or Rejected. Deferred
    items remain open and appear in Appendix A.
7.  Close only when merged or explicitly accepted as a documented
    limitation.

Never include passwords, tokens, real CVs or candidate personal data in
issues. Report suspected exposure privately to the repository
maintainer, rotate exposed credentials and create a sanitized issue
after containment.

# 2 Architecture Background

## 2.1 Problem and Context

The product aims to make job discovery approachable through a
swipe-oriented interface and progressive candidate profile. It must
support candidate and recruiter roles, company-level authorization,
candidate interest, recruiter decisions and match creation while
protecting personal information.

The principal architecture risk is branch integration. `main` and `dev`
have diverged and contain different matching implementations and
interfaces. This SAD therefore documents both branch states rather than
pretending that a single merged implementation exists.

## 2.2 Architectural Drivers

  -----------------------------------------------------------------------
  Driver                              Architectural implication
  ----------------------------------- -----------------------------------
  Android-first product               Native Kotlin/Jetpack Compose
                                      client

  Role-specific workflows             Server-side role and company-scope
                                      authorization

  Relevant feed                       Separate ranker, hard eligibility
                                      filters and safe fallback

  Data integrity                      PostgreSQL transactions,
                                      constraints and controlled
                                      migrations

  Privacy/fairness                    Data minimization; exclude
                                      protected attributes and photos
                                      from ranking

  Modifiability                       Ranker behind internal contract

  Local demonstration                 Reproducible Compose environment
                                      and configurable API base URL

  Branch divergence                   Branch-pinned claims and explicit
                                      acceptance gates

  Future graph analysis               Neo4j optional and derived, not
                                      canonical
  -----------------------------------------------------------------------

## 2.3 Decisions and Alternatives

  ----------------------------------------------------------------------------
  ID                      Decision / status        Rationale and alternatives
  ----------------------- ------------------------ ---------------------------
  AD-01                   Native                   Matches checked-in Android
                          Android/Kotlin/Jetpack   direction; React
                          Compose                  Native/Expo is not the
                                                   implementation baseline

  AD-02                   Fastify public API       Centralizes authentication,
                          boundary                 authorization, validation
                                                   and persistence; direct
                                                   mobile-to-database/ranker
                                                   access is rejected

  AD-03                   PostgreSQL 16 canonical  Transactions and relational
                          store                    constraints; dual
                                                   authoritative writes to
                                                   PostgreSQL and Neo4j are
                                                   rejected

  AD-04                   Backend-owned Prisma     One schema authority;
                          migrations               independent service-owned
                                                   migrations risk drift

  AD-05                   Separate internal        Allows ranking to evolve
                          matching service         independently; embedding
                                                   ranker inside gateway
                                                   couples model dependencies
                                                   and latency

  AD-06                   Ranker choice unresolved `main` and `dev` contain
                                                   different
                                                   algorithms/contracts;
                                                   evaluate both on common
                                                   synthetic fixtures

  AD-07                   Neo4j planned as derived PostgreSQL remains
                          projection               canonical; graph is not
                                                   required for basic feed

  AD-08                   Exclude protected        Privacy and fairness
                          attributes and photos    guardrail
                          from ranking             

  AD-09                   Bounded ranker timeout   Prevents unbounded feed
                          and safe fallback        latency

  AD-10                   Public API v1            Ranker technology changes
                          independent of ranker    must not force Android API
                                                   changes
  ----------------------------------------------------------------------------

**Express versus FastAPI.** `main` contains Node.js/TypeScript Express
with hard eligibility filters and weighted tag-overlap scoring. `dev`
contains Python 3.12/FastAPI with Sentence Transformers
(`all-MiniLM-L6-v2`), cosine similarity, SQL eligibility filtering and a
recency-oriented cold-start path. Neither is selected as the final
integrated baseline here. Semantic embeddings may improve semantic
relevance but introduce model download, warm-up, memory, dependency and
supply-chain costs. Tag overlap is simpler and deterministic but may
miss semantic similarity. Compare both on identical synthetic fixtures
and report agreed ranking metrics (for example precision@k/recall@k),
p50/p95 and cold-start latency, memory, startup time and failure
behavior.

**Other alternatives.** PostgreSQL-only is the safe current data
architecture; graph dual-write is rejected. Prisma remains the schema
authority; a ranker may use restricted read-only SQL access. The gateway
should use a bounded timeout and recency fallback where safe. The
Android client must never call the ranker directly.

## 2.4 Quality Attribute Scenarios

These are measurable scenarios, not claims that all have passed.

  -------------------------------------------------------------------------------
  Attribute          Stimulus /          Required response    Verification
                     environment                              
  ------------------ ------------------- -------------------- -------------------
  Performance        Candidate requests  Return eligible      Record p50/p95;
                     up to 50 cards;     ranked feed within   verify configured
                     DB/ranker healthy   approved SRS budget  1,000 ms ranker
                                                              timeout

  Availability       Ranker times out;   Safe recency         Fault-injection
                     gateway and DB      fallback or          test and response
                     healthy             normalized error; no assertion
                                         stack trace          

  Security           Unauthenticated     Reject before        Automated 401 tests
                     caller invokes      disclosure or        
                     protected route     mutation             

  Authorization      Candidate calls     Reject               403 and isolation
                     recruiter route or  cross-role/company   tests
                     recruiter accesses  access               
                     another company                          

  Internal security  Missing/invalid     Ranker rejects       Provider tests for
                     ranker key          request              missing, wrong and
                                                              valid `X-API-Key`

  Interoperability   Gateway calls       Exact path/DTO       Consumer/provider
                     ranker using agreed accepted; ordered    contract test;
                     contract            IDs/scores returned  current `dev`
                                                              interface fails
                                                              this criterion

  Integrity          Client retries same One logical swipe;   Unique constraint
                     swipe idempotency   original result      and integration
                     key                 replayed             test

  Privacy            Account deletion    Canonical deletion   Deletion and
                     while graph         follows policy;      graph-failure tests
                     projection          graph reconciliation 
                     unavailable         retries safely       

  Modifiability      Replace ranker      Internal adapter     Contract suite and
                     implementation      changes; public      architecture review
                                         Android DTO remains  
                                         stable               

  Portability        Android             Configurable API     Emulator `10.0.2.2`
                     emulator/physical   URL; correct host    and device LAN test
                     device connects     address              
                     locally                                  

  Observability      Request crosses     Correlated request   Log inspection and
                     app, gateway and    ID; sensitive values redaction tests
                     ranker              redacted             
  -------------------------------------------------------------------------------

## 2.5 Product-Line Reuse

No product-line platform or multiple deployed variants are in scope. The
reusable seam is the internal ranking interface. Any ranker must satisfy
the same authentication, request/response schema, timeout, error and
observability requirements.

# 3 Architecture Views

## 3.1 Module View

**View type:** Module. **Purpose:** source decomposition and dependency
direction.

``` mermaid
flowchart TB
  subgraph Android["Android — Kotlin / Jetpack Compose"]
    UI["Compose screens"] --> VM["ViewModels / UI state"] --> HTTP["HTTP client / DTOs"]
  end
  subgraph API["Fastify gateway — TypeScript"]
    ROUTES["Public routes"] --> AUTH["Authentication / authorization"]
    ROUTES --> FEED["Feed orchestration / ranker adapter"]
    ROUTES --> DBMOD["Prisma persistence"]
    FEED --> DBMOD
  end
  subgraph MAIN["main alternative — Express / TypeScript"]
    EH["Internal handler"] --> TAG["Eligibility + tag-overlap ranking"]
  end
  subgraph DEV["dev alternative — FastAPI / Python"]
    PH["Internal handler"] --> EMB["Eligibility + semantic embedding ranking"]
  end
  PG[("PostgreSQL 16")]
  NEO[("Neo4j — planned")]
  HTTP -->|"HTTP / JSON"| ROUTES
  DBMOD --> PG
  TAG -->|"read-only SQL"| PG
  EMB -->|"read-only SQL"| PG
  PG -.->|"future minimized projection"| NEO
```

**Figure 1.** Module decomposition. Express and FastAPI are branch
alternatives, not services intended to run together.

  --------------------------------------------------------------------------------
  Module                    Responsibility    Owner             Evidence/status
  ------------------------- ----------------- ----------------- ------------------
  Android                   Screens,          Peter             Native Android
  presentation/networking   navigation, API                     project
                            calls and DTO                       documented; build
                            mapping                             not re-run for
                                                                this SAD

  Fastify routes/auth       Public endpoints, Jean-Baptiste     Backend route/auth
                            validation,                         source
                            identity and role                   
                            checks                              

  Feed orchestration        Eligibility,      Jean-Baptiste     Backend feed
                            ranker call, card                   source;
                            hydration and                       integration
                            fallback                            depends on
                                                                contract

  Prisma persistence        Schema,           Alba /            Backend Prisma
                            migrations, seed  Jean-Baptiste     directory
                            and transactions                    

  Express ranker            Hard filters and  Nils              `main`
                            weighted tag                        matching-service
                            overlap                             source

  FastAPI ranker            SQL filtering,    Nils / `dev`      `dev`
                            Sentence          contribution      matching-service
                            Transformer and                     source
                            cosine ranking                      

  Graph harmonization       Minimized         Alba / Levis      Planned; no
                            projection,                         deployed
                            deletion and                        synchronizer
                            reconciliation                      established

  Tests/CI                  Unit, API,        All               Test assets may
                            contract and                        exist; pass status
                            integration                         not certified here
                            checks                              
  --------------------------------------------------------------------------------

Dependency rules: Android calls public Fastify endpoints only; Fastify
owns canonical writes and migrations; ranker reads approved inputs and
does not mutate business records; Neo4j is derived only; ranker
replacement requires contract tests.

## 3.2 Component-and-Connector View

**View type:** Component-and-connector. **Purpose:** runtime processes,
interfaces and trust boundaries.

``` mermaid
flowchart LR
  U["Candidate / Recruiter"] --> APP["Android app"]
  APP -->|"HTTP/JSON; HTTPS in hosted deployment"| API["Fastify :3000"]
  API -->|"internal HTTP + service key"| EX["Express ranker :4000 — main"]
  API -.->|"incompatible alternative"| FA["FastAPI ranker :4000 — dev"]
  API -->|"Prisma / SQL"| PG[("PostgreSQL 16")]
  EX -->|"SQL read"| PG
  FA -->|"SQL read"| PG
  PG -.-> GRAPH[("Neo4j — planned")]
```

**Figure 2.** Runtime context. The dashed FastAPI connector is an
alternative requiring contract and authentication correction.

  ---------------------------------------------------------------------------
  Connector               Protocol / port         Status / constraint
  ----------------------- ----------------------- ---------------------------
  Android → Fastify       HTTP/JSON; local API    Public interface; route/DTO
                          port 3000               parity must be tested

  Fastify → PostgreSQL    PostgreSQL via Prisma   Canonical data access;
                                                  migration parity remains a
                                                  gate

  Fastify → Express       Internal HTTP, port     Handler uses
  (`main`)                4000, `X-API-Key`       `/internal/matching/rank`
                                                  and `items` response

  Fastify → FastAPI       Internal HTTP, port     Exposes `/internal/rank`,
  (`dev`)                 4000                    returns different DTO and
                                                  inspected handler lacks
                                                  API-key validation

  Ranker → PostgreSQL     SQL read                Restrict DB credentials to
                                                  approved read-only data

  PostgreSQL → Neo4j      Future sync             Planned only
  ---------------------------------------------------------------------------

### Candidate feed sequence

``` mermaid
sequenceDiagram
  participant A as Android
  participant F as Fastify
  participant D as PostgreSQL
  participant R as Selected ranker
  A->>F: GET candidate feed + bearer token
  F->>F: Authenticate and authorize
  F->>D: Load candidate and eligible card context
  F->>R: Internal rank request + service key + request ID
  alt Valid rank response
    R-->>F: Ordered card IDs and scores
    F->>D: Hydrate authorized card DTOs
    F-->>A: Feed response
  else Timeout, unavailable or invalid response
    F->>D: Query safe recency fallback
    F-->>A: Fallback feed or normalized error
  end
```

**Figure 3.** Intended feed interaction, not evidence of a passing
end-to-end test.

Security boundaries: - Android is untrusted; authorization is enforced
server-side on every protected operation. - Recruiter access is scoped
to company membership. - Ranker endpoint is internal-only and requires a
service credential; network location alone is insufficient. - Secrets
are environment/secret-store values, never source or logs. - Passwords
use adaptive hashes; JWT expiry/revocation must match approved
requirements and deployed schema. - Ranking excludes protected
attributes, demographic proxies and photos. - Hosted/release traffic
requires TLS. - Logs may contain request ID, route, status and duration,
but must redact tokens, passwords, CVs and message bodies.

Failure behavior: matching calls are bounded (repository configuration
reviewed for this revision specifies 1,000 ms). Timeout, unavailable
service or malformed response must not become a false empty success. Use
safe recency fallback when possible; otherwise return a normalized
service error without stack traces.

## 3.3 Allocation View

**View type:** Allocation. **Purpose:** mapping to devices and execution
environments.

``` mermaid
flowchart TB
  subgraph PC["Developer workstation"]
    AS["Android Studio / Gradle"]
    subgraph COMPOSE["Docker Compose network"]
      API["Fastify :3000"]
      MATCH["Selected ranker :4000"]
      DB[("PostgreSQL :5432")]
      API --> MATCH
      API --> DB
      MATCH --> DB
    end
    VOL[("Persistent PostgreSQL volume")]
    DB --- VOL
  end
  subgraph DEVICE["Android emulator / device"]
    APK["AdoptAJob app"]
  end
  APK -->|"emulator 10.0.2.2:3000; device workstation LAN IP"| API
```

**Figure 4.** Local allocation. The ranker container is selected per
branch. Neo4j is omitted because a deployed graph service is not
established.

  -----------------------------------------------------------------------
  Element                 Allocation              Configuration / caveat
  ----------------------- ----------------------- -----------------------
  Android                 Emulator or physical    Configurable API base
                          device                  URL; emulator uses
                                                  `10.0.2.2`

  Fastify                 Local Node process or   Port 3000; DB URL, JWT
                          Compose container       secret, ranker URL,
                                                  timeout and service key
                                                  from environment

  Express ranker (`main`) Node process/container  Port 4000

  FastAPI ranker (`dev`)  Python 3.12 slim        Uvicorn port 4000;
                          process/container       model
                                                  availability/warm-up
                                                  required

  PostgreSQL              PostgreSQL 16 container Port 5432; persistent
                                                  volume and local
                                                  credentials

  Neo4j                   Not allocated in        Future version,
                          verified Compose        credentials, volume,
                          baseline                network, healthcheck
                                                  and backup required
  -----------------------------------------------------------------------

The `dev` matching image is Python-based while the inspected Compose
healthcheck invokes `node`. That check is invalid for a Python slim
image unless Node is deliberately installed. Replace it with a
Python-native or HTTP readiness probe and test actual health
transitions. `docker compose up` is not proof of successful startup. No
production TLS, secret manager, backup or disaster-recovery setup is
claimed.

## 3.4 Data View

**View type:** Data. **Purpose:** canonical entities, ownership,
relationships and lifecycle.

PostgreSQL 16 is the canonical relational store. Fastify owns schema
evolution through Prisma and migrations. Rankers read approved ranking
inputs and do not write canonical records. Neo4j, if implemented, is a
minimized derived projection.

### Logical entity catalogue

Exact physical presence must be verified against the selected branch's
Prisma schema and complete migration chain. In particular, `dev` v0.5
additions must not be assumed to exist on `main`.

  -----------------------------------------------------------------------
  Entity                              Purpose / relationships
  ----------------------------------- -----------------------------------
  `users`                             Candidate/recruiter accounts, role,
                                      unique email, password hash,
                                      acceptance fields where migrated

  `companies`                         Recruiter organizations; own cards
                                      and company membership

  `invitation_codes`                  Company join invitations, creator
                                      and usage state

  `candidate_profiles`                Optional candidate background,
                                      education and experience

  `tags`                              Normalized skill, role, sector,
                                      location and contract vocabulary

  `card_tags`                         Many-to-many card/tag relation

  `candidate_tags`                    Candidate preference/skill tags

  `cards`                             Company/job cards, status, content,
                                      location, contract, salary/perks,
                                      image URL and publish time

  `swipes`                            Candidate/card action and recruiter
                                      decision; idempotency key is a
                                      `dev` v0.5 design addition

  `matches`                           Accepted candidate/card
                                      relationship; `dev` v0.5 documents
                                      unique candidate/recruiter/card key

  `messages`                          Match, sender, message body and
                                      timestamp

  `applications`                      Match and optional CV storage
                                      reference/metadata

  `reports`                           Reporter, target type/ID and reason

  `revoked_tokens`                    JWT JTI, expiry and revocation
                                      timestamp; listed in `dev` v0.5
                                      design
  -----------------------------------------------------------------------

`main` database design is v0.4; `dev` database design is v0.5. The
latter describes additions including age/privacy acceptance fields,
swipe idempotency, revoked tokens and match uniqueness. Do not claim
those additions exist on `main` unless its migration chain confirms
them. Messages, applications, reports and revoked tokens are included in
the logical inventory; their exact migration status remains a gate.

``` mermaid
erDiagram
  COMPANIES ||--o{ USERS : employs
  COMPANIES ||--o{ CARDS : owns
  COMPANIES ||--o{ INVITATION_CODES : issues
  USERS ||--o| CANDIDATE_PROFILES : has
  USERS ||--o{ SWIPES : creates
  USERS ||--o{ MATCHES : participates
  USERS ||--o{ MESSAGES : sends
  USERS ||--o{ REPORTS : submits
  CARDS ||--o{ SWIPES : receives
  CARDS ||--o{ MATCHES : creates
  CARDS ||--o{ CARD_TAGS : classified_by
  TAGS ||--o{ CARD_TAGS : labels
  CANDIDATE_PROFILES ||--o{ CANDIDATE_TAGS : has
  TAGS ||--o{ CANDIDATE_TAGS : labels
  MATCHES ||--o{ MESSAGES : contains
  MATCHES ||--o| APPLICATIONS : may_receive
```

**Figure 5.** Logical relational overview, not a generated physical ERD.
It does not replace Prisma schema or migration SQL. `revoked_tokens` is
a standalone security entity and is not drawn.

### Neo4j projection --- planned only

The proposed graph may contain Candidate, Card, Company and Tag nodes,
with `LIKED`, `PASSED`, `GREEN_FLAGGED`, `RED_FLAGGED`, `HAS_TAG` and
`OF_COMPANY` relationships. It must exclude credentials, emails, names,
messages, CV contents, protected attributes and photos. PostgreSQL
remains canonical. Before graph activation, implement and test deletion
propagation, bounded retries, reconciliation, failure-safe rebuilds and
the required synchronization cadence. The last good graph must not be
destroyed by a failed rebuild. No live Neo4j connector is claimed.

### Data lifecycle and protection

-   Use a read-only, least-privilege DB account for ranking.
-   Store passwords as adaptive hashes; never log tokens or secrets.
-   Scope candidate/recruiter data by identity, role and company
    membership.
-   Apply SRS retention and account-deletion rules.
-   Store CVs in controlled storage with metadata and access checks if
    supported.
-   Use synthetic data for tests and demonstrations.
-   Obtain explicit retention/minimization approval for reports
    retaining target identifiers after target deletion.

# 4 Relations Among Views and Reconciliation

  ------------------------------------------------------------------------------
  Module              Runtime component Allocation             Data
                                                               responsibility
  ------------------- ----------------- ---------------------- -----------------
  Android UI/network  Android client    Emulator/device        No direct
                                                               database
                                                               authority

  Fastify             Fastify API       Workstation/Compose,   Canonical writes
  route/auth/feed                       port 3000              and authorization

  Express ranker      `main` Express    Node, port 4000        Reads ranking
                      process                                  inputs; returns
                                                               IDs/scores

  FastAPI ranker      `dev` FastAPI     Python 3.12, port 4000 Alternative
                      process                                  ranking
                                                               implementation;
                                                               incompatible
                                                               interface

  Prisma              Backend           Backend build +        Physical
  schema/migrations   persistence       PostgreSQL             relational schema
                                                               authority

  Graph harmonizer    Future sync       Future graph runtime   Derived
                      process                                  projection only
  ------------------------------------------------------------------------------

### 4.1 Branch reconciliation

The branch comparison reports `main` four commits ahead and `dev` two
commits ahead of common base `a921065d9dbd85906da1696bb04262f66a70bb16`.
The `dev` branch replaces the TypeScript/Express ranker with
Python/FastAPI and Sentence Transformers. The implementations are
alternatives until the team selects and integrates one.

``` mermaid
flowchart TD
  BASE["Common base a921065"]
  MAIN["main — 4 commits ahead"]
  DEV["dev — 2 commits ahead"]
  BASE --> MAIN
  BASE --> DEV
  MAIN --> EX["Express / Node\nweighted tag overlap"]
  DEV --> PY["FastAPI / Python\nSentence Transformers"]
  EX --> EXPECT["Target: POST /internal/matching/rank\nX-API-Key\nitems[{cardId, score}]"]
  PY --> ACTUAL["Observed dev: POST /internal/rank\ncardIds + cards\nno key check in inspected handler"]
  EXPECT --> GATE["Align contract, security tests,\nselect and merge baseline"]
  ACTUAL --> GATE
```

**Figure 6.** Branch reconciliation and integration gate; not a combined
runtime.

### 4.2 Cross-view invariants

1.  Every module dependency maps to an allowed runtime connector.
2.  Every runtime process has an allocation and configuration entry.
3.  Every physical data entity is represented or explicitly excluded.
4.  Planned components/connectors are labelled and drawn as planned.
5.  Ranker replacement preserves the internal contract or introduces a
    versioned migration.
6.  Healthchecks use tools available in their container image.
7.  SRS defines desired behavior; source/migrations show implementation
    presence; tests and execution records establish verification.
8.  Express on `main` and FastAPI on `dev` are never presented as one
    integrated service.
9.  OpenAPI, API contract, handlers, Android DTOs and tests agree.
10. Neo4j is not a second canonical write store.

### 4.3 Integration issue register

  ------------------------------------------------------------------------------------
  ID                Finding                      Impact              Required
                                                                     disposition
  ----------------- ---------------------------- ------------------- -----------------
  INT-01            Branches diverged            No single merged    Select
                                                 baseline            merge/rebase
                                                                     strategy and pin
                                                                     SHA

  INT-02            Express/FastAPI algorithm    Different           Evaluate on
                    and runtime differ           operational and     common synthetic
                                                 ranking behavior    fixtures

  INT-03            Gateway expects              Route mismatch      Align path or
                    `/internal/matching/rank`;                       adapter
                    FastAPI exposes                                  
                    `/internal/rank`                                 

  INT-04            Gateway expects              DTO mismatch        Agree DTO and
                    `items[{cardId,score}]`;                         contract tests
                    FastAPI returns `cardIds`                        
                    and `cards`                                      

  INT-05            Inspected FastAPI handler    Internal            Add key
                    lacks `X-API-Key` check      authentication gap  validation and
                                                                     negative tests

  INT-06            `dev` Python image uses Node Incorrect health    Replace with
                    healthcheck                  status              Python/HTTP
                                                                     readiness probe

  INT-07            OpenAPI, API_CONTRACT and    Stale interface     Reconcile paths,
                    routes require parity        documentation       schemas and tests

  INT-08            Database design v0.4/v0.5    Schema claims may   Audit selected
                    differ                       not match           branch migration
                                                 migrations          chain

  INT-09            Neo4j is design-only         Graph               Keep planned
                                                 features/deletion   until tests pass
                                                 not operational     

  INT-10            Full-stack execution not run End-to-end          Execute Appendix
                    in this document pass        reliability         A gates
                                                 unverified          
  ------------------------------------------------------------------------------------

# 5 Referenced Materials

  ----------------------------------------------------------------------------------------------------------------------------------
  Ref                     Material                                                                           Purpose
  ----------------------- ---------------------------------------------------------------------------------- -----------------------
  R1                      [Branch comparison](https://github.com/bhsei/26A/compare/main...dev)               Branch divergence

  R2                      [SRS](https://github.com/bhsei/26A/blob/main/docs/requirements/SRS.md)             Requirements

  R3                      [API contract](https://github.com/bhsei/26A/blob/main/docs/design/API_CONTRACT.md) API v1 intent

  R4                      [OpenAPI](https://github.com/bhsei/26A/blob/main/docs/design/openapi.yaml)         Machine-readable API

  R5                      [Database design](https://github.com/bhsei/26A/blob/main/docs/design/database.md)  Data model and graph
                                                                                                             plan

  R6                      [Prisma                                                                            Physical schema
                          schema](https://github.com/bhsei/26A/blob/main/src/backend/prisma/schema.prisma)   evidence

  R7                      [Backend README](https://github.com/bhsei/26A/blob/main/src/backend/README.md)     Backend setup

  R8                      [Main matching                                                                     Express implementation
                          service](https://github.com/bhsei/26A/tree/main/src/matching-service)              

  R9                      [Dev matching service](https://github.com/bhsei/26A/tree/dev/src/matching-service) FastAPI alternative

  R10                     [Dev ranker entry                                                                  FastAPI route and
                          point](https://github.com/bhsei/26A/blob/dev/src/matching-service/main.py)         ranking

  R11                     [Docker Compose](https://github.com/bhsei/26A/blob/main/docker-compose.yml)        Local allocation

  R12                     [Android README](https://github.com/bhsei/26A/blob/main/src/mobile/README.md)      Android API
                                                                                                             configuration

  R13                     [SEI Views and                                                                     Architecture method
                          Beyond](https://resources.sei.cmu.edu/library/asset-view.cfm?assetid=513807)       

  R14                     [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)                 API description
                                                                                                             standard

  R15                     [Prisma documentation](https://www.prisma.io/docs)                                 ORM/migrations
  ----------------------------------------------------------------------------------------------------------------------------------

# 6 Repository Directory

  Path                            Purpose
  ------------------------------- ----------------------------------
  `README.md`                     Project overview and setup
  `docs/requirements/SRS.md`      Requirements
  `docs/design/SAD.md`            This SAD
  `docs/design/API_CONTRACT.md`   API v1 contract
  `docs/design/openapi.yaml`      OpenAPI definition
  `docs/design/database.md`       Database design
  `src/mobile/AdoptAJob/`         Native Android application
  `src/backend/`                  Fastify API and Prisma
  `src/matching-service/`         Branch-specific matching service
  `docker-compose.yml`            Local service orchestration
  `tests/`                        Test assets, where present
  `plans/`, `worklogs/`           Planning and team records
  `.github/`                      Workflows and issue templates

# 7 Sample Figures and Tables

This heading is retained to preserve the source template structure. It
is not a second home for project evidence. AdoptAJob figures and tables
appear in the relevant view packet (§3), cross-view discussion (§4) or
appendices. Template examples are illustrative only and must not be
mistaken for implemented project content.

# Appendix A --- Reconciliation Log and Acceptance Gates

## A.1 Review-finding disposition

  ---------------------------------------------------------------------------
  Review finding                          Resolution in revision 1.5
  --------------------------------------- -----------------------------------
  Project content under sample            Project figures/tables moved to
  figures/tables                          §§3--4; §7 is template guidance

  Incorrect viewpoint names               Uses Module,
                                          Component-and-Connector, Allocation
                                          and Data

  Missing alternatives                    Adds Express/FastAPI,
                                          PostgreSQL/Neo4j and
                                          service-boundary decisions

  Missing quality scenarios               Adds stimulus, environment,
                                          response and verification measures

  Missing error-reporting process         Adds issue, classification,
                                          ownership, review and closure
                                          workflow

  Acquirer stakeholder missing            Added to §1.2

  TOC depth inadequate                    Adds nested section entries

  Graph caption inconsistent with         Separates relational ER overview
  relational diagram                      and planned graph projection

  Missing                                 Added to logical entity catalogue
  messages/applications/reports/revoked   with migration caveats
  tokens                                  

  Python migration not represented        Records branch-specific Express and
                                          FastAPI alternatives

  Ranker route/DTO/key mismatch           Records exact incompatibility and
                                          contract gate

  Python image uses Node healthcheck      Records correction requirement

  OpenAPI version/path stale              Records observed version 1.0.0;
                                          requires API parity

  References pointed to unavailable       Uses branch comparison and
  commits                                 repository artifact links

  Database design version stale           Records `main` v0.4 and `dev` v0.5
                                          separately

  Verification overstated                 Explicitly states no full-stack
                                          execution in this document pass
  ---------------------------------------------------------------------------

## A.2 Approval gates

  ------------------------------------------------------------------------
  Gate                    Required evidence        Owner(s)
  ----------------------- ------------------------ -----------------------
  G-01 Branch baseline    Selected merge/rebase    Team/maintainer
                          and immutable full SHA   

  G-02 Ranker decision    Comparative results on   Nils/team
                          common synthetic dataset 

  G-03 Internal contract  Path, DTO, request ID,   Jean-Baptiste/Nils
                          key and error contract   
                          tests                    

  G-04 Container          Compose startup and      Jean-Baptiste
  readiness               healthchecks pass on     
                          selected branch          

  G-05 Database parity    Prisma schema,           Alba/Jean-Baptiste
                          migrations, design       
                          version and SAD agree    

  G-06 API parity         OpenAPI, API contract,   Jean-Baptiste/Peter
                          routes and Android DTOs  
                          agree                    

  G-07 Security           401/403, company scope,  Jean-Baptiste
                          token revocation,        
                          service auth and         
                          redaction tests          

  G-08 Feed behavior      Eligibility, no          Nils/Jean-Baptiste
                          duplicates/swiped cards, 
                          ranking, fallback and    
                          pagination tests         

  G-09 Recruiter workflow Interest → review →      Jean-Baptiste/Peter
                          accept/decline → scoped  
                          match tests              

  G-10 Graph projection   Minimization, deletion,  Alba/Levis
                          retries, reconciliation  
                          and failure tests        

  G-11 Android            Build and recorded       Peter/team
  demonstration           login/feed/swipe/match   
                          workflow                 

  G-12 Submission review  SAD, SRS, API, DB,       Team/acquirer
                          figures, references and  
                          revision reviewed        
  ------------------------------------------------------------------------

**Verification limitation:** this document-generation pass inspected
repository artifacts and branch metadata but did not execute Docker
Compose, Prisma migrations, live HTTP integration, Android Gradle
builds, emulator workflows or the automated test suite. No passing
result is claimed. Close gates only with evidence tied to the selected
commit SHA.

# Appendix B --- Interface Contract Crosswalk

  ---------------------------------------------------------------------------------
  Boundary                Intended contract                 Observed branch state /
                                                            issue
  ----------------------- --------------------------------- -----------------------
  Android → Fastify       Public API v1, bearer             Android README
                          authentication, JSON DTOs         documents local API
                                                            configuration; live
                                                            compatibility requires
                                                            tests

  Fastify → PostgreSQL    Prisma canonical persistence      Schema/migrations
                                                            exist; branch versions
                                                            differ

  Fastify → ranker        `POST /internal/matching/rank`,   Express on `main`
                          `X-API-Key`, request ID, response follows expected
                          `items: [{cardId, score}]`        route/shape; FastAPI on
                                                            `dev` exposes
                                                            `/internal/rank`,
                                                            returns
                                                            `cardIds`/`cards`, and
                                                            inspected handler does
                                                            not validate key

  Ranker → PostgreSQL     Read-only approved ranking inputs SQL reads exist;
                                                            least-privilege account
                                                            must be verified

  PostgreSQL → Neo4j      Minimized deletion-safe           Planned only
                          projection                        
  ---------------------------------------------------------------------------------

### B.1 Contract rules

1.  Android public API is independent of ranker technology.
2.  Ranker returns internal IDs/scores; Fastify hydrates public card
    DTOs.
3.  Fastify validates ranker responses at runtime.
4.  `X-API-Key` is mandatory for internal ranker calls.
5.  Route, request/response DTO, auth and errors agree across caller,
    provider, OpenAPI and tests.
6.  Breaking changes require versioned contract and coordinated
    consumer/provider updates.
7.  Observed OpenAPI `info.version` is 1.0.0; do not cite stale 0.1.0 or
    plural `/candidates/...` paths as current without verifying the
    file.

# Appendix C --- Review Checklist

-   [ ] Final branch and full commit SHA recorded.
-   [ ] Claims labelled
    required/designed/present/tested/build-verified/demonstrated/planned/unverified.
-   [ ] SRS, API routes and DTOs cross-checked.
-   [ ] Prisma schema and full migration chain checked on selected
    commit.
-   [ ] Entity catalogue matches schema or marks planned entities.
-   [ ] Mermaid diagrams render and captions match actual status.
-   [ ] Ranker route, DTO, key, timeout and fallback covered by contract
    tests.
-   [ ] Docker healthchecks match container images.
-   [ ] Android builds and connects to selected backend.
-   [ ] Candidate and recruiter workflows pass integration tests.
-   [ ] Privacy, deletion, token revocation and authorization tests
    pass.
-   [ ] Neo4j remains planned until implementation and failure tests
    pass.
-   [ ] TOC, references, revision history and metadata are consistent.
-   [ ] Independent reviewer records approval or requested changes.

------------------------------------------------------------------------

**End of Software Architecture Document**
