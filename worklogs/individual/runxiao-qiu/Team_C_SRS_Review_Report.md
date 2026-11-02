# Peer Review: Team C — SecondHelping — Software Requirements Specification v1.1

**Reviewing team:** Team A (AdoptAJob)  
**Reviewed team:** Team C (The Debuggers)  
**Document:** Software Requirements Specification  
**Version reviewed:** v1.1 (Markdown edition, 28 October 2026), repository `bhsei/26C`  
**Review date:** 2026-11-02  
**Prepared by:** Runxiao Qiu (Team A)  
**Review issue:** https://github.com/bhsei/26C/issues/<number>

## Review scope

This is an SRS-only review of the Markdown edition v1.1 (28 October 2026) of the SecondHelping SRS in bhsei/26C. It covers clarity, consistency, completeness, verifiability and traceability. Source code, test runs and the deployed prototype were not assessed. Statuses and implementation statements are treated as claims made by the SRS.

## Review summary

**Strengths.** Every functional requirement has a status, a MoSCoW priority, a rationale, preconditions, numbered acceptance criteria and a verification method; v1.1 splits composite requirements into atomic ones; concurrency and idempotency (reservations, payment, settlement, reminders) are specified explicitly; the decision to run all AI on local models is clear and applied consistently; the SRS separates implemented and planned work and lists the known limitations of the prototype openly (Section 4.2).

**Main concerns.** Allergen safety partly depends on an unvalidated language model; the order lifecycle has gaps (unpaid reservations hold stock without a deadline, no-shows are fully refunded, pickup does not check the code, settlement depends on site traffic); quality-of-service, security and data-protection obligations are not written as numbered, testable requirements; "Implemented" statuses are not backed by traceable test evidence.

| Severity | Findings |
|---|---:|
| Severe | 1 |
| Moderate | 8 |
| Minor | 6 |
| **Total** | **15** |

**Overall recommendation:** revision recommended before the document is used as the baseline for the next development phase.

## Findings index

| # | Title | Location | Type | Severity |
|---|---|---|---|---|
| 1 | Allergen safety depends on an unvalidated language model | REQ-FUNC-019 (AC4); REQ-FUNC-009 (AC3, AC4); Section 4.2; Section 3.6 | Verifiability | Severe |
| 2 | Unpaid reservations hold stock without a deadline | REQ-FUNC-010 (AC1); REQ-FUNC-011; REQ-FUNC-012 (AC3); Section 4.2 (student cancellation) | Completeness | Moderate |
| 3 | Order lifecycle is incomplete (no-shows, uncollected orders, withdrawal of unpaid orders) | REQ-FUNC-012 (statement, rationale, AC1, AC3); REQ-FUNC-007 (AC4); REQ-FUNC-015 (AC2); REQ-FUNC-017 (AC2); Appendix B | Consistency | Moderate |
| 4 | Pickup confirmation does not verify the pickup code | REQ-FUNC-013 (rationale); REQ-FUNC-014 (status, statement, preconditions, AC1-AC4) | Completeness | Moderate |
| 5 | Settlement only runs when someone uses the application | REQ-FUNC-012 (AC5); REQ-FUNC-007 (AC2); REQ-FUNC-017 (AC2, AC3); REQ-FUNC-018 (AC5); Section 2.5 | Consistency | Moderate |
| 6 | Quality-of-service requirements are not testable | Section 3.3 (3.3.1-3.3.4); Section 2.3; Section 3.1.1 | Verifiability | Moderate |
| 7 | "Implemented" statuses are not backed by traceable evidence | Section 3.2 (definition of "Implemented" and summary table); Section 4.1; verification methods of REQ-FUNC-001 to REQ-FUNC-020 | Verifiability | Moderate |
| 8 | Data-protection obligations are not specified | Section 3.4; Section 2.3; Section 1.2; Appendix B | Completeness | Moderate |
| 9 | No measurable quality criteria for the AI features | REQ-FUNC-019; REQ-FUNC-020 (verification method); Section 3.6; Section 4 | Verifiability | Moderate |
| 10 | Reminder timing and "sent" flags do not match | REQ-FUNC-018 (statement, AC1, AC3); Section 4.1; Appendix B | Consistency | Minor |
| 11 | Role names are inconsistent | REQ-FUNC-003 (AC3); Section 1.3; Section 2.4; REQ-FUNC-010 (statement, preconditions); Appendix A | Ambiguity | Minor |
| 12 | Security gaps are listed as limitations, not requirements | REQ-FUNC-001 (AC5); Section 2.3; Section 4.2 (reminder endpoint); Appendix A (`/api/notifications`); Section 3.3.2 | Consistency | Minor |
| 13 | Price, discount and fees are not defined | REQ-FUNC-006 (statement, AC2); REQ-FUNC-008 (AC2); REQ-FUNC-011 (AC2); REQ-FUNC-012 (statement, AC1); REQ-FUNC-015 (AC3); Section 2.6 | Ambiguity | Minor |
| 14 | Target deployment environment is not specified | Section 3.1.2; Section 2.5; Section 3.5 (notifications); Appendix D; REQ-FUNC-018 (preconditions, AC5); REQ-FUNC-019 and REQ-FUNC-020 (preconditions) | Completeness | Minor |
| 15 | Document organisation and traceability details | Section 1.4; Section 3.1.1; REQ-FUNC-009 (AC3); Appendix B; Revision history; Section 3.5 | Other | Minor |

