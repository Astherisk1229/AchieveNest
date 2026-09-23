# Phase 10 — Obsolete Technology Audit Report

## Status
`PASS / COMPLETED`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `cd92f611bf7ec8faae2bb6ba83fb22cbb54d7efd`
- **Phase 0 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_0_FREEZE_AND_SAFETY_BASELINE.md`)
- **Phase 1 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_1_REPOSITORY_INVENTORY.md`)
- **Phase 2 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_2_FRONTEND_ROUTE_REACHABILITY.md`)
- **Phase 3 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md`)
- **Phase 4 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_4_FRONTEND_BACKEND_API_CONTRACT_MAP.md`)
- **Phase 5 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_5_BACKEND_ROUTE_AUDIT.md`)
- **Phase 6 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_6_CONTROLLER_SERVICE_DATA_ACCESS_AUDIT.md`)
- **Phase 7 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_7_DATABASE_MIGRATION_SEED_LINKAGE_AUDIT.md`)
- **Phase 8 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_8_SCRIPTS_COMMANDS_NON_HTTP_ENTRY_POINTS.md`)
- **Phase 9 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_9_DOCUMENTATION_REPORTS_ROOT_CLUTTER_AUDIT.md`)
- **Working Tree:** Clean (pre-existing untracked `STARTUP_COMMANDS.md` accounted)

---

## Authoritative Current Runtime vs. Legacy Baseline

| Architectural Layer | Current Local Defense Runtime | Legacy / Obsolete Technology Surface |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + Vite 8 (Local API Client) | `@supabase/supabase-js` client fallback stubs |
| **Backend Framework** | CodeIgniter 4.6.1 + WAMP PHP 8.2.29 | Express / Node.js backend (none tracked), Supabase cloud auth |
| **Authentication** | `LocalAuthService` + `LocalTokenService` | `SupabaseAuthService`, `SupabaseAdminAuthService` |
| **Authorization / RBAC** | `AuthorizationService` + Domain Policies | PostgreSQL Row Level Security (RLS) & Security Definer |
| **Database Engine** | MySQL 8.4.7 (`achievenest_local`, port 3306) | PostgreSQL (port 5432) |
| **Evidence Storage** | `LocalEvidenceStorageService` (Local FS) | Supabase Cloud Storage bucket APIs |
| **Test / Verification** | Spark CLI (`spark test:phase15-backend`) | Historical Node bootstrap scripts (`pg.Pool`) |

---

## Detailed Legacy Technology Inventory

### 1. Supabase Backend Services & Fallback Stubs
- **`SupabaseAuthService.php`:** Retained as an offline defense fallback stub in `backend/app/Services/`. In current local defense execution, `AuthenticatedActorService` defaults to local session validation; the Supabase path is completely bypassed.
- **`SupabaseAdminAuthService.php`:** Referenced only as default parameter injection in `PasswordResetRequestController`, `AuthController`, and `ProvisioningController`. Active local password operations use local password hashing directly.
- **Classification:** `ACTIVE-OFFLINE-STUB` / `DEPRECATION-CANDIDATE`. Safe for complete removal in Phase 14 after controller parameter refactoring.

### 2. Frontend Supabase Client & Zero-Call Test Mocks
- **`frontend/src/config/supabase.js`:** Instantiates `createClient()` with placeholder values.
- **Active Test Role:** Vitest test suites (`supabaseZeroCallLocalDefense.test.js`, `authServiceLocalDefense.test.js`) mock this module and execute `expect(supabase.auth.*).toHaveBeenCalledTimes(0)` to assert zero cloud network traffic.
- **Classification:** `ACTIVE-VALIDATION` / `ACTIVE-OFFLINE-STUB`. Retained until test modernizations in Phase 14.

### 3. Historical PostgreSQL Bootstrap Scripts
- **`backend/scripts/verify-admin-bootstrap-full.mjs` & `backend/development/verify-admin-bootstrap-full.mjs`:** Early verification scripts importing `pg` and `@supabase/supabase-js`.
- **Classification:** `HISTORICAL-SCRIPT` and `DEPRECATION-CANDIDATE`. Preserved for Phase 14 repository organization.

### 4. Legacy Package Dependencies
- **Frontend (`frontend/package.json`):** `@supabase/supabase-js` (v2.95.3). Retained solely for zero-call test mocks. Candidate for `npm uninstall` in Phase 14.
- **Backend Dev (`backend/development/package.json`):** `@supabase/supabase-js`, `pg`. Retained for historical scripts. Candidate for pruning in Phase 14.

### 5. PostgreSQL & RLS Mapping
- Historical RLS policies have been 100% replaced by CodeIgniter application-level policies:
  - Evidence access -> `EvidencePolicy`
  - Award nomination access -> `AwardPolicy`
  - Personnel workflow access -> `PersonnelPolicy`
  - Student portfolio access -> `StudentPortfolioPolicy`
  - RBAC permission enforcement -> `AuthorizationService` & `GovernancePolicy`

---

## Replacement Mapping Summary

| Legacy Artifact | Current Replacement | Status in Local Defense |
| :--- | :--- | :--- |
| `SupabaseAuthService.php` | `LocalAuthService` & `LocalTokenService` | Completely bypassed; 100% local |
| `SupabaseAdminAuthService.php` | Local password hashing & credential controllers | Completely bypassed; 100% local |
| `frontend/src/config/supabase.js` | `frontend/src/services/apiClient.js` | Bypassed; mocked for zero-call test |
| PostgreSQL RLS Policies | 6 Domain Policies & `AuthorizationService` | 100% application-level RBAC |
| PostgreSQL Port 5432 | MySQL 8.4.7 Port 3306 (`achievenest_local`) | Active runtime database |
| `verify-admin-bootstrap-full.mjs` | `spark test:phase15-backend` | Superseded by Spark test suite |

---

## Deprecation Preconditions for Phase 14
For every deprecation candidate catalogued in `PHASE_10_DEPRECATION_REVIEW_CANDIDATES.csv`:
1. No active HTTP requests or controllers invoke the legacy service.
2. Unit and feature tests are refactored to verify local defense behavior directly without legacy mock stubs.
3. Master regression suite (`spark test:phase15-backend` and `npm test`) passes 100% after removal.

---

## Audit Artifacts Generated
1. **Legacy Technology Register CSV:** `docs/audit/PHASE_10_LEGACY_TECHNOLOGY_REGISTER.csv` (11 lines, 10 records across 21 columns)
2. **Deprecation Candidates CSV:** `docs/audit/PHASE_10_DEPRECATION_REVIEW_CANDIDATES.csv` (7 lines, 6 records across 11 columns)
3. **Audit Narrative Report:** `docs/audit/PHASE_10_OBSOLETE_TECHNOLOGY_AUDIT.md`

---

## Verdict
`PASS / COMPLETED`

## Safety Confirmation
No legacy service, script, package, environment variable, schema artifact, compatibility layer, test stub, documentation, route, API, UI, auth, database, or business-logic removal/refactor was performed in Phase 10.
