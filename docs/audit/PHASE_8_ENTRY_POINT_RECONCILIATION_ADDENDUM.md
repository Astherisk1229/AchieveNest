# Phase 8 — Entry-Point Count & Classification Reconciliation Addendum

## 1. Executive Summary & Root Cause
The initial Phase 8 summary reported **27 registered entry points**, but the narrative classification table summed to **26** due to a typographic omission in the `ACTIVE-TEST` category (reported as 9 instead of the actual **10** test entries).

This addendum reconciles the exact row-level classification tally, clarifies the PowerShell wrapper labeling for `php.ps1` and `spark.ps1`, and distinguishes physical source artifacts from unique registered non-HTTP entry points.

---

## 2. Authoritative Classification Tally (27 Entry Points)

| Classification | Count | Registered Entry Points |
| :--- | :---: | :--- |
| **ACTIVE-TEST** | **10** | `test:phase7-auth`, `test:phase9-storage`, `test:phase11-reference`, `test:phase12-demo`, `test:phase13-step4`, `test:phase14-awards`, `test:phase14-workflows`, `test:phase15-backend`, `phase15-backend-regression.ps1`, `phase16-frontend-regression.ps1` |
| **ACTIVE-VALIDATION** | **5** | `db:verify-defense`, `test:health`, `phase16-department-audit.ps1`, `phase16-terminology-audit.ps1`, `run-phase16-browser-evidence.js` |
| **ACTIVE-OFFLINE-DEFENSE** | **3** | `test:phase8-authz`, `phase17-secret-audit.ps1`, `run-phase17-offline-validation.js` |
| **ACTIVE-OPERATIONAL** | **2** | `backend/scripts/php.ps1`, `backend/scripts/spark.ps1` |
| **ACTIVE-DEMO** | **1** | `demo:reset` |
| **ACTIVE-BACKUP** | **1** | `backend/scripts/phase18-verify-backup.ps1` |
| **ACTIVE-RECOVERY** | **1** | `test:phase18-dr` |
| **ACTIVE-SETUP** | **1** | `backend/scripts/enable-php-extensions.ps1` |
| **DOCUMENTATION-RUNBOOK** | **1** | `STARTUP_COMMANDS.md` |
| **HISTORICAL** | **1** | `backend/scripts/verify-admin-bootstrap-full.mjs` |
| **DUPLICATE-CANDIDATE** | **1** | `backend/development/verify-admin-bootstrap-full.mjs` |
| **ACTIVE-MIGRATION-REPLAY** | **0** | Framework-native `spark migrate` / SQL files (no custom wrapper rows) |
| **ACTIVE-COMPATIBILITY** | **0** | No active compatibility aliases in custom scripts |
| **NO INVOCATION PROVEN YET** | **0** | All 27 entry points have verified callers or operator runbook roles |
| **SUPERSEDED-CANDIDATE** | **0** | Historical duplicate categorized under `DUPLICATE-CANDIDATE` |
| **REVIEW REQUIRED** | **0** | All classifications resolved with concrete evidence |
| **TOTAL** | **27** | **100% Reconciled** |

---

## 3. Entry-Type Labeling & Physical Source Reconciliation
- **PowerShell CLI Wrappers:** `php.ps1` and `spark.ps1` are correctly categorized with `EntryType = "PowerShell CLI Wrapper"` and `Language = "PowerShell"`. They serve as developer convenience aliases invoking the WAMP PHP 8.2 binary and CodeIgniter Spark CLI.
- **Physical Source Inventory vs. Registered Operational Entry Points:**
  - **13 Spark Command Classes:** Defined in `backend/app/Commands/*.php`
  - **9 PowerShell Scripts & Wrappers:** Defined in `backend/scripts/` and `frontend/scripts/`
  - **4 Node.js Scripts:** Defined in `frontend/scripts/`, `backend/scripts/`, `backend/development/`
  - **1 Operator Runbook:** `STARTUP_COMMANDS.md`
  - **Total Physical Artifacts Mapped:** **27 unique operational entry points**
- **npm Scripts:** Defined in `frontend/package.json` (`dev`, `build`, `lint`, `preview`, `test`, `test:run`, `test:coverage`); treated as logical aliases invoking underlying test runners and build tooling rather than separate physical script files.

---

## 4. Migration Replay & Compatibility Clarification
- **Migration & Replay:** CodeIgniter's framework-native `spark migrate` and the standalone `backend/database/mysql-defense/migrations/` SQL package provide complete deterministic build and replay capability without requiring separate custom wrapper scripts. Thus `ACTIVE-MIGRATION-REPLAY` is correctly recorded as `0` custom registered entry points.
- **Historical Bootstrap Pair:** `verify-admin-bootstrap-full.mjs` (in `backend/scripts/` and `backend/development/`) are preserved historical stubs for Phase 10 review.

---

## 5. STARTUP_COMMANDS.md Confirmation
- **Status:** Untracked in working tree.
- **Classification:** `DOCUMENTATION-RUNBOOK`.
- **Accuracy:** 100% verified against local defense environment.
