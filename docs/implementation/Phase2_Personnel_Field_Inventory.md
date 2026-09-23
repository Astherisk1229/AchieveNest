# CHU-01 Phase 2 — Full Personnel Field Inventory

**Project:** AchieveNest
**Parent Phase:** CHU-01 — Core System Stabilization, Personnel Rules, and Demo Readiness
**Phase:** Phase 2 — Personnel Rule Reconciliation
**Document:** Phase 2A Personnel Field Inventory

---

## 1. Database Field Inventory

| Table | Column | Data Type | Nullable | Default | Constraint | Current Meaning | Phase 2 Canonical Meaning |
|---|---|---|---|---|---|---|---|
| `personnel_profiles` | `personnel_group` | `VARCHAR(50)` | YES | `'faculty'` | `CHECK in ('faculty', 'non_teaching_faculty')` | High-level personnel group | Canonical Personnel Type |
| `personnel_profiles` | `organizational_side` | `VARCHAR(50)` | YES | `'academic'` | `CHECK in ('academic', 'non_academic')` | Organizational operational side | Canonical Organizational Side |
| `personnel_profiles` | `personnel_classification` | `VARCHAR(50)` | YES | `'academic'` | Legacy column mirroring side | Mirror of Canonical Organizational Side |
| `personnel_profiles` | `faculty_engagement` | `VARCHAR(50)` | YES | `'full_time_faculty'` | Allowed: `full_time_faculty`, `part_time_faculty` | Faculty workload/engagement | Faculty Engagement (Separate from status) |
| `personnel_profiles` | `employment_status` | `VARCHAR(50)` | YES | `'permanent'` | Allowed: `permanent`, `probationary` | Institutional tenure status | Canonical Personnel Status |
| `personnel_profiles` | `college_id` | `VARCHAR(36)` | YES | `NULL` | FK -> `colleges.id` | Academic college placement | Academic Assignment (Colleges) |
| `personnel_profiles` | `administrative_unit_id` | `VARCHAR(36)` | YES | `NULL` | FK -> `administrative_units.id` | Department / Unit placement | Non-Academic Assignment (Departments) |
| `personnel_profiles` | `current_rank_title` | `VARCHAR(100)` | YES | `NULL` | Plan E full-time rank / part-time title | Academic Rank / Title |
| `personnel_profiles` | `position_title` | `VARCHAR(150)` | YES | `'Faculty Member'` | Appointment / job title | Appointment / Position Title |
| `personnel_profiles` | `qualification_summary` | `VARCHAR(255)` | YES | `NULL` | Summary text of degrees/credentials | Educational Qualification Summary |
| `personnel_evaluations` | `assigned_reviewer_role` | `VARCHAR(50)` | NO | `NULL` | `'dean'`, `'hr_staff'` | Evaluation routing role | Evaluation / Review Route |
| `personnel_evaluations` | `evaluator_profile_id` | `VARCHAR(36)` | YES | `NULL` | FK -> `profiles.id` | Assigned reviewer profile ID | Authorized Evaluator Identity |
| `personnel_evaluations` | `evaluator_college_id` | `VARCHAR(36)` | YES | `NULL` | FK -> `colleges.id` | Dean scope college match | College Boundary for Dean reviews |

---

## 2. Backend Inventory

| Service / Class | Responsibility | Allowed Values Enforced | Canonical Status |
|---|---|---|---|
| `PersonnelClassificationService` | Validates active 2-group pairs, resolves legacy placement | `faculty`, `non_teaching_faculty` & `academic`, `non_academic` | Authoritative Domain Service |
| `PersonnelReviewerRoutingRegistry` | Resolves canonical evaluator routes from personnel context | Routes: `DEAN` (`dean`), `HR` (`hr_staff`) | Authoritative Routing Engine |
| `FacultyStatusService` | Validates employment status and engagement | Status: `permanent`, `probationary`<br>Engagement: `full_time_faculty`, `part_time_faculty` | Authoritative Master Data Service |
| `TargetProvisioningController` | Handles onboarding/registration of personnel accounts | Validates group, side, status, engagement, placement | Authoritative API Controller |
| `TargetHRPersonnelController` | Handles updates to personnel profile & classification | Enforces valid pairs and RBAC | Authoritative API Controller |

---

## 3. Frontend Inventory

| Component / Utility | Location | Exposed Values | Notes |
|---|---|---|---|
| `PersonnelReviewerRoutingRegistry.js` | `frontend/src/services/` | `faculty`, `non_teaching_faculty`, `academic`, `non_academic` | Frontend mirror of backend routing rules |
| `personnelPlacement.js` | `frontend/src/utils/` | Formatting and validation utilities | Formats display labels, validates placement |
| `OnboardPersonnelModal.jsx` | `frontend/src/pages/hr-admin/personnel-directory/` | Radio selections for Type, Side, Status, Engagement | Exposes only canonical allowed values |
| `HRPersonnelDirectoryPage.jsx` | `frontend/src/pages/hr-admin/personnel-directory/` | Filter dropdowns and table badges | Uses canonical display labels |
