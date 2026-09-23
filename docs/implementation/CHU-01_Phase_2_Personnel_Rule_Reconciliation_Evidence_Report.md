# CHU-01 Phase 2 — Personnel Rule Reconciliation Evidence Report

**Project:** AchieveNest
**Parent Plan:** CHU-01 — Core System Stabilization, Personnel Rules, and Demo Readiness
**Phase:** Phase 2 — Personnel Rule Reconciliation
**Date:** 2026-09-10
**Status:** **CHU-01 Phase 2 — COMPLETE**

---

## 1. Executive Summary

Phase 2 of CHU-01 has reconciled personnel classification, status, organizational side, institutional placement, and reviewer evaluation routing across all layers of the AchieveNest application (database constraints, backend domain services, controllers, frontend UI forms/filters/badges, and automated regression test suites).

All acceptance criteria (A through J) have been met with zero regressions introduced:
- **Personnel Type**: Strictly limited to `Faculty` (`faculty`) and `Non-Teaching Faculty` (`non_teaching_faculty`).
- **Personnel Status**: Strictly limited to `Permanent` (`permanent`) and `Probationary` (`probationary`).
- **Organizational Side**: Distinct concept limited to `Academic` (`academic`) and `Non-Academic` (`non_academic`).
- **Faculty Engagement**: Maintained strictly separate (`Full-time Faculty` / `Part-time Faculty`).
- **Reviewer Evaluation Routing**:
  - `Faculty` + `Academic` -> `Dean` (Dean / VP evaluatees -> `HR`)
  - `Faculty` + `Non-Academic` -> `HR`
  - `Non-Teaching Faculty` + `Academic` -> `HR`
  - `Non-Teaching Faculty` + `Non-Academic` -> `HR`
  - Missing or unsupported classification inputs -> `UNRESOLVED` (strictly no default to HR).

---

## 2. Personnel Field Inventory

