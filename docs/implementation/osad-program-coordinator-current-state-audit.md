# AchieveNest — Academic Program & Program Coordinator Coverage
## Phase 1 Current-State Audit Report
**Authoritative Architectural & Operational Audit**

---

### 1. Executive Summary

This audit establishes a strict, evidence-backed baseline of how OSAD (Office of Student Affairs and Services) currently manages Academic Programs and Program Coordinator Coverage within AchieveNest.

The audit verified the target architectural model:
- **Academic Programs** operate purely as institutional master data under active Colleges, without embedding coordinator foreign keys or requiring coordinators during program creation.
- **Program Coordinator Coverage** operates as a normalized, personnel-first relational coverage model in `program_coordinator_assignments`, scoped under Colleges and constrained by HR-established personnel affiliations (`personnel_program_affiliations`).
- **Database Safety & Invariants**: Active assignment uniqueness is enforced at the database level using a virtual generated column and unique index (`uq_active_program_coordinator` on `active_program_coord_guard`), guaranteeing that no Academic Program can have more than one active coordinator simultaneously. Historical assignment transitions (reassignment and revocation) soft-deactivate previous rows (`is_active = 0`, `effective_until = CURRENT_DATE`), preserving full historical integrity.
- **Service & API Authority**: The canonical backend service is `CollegeService` exposed via `CollegeController` under `/api/v1/osad/colleges/*` and `/api/v1/osad/academic-programs`. Server-side OSAD authorization is enforced.

---

### 2. Repository Baseline

- **Repository Branch**: `audit/project-architecture-linkage`
- **Git HEAD**: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- **Working Tree State**: Clean baseline commits with local verification commands and migration reports.
- **Database Schema**: `achievenest_local` (MySQL on local WAMP stack, port 3306).
- **Audit Timestamp**: `2026-09-01T11:05:00+08:00`

---

### 3. Academic Programs UI

- **Page Title**: `Academic Structure`
- **Route**: `/osad/dashboard?tab=academic-structure` (or `/osad/dashboard?tab=academic-programs`)
- **Breadcrumbs / Context**: Top header badge with subtitle: *"Click any College card to view its programs, dean leadership, and coordinator coverage."*
- **Header**: Contains icon, title, description, and primary creation actions.
- **Primary Actions**:
  - `Create College` button (opens `CreateCollegeModal`).
  - `Create Academic Program` button (opens `CreateProgramModal`). Disabled if no colleges exist.
- **Search & Filters**: No top-level search on grid view; cards display programs for each college with live search inside College Details / Coordinator Manager subviews.
- **Card / Grid Format**: Two-column responsive grid of College cards (`colleges.map(...)`).
- **College Card Header & Details**:
  - Logo thumbnail / acronym avatar with dynamic WCAG accessible text color.
  - College code badge and Dean indicator (`Dean: <name>` or `Dean: Not Assigned`).
  - Quick action: `+ Add Program` button (scoped to college).
  - Programs count badge (`X Programs`).
  - Preview list of up to 3 programs showing program code, name, and coordinator coverage indicator (`<Coordinator Name>` with check icon or `Needs Coordinator` in amber).
  - Card footer affordance: `View College Details ->`.
- **Loading State**: Handled via persistent state hook `loadPersistentColleges` / `loadPersistentPrograms`.
- **Empty State**: Displays *"No Academic Programs configured yet. Click to manage."* when college has 0 programs.

---

### 4. Create Program Workflow

- **Trigger Button**:
  - Global Header: `Create Academic Program` (triggers `CreateProgramModal` with selectable College dropdown).
  - College Card / Detail Action: `Add Program` / `Add Academic Program` (triggers `CreateProgramModal` with `initialCollegeId` locked).
- **Modal Component**: `frontend/src/pages/osad-admin/modals/CreateProgramModal.jsx`
- **Fields**:
  - `Parent College`: Select dropdown (when triggered globally) or read-only badge card (when triggered with pre-scoped `initialCollegeId`).
  - `Program Code (Acronym)`: Text input, uppercase, max 20 chars (e.g., `BSCS`).
  - `Academic Program Name (Degree Title)`: Text input, max 150 chars (e.g., `Bachelor of Science in Computer Science`).
