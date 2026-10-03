# AchieveNest Plan 08 — Phase 1 Field & Data Contract Audit Report
## Student Account Creation Form Rules, Dynamic Academic Year & Required Validation

---

## 1. Executive Summary & Audit Decision

```text
========================================================================
PLAN 08 — PHASE 1 FIELD & DATA CONTRACT AUDIT
========================================================================

OSAD Create Student form inventoried: PASS
OSAD Edit Student form inventoried: PASS
Frontend validation inventoried: PASS
API validation inventoried: PASS
Service/domain validation inventoried: PASS
Model/persistence contract inventoried: PASS
Database schema inventoried: PASS

Student import paths inventoried: PASS (Legacy roster import inventoried; targets legacy schema)
Seeders/factories inventoried: PASS
Filters/table consumers inventoried: PASS
Profile/detail consumers inventoried: PASS
Reports/exports inventoried: PASS
Automated tests inventoried: PASS

Existing year-level values quantified: PASS (1st: 70, 2nd: 1, 3rd: 5, 4th: 3, 5th: 0, Graduate: 0)
Graduate records quantified: PASS (0 records stored in database)
Sex values/nulls quantified: PASS (Male: 2, Female: 3, NULL: 74 legacy student records)
Academic-year values quantified: PASS (2025-2026: 78, 2026-2027: 1)
Malformed/future academic years quantified: PASS (0 malformed/future records)

Academic-year lower-bound evidence: PASS (Config: 2025; Earliest DB record: 2025-2026)
Application timezone/current-year authority identified: PASS (Config\App::$appTimezone = 'Asia/Manila', date('Y'))

Duplicate year-level rules inventoried: PASS
Duplicate academic-year rules inventoried: PASS
Duplicate Sex rules inventoried: PASS
Cross-layer contract drift classified: PASS

Plan 07 overlap reconciled: PASS
Canonical Year Level contract identified: PASS
Canonical Academic Year contract identified: PASS
Canonical Sex contract identified: PASS

Critical findings: 0
High findings: 2 (Sex optional in backend API; Graduate present in OSAD table filter)
Medium findings: 2 (TargetProvisioningController::listStudents casts year_level to int; hardcoded academic year constants in secondary modules)
Low findings: 1 (Duplicate sex option labels across components)
Unresolved blockers: 0

PHASE 1 DECISION: PASS
READY FOR PHASE 2 — CANONICAL VALIDATION RULES: YES
========================================================================
```

---

## 2. Comprehensive Field Producer, Validator, and Consumer Inventory

### 2.1 Current Year Level (`year_level` / `current_year_level`)
- **Frontend Producer (Create)**: `AddStudentAccountModal.jsx` defines `YEAR_LEVEL_OPTIONS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']`. Submits as `year_level`.
- **Frontend Filter/Consumer**: `OSADStudentAccountsPage.jsx` defines `YEAR_LEVELS = ['all', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate']` *(Contains stale `Graduate` filter option)*.
- **Frontend Models**: `StudentModel.js` maps `data.year_level || '1st Year'`.
- **Backend API Validator**: `TargetProvisioningController.php::manualStudent` strictly validates `in_array($yearLevel, ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'], true)`. Rejects all other values including `Graduate`.
- **Backend Filter Query**: `TargetProvisioningController.php::listStudents` attempts to filter by `(int) $yearLevel` *(Bug: `year_level` is stored as varchar strings)*.
- **Database Persistence**:
  - `student_profiles.year_level`: `VARCHAR(20) NULL`
  - `student_program_enrollments.year_level`: `VARCHAR(20) NOT NULL`
- **Database Row Distribution**:
  - `'1st Year'`: 70 rows
  - `'2nd Year'`: 1 row
  - `'3rd Year'`: 5 rows
  - `'4th Year'`: 3 rows
  - `'5th Year'`: 0 rows
  - `'Graduate'`: **0 rows**

### 2.2 Academic Year (`academic_year`)
- **Frontend Generator (Create)**: `AddStudentAccountModal.jsx` generates dynamic options from `EARLIEST_ACADEMIC_YEAR = 2025` up to `currentCalendarYear = new Date().getFullYear()` in `YYYY-YYYY+1` format. Defaults to latest academic year.
- **Backend API Validator**: `ValidationHelper::validateAcademicYear(mixed $value, int $earliestStart, int $latestStart)` validates pattern `^([0-9]{4})-([0-9]{4})$` where `ending_year === starting_year + 1` and `starting_year >= 2025` and `<= (int) date('Y')`.
- **Backend Controller**: `TargetProvisioningController.php::manualStudent` checks `ValidationHelper::validateAcademicYear($academicYear, $this->provisioningConfig->earliestAcademicYearStart, (int)date('Y'))`.
- **Database Persistence**:
  - `student_program_enrollments.academic_year`: `VARCHAR(20) NOT NULL`
  - `award_cycles.academic_year`: `VARCHAR(20)`
  - `personnel_evaluations.academic_year`: `VARCHAR(20)`
