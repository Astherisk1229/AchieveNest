# Personnel Evaluation Track — Plan C — Phase C5
## Validation, Deletion Exception, One Evaluation Root per Cycle & Immutable Version Lineage Closure Report

**Document Status:** Complete, Formally Validated & Closed  
**Date:** September 8, 2026  
**Tracking Context:** Personnel Evaluation Track — Plan C (Whole-Portfolio Submission, Evaluation Roots, Versioning, Locking, Lineage & Revision)  
**Phases Completed:** C0 (Lifecycle Audit), C1 (Canonical Submission), C2 (Server-Enforced Immutability), C3 (Whole-Portfolio Return & Feedback Preservation), C4 (Resubmission & Multi-Version History), C5 (Validation, Deletion Exception, Evaluation Root Aggregate & One-Evaluation-Per-Cycle Closure)  
**Track Status:** **Plan C Complete and Verified**  

---

## 1. Executive Summary

Phase C5 completes and formally closes the Personnel Evaluation Track Plan C, incorporating the C5 Corrective Plan for single logical evaluation roots and deterministic version lineage. It validates the end-to-end whole-portfolio ranking lifecycle across database, API, and frontend layers, guarantees exactly one evaluation root per personnel member per evaluation cycle with immutable child versions, safely implements the approved deletion exception, and proves zero regressions across all 112 test suites (699 tests passing).

Key Achievements:
1. **One Evaluation Root per Cycle Guaranteed:** Evaluated under `personnel_evaluation_roots` with strict uniqueness on `(personnel_profile_id, evaluation_cycle_id)`. Exactly one evaluation root exists per personnel member and evaluation cycle.
2. **Deterministic Version Lineage:** All submissions are immutable version records in `personnel_evaluations` linked to their parent root via `evaluation_root_id`, enforced by `UNIQUE (evaluation_root_id, version_number)` and sequential `previous_version_id` chaining.
3. **Race & Concurrency Protection:** Concurrent first-submission attempts produce only one root and Version 1 (`409 DUPLICATE_EVALUATION` / `409 ACTIVE_SUBMISSION_EXISTS`). Concurrent resubmissions produce one Version 2 only (`409 DUPLICATE_RESUBMISSION`).
4. **Approved Deletion Exception Implemented:** Explicit, authenticated portfolio purge (`POST|DELETE /api/v1/personnel/portfolio/purge`) allows the verified owner or authorized HR Admin (with documented reason) to purge complete portfolio history across all states (`draft`, `submitted`, `returned_for_revision`, `completed`) in FK-safe order, deleting child snapshots, versions, and roots, leaving only a minimal non-sensitive audit tombstone.
5. **Immutability & Non-Overwrite Verified:** Historical submissions, snapshot items, proof files, claimed points, and applicant remarks remain 100% immutable and unmutated during normal evaluation and return flows.
6. **Plan A & B Isolation Preserved:** Working draft editing, Plan A achievement creation, OCR scanning, and category classification are preserved and completely insulated from evaluation snapshot tables.
7. **100% Automated Regression:** 112 test files containing 699 tests pass with zero failures.

---

## 2. Target Aggregate Domain Architecture

```text
Personnel Profile + Evaluation Cycle (Canonical ID)
           │
           └── public.personnel_evaluation_roots (UNIQUE: personnel_profile_id, evaluation_cycle_id)
                │
                ├── Submission Version 1 (status: returned_for_revision, previous_version_id: NULL)
                │    ├── Item Snapshots (personnel_evaluation_items)
                │    └── Return Feedback & Item Deficiencies
                │
                └── Submission Version 2 (status: submitted, previous_version_id: EVAL_V1_ID)
                     ├── Item Snapshots (personnel_evaluation_items)
                     └── Audit Events (personnel_evaluation_events)
```

---

## 3. Database Schema & Additive Migrations

### 3.1 Migrations

