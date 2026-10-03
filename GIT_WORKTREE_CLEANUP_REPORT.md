# Git Worktree Cleanup Report

Inspection date: 2026-09-20
Inspection basis: `git status --porcelain=v1 --untracked-files=all`, `git status`, `git diff --stat`, `git diff --name-status`, `git ls-files`, ignore files, dependency manifests, filesystem metadata, command contents, and a value-redacted secret-pattern scan.

## 1. Current Git State

| Item | Result |
|---|---|
| Branch | `reconcile/wamp-current` tracking `origin/reconcile/wamp-current` |
| HEAD | `657d746f87482de0b0bfdb3dbd7c1c6e5ffde605` |
| Modified tracked files | 172 |
| Deleted tracked files | 11 |
| Untracked files | 442 before this report; 443 after adding this report |
| Staged files | 0 |
| Tracked-file diff | 183 files, 8,936 insertions, 9,498 deletions |
| Total tracked files | 3,287 |

The 11 deletions are all frontend legacy assets/modules/tests. They look consistent with the Awards & Criteria routing/model cleanup, but must remain part of that feature review rather than being treated as disposable files.

## 2. KEEP

The entries below classify every source/configuration family represented in the working tree. Individual files within these families are legitimate application artifacts unless separately listed under REVIEW, IGNORE, SECURITY REVIEW, or POSSIBLE ONE-TIME SCRIPT.

| File/Directory | Reason |
|---|---|
| `backend/app/Controllers/`, excluding no special cases | Application API controllers for annual review, ranking, credentials, documents, organizational structure, OCR, and OSAD workflows. |
| `backend/app/Services/`, excluding files separately flagged | Core business logic and policies. This includes the unfinished Phase A.0 edits in `AwardScoringService.php` and `AwardPotentialCandidateService.php`; preserve and validate them before any commit. |
| `backend/app/Services/Policies/` | Server-side authorization introduced/hardened in prior phases. |
| `backend/app/Config/Routes.php` and modified backend config | Required route/config integration, subject to feature-level tests. |
| `backend/app/Database/Migrations/2026-09-*` | Forward schema history for personnel, ranking, and evaluation work. Do not ignore migrations. |
| `backend/app/Phase17Canonical/Database/Migrations/` | Canonical/bridge migration implementation. It is operationally sensitive but source-controlled migration logic. |
| `backend/app/Database/Seeds/` | Demo/reference seed logic; retain, with credential review noted below. |
| `backend/tests/` | Backend regression coverage for the newly introduced domains. |
| `frontend/src/components/`, `controllers/`, `hooks/`, `models/`, `pages/`, `services/`, `utils/` | Product source and tests across OSAD, personnel, ranking, HR, Dean, and shared workflows. |
| `frontend/src/assets/brand/`, `frontend/src/components/brand/`, `frontend/public/favicon.svg` | Intentional brand assets and implementation. |
| `frontend/src/assets/react.svg`, `frontend/src/assets/vite.svg` deletions | Removal of starter assets appears intentional; preserve as part of branding cleanup. |
| Deleted OSAD candidacy/review modules and tests | Replaced by new award catalog/candidate-review architecture. Validate references before committing the deletions. |
| `.cursor/rules/achievenest-branding.mdc` | A project-specific, human-readable rule file; `.cursor` must not be ignored wholesale. |
| `docs/**/*.md` except `docs/debug/` | Implementation evidence, audits, architecture, ranking, HR, and performance documentation. Likely intentional and should be reviewed/committed with corresponding features. |
| `frontend/scripts/run-dean-summary-print-acceptance.mjs` | Reproducible acceptance runner; likely useful developer tooling. |
| `scripts/start-achievenest-dev.ps1` | Project development launcher referenced by the changed `frontend/package.json`. |
| `backend/composer.json`, `backend/composer.lock` | Intentional QR dependency addition: `endroid/qr-code` 6.0.0 plus `bacon/bacon-qr-code` and `dasprid/enum`. Commit manifest and lock together. |
| `frontend/package.json` | Adds the repository launcher as `dev` and preserves direct Vite as `dev:frontend`; commit with `scripts/start-achievenest-dev.ps1`. |
| `GIT_WORKTREE_CLEANUP_REPORT.md` | Required inspection artifact. |

