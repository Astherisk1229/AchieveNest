# Target-Schema Application Compatibility Audit

**Status:** Completed  
**Branch:** `compat/target-schema-test`  
**Date:** 27 August 2026  

---

## 1. Executive Summary

This audit catalogs all legacy dependencies, structural assumptions, and terminology across the AchieveNest codebase (both backend and frontend). Each item is mapped to its target-schema replacement to ensure zero breaking regressions and clean migration to the finalized `AchieveNest-Test` schema.

---

## 2. Inventory of Legacy References & Target Replacements

| Component / File | Legacy Dependency | Final Target Replacement | Risk Level | Action Required |
|---|---|---|---|---|
| `backend/app/Controllers/Api/AuthController.php` | Legacy `department_id`, `degree_program_id` in `/auth/me` response | `academic_placement`, `personnel_affiliation`, `program_affiliations`, `roles` with assignment scopes | Low | COMPATIBILITY-ONLY alias; Frontend consumes target objects |
| `backend/app/Services/AuthenticatedActorService.php` | `profile_roles.scope_id` for specialized roles | `dean_assignments`, `program_coordinator_assignments`, `organization_moderator_assignments` | Low | IMPLEMENTED |
| `backend/app/Services/ReviewerResolverService.php` | Department-based college derivation | `personnel_college_affiliations` -> `colleges` & `dean_assignments` | Low | IMPLEMENTED |
| `backend/app/Controllers/Api/PersonnelRoleController.php` | `profile_roles` inserts for Dean/Coordinator/Moderator | Specialized assignment tables with active flags | Low | IMPLEMENTED |
| `backend/app/Controllers/Api/TargetProvisioningController.php` | Department-based provisioning | `academic_programs`, `personnel_college_affiliations`, `personnel_administrative_unit_affiliations` | Low | IMPLEMENTED |
| `backend/app/Controllers/Api/TargetHRPersonnelController.php` | `departments` join in HR directory | `personnel_profiles`, `colleges`, `administrative_units` | Low | IMPLEMENTED |
| `backend/app/Controllers/Api/AchievementController.php` | Stub queries against nonexistent `achievements` | `student_portfolio_records`, `student_portfolio_evidence`, `student_portfolio_verification_events` | Medium | REPLACE with target Student Portfolio API |
| `backend/app/Controllers/Api/VerificationQueueController.php` | Generic verification without program assignment check | `program_coordinator_assignments` scope-checked against `student_program_enrollments` | Medium | REPLACE with target coordinator verification logic |
| `frontend/src/services/authService.js` | Legacy session storage missing `academic_placement` / `personnel_affiliation` | Hydrate `academic_placement`, `personnel_affiliation`, `program_affiliations`, `role_assignments` | Medium | REPLACE |
| `frontend/src/utils/roleContext.js` | Department Secretary aliases (`dep_sec`, `secretary`) | Clean role constants: Student, Personnel, Dean, Program Coordinator, Organization Moderator, HR Staff, OSAD Staff | Low | REPLACE / REMOVE legacy roles |
| `frontend/src/config/navigationCatalog.js` | `tab=departments` in OSAD navigation | `tab=academic-programs` (College -> Academic Program) | Low | REPLACE |
| `frontend/src/pages/personnel/department-secretary/*` | Department Secretary dashboard, evaluation workbench, portfolio roster | Deprecated; faculty evaluations route to Dean | High | REMOVE / REPLACE with Dean workflows |
| `frontend/src/pages/osad-admin/OSADDepartmentsProgramsPage.jsx` | Department-centric program hierarchy | `OSADAcademicStructurePage.jsx` (College -> Academic Program) | Medium | REPLACE |
| `frontend/src/pages/hr-admin/HRPersonnelDirectoryPage.jsx` | Department column & filter | Classification (Academic/Non-Academic), College, Administrative Unit, Academic Program filters | Medium | REPLACE |
| `frontend/src/pages/hr-admin/modals/DepartmentSecretaryAssignmentModal.jsx` | DepSec assignment modal | `DeanAssignmentModal.jsx` | Medium | REPLACE |
| `frontend/src/models/AcademicStructureModel.js` | `ACADEMIC_DEPARTMENTS`, `DEGREE_PROGRAMS` | `COLLEGES`, `ACADEMIC_PROGRAMS`, `ADMINISTRATIVE_UNITS` | Low | REPLACE |
| `frontend/src/models/StudentModel.js` | `department`, `degree_program` fields | `academic_program`, `college` | Low | REPLACE |
| `frontend/src/pages/student/StudentAchievementsPage.jsx` | Generic achievement categories & localStorage | Finalized 9-category taxonomy with structured metadata and live API | Medium | REPLACE |
| `frontend/src/pages/student/StudentPortfolioPage.jsx` | Direct award tagging / manual OSAD sectioning | Master Portfolio (verified records) + derived OSAD preview | Medium | REPLACE |
| `frontend/src/pages/personnel/program-coordinator/tabs/SubmissionsTab.jsx` | Mock submissions queue | Live `program_coordinator_assignments` scoped queue | Medium | REPLACE |

---

## 3. Action Protocol

1. **Keep Database Integrity**: Do not drop legacy tables (`departments`, `degree_programs`) during the compatibility phase.
2. **Server-Side Enforcement**: All governance role verification must query the target assignment tables (`dean_assignments`, `program_coordinator_assignments`, `organization_moderator_assignments`).
3. **Reactive Frontend Navigation**: Navigation and user state update immediately upon session hydration and role switching.
