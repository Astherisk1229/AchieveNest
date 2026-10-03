# AchieveNest Plan 07 — Phase 2 Implementation Report
# Data Model and Transaction Contract

---

## 1. Top-Level Summary

```text
PLAN 07 — PHASE 2 DATA MODEL AND TRANSACTION CONTRACT

Phase 1 evidence revalidated: PASS
Lifecycle architecture: DERIVED
Canonical lifecycle resolver: PASS
Administrative-status precedence: PASS
Student provisioning transaction: PASS
Personnel provisioning transaction: PASS
Provisioning response contract: PASS
Login/current-account lifecycle contract: PASS
Password-change activation transaction: PASS
Temporary-password reset transaction: PASS
Session revocation integration: PASS
Lifecycle event contract: PASS
Existing-account compatibility: PASS
Database migration: NOT REQUIRED
Credential exposure regression: PASS
Automated tests: PASS
Critical findings: 0
High findings: 0
Unresolved blockers: 0

GAP-07-003 LIFECYCLE CONTRACT: RESOLVED
PHASE 2 DECISION: READY FOR PHASE 3
```

---

## 2. Binding Architectural Implementation

### 2.1 Single Derived Lifecycle Source of Truth
The account lifecycle status `pending_first_login` is established as a **derived lifecycle state** rather than a second independently stored database value.

The authoritative derivation is managed exclusively by `App\Services\AccountLifecycleResolver`:
- **Active + `must_change_password = 1`** $\rightarrow$ `pending_first_login` (`can_authenticate = true`, `can_access_protected_portal = false`, `required_next_action = 'change_password'`)
- **Active + `must_change_password = 0`** $\rightarrow$ `active` (`can_authenticate = true`, `can_access_protected_portal = true`, `required_next_action = 'none'`)
- **Suspended / Disabled / Archived** $\rightarrow$ `suspended` / `disabled` / `archived` (`can_authenticate = false`, `can_access_protected_portal = false`, `required_next_action = 'contact_administrator'`)
- **Locked** $\rightarrow$ `locked` (`can_authenticate = false`, `can_access_protected_portal = false`, `required_next_action = 'contact_administrator'`)

### 2.2 Database Migration Decision: NOT REQUIRED
- `profiles.status` remains the authoritative administrative status column (`active`, `suspended`, `archived`, `disabled`).
- `profiles.must_change_password` and `local_auth_credentials.must_change_password` remain the authoritative credential requirement flags.
- `account_lifecycle_events` remains the immutable historical record of provisioning, activation, password reset, and status mutations.
- **Decision**: `NO DATABASE MIGRATION REQUIRED`. Zero schema changes or data rewrites were performed, eliminating any risk of breaking existing accounts or creating split-brain status columns.

---

## 3. Transaction & Response Contract Specifications

### 3.1 Student Provisioning Transaction (`POST /api/v1/provisioning/manual-student`)
- **Caller**: OSAD Administrator (`osad_admin` + `osad_staff`).
- **Atomic Operations**:
  1. Insert base profile (`profiles`) with `must_change_password = 1`, `status = 'active'`.
  2. Insert student profile (`student_profiles`).
  3. Insert program enrollment (`student_program_enrollments`).
  4. Assign `student` role (`profile_roles`).
  5. Insert credential hash (`local_auth_credentials`) with `status = 'active'`.
  6. Insert `account_lifecycle_events` (`provisioned` & `activated`).
- **Response**: HTTP 201 Created returning:
  - `account_lifecycle_status`: `"pending_first_login"`
  - `administrative_status`: `"active"`
  - `must_change_password`: `true`
  - `required_next_action`: `"change_password"`
  - `temporary_password`: One-time plaintext temporary password.

### 3.2 Personnel Provisioning Transaction (`POST /api/v1/provisioning/manual-personnel`)
- **Caller**: HR Administrator (`hr_admin` + `hr_staff`).
- **Atomic Operations**:
  1. Insert base profile (`profiles`) with `must_change_password = 1`, `status = 'active'`.
  2. Insert personnel profile (`personnel_profiles`).
  3. Insert college/program affiliations or administrative unit affiliation.
  4. Assign `personnel` role (`profile_roles`).
  5. Insert credential hash (`local_auth_credentials`) with `status = 'active'`.
  6. Insert `account_lifecycle_events` (`provisioned` & `activated`).
- **Response**: HTTP 201 Created returning:
  - `account_lifecycle_status`: `"pending_first_login"`
  - `administrative_status`: `"active"`
  - `must_change_password`: `true`
  - `required_next_action`: `"change_password"`
  - `temporary_password`: One-time plaintext temporary password.

### 3.3 Password-Change Activation (`POST /api/v1/auth/change-password`)
- **Caller**: Authenticated user with session.
- **Atomic Operations**:
  1. Verify new password strength and matching confirmation.
  2. Hash new password with `PASSWORD_DEFAULT`.
  3. Update `profiles.password_hash` and set `profiles.must_change_password = 0`.
  4. Update `local_auth_credentials.password_hash` and `password_changed_at`.
  5. Revoke all existing sessions via `LocalTokenService::revokeAllSessionsForProfile`.
  6. Log audit event `AUTH_PASSWORD_CHANGE_COMPLETED`.
- **Response**: HTTP 200 OK returning:
  - `account_lifecycle_status`: `"active"`
  - `administrative_status`: `"active"`
  - `must_change_password`: `false`
  - `required_next_action`: `"none"`

---

## 4. Workstream Traceability

| Workstream | Output / Contract | Status |
| :--- | :--- | :--- |
| **WS 1: Phase 1 Revalidation** | Revalidated symbols and schema invariants | **PASS** |
| **WS 2: Canonical Vocabulary** | `pending_first_login`, `active`, `suspended`, `archived`, `disabled`, `locked`, `unknown` | **PASS** |
| **WS 3: Single Resolver** | Implemented `App\Services\AccountLifecycleResolver` | **PASS** |
| **WS 4: Persistence Decision** | `NO DATABASE MIGRATION REQUIRED` verified and documented | **PASS** |
| **WS 5: Provisioning Transactions** | Student and Personnel atomic rollback boundaries preserved | **PASS** |
| **WS 6: Response Normalization** | Provisioning responses return lifecycle metadata | **PASS** |
| **WS 7: Login & Current User** | `/auth/login` and `/auth/me` return matching lifecycle metadata | **PASS** |
| **WS 8: Password Change Transaction** | Atomically updates hash, clears flag, revokes sessions | **PASS** |
| **WS 9: Reset Transaction** | Replaces hash, sets flag to 1, revokes sessions, returns temp password once | **PASS** |
| **WS 10: Lifecycle Events** | Preserved without credential leaks | **PASS** |
| **WS 11: List & Detail Serialization**| OSAD and HR account listings return derived lifecycle status | **PASS** |
| **WS 12: Frontend Contract** | `authService.js` stores normalized lifecycle data in session | **PASS** |
| **WS 13: Existing Account Safety** | All existing accounts maintain backward compatibility | **PASS** |
| **WS 14: Error Contract** | Safe failure closures for invalid states | **PASS** |
| **WS 15: Automated Testing** | Unit tests (9/9 pass), live contract tests (8/8 pass), frontend (386/386 pass) | **PASS** |
| **WS 16: Rollout & Verification** | Safe phased deployment verified | **PASS** |
