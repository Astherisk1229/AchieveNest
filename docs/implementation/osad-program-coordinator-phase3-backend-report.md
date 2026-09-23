# AchieveNest — Academic Program & Program Coordinator Coverage
## Phase 3 Backend & API Contract Alignment Report
**Authoritative Backend Implementation & Verification Report**

---

### 1. Executive Summary

Phase 3 successfully aligned the backend architecture and API contracts for **Academic Program Master Data** and **Program Coordinator Coverage Management**.

Key accomplishments:
- Consolidated all coordinator coverage mutation semantics under one authoritative backend service: `App\Services\CollegeService`.
- Added `updateProgram` to enable master-data-only updates (name, degree level, status, code) while strictly ignoring/decoupling coordinator fields.
- Added explicit atomic `reassignCoordinator` API and service method (`POST /api/v1/osad/colleges/{id}/reassign-coordinator`), enabling seamless tenure handover while soft-deactivating prior assignments.
- Preserved the MySQL database constraint `uq_active_program_coordinator` (virtual generated column `active_program_coord_guard`), guaranteeing that no Academic Program can ever have more than one active coordinator.
- Implemented and executed automated verification suite (`verify:phase3-coordinator-coverage`) achieving 11/11 tests passing with 0 failures and 0 regressions.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Database**: `achievenest_local` (MySQL on local WAMP stack, port 3306)
- **Environment**: CodeIgniter 4 backend with PHP 8.2.29
- **Timestamp**: `2026-09-01T11:13:00+08:00`

---

### 3. Canonical Service

- **Authoritative Service**: `App\Services\CollegeService` (`backend/app/Services/CollegeService.php`)
- **Key Methods**:
  - `listPrograms(?string $collegeId)`: Efficient single-query join fetching programs with active coordinator names.
  - `createProgram(array $data)`: Creates standalone program master data under active college.
  - `updateProgram(string $programId, array $data)`: Updates degree title, level, status, or code. Decoupled from coordinator coverage.
  - `listCoordinatorPersonnel(string $collegeId)`: Fetches eligible HR-affiliated personnel and their active coordinating programs.
  - `getPersonnelCoordinatorContext(string $collegeId, string $profileId)`: Returns eligible programs with active state and other coordinator conflicts.
  - `updatePersonnelCoordinatorAssignments(string $collegeId, string $profileId, array $programIds, ?string $actorProfileId)`: Atomic multi-program diff updates.
  - `reassignCoordinator(string $collegeId, string $programId, string $newCoordinatorId, ?string $actorProfileId)`: Dedicated atomic coordinator reassignment.

---

### 4. Route Matrix

| HTTP Method | Route | Controller | Method | Purpose | Server Auth |
|---|---|---|---|---|---|
| `GET` | `/api/v1/osad/academic-programs` | `Api\CollegeController` | `listPrograms` | List programs with active coordinator | `canManageAcademicStructure` |
| `POST` | `/api/v1/osad/academic-programs` | `Api\CollegeController` | `createProgram` | Create standalone program | `canManageAcademicStructure` |
| `PUT` | `/api/v1/osad/academic-programs/(:segment)` | `Api\CollegeController` | `updateProgram/$1` | Update program master data | `canManageAcademicStructure` |
| `PATCH`| `/api/v1/osad/academic-programs/(:segment)` | `Api\CollegeController` | `updateProgram/$1` | Update program master data | `canManageAcademicStructure` |
| `GET` | `/api/v1/osad/colleges/(:segment)/coordinator-personnel` | `Api\CollegeController` | `listCoordinatorPersonnel/$1` | List eligible personnel & coverage | `canManageAcademicStructure` |
| `GET` | `/api/v1/osad/colleges/(:segment)/coordinator-personnel/(:segment)` | `Api\CollegeController` | `getPersonnelCoordinatorContext/$1/$2` | Get personnel context & eligible programs | `canManageAcademicStructure` |
| `PUT` | `/api/v1/osad/colleges/(:segment)/coordinator-personnel/(:segment)` | `Api\CollegeController` | `updatePersonnelCoordinatorAssignments/$1/$2` | Atomically save multi-program assignments | `canManageAcademicStructure` |
| `POST`| `/api/v1/osad/colleges/(:segment)/reassign-coordinator` | `Api\CollegeController` | `reassignCoordinator/$1` | Explicitly reassign program coordinator | `canManageAcademicStructure` |

