# Phase 16 Frontend Test Inventory

This inventory documents and classifies every frontend test file across the AchieveNest repository.

| Test File | Type | Technology Assumption | Scope / Responsibility | Classification | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `src/services/__tests__/authServiceLocalDefense.test.js` | Vitest Unit | Local-Defense Auth / WAMP | Tests AUTH-FE-001..014: login, session restoration, remember-me, role switching, password change, reset requests | `LOCAL-APPROVED` | **PASS** |
| `src/services/__tests__/apiClientLocalDefense.test.js` | Vitest Unit | Local Axios Interceptors | Tests API-FE-001..003: Bearer token injection, unauthenticated mode, 401 cache cleanup | `LOCAL-APPROVED` | **PASS** |
| `src/services/__tests__/supabaseZeroCallLocalDefense.test.js` | Vitest Integration | Offline Zero-Call Spies | Tests FE-LOCAL-SUPA-001: Guarantees 0 Supabase calls during local-defense authentication | `LOCAL-APPROVED` | **PASS** |
| `src/utils/__tests__/roleContext.test.js` | Vitest Unit | Canonical Role Utilities | Account type & active role context normalization & validation | `DUAL-MODE` | **PASS** |
| `src/security/__tests__/permissionResolver.test.js` | Vitest Unit | RBAC Resolution | Resolves permissions across all 7 institutional roles | `DUAL-MODE` | **PASS** |
| `src/security/__tests__/governanceOwnership.test.js` | Vitest Unit | Governance Ownership | Enforces HR-only Dean and OSAD-only Coordinator/Moderator mutation ownership | `LOCAL-APPROVED` | **PASS** |
| `src/controllers/__tests__/RouteAccessController.test.js` | Vitest Unit | Route Protection | Evaluates route accessibility based on user account type and active role context | `DUAL-MODE` | **PASS** |
| `src/services/__tests__/authServicePasswordReset.test.js` | Vitest Unit | Password Reset Service | Validates institutional email format and reset dispatch | `DUAL-MODE` | **PASS** |
| `src/services/__tests__/passwordResetAdminService.test.js` | Vitest Unit | Admin Reset Operations | Validates admin reset approval and temporary credentials generation | `DUAL-MODE` | **PASS** |
| `src/pages/hr-admin/evaluation-submissions/evaluation/rating/__tests__/NDMURatingEngine.test.js` | Vitest Unit | HR Ranking Calculations | Enforces 70/50/40 = 160 Max scale and 120.00 passing threshold | `DUAL-MODE` | **PASS** |
| `src/pages/hr-admin/personnel-directory/__tests__/PersonnelDirectorySearchAndFilter.test.js` | Vitest Unit | Personnel Directory UI | Filters personnel by College, Department/Unit, Status, and search term | `DUAL-MODE` | **PASS** |
| `src/services/__tests__/AwardPortfolioReviewService.test.js` | Vitest Unit | Award Review Service | Stage 1 candidate review calculation and category summaries | `DUAL-MODE` | **PASS** |
| `src/services/__tests__/Stage1CandidateReportService.test.js` | Vitest Unit | Candidate Reports | Generates exportable summary reports for award candidates | `DUAL-MODE` | **PASS** |
| `src/models/__tests__/AwardCycleModel.test.js` | Vitest Unit | Award Cycle Models | Manages award cycle schema and state transitions | `DUAL-MODE` | **PASS** |
| `src/models/__tests__/AwardCandidacyModel.test.js` | Vitest Unit | Award Candidacy | Validates candidacy states and candidate basis | `DUAL-MODE` | **PASS** |
| `src/models/__tests__/AdminSetupStatusModel.test.js` | Vitest Unit | Setup Status | Manages administrative setup guide progress | `DUAL-MODE` | **PASS** |
| `src/models/__tests__/AdminSetupGuideRegistry.test.js` | Vitest Unit | Guide Registry | Provides step registry for administrative onboarding | `DUAL-MODE` | **PASS** |
| `src/controllers/__tests__/AdminSetupGuideController.test.js` | Vitest Unit | Setup Controller | Controls admin setup guide completion | `DUAL-MODE` | **PASS** |
| `src/models/__tests__/CertificateTemplateRegistry.test.js` | Vitest Unit | Certificate Templates | Manages certificate templates and layout configurations | `DUAL-MODE` | **PASS** |
| `src/controllers/__tests__/CertificateIssuance.test.js` | Vitest Unit | Certificate Issuance | Validates participant certificate generation | `DUAL-MODE` | **PASS** |
| `src/models/__tests__/OSADAcademicHierarchy.test.js` | Vitest Unit | Academic Hierarchy | Validates College and Academic Program relationships | `DUAL-MODE` | **PASS** |
| `src/pages/osad-admin/__tests__/OSADAcademicHeaderActions.test.js` | Vitest Component | OSAD Header Actions | Renders and handles academic hierarchy actions | `DUAL-MODE` | **PASS** |
| `src/utils/__tests__/verificationMetrics.test.js` | Vitest Unit | Verification Metrics | Computes coordinator queue metrics and throughput | `DUAL-MODE` | **PASS** |
| `src/pages/personnel/program-coordinator/__tests__/CoordinatorMetricsSidebar.test.jsx` | Vitest Component | Coordinator Sidebar | Renders queue counts and pending submissions | `DUAL-MODE` | **PASS** |
| `src/services/__tests__/liveE2EIntegration.test.js` | Vitest Integration | Live CodeIgniter/MySQL API | Validates all 10 defense demo personas, /auth/me restore, role scopes, cross-user/program isolation, and zero-Supabase | `LOCAL-APPROVED` | **PASS** |
| `src/utils/__tests__/personnelPlacement.test.js` | Vitest Unit | Personnel Placement Utilities | Validates Academic (College + Programs) and Non-Academic (Admin Unit) placement formatting and validation | `LOCAL-APPROVED` | **PASS** |
| `src/components/ui/__tests__/avatar.test.jsx` | Vitest Component | UI Component | Renders avatar with fallback initials | `DUAL-MODE` | **PASS** |
| `src/components/ui/__tests__/ui_achievements.test.jsx` | Vitest Component | UI Component | Renders achievement badges and status chips | `DUAL-MODE` | **PASS** |
| `src/components/ui/__tests__/ui_components.test.jsx` | Vitest Component | UI Components | Renders core buttons, inputs, alerts, and modals | `DUAL-MODE` | **PASS** |

---

## Classification Totals
- **LOCAL-APPROVED Tests**: 6 suites
- **DUAL-MODE Tests**: 23 suites
- **HOSTED-PRESERVED Tests**: 0 suites (All 29 suites run seamlessly in local-defense mode)
- **Total Test Files**: 29 files (190 tests, 100% PASSED)
