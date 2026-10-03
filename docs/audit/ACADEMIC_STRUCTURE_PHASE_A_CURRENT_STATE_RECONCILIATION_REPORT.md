# Phase A — Current-State Reconciliation Result

> **Executive Scope:** Establishes the exact current-state baseline of the Academic Structure domain (Colleges, Academic Programs, Program Coordinators, Deans, and HR Affiliations) across the database, backend APIs, and frontend interfaces following Phase G closure.

---

## 1. Repository Freeze

```text
Branch:             audit/project-architecture-linkage
HEAD:               ea987bf32c208cc99ebe1a60b989c0c09ca83e98
HEAD message:       docs(audit): close osad refinement regression and replay
Working tree state: Modified: frontend/src/pages/osad-admin/OSADDashboardPage.jsx (isolated fix for runtime ReferenceError 'orgConfirmClose')
Remote:             origin https://github.com/Astherisk1229/AchieveNest.git (fetch & push)
Ahead/behind:       Aligned with local audit tracking branch
```

---

## 2. Runtime Baseline

```text
Node.js:            v24.13.1
npm:                11.8.0
PHP:                8.2.29 (cli) (ZTS Visual C++ 2019 x64 with OPcache & Xdebug v3.4.7)
MySQL:              8.4.7 (MySQL Community Server - GPL x86_64)
Database:           achievenest_local (Port 3306)
WAMP Services:      wampapache64 (Running), wampmysqld64 (Running, PID 1920 on :3306), wampmariadb64 (Running)
```

---

## 3. Database Artifact Inventory

```text
Canonical table count:          58 tables (57 business/domain tables + 1 CodeIgniter migrations metadata table)
CodeIgniter migration count:    27 migration files
Highest CodeIgniter migration:  2026-08-30-000028_AddOrganizationLogoMetadata.php
Seeder count:                   5 seeders (DefenseDemoPersonaSeeder, DefenseDemoScenarioSeeder, DefenseDemoSeeder, DemoAcademicStructureSeeder, LocalDefenseAuthSeeder)
MySQL defense replay count:     12 SQL replay files
Highest MySQL replay file:      000012_organization_logo_metadata.sql
Applied migration state:        Baseline fully provisioned via canonical MySQL replay suite
```

---

## 4. College Schema

Authoritative Table: **`colleges`**

```sql
CREATE TABLE `colleges` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `ck_colleges_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 4.1 Column & Constraint Evidence Table

| Field | Type | Nullable | Default | Key / Constraint | Business Meaning |
|---|---|---:|---|---|---|
| `id` | `char(36)` | NO | `NULL` | PRIMARY KEY | Canonical UUID for College entity |
| `code` | `varchar(20)` | NO | `NULL` | UNIQUE (`code`) | Institutional acronym / code (e.g. `CET`, `CBA`, `CAS`) |
| `name` | `varchar(150)` | NO | `NULL` | None | Official institutional College name |
| `description` | `text` | YES | `NULL` | None | Descriptive summary of College scope |
| `status` | `varchar(20)` | NO | `'active'` | CHECK (`status` IN ('active','inactive')) | Operational lifecycle status |
| `created_at` | `datetime(6)` | NO | `CURRENT_TIMESTAMP(6)` | None | Audit timestamp |
| `updated_at` | `datetime(6)` | NO | `CURRENT_TIMESTAMP(6)` | Auto-updating | Audit timestamp |

### 4.2 College Branding Fields Status

- `logo_storage_key`: **NO** (Absent)
- `logo_original_name`: **NO** (Absent)
- `logo_mime_type`: **NO** (Absent)
- `logo_updated_at`: **NO** (Absent)
- `acronym_badge_color`: **NO** (Absent)
- `acronym_font_color`: **NO** (Absent)

---

## 5. College Data Snapshot

