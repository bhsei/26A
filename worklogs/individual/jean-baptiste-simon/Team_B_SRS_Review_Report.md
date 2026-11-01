# Peer Review: Team B — Context-aware AAC Board — Software Requirements Specification v0.5

**Reviewing team:** Team A (AdoptAJob)  
**Reviewed team:** Team B (The Outliers)  
**Document:** Software Requirements Specification  
**Version reviewed:** v0.5 (Markdown edition, 29 October 2026), repository `bhsei/26B`  
**Review date:** 2026-11-01  
**Prepared by:** Jean-Baptiste Simon (Team A), checked by Team A  
**Review issue:** https://github.com/bhsei/26B/issues/2

## Review scope

This is an SRS-only review. It covers clarity, consistency, completeness, verifiability and traceability of the document. Source code, test runs and the linked documents (docs/API.md, docs/ERRORS.md, docs/DATABASE.md, AI_Model_Plan.md, src/ai/README.md) were not assessed. Statuses and implementation statements are treated as claims made by the SRS.

## Review summary

**Strengths.** Every requirement has a rationale, numbered acceptance criteria and a dated status linked to named tests (Table 61). The SRS clearly separates Passed, Prototype and Not started work and states plainly that the backend still uses a mock provider. Photo minimisation and negation handling show a real concern for the user's intent and privacy. Open decisions have owners and target weeks.

**Main concerns.** The rule for reusing accepted sentences is undefined and conflicts with the SRS's own intent-fidelity requirement. Several statuses are "Passed" while acceptance criteria are still open. Authentication, data protection, provider capacity and timeouts are not yet specified as testable requirements. Several acceptance criteria cannot currently pass or fail.

| Severity | Findings |
|---|---:|
| Severe | 1 |
| Moderate | 9 |
| Minor | 5 |
| **Total** | **15** |

**Overall recommendation:** revision recommended before the document is frozen as the v1.0 baseline.

## Findings index

| # | Title | Location | Type | Severity |
|---|---|---|---|---|
| 1 | Reuse matching rule | REQ-ML-008; 1.2; App. B item 11; REQ-ML-003 | Consistency | Severe |
| 2 | "Passed" status contradicts open criteria | REQ-INT-004, REQ-AVAIL-001, REQ-ML-004; Ch. 4 | Consistency | Moderate |
| 3 | Authentication and account ownership not specified | 1.2; REQ-SEC-005; REQ-INT-007; Table 64; 3.6.2 | Completeness | Moderate |
| 4 | Data-protection obligations announced but not specified | 3.4; REQ-SEC-007; 3.6.2; 2.5 | Completeness | Moderate |
| 5 | Latency target, timeouts and fallback chain inconsistent | REQ-PERF-001; REQ-REL-002; REQ-ML-007 | Consistency | Moderate |
| 6 | Capacity and behaviour when no provider is available | REQ-ML-006; REQ-ML-007; REQ-REL-002; 3.5.7 | Completeness | Moderate |
| 7 | No measurable quality criteria for the core AI function | REQ-ML-001; REQ-ML-002; REQ-ML-003 | Verifiability | Moderate |
| 8 | Symbol vocabulary not defined | REQ-FUNC-001; REQ-INT-006; REQ-FUNC-011 | Ambiguity | Moderate |
| 9 | Acceptance criteria without observable pass/fail results | REQ-FUNC-004/005; REQ-REL-001/002; REQ-SEC-002/006; REQ-AVAIL-001; REQ-PERF-001 | Verifiability | Moderate |
| 10 | Normative behaviour stated only in prose | 3.6.3; 3.5.7; 3.5.8 | Completeness | Moderate |
| 11 | Speech versus saving the acceptance | Figure 3; App. A; REQ-FUNC-007; REQ-INT-003 | Completeness | Minor |
| 12 | WCAG level and criteria do not match | REQ-INT-007; App. B item 1 | Verifiability | Minor |
| 13 | Schedule and open decisions conflict with the W7 baseline | Ch. 1; Table 49; Figure 8; App. B | Consistency | Minor |
| 14 | REQ-INT-004 criteria cannot be verified from the SRS | REQ-INT-004 (AC2, AC3); 1.4 (R6) | Verifiability | Minor |
| 15 | Document organisation and traceability details | 3.1; 3.6.2; List of Figures; 1.4; App. F; REQ-INT-003 | Other | Minor |

