# Phase 13 — Target File Organization Review

## Status
`PASS / COMPLETED`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `ba4191ba17fd1d8f6e2b8bd7224153cd8b883641`
- **Reconciliation Baseline HEAD:** `e4422ce284f5173e2c7f20bbaed617917cd3a407`
- **Working tree:** Clean (only pre-existing untracked `STARTUP_COMMANDS.md` present)

---

## Organization Principles
1. **Domain & Role Ownership:** Components, views, controllers, and models should reside in directories that clearly reflect their domain and governance ownership.
2. **Shared Component Integrity:** Common primitives and reusable components used across multiple roles must not live buried under a single role directory.
3. **Framework Conventions:** Standard CodeIgniter 4 backend structure (`Controllers`, `Services`, `Models`, `Commands`, `Database`, `Config`) and React conventions are preserved without artificial re-architecting.
4. **Separation of Concerns:** Runtime source code, test suites, operational runbooks, phase audit evidence, historical reports, generated caches, and database backups are kept strictly segregated.
5. **No Pointless Churn:** Files identified for removal in Phase 12 are not scheduled for intermediate moves; they are scheduled directly for deletion/untracking.
6. **Naming Deferral:** Any organization change requiring terminology modernization is deferred to Phase 13A.

---

## Current Repository Structure
The repository contains 1,842 tracked files spanning:
- **Root Level:** 12 files including 7 historical milestone reports, 1 root database snapshot, 1 architecture specification, configuration manifests, and 1 untracked operational runbook.
- **Frontend Source (`frontend/src/`):** 286 files organized into `assets`, `components`, `config`, `context`, `controllers`, `hooks`, `models`, `pages`, `security`, `services`, `styles`, `test`, and `utils`.
- **Backend Source (`backend/app/`):** CodeIgniter 4 framework application with 12 HTTP controllers, 11 service engines, 18 models, 10 CLI commands, 26 database migrations, and 15 seeds.
- **Backend Scripts & Dev Tooling:** `backend/scripts/` (9 active scripts) and `backend/development/` (8 active scripts, 1 duplicate script, 1,108 tracked generated `node_modules` files).
- **Generated Dependencies:** 1,108 files in `backend/development/node_modules/` and 15 files in `node_modules/.vite/deps/`.
- **Documentation (`docs/`):** Authoritative audit reports in `docs/audit/` for Phases 0 through 12.

---

## Target Repository Structure
Following Phase 14 cleanup:
- **Root Level:** Clean configuration files only (`package.json`, `package-lock.json`, `vitest.config.js`, `vite.config.js`, `README.md`, `LICENSE`).
- **Archive (`archive/database/`):** Relocated root database snapshot `AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` governed by `REPOSITORY-LOCAL-UNTRACKED-ARCHIVE` policy.
- **Documentation (`docs/`):** Clear folder segregation:
  - `docs/audit/`: Authoritative audit trail (Phases 0–13).
  - `docs/runbooks/`: Operational runbooks (`STARTUP_COMMANDS.md`).
  - `docs/reports/`: Historical milestone validation reports (Phases 4–8).
  - `docs/history/`: Historical pre-execution code reviews (Phase 2).
  - `docs/architecture/`: Product workflows and roadmap specifications (`USER_WORKFLOW_AND_IMPROVEMENTS.md`).
- **Frontend Source (`frontend/src/`):** Clean domain-owned tree without dead components, with true shared primitives in `components/common/`, design system tokens in `components/ui/`, and role views in `pages/auth`, `pages/student`, `pages/personnel`, `pages/hr-admin`, and `pages/osad-admin`.
- **Backend Source (`backend/`):** Preserved CodeIgniter 4 framework layout with development dependencies untracked and dead duplicate scripts removed.

---

## Frontend Organization Findings
1. **Role-Specific Page Protection:** All active pages under `pages/student/`, `pages/personnel/`, `pages/hr-admin/`, `pages/osad-admin/`, and `pages/auth/` have verified route reachability and role-specific state management. They remain strictly protected under their respective role directories (`KEEP-IN-PLACE`).
2. **Models Organization:** `AcademicStructureModel.js` is a confirmed Phase 12 removal candidate (`REMOVE-FIRST-THEN-REEVALUATE`). The remaining models (`CollegeModel.js`, `DegreeProgramModel.js`, `StudentModel.js`, `UserModel.js`, etc.) remain in `frontend/src/models/` (`KEEP-IN-PLACE`).
3. **Controllers & Services:** Active frontend controllers (`RouteAccessController.js`, `AuthController.js`, etc.) and API client services remain centralized in `frontend/src/controllers/` and `frontend/src/services/` (`KEEP-IN-PLACE`).
4. **Common Directory:** `frontend/src/components/common/` houses universal authentication guards and widgets (`ActiveRoleGuard.jsx`, `AdminOnboardingGuideWidget.jsx`, `NotificationPopover.jsx`, `RouteLoadingFallback.jsx`, `SessionTimeoutModal.jsx`). Superseded `ProtectedRoute.jsx` will be removed in Phase 14 (`REMOVE-FIRST-THEN-REEVALUATE`).
5. **Modal Placement:** All 30 modals across the application have verified single-domain ownership (e.g. Student modals, Personnel modals, HR Admin modals, OSAD Admin modals) except for the scope-removed barcode modal. No unnecessary moves to `common/` are warranted.