## Detailed findings

### Finding 1 of 15 — Allergen safety depends on an unvalidated language model (Severe)

**Location:** REQ-FUNC-019 (AC4); REQ-FUNC-009 (AC3, AC4); Section 4.2; Section 3.6  
**Type:** Verifiability  
**Severity:** Severe  
**Finding:** REQ-FUNC-019 AC4 requires the chat assistant to exclude meals containing the allergens a student mentions, and the requirement is marked Implemented. The answer is produced by a small local model (`qwen2:7b`), and Section 4.2 itself states that small models "may occasionally summarize imperfectly". No requirement defines how allergen answers are evaluated (test questions, phrasings, accuracy threshold), what happens when an allergen is unknown or written differently from the catalog (e.g. "peanuts" vs "nuts"), or whether the answer carries a warning. REQ-FUNC-009 AC4 protects the filter against presenting incomplete allergen data as safe, but REQ-FUNC-019 has no equivalent criterion. This matters because a wrong answer here is a health risk for the student, not just a usability issue, and the student is likely to trust a conversational answer.  
**Recommendation:** Either remove allergen filtering from the assistant and direct users to the deterministic filter of REQ-FUNC-009, or add criteria that make it safe and testable: allergen exclusion is done by the tool on catalog data rather than by the model, unknown or incomplete allergen data is never described as safe, every allergen answer shows a fixed disclaimer, and a documented test set of allergen questions must pass at 100% before the status can be Implemented.

### Finding 2 of 15 — Unpaid reservations hold stock without a deadline (Moderate)

**Location:** REQ-FUNC-010 (AC1); REQ-FUNC-011; REQ-FUNC-012 (AC3); Section 4.2 (student cancellation)  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** REQ-FUNC-010 AC1 reduces inventory as soon as an order is created in PENDING_PAYMENT, before the student pays. No requirement sets a payment deadline: according to REQ-FUNC-012 AC3, an unpaid order is only released when the listing expires at the end of the pickup window. Section 4.2 also states that students cannot cancel a reservation. As a result, a student who opens the payment page and leaves, or a user who reserves repeatedly without paying, can make a listing appear SOLD_OUT until it expires, and the food is wasted, which is the opposite of the product's goal. No limit on the number of open unpaid orders per user is specified either.  
**Recommendation:** Add a requirement for a payment hold time (for example, an unpaid order expires and its quantity is returned to the listing after N minutes), with criteria for restoring inventory and reverting SOLD_OUT to ACTIVE. Consider a limit on open unpaid orders per user, and either allow students to cancel unpaid orders or state explicitly why this is excluded.

