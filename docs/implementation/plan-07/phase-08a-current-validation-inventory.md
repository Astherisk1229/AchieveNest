# AchieveNest Plan 07 — Phase 8A Validation Inventory
# Current Student and Personnel Validation Inventory

---

## 1. Student Account Provisioning Field Inventory

| Field | Required | Frontend Rule | Backend Syntax / Semantic Rule | DB Type / Constraint | Error Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `institutional_id` | Yes | 5–50 ASCII digits (`/^[0-9]{5,50}$/`) | `ValidationHelper::canonicalizeStudentInstitutionalId()` | `VARCHAR(50)`, Unique in `profiles` | `INVALID_INSTITUTIONAL_ID`, `INSTITUTIONAL_ID_ALREADY_EXISTS` |
| `institutional_email` | Yes | Lowercase, `@ndmu.edu.ph` | `ValidationHelper::canonicalizeNdmuEmail()` exact domain | `VARCHAR(191)`, Unique in `profiles` | `INVALID_EMAIL_DOMAIN`, `EMAIL_ALREADY_EXISTS` |
| `first_name` | Yes | Trimmed, non-empty, <= 100 chars | `ValidationHelper::validateName()` | `VARCHAR(100)`, Not Null | `VALIDATION_FAILED` |
| `middle_name` | No | Optional, <= 100 chars | `ValidationHelper::validateName(false)` | `VARCHAR(100)`, Nullable | `VALIDATION_FAILED` |
| `last_name` | Yes | Trimmed, non-empty, <= 100 chars | `ValidationHelper::validateName()` | `VARCHAR(100)`, Not Null | `VALIDATION_FAILED` |
| `suffix` | No | Optional, <= 20 chars | `ValidationHelper::validateName(false)` | `VARCHAR(20)`, Nullable | `VALIDATION_FAILED` |
| `sex` | No | `Male`, `Female`, `Prefer not to say` | Exact enum membership | `VARCHAR(20)`, Nullable | `INVALID_SEX` |
| `academic_program_id` | Yes | Valid selected program UUID | Active program existence & college foreign key | `CHAR(36)`, FK `academic_programs` | `ACADEMIC_PROGRAM_NOT_FOUND` |
| `year_level` | Yes | `1st Year` – `5th Year` | Strict allowlist `['1st Year', ..., '5th Year']` | `VARCHAR(20)`, Not Null | `VALIDATION_FAILED` |
| `academic_year` | Yes | Consecutive `YYYY–YYYY+1` | `ValidationHelper::validateAcademicYear()` | `VARCHAR(20)`, Not Null | `VALIDATION_FAILED` |

---

## 2. Personnel Account Provisioning Field Inventory

| Field | Required | Frontend Rule | Backend Syntax / Semantic Rule | DB Type / Constraint | Error Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `institutional_id` | Yes | 5–50 ASCII chars, no control chars | String length 5–50, sanitization | `VARCHAR(50)`, Unique in `profiles` | `INSTITUTIONAL_ID_ALREADY_EXISTS` |
| `institutional_email` | Yes | Lowercase, `@ndmu.edu.ph` | `ValidationHelper::canonicalizeNdmuEmail()` exact domain | `VARCHAR(191)`, Unique in `profiles` | `INVALID_EMAIL_DOMAIN`, `EMAIL_ALREADY_EXISTS` |
| `first_name` / `last_name` | Yes | Non-empty strings | `ValidationHelper::validateName()` | `VARCHAR(100)`, Not Null | `VALIDATION_FAILED` |
| `personnel_classification` | Yes | `academic` or `non_academic` | Enum check | Stored via roles/affiliations | `MISSING_REQUIRED_FIELDS` |
| `college_id` / `program_ids` | Cond. | Required if `academic` | Active college and program FK check | Relational tables | `MISSING_ACADEMIC_AFFILIATION` |
