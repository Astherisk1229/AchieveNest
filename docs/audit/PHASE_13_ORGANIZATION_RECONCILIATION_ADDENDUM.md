# Phase 13 — Organization Reconciliation Addendum
## Organization Count Integrity, Historical Report Placement & Database Dump Archive Policy

## 1. Status & Baseline
- **Status:** `PASS / COMPLETED`
- **Branch:** `audit/project-architecture-linkage`
- **Baseline HEAD:** `e4422ce284f5173e2c7f20bbaed617917cd3a407`
- **Scope:** Documentation-only reconciliation of Phase 13 organization accounting, historical milestone reports, and database dump governance.

---

## 2. Reason for Reconciliation
The initial Phase 13 audit report required clarification in three specific areas:
1. **Count Discrepancy Reconciliation:** Clarifying the relationship between unique organization map rows (41 data rows) and primary vs secondary classification occurrences.
2. **Historical Report Enumeration & Destination Policy:** Providing an exhaustive mapping of all seven root historical reports and clarifying why Phase 3 historical findings live in `docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md`.
3. **Database Dump Governance Policy:** Formally defining the exact archive and Git tracking policy for `AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` prior to Phase 14.

---

## 3. Count Integrity Model & Accounting

### Model A: Single Primary Classification per Row
Every record in `docs/audit/PHASE_13_TARGET_ORGANIZATION_MAP.csv` carries exactly **one primary organization classification** in its `TargetOrganizationClassification` field.

### Count Integrity Table

| Metric | Count | Notes |
| :--- | :---: | :--- |
| **Unique Organization-Map Data Rows** | **41** | Header excluded (Lines 2–42 of CSV) |
| **Unique Move-Review Candidate Rows** | **15** | Header excluded (Lines 2–16 of CSV) |
| **Primary Classification Total** | **41** | 100% mathematical match with row count |
| **Secondary Classification Occurrences** | **10** | Overlapping concerns (Root clutter / Move candidates) |
| **Total Classification Occurrences** | **51** | Primary (41) + Secondary (10) |

### Breakdown of Primary Classifications (Sum = 41)

| Primary Classification | Count | Represented Artifacts |
| :--- | :---: | :--- |
| `BACKUP-RELOCATION-CANDIDATE` | 1 | Pre-Phase 7 database snapshot |
| `HISTORICAL-ARCHIVE-CANDIDATE` | 7 | 7 root historical milestone reports (Phases 2, 4, 5, 6, 7, 8) |
| `RUNBOOK-RELOCATION-CANDIDATE` | 1 | `STARTUP_COMMANDS.md` operational runbook |
| `MOVE-CANDIDATE` | 1 | `USER_WORKFLOW_AND_IMPROVEMENTS.md` architecture spec |
| `GENERATED-UNTRACK-CANDIDATE` | 2 | `backend/development/node_modules/`, `node_modules/.vite/deps/` |
| `INTENTIONAL-REMOVAL-NO-MOVE` | 1 | `DigitalBarcodeIDCardModal.jsx` (DCE-FE-030) |
| `NAMING-REVIEW-PHASE13A` | 1 | `frontend/src/pages/personnel/department-secretary/` |
| `REMOVE-FIRST-THEN-REEVALUATE` | 15 | 14 superseded frontend files/trees + 1 duplicate backend script |
| `KEEP-IN-PLACE` | 6 | 4 frontend component/layout dirs + 2 backend tooling paths |
| `FRAMEWORK-KEEP-IN-PLACE` | 6 | 5 CodeIgniter core dirs + 1 `docs/audit/` directory |
| `SHARED-COMPONENT-CANDIDATE` | 0 | None (DBIC is scope removal; others domain-owned) |
| `ROOT-CLUTTER-CANDIDATE` | 0 | Captured under primary historical/runbook/backup relocations |
| `REVIEW REQUIRED` | 0 | Zero unmapped items |
| **TOTAL** | **41** | **Exact match with CSV data rows** |

---

## 4. Historical Report Destination Reconciliation

### Policy Rule
- **`docs/history/`**: For pre-execution code reviews, architecture transition records, and early design analysis.
- **`docs/reports/`**: For execution results, verification reports, test matrices, and build reconciliation records.

### Complete Historical Report Mapping

