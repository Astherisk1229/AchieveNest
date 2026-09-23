# CURRENT AchieveNest Repository Reconciliation Report

Audit date: 2026-09-21
Repository: `C:\Users\Admin\Documents\AchieveNest`
Method: read-only Git/source inspection. No migrations, seeds, recovery commands, database writes, package installation, staging, commit, push, reset, clean, or code fixes were performed. This report is the sole file written.

Evidence labels used below: **VERIFIED FACT**, **INFERENCE**, **OWNER DECISION REQUIRED**, and **UNKNOWN**.

# 1. Executive Summary

- **VERIFIED FACT:** Branch `reconcile/wamp-current` is at `c71c130114ca9936e0c856ac30451ae2d0e1df13` (`chore: ignore local runtime and generated artifacts`). HEAD has not advanced beyond the prior cleanup commit.
- **VERIFIED FACT:** The branch has diverged from `origin/reconcile/wamp-current`: local has one commit not on remote and remote has eight commits not local. The eight remote-only commits culminate in merge `0756a82` for PR #23.
- **VERIFIED FACT:** The worktree contains 172 unstaged modifications, 11 unstaged deletions, 410 untracked files, zero staged changes, and 3,287 tracked files. The tracked diff is 183 files, 8,936 insertions and 9,498 deletions.
- **VERIFIED FACT:** Untracked work is dominated by 105 documents, 80 frontend source files, 58 frontend tests, 48 migrations, 35 backend tests, 34 backend services, 28 backend commands, and 18 backend controllers.
- **VERIFIED FACT:** A tracked MySQL backup (`backend/database/mysql-defense/achievenest_local_pre_phase_g_backup.sql`) contains password hashes, session/token-related fields, and institutional email data. Many adjacent tracked backup snapshots have the same finding profile.
- **VERIFIED FACT:** The two previously questioned award services remain modified. Both are PHP-syntax-valid and have current callers and targeted tests. Their Phase A.0 work now appears substantially implemented (fail-closed metadata, cycle scoping, threshold/configuration validation, duplicate-evidence handling), but full behavioral completeness is **UNKNOWN** because the related tests were not run and the work depends on a large uncommitted schema/API set.
- **INFERENCE:** This is not a cleanup-sized change. It is a multi-track integration workspace combining personnel/ranking, HR/Dean, awards, OCR, authentication, UI redesign, migrations, fixtures, and documentation. It should not be committed as one unit.
- **Exact safest next action:** create a protected backup branch/tag of the current worktree state without staging it, then reconcile the eight remote-only B.2B commits into a separate clean integration worktree before making any commit-selection decision. First resolve the tracked SQL-backup/history policy and migration-chain authority.

# 2. Current Git State

## Snapshot

| Item | Current value |
|---|---:|
| Branch | `reconcile/wamp-current` |
| HEAD | `c71c130114ca9936e0c856ac30451ae2d0e1df13` |
| Total tracked files | 3,287 |
| Staged modified / added / deleted | 0 / 0 / 0 |
| Unstaged modified | 172 |
| Unstaged deleted | 11 |
| Untracked | 410 |
| Ignored | Large dependency/runtime population; exact count was practical only as a Git ignored-entry count, not a semantic file count |
| Tracked diff | 183 files; +8,936 / -9,498 |

**VERIFIED FACT:** `git diff --cached --stat` and `--name-status` are empty. Nothing is staged.

Recent local history:

1. `c71c130 chore: ignore local runtime and generated artifacts`
2. `657d746 docs: finalize PR 22 gate status`
3. `8206848 docs: record PR 22 reconciliation audit`
4. `ed33d39 test: make K4 environment assertion checkout-safe`
5. `5d368e5 fix: clear PR 22 frontend lint blockers`

# 3. Changes Since Previous Cleanup

**VERIFIED FACT:** `c71c130` still exists and is exactly HEAD; therefore there are no local commits after it. All current project changes are unstaged or untracked.