---

## Shared Component Findings
- **Digital Barcode ID Card (`DigitalBarcodeIDCardModal.jsx`):** Previously evaluated as a shared component candidate across Student and Personnel dashboards (Phase 11). Cancelled due to product-level scope removal (Phase 12).
- **ExportPortfolioPreviewModal:** Imported by `StudentPortfolioPage.jsx` (active) and `PersonnelPortfolioPage.jsx` (unused import). The component is student-specific; `PersonnelPortfolioPage.jsx` utilizes `PersonnelPortfolioBookletModal.jsx`. The unused import will be cleaned up in Phase 14, and `ExportPortfolioPreviewModal.jsx` remains in `frontend/src/pages/student/modals/` (`KEEP-IN-PLACE`).
- **Design System Primitives:** All universal UI components reside cleanly in `frontend/src/components/ui/` (`KEEP-IN-PLACE`).

---

## Digital Barcode ID Card
- **Current location:** `frontend/src/pages/student/modals/DigitalBarcodeIDCardModal.jsx`
- **Target location:** `N/A — remove in Phase 14`
- **Status:** `INTENTIONAL-REMOVAL-NO-MOVE`
- **Phase 14 Action:** `INTENTIONAL-FEATURE-REMOVAL` (Remove imports/triggers from `StudentDashboardPage.jsx` and `PersonnelDashboardPage.jsx`, delete component file).
- **Phase 15 Validation:** Execute Vitest suite and verify Student and Personnel dashboards render cleanly.

---

## Superseded / Dead-Code Folder Impact
Phase 12 identified 22 high-confidence removal candidates. After Phase 14 removes these files, the following subdirectories will naturally become empty and disappear:
1. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/portfolio/` (Empty after DCE-FE-001, DCE-FE-003 removal).
2. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/` (Empty after DCE-FE-004 to DCE-FE-008 removal).
3. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/` (Empty after DCE-FE-002 removal).
4. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/` (Entire legacy evaluation view tree retired).
5. `frontend/src/pages/personnel/program-coordinator/tabs/` (Empty after DCE-FE-017 removal).
6. `frontend/src/pages/personnel/department-secretary/` (Legacy empty folder; terminology reviewed in Phase 13A, retired in Phase 14).

All 22 dead code candidates are assigned `REMOVE-FIRST-THEN-REEVALUATE`. None are assigned relocation actions.

---

## Backend Organization Findings
- **CodeIgniter 4 Protection:** `backend/app/Controllers`, `backend/app/Services`, `backend/app/Models`, `backend/app/Commands`, `backend/app/Database`, `backend/app/Config`, and `backend/app/Filters` strictly conform to framework conventions and are classified as `FRAMEWORK-KEEP-IN-PLACE`.
- **Database Defense:** `backend/database/mysql-defense/` houses the local MySQL schema defense lineage and remains `KEEP-IN-PLACE`.
- **Backend Development Folder (`backend/development/`):**
  - `verify-admin-bootstrap-full.mjs`: Duplicate script classified as `REMOVE-FIRST-THEN-REEVALUATE` (Phase 14 removal).
  - `node_modules/`: 1,108 tracked generated dependency files classified as `GENERATED-UNTRACK-CANDIDATE` (Phase 14 untrack).
  - Remaining provisioning scripts (`bootstrap-admin-authority.mjs`, `provision-personnel-demo.mjs`, etc.): Retained for local development setup (`KEEP-IN-PLACE`).

---

## Script Organization
- **Operational Scripts (`backend/scripts/`):** Test runners, schema validators, offline defense verifiers, and smoke testers are correctly located in `backend/scripts/` (`KEEP-IN-PLACE`).
- **Canonical Historical Script:** `backend/scripts/verify-admin-bootstrap-full.mjs` is preserved as an institutional reference script (`KEEP-IN-PLACE` / `HISTORICAL-RETAIN`).

