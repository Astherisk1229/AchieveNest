# Personnel Evaluation Track — Plan C — Phase C3 Implementation Report
## Whole-Portfolio Return for Revision & Reopened Working Revision

**Document Status:** Complete & Verified  
**Date:** September 8, 2026  
**Tracking Context:** Personnel Evaluation Track — Plan C (Whole-Portfolio Submission, Versioning, Locking & Revision)  
**Phase:** C3 — Whole-Portfolio Return for Revision & Reopened Working Revision  
**Predecessor:** C1 submission/snapshot creation and C2 server-enforced immutability  
**Successor:** C4 resubmission and version history  

---

## 1. Executive Summary

Phase C3 implements the whole-portfolio return mechanism allowing authorized reviewers (HR Admin, Dean, or Assigned Evaluators) to return a submitted or in-evaluation personnel portfolio for correction without mutating the immutable historical snapshot created in C1/C2.

The return action captures:
- Required overall return reason
- Required correction instructions
- Optional item-level deficiency comments linked to immutable snapshot items
- Reviewer identity and server timestamp

Upon return, the submission status transitions to `returned_for_revision`. The personnel member's working portfolio draft (Plan B) is reopened for editing, allowing the owner to modify records, attach corrected proofs, and prepare for resubmission (C4), while the historical submitted snapshot and its feedback payload remain locked and immutable.

---

## 2. Files Changed & Added

| Component | File Path | Nature of Change |
| :--- | :--- | :--- |
| **Backend Controller** | [`backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php) | **[NEW]** Added `returnForRevision($id)` endpoint with reviewer authorization, transition guard, payload validation, and item deficiency linkage; updated `getLatest()` to expose `return_feedback`. |
| **Backend Controller** | [`backend/app/Controllers/Api/HREvaluationController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/HREvaluationController.php) | Updated `validateTransition` to permit whole-portfolio return from `submitted` state as well as `in_evaluation`. |
| **Backend Routes** | [`backend/app/Config/Routes.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Config/Routes.php) | Registered `POST /api/v1/personnel/portfolio/submissions/(:segment)/return-for-revision`. |
| **Frontend Service** | [`frontend/src/services/personnelPortfolioService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/personnelPortfolioService.js) | Added `returnPortfolioForRevision(evaluationId, payload)` service method. |
| **Frontend Hook** | [`frontend/src/hooks/usePersonnelPortfolio.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/hooks/usePersonnelPortfolio.js) | Exposed `returnFeedback` and updated lock/editable state logic for `returned_for_revision`. |
| **Frontend UI Pages** | [`frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx) | Rendered prominent **Portfolio Returned for Revision** banner with overall reason, required corrections, and item deficiency comments; restored working draft editing controls. |
| **Frontend Cards** | [`frontend/src/pages/personnel/PortfolioSummaryCard.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PortfolioSummaryCard.jsx) | Aligned status pill to `Returned for Revision` (rose badge). |
| **Test Suite** | [`frontend/src/controllers/__tests__/PersonnelPortfolioReturnC3.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelPortfolioReturnC3.test.js) | **[NEW]** 11 targeted unit and integration tests covering the complete C3 test matrix. |

---

## 3. Endpoints & API Contract

1. **`POST /api/v1/personnel/portfolio/submissions/{id}/return-for-revision`**
   - **Authentication:** Required (Authorized Reviewer: HR Admin, Dean, or Assigned Evaluator).
   - **Request Body:**
     ```json
     {
       "reason": "Proof certificate for PhD degree requires official registrar dry-seal authentication.",
       "required_corrections": "Please re-upload a certified true copy of your diploma with registrar seal.",
       "item_deficiencies": [
         {
           "evaluation_item_id": "item_uuid_123",
           "comment": "Diploma scan is blurred and missing registrar dry seal."
         }
       ]
     }
     ```
   - **Response (200 OK):**
     ```json
     {
       "data": {
         "message": "Portfolio successfully returned for revision.",
         "submission_id": "eval_xxx",
         "status": "returned_for_revision",
         "returned_at": "2026-09-08T11:00:00+08:00",
         "return_reason": "Proof certificate for PhD degree...",
         "required_corrections": "Please re-upload...",
         "item_deficiencies": [...]
       }
     }
     ```
   - **Transition Guard (409 Conflict):** Returns `INVALID_TRANSITION` if current status is not `submitted` or `in_evaluation`.
   - **Validation Guards (422 Unprocessable Entity):** Returns `REASON_REQUIRED`, `CORRECTIONS_REQUIRED`, `INVALID_ITEM_REFERENCE`, or `DUPLICATE_ITEM_DEFICIENCY`.
   - **Authorization Guard (403 Forbidden):** Returns `FORBIDDEN` if actor is not an authorized reviewer.

2. **`GET /api/v1/personnel/portfolio/submission/latest`**
   - When returned, returns `status: 'returned_for_revision'` and structured `return_feedback` containing overall reason, required corrections, reviewer identity, timestamp, and item-level deficiency comments.

---

## 4. Test Matrix & Verification Results

All 15 test suites across the controller layer passed with 100% success rate (152 tests total):

```
 RUN  v3.2.7 C:/Users/Admin/Documents/AchieveNest/frontend

 ✓ src/controllers/__tests__/OcrScanControllerPhaseA2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelAchievementPersistenceA1.test.js (14 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioWorkspaceB2.test.js (12 tests)
 ✓ src/controllers/__tests__/AchievementClassificationPhaseA3.test.js (18 tests)
 ✓ src/controllers/__tests__/PersonnelAchievementPersistenceA4.test.js (8 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSyncB3.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioReflectionB1.test.js (12 tests)
 ✓ src/controllers/__tests__/AdminSetupGuideController.test.js (3 tests)
 ✓ src/controllers/__tests__/PersonnelPlanAEndToEndA5.test.js (10 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioImmutabilityC2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioReturnC3.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPlanBEndToEndB4.test.js (6 tests)
 ✓ src/controllers/__tests__/RouteAccessController.test.js (9 tests)
 ✓ src/controllers/__tests__/CertificateIssuance.test.js (4 tests)

 Test Files  15 passed (15)
      Tests  152 passed (152)
```

---

## 5. Definition of Done Checklist

- [x] An authorized reviewer can return an entire `submitted` or `in_evaluation` portfolio.
- [x] Required overall reason and correction instructions are validated and preserved.
- [x] Optional item-level deficiencies are safely linked to submitted snapshot items.
- [x] The returned evaluation becomes `returned_for_revision`.
- [x] The historical submitted snapshot remains locked and unchanged.
- [x] Personnel receives a distinct, editable working revision with visible feedback.
- [x] No second evaluation or premature submitted version is created in C3.
- [x] Reviewer routing/scoring, finalization, promotion, and C4 version-history work remain untouched.
- [x] C3 tests and all C1/C2 regression tests pass with 100% success rate.

---

## 6. Handoff to C4

With Phase C3 closed and verified, the codebase is ready for **Phase C4 (Resubmission and Version History)**.