Remote-only commits, oldest to newest:

- `56792bc` strengthen Student provisioning field contract
- `c3fa3a0` hardened Student account provisioning modal
- `0af14c2` route modal to hardened implementation
- `97b8e09` provisioning normalization tests
- `a7a6e8b` authoritative person-name validation
- `3114283` initials-policy sanitizer alignment
- `6913dcc` canonical provisioning compatibility
- `0756a82` merge PR #23

**BLOCKER:** current local changes overlap authentication, provisioning, routes, frontend UI, tests, seeders, and canonical schema areas touched by the remote series. A normal pull/merge in this dirty worktree is unsafe.

# 4. Gitignore Audit

## Verified coverage

The requested rules remain present and match test paths:

- `/.impeccable-cache/`
- `/.tmp-k-doc-render/`
- `/.tmp-*.log`
- `/output/`
- `/backend/writable/*.log`
- `/backend/writable/*_dump.json`
- `/backend/writable/*_validation_results.json`
- `/backend/writable/personnel-template-debug/`
- `/backend/public/uploads/`

Backend ignore rules also cover `.env`, Composer `vendor/`, writable cache/log/session/upload/debugbar directories, coverage, IDE files, results, demo credentials, backups, and restore-test runtime directories. Frontend rules cover logs, `node_modules`, `dist`, local files, IDE files, and common package-manager logs.

## Gaps and cautions

- **VERIFIED FACT:** `/frontend/src/assets/ndmu_login_bg-ocr.txt` is not ignored. Add only after confirming it is generated rather than source evidence.
- **VERIFIED FACT:** root `.cursor/` is untracked and not ignored. It contains local editor/rule material and needs owner policy.
- **VERIFIED FACT:** numerous SQL backups are already tracked; ignore rules cannot protect tracked files.
- **INFERENCE:** generated reports under `docs/debug`, performance inventories, and one-time evidence reports are not covered because many may be intentional records. Blanket-ignore would be too broad.
- **INFERENCE:** `/output/` and `/backend/public/uploads/` are appropriately scoped. The `*.dump` pattern is broad but reasonable for database artifacts; it does not cover `.sql` backups.

# 5. Worktree Classification

The exact 593-entry worktree inventory is represented by `git status --short --untracked-files=all`. Classification by inspected family follows.

| Class | Paths/families | Status | Version-control recommendation | Review | Risk |
|---|---|---|---|---|---|
| A Application source | 48 modified backend files; 135 modified frontend files; 18 untracked controllers; 34 untracked services; 80 untracked frontend source files | M/U/D | Keep feature-coherent source only | Required | HIGH |
| B Database migration | 48 untracked migrations across App and Phase17Canonical, plus guard/inspector helpers | U | Keep only after migration-authority review | Mandatory | HIGH |
| C Database seed | three modified defense/local seeders | M | Keep if aligned with canonical schema and explicitly demo-only | Mandatory | HIGH |
| D Test | 2 modified backend tests, many modified frontend tests, 35 untracked backend and 58 untracked frontend tests | M/U/D | Keep with matching feature groups | Required | MEDIUM |
| E Developer tooling | `.cursor/`, start script, audit/inspect commands | U | Selectively keep/document; ignore editor-local material | Required | MEDIUM |
| F Production command | activation commands and some operational lifecycle commands | U | Keep only with safety/idempotence docs | Mandatory | HIGH |
| G Recovery/migration utility | `Apply*`, `ReconcileCanonicalMigrationBaseline`, bridge preflight/guard tools | U | Recovery-only unless converted to migrations | Mandatory | HIGH |
| H Acceptance/fixture tool | `Prepare*`, many `Verify*` commands | U/M | Prefer tests; retain fixture commands only with cleanup guarantees | Mandatory | HIGH |
| I Documentation | 105 untracked docs plus existing modified report candidates | U/M | Curate; implementation truth may be retained | Required | MEDIUM |
| J Generated/runtime | SQL backups, debug evidence, OCR sidecar candidate, output/debug artifacts | tracked/U | Do not commit new runtime data; tracked backups need remediation decision | Mandatory | HIGH |
| K Security-sensitive | `.env.example`, auth/seed/verification code, tracked SQL backups, identity audit docs | M/tracked/U | Sanitize and restrict | Mandatory | CRITICAL |
| L Possible one-time script | `Apply*`, `Prepare*`, most plan/phase verification commands | U/tracked | Convert to test or archive outside production command registry | Mandatory | HIGH |
| M Intentional deletion | 11 files listed in section 16 | D | Likely intentional architecture cleanup, but verify imports/routes | Required | MEDIUM |
| N Owner decision | SQL backups, 105 docs, `.cursor`, bridge duplicates, local fixture commands | mixed | Hold out of commits | Mandatory | HIGH |