### Finding 3 of 15 — Order lifecycle is incomplete (no-shows, uncollected orders, withdrawal of unpaid orders) (Moderate)

**Location:** REQ-FUNC-012 (statement, rationale, AC1, AC3); REQ-FUNC-007 (AC4); REQ-FUNC-015 (AC2); REQ-FUNC-017 (AC2); Appendix B  
**Type:** Consistency  
**Severity:** Moderate  
**Finding:** REQ-FUNC-012 AC1 refunds every RESERVED order in full when the pickup window ends, so a student who paid and simply did not come gets all their money back. This goes beyond the rationale ("meals they could not collect") and removes any incentive to pick up, while the dining hall loses the food. REQ-FUNC-017 AC2 describes this case as "order expired after a missed pickup window", which confirms that no-shows are refunded. REQ-FUNC-015 AC2 refers to "uncollected reservations" as a category separate from expired ones, but no such state exists. REQ-FUNC-007 AC4 covers only paid orders when a listing is withdrawn, so the resulting state of PENDING_PAYMENT orders (EXPIRED or CANCELLED) is not specified. The order states are spread across several requirements and no single place defines all states and allowed transitions.  
**Recommendation:** Add an order state model (table or diagram) with every state (PENDING_PAYMENT, RESERVED, PICKED_UP, EXPIRED, CANCELLED and, if needed, NO_SHOW) and the event that triggers each transition. Decide and document the refund policy for no-shows separately from the policy for listings that expire or are withdrawn by the dining hall. Align REQ-FUNC-015 AC2 with the defined states and specify what happens to unpaid orders on withdrawal.

### Finding 4 of 15 — Pickup confirmation does not verify the pickup code (Moderate)

**Location:** REQ-FUNC-013 (rationale); REQ-FUNC-014 (status, statement, preconditions, AC1-AC4)  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** REQ-FUNC-013 presents the pickup code as "the shared secret that links a student's reservation to a physical meal collection", and the status of REQ-FUNC-014 mentions "code-based confirmation in the dashboard". However, neither the statement nor any acceptance criterion of REQ-FUNC-014 requires the staff member to enter the code or the system to check it. The only precondition is that the order "has an associated pickup code". As written, a staff member could confirm any eligible order of their hall from a list, and the meal could be handed to the wrong person without the requirement being violated. The behaviour for a wrong, mistyped or already-used code is also not specified.  
**Recommendation:** State in REQ-FUNC-014 that pickup is confirmed by entering (or later scanning) the pickup code, and add criteria for a matching code (order marked PICKED_UP), a wrong or unknown code (rejected with a message, no state change), a code from another dining hall and an already-used code. Add these cases to the verification table in Section 4.1.

### Finding 5 of 15 — Settlement only runs when someone uses the application (Moderate)

**Location:** REQ-FUNC-012 (AC5); REQ-FUNC-007 (AC2); REQ-FUNC-017 (AC2, AC3); REQ-FUNC-018 (AC5); Section 2.5  
**Type:** Consistency  
**Severity:** Moderate  
**Finding:** REQ-FUNC-012 AC5 says settlement "runs automatically when relevant pages or actions are used, so expiry does not depend on a specific user visiting a specific page". This still depends on somebody using the application: if nobody opens a relevant page after a pickup window ends, listings are not marked EXPIRED, refunds are not recorded and the expiry notifications of REQ-FUNC-017 are not sent. The SRS already has a scheduler that runs every minute for reminders (REQ-FUNC-018 AC5), but it is not used for settlement. No maximum delay between the end of a pickup window and settlement is defined, so AC5 cannot pass or fail.  
**Recommendation:** Specify a maximum settlement delay (for example, within two minutes of the end of the pickup window) and the mechanism that guarantees it, such as the existing scheduler. Reword AC5 into a measurable criterion and add a verification activity in Section 4.1 where no user interacts with the system after the window ends.

