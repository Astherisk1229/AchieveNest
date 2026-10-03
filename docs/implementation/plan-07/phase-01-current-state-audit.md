# AchieveNest Plan 07 — Phase 1 Implementation Report
# Current-State Authentication and Provisioning Audit

---

## 1. Top-Level Summary

```text
PLAN 07 — PHASE 1 CURRENT-STATE AUDIT

Repository and runtime baseline: VERIFIED
Student provisioning trace: PASS
Personnel provisioning trace: PASS
Canonical login identifiers: VERIFIED
Password handling: SAFE
Account/profile linkage: PASS
Role and authorization linkage: PASS
Transaction integrity: PASS
Session and route protection: PASS
Reset/recovery behavior: REUSABLE
Credential exposure audit: PASS
Current-state regression matrix: PASS
Critical findings: 0
High findings: 3
Unresolved blockers: 0

PHASE 1 DECISION: READY FOR PHASE 2
```

---

## 2. Executive Summary

Phase 1 conducted an exhaustive, read-only technical and functional audit of the authentication, account provisioning, profile linkage, authorization, session management, password handling, and recovery subsystems of AchieveNest.

The audit verified:
1. **Single Source of Provisioning Truth**:
   - OSAD administrators (`account_type = 'osad_admin'`) provision student accounts via `POST /api/v1/provisioning/manual-student`.
   - HR administrators (`account_type = 'hr_admin'`) provision personnel accounts via `POST /api/v1/provisioning/manual-personnel`.
2. **Unified Data Architecture**:
   - Both student and personnel accounts are anchored by a single primary `profiles` record linked 1:1 with `student_profiles` or `personnel_profiles`.
   - Institutional affiliations are strictly modeled in `student_program_enrollments`, `personnel_college_affiliations`, `personnel_program_affiliations`, and `personnel_administrative_unit_affiliations`.
   - Roles are assigned via `profile_roles` referencing the canonical `roles` catalog table.
3. **Password Security**:
   - Initial temporary passwords are generated backend using `ValidationHelper::generateTemporaryPassword()` (`Ndmu#[hex8]`).
   - Passwords are securely hashed using PHP `password_hash($password, PASSWORD_DEFAULT)` (bcrypt `$2y$12$...`). Plaintext passwords are never stored in the database or returned in profile queries.
4. **Canonical Login Identifier**:
   - **Both students and personnel currently authenticate exclusively using their institutional email ending in `@ndmu.edu.ph`** at `POST /api/v1/auth/login`. Entering an ID number returns an institutional email validation error.
5. **Gaps Identified for Plan 07**:
   - **No Credential Delivery UI**: Frontend forms currently close and display a simple toast without rendering a secure credential display modal, copy-to-clipboard, or printable slip (Plan 07 Phases 4 & 5).
   - **No First-Login Route Trap**: Although `must_change_password = 1` is persisted and returned, the frontend does not strictly trap the user on a forced password change screen before granting access to dashboard views (Plan 07 Phase 6).
   - **Account Status Lifecycle**: Newly provisioned accounts immediately start in `status: 'active'` rather than a dedicated `pending_first_login` state (Plan 07 Phase 2).

---

## 3. Workstream Baselines & Evidence

### 3.1 Runtime Baseline
- **Git Branch**: `audit/project-architecture-linkage`
- **Git Commit (HEAD)**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Database**: `achievenest_local` on MySQL (WAMP 127.0.0.1:3306)
- **Backend**: CodeIgniter 4 (PHP 8.2.29) on `http://127.0.0.1:8080/api/v1`
- **Frontend**: React 18, Vite 8, React Router 6 on `http://localhost:5173`
- **Authentication Mode**: `local-defense` (JWT tokens, SHA-256 session token hashing, `local_auth_credentials` table)

### 3.2 Key Verification Results
| Verification Item | Verified Value / Contract | Evidence Source | Status |
| :--- | :--- | :--- | :--- |
| **Student Creator** | OSAD Administrator (`osad_admin` + `osad_staff`) | `TargetProvisioningController.php:58` | **VERIFIED** |
| **Personnel Creator** | HR Administrator (`hr_admin` + `hr_staff`) | `TargetProvisioningController.php:342` | **VERIFIED** |
| **Student Provisioning API** | `POST /api/v1/provisioning/manual-student` | `TargetProvisioningController.php:51` | **VERIFIED** |
| **Personnel Provisioning API** | `POST /api/v1/provisioning/manual-personnel` | `TargetProvisioningController.php:335` | **VERIFIED** |
| **Login Endpoint** | `POST /api/v1/auth/login` | `AuthController.php:39` | **VERIFIED** |
| **Login Identifier** | Institutional Email (`*@ndmu.edu.ph`) | `LocalAuthService.php:40` | **VERIFIED** |
| **Password Storage** | Bcrypt hash in `profiles` & `local_auth_credentials` | `LocalAuthService.php:100` | **VERIFIED** |
| **Transaction Boundary** | `$db->transStart()` ... `$db->transComplete()` | `TargetProvisioningController.php:119` | **VERIFIED** |
| **First Login Flag** | `profiles.must_change_password` (tinyint 1) | `profiles` table schema | **VERIFIED** |

---

## 4. Workstream Summary

- **Workstream 1 (Runtime Baseline)**: Verified CodeIgniter 4, PHP 8.2.29, MySQL `achievenest_local`, and React Vite frontend.
- **Workstream 2 (Surface Inventory)**: Documented all backend controllers, services, models, frontend contexts, pages, modals, and tests in `phase-01-authentication-surface-inventory.md`.
- **Workstream 3 & 4 (Provisioning Traces)**: Traced student and personnel creation end-to-end through validation, identity creation, transaction writes, lifecycle events, and response.
- **Workstream 5 (Login Identifier)**: Verified strict `@ndmu.edu.ph` institutional email requirement.
- **Workstream 6 (Password Handling)**: Verified safe hashing (`password_hash`), temporary password generation, and zero plaintext exposure.
- **Workstream 7 (Account Status)**: Verified `active`, `suspended`, `archived` states and `must_change_password` flag.
- **Workstream 8 (Session & Routing)**: Verified JWT issuance, Bearer token header, session revocation on logout and password change.
- **Workstream 9 (Database Relationships)**: Verified complete 1:1 and 1:N foreign key linkages and zero orphan records in `phase-01-database-relationship-map.md`.
- **Workstream 10 (Password Reset)**: Verified admin password reset workflow via `PasswordResetRequestController.php` and `LocalAuthService::adminResetPassword`.
- **Workstream 11 (Credential Exposure)**: Confirmed zero plaintext credential leaks in logs, errors, or storage.
- **Workstream 12 (Runtime Matrix)**: Executed 12 automated runtime test scenarios with 100% success in `phase-01-test-matrix.md`.
- **Workstream 13 (Test Coverage)**: Audited existing test suites across frontend and backend.
- **Workstream 14 (Gap & Risk Register)**: Prioritized 3 high-severity UX/lifecycle gaps mapped to Plan 07 Phases 2–6 in `phase-01-gap-risk-register.md`.

---

## 5. Phase 1 Readiness Decision

**READY FOR PHASE 2 (DATA MODEL & TRANSACTION CONTRACT)**