## 3. IGNORE

| File/Directory | Reason | Recommended `.gitignore` rule |
|---|---|---|
| `.tmp-k-doc-render/` | Temporary DOCX/rendered page images. | `/.tmp-k-doc-render/` |
| `.impeccable-cache/` | Tool-downloaded executable/cache data. | `/.impeccable-cache/` |
| `.tmp-period-auth-server.log`, `.tmp-period-auth-server.err.log` | Local server logs. | `/.tmp-*.log` |
| `backend/writable/*.log` | Runtime/acceptance server logs stored outside the already-covered `writable/logs/`. | `/backend/writable/*.log` |
| `backend/writable/*_dump.json` | Generated inspection exports, reproducible from audit commands. | `/backend/writable/*_dump.json` |
| `backend/writable/*_validation_results.json` | Generated validation output. | `/backend/writable/*_validation_results.json` |
| `backend/writable/personnel-template-debug/` | Temporary XLSX repair/debug outputs. | `/backend/writable/personnel-template-debug/` |
| `backend/public/uploads/` | User/runtime uploads, including five profile photos; not suitable for source control. | `/backend/public/uploads/` |
| `output/` | Generated PDF/output artifacts. | `/output/` |
| `docs/debug/` | Debug-only output; inspect once before ignoring, but current placement indicates disposable diagnostics. | `/docs/debug/` |

Already ignored correctly: `backend/.env`, `vendor/`, frontend `node_modules/`, frontend `dist/`, backend build/test output, standard logs under frontend, and CodeIgniter writable cache/log/session/upload folders.

## 4. REVIEW

| File | Why review is required |
|---|---|
| All 172 modified, 11 deleted, and source-like untracked files | This is a multi-phase accumulation, not one coherent change. Each feature family must be validated and committed independently. |
| `backend/.env.example` | Values appear placeholder-only, but its changes should be reviewed with the local-auth/database setup commit. |
| `backend/app/Services/AwardScoringService.php` | Contains unfinished Phase A.0 scoring-trace edits made immediately before this cleanup request. Do not commit until completed and tested. |
| `backend/app/Services/AwardPotentialCandidateService.php` | Contains unfinished Phase A.0 cycle-isolation edits; current implementation was interrupted and may not compile or cover all callers. |
| `backend/app/Phase17Canonical/Database/Migrations/*` | Migration history is sensitive. Review canonical bridge/application state before grouping. |
| `backend/app/Database/Migrations/2026-09-15-*` | Legacy App migrations coexist with canonical bridge migrations and must not be replayed accidentally. Keep as source, but isolate their commit/review. |
| `backend/public/uploads/profile-photos/**` | Runtime user files. Confirm none is an intentionally curated demo asset before ignoring; default recommendation is do not commit. |
| `docs/debug/` | Confirm no unique diagnostic conclusion exists only here before ignoring. |
| `frontend/src/assets/ndmu_login_bg-ocr.txt` | OCR sidecar may be provenance documentation or a disposable extraction result. Needs owner decision. |
| `backend/writable/*.json` | Generated audit/validation data may be evidence, but the corresponding Markdown reports are better version-controlled artifacts. |
| `backend/writable/personnel-template-debug/*.xlsx` | Useful only if retained as formal regression fixtures; current path/name indicates temporary debug files. |
| `output/pdf/dean-faculty-evaluation-summary-acceptance.pdf` | Generated acceptance output; keep only if the repository deliberately versions golden PDFs. |

## 5. Possible One-Time Scripts

Every untracked command with an Apply/Inspect/Audit/Prepare/Reconcile/Verify/Activate name was inspected at least for command identity, description, size, and mutation intent.

