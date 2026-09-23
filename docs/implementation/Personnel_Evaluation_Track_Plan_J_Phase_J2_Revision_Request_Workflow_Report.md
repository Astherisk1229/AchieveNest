# Personnel Evaluation Track — Plan J — Phase J2
# Whole-Portfolio Revision Request Workflow — Formal Implementation Report

## Executive Summary
Phase J2 implements and verifies the authoritative whole-portfolio revision request workflow for the Personnel Evaluation Track. It enforces the fundamental invariant:
> **Revision is whole-portfolio based. Personnel must be able to see exactly what needs revision while the prior submitted version remains immutable.**

Under Phase J2, an authorized reviewer (Dean or HR according to Plan G governance routing) returns the entire submitted portfolio for revision via a single persisted request containing a mandatory overall message. Reviewers may optionally attach subordinate guidance comments to specific portfolio entries or criteria without turning those items into independent submission workflows. When Personnel resubmits the portfolio (Version N+1 via Plan C), the prior revision request transitions to `resolved` and links the new version while preserving complete historical audit fidelity.

---

## 1. Whole-Portfolio Revision Architecture
- **Canonical Unit of Return**: The portfolio submission version (e.g. Version 1).
- **Single Status Transition**: The evaluation transitions to `returned_for_revision`.
- **Subordinate Guidance**: Reviewer comments provide item-level or criterion-level hints but do not branch into independent evaluation tracks or per-item statuses.
- **Unified Resubmission**: Personnel addresses feedback in their unlocked working draft and resubmits the whole portfolio as Version N+1.

---

## 2. Reviewer Authority & Routing Validation
- **Authority Enforcement**: Validated server-side via `PersonnelRevisionRequestService` consuming Plan G `PersonnelReviewerRoutingRegistry`.
- **Routing Rules**:
  - Faculty + Academic $\rightarrow$ Active Dean of assigned college.
  - Non-Teaching Faculty + Academic $\rightarrow$ Active Dean of assigned college.
  - Non-Teaching Faculty + Non-Academic $\rightarrow$ HR.
  - Dean / VP for Academics / VP for Administration $\rightarrow$ HR.
- **Strict Guardrails**:
  - Cross-college Dean access denied (`cross_college_evaluation_prohibited`).
  - Department Secretary excluded (`department_secretary_excluded`).
  - Self-review / self-return prohibited (`self_evaluation_prohibited`).
  - General Personnel denied reviewer action (`revision_request_unauthorized`).

---

## 3. Revision Request Persistence Model
- **Core Entity Attributes**:
  - `id`: Unique revision request UUID.
  - `evaluation_id` / `portfolio_version_id`: Target evaluation version ID.
  - `version_number`: Point-in-time version number (e.g. 1).
  - `personnel_profile_id`: Faculty/staff subject profile ID.
  - `reviewer_id` & `reviewer_role` & `reviewer_name`: Reviewer provenance.
  - `overall_message`: Mandatory reviewer feedback (1–2000 chars).
  - `deficiency_reason`: Structured or descriptive deficiency category.
  - `requested_evidence`: Specific additional or corrected documentation required.
  - `comments`: Subordinate array of item/criterion comments.
  - `status`: Resolution state (`open` vs `resolved`).
  - `requested_at`: Reviewer timestamp.
  - `resolved_at` & `resolved_by_version_id`: Linked resubmission details.

---

## 4. Overall Message & Deficiency Details
- **Overall Message**: Mandatory non-empty string explaining the return rationale.
- **Deficiency Reason**: Captured deterministically and populated into `return_reason` and J1 event metadata.
- **Requested Evidence**: Clarifies required supporting documents, preventing guesswork or unverified assumptions.

---

## 5. Optional Item-Level & Criterion-Level Subordinate Comments
- **Subordinate Structure**: Each comment references `portfolio_item_id`, `criterion_code`, `comment_text`, and optional `requested_evidence`.
- **Item State Annotation**: Updates item snapshot `verification_status` to `'needs_revision'` and `evaluator_remarks`.
- **No Independent Lifecycle**: Subordinate comments are rendered directly in the candidate's revision workspace under the unified portfolio return view.

---

