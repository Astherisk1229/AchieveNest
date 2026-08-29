# Phase 13A — AchieveNest Naming Standard & Conventions

## Overview
This document defines the canonical naming standards and terminology rules derived directly from the working AchieveNest codebase. It establishes rules for frontend components, backend classes, API endpoints, routes, business domains, database artifacts, and historical artifact preservation.

---

## 1. Finalized Business Terminology Standards

| Domain / Concept | Canonical Standard | Prohibited / Deprecated Terms | Rule & Scope |
| :--- | :--- | :--- | :--- |
| **Academic Hierarchy (Top Level)** | `College` | `Department` (as academic container) | A top-level academic division (e.g. CEAC, CBA, CAS). |
| **Academic Hierarchy (Degree Level)**| `Academic Program` / `Degree Program` | `Department` | Specific degree curriculum (e.g. BSCS, BSA). |
| **Administrative Structure** | `Administrative Unit` | `College` / `Program` | Non-academic support units (e.g. HR, OSAD, Athletics, CES). |
| **College Leadership** | `Dean` | `Department Secretary`, `depsec` | College-level academic executive and evaluator. |
| **Program Leadership** | `Program Coordinator` | `Department Head`, `Department Chair` | Degree program academic coordinator and reviewer. |
| **Student Organization Leadership** | `Organization Moderator` | `Faculty Adviser`, `DepSec` | Faculty moderator assigned to a recognized student organization. |
| **Award Eligibility Pipeline** | `Potential Award Candidates` / `Award Candidates` | `Potential Awardees`, `Generated Awardees` | System identifies candidate eligibility based on 80% benchmark or Dean nomination; final awardee selection is an institutional OSAD decision. |
| **Dean Award Pathway** | `Dean Nominations` | N/A | Authoritative dual-pathway feature allowing Deans to nominate candidates for interview eligibility. |
| **Institutional Identity** | `NDMU` / `Notre Dame of Marbel University` | N/A | Official institutional branding, seal, and email validation domain (`@ndmu.edu.ph`). |

---

## 2. Frontend Naming Conventions

### A. React Pages (`frontend/src/pages/`)
- **Convention:** PascalCase ending with `Page.jsx` (e.g. `StudentDashboardPage.jsx`, `HRPersonnelDirectoryPage.jsx`, `OSADAwardCandidateReviewPage.jsx`).
- **Rule:** Default export name MUST match the filename exactly.
- **Role Scoping:** Pages must reside under the corresponding role folder (`pages/auth/`, `pages/student/`, `pages/personnel/`, `pages/hr-admin/`, `pages/osad-admin/`).

### B. React Components & Modals (`frontend/src/components/`, `frontend/src/pages/**/modals/`)
- **Convention:** PascalCase (e.g. `ActiveRoleGuard.jsx`, `PotentialAwardCandidatesPreview.jsx`, `EditBasicInfoModal.jsx`).
- **Rule:** Reusable UI primitives reside in `components/common/` (guards/chrome) or `components/ui/` (Radix/Tailwind design tokens). Domain-specific components reside in `components/osad/` or role subdirectories. Modals must end with `Modal.jsx` or `Drawer.jsx`.

### C. React Custom Hooks (`frontend/src/hooks/`)
- **Convention:** camelCase starting with `use` (e.g. `usePersonnelPortfolio.js`, `useAdminSetupGuide.js`, `useVerification.js`).
- **Rule:** Default or named export function must match the filename.

### D. Frontend Controllers & Models (`frontend/src/controllers/`, `frontend/src/models/`)
- **Convention:** PascalCase ending with `Controller.js` or `Model.js` (e.g. `RouteAccessController.js`, `CollegeModel.js`, `StudentModel.js`).
- **Rule:** Static classes with pure domain logic and state serialization.

### E. Frontend Services (`frontend/src/services/`)
- **Convention:** camelCase or PascalCase ending with `Service.js` (e.g. `apiClient.js`, `authService.js`, `AwardPortfolioReviewService.js`, `Stage1CandidateReportService.js`).

---

## 3. Backend Naming Conventions (CodeIgniter 4)

### A. Controllers (`backend/app/Controllers/`)
- **Inventory Standard:** Exactly **18 controllers total**:
  - **17 API Controllers** under `backend/app/Controllers/Api/` (e.g. `AccountLifecycleController.php`, `AwardEvaluationController.php`, `HREvaluationController.php`).
  - **1 Home Controller** (`Home.php`) under `backend/app/Controllers/`.
  - **1 Base Abstract Controller** (`BaseController.php`).
