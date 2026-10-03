# AchieveNest Plan 07 — Phase 8 Route Inventory
# Final Route & Authorization Inventory

---

## 1. Plan 07 Complete Route Table

| Route Path | Method | Route Alias | Authentication / Filter | Lifecycle Allowed | Required RBAC / Role | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/api/v1/auth/login` | `POST` | `auth.login` | Public Unauthenticated | Any | None | User institutional credential authentication |
| `/api/v1/auth/logout` | `POST` | `auth.logout` | Authenticated Token | Restricted & Active | Any authenticated session | Invalidate current session token |
| `/api/v1/auth/me` | `GET` | `auth.me` | Authenticated Token | Restricted & Active | Any authenticated session | Fetch current user identity and derived lifecycle |
| `/api/v1/auth/change-password` | `POST` | `auth.change_password` | Authenticated Token | Restricted & Active | Any authenticated session | Mandatory or voluntary password update & session rotation |
| `/api/v1/provisioning/manual-student` | `POST` | `provisioning.manual_student` | Authenticated Token | Active only | `osad_admin` + `osad_staff` | Manual transactional Student account provisioning |
| `/api/v1/provisioning/manual-personnel` | `POST` | `provisioning.manual_personnel` | Authenticated Token | Active only | `hr_admin` + `hr_staff` | Manual transactional Personnel account provisioning |
| `/api/v1/password-reset-requests` | `POST` | `password_reset.submit` | Public Unauthenticated | Public | None | Public non-enumerating access recovery intake |
| `/api/v1/password-reset-requests` | `GET` | `password_reset.list` | Authenticated Token | Active only | `osad_admin` (Students) / `hr_admin` (Personnel) | Scoped office recovery queue |
| `/api/v1/password-reset-requests/{id}/reset` | `POST` | `password_reset.reset` | Authenticated Token | Active only | `osad_admin` (Students) / `hr_admin` (Personnel) | Execute verified reset transaction & issue new temporary credential |
| `/api/v1/password-reset-requests/{id}/reject` | `POST` | `password_reset.reject` | Authenticated Token | Active only | `osad_admin` (Students) / `hr_admin` (Personnel) | Reject access recovery request |
| `/api/v1/accounts/{id}/reset-temporary-password` | `POST` | `accounts.reset_temporary_password` | Authenticated Token | Active only | `osad_admin` (Students) / `hr_admin` (Personnel) | Direct in-office administrator temporary password reset |

---

## 2. Restricted Session Policy Summary

Under `RestrictedSessionRoutePolicy.php`:
- Only exact route aliases `auth.me` (`GET`), `auth.change_password` (`POST`), and `auth.logout` (`POST`) are allowed for accounts with `must_change_password = 1`.
- All other endpoints fail closed with `403 PASSWORD_CHANGE_REQUIRED`.
