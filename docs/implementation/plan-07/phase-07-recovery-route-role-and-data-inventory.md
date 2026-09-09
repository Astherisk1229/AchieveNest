# AchieveNest Plan 07 — Phase 7 Evidence
# Recovery Route, Role & Data Inventory

---

## 1. Password Recovery API Routes

| Endpoint Route | HTTP Method | Route Alias | Authorization / Role | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/api/v1/password-reset-requests` | `POST` | `password_reset.submit` | Public Unauthenticated | Non-enumerating intake of access help requests |
| `/api/v1/password-reset-requests` | `GET` | `password_reset.list` | Active `osad_staff`, `hr_staff` | Scoped office queue listing |
| `/api/v1/password-reset-requests/{id}/reset` | `POST` | `password_reset.reset` | Active `osad_staff`, `hr_staff` | Verified reset transaction & one-time credential reissue |
| `/api/v1/password-reset-requests/{id}/reject` | `POST` | `password_reset.reject` | Active `osad_staff`, `hr_staff` | Reject help request without credential change |
| `/api/v1/accounts/{id}/reset-temporary-password` | `POST` | `accounts.reset_temporary_password` | Active `osad_staff`, `hr_staff` | Direct in-office administrator-initiated temporary password reset |

---

## 2. Recovery Request Schema (`password_reset_requests`)

- `id`: UUID primary key.
- `institutional_email`: Requester's institutional email address.
- `reason`: Non-sensitive reason category.
- `status`: Canonical status (`pending`, `completed`, `rejected`).
- `processed_by`: Reviewing administrator profile UUID.
- `processed_at`: Review completion timestamp.
- `created_at`, `updated_at`: Standard audit timestamps.