- **Required Fields**: `college_id`, `code`, `name`.
- **Coordinator Requirement Classification**: **ABSENT / NO**. Program creation does not prompt, require, or accept a Program Coordinator.
- **Validation**:
  - Frontend: Checks non-empty trimmed code and name, verifies parent college selected. Dirty-state tracking with `useConfirmableClose` discard confirmation dialog.
  - Backend: `CollegeService::createProgram` verifies `college_id` exists and is `active`, enforces uniqueness of `code`, validates `degree_level` allowlist, sets default `degree_level = 'undergraduate'`, `status = 'active'`.
- **API Endpoint**: `POST /api/v1/osad/academic-programs`
- **Request Body (JSON)**:
  ```json
  {
    "college_id": "20000000-0000-0000-0000-000000000001",
    "code": "BSROBOTICS",
    "name": "Bachelor of Science in Robotics Engineering"
  }
  ```
- **Response Handling**: Returns 201 Created with `{ message, program }`. Frontend updates local state and fires toast notification.
- **Nested Creation Workflow**: In `CreateCollegeModal.jsx`, OSAD can optionally add draft programs during College creation via `programs: [{ code, name }, ...]`. Backend handles transactional insertion inside `CollegeService::createCollege`.

---

### 5. Edit Program Workflow

- **Current Implementation State**:
  - There is currently **NO dedicated Edit Academic Program modal or endpoint** in the OSAD UI or backend.
  - `CollegeController` has `listPrograms` (GET) and `createProgram` (POST), but no `PUT /osad/academic-programs/:id` endpoint.
  - In `OSADCollegeDetailsView.jsx`, programs are listed with their status and coordinator assignments, but program code/name cannot be edited inline.
- **Coupling with Coordinator Assignment**: Completely decoupled. Coordinator assignments are managed via the dedicated personnel-first coordinator manager flow, not embedded in program edit forms.

---

### 6. Program Coordinator Coverage UI

The application provides a dedicated, multi-tier coordinator coverage management interface:
1. **Academic Programs Grid (`OSADAcademicProgramsPage.jsx`)**: Shows coordinator status preview on each program row (`UserCheck` + name vs. `Needs Coordinator`).
2. **College Details View (`OSADCollegeDetailsView.jsx`)**:
   - Header summary metrics: `Total Academic Programs`, `Assigned Coordinators` (emerald), `Needs Coordinator` (amber).
   - Program list with `Assign` / `Reassign` action buttons.
   - Dedicated `Manage Program Coordinators` button in header and section toolbar.
3. **Coordinator Manager View (`OSADCoordinatorManagerView.jsx`)**:
   - Dedicated subview scoped to the College.
   - Live search input for filtering personnel by name, email, or program acronym.
   - Shows all HR-affiliated personnel with their assigned program count and coordinator badges.
   - `Manage Programs` button per personnel row.
4. **Multi-Program Assignment Modal (`ManagePersonnelProgramsModal.jsx`)**:
   - Multi-checkbox editor allowing OSAD to select 1 or more eligible programs for that personnel in one atomic transaction.
   - Displays conflicts (if another coordinator is active for a program).

---

### 7. Assignment Entry Points

| Entry Point ID | UI Location | Trigger Element | Action Flow |
|---|---|---|---|
| **EP-01** | `OSADCollegeDetailsView` Header | `Manage Program Coordinators` button | Opens `OSADCoordinatorManagerView` |
| **EP-02** | `OSADCollegeDetailsView` Table Header | `Manage Coordinators` button | Opens `OSADCoordinatorManagerView` |
| **EP-03** | `OSADCollegeDetailsView` Program Row | `Assign` / `Reassign` button | Opens `OSADCoordinatorManagerView` |
| **EP-04** | `OSADCoordinatorManagerView` Row | `Manage Programs` button | Opens `ManagePersonnelProgramsModal` |
| **EP-05 (Legacy)** | `OSADDashboardPage` | `PersonnelSelectorModal` | Legacy modal target in OSADDashboard (mock/toast only, not wired to CollegeService) |

---

### 8. Frontend Components

