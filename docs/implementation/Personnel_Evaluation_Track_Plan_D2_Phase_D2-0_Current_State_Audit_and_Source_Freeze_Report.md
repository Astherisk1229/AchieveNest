# Personnel Evaluation Track — Plan D2 — Phase D2-0
# Current-State Audit & Authoritative Source Freeze Report

**Date**: 2026-09-09  
**Repository Branch**: `audit/project-architecture-linkage`  
**Audited Baseline SHA**: `92d551c9e72f234e8997a61a66ba392552206949`  
**Phase Mode**: STRICT AUDIT-ONLY (Zero mutations to production code, schemas, or seeds)  
**Status**: **PHASE D2-0 COMPLETE — CURRENT HR PERSONNEL PROVISIONING SOURCES, BROKEN BINDINGS, PLAN E REUSE POINTS & UNRESOLVED FIELDS AUDITED AND FROZEN**

---

## 1. Executive Summary & Authoritative Rules Frozen

Phase D2-0 conducted a non-destructive audit of the HR Create/Edit Personnel provisioning flow, database schema, API controllers, frontend services, and downstream evaluation-summary projections. 

### Frozen Authoritative Invariants
1. **Personnel Classification**:
   - Exactly two Personnel Groups: `Faculty` (`faculty`), `Non-Teaching Faculty` (`non_teaching_faculty`).
   - Exactly two Organizational Sides: `Academic` (`academic`), `Non-Academic` (`non_academic`).
   - Valid Combinations: `Faculty + Academic`, `Non-Teaching Faculty + Academic`, `Non-Teaching Faculty + Non-Academic`.
   - Prohibited / Unsupported: `Faculty + Non-Academic`.
2. **Academic Rank / Title Authoritative Sources**:
   - Full-Time Academic Ranks must originate strictly from the Plan E 26-rank catalog (`faculty_rank_catalog`).
   - Part-Time Faculty must use the Plan E 4-title catalog (`part_time_faculty_titles`) and are strictly excluded from rank progression.
3. **Advisory Recommendation & Rank Preservation Invariant**:
   - Qualification-driven rank recommendation is advisory for initial placement and onboarding reconciliation.
   - Established official current rank must win during edit/reconciliation and must never be automatically overwritten.
4. **Institutional Assignment & Evaluation Projections**:
   - Colleges belong to the institutional Academic Structure module (`colleges` table); HR does not create or own a duplicate College catalog.
   - Academic evaluation-summary Department display field must project the **College Name** (`colleges.college_name`).
   - Non-Academic evaluation-summary Department display field must project the **Department / Unit Name** (`administrative_units.unit_name`).
5. **Position / Job Title**:
   - Formally classified as `POSITION / JOB TITLE SOURCE — UNRESOLVED`. No catalog is invented.

---

## 2. Active Create & Edit Personnel UI Paths

| UI Entry Point | Route / Page | Component | Flow Type | Data Source | Submit Target | Status |
|---|---|---|---|---|---|---|
| **Add Personnel Button** | `/hr-admin/personnel-directory` | `OnboardPersonnelModal.jsx` | Create | Local state + `collectPersonnelPlacementOptions` | `POST /api/v1/provisioning/manual-personnel` | **ACTIVE** |
| **Edit Master Data** | `/hr-admin/personnel-directory` | `EditMasterDataModal.jsx` | Edit | Row props + form state | `PUT /api/v1/hr/personnel/{id}/master-data` | **ACTIVE** |
| **Edit Assignment** | `/hr-admin/personnel-directory` | `EditAssignmentModal.jsx` | Edit | Placement options + form state | `PUT /api/v1/hr/personnel/{id}/assignment` | **ACTIVE** |
| **Edit Classification** | `/hr-admin/personnel-directory` | `EditClassificationModal.jsx` | Edit | Row props + form state | `PUT /api/v1/hr/personnel/{id}/classification` | **ACTIVE** |
| **Legacy Create Modal** | Internal modal / legacy dialog | `CreatePersonnelAccountModal.jsx` | Create | `HRModel.COLLEGES`, `HRModel.ACADEMIC_RANKS` | `onSave` callback / local | **INACTIVE (Legacy Reference)** |

---

## 3. Modal Field Source & Persistence Matrix

