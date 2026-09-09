# Backend SQL & Database Discovery Risk Register

| Risk ID | Finding | Classification | Impact | Mitigation / Recommendation |
|---|---|---|---|---|
| DB-AUDIT-01 | Dual Migration Sources (CI4 PHP vs Raw SQL) | CONFIRMED | Potential confusion on which migration is active | `backend/app/Database/Migrations` is authoritative; raw SQL is reference. |
| DB-AUDIT-02 | Active Record Models Absent in `backend/app/Models` | CONFIRMED | Expectation of traditional MVC models | Service-repository pattern is standard across codebase. |
| DB-AUDIT-03 | CLI `mysqli` Extension Dependency | CONFIRMED | `php spark migrate:status` errors if CLI php.ini lacks mysqli | Document WAMP PHP CLI configuration for developers. |
| DB-AUDIT-04 | Dual Database Engine Support (MySQL vs Postgres) | CONFIRMED | SQL dialect differences in complex queries | Query Builder usage ensures cross-engine portability. |
| DB-AUDIT-05 | Historical SQL Dumps in `backend/writable/backups` | CONFIRMED | Risk of accidental restore of outdated schema | Document dumps as historical point-in-time archives. |