## 6. Version Linkage & Historical Immutability
- **Snapshot Immutability**: Version N submitted items, points, timestamps, and canonical `evidence_id`s remain frozen and read-only.
- **Working Draft Isolation**: Plan C manages changes in an editable working draft; historical snapshot records are never mutated.
- **Reviewer Message Protection**: Personnel has strictly no permission to modify reviewer messages, timestamps, or comments.

---

## 7. Canonical Lifecycle Transition & Deterministic J1 Events
- **Permitted Source States**: `submitted`, `in_evaluation`.
- **Terminal/Finalized Locks**: `completed` or `ready_for_finalization` submissions cannot be returned.
- **Canonical Event Dispatched**: Exactly one `revision_requested` event logged deterministically via `PersonnelWorkflowEventService` with full actor, subject, version, and deficiency metadata.
- **Active Request Guard & Idempotency**: Duplicate requests for the same open version are blocked; repeated requests with matching idempotency nonces safely return the existing record.

---

## 8. Resubmission Resolution & Multi-Cycle Lineage
- **Resolution on Resubmission**: Submitting Version N+1 transitions the prior request from `open` to `resolved`, records `resolved_at`, and populates `resolved_by_version_id`.
- **J1 Event**: Emits canonical `portfolio_resubmitted` event with version numbers.
- **Multi-Cycle Support**:
  - $V_1 \xrightarrow{\text{Rev 1 (open)}} V_2 (\text{Rev 1 resolved}) \xrightarrow{\text{Rev 2 (open)}} V_3 (\text{Rev 2 resolved})$.
  - All historical requests remain immutable and queryable in audit trails.

---

## 9. Focused Test Suite Verification (35 Tests)
The focused Vitest suite `frontend/src/controllers/__tests__/PersonnelRevisionRequestWorkflowJ2.test.jsx` verified all 35 test cases:
1. Assigned Dean can return authorized college portfolio (**PASS**).
2. Authorized HR staff can return HR-routed portfolio (**PASS**).
3. Cross-college Dean strictly denied (**PASS**).
4. Department Secretary strictly denied (**PASS**).
5. Self-review strictly denied (**PASS**).
6. Personnel cannot create reviewer request (**PASS**).
7. One request returns entire portfolio (**PASS**).
8. Overall message is mandatory (**PASS**).
9. Item comments remain subordinate (**PASS**).
10. Criterion comments remain subordinate (**PASS**).
11. No independent per-item submission state created (**PASS**).
12. Reviewer identity preserved (**PASS**).
13. Request timestamp preserved (**PASS**).
14. Portfolio version linkage preserved (**PASS**).
15. Structured deficiency reason preserved (**PASS**).
16. Requested evidence preserved (**PASS**).
17. Resolution status preserved (**PASS**).
18. Valid return transitions to `returned_for_revision` (**PASS**).
19. Deterministic J1 `revision_requested` event emitted (**PASS**).
20. Failed authority check does not change status or emit event (**PASS**).
21. Completed/finalized submissions cannot be returned (**PASS**).
22. Idempotency key prevents duplicate event emission (**PASS**).
23. Submitted snapshot of Version 1 remains point-in-time immutable (**PASS**).
24. Original evidence IDs remain locked to Version 1 (**PASS**).
25. Personnel cannot modify reviewer-authored data (**PASS**).
26. Reviewer request remains historically preserved after resubmission (**PASS**).
27. Successful resubmission resolves request (**PASS**).
28. Resolved request links new version (**PASS**).
29. Resubmission emits distinct J1 `portfolio_resubmitted` event (**PASS**).
30. Multi-cycle revision support preserves all requests (**PASS**).
31. J0/J1 canonical event keys and statuses preserved (**PASS**).
32. Plan C versioning and submission lineage preserved (**PASS**).
33. Plan G reviewer routing registry integrity preserved (**PASS**).
34. Plans A–I regressions preserved (**PASS**).
35. HR navigation, read models, and module health preserved (**PASS**).

---

## 10. Master Regression Results
- **Total Test Files**: **149 passed (149)**
- **Total Tests**: **1,486 passed (1,486)**
- **Failures**: **0**
- **Pass Rate**: **100.00%**
- **Duration**: 109.48s

---

## 11. Final Phase Status
**PHASE J2 COMPLETE — WHOLE-PORTFOLIO REVISION REQUEST, REVIEWER COMMENTS & RESOLUTION WORKFLOW VERIFIED**