- **Database Row Distribution**:
  - `'2025-2026'`: 78 rows
  - `'2026-2027'`: 1 row
  - Earliest stored record: `'2025-2026'`
  - Malformed / Out-of-bounds records: **0 rows**

### 2.3 Sex (`sex`)
- **Frontend Producer (Create)**: `AddStudentAccountModal.jsx` defines `SEX_OPTIONS = [{ value: '', label: 'Select Sex' }, { value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Prefer not to say', label: 'Prefer not to say' }]`. Client requires non-empty selection.
- **Frontend Filter/Consumer**: `OSADStudentAccountsPage.jsx` defines `SEX_OPTIONS = ['all', 'Male', 'Female', 'Prefer not to say']`.
- **Backend API Validator**: `TargetProvisioningController.php::manualStudent` checks `if ($sex !== null && ! in_array($sex, ['Male', 'Female', 'Prefer not to say'], true))`. *(Gap: Backend currently allows `$sex` to be `null` if omitted in payload)*.
- **Backend Domain Evaluator**: `AwardEligibilityService::normalizeSex` evaluates uppercase `'MALE'`, `'FEMALE'`, or `null` for sex-gated awards.
- **Database Persistence**:
  - `profiles.sex`: `VARCHAR(20) NULL` (Added via migration `2026-09-01-000053_AddSexToProfiles.php`).
- **Database Row Distribution**:
  - `NULL`: 74 legacy student records
  - `'Female'`: 3 records
  - `'Male'`: 2 records

---

## 3. Discrepancies, Drift & Contract Gaps

| Item | Layer / File | Existing Behavior | Plan 08 Required Contract | Severity | Action Phase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | `OSADStudentAccountsPage.jsx` | `YEAR_LEVELS` filter contains `'Graduate'`. | Year level filter must contain only `'all', '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'`. | **HIGH** | Phase 4 |
| **GAP-02** | `TargetProvisioningController.php::manualStudent` | `$sex` is optional in API (`$sex = !empty($json['sex']) ? ... : null;`). | `$sex` must be **strictly required, non-null, and non-blank** on the server. | **HIGH** | Phase 2 |
| **GAP-03** | `TargetProvisioningController.php::listStudents` | Casts `$yearLevel` to `(int)` in `$builder->where('sp.year_level', (int)$yearLevel)`. | `sp.year_level` is stored as string `'1st Year'`; filter must compare string value. | **MEDIUM** | Phase 2 |
| **GAP-04** | `AddStudentAccountModal.jsx` | Dynamic academic year generator uses client browser year `new Date().getFullYear()`. | Centralize academic year generation and ensure server is authoritative. | **MEDIUM** | Phase 3 |
| **GAP-05** | Legacy `student_profiles` rows | 74 historical profiles have `sex = NULL`. | Reconcile historical nulls without destructive alteration. | **LOW** | Phase 6 |

---

## 4. Authoritative Canonical Contract Recommendations

### 4.1 Year Level Contract
- **Canonical Values**: `['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']`
- **Exclusion**: `Graduate` is completely excluded from year-level creation, editing, validation, and filters.
- **Storage**: `VARCHAR(20)` in `student_profiles.year_level` and `student_program_enrollments.year_level`.

### 4.2 Academic Year Contract
- **Format**: `YYYY-YYYY` (e.g. `2025-2026`, `2026-2027`) where `end = start + 1`.
- **Lower Bound**: `2025` (`earliestAcademicYearStart = 2025`).
- **Upper Bound**: `(int) date('Y')` based on application timezone `Asia/Manila`.
- **Rollover**: Automatic annual increment with calendar year.

### 4.3 Sex Contract
- **Canonical Allowed Values**: `['Male', 'Female', 'Prefer not to say']`
- **Validation Rule**: Required, non-null, non-empty string matching the canonical enum.
- **Storage**: `VARCHAR(20)` in `profiles.sex`.