# 6. Functional Change Groups

| Domain | Representative files | Assessment |
|---|---|---|
| Authentication/RBAC | `AuthController`, `LocalAuthService`, `AuthenticatedActorService`, `AuthorizationService`, `ActiveRoleGuard`, role utilities/tests | Broad end-to-end changes exist. **INFERENCE:** internally related, but overlapping remote B.2B auth/provisioning commits make current integration status unknown. |
| Personnel master data | `TargetHRPersonnelController`, HR directory UI/services, classification/faculty services, new import/profile/credential services | Backend, frontend, routes, tests, and migrations exist. High breadth; batch import and credential workflows need isolated validation. |
| Ranking/promotion/tenure | new evaluation periods, ranking cycles, rank placement, applied/recommended/final review controllers/services/migrations | Appears architecturally complete by layer, but canonical bridge duplicates App migrations and activation/recovery commands create authority risk. |
| Dean/annual review | modified Dean controller/service/UI plus new workspace/import controller and five canonical migrations | Layer coverage exists. Canonical migration sequence includes a destructive marker and data reconciliation; requires fresh-chain review. |
| Portfolio/booklet/evidence | accomplishment/submission controllers, portfolio hooks/pages, booklet modal, evidence storage/upload/access services | Broad coordinated changes. `ApplyPersonnelBookletIntegritySchema` suggests schema may also be applied outside migrations: partial authority problem. |
| OCR/document verification | new OCR controller/services/tests/docs; `OcrExtractionService`; official-document and public verification controllers | Backend/frontend/docs/tests exist. External executable defaults and private-document handling require portability/security review. |
| Awards/scoring/candidates | modified award services/controller/policies/UI; deleted legacy candidate page/model/services; extensive SA-01/SA-02 docs/tests | New architecture appears to replace legacy modules. Scoring is fail-closed and cycle-aware; full behavior remains unverified. |
| OSAD | awards, candidates, reports, audit, organizations, navigation/UI | Large replacement/refinement set; deleted old review page/modal/services appear replaced by workspace/controller paths. |
| Student | portfolio/achievement UI/controllers/policies | Coordinated changes exist, but remote B.2B Student provisioning work is absent locally and must be reconciled first. |
| Notifications | new controller/routes and modified popover/registry/service | Backend and frontend exist; route-method consistency appears present from source names, but no runtime route check was run. |
| UI/theme/navigation | `App.jsx`, layout, theme, navigation catalogs, many pages | Cross-cutting design changes are too broad for a single feature commit. |

# 7. Partial / Unfinished Implementation Findings

## Award services

