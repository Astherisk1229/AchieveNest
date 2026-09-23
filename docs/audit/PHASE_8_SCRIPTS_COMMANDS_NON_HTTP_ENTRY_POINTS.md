# Phase 8 — Scripts, Commands & Non-HTTP Entry Points Audit Report

## Status
`PASS / COMPLETED`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `7aeb4bd4ef558db60a8a65eb26d24660eb335490`
- **Phase 0 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_0_FREEZE_AND_SAFETY_BASELINE.md`)
- **Phase 1 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_1_REPOSITORY_INVENTORY.md`)
- **Phase 2 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_2_FRONTEND_ROUTE_REACHABILITY.md`)
- **Phase 3 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md`)
- **Phase 4 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_4_FRONTEND_BACKEND_API_CONTRACT_MAP.md`)
- **Phase 5 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_5_BACKEND_ROUTE_AUDIT.md`)
- **Phase 6 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_6_CONTROLLER_SERVICE_DATA_ACCESS_AUDIT.md`)
- **Phase 7 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_7_DATABASE_MIGRATION_SEED_LINKAGE_AUDIT.md`, `docs/audit/PHASE_7_SQL_ARTIFACT_RECONCILIATION_ADDENDUM.md`)
- **Working Tree:** Clean (pre-existing untracked `STARTUP_COMMANDS.md` accounted)

---

## Reconciled Non-HTTP Entry-Point Inventory (27 Unique Entry Points)

### Physical Source Breakdown
- **Custom CodeIgniter Spark Command Classes (`backend/app/Commands/`):** 13 command classes
- **PowerShell Scripts & CLI Wrappers (`backend/scripts/`, `frontend/scripts/`):** 9 scripts
- **Frontend Automation & Offline Validation Scripts (`frontend/scripts/`):** 2 Node scripts
- **Historical Development / Testing Node Scripts:** 2 Node scripts
- **Operator Runbooks:** 1 runbook (`STARTUP_COMMANDS.md`)
- **Total Registered Non-HTTP Entry Points:** **27 entry points** (100% accounted)

---

## Authoritative Classification Breakdown (27 Entry Points)
| Classification | Count | Description / Key Examples |
| :--- | :---: | :--- |
| **ACTIVE-TEST** | **10** | `test:phase15-backend`, `test:phase7-auth`, `test:phase9-storage`, `test:phase11-reference`, `test:phase12-demo`, `test:phase13-step4`, `test:phase14-awards`, `test:phase14-workflows`, `phase15-backend-regression.ps1`, `phase16-frontend-regression.ps1` |
| **ACTIVE-VALIDATION** | **5** | `db:verify-defense`, `test:health`, `phase16-department-audit.ps1`, `phase16-terminology-audit.ps1`, `run-phase16-browser-evidence.js` |
| **ACTIVE-OFFLINE-DEFENSE** | **3** | `test:phase8-authz`, `phase17-secret-audit.ps1`, `run-phase17-offline-validation.js` |
| **ACTIVE-OPERATIONAL** | **2** | `backend/scripts/php.ps1`, `backend/scripts/spark.ps1` (WAMP PHP & Spark PowerShell CLI wrappers) |
| **ACTIVE-DEMO** | **1** | `demo:reset` (Instant demo persona and scenario fixture reset) |
| **ACTIVE-BACKUP** | **1** | `backend/scripts/phase18-verify-backup.ps1` (Backup snapshot hash integrity validator) |
| **ACTIVE-RECOVERY** | **1** | `test:phase18-dr` (Automated mysqldump backup & restore disaster recovery gate) |
| **ACTIVE-SETUP** | **1** | `backend/scripts/enable-php-extensions.ps1` (WAMP php.ini configuration utility) |
| **DOCUMENTATION-RUNBOOK** | **1** | `STARTUP_COMMANDS.md` (Accurate developer and defense operator startup guide) |
| **HISTORICAL** | **1** | `backend/scripts/verify-admin-bootstrap-full.mjs` (Historical Supabase bootstrap verification) |
| **DUPLICATE-CANDIDATE** | **1** | `backend/development/verify-admin-bootstrap-full.mjs` (Duplicate copy of historical script) |
| **ACTIVE-MIGRATION-REPLAY** | **0** | Framework-native `spark migrate` / SQL files (no custom wrapper rows) |
| **ACTIVE-COMPATIBILITY** | **0** | No active compatibility aliases in custom scripts |
| **NO INVOCATION PROVEN YET** | **0** | All 27 entry points have verified callers, test roles, or runbook purposes |
| **SUPERSEDED-CANDIDATE** | **0** | Historical duplicate categorized under `DUPLICATE-CANDIDATE` |
| **REVIEW REQUIRED** | **0** | All classifications resolved with concrete evidence |
| **TOTAL** | **27** | **100% Reconciled** |

