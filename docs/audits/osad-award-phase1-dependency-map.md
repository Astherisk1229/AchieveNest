# Phase 1 Dependency Map: OSAD Award Evaluation & Portfolio Scoring

**Document Identifier:** `docs/audits/osad-award-phase1-dependency-map.md`  
**Audit Baseline Commit:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
**Phase:** 1 of 8 (Repository Audit & Legacy Isolation)  
**Status:** **DEPENDENCY CHAINS TRACED**

---

## 1. Executive Summary

This document traces the complete multi-layer dependency chains across frontend UI components, state controllers, API services, backend routes, application controllers, and database tables for both the **legacy generic ranking model** and the **authoritative 15-award scoring foundation**.

---

## 2. Legacy vs. Target Architecture Comparison

```text
LEGACY DEPENDENCY CHAIN (To be isolated & migrated):
┌─────────────────────────────────────────────────────────────┐
│ 1. OSADAwardCategoriesPage.jsx / OSADDashboardPage.jsx      │
│    └─ Displays generic category cards with min_points       │
│ 2. OSADController.js / AwardManagementController.js         │
│    ├─ #awardCategories: 5 mock awards (Leadership, etc.)    │
│    └─ generateAwardCandidates: total_points * weight        │
│ 3. AwardPortfolioReviewService.js                           │
│    └─ Calculates Stage 1 score using fallback criteria      │
│ 4. OSADAwardCandidateReviewPage.jsx                         │
│    └─ Displays in-memory ranked candidates (Rank #1..#N)    │
└─────────────────────────────────────────────────────────────┘

AUTHORITATIVE TARGET DEPENDENCY CHAIN (Preserved & extended):
┌─────────────────────────────────────────────────────────────┐
│ 1. OSADAwardsAndCriteriaPage.jsx (Awards & Scoring Criteria)│
│    └─ Calls fetchAwards() in awardAdminService.js           │
│ 2. GET /api/v1/osad/awards                                  │
│    └─ Handled by AwardEvaluationController::listAwards      │
│ 3. Database Foundation                                      │
│    ├─ award_definitions (15 canonical awards, 80% thresh)  │
│    ├─ award_criteria (40 criteria)                          │
│    ├─ award_criterion_components (subcriteria breakdowns)   │
│    └─ award_scoring_rules & award_evidence_mapping_rules    │
│ 4. Evaluation & Deliberation                                │
│    ├─ AwardCandidateGenerationService (Evaluates >= 80%)    │
│    ├─ GET /api/v1/osad/awards/{id}/candidates               │
│    └─ CampusJournalismScoringBasisModal (Detailed basis)    │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Detailed Dependency Traces

### Chain 1: Award Category Catalog Maintenance
- **Entry Route**: `/osad/awards`
- **Page Component**: [`OSADAwardsAndCriteriaPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADAwardsAndCriteriaPage.jsx)
- **Service Layer**: [`awardAdminService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/awardAdminService.js) (`fetchAwards()`)
- **API Route**: `GET /api/v1/osad/awards`
- **Backend Controller**: [`AwardEvaluationController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/AwardEvaluationController.php) (`listAwards()`)
- **Database Tables**: `award_definitions`, `award_criteria`, `award_criterion_components`
- **Legacy Infiltration**: None in production API flow. Historical mock fallback exists in `OSADController.js` (`P1-003`).

---

### Chain 2: Award Candidate Discovery & Review
- **Entry Route**: `/osad/candidates`
- **Page Component**: [`OSADAwardCandidateReviewPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADAwardCandidateReviewPage.jsx)
- **Controller Layer**: [`AwardPortfolioReviewService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/AwardPortfolioReviewService.js) & [`awardAdminService.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/services/awardAdminService.js)
- **API Route**: `GET /api/v1/osad/candidates` / `GET /api/v1/osad/awards/{id}/candidates`
- **Backend Controller**: [`AwardEvaluationController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/AwardEvaluationController.php) (`listCandidates()`)
- **Backend Service**: [`AwardCandidateGenerationService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardCandidateGenerationService.php)
- **Database Tables**: `award_interview_eligibilities`, `student_award_evaluations`, `award_student_evaluation_summaries`
- **Legacy Infiltration**: `AwardPortfolioReviewService.js` contains legacy client-side fallback `min_points: 50` calculation (`P1-009`) used when offline or in legacy test fixtures.

---

### Chain 3: Student Portfolio Detail & Explainability Trace
- **Trigger**: Click "Scoring Summary" on candidate row
- **Modal Component**: [`CampusJournalismScoringBasisModal.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/modals/CampusJournalismScoringBasisModal.jsx) / [`AwardEvaluationSummaryModal.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/modals/AwardEvaluationSummaryModal.jsx)
- **API Route**: `GET /api/v1/awards/campus-journalism/students/{id}/score` or `GET /api/v1/osad/awards/{awardId}/students/{studentId}/basis`
- **Backend Controller**: [`AwardEvaluationController.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Controllers/Api/AwardEvaluationController.php)
- **Backend Services**: [`CampusJournalismScoringService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/CampusJournalismScoringService.php) / [`AwardEvaluationSummaryService.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Services/AwardEvaluationSummaryService.php)
- **Database Tables**: `student_portfolio_records`, `student_portfolio_evidence`, `award_student_evaluation_summaries`
- **Legacy Infiltration**: None. Operates with 100% mathematical parity against authoritative scoring sheets.