- **VERIFIED FACT:** both `AwardScoringService.php` and `AwardPotentialCandidateService.php` are modified and pass `php -l`.
- **VERIFIED FACT:** callers exist in `AwardReviewService`, `AwardEvaluationController`, and verification commands. Tests exist in `AwardScoringFailClosedPhase1BTest`, `AwardScoringConfigurationPhase1BTest`, and authorization tests.
- **VERIFIED FACT:** changes add cycle scoping, configured-threshold validation, proposed-authority rejection, API-contract projection, duplicate-evidence elimination, computable-max reconciliation, explicit contribution traces, and fail-closed handling for missing roles/scopes/results.
- **INFERENCE:** prior Phase A.0 placeholders are no longer visibly incomplete. No meaningful TODO/FIXME/WIP/debug dump was found in these two files.
- **UNKNOWN:** behavioral completeness and caller compatibility until targeted PHPUnit tests run against the intended schema. `invalidateCandidateClassification` now requires a cycle ID; all runtime callers require verification.

## Whole changed tree

- No meaningful `dd()`, `var_dump()`, `print_r()`, `die()`, or `NOT_IMPLEMENTED` finding was confirmed in the changed-source scan.
- Comments containing “TEMP” or debug terminology in verification/audit tooling are not automatically defects.
- **INFERENCE:** the real partial-implementation signal is not placeholder text but parallel schema/application paths: bridge migrations plus App migrations plus Apply/Reconcile commands.

# 8. Migration Audit

**VERIFIED FACT:** repository currently contains 90 App migration PHP files and 23 Phase17Canonical migration PHP files. Forty-eight migration-related files are untracked.

## Current untracked migration families

1. `2026-09-10-*`: personnel achievement usage, canonical classification, duplicate hash.
2. `2026-09-11-*`: evaluation periods, hardening, ranking-criteria classification, Dean end metadata.
3. `2026-09-12-*`: scale governance, source-driven criteria seeding, employment start date, evaluation-status alignment.
4. `2026-09-13-000009..000013` canonical: annual-review ratings/imports/binding/reconciliation/evaluation start.
5. `2026-09-15-000001..000015` App: department heads, ranking cycles, period concurrency, placement, faculty transitions, credentials, suggestions, decisions, official documents, offline approvals, recovery/correction.
6. `2026-09-16-000001..000015` canonical bridges: one-for-one bridge counterparts to the September 15 App sequence.
7. `September15BridgeGuard.php` and `September15BridgeSchemaInspector.php`: helper classes in the migration directory, not timestamped migrations.

## Risk findings

- **VERIFIED FACT:** no duplicate timestamp basename was detected within the combined migration directories.
- **VERIFIED FACT:** multiple canonical bridge files explicitly correspond one-for-one with App migrations. This is intentional-looking duplication but creates dual-chain authority risk.
- **VERIFIED FACT:** bridge files include backfills/seeds and destructive operations (constraint/index/column drops). They are not uniformly reversible; several omit ordinary `down()` semantics and delegate/guard instead.
- **VERIFIED FACT:** `2026-09-13-000009` includes destructive rollback behavior; `000012` backfills data. September 15/16 ranking migrations mix schema and data reconciliation.
- **INFERENCE:** canonical bridges depend on the App implementation classes and schema inspector/guard. Moving or committing only one side would break the chain.
- **OWNER DECISION REQUIRED:** choose whether App migrations remain authoritative with canonical wrappers, or whether canonical receives independent implementations. Do not run either chain before this is decided and tested on an empty disposable database.

# 9. Command / Script Audit

## Specifically requested commands

| Command file | Purpose / behavior | Mutation | Assessment |
|---|---|---:|---|
| `ApplyPersonnelBookletIntegritySchema.php` | Directly applies booklet integrity schema | Yes/likely DDL | RECOVERY ONLY; duplicates migration responsibility |
| `ApplyPersonnelEmploymentFoundation.php` | Direct employment-foundation schema application | Yes/likely DDL/DML | RECOVERY ONLY |
| `ApplyRankingCriteriaFix.php` | Direct ranking criteria repair | Yes/likely DML | LIKELY ONE-TIME |
| `ApplySourceDrivenRankingCriteria.php` | Applies source-driven criteria outside normal migration | Yes | RECOVERY ONLY; overlaps migration `2026-09-12-000006` |
| `ReconcileCanonicalMigrationBaseline.php` | Reconciles canonical migration ledger/baseline | Yes | RECOVERY ONLY; highest migration-ledger risk |
| `PreflightSeptember15Bridge.php` | Inspects bridge readiness | Intended read-only | KEEP WITH DOCUMENTATION; verify every query before use |