| College ID | Code | Name | Description | Status |
|---|---|---|---|---|
| `20000000-0000-0000-0000-000000000001` | **CET** | College of Engineering and Technology | Engineering, Computing, and Architecture Disciplines | `active` |
| `20000000-0000-0000-0000-000000000002` | **CBA** | College of Business and Accountancy | Business, Management, and Accountancy Programs | `active` |
| `20000000-0000-0000-0000-000000000003` | **CAS** | College of Arts and Sciences | Liberal Arts, Social Sciences, and Natural Sciences | `active` |
| `20000000-0000-0000-0000-000000000004` | **CTE** | College of Teacher Education | Teacher Education and Pedagogical Formation | `active` |
| `20000000-0000-0000-0000-000000000005` | **CHS** | College of Health Sciences | Nursing and Allied Health Professions | `active` |

```text
Total College count:            5
Active College count:           5
College codes:                  CET, CBA, CAS, CTE, CHS
Duplicate code conflicts:       0 (Enforced by UNIQUE constraint on code)
```

---

## 6. Create College Current UX

- **Component Path:** `frontend/src/pages/osad-admin/modals/CreateCollegeModal.jsx`
- **Parent Page:** `frontend/src/pages/osad-admin/OSADDashboardPage.jsx` (`tab=academic-programs`)
- **Open Trigger:** "Create College" button in `OSADAcademicProgramsPage.jsx` header actions
- **Current Form Fields:**
  - `code` (Text input, label: "College Code / Acronym", placeholder: "e.g. CEAC, CBA, CAS")
  - `name` (Text input, label: "College Full Name", placeholder: "e.g. College of Engineering, Architecture & Computing")
  - `description` (Textarea, label: "Description (Optional)")
- **Validation:** Frontend validation requires non-empty `code` and `name`. Duplicate code checked in `CollegeModel.validate`.
- **Submit Handler:** `handleSubmit` calls `onSubmit({ code, name, description })` -> `useOSAD().createCollege` -> `OSADController.createCollege`.
- **Dirty-State Integration:** Employs `useConfirmableClose` and embedded `<ConfirmDialog>` with auto-reset on discard.
- **Backend API Call:** Currently operates via in-memory/client-controller data stores; direct backend REST endpoint for OSAD college creation does not yet exist.

### Required Field Inventory

| Field | Status |
|---|---|
| College Name | **PRESENT** |
| College Code/Acronym | **PRESENT** |
| Description | **PRESENT** |
| Logo | **ABSENT** |
| Badge Color / Font Color | **ABSENT** |
| Degree Level | **ABSENT** |
| Academic Program inline section | **ABSENT** |
| Dean assignment | **ABSENT** (Read-only reference in OSAD) |
| Status | **ABSENT from form** (Defaults to active) |

---

## 7. College Card / Details Current UX

- **Component Path:** `frontend/src/pages/osad-admin/OSADAcademicProgramsPage.jsx`
- **Card Rendering:** `<section className="bg-white dark:bg-[#131E2E] rounded-xl p-5 border ...">`
- **Displayed Fields:** College Code pill, College Name, Lock indicator ("Dean designated by HR"), Programs count badge, and a list of program rows.
- **Interactivity Determination:**
  - Entire College card clickable: **NO** (Rendered as non-interactive `<section>`)
  - Keyboard accessible (`tabIndex`, Enter/Space trigger): **NO**
  - Opens College Details: **NO**
  - Current click behavior: Card background is inert; only individual program "Assign / Reassign" buttons respond to clicks.
- **Existing College Details Experience:** **ABSENT** (No modal, drawer, or page exists for College Details).

---

## 8. Academic Program Schema

