# Schema Drift & Risk Report

| ID | Current evidence | Impact | Status |
|---|---|---|---|
| DRIFT-01 | Legacy `departments` is created by 000001; target `administrative_units` is created by 000014. Current personnel assignment reads use affiliation tables and `administrative_unit_id`, while compatibility/legacy references remain. | Two institutional-unit vocabularies can be confused. | MONITORED; not proven fully resolved |
| DRIFT-02 | `backend/app/Models` exists but contains only `.gitkeep`; controllers/services use Query Builder directly. | Validation and persistence rules are distributed. | ARCHITECTURAL STANDARD |
| DRIFT-03 | Migrations contain branches/raw DDL for PostgreSQL and MySQL. Current `.env` selects MySQLi `local_defense`; PostgreSQL groups are configured alternatives. | Engine-specific DDL remains a portability risk. | MONITORED |
| DRIFT-04 | Five old documentation table names have no migration/runtime evidence as physical tables. | Debuggers can search nonexistent schema objects. | RESOLVED IN DOCUMENTATION; physical replacements recorded in Personnel map |
| DRIFT-05 | Migration identifiers have gaps 000027, 000040, 000042. | A range label can be mistaken for a file count. | RESOLVED IN DOCUMENTATION |

No production schema change was made during reconciliation.

## Documentation Reconciliation

Reconciled against repository HEAD: `e8004d9fbe979a14f4e1a408ffd37458173e4e18`

Reconciliation date: `2026-09-09`

Source of truth: Actual repository contents and active runtime configuration.
