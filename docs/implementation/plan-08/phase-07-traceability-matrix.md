# AchieveNest Plan 08 — Phase 7 Traceability Matrix
## Dependent UI & Reporting Consistency Traceability

---

| Requirement / Objective | Component / Source File | Automated Test File | Concrete Evidence & Output | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Canonical Year Level Labels** | `studentAccountContract.js` | `dependentUiConsistency.test.js` (Test 1) | Exactly 1st Year to 5th Year; Graduate absent | **PASS** |
| **Graduate Status Separation** | Full Codebase Sweep | Repository Grep Search | 0 occurrences under Current Year Level logic | **PASS** |
| **Neutral Fallback for NULL Sex** | `formatStudentSexDisplay()` | `dependentUiConsistency.test.js` (Test 3) | Returns 'Not yet provided' or '—' without error | **PASS** |
| **Numeric Chronological AY Sorting** | `compareAcademicYears()` | `dependentUiConsistency.test.js` (Test 5, 6) | Sorts numerically by start year (e.g. 2027, 2026, 2025) | **PASS** |
| **Student Accounts List Rendering** | `OSADStudentAccountsPage.jsx` | `OSADStudentAccountsPage.jsx` & Vitest | Table & card views consume canonical helpers | **PASS** |
| **Backend & DB Regression** | Database CHECK & Write paths | `test_plan08_phase5_backend_db_enforcement.php` | 25/25 PHP tests PASS | **PASS** |
| **Legacy Data Integrity** | Database `profiles` | `test_plan08_phase6_legacy_data_review.php` | 74 NULL sex rows verified intact (21/21 PASS) | **PASS** |
| **Canonical Validation Regression** | Backend Controllers / Helpers | `test_plan08_phase2_validation_rules.php` | 45/45 PHP tests PASS | **PASS** |
| **Plan 07 Security Regression** | Complete Auth & Lifecycle Suite | `run_phase9_full_security_regression.php` | 33/33 PHP tests PASS | **PASS** |
| **Full Frontend Vitest Suite** | Complete Frontend Codebase | Vitest Test Runner | 74 test files / 437 tests PASS | **PASS** |
