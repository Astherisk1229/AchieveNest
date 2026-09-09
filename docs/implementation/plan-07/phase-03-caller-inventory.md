# AchieveNest Plan 07 — Phase 3 Evidence
# Caller Integration Inventory

---

## 1. Inventory of Temporary Credential Callers

| File Path | Function / Context | Operation | Status |
| :--- | :--- | :--- | :--- |
| `backend/app/Helpers/ValidationHelper.php` | `generateTemporaryPassword()` | Canonical Generator Implementation | **UPDATED & VERIFIED** |
| `backend/app/Controllers/Api/TargetProvisioningController.php` | `manualStudent()` | Manual Student Account Provisioning | **VERIFIED** |
| `backend/app/Controllers/Api/TargetProvisioningController.php` | `manualPersonnel()` | Manual Personnel Account Provisioning | **VERIFIED** |
| `backend/app/Controllers/Api/ProvisioningController.php` | `manualStudent()` | Legacy Student Provisioning Endpoint | **VERIFIED** |
| `backend/app/Controllers/Api/ProvisioningController.php` | `manualPersonnel()` | Legacy Personnel Provisioning Endpoint | **VERIFIED** |
| `backend/app/Services/LocalAuthService.php` | `adminResetPassword()` | Admin Password Reset Service | **UPDATED & VERIFIED** |
| `backend/app/Controllers/Api/PasswordResetRequestController.php` | `adminReset()` | Admin Password Reset Handler | **UPDATED & VERIFIED** |
