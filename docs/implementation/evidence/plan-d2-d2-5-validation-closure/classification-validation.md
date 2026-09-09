# Personnel Classification Validation

## Verification Summary

1. **Allowed Combinations**:
   - `Faculty` + `Academic` (Standard teaching faculty)
   - `Non-Teaching Faculty` + `Academic` (Academic support / clinical instructors in academic colleges)
   - `Non-Teaching Faculty` + `Non-Academic` (Administrative staff / office personnel in non-academic departments)
2. **Unsupported Combination**:
   - `Faculty` + `Non-Academic` is strictly unsupported and rejected by both frontend validation (`validatePersonnelPlacement`) and backend validation (`PersonnelClassificationService`).
3. **Form Dynamism**:
   - Selecting `Academic` dynamically activates the College & Program Affiliation controls.
   - Selecting `Non-Academic` dynamically activates the Department (Administrative Unit) control and disables College fields.

## Test Proof
- `PersonnelMasterDataDropdownsD2Phase1.test.jsx` (Tests 22–27) — PASSED
- `PersonnelPlanD2FinalClosureD2Phase5.test.jsx` (Test 32) — PASSED
