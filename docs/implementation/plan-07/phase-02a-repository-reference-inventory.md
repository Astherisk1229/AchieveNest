# AchieveNest Plan 07 — Phase 2A Evidence
# Repository Reference Inventory

---

## 1. Inventory of `must_change_password` Occurrences

| Exact File Path | Line / Symbol | Classification | Reads From | Writes To | Runtime Caller | Required Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `backend/app/Services/LocalAuthService.php` | `login()` | `WRITE_CANONICAL` & `DOMAIN_INPUT` | `local_auth_credentials` | `local_auth_credentials` | `POST /auth/login` | Uses canonical credential flag |
| `backend/app/Services/LocalAuthService.php` | `changePassword()` | `WRITE_CANONICAL` | - | `local_auth_credentials` | `POST /auth/change-password` | Sets `must_change_password = 0` |
| `backend/app/Services/LocalAuthService.php` | `adminResetPassword()` | `WRITE_CANONICAL` | - | `local_auth_credentials` | Reset Controllers | Sets `must_change_password = 1` |
| `backend/app/Controllers/Api/AuthController.php` | `me()` | `DTO_OR_SERIALIZER_FIELD` | `local_auth_credentials` | - | `GET /auth/me` | Queries `local_auth_credentials` |
| `backend/app/Controllers/Api/TargetProvisioningController.php` | `manualStudent()` | `WRITE_CANONICAL` | - | `local_auth_credentials` | `POST /provisioning/manual-student` | Inserts `must_change_password = 1` |
| `backend/app/Controllers/Api/TargetProvisioningController.php` | `manualPersonnel()` | `WRITE_CANONICAL` | - | `local_auth_credentials` | `POST /provisioning/manual-personnel` | Inserts `must_change_password = 1` |
| `backend/app/Controllers/Api/TargetProvisioningController.php` | `listStudents()` | `SQL_ALIAS` | `local_auth_credentials` | - | `GET /osad/students` | Joins `local_auth_credentials lac` |
| `backend/app/Controllers/Api/TargetHRPersonnelController.php` | `directory()` | `SQL_ALIAS` | `local_auth_credentials` | - | `GET /hr/personnel` | Joins `local_auth_credentials lac` |
| `frontend/src/services/authService.js` | `fetchProfileAndCreateSession()` | `FRONTEND_SNAPSHOT` | API user object | Session snapshot (no spread) | App initialization / Login | Allowlisted snapshot; no temp pwd |
| `frontend/src/controllers/RouteAccessController.js` | `checkAccess()` | `FRONTEND_SNAPSHOT` | Stored snapshot | - | Route guards | Reads snapshot for UX routing |