---

### 5. Read Contracts

- **N+1 Query Elimination**: `CollegeService::listPrograms` queries all academic programs for a college (or all colleges) with a subquery joining `program_coordinator_assignments` and `profiles` where `is_active = 1`, returning `coordinator_name` in a single query.
- **Eligible Personnel Filtering**: `CollegeService::listCoordinatorPersonnel` performs an inner join against `personnel_program_affiliations` where `is_active = 1` and `profiles.status = 'active'`, returning only personnel with legitimate HR affiliations to programs in that College.

---

### 6. Mutation Contracts

- **Program Creation**: Requires only `college_id`, `code`, `name`, and optional `degree_level`. Coordinator fields are absent.
- **Program Update**: Accepts `name`, `degree_level`, `status`, and `code`. Coordinator fields are ignored.
- **Multi-Program Assignment**: Accepts `{ "program_ids": ["uuid1", "uuid2"] }`. Computes diff (`toKeep`, `toAdd`, `toRemove`) and applies changes inside a database transaction.
- **Reassignment**: Accepts `{ "program_id": "uuid", "new_coordinator_profile_id": "uuid" }`. Soft-deactivates prior active row and inserts new active row.

---

### 7. Authorization

- All mutation and read endpoints in `CollegeController` invoke `checkOSADAuthorization($actor)`.
- `checkOSADAuthorization` delegates directly to `AuthorizationService::governance()->canManageAcademicStructure($actor)`.
- Unauthorized requests receive standard `403 Forbidden` (`{"error": {"code": "FORBIDDEN", "message": "Only OSAD administrators may manage..."}}`). Unauthenticated requests receive `401 Unauthorized`.

---

### 8. Validation

- **Program Code**: Automatically converted to uppercase, validated for university-wide uniqueness across colleges.
- **Degree Level**: Must be within allowlist: `undergraduate`, `graduate`, `certificate`, `diploma`.
- **Program Status**: Must be within allowlist: `active`, `inactive`, `archived`.
- **HR Affiliation**: Every assigned program must have an active row in `personnel_program_affiliations` for the target personnel profile.
- **College Boundary**: Program must belong to the active College context.

---

### 9. Transactions

- Database transactions (`$this->db->transStart()` / `$this->db->transComplete()`) are used on:
  - `CollegeService::createCollege` (when nested programs are included).
  - `CollegeService::updatePersonnelCoordinatorAssignments` (diff deactivation + inserts).
  - `CollegeService::reassignCoordinator` (deactivation of prior coordinator + insertion of new coordinator).
- On failure, transactions roll back completely, ensuring zero partial state corruption.

---

### 10. Conflict Handling

- When assigning programs via `updatePersonnelCoordinatorAssignments`:
  - For each program in `toAdd`, checks if another personnel member is currently assigned (`is_active = 1`).
  - If a conflict exists, throws `InvalidArgumentException` (*"Academic Program '[CODE]' already has an active Program Coordinator ([Name])."*) returning `422 Unprocessable Entity`.
- When using `reassignCoordinator`:
  - Explicitly handles reassignment by soft-deactivating the prior active assignment and creating the new assignment.
  - If the new personnel is already the active coordinator, returns an idempotent `reassigned: false` response.

---

### 11. History Preservation

- **Soft Deactivation**: Whenever an assignment is removed or replaced, `program_coordinator_assignments` is updated with `is_active = 0`, `effective_until = CURRENT_DATE`, and `updated_at = CURRENT_TIMESTAMP`.
- **Row Retention**: Zero rows are deleted from `program_coordinator_assignments`. Historical tenures, assigner IDs (`assigned_by`), and date ranges remain permanently queryable.

---

### 12. Legacy Route Disposition

- **Legacy Route**: `POST /api/v1/personnel/(:segment)/roles` (`PersonnelRoleController::assign`).
- **Disposition**: **DEPRECATION CANDIDATE**.
- **Assessment**: The OSAD frontend exclusively communicates with `CollegeController` through `frontend/src/services/collegeAdminService.js`. The legacy route remains available for backwards-compatibility with general personnel role management but is not used for the OSAD academic structure flow.