## Other untracked commands

- `ActivateDueApprovedRanks`, `ActivateDueRankPlacements`: production-like scheduled mutations; **KEEP WITH DOCUMENTATION** only after idempotence/concurrency tests.
- `AuditJmorteIdentity`: identity-specific audit; **OWNER DECISION REQUIRED**, security-sensitive and probably local-only.
- `InspectAwardCriteriaMatrix`, `InspectAwardMasterInventory`, `InspectAwardRuleMap`, `InspectCategoryMappingMatrix`, `InspectConditionMatrix`, `InspectSharedDependencyMatrix`, `InspectSubcategoryMappingMatrix`: read-only inspection family; **KEEP WITH DOCUMENTATION** or convert outputs to tests.
- `PrepareDeanAnnualReviewAcceptanceFixture`, `PrepareDeanPortfolioEvaluationAcceptance`: mutate fixture data; **ACCEPTANCE/FIXTURE TOOL**, not production-safe without cleanup.
- `VerifyCHU01Phase2PersonnelRules`, `VerifyCHU03Workflows`, `VerifySA01ValidationCases`, `VerifySA02ValidationCases`: inspection-oriented by source scan; **CONVERT TO TEST** where assertions are deterministic.
- `VerifyCHU01Phase3OrgDemoData`, `VerifyCHU02Workflows`, `VerifyDeanAnnualReviewEligibilityLive`, `VerifyHRPersonnelProvisioningDirectory`, `VerifyPasswordChangeRemediation`, `VerifyPostMigrationEligibilitySnapshot`: source scan detects DB mutation; **ACCEPTANCE/RECOVERY ONLY**.

## Existing command estate

**VERIFIED FACT:** numerous existing `Audit*`/`Verify*` commands also mutate databases despite read-like names. Production suitability cannot be inferred from naming. Commands flagged as mutating must never be included in a generic “verification” runbook without explicit disposable-database guards and cleanup.

# 10. Security Findings

Values were not reproduced.

| Path | Finding type | Tracked? | Risk | Recommendation |
|---|---|---:|---|---|
| `backend/database/mysql-defense/achievenest_local_pre_phase_g_backup.sql` | Password hashes, session/token material, institutional emails; 516,443 bytes and 33 INSERT statements | Yes | CRITICAL | Remove from future version control; assess credential rotation and history remediation |
| `backend/database/mysql-defense/achievenest_local_*backup.sql` family | Same classes of database/session/identity material across many snapshots | Yes | CRITICAL | Inventory all backups and decide history rewrite/private archival policy |
| `backend/env` | Credential-like configuration | Yes | HIGH | Compare with `.env.example`; sanitize or remove if it contains live values |
| Defense/demo seeds and verification commands | Demo hashes/accounts and institutional email identities | Mixed | MEDIUM/HIGH | Ensure values are synthetic, documented, and environment-gated |
| Identity-specific docs/commands (`AuditJmorteIdentity`, login reports) | Personal identity/email and operational findings | Mixed | HIGH | Sanitize or keep outside repository |
| Audit/implementation docs | Absolute local paths, usernames, token terminology, institutional emails | Mixed | MEDIUM | Sanitize before commit |

**VERIFIED FACT:** the specifically named pre-Phase-G backup is still tracked and contains private database material. Git history remediation may be required because deletion in a future commit would not erase prior blobs.

# 11. Environment / Portability Findings

