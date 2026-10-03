# PLAN 09 — Final Transaction & Persistence Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Transaction Flow Architecture

Every student account creation transaction executed through `POST /api/v1/osad/provision/manual-student` follows an atomic 6-step lifecycle:

```text
[HTTP POST /api/v1/osad/provision/manual-student]
       |
       v
1. Payload Validation & Mass-Assignment Filter (ValidationHelper)
       |
       v
2. Database Transaction Start ($db->transBegin())
       |
       +---> 2a. Insert `profiles` (id, institutional_id, name, email, sex, status='active')
       |
       +---> 2b. Insert `student_profiles` (profile_id, year_level, enrollment_status='enrolled')
       |
       +---> 2c. Insert `student_program_enrollments` (student_profile_id, academic_program_id, academic_year, is_active=1)
       |
       +---> 2d. Insert `profile_roles` (profile_id, role_id for 'student')
       |
       +---> 2e. Insert `local_auth_credentials` (profile_id, password_hash, must_change_password=1)
       |
       +---> 2f. Write `account_lifecycle_events` & `audit_logs` (Provisioning success event)
       |
       v
3. Commit Transaction ($db->transCommit())
       |
       v
4. Emit HTTP 201 Created Response Envelope with Temporary Credentials
       |
       v
5. Plan 07 Modal Presents Credentials to OSAD Admin
       |
       v
6. Frontend Triggers Authoritative Refetch (fetchStudents) -> Synchronizes Table
```

---

# 2. Database Write Graph & Referential Integrity

| Target Table | Primary / Unique Key | Foreign Key Reference | Required State |
|---|---|---|---|
| `profiles` | `id` (UUID PK), `institutional_id` (UQ), `email` (UQ) | N/A | `account_type = 'student'`, `status = 'active'` |
| `student_profiles` | `profile_id` (PK / FK) | `profiles.id` (1:1 CASCADE) | Canonical `year_level` ('1st Year' - '5th Year') |
| `student_program_enrollments` | `id` (UUID PK) | `student_profile_id` -> `profiles.id`, `academic_program_id` -> `academic_programs.id` | `academic_year` (YYYY-YYYY), `is_active = 1` |
| `profile_roles` | `id` (UUID PK) | `profile_id` -> `profiles.id`, `role_id` -> `roles.id` | Role key: `'student'` |
| `local_auth_credentials` | `profile_id` (PK / FK) | `profiles.id` (1:1 CASCADE) | `must_change_password = 1`, `failed_attempts = 0` |
| `account_lifecycle_events` | `id` (UUID PK) | `profile_id` -> `profiles.id` | `event_type = 'provisioned'`, `from_status = NULL`, `to_status = 'active'` |
| `audit_logs` | `id` (UUID PK) | `actor_profile_id` -> `profiles.id` | Zero plaintext password strings |
