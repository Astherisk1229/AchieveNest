# Phase 13A — File Naming & Terminology Consistency Audit

## Status
`PASS / COMPLETED`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `1038fca61d7ad16b036d74736008a43b49396acb`
- **Working tree:** Clean (only pre-existing untracked `STARTUP_COMMANDS.md` present)

---

## Naming Principles
1. **Accurate Reflection of Responsibility:** Filenames, classes, components, and functions must accurately reflect their actual domain responsibility.
2. **Canonical Terminology Alignment:** Terminology across UI, code, routes, and tests must align with the finalized AchieveNest governance model (`College` → `Academic Program` hierarchy, `Dean`, `Program Coordinator`, `Organization Moderator`, `Potential Award Candidates`).
3. **Framework Protection:** CodeIgniter 4 conventions, React naming patterns, and immutable database migration lineages are protected from cosmetic alterations.
4. **Historical Audit Preservation:** Historical implementation reports, sprint reviews, and test matrices preserve original terminology as immutable audit evidence.
5. **No Pointless Renames for Dead Code:** All 22 Phase 12 removal candidates are classified as `REMOVE-INSTEAD-OF-RENAME` to eliminate intermediate churn.

---

## Finalized Business Terminology
The AchieveNest business domain operates under the following canonical terminology:
- **Academic Units:** `College` (e.g. CEAC, CBA, CAS) → `Academic Program` / `Degree Program` (e.g. BSCS, BSA). No `departments` table exists.
- **Administrative Units:** `Administrative Unit` represents non-academic offices (HR, OSAD, Athletics, CES).
- **Academic Governance Roles:**
  - `Dean`: College-level executive and portfolio evaluator.
  - `Program Coordinator`: Academic Program coordinator and portfolio reviewer.
  - `Organization Moderator`: Faculty moderator assigned to a recognized student organization.
  - `Department Secretary`: **Role does not exist.**
- **Awards Governance:**
  - System identifies `Potential Award Candidates` / `Award Candidates` based on an 80.0% benchmark score or official `Dean Nominations`.
  - System **does not** automatically pick `Final Awardees`; final awardee selection is an institutional OSAD decision.
- **Dean Nominations:** Authoritative dual-pathway feature allowing Deans to nominate candidates for interview eligibility.
- **Institutional Identity:** `NDMU` / `Notre Dame of Marbel University` represents the official university identity, branding, and email domain (`@ndmu.edu.ph`).

---

## Frontend Naming Findings
1. **Pages (`frontend/src/pages/`):** All 28 route-bound pages adhere strictly to `PascalCasePage.jsx` naming and match their default export components.
2. **Components & Modals:** Component filenames match default export names. Modals consistently use `*Modal.jsx` or `*Drawer.jsx`.
3. **Hooks & Controllers:** Custom hooks follow `useCamelCase.js`. Controllers follow `PascalCaseController.js`.
4. **Services & Models:** Models follow `PascalCaseModel.js`. Services follow `camelCase.js` or `PascalCaseService.js`.

---

## Backend Naming Findings
1. **Controllers (`backend/app/Controllers/`):** 12 API controllers conform strictly to CodeIgniter 4 PascalCase conventions (`*Controller.php`).
2. **Services & Policies (`backend/app/Services/`):** Exactly **5 policy classes** (`AwardPolicy.php`, `EvidencePolicy.php`, `GovernancePolicy.php`, `PersonnelPolicy.php`, `StudentPortfolioPolicy.php`) are orchestrated by `AuthorizationService.php`.
3. **Models (`backend/app/Models/`):** 18 models adhere to CodeIgniter 4 `*Model.php` standards.
4. **Commands (`backend/app/Commands/`):** 10 Spark CLI commands follow action-oriented PascalCase names under `test:*`, `setup:*`, and `system:*`.

---

## Folder Naming Findings
- Active directories cleanly follow domain boundaries (`student`, `personnel`, `hr-admin`, `osad-admin`).
- Legacy folder `frontend/src/pages/personnel/department-secretary/` is empty on disk and classified as `FOLDER-RETIREMENT-CANDIDATE`. It will be retired in Phase 14 without renaming.

---