| # | Filename | Phase | Report Type | Target Directory | Primary Classification |
| :-: | :--- | :---: | :--- | :--- | :--- |
| 1 | `AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md` | 2 | Pre-Execution Review | `docs/history/` | `HISTORICAL-ARCHIVE-CANDIDATE` |
| 2 | `AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md` | 4 | Build Validation Report | `docs/reports/` | `HISTORICAL-ARCHIVE-CANDIDATE` |
| 3 | `AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md` | 5 | Replay Validation Report | `docs/reports/` | `HISTORICAL-ARCHIVE-CANDIDATE` |
| 4 | `AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md` | 6 | Schema Reconciliation Report | `docs/reports/` | `HISTORICAL-ARCHIVE-CANDIDATE` |
| 5 | `AchieveNest_Phase_7_Test_Reconciliation_Report.md` | 7 | Auth Test Reconciliation Report | `docs/reports/` | `HISTORICAL-ARCHIVE-CANDIDATE` |
| 6 | `AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md` | 8 | Security & RBAC E2E Report | `docs/reports/` | `HISTORICAL-ARCHIVE-CANDIDATE` |
| 7 | `AchieveNest_Phase_8_E2E_Test_Matrix.md` | 8 | E2E Test Matrix Spec | `docs/reports/` | `HISTORICAL-ARCHIVE-CANDIDATE` |

### Reconciliation Note on Phase 3
During historical implementation milestones, Phase 3 frontend dependency mapping was integrated directly into the audit architecture rather than written as an independent root document. Authoritative Phase 3 evidence is fully preserved in `docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md` and `PHASE_3_FRONTEND_DEPENDENCY_MAP.csv`. Phase 8 produced two distinct root reports (Security Report + Test Matrix). Thus, all seven root historical reports are 100% accounted for.

---

## 5. Database Dump Archive & Governance Policy

### Artifact
`AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` (579 KB binary database snapshot)

### Chosen Policy
**`REPOSITORY-LOCAL-UNTRACKED-ARCHIVE`**

### Target Governance Specifications:
- **Target Repository Path:** `archive/database/AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump`
- **Git Tracking Status:** `UNTRACKED / IGNORED` (Must not be tracked in Git index).
- **Justification:** Binary database dumps contain raw table data and metadata that are regenerable via `mysqldump` and should not bloat the Git commit graph or risk exposure.
- **Phase 14 Execution Requirements:**
  1. Create directory `archive/database/`.
  2. Move dump file to `archive/database/AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump`.
  3. Untrack from Git index (`git rm --cached`).
  4. Ensure `.gitignore` ignores `archive/database/*.dump` (or `*.dump`).
- **Phase 15 Validation:** Run `git ls-files` to confirm the file is not tracked, and verify the file exists intact locally in `archive/database/`.

---

## 6. Architecture Specification Placement
- **Artifact:** `USER_WORKFLOW_AND_IMPROVEMENTS.md` (3.1 KB product specification)
- **Current Path:** Repository root
- **Target Path:** `docs/architecture/USER_WORKFLOW_AND_IMPROVEMENTS.md`
- **Primary Classification:** `MOVE-CANDIDATE`
- **Phase 14 Action:** `MOVE`
- **Phase 15 Validation:** Markdown link integrity check.

---

## 7. Reconciled Phase 14 Planned Action Counts

| Planned Action | Count | Affected Artifacts |
| :--- | :---: | :--- |
| **MOVE (Docs & Spec)** | 8 | 7 historical reports + 1 architecture spec |
| **RUNBOOK-MOVE / TRACK** | 1 | `STARTUP_COMMANDS.md` to `docs/runbooks/` |
| **ARCHIVE / UNTRACK** | 1 | `AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump` to `archive/database/` |
| **REMOVE (Dead Code)** | 22 | 21 superseded frontend components/models/pages + 1 duplicate script |
| **INTENTIONAL-FEATURE-REMOVAL** | 1 | `DigitalBarcodeIDCardModal.jsx` + 2 dashboard callers |
| **UNTRACK (Generated Deps)** | 2 | `backend/development/node_modules/` + `node_modules/.vite/deps/` |
| **FOLDER-RETIREMENT (Structural)** | 6 | 5 superseded subfolder trees + 1 legacy empty folder |
| **REVIEW FIRST** | 1 | `department-secretary/` (deferred to Phase 13A) |

---

## 8. Safety Confirmation
No source file, component, script, documentation artifact, backup, dump, generated dependency, route, schema, API, UI, auth, or business logic was moved, renamed, deleted, merged, untracked, archived, or refactored during this Phase 13 reconciliation.
