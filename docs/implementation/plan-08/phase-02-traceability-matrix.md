# AchieveNest Plan 08 — Phase 2 Traceability Matrix
## Canonical Validation Rules Implementation & Test Verification

---

| Requirement / Rule | Implementation Source | Test File & Function | Concrete Verification Evidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Canonical Year Level Allowlist** | `Config\ProvisioningValidation::$canonicalYearLevels` | `test_plan08_phase2_validation_rules.php` | 13/13 unit tests passed (Rejects `Graduate`, 6th Year, etc.) | **PASS** |
| **Canonical Year Level Helper** | `ValidationHelper::validateStudentYearLevel` | `test_plan08_phase2_validation_rules.php` | Evaluates string type & membership | **PASS** |
| **Canonical Sex Allowlist** | `Config\ProvisioningValidation::$canonicalSexValues` | `test_plan08_phase2_validation_rules.php` | 10/10 unit tests passed (Rejects `Other`, `M`, `F`, etc.) | **PASS** |
| **Canonical Sex Helper** | `ValidationHelper::validateSex` | `test_plan08_phase2_validation_rules.php` | Evaluates string type & non-empty canonical value | **PASS** |
| **Canonical Academic Year Validator** | `ValidationHelper::validateAcademicYear` | `test_plan08_phase2_validation_rules.php` | 8/8 unit tests passed (Rejects future, non-consecutive, malformed) | **PASS** |
| **GAP-02: Server-Required Sex** | `TargetProvisioningController::manualStudent` | `test_plan08_phase2_validation_rules.php` (Tests 4.1 - 4.4) | HTTP 422 returned on omitted, null, blank, whitespace, and unsupported sex | **RESOLVED / PASS** |
| **GAP-03: Year-Level Filter Query** | `TargetProvisioningController::listStudents` | `test_plan08_phase2_validation_rules.php` (Tests 5.1 - 5.3) | String comparison matches 70 students; rejects `Graduate` with 422 | **RESOLVED / PASS** |
| **Direct API Rejection of Graduate** | `TargetProvisioningController::manualStudent` | `test_plan08_phase2_validation_rules.php` (Test 4.5) | HTTP 422 returned with field `year_level` error | **PASS** |
| **Direct API Rejection of Future AY** | `TargetProvisioningController::manualStudent` | `test_plan08_phase2_validation_rules.php` (Test 4.6) | HTTP 422 returned with field `academic_year` error | **PASS** |
| **Rollback & Zero Leakage Guard** | `TargetProvisioningController::manualStudent` | `test_plan08_phase2_validation_rules.php` (Test 4.7) | 0 orphaned database records across all rejected test runs | **PASS** |
| **Legacy Data Integrity Guard** | Database direct query | `test_plan08_phase2_validation_rules.php` (Tests 6.1 - 6.2) | 74 legacy student NULL sex rows intact; 0 Graduate rows in DB | **PASS** |
| **Full Security Regression** | Integrated System | `run_phase9_full_security_regression.php` | 33/33 security & concurrency tests passed | **PASS** |