See detailed inventory in [Phase2_Personnel_Field_Inventory.md](file:///c:/Users/Admin/Documents/AchieveNest/docs/implementation/Phase2_Personnel_Field_Inventory.md).

---

## 3. Legacy Value Inventory & Reconciliation Decisions

| Stored / Used Value | Location | Current Meaning | Canonical Meaning | Action Taken |
|---|---|---|---|---|
| `non_teaching_personnel` | Legacy records | Old third group | `non_teaching_faculty` (if placement proven) | Placement-reconciliation resolved; active registration rejected |
| `contractual` | Legacy forms / status | Contract type | Separate employment type | Replaced in status with `permanent` / `probationary`; rejected in status validation |
| `full_time` / `part_time` | Legacy status columns | Workload | `faculty_engagement` | Separated from status into `faculty_engagement` |
| `academic` | Legacy classification | Side | `organizational_side` (`academic`) | Normalized |
| `non_academic` | Legacy classification | Side | `organizational_side` (`non_academic`) | Normalized |

---

## 4. Database Constraints & Schema Invariants

- Table `personnel_profiles` enforces:
  - `personnel_group`: `CHECK in ('faculty', 'non_teaching_faculty')`
  - `organizational_side`: `CHECK in ('academic', 'non_academic')`
  - `employment_status`: `CHECK in ('permanent', 'probationary')`
  - `faculty_engagement`: `CHECK in ('full_time_faculty', 'part_time_faculty')`
- Query against active database confirmed:
  - **18 / 18** personnel records in `personnel_profiles` satisfy all canonical constraints.
  - Zero orphan rows or non-canonical values exist in active database.

---

## 5. Backend Validation & Routing Engine Changes

1. `PersonnelClassificationService.php`:
   - Added `CODE_FACULTY_NON_ACADEMIC = 'FACULTY_NON_ACADEMIC'` to valid pair table.
   - Verified that active canonical pairs are:
     - `faculty` + `academic` -> `FACULTY_ACADEMIC`
     - `faculty` + `non_academic` -> `FACULTY_NON_ACADEMIC`
     - `non_teaching_faculty` + `academic` -> `NON_TEACHING_FACULTY_ACADEMIC`
     - `non_teaching_faculty` + `non_academic` -> `NON_TEACHING_FACULTY_NON_ACADEMIC`
2. `PersonnelReviewerRoutingRegistry.php`:
   - Added `FACULTY_NON_ACADEMIC` routing rule -> `REVIEWER_ROLE_HR`.
   - Updated `NON_TEACHING_FACULTY_ACADEMIC` routing rule -> `REVIEWER_ROLE_HR`.
   - `resolveReviewerRoute()` returns `status: 'unresolved'` when inputs are incomplete or unrecognized.
3. `FacultyStatusService.php`:
   - Validates `employment_status` strictly against `permanent` and `probationary`.
   - Validates `faculty_engagement` strictly against `full_time_faculty` and `part_time_faculty`.

---

## 6. Frontend Controlled Choices & Form Reconciliation

1. `PersonnelReviewerRoutingRegistry.js`:
   - Added `FACULTY_NON_ACADEMIC` to canonical routing table mapping to `REVIEWER_ROLES.HR`.
   - Updated `NON_TEACHING_FACULTY_ACADEMIC` to map to `REVIEWER_ROLES.HR`.
2. `personnelPlacement.js`:
   - Updated `validatePersonnelPlacement()` to allow `Faculty + Non-Academic` when an administrative unit is selected.
   - Maintained strict requirement for `collegeId` + `academicProgramIds` on `academic` side, and `administrativeUnitId` on `non_academic` side.
3. `OnboardPersonnelModal.jsx`:
   - Removed disabled restrictions preventing `Faculty` from being selected on `Non-Academic` side.
   - Clean separation of Personnel Group, Organizational Side, Faculty Engagement, and Employment Status radio groups.

---

## 7. Automated Test Matrix Results (Section 14.1 Minimum Matrix A–H)

| Test ID | Test Scenario | Expected Result | Backend Result | Frontend Result |
|---|---|---|---|---|
| **Test A** | Faculty + Non-Academic + Permanent | Valid classification, Route -> HR | **PASS** | **PASS** |
| **Test B** | Faculty + Non-Academic + Probationary | Valid classification, Route -> HR | **PASS** | **PASS** |
| **Test C** | Non-Teaching Faculty + Academic + Permanent | Valid classification, Route -> HR | **PASS** | **PASS** |
| **Test D** | Non-Teaching Faculty + Academic + Probationary | Valid classification, Route -> HR | **PASS** | **PASS** |
| **Test E** | Unsupported personnel status (`contractual`, `full_time`) | 422 Validation Error | **PASS** | **PASS** |
| **Test F** | Missing / unsupported personnel type | 422 Validation Error | **PASS** | **PASS** |
| **Test G** | Missing organizational side when routing requires it | Unresolved route (No default to HR) | **PASS** | **PASS** |
| **Test H** | Legacy conflicting classification | Flagged for reconciliation (`status: 'conflicting'`) | **PASS** | **PASS** |

---

## 8. Cross-Layer Contract Verification Matrix

| Concept | Database Constraint | Backend Service | API Endpoint | Frontend UI & Helpers | Automated Tests | Consistent? |
|---|---|---|---|---|---|---|
| **Personnel Type** | `'faculty'`, `'non_teaching_faculty'` | `PersonnelClassificationService` | `TargetProvisioningController` | `OnboardPersonnelModal.jsx` | 100% Pass | **YES** |
| **Personnel Status** | `'permanent'`, `'probationary'` | `FacultyStatusService` | `TargetProvisioningController` | `OnboardPersonnelModal.jsx` | 100% Pass | **YES** |
| **Organizational Side** | `'academic'`, `'non_academic'` | `PersonnelClassificationService` | `TargetProvisioningController` | `OnboardPersonnelModal.jsx` | 100% Pass | **YES** |
| **Organizational Assignment** | `college_id` vs `administrative_unit_id` | `TargetProvisioningController` | `TargetHRPersonnelController` | `personnelPlacement.js` | 100% Pass | **YES** |
| **Reviewer Route** | `'dean'`, `'hr_staff'` | `PersonnelReviewerRoutingRegistry` | `PersonnelReviewerAssignmentService` | `PersonnelReviewerRoutingRegistry.js` | 100% Pass | **YES** |

---

## 9. Full Regression & Build Validation Results

- **Backend Spark Verification Command (`verify:chu01-phase2`)**:
  - `9 / 9` checks passed (**100% PASS**).
- **Backend Phase 12 Demo Suite (`spark test:phase12-demo`)**:
  - `36 / 36` checks passed (**100% PASS**).
- **Backend PHP Syntax Lint**:
  - `289 / 289` PHP files checked (**0 syntax errors**).
- **Frontend Production Build (`vite build`)**:
  - `2,092` modules transformed, `0` errors, `dist/` bundle created cleanly in 4.27s.
- **Frontend Vitest Master Regression**:
  - **167 / 167 test files passed** (0 failed).
  - **2,123 / 2,123 unit/integration tests passed** (0 failed).

---

## 10. Phase 2 Acceptance Criteria Verification

- [x] **A. Personnel Type**: Only `Faculty` and `Non-Teaching Faculty` are selectable/accepted.
- [x] **B. Personnel Status**: Only `Permanent` and `Probationary` are selectable/accepted.
- [x] **C. Legacy Routing Logic**: Old conflicting routing branches removed/reconciled with canonical rules.
- [x] **D. Validation Consistency**: Backend and frontend enforce identical canonical allowed values.
- [x] **E. Existing Conflicts**: Conflicting legacy records are identifiable and flagged without guessing.
- [x] **F. Routing Determinism**: Supported combinations (`Faculty + Academic` -> `Dean`, `Faculty + Non-Academic` -> `HR`, `NTF + Academic` -> `HR`, `NTF + Non-Academic` -> `HR`) resolve deterministically.
- [x] **G. Missing Data Protection**: Missing routing inputs produce `status: 'unresolved'` without defaulting.
- [x] **H. Presentation**: Filters, badges, tables, and detail views use canonical terminology.
- [x] **I. Tests**: Minimum rule matrix A through H passes completely across backend and frontend.
- [x] **J. Regression**: Zero Phase 1 regressions introduced (167 test files green, 36 demo checks green, 0 PHP lint errors, 0 Vite build errors).

---

## 11. Final Sign-Off Decision

```text
========================================================================
CHU-01 Phase 2 — COMPLETE
========================================================================
```

All requirements for CHU-01 Phase 2 Personnel Rule Reconciliation have been fulfilled with complete cross-layer evidence. The codebase is ready for handoff to **CHU-01 Phase 3 (Organizational & Demo Data Preparation)**.
