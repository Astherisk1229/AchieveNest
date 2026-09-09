# AchieveNest Hostinger Migration Ledger

This ledger records controlled ports from `reconcile/wamp-current` into `deployment/hostinger-readiness`. A port is accepted only after its associated verification passes.

## Target baseline

- Target branch baseline: `8c753cd` (`deployment/hostinger-readiness`)
- Source branch: `reconcile/wamp-current`
- Verification database: `achievenest_hostinger_phaseb_verify_20260910` only
- Policy: no wholesale branch merge; no active Supabase/PostgreSQL runtime architecture

## B1 — MySQL migration and configuration foundation

| Field | Record |
|---|---|
| Source | `e2f1361`, `1d55064`, `5cd1f30`, `265e2ef`; selected MySQL-only configuration from `48e7b87` |
| Target | `1a0b01a`, `9ffe43e`, `1bfb08e`, `cbcea29`, `72d7f89` |
| Purpose | Deterministic MySQL migrations 000001–000011, FK/generated-column corrections, MySQLi runtime configuration, and connection verification |
| Dependencies | MySQL 8.4; application account scoped to the disposable database |
| Unrelated work excluded | PostgreSQL replay, Phase 17M, and K4 SQLite configuration from `48e7b87` |
| Conflicts/resolution | No cherry-pick conflicts. Configuration was manually scoped to the default, development, test, and local-defense MySQL groups. |
| Verification | Empty database confirmed; all 11 SQL files replayed in order; 57 tables created; `db:verify-defense` confirmed the exact runtime DB and expected reference counts. |
| Result | **PASS / ACCEPTED** |

## B2 — Local credentials, JWT sessions, and authentication flow

| Field | Record |
|---|---|
| Source | `52c21aa`; compatible local-only portions of `48e7b87` |
| Target | `2d85a16`, `2de1939`, `72d7f89` |
| Purpose | Local credential/session schema, `LocalAuthService`, `LocalTokenService`, login/current-user/logout/password-change/reset/provisioning, and authenticated actor resolution |
| Dependencies | B1 migration 000011 and MySQL runtime |
| Unrelated work excluded | Later account-lifecycle and provisioning features that require post-Phase-B schema |
| Conflicts/resolution | Routes conflict preserved all Hostinger routes and added only local auth routes. Mixed reconciliation files were ported selectively instead of cherry-picking the whole commit. Generated credentials/tokens were redacted from verifier output. |
| Verification | PHP syntax; CodeIgniter boot through Spark; Phase 7 authentication suite 27/27; logout/revocation, password change, reset, and provisioning included. |
| Result | **PASS / ACCEPTED** |

## B3 — Centralized authorization and protected API behavior

| Field | Record |
|---|---|
| Source | `42de10d`, `d683659` |
| Target | `d2f8c11`, `74dab59` |
| Purpose | Authenticated actor resolution, authorization service/policies, controller enforcement, and removal of legacy Supabase achievement-route behavior |
| Dependencies | B1 and B2 |
| Unrelated work excluded | Candidate-threshold endpoint embedded in `42de10d` |
| Conflicts/resolution | `StudentPortfolioController` used the tested source authorization implementation. `AwardEvaluationController` retained the authorization changes but omitted the unrelated threshold endpoint. |
| Verification | PHP syntax; Phase 7 remained 27/27; Phase 8 authorization suite 36/36, including negative cross-user/scope checks and protected achievement API smoke tests. |
| Result | **PASS / ACCEPTED** |

## B4 — Frontend local JWT integration and Supabase removal

| Field | Record |
|---|---|
| Source | Selected frontend files from `48e7b87`; local password-change behavior from current `reconcile/wamp-current` |
| Target | `72d7f89` |
| Purpose | Remove Supabase Auth client/session/password flows and package dependency; use CodeIgniter local JWT login, session hydration, logout, and password change |
| Dependencies | B2 API endpoints |
| Unrelated work excluded | Later UI/application feature changes |
| Conflicts/resolution | Removed obsolete recovery page/route and Supabase client; updated the existing account page only at its password-change integration point. Updated the regression expectation for the canonical local API payload. |
| Verification | Production Vite build PASS; Vitest 23 files and 139 tests PASS; no active Supabase import/package reference remains in frontend runtime code. |
| Result | **PASS / ACCEPTED** |

## B5 — Protected local evidence storage

| Field | Record |
|---|---|
| Source | `37d4251` |
| Target | `ddac0b5` |
| Purpose | Private local evidence storage, server-side validation, metadata/download endpoints, and access-control enforcement |
| Dependencies | B2 authentication and B3 authorization |
| Unrelated work | None identified |
| Conflicts/resolution | Routes conflict preserved the target branch's controller-string convention and added only Phase 9 evidence routes. |
| Verification | PHP syntax; Phase 9 storage suite 28/28, including MIME/size rejection, opaque names, path non-disclosure, authorization, rollback, and orphan integrity. |
| Result | **PASS / ACCEPTED** |

## Final Phase B replay and regression gate

The approved disposable database was dropped and recreated. `achievenest_app@localhost` was granted privileges only on that database. Migrations 000001–000011 replayed successfully from empty and produced 57 tables.

Final results against the freshly replayed database:

- CodeIgniter/MySQL connection and reference data: **PASS**
- Phase 7 authentication: **27/27 PASS**
- Phase 8 authorization: **36/36 PASS**
- Phase 9 protected storage: **28/28 PASS**
- Frontend production build: **PASS**
- Frontend regression suite: **139/139 PASS**

The Phase 8/9 command banner still says `achievenest_local`; that text is a static legacy label. `db:verify-defense` immediately before the suites confirmed both configured and runtime database names were `achievenest_hostinger_phaseb_verify_20260910`.

## Phase B disposition

**COMPLETE / ACCEPTED.** No populated database was migrated or modified. Phase C may proceed from this branch.
