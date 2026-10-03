# CHU-02 Phase 3A — College Dean Module Audit & Authority Reconciliation

## Document Purpose
This document audits and classifies all College Dean portal modules, routes, components, endpoints, and authority rules under **CHU-02 Phase 3**.

---

## 1. Dean Module Inventory & Classification Matrix

| Module | Route | Frontend Component | Backend Endpoint | Source Tables | Intended Action | Current Status | Classification |
|---|---|---|---|---|---|---|---|
| **Dean Dashboard Overview** | `/personnel/dashboard?tab=overview` | `PersonnelDashboardPage.jsx` | `GET /api/v1/dean/annual-reviews` | `dean_assignments`, `colleges`, `personnel_annual_reviews` | Monitor college overview, pending reviews, and faculty count. | **Active & Green** | `REQUIRED` |
| **Faculty Ranking Reviews** | `/personnel/dashboard?tab=workspace` | `DeanAnnualReviewWorkspace.jsx` & `DeanRecordReviewModal.jsx` | `GET/POST /api/v1/dean/annual-reviews` | `personnel_annual_reviews`, `personnel_profiles`, `profiles` | Record and supersede Annual Review / Portfolio Validation inputs for faculty in matching college. | **Active & Green** | `REQUIRED` |
| **College Faculty Roster** | `/personnel/dashboard?tab=personnel` | `PersonnelDashboardPage.jsx` (Dean view) | `GET /api/v1/dean/annual-reviews` | `personnel_profiles`, `colleges`, `dean_assignments` | Read-only listing of all faculty members affiliated with Dean's assigned college. | **Active & Green** | `READ-ONLY / MONITORING` |
| **Dean Nominations (OSAD)** | `/personnel/dashboard?tab=nominations` | Dean nomination modals | `POST /api/v1/dean/nominations` | `dean_nominations`, `award_cycles` | Submit student award nominations for university awards. | **Active & Green** | `REQUIRED` |
| **Personal Portfolio & Achievements** | `/personnel/portfolio` & `/personnel/portfolio/edit` | `PersonnelPortfolioPage.jsx` & `PersonnelPortfolioEditPage.jsx` | `GET/POST /api/v1/personnel/portfolio/*` | `personnel_portfolio_submissions` | Manage Dean's personal faculty portfolio (evaluates authoritatively to HR). | **Active & Green** | `REQUIRED` |

---

## 2. Reconciled Dean Authority Rules
1. **Dean Evaluates Faculty + Academic under Matching College**:
   - Authorized only for personnel with `personnel_group = 'faculty'`, `organizational_side = 'academic'`, and `college_id = dean.assigned_college_id`.
2. **Self-Evaluation Strictly Prohibited**:
   - `validateDeanAuthorization()` explicitly rejects if `deanProfileId === personnelProfileId`.
3. **Dean Evaluation Routes to HR**:
   - Dean's own ranking evaluation is processed by the HR Administrator Queue under `UNIVERSITY_HR_SCOPE`.
4. **No Cross-College or HR-Wide Visibility**:
   - Deans cannot view or evaluate personnel from other colleges or non-academic administrative units.