### Finding 6 of 15 — Quality-of-service requirements are not testable (Moderate)

**Location:** Section 3.3 (3.3.1-3.3.4); Section 2.3; Section 3.1.1  
**Type:** Verifiability  
**Severity:** Moderate  
**Finding:** All quality requirements are written as prose with "shall", without IDs, rationale, acceptance criteria or entries in the verification table. Section 3.3.1 asks for "acceptable campus-scale response times" and says AI responses "may take longer" without any upper limit; Section 3.3.4 asks for availability "during expected operating periods" without defining those periods or a target. There is no figure for the number of concurrent users, requests or listings the prototype must support, no timeout for the chat assistant or the image matcher (a 7B chat model and a vision model on a laptop can take a long time), and no usability or accessibility requirement although Section 2.3 requires the system to work in standard browsers. A tester cannot decide whether any of these requirements is met.  
**Recommendation:** Convert each quality statement into a numbered requirement (for example REQ-PERF, REQ-REL, REQ-AVAIL, REQ-SEC) with measurable criteria: response time for marketplace actions at a stated load, maximum waiting time for the assistant and the image matcher and what the UI shows when it is exceeded, operating hours and availability target, and an accessibility target with the pages in scope. Add them to Section 4.1.

### Finding 7 of 15 — "Implemented" statuses are not backed by traceable evidence (Moderate)

**Location:** Section 3.2 (definition of "Implemented" and summary table); Section 4.1; verification methods of REQ-FUNC-001 to REQ-FUNC-020  
**Type:** Verifiability  
**Severity:** Moderate  
**Finding:** Section 3.2 defines "Implemented" as "available and verified in the current prototype", and 19 requirements carry this status. However, Section 4.1 only lists planned verification activities and expected evidence; it does not name the tests, the date they were run, who ran them or the result. Most verification methods are "Demonstration". Several criteria mention tests that are not identified anywhere, for example the "concurrent reservation tests" of REQ-FUNC-010, the "settlement tests" of REQ-FUNC-012 and the "scheduler-driven tests" of REQ-FUNC-018. A reader therefore cannot check that a requirement was actually verified, and the status cannot be reproduced after a code change.  
**Recommendation:** Extend the table in Section 4.1 with the test or demonstration identifier (test file or script, or a dated demonstration record), the date of the last run and the result (pass/fail). Keep a requirement as Partially implemented until every acceptance criterion has recorded evidence.

### Finding 8 of 15 — Data-protection obligations are not specified (Moderate)

**Location:** Section 3.4; Section 2.3; Section 1.2; Appendix B  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** Section 3.4 contains one general paragraph ("handle student and staff account data responsibly", "store only the minimum user information") without requirement IDs or criteria. The SRS does not name the applicable data-protection regime, does not define what users are told at signup (what is collected, why, for how long), and has no requirement for consent, retention periods or account and data deletion. Orders, notifications and pickup history are kept indefinitely as far as the SRS states, and the future modules (Section 3.6) plan to use class schedules and reservation behaviour, which makes the question more important. The commitment that AI data stays local is good, but it is the only data-protection rule that is concretely stated.  
**Recommendation:** Add a compliance requirement that names the applicable regime (for example PIPL for a deployment at Beihang; the team should confirm) and turn Section 3.4 into numbered requirements with criteria: a privacy notice shown at signup, retention periods for orders, notifications and sessions, the right to delete an account and its data, and a data-minimisation check for each stored field in Appendix B.

### Finding 9 of 15 — No measurable quality criteria for the AI features (Moderate)