---

### 13. Automated Tests

Executed via CodeIgniter CLI: `php spark verify:phase3-coordinator-coverage`

```text
========================================================================
AchieveNest — Plan 01 Phase 3 Backend & API Contract Verification
========================================================================

[1] READ CONTRACTS
  READ-001   listPrograms returns academic programs with joined coordinator [PASS]
  READ-002   listCoordinatorPersonnel returns HR-affiliated eligible personnel [PASS]
  READ-003   getPersonnelCoordinatorContext returns eligible programs and current state [PASS]

[2] MASTER DATA MUTATION CONTRACTS
  PROG-001   createProgram succeeds without coordinator              [PASS]
  PROG-002   updateProgram updates master data and ignores coordinator inputs [PASS]
  PROG-003   updateProgram rejects duplicate code across colleges    [PASS]

[3] MULTI-PROGRAM BATCH ASSIGNMENT
  BATCH-001  updatePersonnelCoordinatorAssignments atomically adds multiple programs [PASS]
  BATCH-002  Repeated identical assignment is idempotent and creates 0 duplicate rows [PASS]

[4] REASSIGNMENT & HISTORY PRESERVATION
  REAS-001   reassignCoordinator soft-deactivates prior assignment and activates new tenure [PASS]

[5] REMOVAL / UNASSIGNMENT
  REM-001    Removal sets program to unassigned while permanently retaining history [PASS]

[6] AUTHORIZATION & GOVERNANCE POLICY
  AUTH-001   GovernancePolicy allows OSAD admin and strictly forbids student/personnel [PASS]

========================================================================
Phase 3 Verification Summary: 11 Passed, 0 Failed
========================================================================
```

---

### 14. Regression Results

Executed Phase F regression suite: `php spark verify:phase-f-coordinator-assignment`

```text
========================================================================
AchieveNest — Phase F Program Coordinator Assignment Verification
========================================================================
  CHK-001    Baseline contains 5 active colleges                     [PASS]
  CHK-002    Baseline contains 14 active programs                    [PASS]
  CHK-003    Active Dean assignments exist (2 active)                [PASS]
  CHK-004    Active Coordinator assignments exist (3 active)         [PASS]
  ELIG-001   listCoordinatorPersonnel returns college and affiliated personnel list [PASS]
  CTX-001    getPersonnelCoordinatorContext returns eligible programs with assignment state [PASS]
  DIFF-001   Atomically assigns one personnel to multiple programs (BSCS + BSIT) [PASS]
  DIFF-002   Diff update preserves kept program and soft-deactivates removed program [PASS]
  GOV-001    Rejects assignment when program belongs to different college [PASS]
  GOV-002    Rejects assignment when personnel has no HR affiliation with program [PASS]
  CONF-001   Rejects assignment when program already has active coordinator [PASS]
  INV-001    Colleges preserved (5 original active)                  [PASS]
  INV-002    Programs preserved (14 original active)                 [PASS]
  INV-003    Deans preserved (2 active assignments)                  [PASS]
  INV-004    Coordinators preserved (3 active assignments)           [PASS]
========================================================================
Phase F Verification Summary: 15 Passed, 0 Failed
========================================================================
```

---

### 15. Phase 4 Frontend Handoff

The backend is fully aligned and ready for Phase 4 UI implementation:
- Frontend client helper `frontend/src/services/collegeAdminService.js` contains:
  - `fetchColleges(filters)`
  - `fetchCollege(id)`
  - `createCollege(payload)`
  - `fetchAcademicPrograms(filters)`
  - `createAcademicProgram(payload)`
  - `updateAcademicProgram(programId, payload)`
  - `fetchCoordinatorPersonnel(collegeId)`
  - `fetchPersonnelCoordinatorContext(collegeId, profileId)`
  - `updatePersonnelCoordinatorAssignments(collegeId, profileId, programIds)`
  - `reassignProgramCoordinator(collegeId, programId, newCoordinatorProfileId)`

---

### 16. Exit Decision

All backend contracts, mutation methods, read joins, conflict checks, transactions, and automated test verifications are complete and passing.

**DECISION: GO FOR PHASE 4 — FRONTEND WORKFLOW IMPLEMENTATION**
