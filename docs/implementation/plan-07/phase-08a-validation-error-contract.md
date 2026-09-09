# AchieveNest Plan 07 — Phase 8A Error Contract
# API Validation Error Codes & Frontend UI Mapping

---

## 1. Stable API Error Codes

| API Error Code | HTTP Status | Target Field | Frontend Message |
| :--- | :--- | :--- | :--- |
| `EMAIL_ALREADY_EXISTS` | `409` | `institutional_email` | `"An account with this email already exists."` |
| `INSTITUTIONAL_ID_ALREADY_EXISTS` | `409` | `institutional_id` | `"An account with this institutional ID already exists."` |
| `INVALID_INSTITUTIONAL_ID` | `422` | `institutional_id` | `"Student Institutional ID must contain 5 to 50 ASCII digits."` |
| `INVALID_EMAIL_DOMAIN` | `422` | `institutional_email` | `"Institutional email must end with @ndmu.edu.ph."` |
| `ACADEMIC_PROGRAM_NOT_FOUND` | `422` | `academic_program_id` | `"Please select an active Academic Degree Program."` |
| `MISSING_REQUIRED_FIELDS` | `422` | Form level | `"Please complete all required fields."` |
| `AVAILABILITY_RATE_LIMITED` | `429` | `institutional_email` | `"Availability check rate limited. Please try again shortly."` |

---

## 2. Accessibility & Focus Behavior

- Form errors link via `aria-describedby` to the offending input element.
- When submission fails, focus shifts automatically to the first invalid input element.
