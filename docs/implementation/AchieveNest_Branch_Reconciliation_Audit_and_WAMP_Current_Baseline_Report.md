# AchieveNest Branch Reconciliation Audit and WAMP Current Baseline Report

**Audit date:** 2026-09-09 (Asia/Singapore)  
**Reconciliation branch:** `reconcile/wamp-current`  
**Preserved pre-reconciliation state:** `preserve/local-wamp-state` at `3fe33e4`  
**Upstream comparison baseline:** `origin/main` at `ceaf341`  
**Reconciliation commit:** `48e7b87`  
**Remote branch:** `origin/reconcile/wamp-current`  
**Status:** Validated and pushed; GitHub PR creation/review and merge pending

## Executive summary

The verified implementation baseline is `reconcile/wamp-current`, constructed from the complete local WAMP work preserved at `3fe33e4`. It contains the compatibility branch content and all later audited implementation work. Reconciliation removed the remaining active Supabase runtime dependency and hosted-auth paths, made the default and development database configurations MySQL/WAMP compatible, quarantined PostgreSQL-only historical tests, and corrected stale regression invariants without deleting current user-managed master data.

No remote branch was merged blindly. The protected `achievenest_local` database was backed up before branch work. Legacy PostgreSQL migrations remain an immutable inventory and are not an executable migration path; the guarded `Phase17Canonical` MySQL namespace is the verified fresh-install path.

## Phase 0 — frozen baseline

| Item | Frozen value |
|---|---|
| Project directory | `C:\Users\Admin\Documents\AchieveNest` |
| Initial branch | `audit/project-architecture-linkage` |
| Initial commit | `e8004d9fbe979a14f4e1a408ffd37458173e4e18` |
| Preservation branch/commit | `preserve/local-wamp-state` / `3fe33e4` |
| WampServer | 3.4.0 |
| WAMP PHP | 8.3.28 |
| CodeIgniter | 4.7.4 |
| MySQL | 8.4.7, `achievenest_local`, port 3306 |
| Node / npm | v24.13.1 / 11.8.0 |
| Backend base URL | `http://localhost:8080/` |
| Frontend API base | `VITE_API_BASE_URL`, fallback `/api/v1` |
| Database backup | `backend/writable/backups/achievenest_pre_branch_reconciliation_20260909_220829.sql` |
| Backup SHA-256 | `EDC360FD147DCFE09995E15032DCF2C11B1720B0605DF813FAC2CBE91CE8CFE8` |

The backup and `.env` remain ignored and are not committed. No credentials are reproduced in this report.

## Branch comparison and disposition

Counts below are relative to `origin/main` as `main-only / branch-only` after `git fetch --all --prune`.

| Branch | Head | Counts | Classification | Disposition |
|---|---:|---:|---|---|
| `origin/main` | `ceaf341` | `0 / 0` | Merged PR #19 baseline; local `main` was stale | Update only through validated reconciliation PR |
| `origin/audit/project-architecture-linkage` | `e8004d9` | `1 / 88` | Most complete committed WAMP implementation line before local preservation | Superseded by reconciliation branch |
| `preserve/local-wamp-state` | `3fe33e4` | `1 / 89` | Exact recovery point containing all pre-audit local work | Retain until merge and post-merge verification |
| `origin/compat/target-schema-test` | `e516956` | `1 / 3` | Patch content already represented; head is an ancestor of preserved baseline | Merged/superseded; retire after merge |
| `origin/defense/wamp-local` | `425906b` | `1 / 35` | Implementation ancestors are represented; one unique documentation commit is stale (old PHP, frozen SHA, destructive recovery instruction) | Do not cherry-pick; retire after merge |
| `origin/security/evidence-upload-hardening` | `0a77291` | `0 / 16` | Separate backend-only Supabase Storage implementation | Exclude from WAMP baseline; close draft PR |
| `origin/day1/foundation-stabilization` | `970b38e` | `15 / 0` | Ancestor of preserved baseline | Retire after merge |
| `origin/day2/student-achievement-persistence` | `05133a2` | `14 / 0` | Ancestor of preserved baseline | Retire after merge |
| `origin/hr-finalization-p0` | `05133a2` | `14 / 0` | Same head as day2; ancestor of preserved baseline | Retire after merge |
| `origin/review/auth-foundation-migration` | `f8c5120` | `33 / 0` | Ancestor of preserved baseline | Retire after merge |
| `origin/asther/*` | various | older | Old prototypes; sampled unique-looking personnel commit is patch-equivalent in preserved baseline | Archive/retire after merge |

The single commit visible only on `origin/main` is merge commit `ceaf341`; its compatibility content is already reachable from `e516956`, which is an ancestor of the selected baseline. A merge commit was therefore not replayed merely to reproduce topology.

## Reconciled implementation decisions

### Included

- Current React, CodeIgniter, WAMP, and MySQL implementation from the preservation commit.
- All compatibility work reachable from `compat/target-schema-test`.
- Current personnel evaluation Plan K/K5 and D2 work present in the frozen local state.
- Local JWT/session authentication, local credential lifecycle, centralized CodeIgniter authorization, protected filesystem evidence storage, and MySQL canonical migrations.

