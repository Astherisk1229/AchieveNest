# PLAN 09 — Phase 1 Persistence/Listing Traceability Matrix
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Traceability Matrix

| Diagnostic Requirement | Target Layer | Verification Artifact / Source Code | Observed Behavior | Invariant Status | Phase Gate Outcome |
|---|---|---|---|---|---|
| **Create Request Acceptance** | Backend API | `TargetProvisioningController.php::manualStudent` | Accepts payload with validated Plan 08 fields (`sex`, `year_level`, `academic_year`) | **PASS** | Validated |
| **Atomic Database Persistence** | Database Engine | `profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, `local_auth_credentials` | Complete rows inserted within single transaction | **PASS** | Complete persistence |
| **Identifier Canonical Linkage** | Database / Response | `id = e8d4bde1-a83a-4d87-928d-006f78ee6efd` | Response ID matches `profiles.id` and all foreign keys | **PASS** | 100% matched |
| **Credential Provisioning** | Auth Database | `local_auth_credentials` | Password hash created, `must_change_password = 1`, `status = active` | **PASS** | Verified |
| **Lifecycle & Audit Recording** | Audit Tables | `account_lifecycle_events`, `audit_logs` | `provisioned` & `activated` events and `ACCOUNT_PROVISIONING_SUCCEEDED` audit recorded | **PASS** | Verified |
| **Canonical List Endpoint Retrieval** | Backend Query | `TargetProvisioningController.php::listStudents` (`GET /api/v1/osad/students`) | Database query retrieves newly created student with full projection | **PASS** | Retrievable |
| **Default View List Visibility** | Backend Query | `GET /api/v1/osad/students` (no query params) | Returns all active student accounts including newly created student | **PASS** | Retrievable |
| **Active Filter / Search Handling** | Backend Query | Search by ID, Search by Name, Filter by College, Filter by Year Level | Correctly filters database rows with AND semantics | **PASS** | Verified |
| **OSAD Authorization Scope** | Backend RBAC | `TargetProvisioningController.php` lines 145-148 & lines 366-369 | OSAD admin with `osad_staff` role permitted to create and list | **PASS** | Authorized |
| **Frontend State Synchronization** | Frontend UI | `OSADStudentAccountsPage.jsx` lines 148 & lines 972-978 | Page renders from `OSADController.#users` (5 mock rows); never fetches from API | **FAIL (Defect)** | Target for Plan 09 Remediation |
| **Post-Creation UI Refetch** | Frontend Network | `AddStudentAccountModal.jsx` & `OSADStudentAccountsPage.jsx` | Submits modal, shows toast, but triggers zero network refetches | **FAIL (Defect)** | Target for Plan 09 Remediation |
| **Full Browser Reload Behavior** | Frontend Store | `OSADController.js` constructor | In-memory controller resets to static 5 mock students on reload | **FAIL (Defect)** | Target for Plan 09 Remediation |

---

# 2. Defect Root Cause Traceability

```text
Defect Symptom:
"OSAD receives a successful Student-account creation result, but the newly created Student does not appear in the Student Accounts table"

Root Cause Trace:
1. User submits AddStudentAccountModal.
2. Modal calls provisioningService.provisionManualStudent(payload).
3. Backend executes TargetProvisioningController::manualStudent -> DB commits row.
4. Response returns 201 Created with canonical data.
5. Modal closes and shows success notification.
6. [BREAKPOINT]: OSADStudentAccountsPage table rows are derived from rawUsersList = getUsers('student', ...),
   which reads synchronously from OSADController.#users (a static mock array initialized in constructor).
7. Neither OSADStudentAccountsPage nor useOSAD triggers a server refetch via provisioningService.fetchStudents()
   or updates the table state with database rows.
8. The database has 100 students; the UI displays only the 5 hardcoded mock students.
```
