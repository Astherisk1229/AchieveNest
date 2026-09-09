# Phase 3 — Frontend Dependency Audit Report

## Status
`PASS / COMPLETED`

## Baseline
- **Branch:** `audit/project-architecture-linkage`
- **Starting HEAD:** `f4d7aa05a994378651f9489e4002c9f648e8f30d`
- **Phase 0 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_0_FREEZE_AND_SAFETY_BASELINE.md`)
- **Phase 1 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_1_REPOSITORY_INVENTORY.md`)
- **Phase 2 Status:** `PASSED / COMPLETED` (`docs/audit/PHASE_2_FRONTEND_ROUTE_REACHABILITY.md`, `docs/audit/PHASE_2_FRONTEND_ROUTE_MAP.csv`)
- **Working Tree State:** Clean (only pre-existing untracked `STARTUP_COMMANDS.md` present)

---

## Scope
- **Source & Test Files Audited:** 286 files in `frontend/src/`
- **Pages Traced:** 119 page files (28 route pages, 18 query/tab workspace views, 52 modals/drawers, 4 tests, 17 review-required)
- **Reusable Components Traced:** 27 components (`components/common`, `components/layout`, `components/osad`, `components/security`, `components/ui`)
- **Custom Hooks Traced:** 17 hooks in `frontend/src/hooks/`
- **Context Providers & Consumers Traced:** 2 contexts (`AuthContext`, `ThemeContext`)
- **Services / API Clients Traced:** 14 service files in `frontend/src/services/`
- **Controllers & Models Traced:** 54 controller & model definitions in `frontend/src/controllers/` and `frontend/src/models/`
- **Config & Security Modules Traced:** 6 modules in `frontend/src/config/` and `frontend/src/security/`
- **Assets & Styles Traced:** 3 asset files and 3 global stylesheets
- **Active Unit / Integration Tests Traced:** 29 test suites across `frontend/src/`

---

## Dependency Summary
- **Total Dependency Edges Mapped:** 411
- **Runtime Dependency Edges:** 358
- **Test-Only Dependency Edges:** 53
- **Cross-Domain Shared Dependencies:** 251
- **Files with No Proven Callers:** 36 (recorded as `NO CALLER PROVEN YET`, non-destructive preservation)
- **Phase 2 Review-Required Files Evaluated:** 17 files (all 17 classified with direct import evidence)

---

## Page → Component Findings
The application component tree exhibits strong modular hierarchy:
1. **Student Portal:** `StudentDashboardPage`, `StudentAchievementsPage`, and `StudentPortfolioPage` utilize common modals (`AchievementSubmissionModal`, `DigitalBarcodeIDCardModal`, `EditStudentInfoModal`, `ExportPortfolioPreviewModal`, `StudentAchievementPreviewModal`).
2. **Personnel Portal:** `PersonnelDashboardPage` acts as a dynamic router shell, delegating rendering conditionally to `CoordinatorDashboardPage` (for Program Coordinators), `OrganizationModeratorDashboardPage` (for Org Moderators), or personnel portfolio views (for Faculty and Deans).
3. **HR Admin Portal:** `HRPersonnelDirectoryPage` mounts directory tables, dossier drawers, and onboarding modals; `HREvaluationSubmissionsPage` mounts the `PortfolioEvaluationStudio`, criteria rating engine controls (`ManualBoundedControl`, `FixedScoreControl`, `MultiFactorControl`, `MatrixLookupControl`, `AutomaticDerivedControl`, `SingleCategoryControl`), and status tabs.
4. **OSAD Admin Portal:** `OSADDashboardPage` dispatches to 10 distinct command modules depending on the `?tab=` search parameter.

---

## Hooks & Context Findings
- **17 Custom Hooks:**
  - `useHR.js` (5 runtime callers): High-traffic hub for HR administrative state.
  - `usePersonnelPortfolio.js` (3 runtime callers): Centralized faculty portfolio CRUD hook.
  - `useTheme.js` (4 runtime callers): Dark/light mode theme consumer.
  - `useOSAD.js`, `useOrganization.js`, `useVerification.js`, `useStudentRoster.js`, `useStudentAchievements.js`, `usePersonnelAchievements.js`, `useIdleSession.js`, `useCertificateTemplates.js`, `useHRAuditTrail.js`, `useAdminSetupGuide.js`, `useUserProfile.js`, `useUserSettings.js` (each with active domain callers).
  - `useHRRanking.js` and `usePersonnelOnboardingDraft.js` currently have 0 direct runtime callers (logic absorbed directly into respective page controllers; classified `NO CALLER PROVEN YET`).