Authoritative Table: **`academic_programs`**

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
  CONSTRAINT `ck_academic_programs_degree_level` CHECK ((`degree_level` in (_utf8mb4'undergraduate',_utf8mb4'graduate',_utf8mb4'certificate',_utf8mb4'diploma'))),
  CONSTRAINT `ck_academic_programs_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 8.1 Schema Characteristics

- `College FK`: `college_id` -> `colleges(id)` ON DELETE RESTRICT (Indexed via `idx_academic_programs_college`)
- `Program Code`: `code` varchar(20) UNIQUE NOT NULL
- `Program Name`: `name` varchar(150) NOT NULL
- `Degree Level`: `degree_level` varchar(30) NOT NULL DEFAULT `'undergraduate'` (CHECK `undergraduate`, `graduate`, `certificate`, `diploma`)
- `Status`: `status` varchar(20) NOT NULL DEFAULT `'active'` (CHECK `active`, `inactive`, `archived`)

---

## 9. Academic Program Data Snapshot

| Program Code | Program Name | Degree Level | College Code | Status |
|---|---|---|---|---|
| **BSCE** | Bachelor of Science in Civil Engineering | undergraduate | CET | active |
| **BSCS** | Bachelor of Science in Computer Science | undergraduate | CET | active |
| **BSEE** | Bachelor of Science in Electrical Engineering | undergraduate | CET | active |
| **BSIT** | Bachelor of Science in Information Technology | undergraduate | CET | active |
| **BSA** | Bachelor of Science in Accountancy | undergraduate | CBA | active |
| **BSBA-FM** | BS Business Administration - Financial Management | undergraduate | CBA | active |
| **BSBA-MM** | BS Business Administration - Marketing Management | undergraduate | CBA | active |
| **AB-COMM** | Bachelor of Arts in Communication | undergraduate | CAS | active |
| **AB-POLSCI** | Bachelor of Arts in Political Science | undergraduate | CAS | active |
| **BS-PSYCH** | Bachelor of Science in Psychology | undergraduate | CAS | active |
| **BEED** | Bachelor of Elementary Education | undergraduate | CTE | active |
| **BSED-ENG** | Bachelor of Secondary Education - English | undergraduate | CTE | active |
| **BSED-MATH** | Bachelor of Secondary Education - Mathematics | undergraduate | CTE | active |
| **BSN** | Bachelor of Science in Nursing | undergraduate | CHS | active |

```text
Total Program count:            14
Active Program count:           14
Programs by College:            CET: 4, CBA: 3, CAS: 3, CTE: 3, CHS: 1
Duplicate code conflicts:       0 (Enforced by UNIQUE constraint on code)
```

---

## 10. Create Academic Program Current UX

- **Component Path:** `frontend/src/pages/osad-admin/modals/CreateProgramModal.jsx`
- **Parent Page:** `frontend/src/pages/osad-admin/OSADDashboardPage.jsx`
- **Current Fields:**
  - `collegeId` (Dropdown: Select Parent College)
  - `code` (Text input: Program Code, e.g. BSCS, BSCE)
  - `name` (Text input: Program Full Name / Degree Title)
  - `degreeLevel` (Dropdown: Undergraduate, Graduate, Certificate, Diploma)
- **Degree Level Determination:** **PRESENT IN CURRENT UI**
- **Context-Aware Preselection:** Default select uses `colleges[0]`. No mechanism exists currently to pass a specific `collegeId` from a College context (because College Details does not exist).
- **Dirty-State Handling:** Uses `useConfirmableClose` tracking dirty input states.

---

## 11. Program Coordinator Assignment Schema

Authoritative Table: **`program_coordinator_assignments`**

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

### 11.1 Cardinality & Constraint Evidence

1. **Can one personnel have multiple program assignments?**  
   **YES.** `idx_prog_coord_personnel` on `personnel_profile_id` is non-unique. A personnel profile can have multiple rows with `is_active = 1` for different programs.
2. **Can one program have multiple active coordinators?**  
   **NO.** Enforced strictly by `UNIQUE KEY uq_active_program_coordinator (active_program_coord_guard)`, which indexes the virtual generated column `CASE WHEN is_active = 1 THEN academic_program_id ELSE NULL END`.
3. **Does assignment have active/inactive status and history preservation?**  
   **YES.** `is_active` (0/1), `effective_from`, and `effective_until` preserve historical records when deactivated, because inactive rows yield `NULL` in the guard column.

### 11.2 Current Coordinator Assignments Data Snapshot

```text
Total assignment rows:                                  3
Active assignment rows:                                 3
Personnel with >1 active Program Coordinator assignment:0 (currently 1 program each in seed data)
Programs with >1 active Program Coordinator:            0 (prevented by schema)
Inactive / historical rows:                             0
```

---

## 12. Program Coordinator Current Backend Flow

- **Controller:** `backend/app/Controllers/Api/PersonnelRoleController.php`
- **Routes:**
  - `GET /api/v1/personnel/roles` (OSAD lists Program Coordinator & Org Moderator assignments)
  - `POST /api/v1/personnel/(:segment)/roles` (Assigns role `program_coordinator`)
  - `DELETE /api/v1/personnel/(:segment)/roles/(:segment)` (Revokes role assignment)
- **Policy Gate:** `$this->authz->governance()->canAssignCoordinator($actor)` (Strictly restricted to `osad_staff` / `osad_admin`).
- **Affiliation Gate Enforced in Backend:**
  ```php
  $eligible = $db->query(
      "SELECT 1 FROM personnel_program_affiliations
       WHERE personnel_profile_id = ? AND academic_program_id = ? AND is_active = 1",
      [$targetProfileId, $scopeId]
  )->getRowArray();
  if ($eligible === null) {
      return $this->respond(['error' => ['code' => 'INELIGIBLE_PROGRAM_AFFILIATION', 'message' => 'Personnel must have an active affiliation to the exact Academic Program.']], 422);
  }
  ```

---

## 13. Program Coordinator Current UX

- **Component Path:** `frontend/src/pages/osad-admin/modals/PersonnelSelectorModal.jsx`
- **Trigger:** Clicking "Assign / Reassign" on an individual program row in `OSADAcademicProgramsPage.jsx`.
- **Workflow / Orientation:** **Program-First** (Selects one program, pops up personnel selector list, picks a single person).
- **Primary Limitations:**
  - No personnel-first view or management screen.
  - Cannot assign one personnel member to multiple programs in a single atomic save operation.
  - No college-scoped coordinator overview or coverage status matrix.
  - Frontend personnel selector does not filter candidates by active HR affiliation before selection.

---

## 14. HR Personnel-to-Program Affiliation Source

Authoritative Table: **`personnel_program_affiliations`**

```sql
CREATE TABLE `personnel_program_affiliations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_program_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_personnel_program_personnel` (`personnel_profile_id`),
  KEY `idx_personnel_program_program` (`academic_program_id`),
  CONSTRAINT `fk_personnel_program_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_personnel_program_program` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

