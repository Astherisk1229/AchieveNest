# AchieveNest Plan 07 — Phase 9 Traceability Matrix
# Complete Regression & Security Traceability

---

| Req ID | Requirement Description | Code / API Target | Database Evidence | Automated Test Suite | Manual Verification | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P9-01** | Student Provisioning E2E | `POST /provisioning/manual-student` | `profiles`, `student_profiles`, `local_auth_credentials` | `run_phase9_full_security_regression.php` | Modal display with temporary password | **PASS** |
| **P9-02** | Personnel Provisioning E2E | `POST /provisioning/manual-personnel` | `profiles`, `personnel_profiles`, `local_auth_credentials` | `run_phase9_full_security_regression.php` | Modal display with temporary password | **PASS** |
| **P9-03** | Credential Hash Persistence | `TargetProvisioningController::manualStudent` | `password_hash` (`$2y$...`) | `run_phase9_full_security_regression.php` | Zero plaintext in DB tables | **PASS** |
| **P9-04** | Copy Credentials Delivery Audit | `POST /accounts/{id}/audit-delivery-action` | `audit_logs` (`CREDENTIALS_COPIED`) | `run_phase9_full_security_regression.php` | Clipboard toast feedback | **PASS** |
| **P9-05** | Print Slip Delivery Audit | `POST /accounts/{id}/audit-delivery-action` | `audit_logs` (`CREDENTIAL_SLIP_PRINTED`) | `run_phase9_full_security_regression.php` | Clean slip printout layout | **PASS** |
| **P9-06** | One-Time Display Guarantee | `GET /osad/students`, `GET /hr/personnel` | Verified zero credential columns in select queries | `run_phase9_full_security_regression.php` | Modal dismissal clears state | **PASS** |
| **P9-07** | First-Login Gate | `POST /auth/login` | `must_change_password = 1` | `run_phase9_full_security_regression.php` | Redirect to `/first-login/change-password` | **PASS** |
| **P9-08** | Restricted Route Policy | `RequiredNextActionFilter`, `RestrictedSessionRoutePolicy` | Route Policy evaluation | `RestrictedSessionRoutePolicyTest.php` | Direct dashboard URL blocked | **PASS** |
| **P9-09** | Atomic Account Activation | `POST /auth/change-password` | `must_change_password = 0`, `status = 'active'` | `run_phase9_full_security_regression.php` | Seamless transition to dashboard | **PASS** |
| **P9-10** | Old Credential Revocation | `LocalAuthService::changePassword` | `sessions` rotated, new hash committed | `run_phase9_full_security_regression.php` | Old pass login rejected (401) | **PASS** |
| **P9-11** | Administrative Recovery & Invalidation | `POST /accounts/{id}/reset-temporary-password` | `local_auth_credentials` reset, `must_change_password = 1` | `run_phase9_full_security_regression.php` | Reset modal generates new slip | **PASS** |
| **P9-12** | Transaction Rollback Integrity | `TargetProvisioningController::manualStudent` | Zero orphaned profile/role records | `run_phase9_full_security_regression.php` | Safe 409/500 error display | **PASS** |
| **P9-13** | Duplicate Conflict & ID Preservation | `ValidationHelper::normalizeInstitutionalId` | Unique constraint validation | `run_phase9_full_security_regression.php` | Field-specific form errors | **PASS** |
| **P9-14** | Lifecycle Restrictions | `POST /accounts/{id}/suspend`, `restore` | `profiles.status = 'suspended'` | `run_phase9_full_security_regression.php` | Suspended login blocked | **PASS** |
| **P9-15** | Plaintext Credential Leakage Sweep | Entire backend / frontend logging pipeline | 0 matches across DB, logs, storage | `run_phase9_full_security_regression.php` | Browser storage audit | **PASS** |
| **P9-16** | Role-Based Portal Routing | Frontend Router / `authService` | User role mapping | `run_phase9_full_security_regression.php` | Correct Student/Personnel portals | **PASS** |
| **P9-17** | Provisioning & Reset RBAC | `TargetProvisioningController`, `AccountLifecycleController` | Server-side role resolution | `run_phase9_full_security_regression.php` | Forbidden actions denied (403) | **PASS** |
| **P9-18** | Audit Endpoint RBAC | `GET /osad/audit`, `GET /hr/audit` | Server-side role resolution | `run_phase9_full_security_regression.php` | Unauthorized audit call denied (403) | **PASS** |
| **P9-21** | In-Office Verification Acknowledgment | `POST /accounts/{id}/reset-temporary-password` | `verified_identity` validation | `run_phase9_full_security_regression.php` | Identity checkbox required in UI | **PASS** |
| **P9-22** | Mass Assignment Protection | `TargetProvisioningController::validateStudentInput` | Strict request allowlist | `run_phase9_full_security_regression.php` | Injected fields rejected (422) | **PASS** |
| **P9-23** | Input Sanitization & Escaping | `ValidationHelper` | Safe parameterized queries | `run_phase9_full_security_regression.php` | XSS / SQL injection prevented | **PASS** |
| **P9-24** | Concurrency & Race Handling | Database transactions + unique constraints | Single committed account | `run_phase9_full_security_regression.php` | 1 success, 1 conflict | **PASS** |
| **P9-25** | Audit Trail Completeness | `audit_logs`, `account_lifecycle_events` | 9 canonical event codes | `run_phase9_full_security_regression.php` | Complete lifecycle event history | **PASS** |
