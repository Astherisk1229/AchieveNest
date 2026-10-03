# PLAN 09 — Phase 1 Root Cause Classification
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Defect Category Classification

Based on exhaustive diagnostic execution and empirical evidence captured across database, backend API, and frontend components, the reported defect is formally classified below:

## 1.1 Persistence Failure: **NO**
- **Definition**: Expected database rows are absent after creation.
- **Evidence**: All required records in `profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, `local_auth_credentials`, `account_lifecycle_events`, and `audit_logs` were committed and verified in `achievenest_local`.

## 1.2 Partial Transaction: **NO**
- **Definition**: Some records exist but required linked records do not.
- **Evidence**: All 7 relational entities exist with consistent foreign key linkage (`student_profile_id`, `profile_id`, `role_id`, `academic_program_id`). Zero orphaned records or partial states were produced.

## 1.3 Retrieval Failure: **NO**
- **Definition**: Rows exist in DB but canonical list/detail query excludes them or cannot join them correctly.
- **Evidence**: The authoritative SQL query in `TargetProvisioningController::listStudents` (`GET /api/v1/osad/students`) executes cleanly and immediately returns the newly created Student under default view and with valid filters.

## 1.4 Scope Failure: **NO**
- **Definition**: OSAD authorization, college/program scope, or other access rules incorrectly exclude an otherwise valid Student.
- **Evidence**: OSAD administrator `Marcus Cruz` has role `osad_staff` with `university` scope, allowing full access to list and provision all student accounts across all colleges.

## 1.5 Mapping Failure: **NO**
- **Definition**: Backend returns the Student, but the frontend drops or misnames fields and fails to render the row.
- **Evidence**: The backend payload returns all standard normalized fields (`institutional_id`, `student_id`, `full_name`, `email`, `sex`, `college`, `program`, `year_level`, `status`, `must_change_password`). The failure occurs before mapping because the frontend never requests the data from the server.

## 1.6 Synchronization Failure: **YES (PRIMARY ROOT CAUSE)**
- **Definition**: The Student exists in the database and is retrievable via backend API, but the frontend table state is disconnected from the server listing path and does not synchronize with committed server data.
- **Evidence**:
  1. `OSADStudentAccountsPage.jsx` renders table rows via `getUsers()` -> `OSADController.getUsers()`.
  2. `OSADController.#users` is a private, hardcoded mock array containing 5 initial mock student records.
  3. `AddStudentAccountModal.jsx` calls `provisioningService.provisionManualStudent(payload)` which persists the record in the backend database, but `OSADStudentAccountsPage` does not fetch or subscribe to backend data.
  4. Neither `provisioningService.fetchStudents()` nor `GET /api/v1/osad/students` is called upon page load, filter change, creation modal completion, or browser reload.
  5. Full browser reload simply re-executes `new OSADController()`, retaining only the original 5 static mock entries.

## 1.7 Visibility-State Failure: **NO**
- **Definition**: The Student exists and is retrievable, but active search/filter/sort/pagination/lifecycle state hides it without clear explanation.
- **Evidence**: The student is missing even when all filters are cleared (`search=""`, `college="all"`, `year_level="all"`, `sex="all"`, `status="all"`), because the client-side state is entirely disconnected from the database.

---

# 2. Detailed Breakdown of Frontend Disconnection

```text
Layer                  Current Implementation                                   Intended Authoritative Design
------------------------------------------------------------------------------------------------------------------------
Data Store             OSADController.#users (in-memory mock array)             Server DB (achievenest_local)
API Client Method      provisioningService.fetchStudents() (exists, unused)     provisioningService.fetchStudents()
Page Fetching          None on mount (reads synchronous mock hook)              async useEffect / query hook on mount
Post-Create Sync       None (modal closes after toast)                          Refetches server students / updates state
Reload State           Re-instantiates 5 static mock students                   Fetches complete student roster from API
```

---

# 3. Severity Assessment

- **Severity**: **HIGH**
- **Rationale**:
  - The backend and database layers are structurally sound, transactional, and compliant with Plan 07 and Plan 08 invariants.
  - However, the frontend UI presents a major synchronization defect where committed accounts are invisible to the administrator, creating the false perception of data loss or provisioning failure and encouraging duplicate retry attempts.

---

# 4. Phase 1 Exit Determination

All diagnostic requirements for **Phase 1 — Reproduce & Capture Evidence** have been met without applying premature code changes.

- **Phase 1 Decision**: **PASS**
- **Ready for Phase 2 (Creation Transaction Audit)**: **YES**