- **Context Providers:**
  - `AuthContext.jsx` (13 direct runtime callers): Provides authenticated session state, active role switching, and session timeout management across the entire application shell.
  - `ThemeContext.jsx` (2 direct runtime callers): Provides root HTML class management for dark/light themes.

---

## Service / API Client Findings
- **14 Service Modules:**
  - `apiClient.js` (13 callers): Primary fetch transport layer configured for local-defense REST (`/api/v1`) with Bearer token authentication and mock state persistence.
  - `authService.js` (16 callers): Core authentication, password hashing, session caching, and token storage gateway.
  - `passwordResetAdminService.js` (4 callers): Admin password reset approval workflow client.
  - `AwardPortfolioReviewService.js` (3 callers): OSAD 80% evaluation benchmark scoring engine.
  - `Stage1CandidateReportService.js` (2 callers): Accreditation report generation service.
  - `provisioningService.js`, `hrAdminService.js`, `roleService.js`, `CertificateTemplateRenderer.js`, `portfolioPdfGenerator.js` (active callers).
  - `achievementService.js`, `portfolioService.js`, `lifecycleService.js` (0 direct callers; service logic directly wrapped by controllers; classified `NO CALLER PROVEN YET`).

---

## Frontend Controller / Model Findings
AchieveNest implements a clean separation of concerns using MVC-style controllers and models:
- **Controllers (25 files):** Handle UI state transformations, validation, and workflow transitions (e.g. `RouteAccessController`, `SecurityController`, `OrganizationController`, `AttendanceController`, `CertificateIssuanceController`, `PersonnelDashboardController`).
- **Models (29 files):** Define domain entity factories, schema shapes, validation rules, and immutability helpers (e.g. `RankingCriteriaModel`, `StudentOrganizationModel`, `CollegeModel`, `DegreeProgramModel`, `HRAuditEventRegistry`, `AdminSetupStatusModel`).

---

## Config & Security Findings
- `navigationCatalog.js` & `personnelRoleNavigation.js`: Central authorization and RBAC navigation registry consumed by `Sidebar.jsx` and `MainLayout.jsx`.
- `permissionResolver.js` & `roleContext.js`: Cryptographic permission checking and canonical role normalization.
- `supabase.js`: Legacy Supabase client configuration preserved as offline fallback stub.

---

## Asset & Style Findings
- **Assets:** `assets/ndmu_campus_banner.png` actively imported by `CoordinatorDashboardPage.jsx`.
- **Styles:** Global styling provided by `src/index.css` and `src/App.css` imported in `main.jsx` and `App.jsx`.

---

## Test Dependency Findings
- 29 active Vitest test suites reference source components, hooks, controllers, models, and services directly, validating local-defense offline functionality with 190/190 passing assertions.

---

## Phase 2 Review-Required Files (17 Files Detailed Evaluation)

