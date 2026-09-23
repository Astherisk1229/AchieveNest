# AchieveNest Plan 08 — Phase 1 Traceability Matrix
## Cross-System Student Field Mapping

---

| Field | Layer | File / Route / Table | Producer / Consumer | Current Rule | Plan 08 Rule | Match? | Action Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `year_level` | Frontend Form | `AddStudentAccountModal.jsx` | Producer | `['1st Year'..'5th Year']` | `['1st Year'..'5th Year']` | **YES** | NONE |
| `year_level` | Frontend Filter | `OSADStudentAccountsPage.jsx` | Consumer | `['all', '1st'..'5th', 'Graduate']` | `['all', '1st Year'..'5th Year']` | **NO** (Includes Graduate) | **PHASE 4** |
| `year_level` | Frontend Model | `StudentModel.js` | Consumer | Defaults to `'1st Year'` | Defaults to `'1st Year'` | **YES** | NONE |
| `year_level` | Backend API | `TargetProvisioningController::manualStudent` | Validator | Rejects values $\notin$ `1st..5th Year` | Rejects values $\notin$ `1st..5th Year` | **YES** | NONE |
| `year_level` | Backend Query | `TargetProvisioningController::listStudents` | Filter | Casts to `(int)` | Query exact varchar string | **NO** (Type mismatch) | **PHASE 2** |
| `year_level` | Database | `student_profiles.year_level` | Storage | `VARCHAR(20) NULL` | `VARCHAR(20)` | **YES** | NONE |
| `year_level` | Database | `student_program_enrollments.year_level` | Storage | `VARCHAR(20) NOT NULL` | `VARCHAR(20) NOT NULL` | **YES** | NONE |
| `academic_year` | Frontend Form | `AddStudentAccountModal.jsx` | Producer | Dynamic from 2025 to browser year | Dynamic from 2025 to server year | **PARTIAL** | **PHASE 3** |
| `academic_year` | Backend Helper | `ValidationHelper::validateAcademicYear` | Validator | `^(\d{4})-(\d{4})$`, `end=start+1` | `^(\d{4})-(\d{4})$`, `end=start+1` | **YES** | NONE |
| `academic_year` | Backend API | `TargetProvisioningController::manualStudent` | Validator | Validates bounds $[2025, \text{date}('Y')]$ | Validates bounds $[2025, \text{date}('Y')]$ | **YES** | NONE |
| `academic_year` | Database | `student_program_enrollments.academic_year` | Storage | `VARCHAR(20) NOT NULL` | `VARCHAR(20) NOT NULL` | **YES** | NONE |
| `sex` | Frontend Form | `AddStudentAccountModal.jsx` | Producer | `['Male', 'Female', 'Prefer not to say']` | Required non-empty selection | **YES** | NONE |
| `sex` | Frontend Filter | `OSADStudentAccountsPage.jsx` | Consumer | `['all', 'Male', 'Female', 'Prefer not to say']` | `['all', 'Male', 'Female', 'Prefer not to say']` | **YES** | NONE |
| `sex` | Backend API | `TargetProvisioningController::manualStudent` | Validator | Optional (allows null if omitted) | **Strictly required** (non-null/blank) | **NO** (Backend allows null) | **PHASE 2** |
| `sex` | Backend Service| `AwardEligibilityService::normalizeSex` | Consumer | Normalizes to `MALE`/`FEMALE` | Normalizes to `MALE`/`FEMALE` | **YES** | NONE |
| `sex` | Database | `profiles.sex` | Storage | `VARCHAR(20) NULL` | `VARCHAR(20)` | **YES** | **PHASE 6** (Legacy nulls) |
