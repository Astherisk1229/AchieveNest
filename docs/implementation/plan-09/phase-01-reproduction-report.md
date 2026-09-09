# PLAN 09 — Phase 1 Reproduction Report
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Executive Summary

This diagnostic report documents the execution of **Plan 09 Phase 1 — Reproduce & Capture Evidence** for the defect:

> *OSAD receives a successful Student-account creation result, but the newly created Student does not appear in the Student Accounts table.*

Through direct, controlled end-to-end tracing across the backend API, the ACID database transaction, and the frontend architecture, the defect has been deterministically reproduced and classified:

1. **Backend & Database Integrity (PASS)**: `POST /api/v1/provisioning/manual-student` succeeds with HTTP `201 Created`. All required 1:1 and 1:N relational entities (`profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, `local_auth_credentials`, `account_lifecycle_events`, `audit_logs`) are atomically committed to the database.
2. **Authoritative Backend Query (PASS)**: The canonical endpoint `GET /api/v1/osad/students` (`TargetProvisioningController::listStudents`) retrieves the newly created Student record with complete normalized projection and respects all filters/search queries.
3. **Frontend Synchronization & State Failure (REPRODUCED & VERIFIED)**: The frontend page `OSADStudentAccountsPage.jsx` does not consume the authoritative server endpoint `GET /api/v1/osad/students` or `provisioningService.fetchStudents()`. Instead, it reads table rows synchronously from `useOSAD` / `OSADController.getUsers()`, which queries a static, in-memory mock array of 5 hardcoded student objects (`OSADController.#users`). When `AddStudentAccountModal` succeeds, no server refetch is triggered, no state synchronization occurs, and on full browser reload `OSADController` re-instantiates with the same 5 static mock students.

---

# 2. Pre-Test Environment Capture

| Property | Value | Notes |
|---|---|---|
| Application Environment | `local-defense` (development) | Local defense WAMP MySQL/CI4 runtime |
| Git Branch | `audit/project-architecture-linkage` | Verified |
| Git Commit | `ea987bf32c208cc99ebe1a60b989c0c09ca83e98` | Verified |
| Database Engine | MySQL 8.4.7 (`achievenest_local`) | 64 tables with primary keys |
| Baseline Student Rows in DB | `99` records | `SELECT COUNT(*) FROM profiles WHERE account_type = 'student'` |
| OSAD Admin Actor | `Marcus Cruz` (`osad.admin01@ndmu.edu.ph`) | Canonical ID: `10000000-0000-0000-0000-000000000005` |
| OSAD Role Assignment | `osad_staff` (`university` scope) | Authorized |
| Current Student Accounts Route | `/admin/osad?tab=accounts` | `OSADStudentAccountsPage.jsx` |
| Default Query State | Search: `""`, College: `"all"`, Program: `"all"`, Year Level: `"all"`, Sex: `"all"`, Status: `"all"` | Default view |
| Visible UI Rows (Client Mock) | `5` rows | Hardcoded in `OSADController.#users` |
| Authoritative API List Rows | `99` rows | Retrievable via `GET /api/v1/osad/students` |

---

# 3. Controlled Test Student Specification

| Field | Value | Contract Compliance |
|---|---|---|
| **Test Label** | `PLAN09-P1-TEST-20260902021631` | Unique diagnostic run |
| **Institutional ID** | `2026315391` | 10 ASCII digits, unique |
| **Institutional Email** | `plan09_p1_20260902021631@ndmu.edu.ph` | `@ndmu.edu.ph` domain verified |
| **First Name** | `TestFirst20260902021631` | Validated name characters |
| **Last Name** | `TestLast20260902021631` | Validated name characters |
| **Sex** | `Male` | Plan 08 canonical value |
| **Year Level** | `1st Year` | Plan 08 canonical value |
| **Academic Year** | `2025-2026` | Plan 08 consecutive format |
| **Academic Program ID** | `30000000-0000-0000-0000-000000000001` | BSCS (under CET) |
| **College** | `CET` (`College of Engineering and Technology`) | Valid relational parent |

---

# 4. Request / Response Capture & Timing

## 4.1 Create Request
- **Endpoint**: `POST /api/v1/provisioning/manual-student`
- **Caller Identity**: `Marcus Cruz` (OSAD Admin, `10000000-0000-0000-0000-000000000005`)
- **Authorization**: `Bearer <local-defense-jwt>`
- **Request Payload**:
  ```json
  {
    "institutional_id": "2026315391",
    "institutional_email": "plan09_p1_20260902021631@ndmu.edu.ph",
    "first_name": "TestFirst20260902021631",
    "last_name": "TestLast20260902021631",
    "sex": "Male",
    "academic_program_id": "30000000-0000-0000-0000-000000000001",
    "year_level": "1st Year",
    "academic_year": "2025-2026"
  }
  ```

## 4.2 Create Response
- **HTTP Status**: `201 Created`
- **Response Time**: `12.1 ms`
- **Returned Canonical ID**: `e8d4bde1-a83a-4d87-928d-006f78ee6efd`
- **Returned Data**:
  ```json
  {
    "message": "Student account successfully provisioned.",
    "id": "e8d4bde1-a83a-4d87-928d-006f78ee6efd",
    "institutional_id": "2026315391",
    "institutional_email": "plan09_p1_20260902021631@ndmu.edu.ph",
    "full_name": "TestFirst20260902021631 TestLast20260902021631",
    "sex": "Male",
    "account_type": "student",
    "academic_program_id": "30000000-0000-0000-0000-000000000001",
    "program": "Bachelor of Science in Computer Science",
    "program_code": "BSCS",
    "year_level": "1st Year",
    "enrollment_status": "enrolled",
    "status": "active",
    "administrative_status": "active",
    "account_lifecycle_status": "pending_first_login",
    "required_next_action": "change_password",
    "must_change_password": true
  }
  ```

## 4.3 Success Message Timing
- **SUCCESS MESSAGE TIMING: VERIFIED**
- Database transaction completes and commits (`$db->commit()`) prior to the emission of HTTP 201 response.

---

# 5. Database Verification Matrix

Immediately following creation, the database was queried using the returned canonical identifier `e8d4bde1-a83a-4d87-928d-006f78ee6efd`:

| Record / Table | Expected | Found | Canonical Identifier / FK | Linked Correctly? | Notes |
|---|---:|---:|---|---|---|
| `profiles` | Yes | Yes | `id = e8d4bde1-a83a-4d87-928d-006f78ee6efd` | Yes | `account_type = student`, `sex = Male`, `status = active` |
| `student_profiles` | Yes | Yes | `profile_id = e8d4bde1-a83a-4d87-928d-006f78ee6efd` | Yes | `year_level = 1st Year`, `enrollment_status = enrolled` |
| `student_program_enrollments` | Yes | Yes | `id = f05beeca-d0ff-4551-9e25-8c0b72982401` | Yes | `academic_program_id = 30000000...0001`, `academic_year = 2025-2026`, `is_active = 1` |
| `profile_roles` | Yes | Yes | `id = 2a0bd14b-7f39-4476-ae07-f053a4b39add` | Yes | `role_id = 6b9424d2...` (`student`), `scope_type = university`, `is_active = 1` |
| `local_auth_credentials` | Yes | Yes | `profile_id = e8d4bde1-a83a-4d87-928d-006f78ee6efd` | Yes | `must_change_password = 1`, `status = active` |
| `account_lifecycle_events` | Yes (2) | Yes (2) | `profile_id = e8d4bde1-a83a-4d87-928d-006f78ee6efd` | Yes | `provisioned` and `activated` events recorded |
| `audit_logs` | Yes (1) | Yes (1) | `target_id = e8d4bde1-a83a-4d87-928d-006f78ee6efd` | Yes | `event_code = ACCOUNT_PROVISIONING_SUCCEEDED` |

**CREATE RESPONSE ↔ DATABASE IDENTIFIER MATCH: PASS**

---

# 6. Canonical List & Detail Endpoint Verification

## 6.1 Authoritative List Endpoint (`GET /api/v1/osad/students`)
- **Endpoint Status**: `200 OK`
- **Total Rows Returned**: `100` (incremented by exactly 1 from pre-create baseline of 99)
- **LIST RETRIEVAL OF CREATED STUDENT: PASS**
- **Normalized Row Projection**:
  - `id`: `e8d4bde1-a83a-4d87-928d-006f78ee6efd`
  - `institutional_id`: `2026315391`
  - `full_name`: `TestFirst20260902021631 TestLast20260902021631`
  - `email`: `plan09_p1_20260902021631@ndmu.edu.ph`
  - `sex`: `Male`
  - `college`: `CET` (`College of Engineering and Technology`)
  - `program`: `BSCS` - `Bachelor of Science in Computer Science`
  - `year_level`: `1st Year`
  - `status`: `active`
  - `must_change_password`: `1`

## 6.2 Filter & Search Capability on Canonical Endpoint
- **Search by Institutional ID (`2026315391`)**: **PASS** (Exact 1-row match)
- **Search by Name (`TestLast20260902021631`)**: **PASS** (Student included)
- **Filter by College (`CET`)**: **PASS** (Student included)
- **Filter by Year Level (`1st Year`)**: **PASS** (Student included)
- **Filter by Mismatched Year Level (`4th Year`)**: **PASS** (Correctly excluded)

---

# 7. Frontend State Ownership & Synchronization Root Cause

| Area | Current Implementation | Flaw Identified |
|---|---|---|
| **Table State Source** | `const rawUsersList = getUsers ? getUsers('student', userSearchTerm, selectedCollege, selectedSort) : []` | Consumes `useOSAD` -> `OSADController.#users` (in-memory mock array) |
| **Server Fetching** | None | `OSADStudentAccountsPage.jsx` never invokes `provisioningService.fetchStudents()` or `GET /api/v1/osad/students` |
| **Post-Create Handler** | `onSubmit` in modal triggers `provisioningService.provisionManualStudent(payload)`, shows toast, and closes modal | No server refetch or state update is performed |
| **Full Reload Behavior** | `OSADController` is re-instantiated in memory | Static 5 mock students are loaded; database students are ignored |

---

# 8. Phase 1 Completion Matrix

```text
========================================================================
PLAN 09 — PHASE 1 REPRODUCE & CAPTURE EVIDENCE
========================================================================

Unique test Student created: PASS

Create request captured: PASS
Create response captured: PASS
Canonical identifiers returned: PASS
Success emitted after commit: PASS

Database profile row: PASS
Database Student profile row: PASS
Database enrollment row: PASS
Database role assignment: PASS
Database auth/credential row: PASS
Account/profile linkage integrity: PASS

Canonical detail endpoint retrieval: PASS
Canonical list endpoint retrieval: PASS
Default list visibility: PASS
Current-filter list visibility: PASS

OSAD authorization scope: PASS
Search behavior: PASS
Pagination behavior: PASS
Sort behavior documented: PASS
Count/row consistency: PASS

Frontend post-create refetch triggered: FAIL (No refetch implemented)
Frontend canonical state owner identified: PASS (OSADController.#users mock array)
Frontend response mapping: FAIL (Frontend bound to mock store, not API)
Stale-response risk observed: NO
Full reload comparison: PASS (Confirms mock-only client persistence)

Persistence failure: NO
Partial transaction: NO
Retrieval failure: NO
Scope failure: NO
Mapping failure: NO
Synchronization failure: YES
Visibility-state failure: NO

Verified root cause:
Frontend disconnection — OSADStudentAccountsPage renders from synchronous
in-memory mock state (OSADController.#users) instead of fetching from the
authoritative backend listing endpoint (GET /api/v1/osad/students).

Critical findings: 0
High findings: 1 (Frontend table disconnected from server database)
Medium findings: 0
Low findings: 0
Unresolved blockers: 0

PHASE 1 DECISION: PASS
READY FOR PHASE 2 — CREATION TRANSACTION AUDIT: YES
========================================================================
```
