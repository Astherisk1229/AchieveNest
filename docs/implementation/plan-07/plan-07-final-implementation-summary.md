# AchieveNest Plan 07 — Final Implementation Summary
## Student & Personnel Account Provisioning, Temporary Credential Delivery & First-Login Security

---

## 1. Executive Summary

**Plan 07** resolves all architectural, cryptographic, and operational challenges surrounding Student and Personnel account creation, one-time temporary credential generation, secure physical/copy delivery, restricted first-login session gating, atomic password-change activation, and administrative recovery in AchieveNest.

The implementation completely eliminates legacy plaintext password storage, improper immediate activation, unauthenticated reset abuse, and cross-domain administrative conflicts.

---

## 2. Core Architectural Pillars

### 2.1 Atomic Account Provisioning
- **OSAD Administration**: Authorized OSAD staff provisions Student accounts via `POST /api/v1/provisioning/manual-student`, establishing records across `profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, and `local_auth_credentials` in a single ACID database transaction.
- **HR Administration**: Authorized HR staff provisions Personnel accounts via `POST /api/v1/provisioning/manual-personnel`, creating linked records across `profiles`, `personnel_profiles`, `profile_roles`, and `local_auth_credentials`.
- **Validation & Uniqueness**: Canonical institutional email normalization (`@ndmu.edu.ph`), digits-only Student ID validation (`^[0-9]{5,50}$`), leading-zero preservation, and precise field-specific error codes (`INSTITUTIONAL_ID_ALREADY_EXISTS` vs `EMAIL_ALREADY_EXISTS`) guarantee robust uniqueness without false conflicts.

### 2.2 Ephemeral One-Time Credential Delivery
- **Cryptographic Generation**: Temporary passkeys are generated server-side using `ValidationHelper::generateTemporaryPassword()` (16+ characters with uppercase, lowercase, digits, and special characters from cryptographically secure entropy `random_bytes()`).
- **One-Time Payload**: The plaintext temporary password is returned exactly once in the HTTP 201 response.
- **Client Presentation**: Frontend presents `OneTimeCredentialModal.jsx` with copy and print actions. Upon modal dismissal, memory is wiped and state is reset. Plaintext credentials cannot be retrieved from subsequent account lists, profile queries, or audit logs.

### 2.3 Restricted First-Login Session Enforcement
- **Pending Lifecycle Gate**: Provisioned accounts are created with `account_lifecycle_status: 'pending_first_login'` and `must_change_password: 1`.
- **Route Policy Trapping**: `RequiredNextActionFilter` and `RestrictedSessionRoutePolicy` intercept all authenticated requests from accounts requiring a password change. Protected portal routes (`/achievements`, `/osad/students`, `/hr/personnel`) return HTTP `403 PASSWORD_CHANGE_REQUIRED`.
- **Allowed Safe Surface**: Only `/api/v1/auth/me` (for identity verification and first-login guidance), `/api/v1/auth/change-password` (for establishing personal credentials), and `/api/v1/auth/logout` are allowlisted.

### 2.4 Atomic Account Activation & Invalidation
- **Password Change Transaction**: `POST /api/v1/auth/change-password` verifies current temporary credentials, validates new password complexity (12+ characters, uppercase, lowercase, digit, special character), hashes with bcrypt (`PASSWORD_DEFAULT`), clears `must_change_password`, updates status to `active`, revokes the restricted token, and issues an active portal session.
- **Revocation**: The old temporary credential fails immediately upon next authentication attempt.

### 2.5 In-Office Administrative Reset & Recovery
- **Domain-Isolated Reset**: `POST /api/v1/accounts/{id}/reset-temporary-password` allows OSAD admins to reset Student credentials and HR admins to reset Personnel credentials.
- **Identity Confirmation**: Requires physical/visual identity verification acknowledgment (`verified_identity: true`) and a documented reason.
- **Security Action**: Re-establishes `must_change_password = 1`, invalidates any prior personal password, revokes existing sessions, and issues a fresh one-time temporary passkey.

### 2.6 Comprehensive Audit Trail & Operational Visibility
- **Audit Coverage**: All provisioning events (`ACCOUNT_PROVISIONING_SUCCEEDED`, `ACCOUNT_PROVISIONING_FAILED`), delivery actions (`CREDENTIALS_COPIED`, `CREDENTIAL_SLIP_PRINTED`), authentication events (`AUTH_FIRST_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`), lifecycle changes (`ACCOUNT_ACTIVATED`, `ACCOUNT_SUSPENDED`, `ACCOUNT_RESTORED`, `ACCOUNT_ARCHIVED`), and administrative resets (`AUTH_ADMIN_PASSWORD_RESET_COMPLETED`) are recorded in `audit_logs` and `account_lifecycle_events`.
- **Operational Visibility**: OSAD administrators query `GET /api/v1/osad/audit`; HR administrators query `GET /api/v1/hr/audit`. Both endpoints enforce strict RBAC and pagination.
- **Zero Plaintext Leakage**: Plaintext passwords and tokens are excluded from database logs, application logs, API error bodies, and browser storage.