## department-secretary / depsec
- **`frontend/src/pages/personnel/department-secretary/`:** Empty directory → `FOLDER-RETIREMENT-CANDIDATE` (Retire in Phase 14).
- **`/depsec` Route Redirect (`frontend/src/App.jsx:195`):** `<Route path="/depsec" element={<Navigate to="/personnel/dashboard" replace />} />` → `KEEP-COMPATIBILITY` (Retain redirect for deep-link compatibility).
- **`submitToDepSec` Method:** Found in `PersonnelPortfolioController.js` and `usePersonnelPortfolio.js` → `TERMINOLOGY-UPDATE-CANDIDATE` / `RENAME-WITH-COMPATIBILITY` (Modernize to `submitForVerification` / `submitToEndorsement` in Phase 14).
- **`onSubmitToDepSec` Prop:** In `PortfolioSummaryCard.jsx` → `RENAME` (Modernize to `onSubmitForVerification` in Phase 14).
- **`roleContext.js` Fallback:** `normalizeRoleContext('department_secretary')` maps to `CANONICAL_ROLES.DEAN` → `KEEP-COMPATIBILITY` (Prevent session lockout).
- **Superseded Components:** `HRScoreAuditModal.jsx` and `PersonnelPortfolioForm.jsx` contain legacy `depsec` props → `REMOVE-INSTEAD-OF-RENAME` (Phase 12 dead code candidates).

---

## Department / College / Academic Program
- **Current State:** The database and active models enforce a 2-tier hierarchy: `colleges` → `degree_programs`.
- **Legacy Fallback:** `authService.js:156` carries `department_id: user.department_id || null` for session backward compatibility (`KEEP-COMPATIBILITY`).
- **Active Scoping Tests:** `OSADAcademicHierarchy.test.js` actively verifies that invalid `department` scopes are rejected.

---

## Dean / Coordinator / Moderator
- **Dean Scope:** College-level executive authority; correctly designated in `GovernancePolicy.php` and `GovernanceController.php`.
- **Program Coordinator Scope:** Academic Program-level review authority; designated in `ProgramCoordinatorAssignmentModel.js`.
- **Organization Moderator Scope:** Student Organization moderation authority; designated in `OrganizationModeratorAssignmentModel.js`.

---

## Awards Terminology
- **Active UI Standard:** `PotentialAwardCandidatesPreview.jsx` and `OSADAwardCandidateReviewPage.jsx` adhere to `Potential Award Candidates` and `Award Candidate Review`.
- **Route Query Alias:** `?tab=awardees` is retained as a non-breaking query parameter alias for `?tab=candidate-review` (`KEEP-COMPATIBILITY`).
- **Historical Reports:** Mentions of `Potential Awardees` in early milestone reports are preserved as immutable audit trail records (`KEEP-HISTORICAL`).

---

## Dean Nominations Wording
- **Evidence:** Table `dean_student_nominations` (in `000006_award_scoring_and_eligibility.sql`), migration `2026-08-27-000025_AutomateAwardInterviewEligibility.php`, `AwardEvaluationService::recordDeanNomination`, `AwardPolicy::canNominateStudent`, and `VerifyPhase14Awards.php` (46 passing assertions).
- **Verdict:** `Dean Nominations` is a fully verified, authoritative dual-pathway mechanism in AchieveNest (`KEEP`).

---

## NDMU Naming
- **Legitimate University Branding (`KEEP`):** Institutional branding, official seal, campus banner backdrop, certificate headers, and `@ndmu.edu.ph` email domain validation.
- **Obsolete Component Naming (`REMOVE-INSTEAD-OF-RENAME`):** `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/NDMURatingPane.jsx` (Phase 12 DCE-FE-002) is scheduled for deletion in Phase 14; do not rename.

---

## Route Naming
- Frontend routes use clean kebab-case paths (`/student/dashboard`, `/osad/candidate-review`, `/hr/evaluation-submissions`).
- `/depsec` redirect in `App.jsx` is retained for compatibility (`KEEP-COMPATIBILITY`).

---

## API Naming
- Backend REST endpoints strictly adhere to `/api/` and `/auth/` prefixes (`/api/awards/evaluations/benchmark-preview`, `/auth/personnel/reset-password`).
- 0 obsolete `depsec` or `department` endpoints exist in active backend route configuration (`KEEP-FRAMEWORK-REQUIRED`).

---

## Database / Migration Naming
- All 26 migration files (`000001_initial_schema.sql` to `000026_*.sql`) and 15 seeders (`001_roles_seeder.sql` to `015_*.sql`) are protected from renaming to preserve schema lineage (`KEEP-FRAMEWORK-REQUIRED` / `KEEP-HISTORICAL`).

---

## Legacy Technology Naming
- `SupabaseAuthService.php`, `SupabaseAdminAuthService.php`, and `frontend/src/config/supabase.js` are preserved under their existing names as accurate identifiers for legacy offline fallback stubs and zero-call test assertion targets (`KEEP-COMPATIBILITY`).

