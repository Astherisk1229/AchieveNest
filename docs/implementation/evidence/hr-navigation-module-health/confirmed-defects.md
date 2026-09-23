# Confirmed Defects & Root Cause Analysis

### Defect 1: Personnel Directory Null Dereference Crash
- **Observed Exception:** `TypeError: Cannot read properties of null (reading 'personnel_classification')`
- **Location:** `src/utils/personnelPlacement.js` via `src/pages/hr-admin/personnel-directory/EditAssignmentModal.jsx` (and potentially `PersonnelDirectoryTable.jsx` / `DeanAssignmentModal.jsx`).
- **Root Cause:**
  - `isAcademicPersonnel(personnel = {})` used default parameter syntax `personnel = {}`. In JavaScript, default parameters only trigger on `undefined`, NOT on `null` (`null !== undefined`).
  - When `EditAssignmentModal` rendered as part of `HRPersonnelDirectoryPage` with initial state `editingAssignmentPersonnel = null`, `const academic = isAcademicPersonnel(personnel)` was evaluated at the top of the component before the `if (!isOpen || !personnel) return null` check.
  - Passing `null` to `isAcademicPersonnel(null)` resulted in `(null.personnel_classification || ...)` which crashed immediately upon rendering `Personnel Directory`.
- **Classification:** Group A (Null-State Defect) & Group B (Stale Classification Field Assumption).

### Defect 2: Search Matcher Unchecked Null Property Access
- **Observed Risk:** `matchesPersonnelSearch(person, query)` in `PersonnelDirectoryTable.jsx` did not check if `person` was null/undefined before accessing `person.first_name`, `person.personnel_classification`, etc.
- **Root Cause:** Missing null guard on array items during search filtering.

### Defect 3: Standalone Route Props Unbinding in Faculty Evaluation Oversight Page
- **Observed Risk:** `/hr/faculty-evaluation-and-ranking` rendered directly without props received `portfolios = []`, leaving the page empty and without search/filter pipeline.
- **Root Cause:** Direct routing in `App.jsx` did not provide parent context; component lacked fallback to `useHR()` hook.
