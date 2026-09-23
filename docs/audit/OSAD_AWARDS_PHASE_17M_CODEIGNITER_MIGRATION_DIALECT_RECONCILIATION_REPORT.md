# OSAD Awards Phase 17M — CodeIgniter Migration Dialect Reconciliation Report

## 1. Executive Summary

Phase 17M passes. The 49-file mixed legacy CodeIgniter chain remains immutable and isolated. A new `Phase17Canonical` MySQL namespace reconstructs the approved 63-table business schema plus CodeIgniter's `migrations` table and deterministic reference state. Two zero-state runs, rollback/reapply, independent mysql-defense replay, Award regressions, backend regressions, frontend tests, lint, and build passed.

## 2. Phase 17 / 17R Failure History

Phase 17 failed when PostgreSQL migration `000001` was attempted on MySQL. Phase 17R proved PostgreSQL migrations `000001`–`000026` could run on PostgreSQL 15.14, then `000028` failed on MySQL-only `AFTER`/`DATETIME(6)`. The chain is internally mixed, not merely missing an environment.

## 3. Repository Freeze

- Branch: `audit/project-architecture-linkage`
- HEAD: `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`
- Commit: `ea987bf docs(audit): close osad refinement regression and replay`
- Working tree: intentionally dirty with the accumulated local Phase 1–17M work; local contents are authoritative and connected GitHub state is stale for this phase.

## 4. Protected WAMP Baseline

The final read-only check observed MySQL 8.4.7, 64 tables, 15 active/catalog-visible VERIFIED Awards, and zero rows in `migrations`. The closure backup exists at `backend/database/mysql-defense/achievenest_local_pre_osad_awards_phase_17_closure_backup.sql` (971,222 bytes).

## 5. Full Migration Inventory

All 49 files through `2026-08-30-000052` were inspected. No `000027`, `000040`, or `000042` file exists locally; those are numbering gaps, not omitted inventory entries. See the companion classification matrix.

## 6. Dialect Classification Matrix

The authoritative per-file table is [OSAD_AWARDS_PHASE_17M_MIGRATION_DIALECT_CLASSIFICATION_MATRIX.md](./OSAD_AWARDS_PHASE_17M_MIGRATION_DIALECT_CLASSIFICATION_MATRIX.md). It records filename, class, dialect, portability, domain, up/down style, incompatible constructs, business intent, target representation, and action.

## 7. PostgreSQL Construct Inventory

The early chain contains `CREATE EXTENSION`, `pgcrypto`, UUID types/defaults, `timestamptz`, `jsonb`, `bytea`, `public.*`, `auth.users`, PL/pgSQL trigger functions, RLS, Supabase grants, casts, partial indexes, and PostgreSQL conflict/returning syntax. Exact file evidence is recorded in the matrix.

## 8. MySQL Construct Inventory

The later chain contains `AFTER`, `DATETIME(6)`, MySQL collations, `ON UPDATE CURRENT_TIMESTAMP`, `MODIFY COLUMN`, MySQL JSON expressions, and engine-specific DDL. Exact file evidence is recorded in the matrix.

## 9. Mixed Migration Inventory

`000010` and `000025` are mixed within a file. The broader transition also includes clean PostgreSQL files followed by MySQL files and portable Query Builder remediation files. These legacy files are not the replay entrypoint.

## 10. Dialect Transition Timeline

The observed pattern is PostgreSQL foundation → mixed transitional files → MySQL/WAMP-specific DDL → mostly portable Query Builder Award remediations. The first runtime failure did not define the whole transition.

## 11. Canonical Runtime Evidence

`.env`, the WAMP runbook, MySQLi configuration, local authentication/session services, backend authorization policies, protected storage routes, zero-Supabase tests, and the protected business database establish WAMP/MySQL as the approved canonical local backend. Supabase remains an optional hosted integration, not the owner of the WAMP business schema.

## 12. Canonical Dialect Decision

MySQL is canonical. PostgreSQL-only database controls are legacy/hosted concerns and the current application owns local authentication and authorization. Dual-engine support was rejected because the project does not define two authoritative production schemas.

## 13. Historical Migration Policy Decision

Strategy 2 was selected: retain all distributed mixed legacy files unchanged and establish a new authoritative baseline namespace. This avoids giving changed SQL the same historical migration identifiers.

## 14. Foundation Migration Reconciliation

The baseline snapshots the final approved schema rather than translating `000001` line by line. It therefore does not resurrect Departments or Department Secretary. The final College → Academic Program structure and current account model are reproduced directly.

## 15. UUID Strategy

Canonical MySQL uses `CHAR(36)` consistently for business PK/FK identities. Fixed Award, criterion, component, mapping, and rule identities are preserved. The independent defense replay now explicitly reconciles Notre Dame's already-approved model UUID rather than depending on an earlier `UUID()` result.

## 16. Timestamp Strategy

The final schema uses MySQL `DATETIME(6)`/`TIMESTAMP(6)` exactly where the protected schema requires it. UTC serialization remains application-owned; fractional seconds and update defaults match the protected DDL.

## 17. Constraint Strategy

The baseline preserves protected MySQL CHECK constraints, unique keys, FK actions, collations, defaults, and indexes. PostgreSQL-specific `NULLS NOT DISTINCT` and RLS artifacts were not falsely represented as MySQL features.

## 18. Authentication Reconciliation

Local WAMP identity is owned by profiles, local credentials, session registry, JWT middleware, and `LocalAuthService`. No broken `auth.users` FK is introduced in MySQL. Hosted Supabase authentication remains outside this canonical local schema.