- **Governance Ownership:** **HR Administrator exclusively**.
- **HR Write Path:** Managed via HR Onboarding (`OnboardPersonnelModal.jsx`) and Placement Editor (`EditAssignmentModal.jsx`).
- **HR API Route:** `GET /api/v1/hr/personnel` returns active `program_affiliations` array per personnel.

---

## 15. HR -> OSAD Gate Analysis

```text
HR can create/update affiliation:               YES (Exclusive owner)
OSAD can change affiliation:                    NO (Strictly prohibited by governance boundary)
Backend independently validates affiliation:   YES (Enforced in PersonnelRoleController::assign)
Frontend filters selector by affiliation:       NO (Currently shows unfiltered personnel list — Gap identified)
```

---

## 16. Dean Assignment Source

Authoritative Table: **`dean_assignments`**

```sql
CREATE TABLE `dean_assignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_college_dean_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `college_id` else NULL end)) VIRTUAL,
  `active_personnel_dean_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `personnel_profile_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_college_dean` (`active_college_dean_guard`),
  UNIQUE KEY `uq_active_personnel_dean` (`active_personnel_dean_guard`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
```

- **Semantics:** Exactly 1 active Dean per College, and 1 active Dean role per Personnel.
- **Lookup Query for College Details:** Active Dean is queried by joining `dean_assignments da JOIN profiles p ON p.id = da.personnel_profile_id WHERE da.college_id = ? AND da.is_active = 1`.