## Detailed findings

### Finding 1 of 15 — Reuse matching rule (Severe)

**Location:** REQ-ML-008 (statement, AC1-AC4, evidence); Section 1.2 (Table 4); Appendix B item 11; REQ-ML-003  
**Type:** Consistency  
**Severity:** Severe  
**Finding:** REQ-ML-008 says a request is answered from earlier accepted sentences when its place, intention and symbols "match" an earlier request, but the acceptance criteria describe two different behaviours. AC1-AC2 test an exact, case-sensitive match in the backend (see evidence). AC3 reuses a sentence when a "score" of at least 0.9 is reached, with symbols matched in any order or case. The score is not defined anywhere (what is compared, how it is computed, why 0.9 and 0.4). Section 1.2 lists "embedding-based semantic search" as deferred while keeping "similarity in the AI prototype" in scope, and Appendix B item 11 leaves open whether reuse runs automatically and whether matching ignores case. The only negation case covered is AC4 ("no sugar" vs "sugar"). This matters because a reused sentence is returned without a model call and is spoken in the user's name, and REQ-ML-003 itself identifies an invented wish or a lost negation as the most harmful error of the product. Other near-matches (e.g. "I want water now" / "I want water later") are not addressed, so a similarity threshold could return a sentence that no longer matches what the user wants.  
**Recommendation:** Define a single matching rule for the baseline, preferably an exact match on normalised place, intention and symbol set, and state the normalisation rules (case, order, whitespace). If similarity matching is kept, specify the measure, the thresholds and their justification, and add acceptance cases for differing quantities, times and negations; otherwise remove similarity reuse from the SRS until it has been validated. Close Appendix B item 11 before baselining, and state whether the user is told that a sentence comes from earlier choices.

### Finding 2 of 15 — "Passed" status contradicts open criteria (Moderate)

**Location:** REQ-INT-004, REQ-AVAIL-001, REQ-ML-004; Chapter 4 (Tables 60-61 and the definition of "Passed")  
**Type:** Consistency  
**Severity:** Moderate  
**Finding:** Chapter 4 defines "Passed" as behaviour verified by the listed tests or inspection. REQ-INT-004 is marked Passed although its own evidence says AC3 is open (docs/API.md does not document the reuse endpoint). REQ-AVAIL-001 is marked Passed although its AC3 (availability target) is open. REQ-ML-004 is a UI requirement ("The UI shall accurately communicate...") marked Passed, but the evidence in Table 61 lists only backend and provider tests, and REQ-INT-001 states that the team's frontend is not yet connected to the API. The count of 18 Passed requirements in Table 60 is therefore overstated, and a reader cannot rely on a status without reading the evidence text.  
**Recommendation:** Mark a requirement Partial while any of its acceptance criteria is open, or move the open criterion into a separate requirement. For REQ-ML-004, cite a test or demonstration that covers the UI notice, or downgrade it to Partial. Update Tables 60 and 61 accordingly.

### Finding 3 of 15 — Authentication and account ownership are not specified (Moderate)