| Visible Label | Frontend Key | Input Type | Source Classification | Required? | Submitted Key | Backend Target Column |
|---|---|---|---|---|---|---|
| **Employee ID** | `institutionalId` | `text` | Master User Identity | Yes | `institutional_id` | `profiles.institutional_id` |
| **Institutional Email** | `institutionalEmail` | `email` | Master Auth Identity | Yes | `institutional_email` | `users.email` / `profiles.institutional_email` |
| **First Name** | `firstName` | `text` | Master User Profile | Yes | `first_name` | `profiles.first_name` |
| **Middle Name** | `middleName` | `text` | Master User Profile | No | `middle_name` | `profiles.middle_name` |
| **Last Name** | `lastName` | `text` | Master User Profile | Yes | `last_name` | `profiles.last_name` |
| **Suffix** | `suffix` | `text` | Master User Profile | No | `suffix` | `profiles.suffix` |
| **Personnel Group** | `personnelClassification` | Pill toggle | Master Classification | Yes | `personnel_group` | `personnel_profiles.personnel_group` |
| **Organizational Side** | `organizationalSide` | Pill toggle | Master Classification | Yes | `organizational_side` | `personnel_profiles.organizational_side` |
| **College** | `collegeId` | `select` | **DISCONNECTED** (Scrapes loaded employee list) | Yes (if Academic) | `college_id` | `personnel_profiles.college_id` |
| **Department / Unit** | `administrativeUnitId` | `select` | Master Unit FK (Scrapes loaded employee list) | Yes (if Non-Academic) | `administrative_unit_id` | `personnel_profiles.administrative_unit_id` |
| **Faculty Engagement** | `facultyEngagement` | Radio | Canonical Engagement | Yes | `faculty_engagement` | `personnel_profiles.faculty_engagement` |
| **Employment Status** | `employmentStatus` | Radio | Canonical Employment Status | Yes | `employment_status` | `personnel_profiles.employment_status` |
| **Qualification Summary** | `qualificationSummary` | `text` | Free-text string | No | `qualification_summary` | `personnel_profiles.qualification_summary` |
| **Current Academic Rank** | `currentRankTitle` | `text` | **DISCONNECTED** (Free-text string) | No | `current_rank_title` | `personnel_profiles.current_rank_title` |
| **Position / Job Title** | `positionTitle` | `text` | **UNRESOLVED** (Free-text string) | No | `position_title` | `personnel_profiles.position_title` |

---

## 4. Active Backend Endpoints Audit

1. **Create Endpoint (`POST /api/v1/provisioning/manual-personnel`)**:
   - Controller: `TargetProvisioningController.php` (`manualPersonnel`).
   - Auth: Requires HR Admin (`role:hr_admin`).
   - **Identified Disconnect (`D2-RISK-07`)**: `$allowedFields` in `TargetProvisioningController.php` whitelists user identity, group, side, and college/unit IDs, but omits `current_rank_title`, `qualification_summary`, `faculty_engagement`, `employment_status`, and `position_title`.
2. **Master Data Edit Endpoint (`PUT /api/v1/hr/personnel/{id}/master-data`)**:
   - Controller: `TargetHRPersonnelController.php` (`updateMasterData`).
   - Updates: `employment_status`, `position_title`, `current_rank_title`, `qualification_summary`, and `faculty_engagement`.
   - Audit: Appends immutable audit entry to `account_lifecycle_events` requiring a mandatory `reason`.
3. **Classification Edit Endpoint (`PUT /api/v1/hr/personnel/{id}/classification`)**:
   - Updates `personnel_group` and `organizational_side`.
4. **Placement Edit Endpoint (`PUT /api/v1/hr/personnel/{id}/assignment`)**:
   - Updates `college_id`, `academic_program_ids`, and `administrative_unit_id`.

---

## 5. Academic Rank & Part-Time Title Catalogs Audit

1. **Plan E Full-Time Rank Catalog**:
   - Table: `faculty_rank_catalog`
   - Services: `FacultyRankCatalogService.php` / `facultyRankCatalogService.js`
   - Seed Version: `2026.1` (`NDMU-DOC-ACAD-RANKS-2026-V1`)
   - Catalog: 26 ranks across 4 tiers (`doctoral`, `masters`, `board_licensure`, `baccalaureate`).
   - Endpoints: `GET /api/v1/faculty-ranks`, `GET /api/v1/hr/faculty-ranks`, `GET /api/v1/faculty-ranks/{code}`.