---

## Detailed Subsystem Findings

### 1. Master Regression & Sub-Phase Verification Commands
- Primary backend regression gate is `spark test:phase15-backend`, which sequentially executes test verification commands across Authentication (`test:phase7-auth`), RBAC Authorization (`test:phase8-authz`), Evidence Storage Isolation (`test:phase9-storage`), Permanent Reference Data (`test:phase11-reference`), Demo Personas (`test:phase12-demo`), Student Portfolio E2E (`test:phase13-step4`), OSAD Awards (`test:phase14-awards`), and HR Workflows (`test:phase14-workflows`).

### 2. Disaster Recovery & Backup Tooling
- `spark test:phase18-dr` executes an automated end-to-end backup, database truncation, and restore procedure, validating that mysqldump snapshots restore 100% of tables with zero data loss.
- `backend/scripts/phase18-verify-backup.ps1` validates SHA-256 checksums across all backup snapshots in `backend/writable/backups/`.

### 3. Offline Defense & Secret Elimination Tooling
- `frontend/scripts/phase17-secret-audit.ps1` performs static AST regex scans across `frontend/src/` to prove zero hardcoded credentials, cloud API tokens, or Supabase keys exist in the frontend distribution.
- `frontend/scripts/run-phase17-offline-validation.js` verifies offline autonomy by asserting that no external HTTP requests leave the defense boundary.

### 4. Classification of `STARTUP_COMMANDS.md`
- **Tracked State:** Untracked in working tree (accounted for as pre-existing operator documentation).
- **Classification:** `DOCUMENTATION-RUNBOOK`.
- **Accuracy:** 100% accurate; provides exact PowerShell commands for WAMP PHP backend (`127.0.0.1:8080`) and React Vite frontend (`localhost:5173`).
- **Secrets:** Contains no plaintext production credentials (reads password placeholder dynamically from `backend/.env`).

### 5. Duplicate Script Case Study: `verify-admin-bootstrap-full.mjs`
- Located in both `backend/scripts/` (7,392 bytes) and `backend/development/` (7,432 bytes).
- Both scripts represent early historical verification tools created during initial Supabase setup. Both are catalogued in `PHASE_8_SCRIPT_REVIEW_CANDIDATES.csv` for Phase 10 / Phase 14 review.

---

## Current Defense Startup Workflow
1. **Infrastructure:** Launch WampServer (`wampmanager.exe`) and verify green icon (MySQL on port 3306).
2. **Backend Server:** Run `& "C:\wamp64\bin\php\php8.2.29\php.exe" -S "127.0.0.1:8080" -t "public"` from `backend/`.
3. **Frontend Server:** Run `npm run dev` from `frontend/` (`http://localhost:5173`).
4. **Maintenance / Reset:** Run `spark demo:reset` to refresh all 10 persona accounts.
5. **Regression Gate:** Run `spark test:phase15-backend` (Backend) and `npm test` (Frontend).

---

## Audit Artifacts Generated
1. **Non-HTTP Entry Point Register CSV:** `docs/audit/PHASE_8_NON_HTTP_ENTRY_POINT_REGISTER.csv` (28 lines, 27 entry points across 25 columns)
2. **Review Candidates CSV:** `docs/audit/PHASE_8_SCRIPT_REVIEW_CANDIDATES.csv` (2 records)
3. **Audit Narrative Report:** `docs/audit/PHASE_8_SCRIPTS_COMMANDS_NON_HTTP_ENTRY_POINTS.md`
4. **Reconciliation Addendum:** `docs/audit/PHASE_8_ENTRY_POINT_RECONCILIATION_ADDENDUM.md`

---

## Verdict
`PASS / COMPLETED`

## Safety Confirmation
No script, command, package script, runbook, backup/recovery tool, migration/replay tool, setup utility, route, schema, API, UI, auth, or business-logic changes were performed during the Phase 8 reconciliation.