- `frontend/src/pages/osad-admin/OSADAcademicProgramsPage.jsx` — College card grid, top-level actions.
- `frontend/src/pages/osad-admin/OSADCollegeDetailsView.jsx` — College details, program list with coordinator coverage indicators.
- `frontend/src/pages/osad-admin/OSADCoordinatorManagerView.jsx` — Personnel-first coordinator directory under college.
- `frontend/src/pages/osad-admin/modals/CreateCollegeModal.jsx` — College creation with visual branding and optional nested programs.
- `frontend/src/pages/osad-admin/modals/CreateProgramModal.jsx` — Standalone program creation modal.
- `frontend/src/pages/osad-admin/modals/ManagePersonnelProgramsModal.jsx` — Multi-program checkbox assignment modal.
- `frontend/src/pages/osad-admin/modals/PersonnelSelectorModal.jsx` — Legacy single personnel selector.
- `frontend/src/services/collegeAdminService.js` — API client for colleges, programs, and coordinator assignments.
- `frontend/src/controllers/AcademicStructureController.js` — Client-side in-memory model controller (used in offline/test fallback).

---

### 9. Route Map

| HTTP Method | Route | Controller | Method | Purpose | Called By |
|---|---|---|---|---|---|
| `GET` | `/api/v1/osad/colleges` | `Api\CollegeController` | `index` | List colleges with dean & program stats | `fetchColleges()` |
| `POST` | `/api/v1/osad/colleges` | `Api\CollegeController` | `create` | Create college with optional logo & programs | `createCollege()` |
| `GET` | `/api/v1/osad/colleges/(:segment)` | `Api\CollegeController` | `show` | Get single college details & programs | `fetchCollege()` |
| `GET` | `/api/v1/osad/colleges/(:segment)/logo` | `Api\CollegeController` | `logo` | Stream college logo binary | `getCollegeLogoUrl()` |
| `GET` | `/api/v1/osad/academic-programs` | `Api\CollegeController` | `listPrograms` | List programs with active coordinator names | `fetchAcademicPrograms()` |
| `POST` | `/api/v1/osad/academic-programs` | `Api\CollegeController` | `createProgram` | Create standalone academic program | `createAcademicProgram()` |
| `GET` | `/api/v1/osad/colleges/(:segment)/coordinator-personnel` | `Api\CollegeController` | `listCoordinatorPersonnel` | List eligible personnel & active assignments | `fetchCoordinatorPersonnel()` |
| `GET` | `/api/v1/osad/colleges/(:segment)/coordinator-personnel/(:segment)` | `Api\CollegeController` | `getPersonnelCoordinatorContext` | Get personnel's eligible programs & assignments | `fetchPersonnelCoordinatorContext()` |
| `PUT` | `/api/v1/osad/colleges/(:segment)/coordinator-personnel/(:segment)` | `Api\CollegeController` | `updatePersonnelCoordinatorAssignments` | Atomically update multi-program assignments | `updatePersonnelCoordinatorAssignments()` |
| `GET` | `/api/v1/personnel/roles` | `Api\PersonnelRoleController` | `index` | List specialized role assignments | Legacy / Shared |
| `POST` | `/api/v1/personnel/(:segment)/roles` | `Api\PersonnelRoleController` | `assign` | Assign specialized role (program_coordinator) | Legacy single-role |
| `DELETE` | `/api/v1/personnel/(:segment)/roles/(:segment)` | `Api\PersonnelRoleController` | `revoke` | Revoke specialized role | Legacy single-role |

---

### 10. Controller Map

- **`App\Controllers\Api\CollegeController`**:
  - Middleware / Actor: Uses `AuthenticatedActorService::resolveActor` via Bearer token.
  - Authorization: `checkOSADAuthorization` delegates to `AuthorizationService::governance()->canManageAcademicStructure($actor)`. Returns 403 FORBIDDEN if non-OSAD.
  - Validation: Validates payload and catches `InvalidArgumentException` returning 422 VALIDATION_ERROR.
- **`App\Controllers\Api\PersonnelRoleController`**:
  - Handles single-role CRUD for `dean`, `program_coordinator`, and `organization_moderator`.
  - Enforces role-specific governance (`canAssignCoordinator` for OSAD).

---

### 11. Service Map

- **Authoritative Service**: `App\Services\CollegeService`
  - Owns: `listColleges`, `getCollege`, `createCollege`, `getLogoPathAndMime`, `createProgram`, `listPrograms`, `listCoordinatorPersonnel`, `getPersonnelCoordinatorContext`, `updatePersonnelCoordinatorAssignments`.
- **Authorization Service**: `App\Services\AuthorizationService` (and `App\Services\Policies\GovernancePolicy`).
- **Actor Resolution Service**: `App\Services\AuthenticatedActorService` (resolves active personnel profiles, roles, and scopes from `program_coordinator_assignments`).

---

### 12. Database Schema