### Reconciled or removed

- Removed `@supabase/supabase-js`, its lockfile dependencies, the committed client configuration/fallback project credentials, hosted session restoration, hosted password recovery route, and frontend hosted-auth fallback.
- Removed backend Supabase authentication/admin services and converted runtime authentication, password reset, and provisioning paths to local CodeIgniter/MySQL behavior.
- Changed default/development CodeIgniter connections from PostgreSQL to MySQL/WAMP-safe defaults.
- Quarantined two PostgreSQL-only historical PHPUnit E2E classes under `legacy-postgres`; they are retained for historical evidence but excluded from the current WAMP test suite.
- Kept the 64 legacy migration files isolated. The verifier no longer assumes a stale fixed file count and validates the canonical MySQL namespace for PostgreSQL syntax instead.
- Scoped permanent-reference fingerprints to the five canonical seeded college IDs, allowing separately managed colleges such as CEAC to remain intact.
- Updated the Phase 7 provisioning fixture for current required `sex` and `academic_year` validation.

## Validation evidence

| Gate | Result |
|---|---|
| Frontend production build | PASS — Vite 8.1.5, 2,092 modules transformed |
| Frontend Vitest regression | PASS — 166 files, 2,110 tests |
| Live frontend/backend E2E | PASS — 10 persona logins, scope isolation, reset request, local-token proof |
| Backend PHP lint | PASS — 288 application PHP files, 0 syntax errors |
| PHPUnit | PASS — 113 tests, 942 assertions |
| WAMP database connection | PASS — MySQLi, MySQL 8.4.7, `achievenest_local` |
| Migration dialect verifier | PASS — 64 legacy files isolated; canonical namespace has no PostgreSQL-only constructs |
| Guarded fresh MySQL replay | PASS — 63 business tables |
| Fresh replay schema SHA-256 | `8cabe3d2c9062409f63bcd0d9c3174bf4ab7e886ffda45cf35932ffad7029789` |
| Fresh replay reference SHA-256 | `4b086ddbeea0d570b42003e192e2f5229a4722d40df7f0c7982e50f4c3a5c7ca` |
| Plan K Phase K4 remediation | PASS — 21/21 guarded disposable-database checks |
| Phase 15 master backend gate | PASS — 8/8 suites |
| Phase 7 auth/provisioning | PASS — 27/27 |
| Phase 8 authorization | PASS — 36/36 |
| Phase 9 storage/security | PASS — 28/28 |
| Phase 11 reference data | PASS — 24/24 |
| Phase 12 demo personas | PASS — 36/36 |
| Phase 13 portfolio lifecycle | PASS — 40/40 |
| Phase 14 awards | PASS — 46/46 |
| Phase 14 remaining workflows | PASS — 30/30 |

The canonical replay used disposable database `achievenest_phase17m_reconciliation`; the K4 suite used an isolated SQLite test database. Neither destructive suite targeted `achievenest_local`.

## Migration status interpretation

`php spark migrate:status` lists the legacy `App` namespace as unapplied because the current WAMP database was established through the separate canonical MySQL package. Running `php spark migrate` against the protected database would attempt obsolete PostgreSQL-era migrations and is prohibited. The authoritative installation/replay path is `Phase17Canonical`, guarded by the disposable `achievenest_phase17m_*` database-name rule.

## Branch retirement plan

After the reconciliation PR is reviewed, merged, and post-merge tests pass:

1. Close the draft `security/evidence-upload-hardening` PR as incompatible with the WAMP architecture.
2. Close any remaining compatibility PR whose content is already in `main`.
3. Retain `preserve/local-wamp-state` temporarily as the explicit recovery branch.
4. Archive/delete `audit/project-architecture-linkage`, `defense/wamp-local`, `compat/target-schema-test`, day1/day2/review/HR branches, and old `asther/*` branches only after confirming no open work references them.
5. Delete the preservation branch last, after the updated `main` has passed post-merge validation and the database backup retention decision is recorded.

No branches were deleted during reconciliation.

## GitHub merge gate and CHU-01 Phase 2 readiness

Local reconciliation and validation are complete, and the branch has been pushed. GitHub CLI is not installed in this environment, unauthenticated GitHub API access did not expose the repository PR state, and the available browser connection could not initialize. Therefore PR creation/review/approval and the final merge into `main` remain external gates; `main` must not yet be declared authoritative. The prepared PR page is `https://github.com/Astherisk1229/AchieveNest/pull/new/reconcile/wamp-current`.

CHU-01 Phase 2 is technically ready against `reconcile/wamp-current`, but implementation must begin only after:

- the reconciliation branch is pushed;
- its PR targets current `main`;
- required review/approval is recorded;
- the PR is merged; and
- the same build, PHPUnit, Phase 15, and smoke gates pass on updated `main`.

No repository file matching a CHU-01 Phase 2 implementation plan was present, so no plan header was modified. This report is the authoritative readiness note until that plan is added or identified.
