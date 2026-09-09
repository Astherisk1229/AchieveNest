# AchieveNest Plan 07 — Phase 1 Evidence
# Authentication & Provisioning Surface Inventory

---

## 1. Backend Authentication & Provisioning Surfaces

| Layer | Exact File Path | Symbol / Route | Responsibility | Invoked By | Calls / Depends On | Scope | Security Significance |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API Route** | `backend/app/Config/Routes.php` | `POST api/v1/auth/login` | Login route registration | Frontend HTTP | `AuthController::login` | Shared | High (Entry gate) |
| **API Route** | `backend/app/Config/Routes.php` | `GET api/v1/auth/me` | Current session user profile | Frontend HTTP | `AuthController::me` | Shared | High (Profile resolution) |
| **API Route** | `backend/app/Config/Routes.php` | `POST api/v1/auth/logout` | Session revocation | Frontend HTTP | `AuthController::logout` | Shared | High (Session invalidation) |
| **API Route** | `backend/app/Config/Routes.php` | `POST api/v1/auth/change-password`| Mandatory/user password change | Frontend HTTP | `AuthController::changePassword` | Shared | High (Credential mutation) |
| **API Route** | `backend/app/Config/Routes.php` | `POST api/v1/provisioning/manual-student`| OSAD student manual creation | OSAD Frontend | `TargetProvisioningController::manualStudent` | Student | High (Account creation) |
| **API Route** | `backend/app/Config/Routes.php` | `POST api/v1/provisioning/manual-personnel`| HR personnel manual creation | HR Frontend | `TargetProvisioningController::manualPersonnel`| Personnel| High (Account creation) |
| **Controller**| `backend/app/Controllers/Api/AuthController.php` | `AuthController` | Auth HTTP request handler | Routes | `LocalAuthService`, `AuthenticatedActorService` | Shared | Critical |
| **Controller**| `backend/app/Controllers/Api/TargetProvisioningController.php` | `TargetProvisioningController` | Student & Personnel creation handler | Routes | Database, `ValidationHelper`, `LocalAuthService` | Shared | Critical |
| **Controller**| `backend/app/Controllers/Api/PasswordResetRequestController.php`| `PasswordResetRequestController` | Admin reset request queue & action | Routes | `LocalAuthService` | Shared | High |
| **Service** | `backend/app/Services/LocalAuthService.php` | `LocalAuthService` | Core login, verify, hash & reset logic | Controllers | `LocalTokenService`, Database | Shared | Critical |
| **Service** | `backend/app/Services/LocalTokenService.php` | `LocalTokenService` | JWT token issuing, hashing, validation | `LocalAuthService`, Filters | Database (`local_auth_sessions`) | Shared | Critical |
| **Service** | `backend/app/Services/AuthenticatedActorService.php` | `AuthenticatedActorService` | Bearer token resolving to actor profile | Controllers | `LocalTokenService`, Database | Shared | Critical |
| **Helper** | `backend/app/Helpers/ValidationHelper.php` | `generateTemporaryPassword` | Produces secure temporary passwords | Provisioning | `random_bytes` | Shared | High |

---

## 2. Frontend Authentication & Provisioning Surfaces

| Layer | Exact File Path | Symbol | Responsibility | Invoked By | Calls / Depends On | Scope |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Context** | `frontend/src/context/AuthContext.jsx` | `AuthContext` / `AuthProvider` | Central frontend session state & role management | App Root | `authService.js` | Shared |
| **Service** | `frontend/src/services/authService.js` | `authenticateUser`, `fetchProfileAndCreateSession` | Auth API client & storage synchronization | Components | `apiClient.js` | Shared |
| **Service** | `frontend/src/services/provisioningService.js` | `provisionManualStudent`, `provisionManualPersonnel` | Provisioning API client methods | Modals, Hooks | `apiClient.js` | Shared |
| **Page** | `frontend/src/pages/common/LoginPage.jsx` | `LoginPage` | User login UI & institutional email validation | Router `/login` | `AuthContext`, `authService.js` | Shared |
| **Page** | `frontend/src/pages/auth/ChangePasswordPage.jsx` | `ChangePasswordPage` | Mandatory password update UI | Router `/change-password`| `authService.js` | Shared |
| **Modal** | `frontend/src/pages/osad-admin/modals/AddStudentAccountModal.jsx` | `AddStudentAccountModal` | OSAD student account creation form | OSAD Page | `provisioningService.js` | Student |
| **Modal** | `frontend/src/pages/hr-admin/personnel-directory/OnboardPersonnelModal.jsx` | `OnboardPersonnelModal` | HR personnel account creation form | HR Page | `provisioningService.js`, `useHR.js` | Personnel |
