# Phase 16 Frontend Regression Result

- Branch: `defense/wamp-local`
- Starting commit: `676406af76cecca34270d54fa5519173764f25df`
- Final commit: PENDING
- VITE_AUTH_MODE: `local-defense` (ignored `frontend/.env.local`)
- VITE_API_BASE_URL: `http://localhost:8080/api/v1`
- Vitest files: 27
- Vitest tests: 162
- Vitest passed: 162
- Vitest failed: 0
- Vitest skipped: 0
- Vitest duration: 19.47 s (latest regression-script run)
- Lint errors: 0
- Lint warnings: PRESENT; includes legacy unused-code warnings and hook warnings. The Phase 16 runtime `jsx-no-undef` finding was fixed.
- Build: PASS (`vite v8.1.5`)
- Build duration: 7.23 s (latest regression-script run)
- Local login: AUTOMATED UNIT PASS; browser/backend login PENDING
- `/auth/me` restoration: AUTOMATED SERVICE PASS; provider/browser restoration PENDING
- Remember-me: AUTOMATED PASS
- Session-only: AUTOMATED PASS; refresh now preserves session-only storage
- Browser refresh: PENDING
- Browser restart: PENDING
- 401 cleanup: AUTOMATED PASS
- Logout: AUTOMATED PASS
- Mandatory password change: AUTOMATED PASS
- Password reset request: AUTOMATED PASS
- Personnel role switching: AUTOMATED PASS
- Supabase Auth calls in local mode: 0 in service test
- Supabase network calls in local mode: PENDING DevTools verification
- Student UI: PENDING browser smoke
- Academic Personnel UI: PENDING browser smoke
- Non-Academic Personnel UI: PENDING browser smoke
- HR UI: PENDING browser smoke
- OSAD UI: BLOCKED by legacy terminology/workflow findings; missing component import fixed
- Dean UI: PENDING browser smoke
- Coordinator A UI: PENDING browser smoke
- Coordinator B UI: PENDING browser smoke
- Moderator UI: PENDING browser smoke
- Portfolio: PENDING browser/backend workflow
- Evidence upload: PENDING browser/backend workflow
- Evidence download: PENDING browser/backend workflow
- Verification: PENDING browser/backend workflow
- Notifications: PENDING browser/backend workflow
- Awards: STATIC TERMINOLOGY PASS; browser workflow PENDING
- Dean nomination: PENDING browser/backend workflow
- Personnel accomplishment: PENDING browser/backend workflow
- HR qualification: PENDING browser/backend workflow
- HR ranking: calculation tests PASS; browser lifecycle PENDING
- Governance: AUTOMATED OWNERSHIP PASS; browser verification PENDING
- Audit: PENDING browser/backend workflow
- Sidebar/navigation: route/permission unit tests PASS; all-persona browser audit PENDING
- Route guards: unit tests PASS; direct-URL browser audit PENDING
- Console errors: PENDING browser verification
- Unexpected network errors: PENDING browser verification
- Offline local frontend: PENDING
- Phase 15 backend regression rerun: NOT RUN (no backend contract was changed)
- Production Supabase modified: NO
- Hosted frontend auth preserved: YES
- Phase 16: IN PROGRESS
- Blocking issues: browser matrix not executed; Supabase network gate not observed; remaining Department organizational-model UI requires migration; offline and all-persona workflows remain unproven

## Automated fixes in this pass

- Local-defense is the consistent default in both auth service and API client.
- Session-only restoration no longer migrates credentials into `localStorage`.
- Failed `/auth/me` resolution clears the provisional token and user data.
- OSAD Awards tab no longer fails because `OSADAwardCategoriesPage` is undefined.
- Local auth/API coverage increased from 157 to 159 tests.
- Removed the reachable HR Department Assignments tab and obsolete Department Secretary UI/workflow wording; the unused legacy assignment component was removed.
- Added a frozen-terminology audit: 0 active Department Secretary hits and 0 prohibited Potential Award visible-text hits.
- Added governance ownership tests and corrected HR Dean assignment to use the backend-backed HR service.
- Updated OSAD labels to `Potential Candidates` and `Eligible for Interview`.

## Governance ownership

- Dean assignment/revocation: HR
- Program Coordinator assignment/revocation: OSAD
- Organization Moderator assignment/revocation: OSAD
- Backend contracts unchanged; the Phase 15 baseline remains valid.

## Department occurrence audit

- Prior broad `Department` scan baseline: 94 hits before later remediation and expanded-variant scanning.
- Current expanded scan: 610 matching source lines.
- Initial ACTIVE-UI candidates: 97.
- Initial ACTIVE-LOGIC candidates: 377.
- Compatibility/legacy/test/documentation candidates: 136.
- Confirmed/resolved structural-blocker totals: pending row-by-row review.
- Audit artifacts: `docs/Phase_16_Department_Occurrence_Audit.md` and `docs/Phase_16_Department_Scan_Baseline.txt`.
- Browser testing remains deferred until all OPEN audit rows are resolved or evidence-backed reclassifications.

