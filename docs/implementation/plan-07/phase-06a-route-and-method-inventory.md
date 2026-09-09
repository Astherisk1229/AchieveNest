# AchieveNest Plan 07 — Phase 6A Evidence
# Route & Method Inventory & Lifecycle Classification

---

## 1. Complete API Route & Method Inventory

| HTTP Method | URI Template | Route Alias | Controller Action | Auth Required | Restricted Session Allowed | Active Lifecycle Required | Permission Required | Expected Denial |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `GET` | `/api/v1/health` | `health.index` | `Api\HealthController::index` | No | No (Public) | No | None | N/A (Public) |
| `POST` | `/api/v1/auth/login` | `auth.login` | `Api\AuthController::login` | No | No (Public) | No | None | `401` on bad creds |
| `POST` | `/api/v1/auth/logout` | `auth.logout` | `Api\AuthController::logout` | Yes | **Yes** | No | None | `401` if unauthenticated |
| `GET` | `/api/v1/auth/me` | `auth.me` | `Api\AuthController::me` | Yes | **Yes** | No | None | `401` if unauthenticated |
| `POST` | `/api/v1/auth/change-password` | `auth.change_password` | `Api\AuthController::changePassword` | Yes | **Yes** | No | None | `401` / `422` |
| `POST` | `/api/v1/password-reset-requests` | `password_reset.submit` | `Api\PasswordResetRequestController::submit` | No | No | No | None | `422` on invalid email |
| `GET` | `/api/v1/password-reset-requests` | `password_reset.list` | `Api\PasswordResetRequestController::list` | Yes | **No** | **Yes** | `osad_staff`, `hr_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `POST` | `/api/v1/password-reset-requests/{id}/reset` | `password_reset.reset` | `Api\PasswordResetRequestController::reset` | Yes | **No** | **Yes** | `osad_staff`, `hr_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `POST` | `/api/v1/password-reset-requests/{id}/reject` | `password_reset.reject` | `Api\PasswordResetRequestController::reject` | Yes | **No** | **Yes** | `osad_staff`, `hr_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `GET` | `/api/v1/osad/students` | `osad.students.list` | `Api\TargetProvisioningController::listStudents` | Yes | **No** | **Yes** | `osad_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `POST` | `/api/v1/provisioning/manual-student` | `osad.provisioning.student` | `Api\TargetProvisioningController::manualStudent` | Yes | **No** | **Yes** | `osad_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `GET` | `/api/v1/hr/personnel` | `hr.personnel.list` | `Api\TargetHRPersonnelController::directory` | Yes | **No** | **Yes** | `hr_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `POST` | `/api/v1/provisioning/manual-personnel` | `hr.provisioning.personnel` | `Api\TargetProvisioningController::manualPersonnel` | Yes | **No** | **Yes** | `hr_staff` | `403 PASSWORD_CHANGE_REQUIRED` |
| `GET` | `/api/v1/achievements` | `achievements.index` | `Api\AchievementController::index` | Yes | **No** | **Yes** | `student` / personnel | `403 PASSWORD_CHANGE_REQUIRED` |
| `GET` | `/api/v1/events` | `events.index` | `Api\EventController::index` | Yes | **No** | **Yes** | portal users | `403 PASSWORD_CHANGE_REQUIRED` |