- `OcrExtractionService.php`: defaults Tesseract/Poppler executables to Windows installation paths but permits environment overrides. **Classification:** acceptable local fallback only if fully documented; deployment should require environment configuration.
- `scripts/start-achievenest-dev.ps1`: probes `C:\wamp64\bin\php`, binds API `127.0.0.1:8080`, and frontend `localhost:5173`. **Classification:** documented Windows-local tooling, not portable production tooling.
- Numerous tests/verification scripts reference `achievenest_local`, local ports, demo accounts, and absolute fixture paths. **Classification:** test/local fixture if guarded; portability defect if used by CI or production commands.
- OCR/Paddle/Tesseract/Ollama paths and real-document fixtures must remain configurable and must not require private documents for unit tests.

# 12. Dependency Findings

- **VERIFIED FACT:** backend adds `endroid/qr-code` version `6.0`; `composer.lock` is modified and contains seven packages. Manifest/lock changes appear paired.
- **VERIFIED FACT:** frontend changes `npm run dev` to invoke `scripts/start-achievenest-dev.ps1` and adds `dev:frontend` for direct Vite use.
- **VERIFIED FACT:** the frontend lockfile could not be reliably parsed by PowerShell because it contains an empty property name; lock synchronization is **UNKNOWN** without `npm` validation. No frontend dependency addition is visible in `package.json` diff.
- **INFERENCE:** QR-code dependency is plausibly used by certificate/official-document verification. Confirm actual imports before committing.
- **RISK:** making Windows PowerShell orchestration the default `npm run dev` reduces cross-platform portability; keep `dev:frontend`, document Windows-only behavior, or make orchestration opt-in.

# 13. API / Frontend Alignment

- **VERIFIED FACT:** changed routes add notifications, personnel profile/photo, accomplishment detail/draft/duplicate checks, evaluation periods, ranking cycles/rosters, HR organizational structure/import, Dean workspace/imports, scale governance, credentials, rank-placement/decisions, official documents, and related endpoints.
- **VERIFIED FACT:** corresponding untracked controller families exist for the major new route groups, and changed frontend services contain calls to several new scale/personnel endpoints.
- **INFERENCE:** the architecture is broadly layered rather than route-only.
- **UNKNOWN:** exhaustive route-to-method and frontend-to-route equivalence was not proven because no framework route enumeration or test suite was run. The scale of untracked controllers means committing routes without their implementations would break runtime loading.
- **VERIFIED FACT:** deleted award modules still require import/reference verification before deletion is accepted. Source search indicates newer OSAD workspace and controller/service paths are the likely replacement.
- **RISK:** multiple alias routes for portfolio submission/history can be intentional compatibility endpoints but should be documented to avoid permanent duplication.

# 14. Test / Validation Readiness

No test suite was run. Safe future plan:

| Command | Safety | Writes | Prerequisites |
|---|---|---|---|
| `php -l <changed PHP file>` | Read-only/safe | None | PHP available |
| `composer validate --strict` | Safe | May read caches only | Composer available; do not update lock |
| Targeted PHPUnit unit files for scoring, policies, route contracts | Usually safe | May write test cache/temp | Confirm tests use test DB/mocks |
| Feature tests | Conditional | May mutate configured DB | Isolated test DB and explicit environment guard |
| `php spark routes` | Read-only in principle | Framework cache possible | Confirm bootstrap does not connect/mutate |
| `php spark migrate:status` | Read-only DB query | None expected | Disposable DB configuration only |
| Any `Verify*`, `Prepare*`, `Apply*`, activation, reconciliation command | Unsafe by default | Many mutate DB/files | Source-level safety classification and disposable DB |
| `npm run lint` | Safe | None expected | Installed node_modules |
| `npm test -- --run <target>` | Usually safe | Test caches/temp possible | Review target for filesystem/API/DB behavior |
| `npm run build` | Safe to source/DB | Writes `frontend/dist` (ignored) | Installed dependencies |
| OCR unit/service tests with synthetic fixtures | Safe if mocked | Temp files possible | Executables mocked or configured |

# 15. Documentation Findings

