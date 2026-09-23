# AchieveNest Plan 07 — Phase 6 Evidence
# Protected API Route Inventory & Guard Classification (Updated Phase 6A)

---

## 1. Restricted-Session Allowlist vs. Protected Endpoints

| Endpoint Route | HTTP Method | Classification | Access Rule for `pending_first_login` |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth/me` | `GET` | **Allowlisted** | Rehydrates canonical lifecycle state (HTTP 200) |
| `/api/v1/auth/change-password` | `POST` | **Allowlisted** | Commits mandatory personal password change (HTTP 200) |
| `/api/v1/auth/logout` | `POST` | **Allowlisted** | Safely ends session (HTTP 200) |
| `/api/v1/health` | `GET` | **Public** | Public health status check |
| `/api/v1/auth/login` | `POST` | **Public** | Initial authentication |
| `/api/v1/password-reset-requests` | `POST` (No Auth) | **Public** | Public self-service password reset intake |
| `/api/v1/password-reset-requests` | `GET` / `POST` (Auth) | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/password-reset-requests/{id}/*` | `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/achievements` | `GET`, `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/personnel/accomplishments` | `GET`, `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/events` | `GET`, `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/osad/students` | `GET` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/hr/personnel` | `GET` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/verification/queue` | `GET`, `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/provisioning/*` | `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
| `/api/v1/accounts/*` | `GET`, `POST` | **Protected** | **403 PASSWORD_CHANGE_REQUIRED** |