## 19. RLS / Authorization Reconciliation

MySQL is not claimed to provide PostgreSQL RLS. Equivalent local enforcement is architectural: authentication middleware, `AuthorizationService`, governance policies, actor/scope checks, protected evidence routes, and audit trails. The Phase 8 authorization regression passed.

## 20. Implemented Migration Changes

- Added guarded `phase17m_replay` MySQL connection configuration while preserving `phase17_replay`.
- Added `Phase17Canonical` PSR-4 namespace and one independent canonical baseline migration.
- Added generated canonical schema/reference artifacts under `database/codeigniter-canonical-baseline`.
- Added `verify:migration-dialect` and `verify:phase17m-fresh-replay`.
- Made mysql-defense `000019` reconcile its approved scoring model UUID deterministically.

## 21. Award Semantic Diff Check

Award scoring, mappings, criteria, thresholds, authority split, and eligibility semantics changed by Phase 17M: **0**. The defense edit only fixes seed identity/provenance.

## 22. Fresh Replay Run 1

From a new `achievenest_phase17m_run1`: one canonical migration passed, yielding 63 business tables, one framework table, and 29 Award definitions. Zero manual SQL repairs and zero skipped migrations.

## 23. Fresh Replay Run 2

From a separate new `achievenest_phase17m_run2`: the same migration passed with the same counts and history. Zero manual SQL repairs and zero skipped migrations.

## 24. Determinism Comparison

- Normalized schema SHA-256, both runs: `8cabe3d2c9062409f63bcd0d9c3174bf4ab7e886ffda45cf35932ffad7029789`
- Reference SHA-256, both runs: `4b086ddbeea0d570b42003e192e2f5229a4722d40df7f0c7982e50f4c3a5c7ca`
- Independent dump schema SHA-256, both runs: `34CB8D4DC0EECFA9CDC1900A4BB8A73ADB8BC1D2075E8F036C803F771DFD3CE6`
- Independent dump reference SHA-256, both runs: `5ACCF193D939A71C57203E2C689CF8632705ABA7208E7775308E00FF62D69EA9`

Run 1 equals Run 2.

## 25. Working WAMP Logical Parity

The canonical artifacts were generated from the protected final business schema and selected permanent reference tables, excluding runtime users/candidates and framework metadata. Fresh replay reproduced 63 business tables, 29 definitions, 15 visible VERIFIED Awards, and the protected permanent reference state. The sole table-count difference is expected framework metadata (`migrations`). Unexplained permanent drift: 0.

## 26. MySQL Defense Independence / Parity

All 34 mysql-defense scripts independently replayed from zero into `achievenest_phase17m_defense`, stopping on any error. Result: 63 tables, 29 definitions, 15 active VERIFIED Awards. CI reads only its canonical artifacts and never executes defense scripts. Random historical metadata identities are treated as legacy provenance; final Award identities and logical relationships match.

## 27. Referential Integrity

Both CI runs completed with foreign keys enabled after baseline load. Rollback/reapply passed. Defense replay completed without FK errors after deterministic Notre Dame model reconciliation.

## 28. Deterministic Reference Data

The canonical reference artifact contains roles, academic structure, portfolio taxonomy, Award catalog/cycles/models, criteria/components, mappings/conditions, and scoring rules. Its complete replay fingerprint is identical across both runs.

## 29. Phase 16 Regression

`verify:awards-phase-16`: **29 passed, 0 failed**; `PHASE 16: PASS — CROSS-AWARD INTERACTION VERIFIED`.

## 30. Awards 01–15 Regression

Every command `verify:awards-phase-1` through `verify:awards-phase-15` passed with zero failures. Catalog outcome remains 15/15 VERIFIED, 11 OFFICIAL, and 4 PROPOSED.

## 31. Backend Regression

`test:phase15-backend`: **8/8 suites passed**.

## 32. Frontend Regression

Vitest: **39 files / 239 tests passed**. The first sandboxed attempt could not read the config; the authorized rerun completed normally.

## 33. Lint

`npm run lint`: pass with pre-existing warnings and no errors.

## 34. Build

`npm run build`: pass (`vite build`, 3.91 s).

## 35. Protected WAMP Preservation

Final values remain 64 tables, 15 active/catalog-visible VERIFIED Awards, and zero migration-history rows. No DROP, truncate, migration reset, or replay was performed against `achievenest_local`. A mistakenly unscoped namespace discovery invocation found no canonical migration and made no database change; immediate before/after checks confirmed preservation.

## 36. Repository State

The working tree remains intentionally dirty with accumulated, uncommitted program work. No commits, resets, checkouts, or unrelated-file cleanup were performed.

## 37. Remaining Risks

The baseline is a deliberate squash point: future schema changes must be added after it in the canonical namespace and the artifacts must not be edited without replay tests. Legacy migrations remain useful historical evidence but are not executable as one chain. WAMP CLI tasks must use a PHP build with `mysqli` enabled.

## 38. Phase 17 Resume Point

Resume the original Phase 17 at independent replay/parity closure, then candidate/ranking, immutable summaries, authorization/audit/manual decisions, frontend verification, restore proof, repository-state review, and the final closure gate. Do not restart Phases 0–16.

## 39. Final Gate

**PHASE 17M: PASS — CODEIGNITER MIGRATION DIALECT RECONCILED AND FRESH REPLAY DETERMINISTIC**

Phase 17 is unblocked but is not declared closed by this report.
