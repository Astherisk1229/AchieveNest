# Personnel Evaluation Track — Plan C — Phase C2 Implementation Report
## Backend-Enforced Submitted-Version Immutability & Read-Only Access

**Document Status:** Complete & Verified  
**Date:** September 8, 2026  
**Tracking Context:** Personnel Evaluation Track — Plan C (Whole-Portfolio Submission, Versioning, Locking & Revision)  
**Phase:** C2 — Backend-Enforced Submitted-Version Immutability & Read-Only Access  
**Predecessor:** C0 lifecycle audit and C1 canonical whole-portfolio submission/snapshot creation  
**Successor:** C3 whole-portfolio return for revision; C4 resubmission and version history; C5 closure  

---

## 1. Executive Summary

Phase C2 establishes authoritative backend and frontend enforcement ensuring that once a personnel portfolio enters `submitted` (or `in_evaluation`), its submission header and all item snapshots in `public.personnel_evaluations` and `public.personnel_evaluation_items` are strictly locked and immutable.

Personnel retain authenticated read access to view their point-in-time submitted version via `GET /api/v1/personnel/portfolio/submission/latest`, while any prohibited mutation attempt against a locked submission is rejected with HTTP `409 Conflict` and error code `PORTFOLIO_SUBMISSION_LOCKED`.

The working portfolio remains the Plan B editable source without modifying historical submitted snapshots.

---

## 2. Files Changed & Added

| Component | File Path | Nature of Change |
| :--- | :--- | :--- |
| **Backend Controller** | [`backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php) | Added `assertSubmittedEvaluationImmutable($evaluation)` domain guard, full item snapshot payload in `getLatest()`, and mutation protection handlers returning HTTP 409 `PORTFOLIO_SUBMISSION_LOCKED`. |
| **Backend Routes** | [`backend/app/Config/Routes.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Config/Routes.php) | Registered mutation guard routes for PUT/DELETE on `personnel/portfolio/submissions/(:segment)` and line items. |
| **Frontend Hook** | [`frontend/src/hooks/usePersonnelPortfolio.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/hooks/usePersonnelPortfolio.js) | Integrated `getLatestSubmission` into portfolio reload and exposed `isLocked`, `latestSubmission`, and `submissionStatus`. |
| **Frontend UI Pages** | [`frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx) | Rendered prominent Read-Only Lock notice banner; disabled and hid all mutating actions (submit, add, edit, remove, sync) when locked. |
| **Frontend Cards** | [`frontend/src/pages/personnel/PortfolioSummaryCard.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PortfolioSummaryCard.jsx) | Aligned status badges and action visibility to canonical lifecycle statuses (`submitted`, `in_evaluation`, `ready_for_finalization`, `completed`). |
| **Test Suite** | [`frontend/src/controllers/__tests__/PersonnelPortfolioImmutabilityC2.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelPortfolioImmutabilityC2.test.js) | **[NEW]** 11 targeted unit and integration tests covering the complete C2 test matrix. |

---

## 3. Endpoints & API Contract

1. **`GET /api/v1/personnel/portfolio/submission/latest`**
   - **Authentication:** Required (Personnel context).
   - **Response (200 OK):**
     ```json
     {
       "data": {
         "submission": {
           "id": "eval_xxx",
           "personnel_profile_id": "profile_xxx",
           "status": "submitted",
           "academic_year": "2025-2026",
           "tenure_years": 6,
           "total_score": 0.00,
           "submitted_at": "2026-09-08T10:00:00Z"
         },
         "status": "submitted",
         "items_count": 3,
         "items": [
           {
             "id": "item_xxx",
             "accomplishment_id": "acc_xxx",
             "category_area": "areaA",
             "criterion_code": "A.1",
             "criterion_title": "Doctor of Philosophy in Computer Science",
             "file_name": "phd_diploma.pdf",
             "file_url": "https://storage.local/proofs/phd_diploma.pdf",
             "verification_status": "pending",
             "rating_status": "unrated",
             "awarded_points": 0.00,
             "scoring_payload": { "claimed_points": 30.0 }
           }
         ]
       }
     }
     ```
   - **Unsubmitted (200 OK):** `{ "data": { "submission": null, "status": "DRAFT", "items_count": 0, "items": [] } }`

2. **Mutation Guard Endpoints (`PUT` / `DELETE`):**
   - Direct mutation attempts against locked submitted versions return:
     ```json
     {
       "error": {
         "code": "PORTFOLIO_SUBMISSION_LOCKED",
         "message": "Submitted portfolio evaluation is currently in 'submitted' state and is strictly immutable."
       }
     }
     ```
     with HTTP `409 Conflict`.

---

## 4. Verification & Test Matrix Results

All 14 test suites across the controller layer passed with 100% success rate (141 tests total):

```
 RUN  v3.2.7 C:/Users/Admin/Documents/AchieveNest/frontend

 ✓ src/controllers/__tests__/OcrScanControllerPhaseA2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPlanAEndToEndA5.test.js (10 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioWorkspaceB2.test.js (12 tests)
 ✓ src/controllers/__tests__/AdminSetupGuideController.test.js (3 tests)
 ✓ src/controllers/__tests__/PersonnelAchievementPersistenceA1.test.js (14 tests)
 ✓ src/controllers/__tests__/PersonnelAchievementPersistenceA4.test.js (8 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSyncB3.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPlanBEndToEndB4.test.js (6 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioReflectionB1.test.js (12 tests)
 ✓ src/controllers/__tests__/AchievementClassificationPhaseA3.test.js (18 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioImmutabilityC2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js (11 tests)
 ✓ src/controllers/__tests__/RouteAccessController.test.js (9 tests)
 ✓ src/controllers/__tests__/CertificateIssuance.test.js (4 tests)

 Test Files  14 passed (14)
      Tests  141 passed (141)
```

---

## 5. Definition of Done Checklist

- [x] `submitted` is immediately immutable on the server.
- [x] `in_evaluation` is also immutable without prematurely implementing its transition.
- [x] Submitted evaluation headers and item snapshots reject all prohibited API writes with a consistent `409 PORTFOLIO_SUBMISSION_LOCKED` response.
- [x] Working-portfolio edits cannot silently alter submitted data.
- [x] Personnel can read their own submitted snapshot via `GET /api/v1/personnel/portfolio/submission/latest`.
- [x] Locked UI removes/disables all mutation actions (submit, add, edit, delete, sync) and communicates the lock clearly.
- [x] No Department Secretary routing labels or old local-only status transitions remain in the C2 path.
- [x] New C2 tests and all pre-existing C1 tests pass.
- [x] C3, C4, Plan G, and Plan H scope remains untouched.

---

## 6. Handoff to C3

With Phase C2 successfully completed and verified, the codebase is ready for **Phase C3 (Whole-Portfolio Return for Revision)**.