**Location:** Section 1.2 (Table 4); REQ-SEC-005; REQ-INT-007; Appendix A step 1; Appendix E.4; Table 64; Section 3.6.2; REQ-ML-008  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** The login page is part of the specified journey (Appendix A step 1, the "three pages" of REQ-INT-007, Figures 2 and 3, and screenshots with email, password and recovery links), but the SRS contains no requirement for registration, sign-in, sign-out, session handling or password recovery, and Section 1.2 lists accounts and authentication neither as in scope nor as excluded. REQ-SEC-005 requires authenticated ownership only "prior to public trial", a term that is not defined. The record structure in Table 64 has no user or owner field, so the criterion could not be met without a data-model change. In the meantime the reuse history is shared by all users (Section 3.6.2: "no user ownership yet"), and accepted sentences may be sent to the model as wording examples (REQ-ML-008), so one person's text can be returned to, or processed for, another person.  
**Recommendation:** Decide whether accounts are in scope for the first release. If yes, add requirements for registration, sign-in/out, session expiry and recovery (or exclude recovery explicitly), and add an owner reference to the request, feedback and reuse records in Table 64. Define "public trial" (for example, any deployment reachable by people outside the team) and make the ownership check a precondition for it. If not, state that the login screen is a non-functional mock and remove it from the acceptance scenario.

### Finding 4 of 15 — Data-protection obligations are announced but not specified (Moderate)

**Location:** Section 3.4 (introduction, REQ-COMP-001, REQ-COMP-002); REQ-SEC-007; Section 3.6.2; Section 2.5  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** The introduction of Section 3.4 says the SRS "requires an explicit pre-release assessment" of data-protection obligations, but no requirement does so: REQ-COMP-001 covers licences and REQ-COMP-002 covers course rules. REQ-SEC-007 requires consent and a retention policy, but it does not identify the applicable data-protection law or jurisdiction, does not say what the user must be told (who operates the service and how to contact them, what is collected, that photos and intention text are sent to a third-party AI provider, how long they are kept, how to exercise rights), and applies only "before testing with real users". The product handles data that can reveal a speech or language impairment, and Section 3.6.2 states that the free-tier provider may use inputs to improve its products. The only safeguard is a process rule ("only synthetic text and drawn photos are sent"), not a system requirement.  
**Recommendation:** Add a compliance requirement that names the applicable regime(s) (for example PIPL if the service is deployed or used in China, GDPR if EU users are targeted; the team should decide) and makes a data-protection assessment an acceptance criterion. Extend REQ-SEC-007 with the content of the consent notice, including the third-party AI provider as a data recipient. Add a requirement that real user data is never sent to a provider whose terms allow reuse of inputs for training, enforced by configuration (for example a per-environment provider allow-list). In Section 2.5, also confirm that the chosen provider is reachable from the places where the demo and the trial will run.

### Finding 5 of 15 — Latency target, timeouts and fallback chain are inconsistent (Moderate)

**Location:** REQ-PERF-001; REQ-REL-002 (evidence); REQ-ML-007; Section 3.6.1; Section 3.2 (introduction)  
**Type:** Consistency  
**Severity:** Moderate  
**Finding:** REQ-PERF-001 sets a provisional target of 10 s at the 95th percentile end to end, but the timeouts reported as implemented in the prototype are 15 s connect / 30 s read for hosted models and 3 s / 180 s for the local model, and measured hosted latency reaches 26 s. Because REQ-ML-007 moves to the next model after a failure or a 429, a request can wait through several models before a result or a 503 appears, and no requirement defines an overall deadline for the whole chain. A 180 s read timeout is also incompatible with a real-time communication aid. REQ-REL-002 leaves the timeout "TBD" although the values exist in its evidence text. Finally, no requirement defines what the UI shows while waiting or protects against repeated submissions, although Section 3.2 says tests must include repeat clicks.  
**Recommendation:** Specify one end-to-end deadline for a generation, including all fallback attempts, and derive the per-attempt timeouts from it; state what happens when it expires (for example a 503 with a visible notice). Put the timeout values into the statement or criteria of REQ-REL-002 instead of the evidence text. Add a UI requirement for the waiting state (visible progress, duplicate submission disabled, going back allowed). Decide whether the local model belongs in the chain if it cannot meet the target.

