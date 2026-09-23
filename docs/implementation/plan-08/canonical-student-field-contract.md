# AchieveNest Plan 08 — Canonical Student Field Contract
## Authoritative Rule Specifications, Error Contracts, and Rule Ownership Matrix

---

## 1. Authoritative Rule Matrix

| Contract Property | Authoritative Value / Invariant | Backend Authority | Frontend Source of Truth |
| :--- | :--- | :--- | :--- |
| **Year Level Options** | `['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']` | `Config\ProvisioningValidation::$canonicalYearLevels` | `frontend/src/contracts/studentAccountContract.js` |
| **Graduate Status** | Strictly excluded from Current Year Level. Exclusively valid as `enrollment_status='graduated'` or alumni state. | `ValidationHelper::validateStudentYearLevel()` | `STUDENT_YEAR_LEVELS` |
| **Sex Options** | `['Male', 'Female', 'Prefer not to say']` | `Config\ProvisioningValidation::$canonicalSexValues` | `STUDENT_SEX_OPTIONS` |
| **Academic Year Baseline** | `2025` (`EARLIEST_ACADEMIC_YEAR_START`) | `Config\ProvisioningValidation::$earliestAcademicYearStart` | `academicYearGenerator.js` |
| **Academic Year Format** | `YYYY-YYYY` consecutive years (`end = start + 1`) | `ValidationHelper::validateAcademicYear()` | `getAcademicYearValues()` |
| **Academic Year Maximum** | Current calendar year in server timezone `Asia/Manila` | `ValidationHelper::validateAcademicYear()` | `new Date().getFullYear()` |

---

## 2. API Validation & Error Contracts

All validation failures return HTTP **422 Unprocessable Content** with standardized, non-schema-leaking JSON contracts:

```json
{
  "status": 422,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "sex",
    "message": "Sex is required and must be one of: Male, Female, Prefer not to say."
  }
}
```

```json
{
  "status": 422,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "year_level",
    "message": "Year level must be one of: 1st Year, 2nd Year, 3rd Year, 4th Year, 5th Year."
  }
}
```

```json
{
  "status": 422,
  "error": {
    "code": "VALIDATION_FAILED",
    "field": "academic_year",
    "message": "Academic year must be in format YYYY-YYYY, consecutive, between 2025-2026 and current server year (2026-2027)."
  }
}
```

---

## 3. Future Rule Change Governance Policy

1. **Zero Duplicate Rule Arrays**: No component or controller may define hardcoded local arrays for `year_level`, `sex`, or `academic_year`.
2. **Backend Authority**: The backend is always the final authority for all writes, imports, and updates.
3. **Change Workflow**: Any future modification to allowed year levels or sex options must update `Config\ProvisioningValidation` and `frontend/src/contracts/studentAccountContract.js` concurrently, followed by running the full test suite.