1. [`2026-09-08-000057_AddPersonnelPortfolioMultiVersionSupport.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-09-08-000057_AddPersonnelPortfolioMultiVersionSupport.php)
   - Added versioning metadata: `version_number`, `previous_version_id`, `evaluation_cycle_id`, `source_working_revision_id`.
2. [`2026-09-08-000058_AddPersonnelEvaluationOnePerCycleConstraints.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-09-08-000058_AddPersonnelEvaluationOnePerCycleConstraints.php)
   - Added performance indexes and initial unique constraints.
3. [`2026-09-08-000059_CreatePersonnelEvaluationRootsAndLineage.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-09-08-000059_CreatePersonnelEvaluationRootsAndLineage.php)
   - Created aggregate table `public.personnel_evaluation_roots` with:
     ```sql
     CREATE UNIQUE INDEX uq_personnel_eval_roots_profile_cycle 
     ON public.personnel_evaluation_roots (personnel_profile_id, evaluation_cycle_id);
     ```
   - Added `evaluation_root_id` to `public.personnel_evaluations`.
   - Added version lineage constraint:
     ```sql
     CREATE UNIQUE INDEX uq_personnel_eval_root_version 
     ON public.personnel_evaluations (evaluation_root_id, version_number);
     ```
   - Deterministic backfill: mapped existing evaluations into clean evaluation roots.

---

## 4. Backend Application Guards & Conflict Contracts

### 4.1 First Submission (`POST /api/v1/personnel/portfolio/submit`)
- Resolves authenticated personnel identity and canonical `evaluation_cycle_id`.
- Transactionally checks/creates the parent evaluation root.
- Rejection scenarios:
  - If root has an active version (`submitted`, `in_evaluation`, `ready_for_finalization`): `409 ACTIVE_SUBMISSION_EXISTS`.
  - If root has a returned version (`returned_for_revision`): `409 DUPLICATE_EVALUATION` (instructs caller to use resubmission).
  - If root has a completed version (`completed`): `409 DUPLICATE_EVALUATION`.
- On success: creates evaluation root and Version 1 (`version_number: 1`, `previous_version_id: null`).

### 4.2 Resubmission (`POST /api/v1/personnel/portfolio/submissions/resubmit`)
- Resolves parent evaluation root for authenticated personnel.
- Requires latest version under root to be `returned_for_revision`.
- Atomically computes `next_version_number = max(version_number) + 1`.
- Inserts Version `N+1` with `evaluation_root_id = root.id` and `previous_version_id = latest_version.id`.
- Concurrency guard: Returns `409 DUPLICATE_RESUBMISSION` on race conditions.

### 4.3 History API (`GET /api/v1/personnel/portfolio/submissions/history`)
- Sourced from `evaluation_root_id`, returning versions ordered by `version_number ASC`.
- Authorized personnel see their own root history; authorized reviewers/HR see permitted roots.

---

## 5. Phase 3 — Approved Deletion Exception (Portfolio Purge)

### 5.1 Endpoint & Contract
`POST|DELETE /api/v1/personnel/portfolio/purge`

| Parameter | Required for Owner | Required for HR Admin | Description |
| :--- | :--- | :--- | :--- |
| `confirmation` | **Yes** (`"DELETE_PORTFOLIO"`) | **Yes** (`"DELETE_PORTFOLIO"`) | Explicit confirmation string |
| `personnel_profile_id` | No (derived from token) | **Yes** (target profile UUID) | Target personnel member |
| `reason` | Optional | **Yes** (non-empty string) | Documented HR justification |

### 5.2 Transactional Purge Sequence
1. Delete `personnel_evaluation_items` snapshots for all target evaluations.
2. Delete `personnel_evaluation_events` audit records for target evaluations.
3. Delete `personnel_evaluation_deficiency_requests` and `personnel_evaluation_reports` (if any).
4. Delete `personnel_evaluations` version rows.
5. Delete `personnel_evaluation_roots` aggregate rows.
6. Delete `personnel_accomplishment_evidence` rows.
7. Delete `personnel_accomplishments` draft rows.
8. Record minimal non-sensitive tombstone audit log (`event_type: 'portfolio_purged'`).

---

## 6. End-to-End Test Matrix & Verification Results

### Master Test Suite Output (All 112 Files Passing)

```
 Test Files  112 passed (112)
      Tests  699 passed (699)
   Duration  50.91s

Complete Personnel Evaluation Track Suites:
 ✓ src/controllers/__tests__/PersonnelPortfolioReflectionB1.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioWorkspaceB2.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSyncB3.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPlanBEndToEndB4.test.js (6 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioImmutabilityC2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioReturnC3.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioResubmissionC4.test.js (7 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioClosureC5.test.js (14 tests)
```

### End-to-End Verification Scenarios Executed

1. **Root & Version 1 Creation:** First submit creates evaluation root and Version 1 (`version_number: 1`, `previous_version_id: null`).
2. **Lock Protection:** Mutation attempts on submitted evaluation return `409 PORTFOLIO_SUBMISSION_LOCKED`.
3. **Whole-Portfolio Return:** Reviewer returns portfolio with reason, corrections, and item deficiency; status transitions to `returned_for_revision`.
4. **Immutability of Version 1:** Original applicant remarks and snapshot items remain 100% untouched.
5. **Reopened Working Revision:** Corrected proof document and modified accomplishment in Plan B workspace.
6. **Resubmission (Version 2):** Resubmitted portfolio creates Version 2 under the same root (`previous_version_id: EVAL_V1_ID`).
7. **Multi-Version History & Comparison:** Both versions accessible in history under evaluation root with diff computation.
8. **Duplicate First-Submit Guard:** Attempted duplicate submit on existing cycle rejected with `409 DUPLICATE_EVALUATION`.
9. **Concurrent Resubmission Guard:** Concurrent resubmission attempt rejected with `409 DUPLICATE_RESUBMISSION`.
10. **Approved Deletion Purge:** Executed authorized purge with explicit confirmation; verified complete removal of root, versions, items, and minimal tombstone creation.

---

## 7. Plan C Definition of Done Checklist

| DoD Requirement | Status | Verification Evidence |
| :--- | :---: | :--- |
| Whole portfolio submits as point-in-time immutable snapshot | **PASSED** | C1 snapshotting in `personnel_evaluation_items` |
| Server-side locks prevent historical snapshot mutation | **PASSED** | C2 domain guard returning `409 PORTFOLIO_SUBMISSION_LOCKED` on PUT/DELETE |
| Reviewers can return complete portfolio with preserved feedback | **PASSED** | C3 `returnForRevision()` persisting structured feedback and item deficiencies |
| Returned revisions do not overwrite historical versions or remarks | **PASSED** | C3 zero-overwrite verification; original remarks preserved in `scoring_payload` |
| Exactly one evaluation root per personnel member and cycle | **PASSED** | C5 `personnel_evaluation_roots` table with unique constraint on `(personnel_profile_id, evaluation_cycle_id)` |
| Resubmission creates next auditable version in same evaluation root | **PASSED** | C4/C5 `resubmit()` creates Version `N+1` linking `previous_version_id` under parent root |
| Version history and comparison available to authorized users | **PASSED** | C4/C5 `getHistory()` sourced from root + `SubmissionVersionHistoryModal` UI |
| Duplicate / concurrent submission conflict contracts enforced | **PASSED** | C5 `409 ACTIVE_SUBMISSION_EXISTS`, `409 DUPLICATE_EVALUATION`, `409 DUPLICATE_RESUBMISSION` |
| Owner / HR deletion exception authorized, tested, and audited | **PASSED** | C5 `purge()` transactional deletion of roots/versions/items + minimal tombstone log |
| All automated regression suites pass with zero failures | **PASSED** | 112/112 test files, 699/699 tests passing |
| Plan A achievement upload, OCR, and classification unchanged | **PASSED** | All Plan A suites (A1, A2, A3, A4, A5) fully passing with zero modifications |

---

## 8. Formal Track Conclusion

All phases of **Personnel Evaluation Track — Plan C (Phases C0, C1, C2, C3, C4, and C5, including the C5 Corrective Plan)** are formally completed, validated, and closed. The data integrity aggregate root model and version lineage are enforced at database and application levels.
