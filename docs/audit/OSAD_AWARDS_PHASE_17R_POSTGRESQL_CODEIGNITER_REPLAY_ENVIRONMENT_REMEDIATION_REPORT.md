# OSAD Awards Phase 17R — PostgreSQL CodeIgniter Replay Environment Remediation Report

## 1. Executive Summary

Phase 17R provisioned a valid disposable PostgreSQL 15 environment, enabled the required CLI PHP drivers, passed connectivity and `pgcrypto` checks, and successfully replayed migrations 000001–000026. The complete CodeIgniter replay then stopped at migration 000028 because the repository changes dialect from PostgreSQL to MySQL inside the same ordered migration chain. The chain therefore cannot execute exactly as written on either database engine.

```text
PHASE 17R: STOP — REPLAY ENVIRONMENT RECONCILIATION REQUIRED
```

## 2. Original Phase 17 Failure

The original attempt ran PostgreSQL migration 000001 against MySQL/WAMP and failed on `CREATE EXTENSION IF NOT EXISTS pgcrypto`. Its report remains unchanged at `docs/audit/OSAD_AWARDS_PHASE_17_FINAL_15_AWARD_REPLAY_PARITY_AND_CLOSURE_REPORT.md`.

## 3. Protected WAMP Safety State

The protected `achievenest_local` database was never targeted by PostgreSQL configuration or migrations. After disposable cleanup it still reported 64 permanent tables and 15 active visible verified Awards.

## 4. Repository Freeze

- Branch: `audit/project-architecture-linkage`
- HEAD: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- Latest commit: `ea987bf docs(audit): close osad refinement regression and replay`
- Working tree was already substantially dirty with Phase 1–17 and academic-structure work; all existing changes were preserved.
- Phase 17 failure report and backup remain present and unchanged.

## 5. PostgreSQL Dependency Inventory

| Dependency | Observed use |
|---|---|
| `pgcrypto`, `gen_random_uuid()` | UUID defaults and foundational identity schema |
| Native `uuid`, `jsonb`, arrays, `bytea` | Domain columns and structured metadata |
| `ON CONFLICT` | Deterministic reference upserts |
| `NULLS NOT DISTINCT` | Active/history uniqueness; requires PostgreSQL 15+ |
| Partial/expression indexes | Active uniqueness and lowercase identity rules |
| PL/pgSQL functions/triggers | timestamps, authorization, integrity guards |
| RLS, policies, grants | Supabase-style authorization controls |
| `auth.users`, `auth.uid()`, `auth.role()` | Supabase identity integration |
| `storage.buckets`, `storage.objects`, `storage.foldername()` | Supabase Storage integration |
| roles `anon`, `authenticated`, `service_role` | policy/grant targets |

The complete scan also identified the later MySQL-only constructs `AFTER`, `DATETIME(6)`, `TINYINT`, `UUID()`, `CONCAT`, MySQL index syntax, and MySQL JSON/table DDL beginning at migration 000028.

## 6. Chosen PostgreSQL Version

PostgreSQL **15.14** (`postgres:15.14-bookworm`) was chosen. PostgreSQL 15 is the minimum compatible major version because migration 000003 uses `NULLS NOT DISTINCT` on a unique index.

## 7. Provisioning Method

Docker Desktop was already installed. The official PostgreSQL image was downloaded and a single disposable container named `achievenest-phase17r-postgres` was bound to loopback port 55432. The container and its database were removed after the STOP condition.

## 8. PHP CLI Runtime

- Executable: `C:\wamp64\bin\php\php8.2.29\php.exe`
- PHP: 8.2.29, ZTS, x64
- CLI INI: `C:\wamp64\bin\php\php8.2.29\php.ini`
- Extensions were enabled per replay invocation with `-d`; normal WAMP configuration was not modified.

## 9. `pgsql` / `pdo_pgsql` Verification

Both `pgsql` and `pdo_pgsql` loaded successfully from the existing WAMP PHP 8.2 extension directory.

## 10. Connectivity Smoke Test

All connectivity prerequisites passed:

