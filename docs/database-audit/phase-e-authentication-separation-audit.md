# AchieveNest — Phase E: Authentication Separation & Credential Audit

> **Scope:** Credential Storage, Sessions, and Password Reset Handling  

---

## 1. Credential Storage Analysis (`profiles.password_hash` vs `local_auth_credentials`)
- **Investigation Findings**:
  - In `LocalAuthService.php` / `AuthController.php`, authentication verifies credentials against `profiles.password_hash` as the direct active credential store.
  - `local_auth_credentials` was provisioned as a standalone credential table for dedicated auth subroutines.
  - Both tables are synchronized during account provisioning and password reset routines.
- **Semantic Classification**: `profiles.password_hash` is the **ACTIVE PRIMARY AUTH STORE**. `local_auth_credentials` provides extended credential metadata.

## 2. Authentication Tables Structure
1. `local_auth_sessions`: Manages signed JWT sessions, bearer tokens, expiration, and token hash revocations.
2. `password_reset_requests`: Manages student and personnel password reset request lifecycles with OSAD and HR review queues.
3. `account_lifecycle_events`: Immutable audit trail for suspension, reactivation, and archive actions.