| File | Purpose | Keep permanently? | Recommendation |
|---|---|---|---|
| `ActivateDueApprovedRanks.php` | Production scheduler command for due approved-rank activation and recovery. | Yes | KEEP with Phase S/T services and tests. |
| `ActivateDueRankPlacements.php` | Production scheduler command for due placement activation. | Yes | KEEP with Phase L placement lifecycle. |
| `PreflightSeptember15Bridge.php` | Read-only canonical bridge proof gate. | Yes | KEEP with bridge migrations/tests. |
| `ApplyPersonnelBookletIntegritySchema.php` | Applies one isolated schema change. | Probably no after migration reconciliation | REVIEW; prefer migrations over permanent apply wrappers. |
| `ApplyPersonnelEmploymentFoundation.php` | Applies employment-start schema change. | Probably no | REVIEW as one-time migration wrapper. |
| `ApplyRankingCriteriaFix.php` | Applies isolated ranking classification/seed repair. | Probably no | REVIEW as one-time repair utility. |
| `ApplySourceDrivenRankingCriteria.php` | Applies source-driven criteria schema/seed. | Probably no | REVIEW as one-time repair utility. |
| `ReconcileCanonicalMigrationBaseline.php` | Audits schema and can establish a migration ledger row. | Operationally dangerous/specialized | Keep only if this is an approved recovery mechanism; document safeguards prominently. |
| `AuditJmorteIdentity.php` | Read-only exact-identity/dependency audit for one reported identity. | No | Likely one-time diagnostic; retain untracked or move findings to a report. |
| `InspectAwardCriteriaMatrix.php` | Generates SA-01 criteria inventory. | Optional dev tooling | Keep only if reproducibility of SA-01 reports is desired. |
| `InspectAwardMasterInventory.php` | Generates award master inventory. | Optional dev tooling | Same recommendation. |
| `InspectAwardRuleMap.php` | Generates authoritative rule-map audit. | Optional dev tooling | Same recommendation. |
| `InspectCategoryMappingMatrix.php` | Generates category mapping audit. | Optional dev tooling | Same recommendation. |
| `InspectConditionMatrix.php` | Generates metadata-condition audit. | Optional dev tooling | Same recommendation. |
| `InspectSharedDependencyMatrix.php` | Generates shared dependency audit. | Optional dev tooling | Same recommendation. |
| `InspectSubcategoryMappingMatrix.php` | Generates subcategory mapping audit. | Optional dev tooling | Same recommendation. |
| `PrepareDeanAnnualReviewAcceptanceFixture.php` | Creates a specific closed-period acceptance fixture. | Test/dev only | Keep only if converted/documented as repeatable acceptance tooling. |
| `PrepareDeanPortfolioEvaluationAcceptance.php` | Prepares/inspects/cleans an isolated Dean acceptance fixture. | Test/dev only | Keep with the acceptance test suite if repeatable and safe. |
| `VerifyPostMigrationEligibilitySnapshot.php` | Manages a disposable post-migration fixture. | Test/dev only | Keep only with explicit cleanup guarantees. |
| `VerifyDeanAnnualReviewEligibilityLive.php` | Live MySQL verification intended not to retain fixture mutations. | Optional | Keep only if CI/dev documentation identifies its prerequisites. |
| `VerifyCHU01Phase2PersonnelRules.php`, `VerifyCHU01Phase3OrgDemoData.php`, `VerifyCHU02Workflows.php`, `VerifyCHU03Workflows.php` | Milestone-specific verification commands. | Optional | Prefer automated tests; keep only where they validate live integration not covered by tests. |
| `VerifyHRPersonnelProvisioningDirectory.php`, `VerifyPasswordChangeRemediation.php` | Live workflow verification. | Optional | Keep if repeatable, non-secret, and documented. |
| `VerifySA01ValidationCases.php`, `VerifySA02ValidationCases.php` | Synthetic award/evidence validation generators. | Optional | Keep if the generated matrices remain maintained deliverables. |

## 6. Security Review

No secret values are reproduced in this report.