---

## 17. Logo Storage Reuse Assessment

- **Organization Logo Pattern:** Introduced in Phase E via `OrganizationService.php` (`WRITEPATH . '/uploads/organization-logos'`).
- **File Metadata Specs:** `logo_storage_key`, `logo_original_name`, `logo_mime_type`, `logo_updated_at`.
- **MIME & Size Limits:** `image/jpeg`, `image/png`, `image/webp` (Max 5 MB).
- **Streaming Architecture:** Direct binary streaming with MIME header validation and cache headers.
- **Reuse Decision:** College logo management can directly mirror this proven architecture using `WRITEPATH . '/uploads/college-logos'` and standardized streaming endpoints (`GET /api/v1/colleges/(:segment)/logo`).

---

## 18. Color Utility Reuse Assessment

- **HEX Validation Utility:** Currently **ABSENT** in frontend.
- **WCAG Luminance / Contrast Ratio Helper:** Currently **ABSENT** in frontend.
- **Color Picker Component:** Currently **ABSENT** in frontend.
- **Determination:** Clean, centralized color contrast calculation utilities (`calculateLuminance`, `getContrastRatio`, `getAccessibleTextColor`) will be created in the appropriate phase.

---

## 19. Baseline Tests Execution

### 19.1 Frontend Tests

- **Vitest Unit & Integration Suite:** `npm test -- --run`
  - Test Files: **33 / 33 passed (100%)**
  - Total Tests: **207 / 207 passed (100%)**
  - Execution Time: 17.73s
- **Linter:** `npm run lint`
  - Errors: **0 errors** (362 style warnings)
- **Production Build:** `npm run build`
  - Status: **PASS (0 errors, 8.57s build time)**

### 19.2 Backend Tests

- **Phase 15 Master Regression Suite:** `spark test:phase15-backend`
  - Phase 7 Local Authentication & Session Registry: **PASS**
  - Phase 8 Centralized CodeIgniter Authorization Matrix: **PASS**
  - Phase 9 Protected Local Evidence Storage & Streaming: **PASS**
  - Phase 11 Permanent Reference Data & SHA-256 Fingerprint: **PASS**
  - Phase 12 Demo Personas & Scenario Fixtures: **PASS**
  - Phase 13 Step 4 Portfolio & Verification Lifecycle: **PASS**
  - Phase 14A Award Evaluation Engine & Dean Nominations: **PASS (46/46)**
  - Phase 14B HR, Personnel, Governance & Audit Workflows: **PASS (30/30)**
  - Master Regression Result: **8 / 8 Suites PASSED**

### 19.3 Seven-Persona Smoke Baseline

- Student A & B: **PASS** (Strict tenant & portfolio isolation)
- Academic & Non-Academic Personnel: **PASS** (Accomplishment & ranking submissions verified)
- HR Admin: **PASS** (Exclusive ownership of Deans and directory governance)
- OSAD Admin: **PASS** (Awards, organizations, and coordinator oversight)
- Dean: **PASS** (College-scoped evaluation oversight and cross-college nominations)
- Program Coordinator: **PASS** (Program-scoped verification queue isolation)
- Organization Moderator: **PASS** (Organization-scoped event & attendance isolation)

---

## 20. Capability Gap Matrices

### 20.1 College Capability Matrix

