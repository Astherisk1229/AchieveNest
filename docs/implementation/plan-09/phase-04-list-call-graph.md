# PLAN 09 — Phase 4 List Call Graph
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Authoritative List Call Graph

The diagram below traces the execution chain for `GET /api/v1/osad/students`:

```text
+---------------------------------------------------------------------------------------------------+
| 1. CLIENT REQUEST                                                                                 |
|    - Method: GET /api/v1/osad/students                                                            |
|    - Headers: Authorization: Bearer <osad-session-jwt>                                            |
|    - Optional Query Params: search, college_id, program_id, year_level, status                    |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 2. ROUTING LAYER                                                                                  |
|    - File: backend/app/Config/Routes.php (Line 37)                                                |
|    - Mapping: $routes->get('osad/students', 'Api\TargetProvisioningController::listStudents')     |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 3. AUTHENTICATION & RBAC GUARD                                                                    |
|    - Method: TargetProvisioningController::resolveActor()                                         |
|    - Service: AuthenticatedActorService::resolveActor()                                           |
|    - Validation: Checks account_type === 'osad_admin' && in_array('osad_staff', roles)            |
|    - Failure: 401 Unauthorized / 403 Forbidden                                                    |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 4. DATABASE QUERY CONSTRUCTION & EXECUTION                                                        |
|    - Database Anchor: profiles p (WHERE account_type = 'student')                                 |
|    - Joins:                                                                                       |
|        * local_auth_credentials lac (LEFT JOIN)                                                   |
|        * student_profiles sp (INNER JOIN)                                                         |
|        * student_program_enrollments spe (LEFT JOIN on is_active = 1)                             |
|        * academic_programs ap (LEFT JOIN)                                                         |
|        * colleges c (LEFT JOIN)                                                                   |
|    - Query Filters:                                                                               |
|        * search: LIKE on full_name, institutional_id, email                                       |
|        * college_id: exact match on c.id                                                          |
|        * program_id: exact match on ap.id                                                         |
|        * year_level: exact match on sp.year_level (validates 1st-5th Year)                        |
|        * status: exact match on p.status (active, suspended, archived)                            |
|    - Ordering: ORDER BY p.last_name ASC, p.first_name ASC, p.id ASC                               |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 5. NORMALIZATION & LIFECYCLE RESOLUTION                                                           |
|    - Resolver: AccountLifecycleResolver::resolve()                                               |
|    - Maps: administrative_status, account_lifecycle_status, credential_integrity_status,          |
|            must_change_password, required_next_action                                             |
|    - Projects: institutional_id, student_id, name fields, sex, college/program metadata           |
+-------------------------------------------------+-------------------------------------------------+
                                                  |
                                                  v
+-------------------------------------------------+-------------------------------------------------+
| 6. RESPONSE EMISSION                                                                              |
|    - HTTP Status: 200 OK                                                                          |
|    - Envelope: { "data": { "students": [ ... ] } }                                                |
+---------------------------------------------------------------------------------------------------+
```

---

# 2. Key Symbols and Class Map

| Execution Role | Class / File | Method / Property |
|---|---|---|
| **Route Handler** | `backend/app/Config/Routes.php` | Line 37 `$routes->get('osad/students', ...)` |
| **Controller** | `backend/app/Controllers/Api/TargetProvisioningController.php` | `listStudents()` |
| **Authentication** | `backend/app/Services/AuthenticatedActorService.php` | `resolveActor()` |
| **Validation** | `backend/app/Helpers/ValidationHelper.php` | `validateStudentYearLevel()` |
| **Lifecycle** | `backend/app/Services/AccountLifecycleResolver.php` | `resolve()` |
| **Database Connection** | `backend/app/Config/Database.php` | `db_connect()` |
