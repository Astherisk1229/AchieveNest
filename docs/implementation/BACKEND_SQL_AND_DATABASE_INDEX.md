# AchieveNest Backend SQL & Database Quick Reference Index

Repository evidence at `e8004d9fbe979a14f4e1a408ffd37458173e4e18` establishes the following current inventory.

| Component | Authoritative path | Current count / status |
|---|---|---|
| Database configuration | `backend/app/Config/Database.php`, `backend/.env` | `local_defense` selected by `.env`; MySQLi runtime |
| CodeIgniter migrations | `backend/app/Database/Migrations/*.php` | **64 files**; identifiers 000001–000067 with gaps 000027, 000040, 000042 |
| CodeIgniter seeders | `backend/app/Database/Seeds/*.php` | **5 files** |
| Services | `backend/app/Services/*.php` | **66 PHP files; 66 concrete classes; no abstract/trait-only files** |
| API controllers | `backend/app/Controllers/Api/*.php` | **27 PHP files** |
| Companion MySQL migrations | `backend/database/mysql-defense/migrations/*.sql` | **34 files** |
| Validation SQL | `backend/database/mysql-defense/validation/*.sql` | **1 file** |
| Phase/canonical snapshots | `backend/database/mysql-defense/*.sql`, `backend/database/codeigniter-canonical-baseline/*.sql` | **30 files** (28 + 2) |
| Writable backups | `backend/writable/backups/*.sql` | **7 files** |
| All raw SQL | `backend/**/*.sql` | **72 files** |

## Personnel Evaluation quick reference

The current physical tables include `profiles`, `personnel_profiles`, `colleges`, `administrative_units`, `faculty_rank_catalog`, `faculty_rank_transitions`, `personnel_qualifications`, `personnel_annual_reviews`, the six-table evaluation-scale catalogue, `personnel_evaluation_roots`, `personnel_evaluations`, `personnel_evaluation_items`, `personnel_accomplishments`, `personnel_accomplishment_evidence`, `personnel_evaluation_events`, `audit_logs`, and `notifications`.

Do not search for the following as physical tables on this HEAD:

- `part_time_faculty_titles`: part-time titles are catalog rows in `faculty_rank_catalog`, inserted by migration 000066.
- `personnel_portfolio_submissions`: portfolio version metadata is stored on `personnel_evaluations` by migrations 000057–000059.
- `personnel_evidence_records`: evidence is stored in `personnel_accomplishment_evidence`.
- `personnel_evaluation_audits`: evaluation events are stored in `personnel_evaluation_events`; broader audit records use `audit_logs`.
- `personnel_workflow_notifications`: persisted notifications use `notifications`.

## Troubleshooting paths

### College dropdown

Check migration 000001 (creates `colleges`), migration 000014 (target institutional structure), `DemoAcademicStructureSeeder.php`, `CollegeService.php`, `CollegeController.php`, route `GET /api/v1/osad/colleges`, and `frontend/src/services/personnelMasterDataService.js`.

### Academic rank or title

Check migrations 000064–000066, `FacultyRankCatalogService.php`, `FacultyRankProgressionService.php`, `PartTimeFacultyTitleService.php`, and routes `GET /api/v1/faculty-ranks` and `GET /api/v1/faculty-titles/part-time`.

### Personnel master-data field not saving

Check migrations 000060 and 000061; `TargetHRPersonnelController::updateMasterData`; `FacultyStatusService::validateMasterDataPayload`; and `EditMasterDataModal.jsx`. The route is `PUT /api/v1/hr/personnel/(:segment)/master-data`.

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
