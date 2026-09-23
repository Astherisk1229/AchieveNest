# AchieveNest — Phase F Awards Alignment & Candidate Workflow Refinement Report

**Date:** August 30, 2026  
**Phase:** Phase F — Awards Alignment & Candidate Workflow Refinement  
**Status:** **CLOSED — PASS**

---

## 1. Executive Summary

Phase F has successfully aligned the OSAD Awards UI and backend evaluation workflows with the authoritative institutional rules established for AchieveNest:

1. **Portfolio Evidence Invariant:** Students upload and manage verified achievements under portfolio categories/subcategories. Students do not choose, apply for, or self-nominate for awards.
2. **Automated Evaluation Output:** Automated award evaluation produces **"Potential Award Candidates"** (qualifying threshold `>= 80.00%`), never automatically declaring "Final Awardees" or "Winners".
3. **Authoritative Awards & Criteria Architecture:** Replaced the legacy "Award Categories" concept with the authoritative **Awards & Criteria** view exposing all 15 active institutional awards, 40 criteria, and fixed 80.00% threshold. The legacy `Create Award Category` action has been retired.
4. **Dean Nomination College Scope Enforcement:** Fixed backend authorization and business logic in `AwardEvaluationService` and `AwardPolicy` to strictly enforce that College Deans can nominate only students enrolled in their active assigned College. Cross-College nomination attempts are rejected with HTTP 422.
5. **Score Integrity for Dean Nominations:** Dean nominations create interview eligibility (`eligibility_source = 'dean_nomination'`) with `potential_score = NULL` and `raw_score = NULL`, never fabricating artificial percentages or points.

---

## 2. Verification Summary

### 2.1 Backend Regression Test Suite
- Command: `spark test:phase15-backend`
- Result: **8 / 8 Suites PASSED** (Phase 15 Master Backend Gate: **PASS**)
- Award Evaluation Engine & Dean Nominations: **46 / 46 PASSED**
- Unit / Feature Tests (`AwardCandidateAndDeanScopeTest`, `AwardThresholdActorBindingTest`): **PASS**

### 2.2 Frontend Test Suite
- Command: `npm test -- --run`
- Result: **33 / 33 Test Files PASSED** (207 tests passed)
- Linter: **0 Errors** (`npm run lint`)
- Production Build: **PASS** (`npm run build`)

### 2.3 Dean Nomination Scope Audit
- Report Artifact: [DEAN_NOMINATION_COLLEGE_SCOPE_RECONCILIATION.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/audit/DEAN_NOMINATION_COLLEGE_SCOPE_RECONCILIATION.md)
- Total Existing Dean Nominations: `1`
- Valid Same-College: `1` (`CBA` -> `CBA`)
- Out-of-Scope: `0`

---

## 3. Touched Components & File Manifest

### Backend
- [AwardPolicy.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/Policies/AwardPolicy.php) — Updated Dean nomination policy and authorization rules.
- [AwardEvaluationService.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardEvaluationService.php) — Added student-to-Dean College scope validation.
- [AwardEvaluationController.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/AwardEvaluationController.php) — Added `listAllCandidates()`, threshold mutation arguments helper, and active OSAD admin validator.
- [Routes.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Config/Routes.php) — Registered `GET /api/v1/osad/candidates`.
- [AwardCandidateAndDeanScopeTest.php](file:///c:/Users/Admin/Documents/AchieveNest/backend/tests/Feature/AwardCandidateAndDeanScopeTest.php) — Feature test for candidate endpoints and Dean scope.

### Frontend
- [awardAdminService.js](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/awardAdminService.js) — Administrative client for awards, candidates, and scoring basis.
- [OSADAwardsAndCriteriaPage.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADAwardsAndCriteriaPage.jsx) — Displays 15 authoritative awards, criteria breakdown, and 80.00% threshold.
- [OSADAwardCategoriesPage.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADAwardCategoriesPage.jsx) — Re-exports `OSADAwardsAndCriteriaPage` for backward compatibility.
- [OSADDashboardPage.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADDashboardPage.jsx) — Switched tab to Awards & Criteria and retired obsolete award creation modal.
- [OSADAwardsAndCriteria.test.jsx](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/__tests__/OSADAwardsAndCriteria.test.jsx) — Frontend test suite for awards and criteria.
