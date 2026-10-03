# Repairs Applied

### 1. `src/utils/personnelPlacement.js`
- Added explicit type and null guards to `isAcademicPersonnel`, `formatPersonnelPlacement`, `formatPersonnelClassification`, `formatFacultyEngagement`, `formatEmploymentStatus`, and `collectPersonnelPlacementOptions`.
- Upgraded `isAcademicPersonnel` to inspect canonical `organizational_side` first, with graceful fallback to `personnel_classification` and `personnel_category`.
- Upgraded `formatPersonnelClassification` to prioritize canonical Plan D fields (`personnel_group` and `organizational_side`).

### 2. `src/pages/hr-admin/personnel-directory/PersonnelDirectoryTable.jsx`
- Added null/undefined guard to `matchesPersonnelSearch`.
- Included `personnel_group` and `organizational_side` in search matcher.
- Upgraded classification sort to use canonical `formatPersonnelClassification(a).localeCompare(formatPersonnelClassification(b))`.
- Upgraded row rendering to use `isAcademicPersonnel(p)`.

### 3. `src/pages/hr-admin/modals/DeanAssignmentModal.jsx`
- Replaced direct `p.personnel_classification === 'academic'` with `isAcademicPersonnel(p)`.
- Added null check on filter item.

### 4. `src/pages/hr-admin/HRFacultyEvaluationOversightPage.jsx`
- Added `useHR()` hook data source fallback when props are omitted.
- Added self-contained search, affiliation filtering, and safe portfolio list rendering.

### 5. Automated Verification Suite
- Added `src/controllers/__tests__/HRNavigationModuleHealth.test.jsx` with 20 focused test cases covering all repairs and invariants.