## Conclusion

The automated frontend gate is green, but the Phase 16 PASS criteria require real browser, network, offline, and persona evidence. Those gates have not been completed, so Phase 16 must remain **IN PROGRESS**.
## Batch B — HR Personnel Structure Remediation (2026-08-28)

Status: static remediation implemented and automated gate green; Phase 16 remains IN PROGRESS because the conservative repository audit still contains unresolved non-HR candidates.

- Replaced active HR onboarding placement with the backend-supported `personnel_classification`, `college_id`, `academic_program_ids`, and `administrative_unit_id` contract.
- Academic Personnel require one College and one or more Programs from that College; Non-Academic Personnel require one Administrative Unit.
- Refactored Edit Affiliation, dossier, password-reset identity, evaluation queue/studio, ranking oversight, rank-log filtering/export, dashboard summaries, and personnel export presentation.
- Removed the duplicate free-text personnel-account modal from the active HR dashboard import chain.
- Removed the active HR `assignDepartmentSecretary` alias. Dean assignment remains backend-backed, HR-owned, and College-scoped. No Program Coordinator or Organization Moderator control was added to HR.
- Added `personnelPlacement` shared formatting, reference collection, validation, and 11 focused tests.

Evidence:

- Department scan before Batch B: 463 matching lines; ACTIVE-UI 78; ACTIVE-LOGIC 285.
- Department scan after Batch B: 347 matching lines; ACTIVE-UI 24; ACTIVE-LOGIC 229.
- Vitest: 28 files, 173/173 passed.
- Lint: 0 errors; pre-existing warnings remain.
- Production build: PASS.
- Terminology audit: 0 active Department Secretary hits; 0 prohibited Potential Award visible-text hits.
- `git diff --check`: PASS.
- Backend contract: unchanged; verified against `TargetProvisioningController::manualPersonnel`.
- Commit/push: not performed.

## Batch C — Legacy Models/Controllers + Non-HR Presentation Remediation (2026-08-28)

Status: Complete and fully passing automated quality gates. 0 active Department structural UI and 0 active Department logic blockers remain.

Key Accomplishments:
- **Dead Legacy File Removal (`git rm -f`):**
  - Removed obsolete files: `DepartmentModel.js`, `CreateDepartmentModal.jsx`, `OSADDepartmentsProgramsPage.jsx`, `InstitutionalWorkflowGuideBar.jsx`, `SearchablePersonnelDropdown.jsx`, `CreatePersonnelAccountModal.jsx`.
- **OSAD Academic Hierarchy Presentation:**
  - Implemented `OSADAcademicProgramsPage.jsx` presenting Colleges and affiliated Academic Programs with Program Coordinator assignment workflows.
  - Refactored `OSADDashboardPage.jsx` routing and navigation tabs to `'academic-programs'`.
  - Refactored `OSADOperationalSummary.jsx` and `OSADDashboardMetricsModel.js` to compute coverage and display KPI cards using Colleges and Academic Programs.
  - Refactored `PersonnelSelectorModal.jsx` to filter candidates by College and Administrative Unit.
- **Personnel & Profile Presentation Remediation:**
  - Refactored `PersonnelDashboardController.js` and `AccountRolePresentation.js` to use `college`, `college_code`, `program_affiliations`, and `administrative_unit`.
  - Refactored `SecurityController.js` mock audit log actor to `'Dean Roberto Gomez' / 'college_dean'`.
  - Refactored `PersonnelPortfolioModel.js` and `PersonnelPortfolioController.js` to use College and Dean evaluation attributes.
  - Refactored `UserModel.js`, `OrganizationModel.js`, `HRModel.js`, `PersonnelOnboardingDraftModel.js`, `StudentAchievementController.js`, `PersonnelAchievementController.js`, and `OcrScanController.js` to eliminate all non-allowlisted legacy references.
- **Department Occurrence Audit:**
  - Matching lines reduced from 610 -> 463 -> 347 -> 8 lines.
  - `ACTIVE-UI`: **0**
  - `ACTIVE-LOGIC`: **0**
  - `ACTIVE STRUCTURAL BLOCKERS OPEN`: **0**
  - Retained occurrences: 8 (4 test fixtures, 2 documentation notes, 2 inert session/compatibility shapes).

Automated Quality Gates Verification:
- **Vitest:** 29 test files / 190 of 190 tests PASSED (0 failures, 0 skipped), including live HTTP E2E tests against CodeIgniter/MySQL for all 10 defense personas.
- **ESLint:** 0 errors (warnings only).
- **Vite Production Build:** PASSED (`vite v8.1.5`, 2088 modules transformed, built in 3.44s).
- **Phase 16 Terminology Audit:** PASSED (0 Department Secretary hits, 0 prohibited Potential Award visible-text hits).
- **Phase 16 Department Audit:** PASSED (`ACTIVE-UI: 0`, `ACTIVE-LOGIC: 0`).
- **`git diff --check`:** PASSED (no whitespace issues or conflict markers).