**Location:** REQ-FUNC-019; REQ-FUNC-020 (verification method); Section 3.6; Section 4  
**Type:** Verifiability  
**Severity:** Moderate  
**Finding:** REQ-FUNC-020 is verified by "evaluation against labeled meal photos", but the SRS does not define the size or composition of the photo set, the metric (for example top-1 accuracy over the catalog) or the threshold that the matcher must reach. REQ-FUNC-019 AC2 requires answers to come "from live database records through the defined tools, not from model memory", and AC5 requires small talk to be answered "briefly without invoking data tools", but no procedure is given to check either property on a representative set of questions. The default models are named, but no requirement says that changing the model (allowed through environment variables) requires re-running an evaluation. Without thresholds, these requirements cannot fail.  
**Recommendation:** Specify, even as provisional values, an evaluation set for each AI feature (number and type of photos or questions), the metrics, the pass thresholds and the procedure, and require re-evaluation when the configured model changes. Tie the Implemented status of REQ-FUNC-019 and the partial status of REQ-FUNC-020 to these results.

### Finding 10 of 15 — Reminder timing and "sent" flags do not match (Minor)

**Location:** REQ-FUNC-018 (statement, AC1, AC3); Section 4.1; Appendix B  
**Type:** Consistency  
**Severity:** Minor  
**Finding:** AC1 defines three reminders (window opens in about ten minutes, window is open, window closes in about thirty minutes), and the statement says each is generated at most once. AC3 and Appendix B list only two per-order flags (`reminderOpenSent`, `reminderCloseSent`), so it is unclear how the third reminder is prevented from repeating, or whether "opens soon" and "is open" are in fact one reminder. "Approximately ten" and "approximately thirty" minutes have no tolerance, and the behaviour for an order paid after a reminder time has already passed (for example, paid during the window) is not specified.  
**Recommendation:** State the exact number of reminders, the trigger time and tolerance of each (for example ±1 minute, matching the one-minute scheduler), and the flag that guards each one. Specify which reminders are sent, or skipped, for orders paid after a trigger time.

### Finding 11 of 15 — Role names are inconsistent (Minor)

**Location:** REQ-FUNC-003 (AC3); Section 1.3; Section 2.4; REQ-FUNC-010 (statement, preconditions); Appendix A  
**Type:** Ambiguity  
**Severity:** Minor  
**Finding:** REQ-FUNC-003 AC3 requires "the SUPERVISOR role", which is not defined in Section 1.3; elsewhere the document uses "Staff Member", the route is `/merchant`, and REQ-FUNC-002 uses the STUDENT role. Section 2.4 lists "campus operations staff and administrators" as a user group, but there is no corresponding role or function (the impact report is restricted to the staff of one dining hall). REQ-FUNC-010 allows any "authenticated user" to reserve, so it is not clear whether staff members can reserve meals, although AC6 then refers to "the student".  
**Recommendation:** Define each role once in Section 1.3 with its exact system name (for example STUDENT and SUPERVISOR = Staff Member) and use it consistently. State whether campus administrators are a role in this phase or a future group, and restrict REQ-FUNC-010 to students if that is the intent.

### Finding 12 of 15 — Security gaps are listed as limitations, not requirements (Minor)

**Location:** REQ-FUNC-001 (AC5); Section 2.3; Section 4.2 (reminder endpoint); Appendix A (`/api/notifications`); Section 3.3.2  
**Type:** Consistency  
**Severity:** Minor  
**Finding:** REQ-FUNC-001 AC5 upgrades "legacy accounts with unhashed passwords" on their next login, which means plaintext passwords exist in the database until that login and contradicts the constraint in Section 2.3 that passwords must not be stored in plaintext. Section 4.2 states that the reminder endpoint has no authentication and "must be restricted before any non-local deployment", but no requirement captures this. There is also no requirement against repeated login attempts (rate limiting or lockout), although REQ-FUNC-001 protects all accounts with a password only.  
**Recommendation:** Add a requirement or migration step that hashes all remaining legacy passwords at once, so AC5 is no longer needed. Turn the restriction of the reminder endpoint into a numbered security requirement with a precondition for non-local deployment, and add a login rate-limiting criterion to REQ-FUNC-001 or Section 3.3.2.