---

## Documentation Organization
- **Audit Directory (`docs/audit/`):** Contains all phase audit artifacts (Phases 0 through 13). Classified as `FRAMEWORK-KEEP-IN-PLACE`.
- **Runbooks Directory (`docs/runbooks/`):** Target destination for operational runbooks (`RUNBOOK-RELOCATION-CANDIDATE`).
- **Reports Directory (`docs/reports/`):** Target destination for historical milestone build and test reconciliation reports (`HISTORICAL-ARCHIVE-CANDIDATE`).
- **History Directory (`docs/history/`):** Target destination for historical migration code reviews (`HISTORICAL-ARCHIVE-CANDIDATE`).
- **Architecture Directory (`docs/architecture/`):** Target destination for product workflows and technical roadmap specifications (`MOVE-CANDIDATE`).

---

## Root-Level Artifact Organization
7 historical milestone reports located in the repository root are designated for relocation in Phase 14:
1. `AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md` → `docs/history/`
2. `AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md` → `docs/reports/`
3. `AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md` → `docs/reports/`
4. `AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md` → `docs/reports/`
5. `AchieveNest_Phase_7_Test_Reconciliation_Report.md` → `docs/reports/`
6. `AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md` → `docs/reports/`
7. `AchieveNest_Phase_8_E2E_Test_Matrix.md` → `docs/reports/`

---

## Generated Dependency Organization
Two tracked generated dependency locations bloating the repository by 27.29 MB are designated for untracking (`git rm -r --cached`) in Phase 14:
1. `backend/development/node_modules/` (1,108 tracked files, 20.47 MB) → `GENERATED-UNTRACK-CANDIDATE`
2. `node_modules/.vite/deps/` (15 tracked files, 6.82 MB) → `GENERATED-UNTRACK-CANDIDATE`

---

## Backup / Dump Organization
- **Root Snapshot:** `AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` (579 KB) is designated for relocation to `archive/database/` with `REPOSITORY-LOCAL-UNTRACKED-ARCHIVE` governance (untracked from git index) in Phase 14 (`BACKUP-RELOCATION-CANDIDATE`).
- **Runtime Backups:** `backend/writable/backups/` contains local automated defense snapshots and is properly ignored from version control (`FRAMEWORK-KEEP-IN-PLACE`).

---

## STARTUP_COMMANDS.md
- **Current Status:** Untracked operational runbook in repository root.
- **Target Location:** `docs/runbooks/STARTUP_COMMANDS.md`
- **Classification:** `RUNBOOK-RELOCATION-CANDIDATE`
- **Phase 14 Action:** Add and track under `docs/runbooks/STARTUP_COMMANDS.md`.

---

## Framework-Protected Locations
The following core locations are strictly protected from relocation or structural alterations:
- `backend/app/Controllers/`
- `backend/app/Services/`
- `backend/app/Services/Policies/`
- `backend/app/Models/`
- `backend/app/Commands/`
- `backend/app/Database/Migrations/`
- `backend/app/Database/Seeds/`
- `backend/app/Config/`
- `backend/app/Filters/`
- `backend/writable/backups/`
- `.htaccess` & `index.html` directory isolation stubs
- `docs/audit/`

---

## Phase 13A Naming Dependencies
The following naming and terminology reviews are deferred to Phase 13A:
1. `department-secretary` / `depsec` terminology across legacy folders and routes.
2. `NDMURatingPane` / `NDMU` scoring nomenclature in historical components vs Studio.
3. `Potential Awardees` vs `Award Candidates` terminology in OSAD components.

---

## Phase 13 Reconciliation Addendum Summary

### 1. Count Model Resolution
- **Model Applied:** Model A (Single primary classification per row).
- **Unique Organization-Map Data Rows:** 41 rows.
- **Primary Classification Total:** 41 (100% mathematical match).
- **Secondary Classification Occurrences:** 10 (Overlapping root clutter / move candidate concerns).
- **Total Classification Occurrences:** 51.

### 2. Historical Report Destination Reconciliation
All 7 root milestone reports are explicitly mapped:
- `AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md` → `docs/history/` (Pre-execution review)
- `AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md` → `docs/reports/` (Validation report)
- `AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md` → `docs/reports/` (Validation report)
- `AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md` → `docs/reports/` (Validation report)
- `AchieveNest_Phase_7_Test_Reconciliation_Report.md` → `docs/reports/` (Validation report)
- `AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md` → `docs/reports/` (Validation report)
- `AchieveNest_Phase_8_E2E_Test_Matrix.md` → `docs/reports/` (Test matrix spec)

