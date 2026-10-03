# Schema Drift & Field Consistency Register

| Drift ID | Entity / Field | Migration Definition | Runtime / Controller Usage | Impact | Severity | Resolution / Status |
|---|---|---|---|---|---|---|
| DRIFT-01 | `department` vs `administrative_unit_id` | Migration `000014` established `administrative_units` table. | Legacy code used string `department` field. Target schema uses `administrative_unit_id` foreign key. | Resolved by Plan D2-4 projection resolver. | LOW | RESOLVED |
| DRIFT-02 | Model Layer (`backend/app/Models`) | CI4 Models absent. | Services handle query builder directly with manual field whitelists. | No Active Record model validation. | MEDIUM | ARCHITECTURAL STANDARD |
| DRIFT-03 | MySQL vs Postgres DDL | CodeIgniter migrations contain raw SQL syntax tailored for MySQL and Postgre. | Local defense uses MySQL 8.0, CI replay uses PostgreSQL. | Dual-engine compatibility maintained. | LOW | MONITORED |
