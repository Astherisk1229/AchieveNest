# AchieveNest Backend SQL and Database Documentation Reconciliation Report

## 1. Reason for reconciliation

The discovery artifacts disagreed with the repository about migration, service, and raw-SQL totals and described several domain labels as physical tables. This pass reconciles documentation only.

## 2. Repository baseline

- Root: `C:/Users/Admin/Documents/AchieveNest`
- Branch: `audit/project-architecture-linkage`
- HEAD: `e8004d9fbe979a14f4e1a408ffd37458173e4e18`
- Working tree: dirty before reconciliation, including unrelated modified production/frontend files and untracked discovery artifacts; all pre-existing changes were preserved.
- Date: 2026-09-09 (Asia/Singapore)

## 3. Documentation files checked

The six root reference artifacts, their `docs/implementation` copies, the comprehensive discovery report, and the prior discovery evidence directory were inspected.

## 4. Count differences found

| Metric | Prior documentation | Repository recount | Correction |
|---|---:|---:|---|
| PHP migrations | 67 | 64 | Range and gaps now explicit |
| Seeders | 5 | 5 | Confirmed |
| Service PHP files | 71 | 66 | Corrected; all 66 declare concrete classes |
| API controller PHP files | 27 | 27 | Confirmed |
| Raw SQL total | 70 | 72 | Corrected |
| Writable backup SQL | earlier inconsistent | 7 | Corrected |

## 5. Raw SQL classification

| Category | Count | Location |
|---|---:|---|
| Active companion MySQL migration scripts | 34 | `backend/database/mysql-defense/migrations` |
| Validation scripts | 1 | `backend/database/mysql-defense/validation` |
| Phase snapshots | 28 | SQL files directly under `backend/database/mysql-defense` |
| Canonical-baseline snapshots | 2 | `backend/database/codeigniter-canonical-baseline` |
| Writable backups | 7 | `backend/writable/backups` |
| Total | 72 | `backend/**/*.sql` |

## 6. Migration, seeder, service, and controller reconciliation

There are 64 timestamped migration files. The first is `2026-08-21-000001_CreateIdentityAndAcademicFoundation.php`; the last is `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php`. Missing identifiers are 000027, 000040, and 000042; no duplicate identifiers or alternate migration folder under `app/Database` was found. The five Seeder classes are demo/local fixtures. Migrations 000024, 000063, 000064, and 000066 contain embedded reference inserts and are documented as migrations, not Seeders.

## 7. Runtime database reconciliation

`backend/.env` selects `ACHIEVENEST_ENV = local-defense` and `database.defaultGroup = local_defense`. `Database.php` therefore selects the MySQLi local-defense group. PostgreSQL/Supabase-compatible default/development groups and disposable replay groups are configured alternatives, not concurrent active runtimes. Secrets were not copied into documentation.

## 8. Route and path corrections

The API CSV was rebuilt from `Routes.php`, contains 174 unique non-OPTIONS route/method pairs, and includes controller paths, action classification, and repository-inferred service/table references. Four duplicate declarations for Organization endpoints exist in `Routes.php`; the CSV intentionally contains one row per identical route/method mapping. This source duplication is unresolved because production routes were outside the authorized edit scope.

## 9. Personnel Evaluation map corrections

Five former labels were removed as physical-table claims: `part_time_faculty_titles`, `personnel_portfolio_submissions`, `personnel_evidence_records`, `personnel_evaluation_audits`, and `personnel_workflow_notifications`. Their current physical mappings are `faculty_rank_catalog`, `personnel_evaluations`, `personnel_accomplishment_evidence`, `personnel_evaluation_events`/`audit_logs`, and `notifications` respectively.

## 10. Schema drift and CSV corrections

The `department`/`administrative_unit_id` item is now monitored rather than called resolved because legacy `departments` evidence remains. The table catalog now contains only migration-backed tables and correct creation filenames. The API CSV has no duplicate route/method rows.

## 11. Unresolved items

- `Routes.php` contains four duplicate Organization route/method declarations. Documentation records the fact; production code was not changed.
- Authorization is enforced through controller/filter behavior and is summarized conservatively in the CSV rather than inferred as a specific role without action-level proof.

## 12. Consistency matrix

| Metric | Index | Architecture map | Personnel map | Discovery report | Final |
|---|---:|---:|---:|---:|---:|
| Migrations | 64 | 64 | referenced by ID | 64 | 64 |
| Seeders | 5 | 5 | classified | 5 | 5 |
| Services | 66 | 66 | current names | 66 | 66 |
| API controllers | 27 | 27 | current names | 27 | 27 |
| Raw SQL | 72 | 72 | n/a | 72 | 72 |
| Writable SQL backups | 7 | 7 | n/a | 7 | 7 |
| Runtime | MySQLi local-defense | MySQLi local-defense | n/a | MySQLi local-defense | MySQLi local-defense |

## 13. Files updated

Only Markdown/CSV documentation, reconciliation evidence, and documentation verification/build scripts were created or changed. No PHP application file, migration, Seeder, SQL file, database, or runtime data was changed.

## 14. Verification results

The focused checker validates counts, required files, catalog migration paths, major table evidence, documented Personnel routes, duplicate CSV mappings, and the source-of-truth hierarchy. Its captured result is stored in the evidence package.

## 15. Final closure decision

**BACKEND SQL & DATABASE DOCUMENTATION RECONCILIATION COMPLETE — COUNTS, PATHS, ROUTES, TABLES, MIGRATIONS & REFERENCE FILES SYNCHRONIZED WITH CURRENT REPOSITORY**

## Documentation Reconciliation

Reconciled against repository HEAD: `e8004d9fbe979a14f4e1a408ffd37458173e4e18`

Reconciliation date: `2026-09-09`

Source of truth: Actual repository contents and active runtime configuration.
