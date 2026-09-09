# Personnel Evaluation Track — Plan J — Phase J1
# Canonical Status & Event Model — Formal Implementation Report

## Executive Summary

Phase J1 has implemented and verified the canonical persisted workflow status and event model for the Personnel Evaluation Track based on the authoritative catalog frozen in Phase J0. Every material workflow transition now maps to exactly one deterministic, idempotent event containing complete actor, subject, version, timestamp, and context metadata.

All 31 focused test scenarios and the full master regression suite (148 test files, 1,451 tests) passed with 0 failures.

---

## 1. Canonical Lifecycle Status Registry

The 5 authoritative lifecycle status keys are standardized:
1. `submitted`: Whole-portfolio package submitted for reviewer evaluation (Plan C1).
2. `in_evaluation`: Active reviewer evaluation in progress (Plan G2).
3. `returned_for_revision`: Whole-portfolio returned with revision instructions (Plan C3).
4. `ready_for_finalization`: All criteria scored; ready for HR finalization (Plan H0).
5. `completed`: Final locked state with permanent promotion decision (Plan H4).

---

## 2. Display-Label & Presentation Separation

Internal keys are decoupled from user-facing presentation labels:
- `submitted` -> "Submitted for Review"
- `in_evaluation` -> "Under Review"
- `returned_for_revision` -> "Returned for Revision"
- `ready_for_finalization` -> "Ready for Finalization"
- `completed` -> "Completed / Finalized"

---

## 3. Evaluation Result & Promotion Decision Separation

- **Evaluation Result (Plan F)**: `Passed` | `Retained` (objective score threshold outcome).
- **Promotion Decision (Plan H)**: `Approved` | `Not Approved` (HR Board governance deliberation).
- **Invariant**: The evaluation result does not equal the promotion decision; `Passed` evaluations are considered for promotion, while `Retained` evaluations remain at current rank.

---

## 4. Canonical Event Registry

The 15 canonical workflow event keys are registered across backend and frontend:
1. `achievement_upload_saved`
2. `portfolio_submitted`
3. `review_started`
4. `qualification_state_changed`
5. `revision_requested`
6. `portfolio_resubmitted`
7. `evaluation_result_recorded`
8. `evaluation_ready_for_finalization`
9. `evaluation_finalized`
10. `summary_available`
11. `reviewer_assigned`
12. `evaluation_scale_overridden`
13. `promotion_decision_recorded`
14. `approved_rank_applied`
15. `portfolio_purged`

---

## 5. Event Persistence & Idempotency Architecture

- **Database Table**: `public.personnel_evaluation_events` (`id`, `evaluation_id`, `event_type`, `performed_by`, `payload`, `created_at`).
- **Deterministic Key Composition**: `generateIdempotencyKey(eventKey, evaluationId, versionNumber, transitionNonce)`.
- **Double-Click Protection**: Duplicate POST calls match the existing idempotency key and return the original event without creating duplicate rows.
- **Read-Only Invariant**: Page refresh and GET requests produce zero events.

---

## 6. Actor, Subject & Version Metadata

- **Actor Context**: Authenticated actor ID, role (`faculty`, `dean`, `hr_admin`, `system`), and full name.
- **Subject Context**: Personnel profile ID and evaluation ID.
- **Version Lineage**: Portfolio version number and prior version number for multi-version resubmission events.
- **Timestamp**: Server-authoritative ISO timestamp (`now()`).

---

## 7. HR Scale Override & Promotion Deliberation Events

- `evaluation_scale_overridden`: Logs original scale, overridden scale, authorizing HR Admin, and reason text.
- `promotion_decision_recorded`: Logs Approved / Not Approved decision, current rank, approved rank, and effective date.

---

## 8. Legacy Compatibility & Deletion Retention Boundary

- Legacy status values are normalized into canonical keys during read cycles without destructive historical mutation.
- `UNRESOLVED — AUDIT RETENTION AFTER COMPLETE OWNER DELETION` remains strictly isolated behind an architectural policy point without premature implementation.

---

## 9. Verification & Test Results

- **Phase J1 Focused Test Suite**: [PersonnelWorkflowEventModelJ1.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelWorkflowEventModelJ1.test.jsx) — **31 / 31 passed (100%)**.
- **Phase J0 + J1 Combined Suite**: **2 test files / 55 tests passed / 0 failures**.
- **Full Master Test Suite**: **148 test files / 1,451 tests passed / 0 failures** (72.89s).

---

## Final Phase Status

**PHASE J1 COMPLETE — CANONICAL LIFECYCLE STATUS & DETERMINISTIC WORKFLOW EVENT MODEL VERIFIED**