### Finding 13 of 15 — Price, discount and fees are not defined (Minor)

**Location:** REQ-FUNC-006 (statement, AC2); REQ-FUNC-008 (AC2); REQ-FUNC-011 (AC2); REQ-FUNC-012 (statement, AC1); REQ-FUNC-015 (AC3); Section 2.6  
**Type:** Ambiguity  
**Severity:** Minor  
**Finding:** The actual amounts are naturally chosen by each dining hall, but the rules that turn them into what the student pays are system behaviour and are not specified. REQ-FUNC-006 asks staff for both a "price" and a "discount", and REQ-FUNC-008 displays "original and discounted prices", but the SRS does not say whether the entered price is the original or the final price, or how the discounted price is calculated and rounded. REQ-FUNC-011 shows "fees" and REQ-FUNC-012 refunds "platform and service fees", but no requirement says who sets these fees (the platform or each dining hall), how they are calculated or who receives them, while Section 2.6 describes a "fixed discount model". Student savings in REQ-FUNC-015 depend on these values, so they cannot be checked.  
**Recommendation:** Without fixing any amounts, define the meaning of each pricing field, the formula for the discounted price including rounding to cents, and for each fee who sets it and how it is calculated (or remove fees from the prototype). Reference the formula from REQ-FUNC-015 and REQ-FUNC-016.

### Finding 14 of 15 — Target deployment environment is not specified (Minor)

**Location:** Section 3.1.2; Section 2.5; Section 3.5 (notifications); Appendix D; REQ-FUNC-018 (preconditions, AC5); REQ-FUNC-019 and REQ-FUNC-020 (preconditions)  
**Type:** Completeness  
**Severity:** Minor  
**Finding:** The SRS describes only a local development setup. Section 3.5 and Appendix D state that the reminder scheduler (`cron.js`) is "started together with the development server" (`pnpm dev`), and Section 3.1.2 says the AI models run on "typically the developer's or a campus server". No requirement defines where the system runs for the demo or for real users, what hardware the Ollama server needs (memory, GPU) to serve `qwen2:7b` and `qwen2.5vl:3b` at an acceptable speed, or how the scheduler is started outside development mode. Implemented requirements depend on this: REQ-FUNC-018 only works while the scheduler runs, and REQ-FUNC-019 and REQ-FUNC-020 only work while the model server is reachable. Section 4.2 already notes that the reminder endpoint must be restricted "before any non-local deployment", which shows that such a deployment is expected but not specified.  
**Recommendation:** Add a requirement or constraint describing the target environment(s) for the demo and any trial (host, minimum hardware for the models, how the scheduler and the Ollama server are started and kept running), and state the conditions the system must meet before it is deployed outside a developer machine, including the endpoint restriction from Section 4.2.

### Finding 15 of 15 — Document organisation and traceability details (Minor)

**Location:** Section 1.4; Section 3.1.1; REQ-FUNC-009 (AC3); Appendix B; Revision history; Section 3.5  
**Type:** Other  
**Severity:** Minor  
**Finding:** (a) All references in Section 1.4 have the version "Current", and the SRS template used is not referenced, so the documents the SRS relies on can change without notice. (b) The bullet list in Section 3.1.1 repeats behaviour already covered by functional requirements, using different wording and no IDs. (c) REQ-FUNC-009 AC3 filters by allergens "selected in their preferences", but the User entity in Appendix B has no allergen preferences, so it is unclear whether preferences are saved or only selected for the current view. (d) Section 3.5 lists source files, which belongs to design rather than requirements and will become outdated quickly. (e) The requirements have no field linking them to the constraints (2.3), assumptions (2.5) and related requirements they depend on.  
**Recommendation:** Pin reference versions or access dates and reference the template; replace the Section 3.1.1 bullets with references to the functional requirements; state where allergen preferences are stored and add the field to Appendix B; move the file list to the design document; and add a "Related" field (constraints, assumptions, requirements) to each requirement.
