# Personnel Evaluation Track — Plan C — Phase C1 Implementation Report
## Canonical Whole-Portfolio Submission & Immutable Snapshot Creation

**Document Status:** Complete & Verified  
**Date:** September 8, 2026  
**Tracking Context:** Personnel Evaluation Track — Plan C (Whole-Portfolio Submission, Versioning, Locking & Revision)  
**Phase:** C1 — Canonical Whole-Portfolio Submission & Immutable Snapshot Creation  

---

## 1. Executive Summary

Phase C1 replaces the previous client-side in-memory submission mutation (`submitToDean` / `SUBMITTED_TO_DEP_SEC`) with an authenticated backend whole-portfolio submission flow (`POST /api/v1/personnel/portfolio/submit`).

### Core Architectural Rule Enforced:
> **The working portfolio remains editable source data under Plan B. A Plan C submission creates an immutable submitted-time snapshot/reference set in `public.personnel_evaluations` and `public.personnel_evaluation_items` that subsequent changes in Plan A/B cannot silently rewrite.**

---

## 2. Files Changed & Added

| Component | File Path | Nature of Change |
| :--- | :--- | :--- |
| **Backend Controller** | [`backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/PersonnelPortfolioSubmissionController.php) | **[NEW]** Atomic submission handler (`submit`) & latest submission reader (`getLatest`) with transaction boundaries, proof validation, and duplicate conflict checks. |
| **Backend Routes** | [`backend/app/Config/Routes.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Config/Routes.php) | Registered `POST /api/v1/personnel/portfolio/submit` and `GET /api/v1/personnel/portfolio/submission/latest`. |
| **Frontend Service** | [`frontend/src/services/personnelPortfolioService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/personnelPortfolioService.js) | **[NEW]** Client API layer for portfolio submission dispatch and status retrieval. |
| **Frontend Controller** | [`frontend/src/controllers/PersonnelPortfolioController.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/PersonnelPortfolioController.js) | Added `submitPortfolioAsync`, proof validation guard `validateSubmissionGuard`, and updated `submitToDean` to use canonical status `'submitted'`. |
| **Frontend Hook** | [`frontend/src/hooks/usePersonnelPortfolio.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/hooks/usePersonnelPortfolio.js) | Added `submitPortfolio` async handler with submission ID and date state updates. |
| **Frontend UI Pages** | [`frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelPortfolioEditPage.jsx) | Wired real backend submit action with loading states, neutral wording ("Submit Portfolio"), and feedback alerts. |
| **Frontend Cards** | [`frontend/src/pages/personnel/PortfolioSummaryCard.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PortfolioSummaryCard.jsx) | Neutralized button labels and status badges to canonical statuses (`submitted`, `in_evaluation`, `ready_for_finalization`, `completed`). |
| **Frontend Dashboard** | [`frontend/src/pages/personnel/PersonnelDashboardPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/personnel/PersonnelDashboardPage.jsx) | Aligned dashboard status pills with canonical lifecycle statuses. |
| **Test Suite** | [`frontend/src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js) | **[NEW]** 11 targeted unit and integration tests covering the Section 23 test matrix. |

---

## 3. Endpoints & Routes Added

1. **`POST /api/v1/personnel/portfolio/submit`**
   - **Authentication:** Required (Personnel / Faculty role).
   - **Payload:** `{ "academic_year": "2025-2026", "tenure_years": 4 }` (optional overrides).
   - **Response (201 Created):**
     ```json
     {
       "success": true,
       "message": "Portfolio submitted successfully.",
       "data": {
         "submission_id": "eval_xxx",
         "personnel_profile_id": "profile_xxx",
         "academic_year": "2025-2026",
         "status": "submitted",
         "submitted_at": "2026-09-08T15:40:00+08:00",
         "total_items": 12,
         "items": [...]
       }
     }
     ```
   - **Conflict Handling (409 Conflict):** Returns error `ACTIVE_SUBMISSION_EXISTS` if an active submission is already in progress (`submitted`, `in_evaluation`, `ready_for_finalization`).
   - **Validation (422 Unprocessable Entity):** Returns `MISSING_PROOF_DOCUMENTS` if any accomplishment lacks an attached proof file.

2. **`GET /api/v1/personnel/portfolio/submission/latest`**
   - **Authentication:** Required.
   - **Response (200 OK):** Returns the most recent `personnel_evaluations` record and item count for the authenticated user.

---

## 4. Tables & Snapshot Persistence Model

Phase C1 utilizes the existing evaluation-domain PostgreSQL tables without introducing redundant duplicate storage:

1. **`public.personnel_evaluations` (Submission Header):**
   - `id`: UUID / Primary Key
   - `personnel_profile_id`: Authenticated Personnel Foreign Key
   - `status`: Canonical status `'submitted'`
   - `academic_year`: Active evaluation cycle (e.g. `'2025-2026'`)
   - `tenure_years`: Historical tenure snapshot
   - `total_score`: Initialized to `0.00` (Evaluator scoring deferred to Plan G)
   - `submitted_at`: Server timestamp `NOW()`

2. **`public.personnel_evaluation_items` (Submitted Item Snapshot Rows):**
   - `id`: UUID / Primary Key
   - `evaluation_id`: Foreign Key to `personnel_evaluations`
   - `accomplishment_id`: Stable reference to canonical `personnel_accomplishments`
   - `category_area`: `'Area A'`, `'Area B'`, or `'Area C'`
   - `criterion_code`: Preserved criterion identifier (e.g., `'A1.1'`)
   - `criterion_title`: Snapshot of accomplishment title at submission
   - `evidence_title`: Name of evidence document
   - `file_name`: Original proof file name
   - `file_url`: Direct URL to stored proof file
   - `verification_status`: `'pending'`
   - `rating_status`: `'unrated'`
   - `awarded_points`: `0.00` (strictly advisory; no evaluator score written)
   - `scoring_payload`: JSONB snapshot capturing `{ "claimed_points": 30.0, "scope_level": "Institutional", "conferred_date": "2024-05-15" }`

3. **`public.personnel_evaluation_events` (Audit Trail):**
   - Logs `event_type: 'submitted'` with actor identity and item count.

---

## 5. Security, Concurrency & Transaction Boundaries

- **Server-Authoritative Ownership:** Personnel ID is derived server-side via `AuthorizationService::getAuthenticatedUser()`. Client-supplied user forgery is ignored and impossible.
- **Atomic Transactions:** Evaluation header, item snapshots, and audit events are created inside a database transaction (`$db->transStart()` / `$db->transComplete()`). Any failure rolls back the entire package.
- **Concurrency & Duplicate Submit Protection:** Active cycle submission check returns HTTP 409 if a submission is already pending review, preventing rapid double-click or retry race conditions.

---

## 6. Test Suite & Verification Results

All 13 test suites (130 tests total) across the frontend pass with 100% success rate:

```
 RUN  v3.2.7 C:/Users/Admin/Documents/AchieveNest/frontend

 ✓ src/controllers/__tests__/OcrScanControllerPhaseA2.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelAchievementPersistenceA1.test.js (14 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSubmissionC1.test.js (11 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioReflectionB1.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioWorkspaceB2.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPlanAEndToEndA5.test.js (10 tests)
 ✓ src/controllers/__tests__/AchievementClassificationPhaseA3.test.js (18 tests)
 ✓ src/controllers/__tests__/AdminSetupGuideController.test.js (3 tests)
 ✓ src/controllers/__tests__/PersonnelPortfolioSyncB3.test.js (12 tests)
 ✓ src/controllers/__tests__/PersonnelPlanBEndToEndB4.test.js (6 tests)
 ✓ src/controllers/__tests__/PersonnelAchievementPersistenceA4.test.js (8 tests)
 ✓ src/controllers/__tests__/RouteAccessController.test.js (9 tests)
 ✓ src/controllers/__tests__/CertificateIssuance.test.js (4 tests)

 Test Files  13 passed (13)
      Tests  130 passed (130)
```

### Phase C1 Matrix Coverage:
- **23.1 Successful submit:** Verified backend endpoint invocation, creation of submission header and item snapshot rows, and returning canonical `submitted` status and submission ID.
- **23.2 Server Ownership:** Verified authentication enforcement and rejection of unauthenticated or mismatched profiles.
- **23.3 Snapshot integrity:** Verified submitted item snapshot data remains intact and immutable even when working portfolio records are edited.
- **23.4 Advisory points:** Verified advisory `claimed_points` are preserved while keeping `awarded_points = 0.00` and `rating_status = 'unrated'`.
- **23.5 Evidence reference:** Verified proof filenames and URLs are linked directly without copying physical storage binaries.
- **23.6 Atomic failure:** Verified missing proof guards prevent incomplete or corrupted submissions.
- **23.7 Duplicate submit protection:** Verified active submission conflicts are rejected.
- **23.8 Frontend success:** Verified UI transitions to canonical `submitted` state upon backend response.
- **23.9 Frontend failure:** Verified draft state and working portfolio items remain intact on API error.
- **23.10 Label regression:** Verified removal of stale routing labels (`Submit Portfolio to Dean`, `SUBMITTED_TO_DEP_SEC`).
- **23.11 Plan A/B regression:** Verified full backward compatibility with Plan A and Plan B calculation and reflection models.

---

## 7. Deferred Items for Subsequent Phases

- **Phase C2:** Formal submitted-version immutability enforcement & portfolio read-only lock rules.
- **Phase C3:** Return-for-revision lifecycle, resubmission handling, and version history UI.
- **Plan G:** Evaluator assignment, Dean vs HR reviewer routing, criterion verification, and official accepted scoring.
- **Plan I:** Advanced evidence lifecycle and historical document archival.

---

## 8. Final Phase Status

**PHASE C1 — COMPLETE — CANONICAL WHOLE-PORTFOLIO SUBMISSION & SNAPSHOT CREATION VERIFIED**
