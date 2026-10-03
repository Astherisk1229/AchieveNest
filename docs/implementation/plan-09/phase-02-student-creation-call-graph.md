# PLAN 09 — Phase 2 Student Creation Call Graph
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Architectural Call Graph

The following call graph outlines the end-to-end trace of the Student creation transaction across the frontend, API routing, authentication, validation, controller orchestration, database transaction, and response emission layers:

```text
+---------------------------------------------------------------------------------------------------+
| 1. FRONTEND UI & MODAL LAYER                                                                      |
|    - File: frontend/src/pages/osad-admin/modals/AddStudentAccountModal.jsx                        |
|    - Component: AddStudentAccountModal                                                            |
|    - Trigger: handleSubmit(e)                                                                     |
|    - Client Validation: validateClient()                                                          |
|    - Invocation: provisioningService.provisionManualStudent(payload)                             |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 2. FRONTEND SERVICE & HTTP CLIENT LAYER                                                           |
|    - File: frontend/src/services/provisioningService.js                                           |
|    - Method: provisionManualStudent(payload)                                                      |
|    - Client: frontend/src/services/apiClient.js                                                   |
|    - Request: POST /api/v1/provisioning/manual-student                                            |
|    - Headers: Authorization: Bearer <session-token>, Content-Type: application/json              |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 3. BACKEND ROUTING & FILTER DISPATCH                                                              |
|    - File: backend/app/Config/Routes.php (Line 41)                                                |
|    - Route Definition: $routes->post('provisioning/manual-student',                               |
|                                       'Api\TargetProvisioningController::manualStudent')          |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 4. CONTROLLER ORCHESTRATION & AUTHENTICATION                                                      |
|    - File: backend/app/Controllers/Api/TargetProvisioningController.php (Line 138)                 |
|    - Method: manualStudent()                                                                      |
|    - Auth Verification: resolveActor() via AuthenticatedActorService.php                          |
|    - RBAC Guard: Checks account_type === 'osad_admin' && in_array('osad_staff', roles)            |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 5. PAYLOAD SANITIZATION & PLAN 08 VALIDATION                                                      |
|    - Whitelist Check: array_diff(keys, $allowedFields) === [] (Mass-assignment defense)           |
|    - Helper: backend/app/Helpers/ValidationHelper.php                                             |
|      * canonicalizeStudentInstitutionalId() (5-50 ASCII digits)                                   |
|      * canonicalizeNdmuEmail() (valid @ndmu.edu.ph domain)                                        |
|      * validateName() (Name character safety & length)                                            |
|      * validateUuid() (Academic Program ID format)                                                |
|      * validateSex() (Male | Female | Prefer not to say)                                          |
|      * validateStudentYearLevel() (1st Year .. 5th Year)                                          |
|      * validateAcademicYear() (Consecutive YYYY-YYYY+1 within bounds)                             |
|      * generateTemporaryPassword() (High-entropy temporary credential)                             |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 6. INSTITUTIONAL REFERENCE VERIFICATION                                                          |
|    - Program Reference: db->table('academic_programs')->where('id', academicProgramId)->active    |
|    - Role Catalog: db->table('roles')->where('role_key', 'student')                              |
|    - Identity Conflict Guard: identityConflict(db, instId, email)                                 |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 7. ATOMIC TRANSACTION EXECUTION ($db->transStart())                                               |
|    - Write 1: profiles (id, instId, email, names, sex, account_type='student', password_hash)    |
|    - Write 2: student_profiles (profile_id, year_level, enrollment_status='enrolled')             |
|    - Write 3: student_program_enrollments (id, profile_id, prog_id, year_level, AY, active=1)    |
|    - Write 4: profile_roles (id, profile_id, student_role_id, scope='university', active=1)      |
|    - Write 5: local_auth_credentials (profile_id, password_hash, must_change_password=1)         |
|    - Write 6: account_lifecycle_events (provisioned + activated)                                  |
|    - Write 7: audit_logs (ACCOUNT_PROVISIONING_SUCCEEDED, safe_context, zero plaintext pwd)      |
|    - Commit: $db->transComplete()                                                                 |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 8. RESPONSE EMISSION & CLIENT CREDENTIAL DISPLAY                                                  |
|    - Status: HTTP 201 Created                                                                     |
|    - Payload Envelope: data -> id, institutional_id, email, full_name, sex, program, year_level,  |
|                                lifecycle_status, temporary_password, must_change_password         |
|    - Frontend: useProvisioningCredential.js / OneTimeCredentialModal.jsx                          |
+---------------------------------------------------------------------------------------------------+
```

---

# 2. File and Method Reference Index

| Layer | File Path | Method / Function | Purpose |
|---|---|---|---|
| **UI Form** | `frontend/src/pages/osad-admin/modals/AddStudentAccountModal.jsx` | `handleSubmit()` | Collects form state, validates client-side, and calls API service |
| **API Client** | `frontend/src/services/provisioningService.js` | `provisionManualStudent()` | Dispatches POST request to backend route |
| **Route Map** | `backend/app/Config/Routes.php` | `$routes->post('provisioning/manual-student', ...)` | Routes HTTP POST to controller method |
| **Controller** | `backend/app/Controllers/Api/TargetProvisioningController.php` | `manualStudent()` | Orchestrates auth, validation, database transaction, and response |
| **Auth Guard** | `backend/app/Services/AuthenticatedActorService.php` | `resolveActor()` | Validates JWT token and extracts authenticated OSAD admin profile |
| **Validation** | `backend/app/Helpers/ValidationHelper.php` | Multiple static methods | Standardizes IDs, emails, names, sex, year levels, academic years, passwords |
| **Lifecycle** | `backend/app/Services/AccountLifecycleResolver.php` | `resolve()` | Computes canonical lifecycle status (`pending_first_login`) |
| **Database** | `backend/app/Config/Database.php` / MySQL Engine | `$db->transStart()`, `$db->transComplete()` | Enforces ACID guarantees across 7 tables |
| **Credential UI** | `frontend/src/components/credentials/OneTimeCredentialModal.jsx` | `OneTimeCredentialModal` | Displays one-time temporary credential slip to administrator |