| File | Finding | Safe/Unsafe/Needs Review |
|---|---|---|
| `backend/.env` | Present locally and correctly ignored by `backend/.gitignore`. | Safe while untracked/ignored |
| `backend/.env.example` lines 11, 25, 35, 47, 55–57 | Keys include `LOCAL_AUTH_JWT_SECRET`, database password fields, and Supabase URL/anon/service-role fields. Inspected values are placeholders/blank examples. | Safe |
| `backend/app/Database/Seeds/LocalDefenseAuthSeeder.php` around lines 12–13 | Contains `defaultPassword` handling. Determine whether the value is a fixed demo credential and whether production execution is prevented. | Needs Review |
| `backend/app/Database/Seeds/DefenseDemoPersonaSeeder.php` around line 220 | Password lifecycle flag/reference; no value disclosed here. | Needs Review |
| `backend/app/Commands/VerifyPhase12Demo.php` around lines 188–363 | Handles plain-password test data and a mock missing-secret case. | Needs Review |
| `frontend/src/services/__tests__/liveE2EIntegration.test.js` around lines 17–32 and 124–300 | Reads `ACHIEVENEST_DEMO_PASSWORD`, carries access tokens in test memory, and contains an intentionally wrong test password literal. | Needs Review; environment-backed value is preferred |
| Auth/config/service files listed by the scan | References token/password/secret identifiers as application logic or environment lookups. No evidence from the redacted scan alone that a live value is embedded. | Needs Review during auth commit |
| `backend/public/uploads/profile-photos/**` | User-associated binary data under UUID paths. | Unsafe to commit without explicit consent and sanitization |

The value-redacted scan covered tracked backend/frontend auth/config paths plus the changed environment example. It identified names/references, not confirmed leaked production credentials. A dedicated secret scanner should run before staging because the tree includes 442 untracked files and many binary/document artifacts.

## 7. Proposed `.gitignore` Changes

No ignore file was modified. Proposed root rules:

```gitignore
# Local tool/render caches
/.impeccable-cache/
/.tmp-k-doc-render/
/.tmp-*.log

# Generated validation and acceptance output
/output/
/backend/writable/*.log
/backend/writable/*_dump.json
/backend/writable/*_validation_results.json
/backend/writable/personnel-template-debug/

# Runtime user uploads
/backend/public/uploads/

# Local debug reports (after confirming no unique evidence is stored here)
/docs/debug/
```

Do not ignore `.cursor/`; the current branding rule appears intentional.

## 8. Already-Tracked Generated Files

The tracked-file inventory did not identify tracked `node_modules`, `vendor`, `dist`, coverage output, runtime logs, or the newly listed output/cache directories. Therefore no `git rm --cached` action is currently supported by evidence.

If later inspection identifies a tracked generated file, adding an ignore rule will not stop tracking it; an explicit, separately approved `git rm --cached <path>` would be required.

## 9. Recommended Commit Groups

These groups reflect actual change families and should be refined using file-level diffs before staging:

1. `chore: ignore local runtime and rendering artifacts`
2. `build: add QR generation dependency`
3. `build: add unified local development launcher`
4. `feat: complete personnel and organizational authority workflows`
5. `feat: add ranking cycle, placement, credentials, and rank progression domains`
6. `feat: add canonical migration bridge and recovery guard`
7. `feat: finalize OSAD awards criteria and candidate review workflows`
8. `feat: add official evaluation document and verification workflows`
9. `feat: harden authentication, authorization, and credential delivery`
10. `feat: enhance personnel portfolio, OCR, and evidence workflows`
11. `test: add backend and frontend phase regression coverage` (prefer tests with their feature where practical)
12. `docs: add implementation and audit evidence`
13. `refactor: remove superseded OSAD candidacy modules and starter assets`

Do not use `git add .`; each group needs a displayed file list and explicit approval.

## 10. Safe Next Actions

1. Review this report and decide which optional audit/verification commands are permanent.
2. Confirm whether `docs/debug/`, generated JSON, debug XLSX files, acceptance PDF, and profile-photo uploads may be ignored.
3. Record a fresh branch, HEAD, and full status snapshot before cleanup.
4. Add only approved ignore rules; do not delete files.
5. Re-run `git status --short --untracked-files=all` and `git diff --stat`.
6. Complete or isolate the interrupted Phase A.0 changes before staging award-scoring files.
7. Run a dedicated secret scanner over the exact files proposed for each commit.
8. Validate one logical feature group at a time using PHP syntax/tests, Composer validation, frontend tests/lint/build, and migration-specific checks.
9. Present the exact files and proposed message for one group; wait for approval before staging/committing.
10. Never replay legacy App migrations or alter the migration ledger as part of Git cleanup.

No files were deleted, reverted, staged, committed, or pushed during this inspection. No `.gitignore` file was changed.