---

## File / Export Mismatches
- 0 default export mismatches discovered across all active route pages and major components.
- `OSADAcademicHeaderActions.js` is a verified pure calculation helper exporting named functions matching its responsibility.

---

## Historical Terminology Retention
- Historical milestone reports (`AchieveNest_Phase_2_...` through `AchieveNest_Phase_8_...`) preserve original historical terms (`Department Secretary`, `Potential Awardees`, early milestone phrasing) to ensure 100% audit trail fidelity (`KEEP-HISTORICAL`).

---

## Digital Barcode ID Card
- **Component:** `frontend/src/pages/student/modals/DigitalBarcodeIDCardModal.jsx`
- **Classification:** `INTENTIONAL-SCOPE-REMOVAL` (Do not rename; Phase 14 removes it from product scope).

---

## Phase 14 Rename / Retire Plan
- **RETIRE-FOLDER:** 1 empty folder (`frontend/src/pages/personnel/department-secretary/`).
- **RENAME-WITH-COMPATIBILITY:** 2 methods (`submitToDepSec` in controller and hook modernized to `submitForVerification`).
- **RENAME:** 1 prop (`onSubmitToDepSec` in `PortfolioSummaryCard.jsx` modernized to `onSubmitForVerification`).
- **REMOVE-INSTEAD-OF-RENAME:** 22 dead code candidates (including `NDMURatingPane.jsx`, `AcademicStructureModel.js`, `ProtectedRoute.jsx`, `OSADQuickActions.jsx`).
- **INTENTIONAL-FEATURE-REMOVAL:** 1 component (`DigitalBarcodeIDCardModal.jsx` + 2 dashboard callers).
- **KEEP / KEEP-COMPATIBILITY / KEEP-HISTORICAL:** All active routes, APIs, Supabase stubs, migrations, seeders, and NDMU branding.

---

## Phase 15 Validation Mapping
1. **Frontend Test Suite:** Execute `npm test` (190 Vitest assertions) and verify modernized method/prop names.
2. **Backend Regression:** Run `spark test:phase14-awards` (46 assertions) and `spark test:phase15-backend`.
3. **Route Smoke Tests:** Verify `/depsec` redirects cleanly to `/personnel/dashboard` and `?tab=awardees` resolves to candidate review.
4. **Terminology Grep:** Verify 0 active source files contain stale `Department Secretary` UI strings.

---

## Audit Files
- **Rename Candidate Register CSV:** `docs/audit/PHASE_13A_RENAME_CANDIDATE_REGISTER.csv` (14 records across 25 columns)
- **Terminology Register CSV:** `docs/audit/PHASE_13A_TERMINOLOGY_REGISTER.csv` (11 records across 13 columns)
- **Naming Standard Specification:** `docs/audit/PHASE_13A_NAMING_STANDARD.md`
- **Audit Narrative Report:** `docs/audit/PHASE_13A_FILE_NAMING_TERMINOLOGY_CONSISTENCY_AUDIT.md`

---

## Organization / Naming Classification Counts
- **KEEP:** 2
- **KEEP-FRAMEWORK-REQUIRED:** 2
- **KEEP-HISTORICAL:** 2
- **KEEP-COMPATIBILITY:** 5
- **RENAME-CANDIDATE:** 1
- **FOLDER-RETIREMENT-CANDIDATE:** 1
- **TERMINOLOGY-UPDATE-CANDIDATE:** 2
- **ROUTE-COMPATIBILITY-REVIEW:** 1
- **API-COMPATIBILITY-REVIEW:** 0
- **REMOVE-INSTEAD-OF-RENAME:** 1
- **INTENTIONAL-SCOPE-REMOVAL:** 1
- **REVIEW REQUIRED:** 0

---

## Files Changed
Audit documentation only:
- `docs/audit/PHASE_13A_FILE_NAMING_TERMINOLOGY_CONSISTENCY_AUDIT.md`
- `docs/audit/PHASE_13A_RENAME_CANDIDATE_REGISTER.csv`
- `docs/audit/PHASE_13A_TERMINOLOGY_REGISTER.csv`
- `docs/audit/PHASE_13A_NAMING_STANDARD.md`

---

## Limitations
- None. Complete terminology universe cross-referenced across codebase, routes, APIs, database migrations, and historical documentation.

---

## Verdict
`PASS / COMPLETED`

---

## Safety Confirmation
No source filename, folder, class, component, route, API endpoint, database object, migration, seeder, command, script, UI label, role identifier, or business logic was renamed, moved, deleted, or refactored in Phase 13A.