Phase 3 historical findings are authoritatively documented in `docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md`.

### 3. Database Dump Governance Policy
`AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` is assigned **`REPOSITORY-LOCAL-UNTRACKED-ARCHIVE`**:
- Target path: `archive/database/AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump`
- Git tracking status: `UNTRACKED / IGNORED` (untrack from git index via `git rm --cached` in Phase 14).

---

## Phase 14 Move / Remove / Untrack Plan
- **MOVE (Docs & Spec):** 8 files (7 root historical reports to `docs/reports/` and `docs/history/`, 1 architecture spec to `docs/architecture/`).
- **RUNBOOK-MOVE / TRACK:** 1 file (`STARTUP_COMMANDS.md` to `docs/runbooks/`).
- **ARCHIVE / UNTRACK (DB Dump):** 1 file (`AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` to `archive/database/` with untracked status).
- **REMOVE (Dead Code):** 22 files (21 superseded frontend components/models/pages, 1 duplicate backend script).
- **INTENTIONAL-FEATURE-REMOVAL:** 1 file (`DigitalBarcodeIDCardModal.jsx` + 2 dashboard callers).
- **UNTRACK (Generated Deps):** 2 dependency/cache directories (1,123 files in `backend/development/node_modules/` and `node_modules/.vite/deps/`).
- **FOLDER-RETIREMENT (Structural):** 6 subdirectories naturally retired post-removal.
- **REVIEW FIRST:** 1 legacy folder (`department-secretary/`).

---

## Phase 15 Validation Mapping
1. **Frontend Build & Test Suite:** Execute `npm test` (190 passing Vitest assertions) and `npm run build`.
2. **Backend Regression:** Run PHPUnit test suites and verify CodeIgniter 4 routes.
3. **Dashboard Smoke Tests:** Verify Student, Personnel, HR Admin, and OSAD Admin dashboards render cleanly.
4. **Git Tree Validation:** Confirm repository cleanliness, absence of tracked `node_modules` or `.dump` files, and intact `docs/` hierarchy.

---

## Audit Artifacts
- **Target Organization Map CSV:** `docs/audit/PHASE_13_TARGET_ORGANIZATION_MAP.csv` (41 records across 23 columns)
- **Move Review Candidates CSV:** `docs/audit/PHASE_13_MOVE_REVIEW_CANDIDATES.csv` (15 records across 15 columns)
- **Target Repository Tree Specification:** `docs/audit/PHASE_13_TARGET_REPOSITORY_TREE.md`
- **Organization Reconciliation Addendum:** `docs/audit/PHASE_13_ORGANIZATION_RECONCILIATION_ADDENDUM.md`
- **Audit Narrative Report:** `docs/audit/PHASE_13_TARGET_FILE_ORGANIZATION_REVIEW.md`

---

## Reconciled Primary Organization Classification Counts
- **KEEP-IN-PLACE:** 6
- **MOVE-CANDIDATE:** 1
- **SHARED-COMPONENT-CANDIDATE:** 0
- **HISTORICAL-ARCHIVE-CANDIDATE:** 7
- **RUNBOOK-RELOCATION-CANDIDATE:** 1
- **GENERATED-UNTRACK-CANDIDATE:** 2
- **BACKUP-RELOCATION-CANDIDATE:** 1
- **ROOT-CLUTTER-CANDIDATE:** 0
- **FRAMEWORK-KEEP-IN-PLACE:** 6
- **REMOVE-FIRST-THEN-REEVALUATE:** 15
- **INTENTIONAL-REMOVAL-NO-MOVE:** 1
- **NAMING-REVIEW-PHASE13A:** 1
- **REVIEW REQUIRED:** 0
- **TOTAL:** **41**

---

## Files Changed
Audit documentation only:
- `docs/audit/PHASE_13_TARGET_FILE_ORGANIZATION_REVIEW.md`
- `docs/audit/PHASE_13_TARGET_ORGANIZATION_MAP.csv`
- `docs/audit/PHASE_13_MOVE_REVIEW_CANDIDATES.csv`
- `docs/audit/PHASE_13_TARGET_REPOSITORY_TREE.md`
- `docs/audit/PHASE_13_ORGANIZATION_RECONCILIATION_ADDENDUM.md`

---

## Limitations
- None. Complete reconciliation of counts, historical reports, database dump governance, and target hierarchy achieved.

---

## Verdict
`PASS / COMPLETED`

---

## Safety Confirmation
No source file, component, script, documentation artifact, backup, dump, generated dependency, route, schema, API, UI, auth, or business logic was moved, renamed, deleted, merged, untracked, archived, or refactored during the Phase 13 reconciliation.