| Capability | Current DB | Current Backend | Current Frontend | Planned Need | Gap |
|---|---|---|---|---|---|
| College Name | `colleges.name` | Present | Present | YES | None |
| Acronym / Code | `colleges.code` | Present | Present | YES | None |
| Description | `colleges.description` | Present | Present | YES | None |
| Logo Storage Key | Absent | Absent | Absent | YES | Additive DB column & upload stream |
| Acronym Badge Color | Absent | Absent | Absent | YES | Additive DB column & color picker |
| Acronym Font Color | Absent | Absent | Absent | YES | Additive DB column or contrast helper |
| Status | `colleges.status` | Present | Present | Preserve | None |
| College Details Surface | N/A | Absent | Absent | YES | Add clickable card & details modal/drawer |
| College Update API | N/A | Absent | Absent | YES | REST update endpoint |

### 20.2 Academic Program Matrix

| Capability | Current State | Planned Need | Gap |
|---|---|---|---|
| College Relation | Foreign key `college_id` | YES | None |
| Program Code | Unique column `code` | YES | None |
| Program Name | Column `name` | YES | None |
| Degree Level | Column & UX dropdown | REMOVE FROM UX | Dropdown to be removed from College undergraduate form; DB column default preserved |
| Context-Aware College Preselection | Default first college | YES | Preselect College when adding program from College Details |
| Add from College Details | Absent | YES | Add action button inside College Details modal |

### 20.3 Coordinator Assignment Matrix

| Capability | Current State | Planned Need | Gap |
|---|---|---|---|
| Personnel coordinates multiple programs | Supported by schema (`idx_prog_coord_personnel`) | YES | None in DB schema; UX workflow needed |
| 1 active coordinator per program | Enforced by `uq_active_program_coordinator` | YES | None |
| Personnel-first assignment view | Absent (Program-first only) | YES | Add personnel-first assignment modal |
| Multi-select program assignments | Absent (Single select) | YES | Add multi-checkbox program selector |
| HR Affiliation gate validation | Enforced in backend | YES | Add frontend filtering so only affiliated programs appear |
| Diff-based atomic save | Absent | YES | Backend diff handler to activate/deactivate rows |
| Assignment history preservation | Supported by table (`is_active=0`) | YES | Ensure revoke sets `is_active=0` with timestamps |

---

## 21. Schema Change Conclusions

```text
COLLEGE BRANDING MIGRATION REQUIRED:  YES (Additive columns: logo_storage_key, logo_original_name, logo_mime_type, logo_updated_at, acronym_badge_color)
COORDINATOR SCHEMA CHANGE REQUIRED:   NO  (Existing program_coordinator_assignments table fully supports 1:N personnel-to-program active mappings)
HR AFFILIATION GATE USABLE AS-IS:     YES (personnel_program_affiliations is authoritative and already validated by backend)
```

---

## 22. Stop Conditions Checklist

| Condition | Status | Evidence |
|---|---|---|
| Initial working tree status | **PASS** | Working tree baseline frozen and clean (except runtime fix for OSAD dashboard) |
| Canonical database available | **PASS** | MySQL 8.4.7 running on port 3306 with database `achievenest_local` |
| College table identified | **PASS** | `colleges` (5 active records) |
| Academic Program table identified | **PASS** | `academic_programs` (14 active records across 5 colleges) |
| Program Coordinator assignment table identified | **PASS** | `program_coordinator_assignments` |
| HR personnel-program affiliation source identified | **PASS** | `personnel_program_affiliations` |
| Coordinator cardinality proven | **PASS** | Non-unique index on `personnel_profile_id` allows 1:N assignments; unique guard protects 1:1 program coordinator |
| Migration & replay baseline proven | **PASS** | 27 migrations, 12 replay SQL files validated |
| Baseline test suites pass | **PASS** | 207 frontend tests passed; 8/8 backend regression suites passed |
| No Department business logic regression | **PASS** | Zero active Department / Department Secretary business paths |
| Current schema conflicts | **PASS** | No blocking schema conflicts detected |

---

## 23. Final Result

```text
PHASE A: PASS — SAFE TO PROCEED TO PHASE B
```
