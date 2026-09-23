# AchieveNest Plan 08 — Final Implementation Summary
## Student Account Creation Form Rules, Dynamic Academic Year & Required Validation

---

## 1. Executive Summary

AchieveNest **Plan 08** systematically remediated three core data integrity defects in Student account provisioning and lifecycle management:
1. **Current Year Level Ambiguity & Legacy Drift**: Replaced scattered/inconsistent year level lists with one authoritative canonical set (`1st Year` through `5th Year`), removing `Graduate` from Current Year Level semantics while preserving legitimate graduation/alumni status logic.
2. **Hard-Coded & Fragile Academic Year Options**: Replaced brittle hard-coded option lists with a dynamic, reusable generator starting at the institutional baseline `2025-2026`, auto-incrementing up to the current calendar year in server timezone `Asia/Manila`.
3. **Optional / Omitted Sex Field**: Established Sex as a strictly required, validated, non-null field for all new/updated Student records (`Male`, `Female`, `Prefer not to say`), while protecting **74 legacy Student records with `sex = NULL`** via a transitional database constraint without artificial guessing or data loss.

---

## 2. Implemented Canonical Field Contracts

| Field | Canonical Values | Formatting & Constraints | Authority / Owner |
| :--- | :--- | :--- | :--- |
| `year_level` | `1st Year`, `2nd Year`, `3rd Year`, `4th Year`, `5th Year` | Strict enum string. `Graduate` is rejected with HTTP 422. | `Config\ProvisioningValidation::$canonicalYearLevels` |
| `academic_year` | Consecutive year pairs (e.g. `2025-2026`, `2026-2027`) | Regex `^[0-9]{4}-[0-9]{4}$`, `end = start + 1`, lower bound `2025`, max start year = server current year (`Asia/Manila`). | `ValidationHelper::validateAcademicYear()` |
| `sex` | `Male`, `Female`, `Prefer not to say` | Non-empty string. Required for all new writes. Transitional DB CHECK permits legacy NULLs. | `Config\ProvisioningValidation::$canonicalSexValues` |

---

## 3. Database Constraints & Migration 000056

Applied migration [`backend/app/Database/Migrations/2026-09-02-000056_AddPlan08CanonicalCheckConstraints.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-09-02-000056_AddPlan08CanonicalCheckConstraints.php):
- `chk_student_profiles_year_level`: `CHECK (year_level IS NULL OR year_level IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'))`
- `chk_student_enrollments_year_level`: `CHECK (year_level IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'))`
- `chk_student_enrollments_academic_year`: `CHECK (academic_year REGEXP '^[0-9]{4}-[0-9]{4}$')`
- `chk_profiles_sex` *(Transitional)*: `CHECK (sex IS NULL OR sex IN ('Male', 'Female', 'Prefer not to say'))`

---

## 4. Legacy Data Policy (74 NULL Sex Records)

- **Strict Zero-Inference Rule**: Zero records were guessed or inferred from first names, surnames, emails, or avatars.
- **Classification**: All 74 legacy `NULL` records are classified as **CLASS C (No Authoritative Source / Flagged for Administrative Review)**.
- **Edit Workflow**: When editing a legacy record, the form renders an unselected placeholder, requiring explicit administrative selection upon saving.

---

## 5. Verification & Test Suite Summary

- **Phase 8 Comprehensive Battery** (`scratch/test_plan08_phase8_comprehensive_suite.php`): **34/34 PASS (100%)**
- **Plan 07 Security Regression Suite** (`scratch/run_phase9_full_security_regression.php`): **33/33 PASS (100%)**
- **Phase 6 Legacy Audit Suite** (`scratch/test_plan08_phase6_legacy_data_review.php`): **21/21 PASS (100%)**
- **Phase 5 Backend & DB Suite** (`scratch/test_plan08_phase5_backend_db_enforcement.php`): **25/25 PASS (100%)**
- **Phase 2 Validation Suite** (`scratch/test_plan08_phase2_validation_rules.php`): **45/45 PASS (100%)**
- **Frontend Vitest Full Suite**: **74 test files / 437 tests PASS (100%)**