| File | Caller Count | Test Count | Phase 3 Status | Replacement / Architectural Evidence |
| :--- | :---: | :---: | :--- | :--- |
| `hr-admin/evaluation-submissions/evaluation/portfolio/EvidenceDocumentViewer.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `studio/portfolio/PortfolioNavigator.jsx` |
| `hr-admin/evaluation-submissions/evaluation/portfolio/FacultyPortfolioPane.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `studio/portfolio/PortfolioNavigator.jsx` |
| `hr-admin/evaluation-submissions/evaluation/rating/NDMURatingPane.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `studio/evaluation/CriterionEvaluation.jsx` |
| `hr-admin/evaluation-submissions/evaluation/rating/scoring/AutomaticDerivedScoring.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `scoring/AutomaticDerivedControl.jsx` |
| `hr-admin/evaluation-submissions/evaluation/rating/scoring/FixedOptionScoring.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `scoring/FixedScoreControl.jsx` |
| `hr-admin/evaluation-submissions/evaluation/rating/scoring/ManualBoundedScoring.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `scoring/ManualBoundedControl.jsx` |
| `hr-admin/evaluation-submissions/evaluation/rating/scoring/MixedDegreeScoring.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `scoring/MatrixLookupControl.jsx` |
| `hr-admin/evaluation-submissions/evaluation/rating/scoring/MultiFactorScoring.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Replaced by `scoring/MultiFactorControl.jsx` |
| `hr-admin/evaluation-submissions/studio/EvaluationScoreStrip.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Score display integrated directly into `StudioHeader.jsx` |
| `hr-admin/modals/HRScoreAuditModal.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Superseded by inline `StudioDecisionBar.jsx` actions |
| `hr-admin/personnel-directory/CustomDatePicker.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Standard HTML5 date inputs adopted in `OnboardPersonnelModal.jsx` |
| `hr-admin/personnel-directory/DiscardOnboardingDraftModal.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Inlined into `OnboardingDraftRecoveryBanner.jsx` / modal state |
| `hr-admin/personnel-directory/FacultyDirectory.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Superseded by `PersonnelDirectoryTable.jsx` |
| `hr-admin/personnel-directory/OnboardingDraftRecoveryBanner.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Draft recovery modal dialog integrated directly into `HRPersonnelDirectoryPage.jsx` |
| `personnel/PersonnelPortfolioForm.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Completely replaced by dedicated `PersonnelPortfolioEditPage.jsx` |
| `personnel/program-coordinator/ProgramCoordinatorDashboard.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Superseded by `CoordinatorDashboardPage.jsx` |
| `personnel/program-coordinator/tabs/CoordinatorQueueTab.jsx` | 0 | 0 | `SUPERSEDED-CANDIDATE` | Inlined directly into `CoordinatorDashboardPage.jsx` workspace view |

*All 17 files remain preserved in place without deletion or movement.*

---

## Duplicate API Wrapper Candidates
- **Discovered Count:** 0 duplicate endpoint wrappers. All service API requests route cleanly through `apiClient.js` (`/api/v1`).

---

## Near-Duplicate Component Candidates
1. `DigitalBarcodeIDCardModal.jsx` — Reused across both Student and Personnel dashboard pages. (Recommendation for Phase 11: relocate to `components/common/`).
2. `StudentAchievementPreviewModal.jsx` vs `AchievementPreviewModal.jsx` — Near-identical layout and modal preview presentation for student and faculty evidence. (Recommendation for Phase 11: unify into single shared preview component).
3. `ResetPersonnelPasswordModal.jsx` vs OSAD in-table reset action — Similar password reset confirmation UX. (Recommendation for Phase 11: maintain role-specific queues, share common confirmation dialog).

---

## Backend Responsibility Review Candidates
1. **Faculty Criteria Scoring Engine (`NDMURatingEngine.js`, `MatrixLookupControl.jsx`):** Computes complex weighted academic scores browser-side. Recommended for Phase 4/12 review for server-authoritative validation.
2. **Award Candidacy 80% Benchmark Evaluation (`AwardPortfolioReviewService.js`):** Calculates award candidate qualification rules browser-side. Recommended for Phase 4/12 review for backend verification.
3. **Role & Permission Mutators (`roleService.js`):** Executes specialized role context assignment with backend API synchronization.

---

## Supabase-Era Frontend Findings
- 50 lines across 10 files contain references to Supabase (e.g. `config/supabase.js`, `context/AuthContext.jsx`, `services/__tests__/supabaseZeroCallLocalDefense.test.js`).
- Used as offline defense stubs or zero-call assertion tests ensuring 100% WAMP MySQL local operation.
- No lifecycle removal decisions made in Phase 3; preserved for Phase 10 review.

---

## Hardcoded Runtime / API Findings
- `services/apiClient.js`: Configured to target `http://127.0.0.1:8080/api/v1` with environment fallback.
- No insecure production credentials or external cloud dependencies hardcoded.

---

## Naming Review Candidates
- `/depsec` redirect in `App.jsx` (legacy shorthand preserved for backward compatibility).
- `NDMURatingEngine.js` / `NDMURatingRules.js` (institution-specific rating engine nomenclature).

---

## Dependency Artifacts Generated
- **Dependency Map CSV:** `docs/audit/PHASE_3_FRONTEND_DEPENDENCY_MAP.csv` (412 lines, 411 dependency records).
- **Audit Narrative Report:** `docs/audit/PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md`.

---

## Verdict
`PASS / COMPLETED`

## Safety Confirmation
No frontend source, dependency, import, service, route, UI, naming, API, auth, schema, migration, seed, or business-logic changes were performed in Phase 3.