- **VERIFIED FACT:** 105 untracked Markdown documents span CHU-01/02/03, SA-01/02, ranking, OCR, performance, HR redesign, debug reports, and reconciliation reports.
- **KEEP:** authoritative cross-role contracts, final handoff reports, developer-ready rule maps, and concise architecture/source audits that directly explain committed code.
- **KEEP BUT SANITIZE:** login/personnel usability reports, identity-bearing evidence, reports with institutional emails, credentials, tokens, or absolute local paths.
- **MOVE/REORGANIZE:** repeated SA matrices and phase-by-phase evidence should be grouped under stable feature folders with an index.
- **ARCHIVE:** superseded phase reports after final consolidated reports are selected.
- **IGNORE:** generated render/debug artifacts, machine outputs, and OCR sidecars that are reproducible.
- **OWNER DECISION:** `GIT_WORKTREE_CLEANUP_REPORT.md`, `.cursor/`, live MySQL verification reports, and identity-specific audit documents.

# 16. Deleted File Review

| Deleted path | Prior purpose | Likely replacement / assessment |
|---|---|---|
| `frontend/src/assets/react.svg`, `vite.svg` | Scaffold assets | Intentional removal; new favicon/branding replaces scaffold |
| `components/osad/CandidatePortfolioReviewDrawer.jsx` | Candidate review drawer | Likely replaced by `OSADStudentAwardReviewWorkspace`; verify imports |
| `models/AwardCandidacyModel.js` and test | Client candidacy model | Likely replaced by backend-authoritative candidate generation/contracts |
| `pages/osad-admin/OSADAwardCandidateReviewPage.jsx` | Legacy review page | Likely replaced by potential-candidates/workspace pages |
| `modals/AwardEvaluationSummaryModal.jsx` | Legacy summary modal | Likely replaced by workspace/summary service presentation |
| `services/AwardPortfolioReviewService.js` and test | Legacy review API service | Likely superseded by OSAD controller/API client paths |
| `services/Stage1CandidateReportService.js` and test | Stage-1 report service | Likely superseded by candidate-generation/report architecture |

**INFERENCE:** deletions are coherent as an award-review architecture replacement, not random loss. **UNKNOWN:** no full import/build validation was run; hold deletion commit until zero references and targeted tests/build pass.

# 17. Recommended Commit Groups

1. `chore: reconcile remote b2b provisioning baseline` — remote-only PR #23 series; do in a clean integration worktree first. Risk HIGH.
2. `feat: add canonical personnel and organizational master data` — classification, profile, HR directory/import, organizational structure, seeds, focused migrations/tests. Depends on group 1. Risk HIGH.
3. `feat: add personnel evaluation periods and dean annual review` — period/Dean/import backend, frontend, migrations/tests. Risk HIGH.
4. `feat: add ranking cycle and rank placement lifecycle` — September 15 App migrations, services/controllers/routes/tests. Exclude canonical bridges pending authority decision. Risk HIGH.
5. `feat: harden personnel portfolio evidence and booklet workflow` — accomplishment/submission/evidence/booklet code and tests. Exclude direct Apply command pending decision. Risk HIGH.
6. `feat: add official evaluation documents and QR verification` — QR dependency, document controllers/services/UI/tests. Risk MEDIUM/HIGH.
7. `feat: finalize award scoring and candidate review architecture` — award backend/frontend/tests plus intentional deletions. Risk HIGH.
8. `feat: add OCR extraction and validation workflow` — OCR service/controller/frontend/tests/config/docs; exclude private fixtures. Risk HIGH.
9. `docs: consolidate implementation evidence and runbooks` — curated/sanitized documentation only. Risk MEDIUM.

Each group requires syntax checks, targeted tests, route/import checks, and—where schema is involved—fresh disposable-database migration verification. Recovery/fixture commands and SQL backups must remain excluded until owner decisions.

# 18. Owner Decisions Required