#### Table: `academic_programs`
```sql
CREATE TABLE `academic_programs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `degree_level` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'undergraduate',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_academic_programs_college` (`college_id`),
  CONSTRAINT `fk_academic_programs_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_academic_programs_degree_level` CHECK ((`degree_level` in ('undergraduate','graduate','certificate','diploma'))),
  CONSTRAINT `ck_academic_programs_status` CHECK ((`status` in ('active','inactive','archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### Table: `program_coordinator_assignments`
```sql
CREATE TABLE `program_coordinator_assignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_program_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_program_coord_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `academic_program_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_program_coordinator` (`active_program_coord_guard`),
  KEY `fk_prog_coord_assigner` (`assigned_by`),
  KEY `idx_prog_coord_personnel` (`personnel_profile_id`),
  KEY `idx_prog_coord_program` (`academic_program_id`),
  CONSTRAINT `fk_prog_coord_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prog_coord_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prog_coord_program` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 13. Foreign Keys

| Table | Column | Constraint Name | Referenced Table | Referenced Column | On Delete |
|---|---|---|---|---|---|
| `academic_programs` | `college_id` | `fk_academic_programs_college` | `colleges` | `id` | `RESTRICT` |
| `program_coordinator_assignments` | `academic_program_id` | `fk_prog_coord_program` | `academic_programs` | `id` | `RESTRICT` |
| `program_coordinator_assignments` | `personnel_profile_id` | `fk_prog_coord_personnel` | `profiles` | `id` | `CASCADE` |
| `program_coordinator_assignments` | `assigned_by` | `fk_prog_coord_assigner` | `profiles` | `id` | `SET NULL` |
| `personnel_program_affiliations` | `academic_program_id` | `fk_personnel_program_program` | `academic_programs` | `id` | `RESTRICT` |
| `personnel_program_affiliations` | `personnel_profile_id` | `fk_personnel_program_personnel` | `profiles` | `id` | `CASCADE` |

---

### 14. Unique Constraints

| Table | Constraint Name | Column(s) | Type / Purpose |
|---|---|---|---|
| `academic_programs` | `code` | `code` | Enforces university-wide uniqueness of program codes (e.g. `BSCS`). |
| `program_coordinator_assignments` | `uq_active_program_coordinator` | `active_program_coord_guard` | Virtual generated column (`is_active = 1 ? academic_program_id : NULL`). Enforces that at most **one active coordinator** exists per program, while allowing unlimited inactive historical rows. |

---

### 15. Active Assignment Semantics

- **Enforcement Mechanism**: The virtual generated column `active_program_coord_guard` evaluates to `academic_program_id` when `is_active = 1` and `NULL` when `is_active = 0`.
- **Database Guarantee**: In MySQL/PostgreSQL UNIQUE indexes, `NULL` values are not considered duplicate, allowing full historical retention of inactive coordinator terms while physically preventing two rows with `is_active = 1` for the same `academic_program_id`.
- **Application Validation**: `CollegeService::updatePersonnelCoordinatorAssignments` performs pre-flight conflict detection to return clear, user-friendly error messages if another coordinator is already active on a submitted program.

---

### 16. Historical Assignment Semantics

- **History Classification**: **HISTORY PRESERVED**.
- **Reassignment / Deassignment Behavior**:
  - When an existing coordinator assignment is revoked or replaced, the database record is **never deleted**.
  - `CollegeService::updatePersonnelCoordinatorAssignments` executes a soft deactivation:
    ```sql
    UPDATE program_coordinator_assignments
    SET is_active = 0, effective_until = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
    WHERE personnel_profile_id = ? AND academic_program_id = ? AND is_active = 1;
    ```
  - When newly assigned, a new record is inserted with `effective_from = CURRENT_DATE`, `effective_until = NULL`, `is_active = 1`, and `assigned_by = actor_profile_id`.
  - Prior tenure, assigner metadata, and date ranges remain intact for audit and historical reporting.

---

### 17. Personnel Eligibility

To be eligible for assignment as a Program Coordinator for an Academic Program:
1. The user must have an active Personnel profile (`profiles.account_type IN ('personnel', 'hr_admin', 'osad_admin')` and `profiles.status = 'active'`).
2. The user must have an active HR-established program affiliation in `personnel_program_affiliations` (`is_active = 1`) matching the target Academic Program.
3. The Academic Program must belong to the active College being managed.
4. If a personnel member has no active HR affiliation to a program, `CollegeService` rejects the assignment with `422 VALIDATION_ERROR` (*"The selected personnel has no active HR affiliation with program..."*).

---

### 18. Authorization

- **Frontend Guard**: Navigation catalog requires `portal = 'osad'`, `allowedAccountTypes = ['osad_admin']`, `requiredActiveContexts = ['osad_staff']`, `requiredPermissions = ['osad.academic_structure.manage']`.
- **Backend Route Middleware / Controller Guard**: `CollegeController` invokes `checkOSADAuthorization($actor)`, which checks `GovernancePolicy::canManageAcademicStructure($actor)`.
- **Server-Side Enforcement**: **SERVER ENFORCED / PASS**. Calls from non-OSAD tokens receive `403 FORBIDDEN`.

---

### 19. Loading, Empty, Error, and Validation States

| Workflow / Component | Loading State | Empty State | Error / Retry State | Validation State |
|---|---|---|---|---|
| **Academic Programs List** | Skeleton / local state sync | *"No Academic Programs configured yet"* with `Add Program` button | Toast / console warning | Code & Name required |
| **Create College** | Button spinner (`Creating College...`) | Empty form with live preview defaults | Alert banner with server error | Client + server code uniqueness, hex badge validation, dirty close confirm |
| **Create Program** | Button spinner (`Creating Program...`) | Default form with pre-selected college | Alert banner with server error | Program code & name required, uppercase formatting, duplicate check |
| **College Details** | Spinner centered with message | *"No Academic Programs Added"* with CTA | Rose alert banner + `Retry` button | Handled via API |
| **Coordinator Manager** | Spinner centered with message | *"No Eligible Personnel Found"* with HR affiliation explanation | Rose alert banner + `Retry` button | Live search query filter |
| **Manage Programs Modal** | Spinner for eligible programs | *"No active HR affiliations found"* | Rose alert banner inside modal | Checkbox multi-select, other coordinator warning |

---

### 20. Duplicate Action Inventory

| Label | Page / Component | Action | Service / API Target | Redundant / Status | Notes |
|---|---|---|---|---|---|
| `Create College` | `OSADAcademicProgramsPage` | Opens `CreateCollegeModal` | `apiCreateCollege` | **CANONICAL** | Primary creation entry |
| `Create Academic Program` | `OSADAcademicProgramsPage` | Opens `CreateProgramModal` (global) | `apiCreateAcademicProgram` | **CANONICAL** | Global creation entry |
| `+ Add Program` | `OSADAcademicProgramsPage` (Card) | Opens `CreateProgramModal` (scoped) | `apiCreateAcademicProgram` | **CANONICAL** | Card-scoped shortcut |
| `Add Academic Program` | `OSADCollegeDetailsView` | Opens `CreateProgramModal` (scoped) | `apiCreateAcademicProgram` | **CANONICAL** | Detail-scoped entry |
| `Manage Program Coordinators` | `OSADCollegeDetailsView` Header | Navigates to `OSADCoordinatorManagerView` | `fetchCoordinatorPersonnel` | **CANONICAL** | Primary coverage entry |
| `Manage Coordinators` | `OSADCollegeDetailsView` Table | Navigates to `OSADCoordinatorManagerView` | `fetchCoordinatorPersonnel` | **DUPLICATE ENTRY** | Secondary button in section header |
| `Assign` / `Reassign` | `OSADCollegeDetailsView` Row | Navigates to `OSADCoordinatorManagerView` | `fetchCoordinatorPersonnel` | **DUPLICATE ENTRY** | Row-level shortcut to manager view |
| `Manage Programs` | `OSADCoordinatorManagerView` Row | Opens `ManagePersonnelProgramsModal` | `updatePersonnelCoordinatorAssignments` | **CANONICAL** | Authoritative multi-program assignment editor |
| `PersonnelSelectorModal` | `OSADDashboardPage` (Root) | Opens legacy single personnel selector | In-memory mock | **LEGACY / ORPHANED** | Replaced by `OSADCoordinatorManagerView`; not wired to live API |

---

### 21. Conflicting Workflow Analysis

1. **`CollegeController` vs `PersonnelRoleController`**:
   - `CollegeController` provides the atomic, personnel-first, diff-based multi-program assignment API (`PUT /osad/colleges/{id}/coordinator-personnel/{profileId}`).
   - `PersonnelRoleController` provides a legacy single-assignment POST/DELETE API (`POST /personnel/{id}/roles`).
   - *Status*: **NO ACTIVE RUNTIME CONFLICT** because the OSAD UI exclusively calls `CollegeController` through `collegeAdminService.js`. However, `PersonnelRoleController` represents an older single-item route.
2. **`OSADCollegeDetailsView` row buttons**:
   - The row button previously routed to `PersonnelSelectorModal`, but has been aligned to open `OSADCoordinatorManagerView`.
3. **In-Memory `AcademicStructureController.js`**:
   - Contains mock arrays and assignment methods used only in unit/storybook tests, safely bypassed when live API clients are invoked.

---

### 22. Source-of-Truth Matrix

| Business Fact | Source of Truth | Supporting Code / Table |
|---|---|---|
| **Academic Program Master Data** | `academic_programs` table | `CollegeService::createProgram`, `academic_programs` table |
| **Program Parent College** | `academic_programs.college_id` FK | `academic_programs.college_id` -> `colleges.id` |
| **Coordinator Candidate Eligibility** | `personnel_program_affiliations` table | `personnel_program_affiliations` join `academic_programs` |
| **Coordinator Identity** | `profiles` & `personnel_profiles` tables | `profiles.id` -> `program_coordinator_assignments.personnel_profile_id` |
| **Coordinator Role Authority** | `AuthenticatedActorService` & `program_coordinator_assignments` | `AuthenticatedActorService::resolveActor` |
| **Active Coordinator Coverage** | `program_coordinator_assignments` (`is_active = 1`) | `program_coordinator_assignments.active_program_coord_guard` |
| **Assignment History & Tenure** | `program_coordinator_assignments` (`is_active = 0`) | `program_coordinator_assignments.effective_from` & `effective_until` |

---

### 23. Current Assignment Cardinality Summary

| Relationship | Current Support | Evidence |
|---|---|---|
| **One coordinator -> one program** | **YES** | Standard assignment row in `program_coordinator_assignments`. |
| **One coordinator -> multiple programs** | **YES** | Supported via `CollegeService::updatePersonnelCoordinatorAssignments` (multiple active rows for same `personnel_profile_id`). |
| **Multiple coordinators -> one program** | **NO** | Strictly prohibited by DB unique constraint `uq_active_program_coordinator`. |
| **Program without coordinator** | **YES** | Supported; program exists with zero active rows in `program_coordinator_assignments`. |
| **Coordinator replacement** | **YES** | Supported via atomic diff; deactivates previous assignment and activates new one. |
| **Historical assignment preserved** | **YES** | `is_active = 0` and `effective_until = CURRENT_DATE` set on deactivation; rows are never deleted. |

---

### 24. Findings Classification

1. **Academic Program Master Data Decoupling**: **`PASS`**
   - Academic Programs do not store coordinator foreign keys directly; program creation does not require a coordinator.
2. **Database Active Uniqueness & Safety**: **`PASS`**
   - Virtual generated column `active_program_coord_guard` with unique constraint `uq_active_program_coordinator` ensures database-level integrity.
3. **Historical Data Retention**: **`PASS`**
   - Soft deactivation preserves full timeline, assigner, and tenure history.
4. **Personnel Eligibility Governance**: **`PASS`**
   - Requires active profile and HR affiliation (`personnel_program_affiliations`).
5. **Server-Side Authorization**: **`PASS`**
   - Enforced by `CollegeController` and `GovernancePolicy` (OSAD admin only).
6. **Edit Program UI/API Absence**: **`CURRENT LIMITATION`**
   - Currently no UI modal or backend route exists to edit an existing program's name/code or archive status.
7. **Legacy Single-Assignment Route**: **`DUPLICATE WORKFLOW`**
   - `PersonnelRoleController::assign` accepts `role_key = 'program_coordinator'`, which is redundant with the canonical `CollegeController::updatePersonnelCoordinatorAssignments`.
8. **Orphaned `PersonnelSelectorModal` in Dashboard**: **`UX INEFFICIENCY`**
   - `OSADDashboardPage` retains references to `PersonnelSelectorModal` which is no longer used by the active College details flow.

---

### 25. Phase 1 Exit Decision

All 26 audit steps have been completed with direct code, schema, and route evidence. The current-state architecture has been fully traced and verified end-to-end without mutating any code, routes, or database records.

**DECISION: GO FOR PHASE 2 — WORKFLOW & INFORMATION ARCHITECTURE REDESIGN**