### Finding 6 of 15 — Capacity and behaviour when no provider is available (Moderate)

**Location:** REQ-ML-006; REQ-ML-007; REQ-REL-002; REQ-SEC-006; Section 3.5.7; Section 2.5  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** The specified chain has four hosted free-tier models, each stopped by a local daily cap of 16 calls. That is at most about 64 generations per day for all users combined, and possibly fewer, since the Flash-Lite daily limits are still reported as unknown. The local backup model is not installed. Every regeneration, evaluation run (REQ-ML-002) and demo draws on the same quota. No requirement states how many generations per day or per session the demo, the evaluation and the trial must support. When every model is exhausted, the only specified behaviour is a 503 "Generation unavailable", with templates never shown as AI (REQ-ML-006). For a communication aid, this means the board offers the user no way to produce a sentence until the next quota day, and it is unclear whether a clearly labelled non-AI fallback (REQ-ML-004 already mentions labelling mock mode) or speaking the user's own typed text is allowed.  
**Recommendation:** Add a capacity requirement (minimum generations per day and per session for the final demo and the trial, counting regenerations and evaluation) and state how it will be met (quota budget, paid tier, local model, reuse). Define the degraded mode when no provider is available, for example speaking the user's own typed intention or a labelled template fallback, and clarify how it relates to REQ-ML-004 and REQ-ML-006.

### Finding 7 of 15 — No measurable quality criteria for the core AI function (Moderate)

**Location:** REQ-ML-001; REQ-ML-002; REQ-ML-003 (AC1); Section 3.6.1; Appendix B item 3  
**Type:** Verifiability  
**Severity:** Moderate  
**Finding:** REQ-ML-001 is accepted when "a repeatable model evaluation report" exists. Neither REQ-ML-001 nor REQ-ML-002 defines what is measured (for example relevance, intent preservation, grammaticality), who rates it and how, the pass thresholds, or the size and composition of the evaluation set (the 30-40 case set is "pending"). Section 3.6.1 says minimum levels will be approved later and Appendix B item 3 postpones this to W9. Without thresholds the requirement cannot fail, so the choice or replacement of a model cannot be justified against the SRS. REQ-ML-003 AC1 ("preserve user intent and avoid unsafe assumptions") is also qualitative.  
**Recommendation:** State in the SRS, even as provisional values, the metrics, the rating procedure, the minimum size and composition of the evaluation set, and the pass thresholds (for example the share of cases with at least one acceptable sentence, and the tolerated rate of lost negations or invented intents). Tie the acceptance of REQ-ML-001 and REQ-ML-003 to them.

### Finding 8 of 15 — Symbol vocabulary is not defined (Moderate)

**Location:** REQ-FUNC-001; REQ-INT-006; REQ-FUNC-011; Appendix E.4 (screenshots)  
**Type:** Ambiguity  
**Severity:** Moderate  
**Finding:** REQ-FUNC-001 says the API validates "allowed symbol labels", but its criteria only limit the number (20) and length (80 characters) of symbols, so no allowed set is defined. REQ-INT-006 requires "stable, unambiguous text labels" and its criterion refers to "the agreed water symbol label", but the SRS never lists the labels or says where they are defined (the screenshots mention water, coffee, sugar, milk, hot/cold and take-away/eat-in). Reuse matching (REQ-ML-008), stored records and the evaluation set all depend on these labels, so the requirement cannot be tested as written, and REQ-FUNC-011 (additional contexts) has no vocabulary to extend.  
**Recommendation:** Add the café symbol vocabulary (label, meaning, validation status) as a table in the SRS or as a versioned file it references. State in REQ-FUNC-001 whether unknown labels are rejected, and make the REQ-INT-006 criterion check every label in that table.

### Finding 9 of 15 — Acceptance criteria without observable pass/fail results (Moderate)

