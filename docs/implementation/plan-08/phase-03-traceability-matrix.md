# AchieveNest Plan 08 — Phase 3 Traceability Matrix
## Dynamic Academic Year Option Generator Traceability

---

| Requirement / Scenario | Implementation Source | Test File & Function | Concrete Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Reusable Generator Utility** | `src/utils/academicYearGenerator.js` | `src/utils/__tests__/academicYearGenerator.test.js` | `generateAcademicYearOptions()` exports shared generator | **PASS** |
| **Verified Lower Bound (2025)** | `EARLIEST_ACADEMIC_YEAR_START = 2025` | `academicYearGenerator.test.js` (Test 4) | Oldest option generated is `2025-2026` | **PASS** |
| **Canonical YYYY-YYYY Format** | `academicYearGenerator.js` | `academicYearGenerator.test.js` (Test 3) | Generates `YYYY-YYYY` with `end = start + 1` | **PASS** |
| **Newest-First Sort Order** | `academicYearGenerator.js` | `academicYearGenerator.test.js` (Tests 1, 2) | Options sorted `2026-2027`, `2025-2026` | **PASS** |
| **Default Academic Year Helper** | `getDefaultAcademicYear()` | `academicYearGenerator.test.js` (Test 8) | Returns newest AY as default | **PASS** |
| **Calendar Boundary Rollover** | `academicYearGenerator.js` | `academicYearGenerator.test.js` (Tests 9, 10) | Verified Dec 31, 2026 (`2026-2027`) $\to$ Jan 1, 2027 (`2027-2028`) | **PASS** |
| **AddStudentAccountModal Integration** | `AddStudentAccountModal.jsx` | Vitest Suite & UI Render | Form imports and consumes `getAcademicYearValues()` | **PASS** |
| **Backend Compatibility** | `ValidationHelper::validateAcademicYear` | `test_plan08_phase2_validation_rules.php` | Backend accepts all generated AY values and rejects future years | **PASS** |
| **Full Frontend Suite Regression** | Complete frontend codebase | Vitest Test Runner | 72 test files / 424 tests passing | **PASS** |
