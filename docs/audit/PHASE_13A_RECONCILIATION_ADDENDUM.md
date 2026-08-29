# Phase 13A — Naming & Terminology Reconciliation Addendum
## Controller Inventory, Database Lineage Distinction & `submitToDepSec` Finalization

## 1. Status & Baseline
- **Status:** `PASS / COMPLETED`
- **Branch:** `audit/project-architecture-linkage`
- **Baseline HEAD:** `124025b9915b42ea320de51077fed3a2fa125db9`
- **Scope:** Documentation-only reconciliation of Phase 13A controller counts, migration and seeder inventories, SQL replay package separation, and `submitToDepSec` symbol modernization.

---

## 2. Reason for Reconciliation
The initial Phase 13A narrative required clarification and precision in four specific areas:
1. **Controller Inventory Alignment:** Reconciling the 18-controller backend inventory (17 API controllers + 1 Home controller) with Phase 6 evidence.
2. **Seeder Count Alignment:** Reconciling the 5 CodeIgniter seeder classes in `backend/app/Database/Seeds/` with Phase 7 database audit findings.
3. **Artifact-Family Separation:** Correcting the distinction between the 26 CodeIgniter PHP migration classes and the 11 `.sql` replay/reference files under `backend/database/mysql-defense/`.
4. **Symbol Modernization Finalization:** Resolving ambiguous alternative proposals (`submitForVerification / submitToEndorsement`) by assigning exactly one canonical replacement name per symbol (`submitToDean` and `onSubmitToDean`).

---

## 3. Backend Controller Inventory Reconciliation

### Verified Breakdown:
- **Total Backend Controllers:** **18 controllers**
- **API Controllers:** **17 controllers** under `backend/app/Controllers/Api/`:
  1. `AccountLifecycleController.php`
  2. `AchievementController.php`
  3. `AuthController.php`
  4. `AwardEvaluationController.php`
  5. `EventController.php`
  6. `EvidenceController.php`
  7. `HealthController.php`
  8. `HREvaluationController.php`
  9. `HRPersonnelController.php`
  10. `PasswordResetRequestController.php`
  11. `PersonnelAccomplishmentController.php`
  12. `PersonnelRoleController.php`
  13. `ProvisioningController.php`
  14. `StudentPortfolioController.php`
  15. `TargetHRPersonnelController.php`
  16. `TargetProvisioningController.php`
  17. `VerificationQueueController.php`
- **Home Controller:** **1 controller** (`Home.php` under `backend/app/Controllers/`).
- **Base Abstract Controller:** `BaseController.php` (Parent class for all controllers).

### Root Cause of Original 12-Controller Count:
The preliminary Phase 13 narrative audited a representative 12-controller functional subset without explicitly distinguishing it from the full 18-controller repository inventory. The authoritative count is **18 controllers total (17 API + 1 Home)**.

---

## 4. Database Artifact Inventory & Distinction

### A. CodeIgniter Migrations (26 PHP Classes)
Located in `backend/app/Database/Migrations/`:
- **Format:** Chronologically versioned PHP classes extending `CodeIgniter\Database\Migration`.
- **Count:** **26 migration files** (`2026-08-21-000001_CreateIdentityAndAcademicFoundation.php` through `2026-08-27-000026_HardenEvidenceUploadSecurity.php`).
- **Governance:** Framework-managed migration lineage; protected from renaming (`KEEP-FRAMEWORK-REQUIRED` / `KEEP-HISTORICAL`).

### B. CodeIgniter Seeders (5 PHP Classes)
Located in `backend/app/Database/Seeds/`:
- **Format:** PHP classes extending `CodeIgniter\Database\Seeder`.
- **Count:** **5 seeder files**:
  1. `DefenseDemoPersonaSeeder.php`
  2. `DefenseDemoScenarioSeeder.php`
  3. `DefenseDemoSeeder.php`
  4. `DemoAcademicStructureSeeder.php`
  5. `LocalDefenseAuthSeeder.php`
- **Root Cause of Original 15-Seeder Count:** Early notes conflated the 5 CodeIgniter seeders with reference datasets and replay SQL files in documentation.

### C. MySQL Defense SQL Package (11 .sql Files)
Located in `backend/database/mysql-defense/migrations/`:
- **Format:** Raw SQL scripts for local offline defense provisioning and testing.
- **Count:** **11 SQL files**:
  - **10 Schema Replay Migrations:** `000001_identity_and_institutional.sql` through `000009_audit_and_file_security.sql`, and `000011_local_auth_sessions.sql`.
  - **1 Mixed Replay + Permanent Reference Seed File:** `000010_constraints_indexes_reference_seeds.sql` (41,082 bytes; contains active-history unique constraints, high-value indexes, and authoritative permanent reference seed inserts).

---

## 5. `submitToDepSec` Symbol Modernization Finalization

### Workflow Evidence
In `PersonnelPortfolioController.js`, `submitToDean` is already implemented as the primary canonical submission method (lines 220–235), while `submitToDepSec` is an internal forwarding alias (lines 237–239). Faculty submissions transition directly to Dean evaluation for college endorsement.

### Reconciled Mapping (One Exact Replacement per Symbol):

| Component / File | Current Symbol | Canonical Replacement | Reason & Workflow |
| :--- | :--- | :--- | :--- |
| `PersonnelPortfolioController.js` | `submitToDepSec` | **`submitToDean`** | Modernize call sites to use existing canonical static method `submitToDean`. |
| `usePersonnelPortfolio.js` | `submitToDepSec` | **`submitToDean`** | Hook return method directly invokes `PersonnelPortfolioController.submitToDean`. |
| `PortfolioSummaryCard.jsx` | `onSubmitToDepSec` | **`onSubmitToDean`** | UI prop name aligned with Dean evaluation action. |

---

## 6. Compatibility Governance Summary
- **`/depsec` Redirect (`frontend/src/App.jsx:195`):** Retained as a transitional route redirecting to `/personnel/dashboard` (`KEEP-COMPATIBILITY`).
- **`department_secretary` Role Mapping (`frontend/src/utils/roleContext.js`):** Retained in `normalizeRoleContext` mapping to `CANONICAL_ROLES.DEAN` (`KEEP-COMPATIBILITY`).
- **`department_id` User Field (`frontend/src/services/authService.js`):** Retained as a null fallback for session payload backwards compatibility (`KEEP-COMPATIBILITY`).
- **`?tab=awardees` Query Alias (`frontend/src/pages/osad-admin/OSADAwardCandidateReviewPage.jsx`):** Retained as a non-breaking query parameter alias for `?tab=candidate-review` (`KEEP-COMPATIBILITY`).

---

## 7. Safety Confirmation
No source filename, folder, class, component, method, prop, route, API endpoint, database object, migration, seeder, command, script, UI label, role identifier, or business logic was renamed, moved, deleted, or refactored during this Phase 13A reconciliation.
