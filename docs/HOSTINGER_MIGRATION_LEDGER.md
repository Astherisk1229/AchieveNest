# AchieveNest Hostinger Migration Ledger

This ledger records controlled ports from `reconcile/wamp-current` into `deployment/hostinger-readiness`. A port is accepted only after its associated verification passes.

## Target baseline

- Target branch baseline: `8c753cd` (`deployment/hostinger-readiness`)
- Source branch: `reconcile/wamp-current`
- Policy: no wholesale branch merge; no restoration of active Supabase/PostgreSQL runtime architecture

## Port group B1 — MySQL migration and CodeIgniter configuration foundation

| Field | Record |
|---|---|
| Source commits | `e2f1361`, `1d55064`, `5cd1f30`, `265e2ef` |
| Target commits | `1a0b01a`, `9ffe43e`, `1bfb08e`, `cbcea29` |
| Purpose | Add deterministic MySQL migrations 000001–000010, apply verified FK/generated-column corrections, configure CodeIgniter MySQLi, and add DB/health verification commands |
| Dependency review | Migration package is self-contained; configuration commit depends on it only for validation expectations |
| Unrelated work | None found in the selected source commits |
| Conflicts | None |
| Resolution | Cherry-picked commits without modification |
| Verification | PHP syntax; CodeIgniter route boot; `db:verify-defense` against configured WAMP MySQL |
| Result | **PARTIAL PASS / NOT ACCEPTED** — syntax, framework boot, and live connection passed. Fresh replay is blocked because the configured DB user cannot create a disposable database. |

Observed connection verification: MySQLi, MySQL 8.4.7, database `achievenest_local`, application user, UTF-8 connection, and reference-table reads passed. The populated database was not modified.

## Port group B2 — Local credentials, sessions, JWT, and frontend auth integration

| Field | Record |
|---|---|
| Source commit | `52c21aa` |
| Target commit | `2d85a16` |
| Purpose | Add migration 000011, credential/session seed support, `LocalAuthService`, `LocalTokenService`, login/logout/current-user/password-change endpoints, authenticated actor integration, and frontend JWT session flow |
| Dependency review | Requires B1 migrations 000001–000010 and configuration; migration 000011 supplies local credential/session tables |
| Unrelated work | No later application-feature commits included |
| Conflicts | `backend/app/Config/Routes.php` differed because the Hostinger branch retained the original escaped controller notation |
| Resolution | Preserved every existing route and added only `auth/login` and `auth/logout` plus OPTIONS routes; retained the branch's established controller-string style |
| Verification | PHP syntax passed for all changed PHP files. Phase 7 auth verification was attempted against the existing configured DB. |
| Result | **BLOCKED / NOT ACCEPTED** — the existing DB is from a later reconciled schema where `must_change_password` no longer resides on `profiles`; the source Phase 7 verifier correctly requires a clean 000001–000011 replay. The configured DB user cannot create that disposable database. |

No authorization or storage group will be ported until B1/B2 pass against a clean disposable schema.

## Required unblock

Create an empty disposable MySQL database named `achievenest_hostinger_phaseb_verify_20260910` and grant the configured `achievenest_app` user full privileges on that database, or provide the name of another empty disposable database already granted to that user. No production or populated database should be supplied.

