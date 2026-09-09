# PR #22 Reconciliation and Merge Audit Report

Date: 2026-09-09 (Asia/Singapore)  
Pull request: `reconcile/wamp-current` → `main`  
Repository: `Astherisk1229/AchieveNest`  
Decision: **repair PR #22; do not replace it; do not merge yet**

## Frozen baseline

- `origin/main`: `ceaf341ddd266a2bdf0fd4fe0bd9d01cdfbca845`
- Audited PR head before repair: `cf9e678fe54daea80b289888ffa4c9dde3f100c0`
- Repaired and documented PR head before this report-finalization commit: `8206848badbe8a255ab0bd65ea2694b98a1aaa0e`
- Preservation branch/commit: `preserve/local-wamp-state` at `3fe33e4`
- Current worktree was clean after the repair commits.

The PR head was fetched independently through `refs/pull/22/head` and matched the reconciliation branch before repair.

## Scope audit

At the repaired head, the merge-base diff against `origin/main` contains 4,085 paths: 2,768 additions, 1,174 deletions, 142 modifications, and one exact rename. It contains 93 commits.

The apparent size is dominated by two explainable classes:

- 2,273 documentation and evidence paths, produced by the repository's staged implementation/audit plans;
- 1,074 dependency-tree paths under the obsolete tracked `backend/development/node_modules` area, deleted by the WAMP reconciliation.

Together these account for approximately 82% of the original 4,076-path PR. The implementation-bearing remainder includes 374 frontend source paths, 169 backend source paths, 65 SQL/baseline paths, 51 database migration paths, five seeders, and a small number of configuration/manifests.

Commit history is coherent and phase-oriented: MySQL migration work, local authentication, CodeIgniter authorization, evidence storage, award workflows, regression phases, and the later personnel-evaluation plans are separately recorded. Replacing the PR with a synthetic branch would discard useful provenance while reproducing essentially the same validated implementation delta. Repairing PR #22 is therefore safer.

## Repairs made

### Commit `5d368e5`

- Moved the student-only render branch in `AccountPage.jsx` below all Hooks, removing 11 `rules-of-hooks` lint errors without changing the student view.
- Corrected the missing `Building2` icon import in `OnboardPersonnelModal.jsx`.
- Removed ten tracked Supabase/PostgreSQL-only development scripts and their private dependency manifest/lockfile.
- Removed a tracked runtime backup snapshot from `backend/writable/backups`; runtime backups remain ignored.

### Commit `ed33d39`

- Changed the K4 environment assertion to inspect tracked `backend/.env.example` instead of requiring the untracked local `backend/.env` file. The assertion still requires `ACHIEVENEST_ENV = local-defense`.

No lint rules, assertions, or live integration tests were disabled.

## Verification results

| Gate | Result | Evidence |
|---|---|---|
| Clean `npm ci` | PASS | 119 packages installed from lockfile |
| `npm run lint` | PASS | exit 0; pre-existing non-blocking warnings remain |
| Deterministic frontend suite | PASS | 165 files, 2,093 tests |
| K4 security/migration/regression suite | PASS | 50/50 tests in the clean checkout |
| `npm run build` | PASS | 2,092 modules transformed; production bundle emitted |
| `composer validate --no-check-publish` | PASS WITH WARNING | manifest valid; exact `firebase/php-jwt` constraint warning |
| Clean `composer install` | PASS | 34 locked packages installed |
| Backend PHPUnit | PASS | 113 tests, 941 assertions |
| `php spark routes` | PASS | CodeIgniter route table loaded with security/CORS filters |
| Canonical MySQL replay | PASS (prior reconciliation gate) | clean replay produced 63 tables |
| Phase 15 workflow gate | PASS (prior reconciliation gate) | 8/8 |
| Plan K/K4 focused gate | PASS (prior reconciliation gate) | 21/21, plus current 50/50 static regression suite |

## Unresolved gates

### Frontend CI topology

The exact GitHub frontend command runs `npm run test`, which includes `liveE2EIntegration.test.js`. That suite requires:

- a running CodeIgniter API at `http://localhost:8080/api/v1`;
- a seeded MySQL database;
- `ACHIEVENEST_DEMO_PASSWORD` or an untracked local `backend/.env`.

The Windows frontend job provisions none of these. In a clean checkout the deterministic 2,093-test suite passes, while the live suite fails because the required environment is absent or does not match the active local WAMP fixture. The live test was deliberately not skipped or removed merely to turn CI green.

Before merge, choose and implement one governed solution:

1. expand CI to start and seed a disposable MySQL/CodeIgniter environment and supply a protected demo credential; or
2. explicitly separate deterministic CI tests from a required live-integration check, with branch protection requiring both in the appropriate environment.

### Dependency advisories

The lockfile was updated with npm's non-breaking remediations: `react-router-dom`/`react-router` 7.18.1 → 7.18.3, `postcss` 8.5.22 → 8.5.28, and `nanoid` 3.3.16 → 3.3.18. This removed all three high findings and one moderate finding. Two moderate development-only findings remain in `vitest`/`@vitest/mocker`; npm offers only the major-version Vitest 5 upgrade. That upgrade should be handled as a separately reviewed change rather than forced into this already large reconciliation.

### Governance

- One independent approving review with write access is still required.
- GitHub checks must be rerun against the pushed repaired head.
- The PR must not be self-approved or merged while either the frontend topology gate or dependency/security disposition remains unresolved.

## Security and artifact review

- No tracked private key, AWS access-key pattern, GitHub token pattern, OpenAI secret-key pattern, or `SUPABASE_SERVICE`/`SUPABASE_SECRET` variable was found in non-documentation source.
- The only tracked environment inputs are `backend/.env.example` and CodeIgniter's template `backend/env`; the local `.env` remains untracked.
- Remaining `service_role` references are historical migration/roadmap or agent-skill text, not active frontend/backend Supabase credentials.
- The largest tracked files are expected campus assets, auditable test-result evidence, and MySQL defense snapshots; no single tracked file exceeded approximately 1.14 MB.

## Merge and rollback recommendation

Do not merge at `8206848`. After the unresolved gates are closed and an independent approval exists, use a normal merge commit so the phase history and reconciliation boundary remain visible. Record the final PR head, merge commit, CI check URLs, approver, and post-merge smoke results.

Rollback anchor before any eventual merge: `ceaf341ddd266a2bdf0fd4fe0bd9d01cdfbca845`. Database rollback must use the validated pre-merge WAMP backup and replay procedure; Git rollback alone is not sufficient for schema changes.