**Location:** REQ-FUNC-004; REQ-FUNC-005; REQ-REL-001; REQ-SEC-002; REQ-SEC-006; REQ-REL-002; REQ-AVAIL-001 (AC3); REQ-PERF-001 (AC2)  
**Type:** Verifiability  
**Severity:** Moderate  
**Finding:** Several criteria do not define an observable result. REQ-FUNC-004 ("the ID resolves the correct request"), REQ-FUNC-005 ("mismatched or unknown IDs fail": which status and error code?), REQ-REL-001 ("documented controlled status": which one?) and REQ-SEC-002 ("safe generic error responses": which content is forbidden?) leave the expected outcome open. REQ-SEC-006 and REQ-REL-002 depend on thresholds or timeouts marked TBD, and REQ-AVAIL-001 AC3 depends on a target to be set once hosting is chosen, so these criteria cannot currently pass or fail. REQ-PERF-001 AC2 asks for a p95 over an evaluation set of 30-40 cases, which is too few samples for a meaningful 95th percentile, and it does not say whether failover attempts or the reuse path are counted. This matters because reviewers and testers cannot decide whether the requirement is met.  
**Recommendation:** State the expected status codes, error codes and response fields in each criterion (REQ-INT-004 already lists them). Replace TBD values with provisional numbers marked as such, or move the undecided part into a separate requirement. For REQ-PERF-001, define the number of timed requests (compatible with the free-tier quota), warm-up, network conditions and whether failover attempts count, or report median and maximum instead of p95.

### Finding 10 of 15 — Normative behaviour stated only in prose (Moderate)

**Location:** Section 3.6.3; Section 3.5.7; Section 3.5.8  
**Type:** Completeness  
**Severity:** Moderate  
**Finding:** Some behaviours are specified only in explanatory text, with no requirement ID, rationale, criterion or entry in Table 61. Section 3.6.3 says the provider drops sentences longer than 300 characters, repeated sentences and sentences that lose a negation, turns an unparseable or blocked answer into an empty list, and that the system should "screen malformed or unsafe output". Only parts of this map to REQ-FUNC-006, REQ-ML-003 and REQ-REL-001; the 300-character limit and any screening of unsafe or inappropriate content have no requirement. Section 3.5.7 states that costs "shall be monitored" and that the AI budget is zero, and Section 3.5.8 lists milestones and tentative dates, both without requirement IDs. These statements cannot be traced, tested or changed under REQ-CM-001.  
**Recommendation:** Turn each of them into a numbered requirement with criteria and a Table 61 entry (for example output limits and sanitisation; handling of unsafe content, including what counts as unsafe for this user group; the zero-budget constraint with a usage-monitoring criterion; milestone dates). Otherwise mark the text as non-normative and remove "shall".

### Finding 11 of 15 — Speech versus saving the acceptance (Minor)

**Location:** Figure 3; Appendix A steps 6-8; REQ-FUNC-007; REQ-INT-003 (AC3); REQ-REL-003  
**Type:** Completeness  
**Severity:** Minor  
**Finding:** In Figure 3 and Appendix A step 7, the acceptance is stored (PUT feedback) before the sentence is spoken. No requirement says what happens if that call fails or is slow (network error, 404, 409, 503): whether the sentence is still spoken, whether the user is told, and whether the save is retried. REQ-INT-003 AC3 covers the opposite case (no voice available, choice still saved). If speaking depends on the save, a logging failure could prevent a person from communicating; if it does not, the stored data may not reflect what was said.  
**Recommendation:** Add a requirement and a criterion for feedback failure. We suggest that speech is not blocked by persistence, that a visible notice is shown and that the save is retried. Add a failure-injection test for it.

### Finding 12 of 15 — WCAG level and criteria do not match (Minor)

