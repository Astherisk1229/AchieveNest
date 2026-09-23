# AchieveNest — OSAD Student Account Management & Student Data Completeness
## Plan 03 Phase 5: Backend Projection & Provisioning Alignment Report
**Authoritative Schema Remediation, Projection & Provisioning Verification Report**

---

### 1. Executive Summary

Phase 5 has successfully reconciled the backend schema and projection pipeline, resolving the critical Sex implementation gap and aligning student provisioning with the normalized database architecture.

Key achievements:
- **Sex Implementation Gap Resolved**: Applied schema migration adding `profiles.sex` (`VARCHAR(20) NULL`) directly to `profiles` table in `achievenest_local`. Verified 0 duplicate Sex columns in subtype tables (`student_profiles`).
- **Provisioning Alignment & Validation**: Updated `TargetProvisioningController::manualStudent` to validate `sex` against the controlled domain (`['Male', 'Female', 'Prefer not to say']`), transactional persistence across `profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, and `local_auth_credentials`.
- **Eager Student Directory Projection**: Implemented `GET /api/v1/osad/students` with a single unified query joining `profiles`, `student_profiles`, active `student_program_enrollments`, `academic_programs`, and `colleges` with **0 N+1 queries** (executed in 10.94ms for 74 students).
- **Data Integrity & Consistency**:
  - Year-Level cache drift between `student_profiles.year_level` and active enrollment: **0**.
  - Orphan student profiles: **0**.
  - Orphan program enrollments: **0**.
  - Duplicate institutional IDs: **0**.
  - Duplicate institutional emails: **0**.
- **Test Verification**: Backend audit suite `audit:plan03-phase5` passed 100%; frontend Vitest suite passed; production Vite build passed in 2.98s.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Backend Stack**: CodeIgniter 4 REST API + local MySQL

---

### 3. Phase 4 Handoff

- Phase 4 established the Student Creation Form inside `AddStudentAccountModal.jsx` and marked Sex as ready with an explicit Phase 5 backend dependency.

---

### 4. Sex Implementation Gap

- **Background**: Architectural audit specifications identified `profiles.sex` as the authoritative source for sex-gated award evaluations, but local MySQL `profiles` lacked the column.
- **Classification**: `IMPLEMENTATION GAP`.
- **Resolution**: Directly added `profiles.sex` column without fabricating subtype columns (`student_profiles.sex`).

---

### 5. Schema Migration

- **Migration Command**: `php spark db:migrate-phase5`
- **Executed DDL**:
  ```sql
  ALTER TABLE profiles ADD COLUMN sex VARCHAR(20) NULL AFTER full_name;
  ```
- **Verification**: `profiles.sex` column exists with datatype `VARCHAR(20)`, Nullable = `true`.

---

### 6. Sex Domain & Validation

- **Controlled Domain**: `'Male'`, `'Female'`, `'Prefer not to say'`.
- **Validation Rule**: If supplied, must match one of the allowed strings; invalid values return `HTTP 422 INVALID_SEX`.
- **Legacy Profiles**: Existing profiles without Sex retain `NULL` safely without blocking queries.

---

### 7. Profile Model Alignment

- `profiles.sex` is recognized for write, read, projection, and serialization.

---

### 8. Provisioning Request Contract

- `POST /api/v1/provisioning/manual-student` accepts:
  - `institutional_id` (string, required)
  - `institutional_email` (string, required, `@ndmu.edu.ph`)
  - `first_name` (string, required)
  - `middle_name` (string, optional)
  - `last_name` (string, required)
  - `suffix` (string, optional)
  - `sex` (string, optional, `'Male' | 'Female' | 'Prefer not to say'`)
  - `academic_program_id` (string UUID, required, active)
  - `year_level` (string, optional, default `'1st Year'`)
  - `academic_year` (string, optional, default `'2025-2026'`)

---

### 9. Transaction Sequence

1. Actor authorization check (OSAD admin).
2. Payload validation (required fields, UUID format, email domain, sex domain).
3. Active academic program verification (`academic_programs.status = 'active'`).
4. Duplicate check on `profiles.institutional_id` and `profiles.email` (returns `409 DUPLICATE_ACCOUNT`).
5. Auth identity creation with generated initial password.
6. DB Transaction:
   - Insert `profiles` with `sex`
   - Insert `student_profiles`
   - Insert `student_program_enrollments` (with `is_active = 1`)
   - Insert `profile_roles` (`student` role)
   - Insert `local_auth_credentials`
   - Record lifecycle events (`provisioned`, `activated`)
7. Commit transaction.

---

### 10. External Auth Compensation

- If any step inside the database transaction fails, `transRollback()` is triggered and the compensating `adminAuthService->deleteUser($authUserId)` call removes the external auth identity to prevent orphan identities.

---

### 11. Duplicate ID / Email Handling

- Checks `profiles.institutional_id` and `profiles.email`.
- Conflicts return `HTTP 409 DUPLICATE_ACCOUNT` with clear error descriptions mapped directly to frontend modal fields.

---

### 12. Program Validation

- Enforces active degree program UUID validation against `academic_programs`.

---

### 13. Year-Level Validation

- Enforces standard 6-standing domain: `1st Year`, `2nd Year`, `3rd Year`, `4th Year`, `5th Year`, `Graduate`.

---

### 14. Academic Period Handling

- Captures `academic_year` (default `2025-2026`) and persists into `student_program_enrollments`.

---

### 15. Enrollment & Account Status

- Newly provisioned student accounts are created with:
  - `student_profiles.enrollment_status` = `'enrolled'`
  - `profiles.status` = `'active'`

---

### 16. Student List Projection

- **Endpoint**: `GET /api/v1/osad/students`
- **Output Schema**:
  ```json
  {
    "data": {
      "students": [
        {
          "id": "...",
          "institutional_id": "202310492",
          "student_id": "202310492",
          "full_name": "Juan Dela Cruz",
          "email": "juan.delacruz@ndmu.edu.ph",
          "sex": "Male",
          "college": "CEAC",
          "program": "BS Computer Science",
          "year_level": "3rd Year",
          "enrollment_status": "enrolled",
          "status": "active"
        }
      ]
    }
  }
  ```

---

### 17. Current Enrollment Resolution

- Resolved by joining active `student_program_enrollments` where `is_active = 1` directly to `academic_programs` and `colleges`.

---

### 18. N+1 Prevention

- Entire directory dataset is retrieved in **1 single eager SQL query**.
- Query benchmark: **10.94ms** for all 74 students in `achievenest_local`.

---

### 19. Error Contract

- `401 UNAUTHORIZED`: Unauthenticated session.
- `403 FORBIDDEN`: Non-OSAD actor.
- `409 DUPLICATE_ACCOUNT`: ID or Email collision.
- `422 INVALID_SEX` / `INVALID_EMAIL_DOMAIN` / `MISSING_REQUIRED_FIELDS`: Validation errors.
- `500 PROVISIONING_FAILED`: Server exception with automatic transaction rollback and auth compensation.

---

### 20. Authorization

- Scoped to OSAD administrators (`osad_admin` account type with `osad_staff` role).

---

### 21. Data Integrity Verification

| Integrity Check | Query Target | Count | Status |
|---|---|---|---|
| profiles.sex column | `profiles.sex` exists | 1 | PASS |
| Duplicate Sex columns | `student_profiles.sex` | 0 | PASS |
| Year-Level cache drift | `student_profiles.year_level <> spe.year_level` | 0 | PASS |
| Orphan student profiles | `student_profiles` without `profiles` | 0 | PASS |
| Orphan enrollments | `student_program_enrollments` without `student_profiles` | 0 | PASS |
| Duplicate Institutional IDs | `profiles.institutional_id` duplicates | 0 | PASS |
| Duplicate Emails | `profiles.email` duplicates | 0 | PASS |

---

### 22. Backend Tests

- **Command**: `php spark audit:plan03-phase5`
- **Result**: ALL 11 VERIFICATION CHECKS PASSED.

---

### 23. Frontend Integration Verification

- `provisioningService.fetchStudents()` and `provisioningService.provisionManualStudent()` verified in `OSADStudentAccountPhase5.test.jsx`.
- 10 / 10 unit and component tests passed across Phase 3, Phase 4, and Phase 5 suites.

---

### 24. Sex Dependency Closure

- **Sex Remediation Dependency**: **RESOLVED**.
- `profiles.sex` is created, validated, persisted, projected, and audited.

---

### 25. Phase 6 Handoff

- Phase 6 will implement the Student Accounts table frontend search, filter, and action cleanup with the authoritative backend projection.

---

### 26. Exit Decision

All backend schema, projection, validation, transaction, and integrity checks are complete.

**PLAN 03 PHASE 5 STATUS: GO FOR PHASE 6 — SEARCH, FILTER & ACTION CLEANUP**
