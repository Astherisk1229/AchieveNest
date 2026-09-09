# Database Configuration Audit

### Authoritative Configuration Files
1. `backend/app/Config/Database.php`
2. `backend/.env` (local override)
3. `backend/env` (template)

### Connection Groups Defined
| Group Name | Driver | Default Database | Port | Intended Runtime Context | Active in Dev? |
|---|---|---|---|---|---|
| `local_defense` | MySQLi | `achievenest_local` | 3306 | Local WAMP defense & development environment | **YES (ACTIVE)** |
| `default` | Postgre / MySQLi | `postgres` / `achievenest_local` | 5432 / 3306 | Cloud Supabase target (overridden to MySQL in .env) | CONDITIONAL |
| `development` | Postgre | `postgres` | 54322 | Hosted Supabase development project | STANDBY |
| `tests` | SQLite3 | `:memory:` | N/A | PHPUnit in-memory test suite | ACTIVE (Tests) |
| `phase17_replay` | Postgre | `achievenest_awards_phase_17_ci_replay` | 55432 | Isolated CI PostgreSQL replay verification | ISOLATED |
| `phase17m_replay` | MySQLi | `achievenest_phase17m_replay` | 3306 | Isolated CI MySQL replay verification | ISOLATED |

### Runtime Resolution Logic
The `Database::__construct()` constructor checks `ACHIEVENEST_ENV`:
- When `ACHIEVENEST_ENV = 'local-defense'`, CodeIgniter sets `$this->defaultGroup = 'local_defense'`.
- MySQLi connection to `127.0.0.1:3306` targeting `achievenest_local` is used for all runtime HTTP requests and spark commands.