**Location:** REQ-INT-007; Appendix B item 1  
**Type:** Verifiability  
**Severity:** Minor  
**Finding:** The statement targets WCAG 2.1 level AA, but the four criteria cover only part of what AA conformance requires (for example text resizing, reflow, non-text contrast and status messages for the text-only notices of REQ-INT-002), while AC4 (44 x 44 CSS pixel targets) comes from a level AAA criterion (SC 2.5.5) and is therefore stricter than the stated level. The level itself is still "to be confirmed", and only the login, context and suggestions pages are in scope, not photo-selection dialogs or error states.  
**Recommendation:** Either list the exact success criteria to be checked and the method (automated checker plus a manual keyboard and screen-reader pass), or require full AA conformance of the three pages and list the AAA additions explicitly. State which pages and states are in scope.

### Finding 13 of 15 — Schedule and open decisions conflict with the W7 baseline (Minor)

**Location:** Chapter 1 (introduction); Table 49; Figure 8; Appendix B  
**Type:** Consistency  
**Severity:** Minor  
**Finding:** Table 49 places the SRS "with cross-team peer review" in Week 7, but Figure 8 shows the peer review starting on 2 November, after the W7 milestone dated 1 November. Appendix B is titled "Open decisions to close before professor submission", yet its target weeks are W8-W12, after the W7 SRS milestone, and seven of the twelve decisions are marked as blocking the W12 design. Chapter 1 calls the document the "agreed documentation baseline" while these decisions and several TBD values remain open, and decision 12 could change REQ-ML-003.  
**Recommendation:** Align the title, dates and milestone wording. Decide which open decisions must close before the baseline (those that change a requirement, for example items 1, 3, 4, 6, 11 and 12) and record the others as pending changes under REQ-CM-001. Alternatively, describe the document as a draft baseline.

### Finding 14 of 15 — REQ-INT-004 criteria cannot be verified from the SRS (Minor)

**Location:** REQ-INT-004 (AC2, AC3); Section 1.4 (R6)  
**Type:** Verifiability  
**Severity:** Minor  
**Finding:** AC3 requires "all seven endpoints" to appear in /openapi.json, but one of the seven is /openapi.json itself, which an OpenAPI document does not normally describe (FastAPI excludes it by default), so the criterion cannot be satisfied as written. AC2 depends on "the 15 error codes in docs/ERRORS.md": the codes and their cases are not in the SRS, so a reader of the SRS alone cannot verify the requirement, and its meaning changes whenever that file changes without a new SRS version.  
**Recommendation:** Reword AC3 (six documented endpoints plus the OpenAPI document itself). Include the error-code table in the SRS or an appendix of the same version, or reference a specific commit of docs/ERRORS.md and docs/API.md.

### Finding 15 of 15 — Document organisation and traceability details (Minor)

**Location:** Section 3.1 (REQ-INT-007 before REQ-INT-003); Section 3.6.2 (REQ-ML-008 before REQ-ML-003); List of Figures (Figure 8 before Figures 5-7); Section 1.4 and Appendix F; REQ-INT-003; requirement tables  
**Type:** Other  
**Severity:** Minor  
**Finding:** (a) REQ-INT-007 and REQ-ML-008 are inserted out of numeric order, which makes the document harder to scan; the reason (IDs are never reused) is not stated. (b) Figures appear in the order 1-4, 8, then 5-7. (c) Two reference schemes coexist (R1-R10 in Section 1.4, [1]-[7] in Appendix F), and the AI provider's terms and quota documentation, on which REQ-ML-007, REQ-PERF-001 and the privacy statement in Section 3.6.2 rely, are not referenced. (d) REQ-INT-003 bundles two independent capabilities (photo input and speech output), so its status "Not run" hides the fact that photo selection already exists. (e) The requirement tables have no field linking each requirement to constraints (2.3), assumptions (2.5) and related requirements, whereas the R1 template provides a "More Information" field for this.  
**Recommendation:** Renumber figures in order of appearance, add a sentence explaining the ID ordering, merge the two reference lists and add the provider documentation, split REQ-INT-003 into photo input and speech output, and add cross-references (constraints, assumptions, related requirements) to each requirement.
