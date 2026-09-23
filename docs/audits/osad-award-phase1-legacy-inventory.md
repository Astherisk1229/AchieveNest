# Phase 1 Legacy Inventory: OSAD Award Evaluation & Portfolio Scoring

**Document Identifier:** `docs/audits/osad-award-phase1-legacy-inventory.md`  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98` (Branch: `audit/project-architecture-linkage`)  
**Audit Date:** 2026-09-01  
**Phase:** 1 of 8 (Repository Audit & Legacy Isolation)  
**Status:** **INVENTORY FROZEN**

---

## 1. Executive Summary

This inventory establishes an authoritative, traceable record of every occurrence of the **legacy generic award/ranking model** across the AchieveNest repository.

The legacy concepts audited include:
- `min_points` (arbitrary global point threshold)
- `weight_multiplier` (generic score scaling)
- global student `total_points` driving candidate selection
- `weighted_score = total_points × weight_multiplier`
- Generic/mock awards (`Leadership Excellence Award`, `Student Researcher of the Year`, `Culture & Arts Distinction Award`, `Institutional Academic Honor Roll`)
- Fixed leaderboard / Top 3 / podium ranking cutoffs
- "Run Ranking Engine" workflow

---

## 2. Legacy Occurrence Inventory Table

| ID | File Path | Line(s) | Legacy Concept | Current Behavior | Callers / Importers | Classification | Target Architecture | Risk | Removal Prerequisite | Phase |
|---|---|---|---|---|---|:---:|---|:---:|---|:---:|
| **P1-001** | `frontend/src/controllers/AwardManagementController.js` | 17-18 | `min_points`, `weight_multiplier` | Sets default `min_points: 100` and `weight_multiplier: 1.0` during award category creation | `OSADAwardCategoriesPage.jsx` | **DEPRECATE** | Award definitions manage active cycle & approved version; scoring is award-specific | High | Phase 2 15-award seed & Phase 5 scoring | Phase 5 |
| **P1-002** | `frontend/src/controllers/AwardManagementController.js` | 43 | `weighted_score` | Computes awardee `total_score` from `weighted_score` or raw score | `OSADAwardCandidateReviewPage.jsx` | **MIGRATE** | Score recorded from normalized `student_award_evaluations` | Medium | Phase 6 OSAD UX replacement | Phase 6 |
| **P1-003** | `frontend/src/controllers/OSADController.js` | 244-310 | Mock awards (`Leadership Excellence Award`, `Student Researcher of the Year`, etc.) | Hardcoded array of 5 generic award categories with `min_points` and `weight_multiplier` | `OSADAwardCategoriesPage.jsx`, `OSADDashboardPage.jsx` | **DEPRECATE** | Replaced by authoritative `award_definitions` loaded via `/api/v1/osad/awards` | High | Phase 2 15-award seed complete | Phase 2 |
| **P1-004** | `frontend/src/controllers/OSADController.js` | 904-927 | `createAwardCategory` | Allows OSAD admin to create arbitrary categories with custom `min_points` & `weight_multiplier` | `CreateAwardCategoryModal.jsx` (if rendered) | **DEPRECATE** | System uses canonical 15 award catalog; admin adjusts cycle threshold, not formulas | High | Phase 2 catalog lock | Phase 2 |
| **P1-005** | `frontend/src/controllers/OSADController.js` | 953-990 | `getStudentLeaderboards` | Ranks students globally by `total_points` over 500 max baseline | `OSADDashboardPage.jsx` | **MIGRATE** | Global student leaderboard is purely informational, decoupled from award candidate generation | Low | Phase 6 Dashboard refactor | Phase 6 |
| **P1-006** | `frontend/src/controllers/OSADController.js` | 992-1017 | `generateAwardCandidates` | Filters students where `total_points >= min_points` and computes `weighted_score = total_points * weight_multiplier` | `OSADAwardCandidateReviewPage.jsx` | **DEPRECATE** | Replaced by server-side `AwardCandidateGenerationService` ($\ge 80\%$ Potential Score) | Critical | Phase 3/5 candidate engine complete | Phase 5 |
| **P1-007** | `frontend/src/controllers/OSADController.js` | 1019-1050 | `confirmAwardee` | Confirms sole awardee per category using `weighted_score` | `OSADAwardCandidateReviewPage.jsx` | **MIGRATE** | Deliberation state machine & final awardee confirmation via API | Medium | Phase 6 Deliberation UI | Phase 6 |
| **P1-008** | `frontend/src/pages/osad-admin/OSADAwardCategoriesPage.jsx` | 86-90 | `min_points`, `weight_multiplier` fallback | Fallback award categories array with legacy properties if API fetch fails | Router `/osad/awards` | **MIGRATE** | Pure API-backed rendering of `award_definitions` with subcriterion breakdown | Medium | Phase 2 API integration verified | Phase 2 |
| **P1-009** | `frontend/src/services/AwardPortfolioReviewService.js` | 43, 87 | `min_points` | Uses `category.min_points || 50` as threshold for Stage 1 candidate review | `OSADAwardCandidateReviewPage.jsx` | **MIGRATE** | Evaluates award-specific criterion points against normalized computable max | High | Phase 5 scoring engine integration | Phase 5 |
| **P1-010** | `frontend/src/services/AwardPortfolioReviewService.js` | 45-48, 93-96 | Generic 3-part criteria | Hardcoded fallback criteria: Academic (40), Leadership (35), Community (25) | `OSADAwardCandidateReviewPage.jsx` | **MIGRATE** | Uses exact criteria & components from `award_criteria` & `award_criterion_components` | High | Phase 2 & 5 criteria mapping | Phase 5 |
| **P1-011** | `frontend/src/pages/osad-admin/OSADAwardCandidateReviewPage.jsx` | 86-90, 114 | Mock category list with `min_points` | In-memory mock fallback categories (`Dean's List`, `Leadership`, `Sports`, `Research`) | Router `/osad/candidates` | **MIGRATE** | Award-first workspace loading authoritative 15 awards and evaluated candidate queue | High | Phase 6 candidate review rewrite | Phase 6 |
| **P1-012** | `frontend/src/pages/osad-admin/OSADDashboardPage.jsx` | — | Dashboard award widgets | Displays summary statistics derived from generic categories | Router `/osad/dashboard` | **MIGRATE** | Summaries link to award-first review workspace | Low | Phase 6 dashboard polish | Phase 6 |
| **P1-013** | `frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx` | — | `total_points` column | Displays student total achievement points | Router `/osad/students` | **KEEP** | Retained as non-award profile metric; does not drive award generation | Low | None | N/A |
| **P1-014** | `frontend/src/components/osad/PotentialAwardCandidatesPreview.jsx` | 14-17, 34 | `min_points`, `weight_multiplier` | Uses `(stage1_score >= cat.min_points)` as qualification fallback | `OSADDashboardPage.jsx` | **MIGRATE** | Uses `potential_score >= 80.00` from backend candidate endpoint | Medium | Phase 5 candidate preview update | Phase 5 |
| **P1-015** | `frontend/docs/specs/osad-admin-features-spec.md` | 76, 179-205 | "Run Ranking Engine" spec | Specifications describing `total_points >= min_points` and `weighted_score` | Developer Documentation | **MIGRATE** | Updated to reflect 15-award normalized scoring & deliberation workflow | Low | Phase 8 documentation package | Phase 8 |
| **P1-016** | `frontend/src/services/__tests__/AwardPortfolioReviewService.test.js` | 12-13, 85 | `min_points` test fixtures | Asserts qualification against `min_points: 50` and `min_points: 60` | Test Suite `npm test` | **KEEP (Characterization)** | Preserved as characterization tests; rewritten in Phase 5 to test normalized 80% threshold | High | Phase 5 test suite completion | Phase 5 |
| **P1-017** | `backend/app/Controllers/Api/AwardEvaluationController.php` | 46-73 | `listAwards()` | Loads active `award_definitions` and `award_criteria` + `award_criterion_components` | `frontend/src/services/awardAdminService.js` | **KEEP** | Primary backend foundation for award catalog | Low | None | Phase 1 |
| **P1-018** | `backend/app/Controllers/Api/AwardEvaluationController.php` | 75-127 | `evaluateAward()` | Executes automated student evaluation across criteria | `frontend/src/services/awardAdminService.js` | **KEEP** | Authoritative scoring evaluation controller | Medium | Phase 5 award-specific scoring | Phase 5 |
| **P1-019** | `backend/app/Controllers/Api/AwardEvaluationController.php` | 145-215 | `listCandidates()` | Returns ranked candidate list based on dense ranking of `potential_score` | `OSADAwardCandidateReviewPage.jsx` | **KEEP** | Authoritative candidate queue endpoint | Medium | Phase 5 dense rank validation | Phase 5 |
| **P1-020** | `backend/app/Services/AwardCandidateGenerationService.php` | 79-138 | `generatePotentialCandidates()` | Generates candidates using `potential_score >= threshold_percent` (80%) | `AwardEvaluationController.php` | **KEEP** | Core candidate generation engine | Low | None | Phase 3/5 |
