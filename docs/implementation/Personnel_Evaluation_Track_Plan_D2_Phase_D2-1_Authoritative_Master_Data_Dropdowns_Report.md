# Personnel Evaluation Track — Plan D2 — Phase D2-1
## Authoritative Master-Data Dropdowns Implementation Report

### Executive Summary

Phase D2-1 has successfully replaced disconnected/free-text HR Personnel provisioning fields with authoritative persisted master-data dropdowns across Create and Edit Personnel workflows. The master-data binding layer integrates directly with the Plan E 26-rank catalog for Full-Time Faculty, the Plan E 4-title catalog for Part-Time Faculty, the institutional College master source for Academic placement, and the seeded administrative units source for Non-Academic placement, resolving `D2-RISK-01`, `D2-RISK-02`, `D2-RISK-06`, and `D2-RISK-07`.

---

### Key Accomplishments & Architectural Implementations

#### 1. Starting D2-0 Findings Resolution
- `D2-RISK-01` (Academic Rank disconnected from Plan E catalog): **RESOLVED**. Both `OnboardPersonnelModal.jsx` and `EditMasterDataModal.jsx` now render structured dropdowns backed by `personnelMasterDataService.getFacultyRanks()` (the 26-rank Plan E catalog).
- `D2-RISK-02` (College dropdown derived from `personnelList`): **RESOLVED**. Colleges are sourced independently via `personnelMasterDataService.getColleges()`, guaranteeing that an empty Personnel Directory (`personnelList = []`) still loads all institutional colleges.
- `D2-RISK-06` (Full-Time/Part-Time catalog crossover via free text): **RESOLVED**. Prevented on frontend (reactive catalog switching & selection clearing) and enforced on backend (`CATALOG_CROSSOVER_REJECTED` 422 response).
- `D2-RISK-07` (Provisioning whitelist omits key Personnel fields): **RESOLVED**. `TargetProvisioningController.php::$allowedFields` now includes `current_rank_title`, `qualification_summary`, `faculty_engagement`, `employment_status`, `position_title`, `college_id`, `academic_program_ids`, `administrative_unit_id`, `personnel_group`, and `organizational_side`.

#### 2. Full-Time Rank Catalog Binding
- Sourced from canonical `faculty_rank_catalog` / Plan E catalog service.
- 26 canonical ranks across Baccalaureate, Masteral, Doctoral, and University Professor tiers.
- Persists canonical rank string backed by stable Plan E code.

#### 3. Part-Time Title Catalog Binding & Strict Isolation
- Sourced from canonical Plan E Part-Time title catalog:
  - *Professorial Lecturer*
  - *Assistant Professorial Lecturer*
  - *Senior Lecturer*
  - *Lecturer*
- Full-Time ranks are excluded when `faculty_engagement = 'part_time_faculty'`.
- Part-Time titles are excluded when `faculty_engagement = 'full_time_faculty'`.

#### 4. Reactive Full-Time / Part-Time Catalog Switching
- When the HR administrator toggles between Full-time and Part-time Faculty:
  1. Incompatible unsaved selections are immediately cleared.
  2. The appropriate catalog is loaded and bound to the select control.
  3. Compatible saved values remain intact during edit.
  4. Silent coercion between catalogs is strictly prohibited.

#### 5. Institutional College Source & Empty-State Defect Repair
- Institutional College API (`/api/v1/colleges`) is queried directly.
- Placement options utility `mergePlacementMasterData` combines scraped options with institutional master data.
- Tested and verified with `personnelList = []` — full college list renders cleanly.

#### 6. Department Terminology & Seeded Master-Data Binding
- In HR Create/Edit Personnel provisioning UI, visible term `Administrative Unit` was updated to `Department`.
- Options are populated from persisted administrative units (`Records Section`, `Library`, `Business Office`, etc.).
- Stable UUID (`administrative_unit_id`) is persisted.

#### 7. Stable ID Persistence & Presentation Separation
- Persists canonical `college_id` (UUID/integer) and `administrative_unit_id` (UUID).
- Display labels (e.g. `"CAS — College of Arts and Sciences"`) remain presentation-only.

#### 8. Organizational-Side Conditional Logic & Group Guard
- `Faculty + Academic`: College assignment required.
- `Non-Teaching Faculty + Academic`: College assignment required.
- `Non-Teaching Faculty + Non-Academic`: Department assignment required.
- `Faculty + Non-Academic`: Strictly **REJECTED** on frontend and backend.

#### 9. Existing-Rank Preservation During Edit
- `EditMasterDataModal.jsx` loads and retains the existing saved rank.
- Legacy saved ranks not found in the standard catalog are presented as `(Saved / Legacy Record)` to prevent destructive overwrite.

---

### Boundaries & Explicit Deferrals

1. **Qualification-Driven Rank Recommendation**: Explicitly **DEFERRED to Phase D2-2**. Phase D2-1 persists the `qualification_summary` field without prematurely triggering automated rank resolution.
2. **Position / Job Title Catalog**: Confirmed **UNRESOLVED**. Remains an open-entry string field up to 150 characters. No guessed position master data was fabricated.
3. **Evaluation-Summary Department Projection**: Explicitly **DEFERRED to Phase D2-4**.

---

### Verification Matrix & Test Results

- **Focused Phase D2-1 Test Suite** (`src/controllers/__tests__/PersonnelMasterDataDropdownsD2Phase1.test.jsx`):
  - **40 / 40 Tests Passed (100%)**
- **Phase D2-0 Audit Test Suite** (`src/controllers/__tests__/PersonnelPlanD2Phase0Audit.test.jsx`):
  - **24 / 24 Tests Passed (100%)**
- **Full Master Test Suite**:
  - **155 Test Files / 1,697 Tests Passed / 0 Failures / 0 Errors**
- **Backend PHP Linting**:
  - `TargetProvisioningController.php`: 0 syntax errors
  - `FacultyStatusService.php`: 0 syntax errors
  - `TargetHRPersonnelController.php`: 0 syntax errors

---

### Phase Status

**PHASE D2-1 COMPLETE — AUTHORITATIVE RANK/TITLE, COLLEGE & DEPARTMENT MASTER-DATA DROPDOWNS, STABLE-ID PERSISTENCE & CATALOG ISOLATION VERIFIED**