## DECISION 1
Question: Should tracked MySQL backups be removed and Git history rewritten?
Why it matters: They contain hashes, sessions/token-related data, and institutional identities.
Options: A. Remove going forward only. B. Rewrite history and rotate potentially exposed credentials. C. Move to access-controlled artifact storage and rewrite history.
Recommended technical default: C, plus credential/session invalidation assessment.
What happens if deferred: Sensitive material remains cloneable from repository history.

## DECISION 2
Question: Which migration chain is authoritative for September 15 ranking work?
Why it matters: App migrations and canonical bridge migrations duplicate responsibility.
Options: A. App authoritative with thin canonical delegates. B. Canonical standalone authority. C. Split by deployment environment.
Recommended technical default: A only if delegation and ledger behavior are explicitly tested; otherwise B.
What happens if deferred: Duplicate or skipped schema/data operations remain possible.

## DECISION 3
Question: Should direct `Apply*` and `ReconcileCanonicalMigrationBaseline` commands remain?
Why it matters: They bypass normal migration authority and can alter ledgers/schema/data.
Options: A. Delete after migration conversion. B. Retain as recovery-only with guards/docs. C. Promote to operations tooling.
Recommended technical default: B temporarily, then A after proven migrations.
What happens if deferred: Operators may execute competing schema paths.

## DECISION 4
Question: Which verification/fixture commands belong in production command discovery?
Why it matters: many `Verify*` commands mutate data.
Options: A. Convert deterministic checks to tests. B. Keep environment-gated fixture commands. C. Keep all.
Recommended technical default: A+B.
What happens if deferred: “Verification” can unexpectedly mutate live/local data.

## DECISION 5
Question: Which of the 105 untracked documents are authoritative?
Why it matters: committing all creates duplicated/stale truth and may expose identities/paths.
Options: A. Curate consolidated finals. B. Archive every phase report. C. Keep locally only.
Recommended technical default: A, with private evidence outside Git.
What happens if deferred: documentation noise and privacy risk grow.

## DECISION 6
Question: Is `.cursor/` shared project policy or local editor state?
Why it matters: it is currently untracked and not ignored.
Options: A. Commit reviewed team rules. B. Ignore entirely. C. Split shared rules/local cache.
Recommended technical default: C.
What happens if deferred: accidental editor-state commits remain likely.

## DECISION 7
Question: Should Windows/WAMP orchestration be the default `npm run dev`?
Why it matters: it hard-codes a Windows-centric workflow.
Options: A. Keep default. B. Restore portable Vite default and add `dev:wamp`. C. Add cross-platform launcher.
Recommended technical default: B immediately; C later if needed.
What happens if deferred: non-Windows development and CI onboarding remain impaired.

# 19. Blockers

1. **CRITICAL:** tracked database backups contain sensitive authentication/session/identity material.
2. **HIGH:** dirty worktree overlaps eight remote-only Student provisioning commits.
3. **HIGH:** 48 untracked migrations include parallel App/canonical bridge chains and destructive/data-reconciliation behavior.
4. **HIGH:** read-like verification commands can mutate databases.
5. **HIGH:** no clean, isolated validation baseline exists for the combined 593 worktree entries.
6. **UNKNOWN:** exhaustive route/import/test/build correctness until safe targeted validation is run.

# 20. Exact Recommended Next Step

Do not stage anything. First create a separate, clean integration worktree from `origin/reconcile/wamp-current` (which includes PR #23), preserving this worktree untouched. In that clean worktree, perform a three-way inventory against this dirty tree, beginning with:

1. security quarantine decision for tracked SQL backups;
2. authoritative migration-chain decision for September 15/16;
3. source-only reconciliation of the remote B.2B Student changes;
4. feature-by-feature transfer following commit groups 2–9;
5. targeted syntax/tests/build and disposable-database verification before each commit.

Until decisions 1–4 are resolved, no migration, Apply/Reconcile command, broad verification command, staging operation, or merge should be run in this worktree.