2. **Plan E Part-Time Title Catalog**:
   - Table: `part_time_faculty_titles`
   - Services: `PartTimeFacultyTitleService.php` / `partTimeFacultyTitleService.js`
   - Catalog: Exactly 4 canonical titles:
     - `Professorial Lecturer` (Doctoral)
     - `Assistant Professorial Lecturer` (Master's)
     - `Senior Lecturer` (Board Licensure)
     - `Lecturer` (Baccalaureate)
   - Endpoints: `GET /api/v1/faculty-titles/part-time`.
3. **Plan E Initial Rank Resolver**:
   - Services: `FacultyInitialRankService.php` / `facultyInitialRankService.js`
   - Endpoints: `POST /api/v1/faculty-ranks/resolve-initial`, `POST /api/v1/faculty-ranks/reconcile-current`.
   - Behavior: Enforces non-demotion, non-promotion, and preserves existing official ranks.

---

## 6. Institutional College Source & Dropdown Defect Cause

1. **Authoritative Owner**:
   - Owned by the institutional Academic Structure module (`colleges` table).
   - Endpoints: `GET /api/v1/colleges`, `GET /api/v1/academic-programs`.
2. **Dropdown Defect Cause (`D2-RISK-02`)**:
   - `collectPersonnelPlacementOptions` in `frontend/src/utils/personnelPlacement.js` derives options by iterating through active rows in `personnelList`.
   - If the personnel list is empty or no personnel are assigned to a college, `options.colleges` evaluates to `[]`.
   - The UI never executes an HTTP call to `GET /api/v1/colleges`.

---

## 7. Department Semantics & Evaluation Summary Projections

### The 5 Semantic Usages of "Department"
1. `academic_programs` — Academic degree program / teaching department.
2. `administrative_units` — Non-academic office / unit (Records Section, Library, Business Office).
3. `Evaluation Summary Display` — Rendered Department label on evaluation reports.
4. `Personnel Directory Filter` — Column filter in HR directory.
5. `Legacy Profile Field` — Deprecated free-text department.

### Evaluation Summary Projection Source vs Target Matrix

| Personnel Group | Organizational Side | Stored Relation | Current Summary Source | Required D2 Projection | Identified Gap |
|---|---|---|---|---|---|
| `Faculty` | `Academic` | `college_id` | `department_name \|\| department \|\| 'Department'` | **College Name** (`colleges.college_name`) | `PersonnelEvaluationPrintService.js` omits `college_name` mapping |
| `Non-Teaching Faculty` | `Academic` | `college_id` | `department_name \|\| department \|\| 'Department'` | **College Name** (`colleges.college_name`) | `PersonnelEvaluationPrintService.js` omits `college_name` mapping |
| `Non-Teaching Faculty` | `Non-Academic` | `administrative_unit_id` | `department_name \|\| department \|\| 'Department'` | **Department / Office Name** (`administrative_units.unit_name`) | `PersonnelEvaluationPrintService.js` omits `administrative_unit_name` mapping |

---

## 8. Broken Binding Register

| Risk Code | Risk Description | Status | Confirmed Evidence & Technical Impact |
|---|---|---|---|
| `D2-RISK-01` | Academic Rank disconnected from Plan E catalog | **CONFIRMED** | `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx` use free-text inputs instead of the 26-rank Plan E catalog. |
| `D2-RISK-02` | College dropdown disconnected / empty | **CONFIRMED** | `collectPersonnelPlacementOptions` scrapes active employee records rather than calling `GET /api/v1/colleges`. |
| `D2-RISK-03` | Administrative Unit terminology & projection mismatch | **CONFIRMED** | Evaluation report falls back to `'Department'` rather than projecting College name or unit name. |
| `D2-RISK-04` | Qualification resolver not wired to modal | **CONFIRMED** | `FacultyInitialRankService` is not called upon qualification entry in `OnboardPersonnelModal.jsx`. |
| `D2-RISK-05` | Existing rank overwritten on edit | **NOT PRESENT** | `EditMasterDataModal.jsx` preserves loaded rank and does not mutate it when qualification changes. |
| `D2-RISK-06` | Full-Time / Part-Time catalog crossover | **CONFIRMED** | Free-text inputs allow entering Part-Time titles for Full-Time faculty and vice-versa. |
| `D2-RISK-07` | Provisioning payload whitelist disconnect | **CONFIRMED** | `TargetProvisioningController.php` rejects `current_rank_title`, `qualification_summary`, `faculty_engagement`, `employment_status`, `position_title` on creation. |
| `D2-RISK-08` | Position / Job Title source unresolved | **CONFIRMED** | Zero institutional catalog exists; remains free-text. Marked explicitly as `POSITION / JOB TITLE SOURCE — UNRESOLVED`. |

---

## 9. Reusable Plan E Services & API Endpoints

| Requirement | Existing API / Service | Status | Reusable? | Plan Owner |
|---|---|---|---|---|
| Full-Time Rank Catalog | `GET /api/v1/faculty-ranks`<br>`facultyRankCatalogService.js` | Complete (26 ranks) | **YES** | Plan E |
| Part-Time Title Catalog | `GET /api/v1/faculty-titles/part-time`<br>`partTimeFacultyTitleService.js` | Complete (4 titles) | **YES** | Plan E |
| Initial Rank Resolver | `POST /api/v1/faculty-ranks/resolve-initial`<br>`facultyInitialRankService.js` | Complete (Advisory) | **YES** | Plan E |
| Part-Time Title Resolver | `partTimeFacultyTitleService.resolvePartTimeTitleSync` | Complete (Advisory) | **YES** | Plan E |
| Colleges Master Endpoint | `GET /api/v1/colleges`<br>`collegeAdminService.js` | Complete | **YES** | Institutional |
| Non-Academic Units Endpoint | `administrative_units` table | Incomplete offices | **YES** | Institutional |
| Personnel Provisioning | `TargetProvisioningController.php` | Whitelist disconnect | **PARTIAL** | Plan D / D2 |
| Personnel Master Data Edit | `TargetHRPersonnelController.php` | Complete with audit trail | **YES** | Plan D / D2 |

---

## 10. Test Matrix & Regression Results

### 1. Focused Audit Test Suite (`PersonnelPlanD2Phase0Audit.test.jsx`)
- **Total Tests**: 24 tests
- **Passed**: 24 tests (100%)
- **Failed**: 0
- **Duration**: 1.35s

### 2. Full Master Regression Suite
- **Total Test Files**: 154 passed / 154 total
- **Total Tests**: 1,657 passed / 1,657 total
- **Failures**: 0
- **Duration**: 90.68s
- **Exit Code**: 0

---

## 11. Evidence Package Manifest

All 31 audit documents, test logs, results, and manifests are preserved under:
`docs/implementation/evidence/plan-d2-d2-0-current-state-audit/`

| Artifact Name | Description |
|---|---|
| `environment.md` | Audit execution environment and metadata |
| `repository-head.md` | Git SHA, branch, and working tree state |
| `create-personnel-entry-points.md` | Active vs legacy create entry point analysis |
| `edit-personnel-entry-points.md` | Master data, assignment, and classification edit flows |
| `modal-field-source-matrix.md` | Comprehensive 15-field source, type, and target matrix |
| `hrmodel-static-data-audit.md` | Audit of `HRModel.js` static lists and fallbacks |
| `academic-rank-source-audit.md` | Academic rank free-text persistence analysis |
| `plan-e-full-time-catalog-audit.md` | Plan E 26-rank catalog and API endpoints |
| `plan-e-part-time-title-audit.md` | Plan E 4 Part-Time titles and non-progression rule |
| `qualification-structure-audit.md` | Qualification summary and review metadata analysis |
| `initial-rank-resolver-audit.md` | Initial rank resolution and non-demotion invariants |
| `part-time-resolver-audit.md` | Part-Time title mapping and qualification resolvers |
| `college-source-audit.md` | Institutional College ownership and canonical endpoints |
| `college-dropdown-binding-audit.md` | Root cause analysis of College dropdown empty-state |
| `administrative-unit-audit.md` | Administrative units table and office master data status |
| `department-semantics-audit.md` | Disambiguation of 5 distinct "Department" usages |
| `evaluation-summary-projection-audit.md` | Evaluation summary Department projection matrix |
| `stable-id-vs-label-audit.md` | Stable ID vs string label persistence audit |
| `provisioning-endpoint-audit.md` | Whitelist disconnect in `TargetProvisioningController.php` |
| `edit-endpoint-audit.md` | Master data mutation and audit trail logging |
| `database-field-matrix.md` | Database schema, foreign keys, and nullable column matrix |
| `personnel-classification-binding-audit.md` | Canonical 3-way valid classification combinations |
| `faculty-vs-employment-status-audit.md` | Independent 4-way engagement and employment matrix |
| `position-job-title-unresolved.md` | Position / Job Title unresolved finding declaration |
| `create-edit-rank-preservation-audit.md` | Rank preservation test during qualification edits |
| `catalog-crossover-audit.md` | Full-Time vs Part-Time crossover vulnerability analysis |
| `reusable-services-matrix.md` | Plan E and institutional reusable services matrix |
| `broken-binding-register.md` | Register of confirmed risks `D2-RISK-01` through `D2-RISK-08` |
| `focused-test-output.txt` | Raw CLI output of 24 focused audit tests |
| `full-suite-output.txt` | Raw CLI summary of 1,657-test full regression suite |
| `full-suite-result.json` | Complete machine-readable Vitest JSON test report |
| `checksum-manifest.md` | SHA-256 integrity checksums for all evidence artifacts |

---

## 12. Conclusion & Readiness for Phase D2-1

Phase D2-0 has fulfilled all requirements with strict zero-mutation compliance:
- Data sources, persistence columns, and validation paths for all personnel fields have been proven.
- Root causes for the College dropdown failure, rank catalog disconnect, and provisioning whitelist gap have been isolated.
- Plan E reusable catalogs and resolvers have been identified and tested.
- Master regression remains at 100% pass (154 files / 1,657 tests passed / 0 failures).

**PHASE D2-0 COMPLETE — CURRENT HR PERSONNEL PROVISIONING SOURCES, BROKEN BINDINGS, PLAN E REUSE POINTS & UNRESOLVED FIELDS AUDITED AND FROZEN**
