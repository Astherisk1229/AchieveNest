# AchieveNest Plan 08 — Phase 5 Traceability Matrix
## Backend & Database Enforcement Traceability

---

| Requirement / Objective | Backend / DB Implementation | Automated Test File | Concrete Evidence & DB Verification | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Year-Level Backend Enforcement** | `TargetProvisioningController.php` & `ValidationHelper.php` | `test_plan08_phase5_backend_db_enforcement.php` | Rejects `Graduate`, `6th Year`, numeric inputs with HTTP 422 | **PASS** |
| **Sex Backend Enforcement** | `TargetProvisioningController.php` & `ValidationHelper.php` | `test_plan08_phase5_backend_db_enforcement.php` | Rejects omitted, null, whitespace, or unsupported sex with HTTP 422 | **PASS** |
| **Academic-Year Backend Enforcement** | `ValidationHelper::validateAcademicYear` | `test_plan08_phase5_backend_db_enforcement.php` | Rejects future academic years (e.g. 2027-2028 when server year is 2026) | **PASS** |
| **Database CHECK Constraint (Year Level)** | `chk_student_profiles_year_level` & `chk_student_enrollments_year_level` | `test_plan08_phase5_backend_db_enforcement.php` (Section 2) | Direct SQL insert with `Graduate` or `6th Year` fails with DB CHECK constraint error | **PASS** |
| **Database CHECK Constraint (Academic Year)** | `chk_student_enrollments_academic_year` | `test_plan08_phase5_backend_db_enforcement.php` (Section 2) | Direct SQL insert with malformed `2025/2026` fails with DB CHECK constraint error | **PASS** |
| **Database CHECK Constraint (Transitional Sex)** | `chk_profiles_sex` | `test_plan08_phase5_backend_db_enforcement.php` (Section 2) | Direct SQL insert with invalid `'InvalidSex'` fails; `'Male'` and `NULL` succeed | **PASS** |
| **Zero Partial Records Guarantee** | `TargetProvisioningController` DB Transactions | `test_plan08_phase5_backend_db_enforcement.php` (Section 4) | 0 partial profiles or role rows created upon validation failures | **PASS** |
| **Legacy Data Integrity (74 NULL Sex Rows)** | MySQL Database `profiles` | `test_plan08_phase5_backend_db_enforcement.php` (Section 3) | 74 NULL sex rows verified completely unchanged | **PASS** |
| **Zero Graduate Rows Preservation** | `student_profiles` & `student_program_enrollments` | `test_plan08_phase5_backend_db_enforcement.php` (Section 3) | 0 Graduate rows in all student tables | **PASS** |
| **Migration Up / Down Idempotency** | Migration 000056 | `test_plan08_phase5_backend_db_enforcement.php` (Section 1) | Constraints apply, drop, and re-apply cleanly without schema corruption | **PASS** |
| **Security & RBAC Regression** | Complete backend | `run_phase9_full_security_regression.php` | 33/33 security tests PASS | **PASS** |
