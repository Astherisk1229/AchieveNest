# Personnel Directory Targeted Repair Verification

### Objective
Ensure that opening `/hr/personnel-directory` (or the HR Dashboard Personnel tab) never throws `Cannot read properties of null (reading 'personnel_classification')`, renders both empty and populated states reliably, and displays Plan D canonical classification badges accurately.

### Trace of Fix
1. **Initial Mount**:
   - `HRPersonnelDirectoryPage` mounts with `editingAssignmentPersonnel = null`.
   - Child component `EditAssignmentModal` renders with `personnel = null`.
   - `const academic = isAcademicPersonnel(null)` executes.
   - Fixed `isAcademicPersonnel(null)` returns `false` without dereferencing any property on `null`.
   - `if (!isOpen || !personnel) return null` safely executes and returns `null`.
2. **Roster Loading**:
   - While `personnelList = []`, `PersonnelDirectoryTable` renders the zero-state row: "No Personnel Records Found matching the current governance filters".
   - When `personnelList` arrives from `/hr/personnel`, records are rendered with:
     - Group: `Faculty` vs `Non-Teaching Faculty`
     - Organizational Side: `Academic` vs `Non-Academic`
     - Engagement: `Full-time Faculty` vs `Part-time Faculty`
     - Employment Status: `Permanent` vs `Probationary`
3. **Verification**:
   - 20/20 focused unit tests passing.
   - Master Vitest regression suite: 125/125 test files passing (899/899 tests).
