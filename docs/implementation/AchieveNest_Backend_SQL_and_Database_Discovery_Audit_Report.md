# AchieveNest Backend SQL and Database Discovery Audit Report

This discovery report was reconciled on 2026-09-09 against repository HEAD `e8004d9fbe979a14f4e1a408ffd37458173e4e18`.

## Current inventory

| Layer | Path | Count |
|---|---|---:|
| CodeIgniter PHP migrations | `backend/app/Database/Migrations/*.php` | 64 |
| CodeIgniter Seeders | `backend/app/Database/Seeds/*.php` | 5 |
| Service PHP files | `backend/app/Services/*.php` | 66 |
| API controller PHP files | `backend/app/Controllers/Api/*.php` | 27 |
| Companion MySQL migration SQL | `backend/database/mysql-defense/migrations/*.sql` | 34 |
| Validation SQL | `backend/database/mysql-defense/validation/*.sql` | 1 |
| Phase/canonical snapshots | mysql-defense root plus canonical baseline | 30 |
| Writable SQL backups | `backend/writable/backups/**/*.sql` | 7 |
| Total raw SQL | `backend/**/*.sql` | 72 |

Migration filenames span identifiers 000001–000067, with missing numbers 000027, 000040, and 000042. The span is not the file count.

## Runtime finding

The active local-defense runtime is the MySQLi `local_defense` connection selected by `backend/.env`. PostgreSQL/Supabase-compatible connections remain configured alternate/cloud or disposable replay targets; both engines are not active simultaneously by this configuration.

## Corrected Personnel Evaluation storage

The authoritative physical table mapping is in `BACKEND_PERSONNEL_EVALUATION_DATABASE_MAP.md`. In particular, part-time titles are rows in `faculty_rank_catalog`; portfolio versions use `personnel_evaluations`; evidence uses `personnel_accomplishment_evidence`; audit uses `personnel_evaluation_events`/`audit_logs`; notifications use `notifications`.

## Source-of-truth hierarchy

1. Actual repository contents
2. Current runtime configuration
3. CodeIgniter migrations
4. Current route/controller/service implementation
5. Generated documentation
6. Historical SQL backups and snapshots

## Documentation Reconciliation

Reconciled against repository HEAD: `e8004d9fbe979a14f4e1a408ffd37458173e4e18`

Reconciliation date: `2026-09-09`

Source of truth: Actual repository contents and active runtime configuration.
