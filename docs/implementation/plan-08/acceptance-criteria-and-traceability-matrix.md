# AchieveNest Plan 08 — Acceptance Criteria & Traceability Matrix
## Final Mapping of Plan 08 Acceptance Criteria AC-01 through AC-08 to Concrete Evidence

---

| Acceptance Criterion | Description | Implementation Source | Concrete Automated Test Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **AC-01** | Current Year Level offers only `1st Year` through `5th Year` | `Config\ProvisioningValidation.php`, `studentAccountContract.js` | `test_plan08_phase8_comprehensive_suite.php` (Section 1) | **PASS** |
| **AC-02** | `Graduate` is rejected through UI, API, and Database layers | `ValidationHelper.php`, `chk_student_profiles_year_level` | `test_plan08_phase8_comprehensive_suite.php` (Section 2, 8) | **PASS** |
| **AC-03** | Academic Year dropdown generates valid consecutive-year pairs | `academicYearGenerator.js` | `academicYearGenerator.test.js` (10/10 tests PASS) | **PASS** |
| **AC-04** | Academic Year maximum updates automatically upon calendar rollover | `academicYearGenerator.js`, `ValidationHelper.php` | `academicYearGenerator.test.js`, fake timer tests | **PASS** |
| **AC-05** | Sex is required and cannot be omitted, blank, or null on new writes | `ValidationHelper::validateSex()`, `AddStudentAccountModal.jsx` | `test_plan08_phase8_comprehensive_suite.php` (Section 3) | **PASS** |
| **AC-06** | Invalid requests create zero partial records in the database | `TargetProvisioningController.php` DB transactions | `test_plan08_phase8_comprehensive_suite.php` (Section 5) | **PASS** |
| **AC-07** | Legacy data handled explicitly without guessing or data loss | `chk_profiles_sex` transitional constraint, CLASS C classification | `test_plan08_phase6_legacy_data_review.php` (21/21 PASS) | **PASS** |
| **AC-08** | All forms, APIs, imports, profiles, filters, and reports use one contract | `studentAccountContract.js`, `OSADStudentAccountsPage.jsx` | `dependentUiConsistency.test.js`, Full Vitest (437/437 PASS) | **PASS** |
