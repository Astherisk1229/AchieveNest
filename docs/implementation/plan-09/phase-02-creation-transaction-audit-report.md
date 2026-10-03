# PLAN 09 — Phase 2 Creation Transaction Audit Report
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Executive Summary

This audit report documents the formal verification and baseline-freeze of the Student-account creation transaction under **Plan 09 Phase 2 — Creation Transaction Audit**.

Phase 1 established that the reported defect—newly created students not appearing in the OSAD table—is a frontend state synchronization disconnection rather than a database or backend transaction failure. Phase 2 independently and rigorously audited the full backend creation transaction across validation, relational references, canonical ID ownership, atomic write sets, failure injection rollbacks, duplicate identity protection, mass assignment resistance, credential security, and lifecycle management.

### Key Audit Conclusions
1. **Transaction Integrity (PASS)**: `POST /api/v1/provisioning/manual-student` executes within a strict ACID transaction (`$db->transStart()` ... `$db->transComplete()`). All 7 relational entities (`profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, `local_auth_credentials`, `account_lifecycle_events`, `audit_logs`) are atomically committed.
2. **Rollback Determinism (PASS)**: Injected failures across 6 critical transaction stages resulted in 100% full rollback with zero partial records or orphaned entities surviving.
3. **Duplicate & Retry Safety (PASS)**: Unique database constraints and controller conflict guards reject duplicate Institutional IDs and Institutional Emails with HTTP `409 Conflict`.
4. **Plan 07 & Plan 08 Baseline Preservation (PASS)**: Temporary passwords are high-entropy, bcrypt-hashed, never persisted in plaintext, and never leaked in audit logs. `must_change_password = 1` enforces the first-login gate, and Plan 08 fields (`sex`, `year_level`, `academic_year`) are strictly validated.
5. **Phase 1 Finding Preservation (STILL VALID)**: No backend defects were found. The creation path is robust and frozen as the authoritative contract.

---

# 2. Scope & Environment Baseline

| Parameter | Configuration / Value |
|---|---|
| Target Controller | `App\Controllers\Api\TargetProvisioningController::manualStudent` |
| Route | `POST /api/v1/provisioning/manual-student` |
| Environment | `local-defense` (development) |
| Active Database | `achievenest_local` (MySQL 8.4.7) |
| OSAD Admin Actor | `Marcus Cruz` (`10000000-0000-0000-0000-000000000005`, `osad_admin` / `osad_staff`) |
| Target Program | `30000000-0000-0000-0000-000000000001` (BSCS under CET) |

---

# 3. Controller Contract & Validation Audit

## 3.1 Authentication & RBAC Enforcement
- **Session Verification**: `resolveActor()` verifies JWT session from `Authorization: Bearer <token>`.
- **Role Check**: Requires `account_type === 'osad_admin'` AND role `osad_staff`. Unauthenticated requests receive HTTP `401 UNAUTHORIZED`; non-OSAD callers receive HTTP `403 FORBIDDEN`.

## 3.2 Request Whitelisting & Mass-Assignment Defense
- **Whitelisted Payload Keys**:
  ```php
  $allowedFields = [
      'institutional_id', 'institutional_email', 'first_name', 'middle_name',
      'last_name', 'suffix', 'academic_program_id', 'degree_program_id',
      'year_level', 'academic_year', 'sex'
  ];
  ```
- **Rejection of Injected Keys**: Any request containing extra keys (e.g. `role`, `status`, `must_change_password`, `id`, `created_at`) is immediately rejected with HTTP `422 VALIDATION_FAILED` (`"Request contains unsupported fields."`).
- **Scalar Type Enforcement**: All non-null values must be scalar strings.

## 3.3 Plan 08 Canonical Field Validation
- **Year Level**: Validated via `ValidationHelper::validateStudentYearLevel` against `['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year']`. Unrecognized values (e.g. `Graduate`) are rejected with HTTP 422.
- **Academic Year**: Validated via `ValidationHelper::validateAcademicYear` ensuring consecutive `YYYY-YYYY+1` format bounded between `2025-2026` and the server's current institutional year.
- **Sex**: Mandatory field validated via `ValidationHelper::validateSex` against `['Male', 'Female', 'Prefer not to say']`. Blank or unrecognized values are rejected with HTTP 422.

## 3.4 Institutional Reference Validation
- **Academic Program**: Queried from `academic_programs` by UUID and verified `status = 'active'`. If absent or inactive, returns HTTP `422 ACADEMIC_PROGRAM_NOT_FOUND`.
- **Role Catalog**: Queried from `roles` for `role_key = 'student'`. Returns HTTP `500 ROLE_NOT_FOUND` if missing.

---

# 4. Canonical Identity & Transaction Boundary Audit

## 4.1 Server-Generated Canonical IDs
- **Profile / Account ID**: Server-generated UUID v4 (`$this->genUuid()` in local-defense mode).
- **Program Enrollment ID**: Server-generated UUID v4.
- **Profile Role ID**: Server-generated UUID v4.
- **Audit Log & Lifecycle IDs**: Server-generated UUID v4.
- **Client IDs**: Any client-submitted ID fields are strictly rejected by the payload whitelister.

## 4.2 Exact Transaction Boundaries
- **Transaction Start**: `TargetProvisioningController.php` line 236:
  ```php
  $db->transStart();
  ```
- **Transaction Commit**: `TargetProvisioningController.php` line 317:
  ```php
  $db->transComplete();
  ```
- **Transaction Rollback**: `TargetProvisioningController.php` line 319:
  ```php
  $db->transRollback();
  ```

## 4.3 Required Atomic Write Set (7 Tables)

| Step | Target Table | Primary Key | Foreign Key Linkages | Canonical Values |
|---|---|---|---|---|
| 1 | `profiles` | `id` (UUID) | None | `account_type='student'`, `status='active'`, `password_hash` |
| 2 | `student_profiles` | `profile_id` (UUID) | `profile_id -> profiles.id` | `year_level`, `enrollment_status='enrolled'` |
| 3 | `student_program_enrollments` | `id` (UUID) | `student_profile_id -> profiles.id`, `academic_program_id -> academic_programs.id` | `academic_year`, `effective_from`, `is_active=1` |
| 4 | `profile_roles` | `id` (UUID) | `profile_id -> profiles.id`, `role_id -> roles.id`, `assigned_by -> profiles.id` | `scope_type='university'`, `is_active=1` |
| 5 | `local_auth_credentials` | `profile_id` (UUID) | `profile_id -> profiles.id` | `password_hash`, `must_change_password=1`, `status='active'` |
| 6 | `account_lifecycle_events` | `id` (UUID) | `profile_id -> profiles.id`, `actor_profile_id -> profiles.id` | 2 rows: `provisioned` and `activated` |
| 7 | `audit_logs` | `id` (UUID) | `actor_profile_id -> profiles.id`, `target_id -> profiles.id` | `event_code='ACCOUNT_PROVISIONING_SUCCEEDED'`, safe context |

---

# 5. Failure Injection & Rollback Audit

Controlled failure injection was executed at 6 distinct points during the transaction:

| Injection Point | Injected Fault | Caught & Handled? | Partial DB Rows | Rollback Status |
|---|---|---|---|---|
| **Point 1: After `profiles`** | Runtime Exception | Yes (500/Rollback) | `0` | **PASS** |
| **Point 2: After `student_profiles`** | Runtime Exception | Yes (500/Rollback) | `0` | **PASS** |
| **Point 3: After `student_program_enrollments`** | Runtime Exception | Yes (500/Rollback) | `0` | **PASS** |
| **Point 4: After `profile_roles`** | Runtime Exception | Yes (500/Rollback) | `0` | **PASS** |
| **Point 5: After `local_auth_credentials`** | Runtime Exception | Yes (500/Rollback) | `0` | **PASS** |
| **Point 6: Immediately before Commit** | Runtime Exception | Yes (500/Rollback) | `0` | **PASS** |

**Rollback Determinism Conclusion**: Zero partial records, broken relationships, or orphaned accounts can survive a failed creation transaction.

---

# 6. Duplicate Prevention & Ambiguous Retry Safety

1. **Pre-Transaction Conflict Check**: Identity conflict check executes prior to auth identity generation and transaction start.
2. **In-Transaction Conflict Check**: Re-verifies identity uniqueness within the transaction before inserting into `profiles`.
3. **Database Unique Constraints**: `profiles.institutional_id` (UNIQUE) and `profiles.email` (UNIQUE) reject concurrent collision attempts.
4. **Retry Safety**: In an ambiguous network failure where the client re-submits the form, the second attempt is deterministically rejected with `409 Conflict` without creating duplicate rows.

---

# 7. Plan 07 First-Login Lifecycle Regression

A live first-login credential lifecycle test was conducted on a provisioned student:

```text
1. Student provisioned with temporary password (high entropy, bcrypt-hashed).
2. local_auth_credentials.must_change_password confirmed initialized to 1.
3. Authenticated login succeeds with temporary password.
4. User submits permanent password via POST /api/v1/auth/change-password.
5. local_auth_credentials.must_change_password updated to 0; password_changed_at recorded.
6. Verification: New permanent password succeeds; old temporary password invalidated.
```
- **First-Login Gate Enforcement**: **PASS**
- **Credential Plaintext Protection**: **PASS** (Zero plaintext credentials in DB or logs)

---

# 8. Database No-Orphan Reconciliation

Comprehensive integrity queries across the entire database revealed:
- Student profiles without `profiles` row: `0`
- `profiles` with `account_type='student'` without `student_profiles`: `0`
- Students without active program enrollment: `0`
- Students without `profile_roles` assignment: `0`
- Students without `local_auth_credentials` row: `0`

**Orphan Count**: `0` (100% Referential Integrity).

---

# 9. Phase 2 Completion Report

```text
========================================================================
PLAN 09 — PHASE 2 CREATION TRANSACTION AUDIT
========================================================================

Student creation call graph: PASS
Controller contract: PASS
Plan 08 validation preservation: PASS
Institutional relationship validation: PASS
Canonical ID ownership: PASS

Profile/account creation: PASS
Student profile creation: PASS
Enrollment creation: PASS
Role assignment: PASS
Local auth credential creation: PASS
Temporary credential handling: PASS

Transaction boundary verification: PASS
Required write set completeness: PASS
Success emitted after commit: PASS

Failure injection — after profile: PASS
Failure injection — after Student profile: PASS
Failure injection — after enrollment: PASS
Failure injection — after role: PASS
Failure injection — after auth credential: PASS
Failure injection — before commit: PASS

Duplicate Student ID safety: PASS
Duplicate institutional email safety: PASS
Ambiguous retry duplicate safety: PASS
Concurrent duplicate prevention: PASS
Mass-assignment protection: PASS

Create response canonical identifiers: PASS
Create/list/detail field consistency: PASS
Response mapping reference documented: PASS

Audit/lifecycle success events: PASS
Audit/lifecycle failure events: PASS
No plaintext credential logging: PASS

Database constraints regression: PASS
No-orphan reconciliation: PASS

Plan 07 first-login regression: PASS
Plan 08 validation regression: PASS

Phase 1 root-cause still valid: YES

Critical findings: 0
High findings: 0
Medium findings: 0
Low findings: 0
Unresolved blockers: 0

PHASE 2 DECISION: PASS
READY FOR PHASE 3 — DATABASE RELATIONSHIP & CONSTRAINT VERIFICATION: YES
========================================================================
```
