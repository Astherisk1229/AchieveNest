# AchieveNest Backend Folder Architecture Map

| Folder | Exists | Current purpose | Documentation status |
|---|---|---|---|
| `backend/app/Commands` | Yes | Custom Spark audit/replay commands | Verified |
| `backend/app/Config` | Yes | Framework, database, filter, and route configuration | Verified |
| `backend/app/Controllers/Api` | Yes | 27 REST API controller files | Verified |
| `backend/app/Database/Migrations` | Yes | 64 authoritative CodeIgniter migrations | Corrected |
| `backend/app/Database/Seeds` | Yes | 5 CodeIgniter demo/local seeders | Verified |
| `backend/app/Filters` | Yes | Authentication/CORS/request filters | Verified |
| `backend/app/Helpers` | Yes | Shared helpers | Verified |
| `backend/app/Libraries` | Yes | Supporting libraries | Verified |
| `backend/app/Models` | Yes | Contains only `.gitkeep`; data access is service/controller driven | Verified |
| `backend/app/Phase17Canonical` | Yes | Guarded canonical replay support | Verified |
| `backend/app/Services` | Yes | 66 concrete service/support classes | Corrected |
| `backend/database/mysql-defense` | Yes | 34 companions, 1 validation script, 28 root snapshots | Corrected |
| `backend/database/codeigniter-canonical-baseline` | Yes | 2 canonical-baseline SQL snapshots | Added |
| `backend/scripts` | Yes | Backend automation scripts | Verified |
| `backend/tests` | Yes | PHPUnit suites and support | Verified |
| `backend/writable/backups` | Yes | 7 SQL backups plus non-SQL metadata/files | Corrected |

The PHP migrations are timestamped filenames whose embedded identifiers span 000001–000067. The absent identifiers are 000027, 000040, and 000042; therefore the file count is 64, not 67.

## Runtime architecture

`backend/.env` currently selects `database.defaultGroup = local_defense`; `Database.php` consequently selects the MySQLi `local_defense` group. PostgreSQL/Supabase-compatible `default` and `development` groups are configured alternatives, not simultaneous active connections. Disposable Phase 17 PostgreSQL and MySQL replay groups are selected only by their explicit environment values.

## Documentation Reconciliation

Reconciled against repository HEAD: `e8004d9fbe979a14f4e1a408ffd37458173e4e18`

Reconciliation date: `2026-09-09`

Source of truth: Actual repository contents and active runtime configuration.
