# Personnel Evaluation Track — Plan C — Phase C4 Implementation Report
## Resubmission & Multi-Version Submission History

**Document Status:** Complete & Verified  
**Date:** September 8, 2026  
**Tracking Context:** Personnel Evaluation Track — Plan C (Whole-Portfolio Submission, Versioning, Locking & Revision)  
**Phase:** C4 — Resubmission & Multi-Version Submission History  
**Predecessors:** C1 submission/snapshot creation, C2 server-enforced immutability, and C3 whole-portfolio return for revision  
**Successor:** C5 track close-out  

---

## 1. Executive Summary

Phase C4 implements whole-portfolio resubmission and multi-version submission history for the AchieveNest Personnel Evaluation Track. When a personnel member's portfolio is returned for revision (Phase C3), they can edit their reopened working revision (Plan B) and resubmit it as a new, immutable point-in-time snapshot (Version 2, 3, etc.) within the same evaluation cycle.

Key Architectural Guarantees:
- **Zero-Overwrite / Append-Only Versioning:** Older versions (e.g. Version 1 `returned_for_revision`) retain their exact submitted line items, evidence files, claimed scores, evaluator remarks, and return feedback permanently.
- **Deterministic Version Numbering:** Resubmission increments the version number from `N` to `N + 1` atomically inside a single database transaction, with explicit `previous_version_id` foreign linkage.
- **Strict Separation of Data:** Working draft edits (Plan B) never mutate prior historical snapshots or the newly created Version `N + 1` snapshot once submitted.
- **Full History & Comparison:** Both personnel owners and authorized reviewers can inspect all submitted versions chronologically and perform side-by-side snapshot comparison (added, modified, and removed line items).
- **Domain Boundaries Respected:** Reviewer scoring, routing, and promotion decisions (Plan G/H) remain untouched and out of scope.

---

## 2. Files Changed & Added