- PostgreSQL accepted connections.
- `SELECT version()` returned PostgreSQL 15.14.
- `CREATE EXTENSION IF NOT EXISTS pgcrypto` passed.
- `SELECT gen_random_uuid()` returned a UUID.
- PHP CLI loaded both PostgreSQL drivers.

```text
POSTGRESQL CONNECTIVITY: PASS
```

## 11. Disposable Replay DB Identity

- Driver: PostgreSQL
- Host: 127.0.0.1
- Port: 55432
- Database: `achievenest_awards_phase_17_ci_replay`
- Protected WAMP database: not targeted
- Public business tables before replay: 0

Minimal Supabase platform scaffolding was provisioned separately in `auth` and `storage` schemas because those are platform dependencies, not application business tables.

## 12. CodeIgniter Replay Configuration

A secret-free `phase17_replay` database group was added to `Config\Database`. It uses ordinary `PHASE17_REPLAY_*` process variables, preserves existing WAMP groups, and throws if the replay database name is `achievenest_local`. No credential is committed.

## 13. Replay Run 1

Migrations 000001 through 000026 completed and were recorded by CodeIgniter. At failure time the disposable database contained 26 migration records and 56 public tables.

Migration 000028, `AddOrganizationLogoMetadata`, failed on PostgreSQL with:

```text
syntax error at or near "AFTER"
ADD COLUMN logo_storage_key VARCHAR(500) NULL AFTER status
```

The same statement also uses MySQL `DATETIME(6)`. Later migrations contain further MySQL-only DDL and functions.

## 14. Replay Run 2

Not started. Phase 17R STOP condition 4 requires stopping when any migration assumes an unavailable PostgreSQL capability/dialect. Repeating a known-invalid mixed-dialect chain would not add determinism evidence.

## 15. Determinism Comparison

Not available because Run 1 did not complete.

## 16. Award Reference Validation

Not reached. The Award remediation migrations are in the MySQL-only portion after the failure point.

## 17. Referential Integrity

The partial PostgreSQL replay did not report FK failures before migration 000028. Final application referential integrity was not asserted because the replay was incomplete.

## 18. Active Mapping Duplicate Check

Not reached in the PostgreSQL replay because mapping and Award remediation migrations occur after the dialect boundary.

## 19. Independent MySQL Defense Replay

Not executed after the mandatory Phase 17R STOP. Prior Phase 16 evidence was not reused or relabeled as Phase 17R proof.

## 20. Logical Parity Comparison

Not proven. A complete PostgreSQL CodeIgniter result does not exist for comparison with MySQL defense and protected WAMP.

## 21. Dialect Differences

Intentional physical differences such as PostgreSQL `uuid` versus MySQL `CHAR(36)` could be normalized during logical comparison. The current blocker is not such an intentional representation difference: the same CodeIgniter sequence contains mutually incompatible PostgreSQL and MySQL statements, preventing any one engine from completing the chain.

## 22. Protected WAMP Preservation

Confirmed after cleanup:

```text
achievenest_local permanent tables ........ 64
active visible VERIFIED Awards ............ 15
PostgreSQL migrations applied to WAMP ..... 0
protected reset/drop/truncate ............. 0
```

## 23. Remaining Risks

The repository needs an explicit migration-history architecture decision:

1. make migrations 000028–000052 PostgreSQL-compatible (or driver-aware) so the complete CodeIgniter chain has one valid target dialect; or
2. establish a separate, complete, independent MySQL CodeIgniter migration namespace as Option B.

Merely skipping migrations, importing defense SQL as the CodeIgniter replay, or hand-repairing the disposable database would weaken the required proof and was not done. CodeIgniter also continues to return process exit code 0 while printing a migration exception; automated replay must inspect output or use a fail-fast wrapper.

## 24. Resume Decision

Phase 17 cannot resume. Phase 17R must be reopened after the mixed-dialect migration chain is reconciled and must then complete two clean PostgreSQL runs, an independent MySQL defense replay, and logical parity.

## 25. Final Gate

```text
PHASE 17R: STOP — REPLAY ENVIRONMENT RECONCILIATION REQUIRED
```

Phase 16 remains PASS. Phase 17 and the overall Awards remediation program remain open.