- **Convention:** PascalCase ending with `Controller.php`. Extends `BaseController` or `ResourceController`.

### B. Services & Policy Classes (`backend/app/Services/`, `backend/app/Services/Policies/`)
- **Convention:** PascalCase ending with `Service.php` or `Policy.php` (e.g. `AwardEvaluationService.php`, `AwardPolicy.php`, `GovernancePolicy.php`).
- **Architecture Standard:** Exactly **5 policy classes** (`AwardPolicy`, `EvidencePolicy`, `GovernancePolicy`, `PersonnelPolicy`, `StudentPortfolioPolicy`) coordinated by `AuthorizationService.php`.

### C. Models (`backend/app/Models/`)
- **Convention:** PascalCase ending with `Model.php` (e.g. `CollegeModel.php`, `StudentModel.php`, `UserModel.php`).
- **Rule:** Extends `CodeIgniter\Model`.

### D. Spark CLI Commands (`backend/app/Commands/`)
- **Convention:** PascalCase describing command action (e.g. `CheckDatabaseHealth.php`, `VerifyPhase14Awards.php`, `GenerateDailyMetrics.php`).
- **Rule:** Command group names follow `test:*`, `setup:*`, `health:*`, or `system:*`.

### E. Database Artifact Families
The repository maintains three distinct database artifact families that must not be conflated:
1. **CodeIgniter Migrations (26 PHP Classes):** Located in `backend/app/Database/Migrations/` with chronological timestamp prefixes (e.g. `2026-08-21-000001_CreateIdentityAndAcademicFoundation.php` to `2026-08-27-000026_HardenEvidenceUploadSecurity.php`). Protected from renaming.
2. **CodeIgniter Seeders (5 PHP Classes):** Located in `backend/app/Database/Seeds/` (`DefenseDemoPersonaSeeder.php`, `DefenseDemoScenarioSeeder.php`, `DefenseDemoSeeder.php`, `DemoAcademicStructureSeeder.php`, `LocalDefenseAuthSeeder.php`).
3. **MySQL Defense SQL Package (11 .sql Files):** Located in `backend/database/mysql-defense/migrations/`:
   - 10 replay migration SQL files (`000001_identity_and_institutional.sql` to `000010_constraints_indexes_reference_seeds.sql`).
   - 1 permanent reference-data / session defense SQL file (`000011_local_auth_sessions.sql`).

---

## 4. Route & API Naming Standards

### A. Frontend Routes (`frontend/src/App.jsx`)
- **Convention:** kebab-case relative paths (e.g. `/student/dashboard`, `/osad/candidate-review`, `/hr/evaluation-submissions`).
- **Compatibility Rule:** Legacy transitional redirects (such as `/depsec` -> `/personnel/dashboard`) and query aliases (such as `?tab=awardees` -> `?tab=candidate-review`) are preserved to prevent bookmark breakage.

### B. Backend API Endpoints (`backend/app/Config/Routes.php`)
- **Convention:** kebab-case RESTful URI paths prefixed with `/api/` or `/auth/` (e.g. `/api/awards/evaluations/benchmark-preview`, `/auth/personnel/reset-password`).

---

## 5. Internal Symbol Modernization: `submitToDepSec` Finalization
Internal methods and props carrying obsolete `DepSec` references are mapped to exactly one canonical name matching actual Dean academic evaluation:
- `PersonnelPortfolioController.js::submitToDepSec` → **`submitToDean`** (unifying with canonical static method `submitToDean`).
- `usePersonnelPortfolio.js::submitToDepSec` → **`submitToDean`**.
- `PortfolioSummaryCard.jsx::onSubmitToDepSec` → **`onSubmitToDean`**.

---

## 6. Case-Sensitivity & Platform Safety Rules
1. **Windows vs Linux/Git Portability:** Windows file systems are case-insensitive, while Linux/CI systems are case-sensitive. 
2. **Two-Step Case Renames:** Any case-only filename modification in Phase 14 MUST be executed via a two-step rename (e.g. `git mv file.jsx temp.jsx && git mv temp.jsx File.jsx`) to ensure Git index accuracy across operating systems.
3. **No In-Place Migration Renaming:** Migration filenames are immutable framework keys; do not rename them for stylistic reasons.