| Component | File Path | Nature of Change |
| :--- | :--- | :--- |
| **Database Migration** | [`backend/app/Database/Migrations/2026-09-08-000057_AddPersonnelPortfolioMultiVersionSupport.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-09-08-000057_AddPersonnelPortfolioMultiVersionSupport.php) | **[NEW]** Additive columns: `version_number`, `previous_version_id`, `evaluation_cycle_id`, and `source_working_revision_id` in `personnel_evaluations`. |
| **Backend Controller** | [`backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php) | Added `resubmit()` and `getHistory()` endpoints; updated `getLatest()` to expose `version_number` and `previous_version_id`. |
| **Backend Routes** | [`backend/app/Config/Routes.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Config/Routes.php) | Registered `POST /api/v1/personnel/portfolio/submissions/resubmit` and `GET /api/v1/personnel/portfolio/submissions/history`. |
| **Frontend Service** | [`frontend/src/services/personnelPortfolioService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/personnelPortfolioService.js) | Added `resubmitPortfolio(payload)` and `getSubmissionHistory(personnelProfileId)` methods. |
| **Frontend Controller** | [`frontend/src/controllers/PersonnelPortfolioController.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/PersonnelPortfolioController.js) | Added `resubmitPortfolioAsync(portfolioModel, options)` method with proof validation guards. |
| **Frontend Hook** | [`frontend/src/hooks/usePersonnelPortfolio.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/hooks/usePersonnelPortfolio.js) | Added `resubmitPortfolio`, `submissionHistory`, `loadSubmissionHistory`, and `versionNumber` state management. |
| **Frontend Modal** | [`frontend/src/pages/personnel/modals/SubmissionVersionHistoryModal.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/modals/SubmissionVersionHistoryModal.jsx) | **[NEW]** Multi-version timeline browser and side-by-side snapshot comparison view. |
| **Frontend UI** | [`frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx) | Integrated dynamic **Resubmit Portfolio (v{N+1})** action button, **History** badge button, and modal rendering. |
| **Test Suite** | [`frontend/src/controllers/__tests__/PersonnelPortfolioResubmissionC4.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelPortfolioResubmissionC4.test.js) | **[NEW]** 7 targeted unit and integration tests covering resubmission, immutability, history ordering, and comparison. |

---

## 3. Endpoints & API Contract

### 1. `POST /api/v1/personnel/portfolio/submissions/resubmit`
- **Authentication:** Required (Authenticated Personnel Member).
- **Preconditions:**
  1. Latest submission must exist and be in `returned_for_revision` (or `returned_to_personnel`) status.
  2. Active working revision must have at least 1 accomplishment.
  3. All accomplishments in the working revision must have supporting proof attachments.
- **Server Behavior:**
  1. Derives `personnel_profile_id` server-side from auth token.
  2. Determines next version number (`$latest.version_number + 1`).
  3. Atomically inserts new row into `personnel_evaluations` with `status: 'submitted'`, `version_number: N + 1`, `previous_version_id: $latest.id`.
  4. Snapshots working accomplishments into `personnel_evaluation_items` linked to the new evaluation ID.
  5. Inserts audit event `portfolio_resubmitted` with version linkages.
  6. Preserves older version rows and return feedback untouched.
- **Response (201 Created):**
  ```json
  {
    "data": {
      "message": "Portfolio successfully resubmitted as Version 2.",
      "submission_id": "c1f7a012-...",
      "version_number": 2,
      "previous_version_id": "a9b8c7d6-...",
      "status": "submitted",
      "submitted_at": "2026-09-08 20:40:00",
      "academic_year": "2025-2026",
      "total_items": 3
    }
  }
  ```
- **Error Codes:**
  - `409 INVALID_TRANSITION` (e.g. no previous submission or status is draft)
  - `409 RESUBMISSION_NOT_ALLOWED` (submission is already `submitted` or `in_evaluation`)
  - `422 WORKING_REVISION_REQUIRED` (portfolio is empty)
  - `422 MISSING_PROOF_DOCUMENTS` (one or more items lack proof)
  - `403 FORBIDDEN` / `401 UNAUTHORIZED`

### 2. `GET /api/v1/personnel/portfolio/submissions/history`
- **Authentication:** Required.
- **Query Params:** `personnel_profile_id` (optional; authorized reviewers only).
- **Response (200 OK):**
  ```json
  {
    "data": {
      "versions": [
        {
          "id": "a9b8c7d6-...",
          "version_number": 1,
          "status": "returned_for_revision",
          "academic_year": "2025-2026",
          "previous_version_id": null,
          "submitted_at": "2026-09-08 09:00:00",
          "returned_at": "2026-09-08 10:30:00",
          "return_feedback": {
            "reason": "Please upload certified true copy of diploma...",
            "required_corrections": "Re-upload sealed diploma...",
            "reviewer_name": "Dean Eleanor Ramos",
            "item_deficiencies": [...]
          },
          "items_count": 2,
          "items": [...],
          "is_current": false
        },
        {
          "id": "c1f7a012-...",
          "version_number": 2,
          "status": "submitted",
          "academic_year": "2025-2026",
          "previous_version_id": "a9b8c7d6-...",
          "submitted_at": "2026-09-08 12:00:00",
          "returned_at": null,
          "return_feedback": null,
          "items_count": 3,
          "items": [...],
          "is_current": true
        }
      ],
      "total_versions": 2,
      "current_version_number": 2
    }
  }
  ```

---

## 4. Test Matrix & Verification Results

All 111 test files across frontend and backend controller suites passed with zero failures (684 tests total):

```
 Test Files  111 passed (111)
      Tests  684 passed (684)
   Start at  20:42:51
   Duration  48.20s

Specific Personnel Portfolio Track Suites:
 ✓ src/controllers/__tests__/PersonnelPortfolioReflectionB1.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioWorkspaceB2.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSyncB3.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPlanBEndToEndB4.test.js (6 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioImmutabilityC2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioReturnC3.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioResubmissionC4.test.js (7 tests)
```

---

## 5. Exit Criteria & Completion

- [x] **C3 Close-out Formally Verified:** Proven that whole-portfolio return preserves return feedback and keeps historical snapshots immutable.
- [x] **C4 Resubmission Implemented:** Corrected working revision can be resubmitted as a new immutable Version `N + 1`.
- [x] **Historical Immutability Preserved:** Prior version records, item remarks, evidence files, and return feedback remain untouched and unmutated.
- [x] **Deterministic Version Numbering:** Sequential integer versions linked by `previous_version_id`.
- [x] **Multi-Version History & Comparison:** Read-only modal with version timeline and side-by-side difference comparison.
- [x] **Zero Regressions:** 684/684 automated tests passing.
