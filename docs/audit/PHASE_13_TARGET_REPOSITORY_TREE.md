# Phase 13 — Target Repository Tree Specification

## Overview
This document specifies the intended post-cleanup repository architecture for AchieveNest. It provides a structural comparison between the current repository layout and the target repository layout following the execution of Phase 14 (physical cleanup) and Phase 15 (validation).

---

## 1. Current Top-Level Tree

```text
AchieveNest/
├── AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump  [Database snapshot]
├── AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md  [Milestone report]
├── AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md  [Milestone report]
├── AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md  [Milestone report]
├── AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md  [Milestone report]
├── AchieveNest_Phase_7_Test_Reconciliation_Report.md  [Milestone report]
├── AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md  [Milestone report]
├── AchieveNest_Phase_8_E2E_Test_Matrix.md  [Milestone report]
├── STARTUP_COMMANDS.md  [Untracked operational runbook]
├── USER_WORKFLOW_AND_IMPROVEMENTS.md  [Architecture & product specification]
├── package.json / package-lock.json / vitest.config.js / vite.config.js / README.md / LICENSE
├── node_modules/
│   └── .vite/deps/  [15 tracked generated cache files]
├── backend/
│   ├── app/
│   │   ├── Commands/
│   │   ├── Config/
│   │   ├── Controllers/
│   │   ├── Database/ (Migrations, Seeds)
│   │   ├── Filters/
│   │   ├── Helpers/
│   │   ├── Language/
│   │   ├── Libraries/
│   │   ├── Models/
│   │   ├── Services/ (Policies)
│   │   ├── ThirdParty/
│   │   ├── Views/
│   │   └── .htaccess
│   ├── database/mysql-defense/
│   ├── development/
│   │   ├── node_modules/  [1,108 tracked generated dependency files]
│   │   ├── verify-admin-bootstrap-full.mjs  [Duplicate script DCE-BE-001]
│   │   └── ... (local provisioning scripts)
│   ├── scripts/
│   │   └── verify-admin-bootstrap-full.mjs  [Canonical historical script]
│   ├── tests/
│   └── writable/backups/
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/ (common, layout, osad, ui)
│   │   ├── config/
│   │   ├── context/
│   │   ├── controllers/
│   │   ├── hooks/
│   │   ├── models/
│   │   ├── pages/ (auth, student, personnel, hr-admin, osad-admin)
│   │   ├── security/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── test/
│   │   └── utils/
│   └── scripts/
└── docs/
    └── audit/  [Phase 0 through Phase 13 audit deliverables]
```

---

## 2. Target Top-Level Tree

```text
AchieveNest/
├── package.json / package-lock.json / vitest.config.js / vite.config.js / README.md / LICENSE
├── archive/
│   └── database/
│       └── AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump
├── backend/
│   ├── app/
│   │   ├── Commands/
│   │   ├── Config/
│   │   ├── Controllers/
│   │   ├── Database/
│   │   │   ├── Migrations/
│   │   │   └── Seeds/
│   │   ├── Filters/
│   │   ├── Helpers/
│   │   ├── Language/
│   │   ├── Libraries/
│   │   ├── Models/
│   │   ├── Services/
│   │   │   └── Policies/
│   │   ├── ThirdParty/
│   │   ├── Views/
│   │   └── .htaccess
│   ├── database/
│   │   └── mysql-defense/
│   ├── development/  [Active provisioning scripts only; node_modules untracked]
│   │   ├── auth-only-pilot.mjs
│   │   ├── bootstrap-admin-authority.mjs
│   │   ├── provision-personnel-demo.mjs
│   │   ├── provision-remaining-personnel.mjs
│   │   ├── provision-remaining-students.mjs
│   │   ├── provision-student-demo.mjs
│   │   ├── reset-demo-passwords.mjs
│   │   └── validate-rosters.mjs
│   ├── scripts/
│   │   ├── verify-admin-bootstrap-full.mjs
│   │   ├── run-all-tests.bat
│   │   └── ...
│   ├── tests/
│   └── writable/
│       └── backups/  [Local runtime snapshots, gitignored]
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   ├── layout/
│   │   │   ├── osad/
│   │   │   └── ui/
│   │   ├── config/
│   │   ├── context/
│   │   ├── controllers/
│   │   ├── hooks/
│   │   ├── models/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── student/
│   │   │   ├── personnel/
│   │   │   │   ├── organization-moderator/
│   │   │   │   └── program-coordinator/
│   │   │   ├── hr-admin/
│   │   │   │   ├── evaluation-submissions/
│   │   │   │   │   ├── queue/
│   │   │   │   │   └── studio/
│   │   │   │   ├── modals/
│   │   │   │   └── personnel-directory/
│   │   │   └── osad-admin/
│   │   ├── security/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── test/
│   │   └── utils/
│   └── scripts/
└── docs/
    ├── architecture/
    │   └── USER_WORKFLOW_AND_IMPROVEMENTS.md
    ├── audit/
    │   └── PHASE_*.[md|csv]
    ├── history/
    │   └── AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md
    ├── reports/
    │   ├── AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md
    │   ├── AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md
    │   ├── AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md
    │   ├── AchieveNest_Phase_7_Test_Reconciliation_Report.md
    │   ├── AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md
    │   └── AchieveNest_Phase_8_E2E_Test_Matrix.md
    └── runbooks/
        └── STARTUP_COMMANDS.md
```

---

## 3. Target Frontend Tree (`frontend/src/`)

```text
frontend/src/
├── assets/
│   ├── ndmu_campus_banner.png
│   └── ndmu_seal.png
├── components/
│   ├── common/
│   │   ├── ActiveRoleGuard.jsx
│   │   ├── AdminOnboardingGuideWidget.jsx
│   │   ├── NotificationPopover.jsx
│   │   ├── RouteLoadingFallback.jsx
│   │   └── SessionTimeoutModal.jsx
│   ├── layout/
│   │   ├── Footer.jsx
│   │   ├── MainLayout.jsx
│   │   ├── Sidebar.jsx
│   │   └── Topbar.jsx
│   ├── osad/
│   │   ├── AdvancementDecisionCorrectionModal.jsx
│   │   ├── BatchInterviewAdvancementModal.jsx
│   │   ├── BatchInterviewAdvancementToolbar.jsx
│   │   ├── CandidatePortfolioReviewDrawer.jsx
│   │   ├── CandidateReviewActions.jsx
│   │   ├── CandidateStatusBadge.jsx
│   │   ├── CategoryOverviewCards.jsx
│   │   ├── CertificateTemplateEditorModal.jsx
│   │   ├── OSADOperationalSummary.jsx
│   │   └── PotentialAwardCandidatesPreview.jsx
│   ├── security/
│   │   └── PermissionRoute.jsx
│   └── ui/
│       ├── avatar.jsx
│       ├── badge.jsx
│       ├── button.jsx
│       ├── card.jsx
│       ├── dialog.jsx
│       ├── dropdown-menu.jsx
│       ├── input.jsx
│       ├── label.jsx
│       ├── progress.jsx
│       ├── select.jsx
│       ├── separator.jsx
│       ├── skeleton.jsx
│       ├── tabs.jsx
│       ├── textarea.jsx
│       └── tooltip.jsx
├── config/
│   ├── constants.js
│   ├── env.js
│   └── supabase.js
├── context/
│   └── AuthContext.jsx
├── controllers/
│   ├── AcademicStructureController.js
│   ├── AdminSetupGuideController.js
│   ├── AttendanceController.js
│   ├── AuthController.js
│   ├── AwardManagementController.js
│   ├── CertificateIssuanceController.js
│   ├── CertificateTemplateController.js
│   ├── HRAuditTrailController.js
│   ├── HRController.js
│   ├── HRRankingController.js
│   ├── OcrScanController.js
│   ├── OrganizationController.js
│   ├── OSADController.js
│   ├── PersonnelAchievementController.js
│   ├── PersonnelDashboardController.js
│   ├── PersonnelOnboardingDraftController.js
│   ├── PersonnelPortfolioController.js
│   ├── RosterController.js
│   ├── RouteAccessController.js
│   ├── SecurityController.js
│   ├── StudentAchievementController.js
│   ├── UrlSecurityController.js
│   ├── UserProfileController.js
│   ├── UserSettingsController.js
│   └── VerificationController.js
├── hooks/
│   ├── useAdminSetupGuide.js
│   ├── useCertificateTemplates.js
│   ├── useHR.js
│   ├── useHRAuditTrail.js
│   ├── useHRRanking.js
│   ├── useIdleSession.js
│   ├── useOrganization.js
│   ├── useOSAD.js
│   ├── usePersonnelAchievements.js
│   ├── usePersonnelOnboardingDraft.js
│   ├── usePersonnelPortfolio.js
│   ├── useStudentAchievements.js
│   ├── useStudentRoster.js
│   ├── useTheme.js
│   ├── useUserProfile.js
│   ├── useUserSettings.js
│   └── useVerification.js
├── models/
│   ├── AccountRolePresentation.js
│   ├── AchievementModel.js
│   ├── AdminSetupGuideRegistry.js
│   ├── AdminSetupStatusModel.js
│   ├── AwardCandidacyModel.js
│   ├── AwardCycleModel.js
│   ├── CertificateTemplateModel.js
│   ├── CertificateTemplateVersionModel.js
│   ├── CollegeModel.js
│   ├── DegreeProgramModel.js
│   ├── EventModel.js
│   ├── HRAuditEventRegistry.js
│   ├── HRModel.js
│   ├── IssuedCertificateModel.js
│   ├── OcrScanModel.js
│   ├── OrganizationModel.js
│   ├── OrganizationModeratorAssignmentModel.js
│   ├── OSADDashboardMetricsModel.js
│   ├── PersonnelOnboardingDraftModel.js
│   ├── PersonnelPortfolioModel.js
│   ├── ProgramCoordinatorAssignmentModel.js
│   ├── RankingCriteriaModel.js
│   ├── StudentModel.js
│   ├── StudentOrganizationModel.js
│   ├── UserModel.js
│   ├── UserProfilePreferencesModel.js
│   ├── UserSettingsModel.js
│   └── VerificationQueueModel.js
├── pages/
│   ├── auth/
│   │   ├── LoginPage.jsx
│   │   ├── PasswordResetRequestModal.jsx
│   │   └── UnauthorizedPage.jsx
│   ├── hr-admin/
│   │   ├── evaluation-submissions/
│   │   │   ├── queue/
│   │   │   │   ├── VerificationQueueEmptyState.jsx
│   │   │   │   ├── VerificationQueueFilters.jsx
│   │   │   │   ├── VerificationQueueHeader.jsx
│   │   │   │   ├── VerificationQueueRow.jsx
│   │   │   │   ├── VerificationQueueTable.jsx
│   │   │   │   ├── VerificationQueueToolbar.jsx
│   │   │   │   └── VerificationStatusTabs.jsx
│   │   │   └── studio/
│   │   │       ├── evaluation/
│   │   │       │   ├── scoring/
│   │   │       │   │   ├── AutomaticDerivedControl.jsx
│   │   │       │   │   ├── FixedScoreControl.jsx
│   │   │       │   │   ├── ManualBoundedControl.jsx
│   │   │       │   │   ├── MatrixLookupControl.jsx
│   │   │       │   │   └── MultiFactorControl.jsx
│   │   │       │   └── CriterionEvaluation.jsx
│   │   │       ├── portfolio/
│   │   │       │   └── PortfolioNavigator.jsx
│   │   │       ├── StudioDecisionBar.jsx
│   │   │       └── StudioHeader.jsx
│   │   ├── modals/
│   │   │   └── DeanAssignmentModal.jsx
│   │   ├── personnel-directory/
│   │   │   ├── EditAssignmentModal.jsx
│   │   │   ├── FacultyDossierDrawer.jsx
│   │   │   ├── GovernanceTabs.jsx
│   │   │   ├── OnboardPersonnelModal.jsx
│   │   │   ├── PasswordResetQueue.jsx
│   │   │   ├── PersonnelActionsMenu.jsx
│   │   │   ├── PersonnelDirectoryHeader.jsx
│   │   │   ├── PersonnelDirectoryTable.jsx
│   │   │   └── ResetPersonnelPasswordModal.jsx
│   │   ├── HRAuditTrailPage.jsx
│   │   ├── HRDashboardPage.jsx
│   │   ├── HREvaluationSubmissionsPage.jsx
│   │   ├── HRPersonnelDirectoryPage.jsx
│   │   └── HRPersonnelRankingPage.jsx
│   ├── osad-admin/
│   │   ├── modals/
│   │   │   ├── CreateCollegeModal.jsx
│   │   │   ├── CreateProgramModal.jsx
│   │   │   └── PersonnelSelectorModal.jsx
│   │   ├── OSADAcademicHeaderActions.js
│   │   ├── OSADAcademicProgramsPage.jsx
│   │   ├── OSADAccreditationReportsPage.jsx
│   │   ├── OSADAwardCandidateReviewPage.jsx
│   │   ├── OSADAwardCategoriesPage.jsx
│   │   ├── OSADCertificateTemplatesPage.jsx
│   │   ├── OSADCommandCenterPage.jsx
│   │   ├── OSADDashboardPage.jsx
│   │   ├── OSADPasswordResetRequestsPage.jsx
│   │   ├── OSADStudentAccountsPage.jsx
│   │   ├── OSADStudentOrganizationsPage.jsx
│   │   └── OSADSystemAuditLogsPage.jsx
│   ├── personnel/
│   │   ├── modals/
│   │   │   ├── AchievementPreviewModal.jsx
│   │   │   ├── EditBasicInfoModal.jsx
│   │   │   └── PersonnelSubmissionModal.jsx
│   │   ├── organization-moderator/
│   │   │   ├── certificates/
│   │   │   │   ├── modals/
│   │   │   │   │   ├── CertificateIssuancePreview.jsx
│   │   │   │   │   ├── CertificateRecipientReview.jsx
│   │   │   │   │   ├── CertificateSignatoryResolver.jsx
│   │   │   │   │   ├── CertificateTemplatePicker.jsx
│   │   │   │   │   └── IssueCertificatesModal.jsx
│   │   │   │   └── DigitalCertificatesWorkspace.jsx
│   │   │   ├── AttendanceScannerModal.jsx
│   │   │   ├── DigitalCertificateModal.jsx
│   │   │   ├── EventCardOptionsMenu.jsx
│   │   │   ├── EventCreationModal.jsx
│   │   │   ├── OfficerScannerPage.jsx
│   │   │   └── OrganizationModeratorDashboardPage.jsx
│   │   ├── program-coordinator/
│   │   │   ├── CoordinatorDashboardPage.jsx
│   │   │   └── CoordinatorMetricsSidebar.jsx
│   │   ├── AchievementPopoverMenu.jsx
│   │   ├── PersonnelAchievementsPage.jsx
│   │   ├── PersonnelDashboardPage.jsx
│   │   ├── PersonnelPortfolioBookletModal.jsx
│   │   ├── PersonnelPortfolioEditPage.jsx
│   │   ├── PersonnelPortfolioPage.jsx
│   │   ├── PortfolioSummaryCard.jsx
│   │   └── RichAchievementSearchBar.jsx
│   └── student/
│       ├── modals/
│       │   ├── AchievementSubmissionModal.jsx
│       │   ├── EditStudentInfoModal.jsx
│       │   ├── ExportPortfolioPreviewModal.jsx
│       │   └── StudentAchievementPreviewModal.jsx
│       ├── StudentAchievementPopoverMenu.jsx
│       ├── StudentAchievementsPage.jsx
│       ├── StudentDashboardPage.jsx
│       └── StudentPortfolioPage.jsx
├── security/
│   ├── governanceOwnership.js
│   └── permissionResolver.js
├── services/
│   ├── achievementService.js
│   ├── apiClient.js
│   ├── authService.js
│   ├── AwardPortfolioReviewService.js
│   ├── CertificateTemplateRecommendationService.js
│   ├── CertificateTemplateRenderer.js
│   ├── hrAdminService.js
│   ├── lifecycleService.js
│   ├── passwordResetAdminService.js
│   ├── portfolioPdfGenerator.js
│   ├── portfolioService.js
│   ├── provisioningService.js
│   ├── roleService.js
│   └── Stage1CandidateReportService.js
├── styles/
│   ├── App.css
│   └── index.css
├── test/
│   └── setup.js
└── utils/
    ├── nameFormatter.js
    ├── personnelPlacement.js
    ├── portalRoutes.js
    ├── roleContext.js
    ├── safeCsvExport.js
    ├── securityUtils.js
    ├── signatureVault.js
    └── verificationMetrics.js
```

---

## 4. Target Backend Tree (`backend/`)

```text
backend/
├── app/
│   ├── Commands/
│   │   ├── CheckDatabaseHealth.php
│   │   ├── CleanupOrphanedUploads.php
│   │   ├── CreateAdminUser.php
│   │   ├── GenerateDailyMetrics.php
│   │   ├── InspectUploadRegistry.php
│   │   ├── PurgeExpiredSessions.php
│   │   ├── ReconcileSupabaseAuth.php
│   │   ├── RunVerificationTests.php
│   │   ├── VerifyPhase8Security.php
│   │   └── VerifyPhase9Storage.php
│   ├── Config/
│   │   ├── App.php
│   │   ├── Auth.php
│   │   ├── Database.php
│   │   ├── Filters.php
│   │   ├── Routes.php
│   │   └── ...
│   ├── Controllers/
│   │   ├── AccountLifecycleController.php
│   │   ├── AuthController.php
│   │   ├── AwardEvaluationController.php
│   │   ├── CertificateController.php
│   │   ├── GovernanceController.php
│   │   ├── HealthCheckController.php
│   │   ├── HREvaluationController.php
│   │   ├── MetricsController.php
│   │   ├── OrganizationController.php
│   │   ├── PasswordResetController.php
│   │   ├── StorageController.php
│   │   └── VerificationController.php
│   ├── Database/
│   │   ├── Migrations/ (000001_initial_schema.sql to 000026_*.sql)
│   │   └── Seeds/ (001_roles_seeder.sql to 015_*.sql)
│   ├── Filters/
│   │   ├── AuthFilter.php
│   │   ├── CorsFilter.php
│   │   └── RateLimitFilter.php
│   ├── Helpers/
│   ├── Language/
│   ├── Libraries/
│   ├── Models/
│   │   ├── AccountModel.php
│   │   ├── AchievementModel.php
│   │   ├── AuditLogModel.php
│   │   ├── AwardCandidateModel.php
│   │   ├── CertificateTemplateModel.php
│   │   ├── CollegeModel.php
│   │   ├── DegreeProgramModel.php
│   │   ├── EvaluationRecordModel.php
│   │   ├── OrganizationModel.php
│   │   ├── PasswordResetRequestModel.php
│   │   ├── StudentModel.php
│   │   └── UserModel.php
│   ├── Services/
│   │   ├── Policies/
│   │   │   ├── AwardPolicy.php
│   │   │   ├── GovernancePolicy.php
│   │   │   ├── HREvaluationPolicy.php
│   │   │   └── StoragePolicy.php
│   │   ├── AccountLifecycleService.php
│   │   ├── AuthService.php
│   │   ├── AwardEvaluationService.php
│   │   ├── CertificateIssuanceService.php
│   │   ├── GovernanceService.php
│   │   ├── HREvaluationService.php
│   │   ├── LocalStorageService.php
│   │   ├── MetricsCalculationService.php
│   │   ├── PasswordResetService.php
│   │   ├── SupabaseAdminAuthService.php
│   │   ├── SupabaseAuthService.php
│   │   └── VerificationService.php
│   ├── ThirdParty/
│   ├── Views/
│   └── .htaccess
├── database/
│   └── mysql-defense/
│       ├── migrations/
│       └── seeds/
├── development/  [Retained provisioning scripts; node_modules untracked]
│   ├── auth-only-pilot.mjs
│   ├── bootstrap-admin-authority.mjs
│   ├── provision-personnel-demo.mjs
│   ├── provision-remaining-personnel.mjs
│   ├── provision-remaining-students.mjs
│   ├── provision-student-demo.mjs
│   ├── reset-demo-passwords.mjs
│   └── validate-rosters.mjs
├── scripts/
│   ├── check-migrations.mjs
│   ├── reset-demo-state.mjs
│   ├── run-all-tests.bat
│   ├── seed-local-defense.mjs
│   ├── smoke-test.mjs
│   ├── test-local-defense.mjs
│   ├── verify-admin-bootstrap-full.mjs
│   ├── verify-local-defense.mjs
│   └── verify-schema.mjs
├── tests/
│   ├── Database/
│   ├── Feature/
│   ├── Unit/
│   ├── phpunit.xml
│   └── ...
└── writable/
    ├── backups/
    ├── cache/
    ├── logs/
    ├── session/
    └── uploads/
```

---

## 5. Target Docs Tree (`docs/`)

```text
docs/
├── architecture/
│   └── USER_WORKFLOW_AND_IMPROVEMENTS.md
├── audit/
│   ├── PHASE_0_FREEZE_AND_SAFETY_BASELINE.md
│   ├── PHASE_1_REPOSITORY_INVENTORY.md
│   ├── PHASE_1_REPOSITORY_INVENTORY.csv
│   ├── PHASE_2_FRONTEND_ROUTE_REACHABILITY.md
│   ├── PHASE_2_FRONTEND_ROUTE_MAP.csv
│   ├── PHASE_3_FRONTEND_DEPENDENCY_AUDIT.md
│   ├── PHASE_3_FRONTEND_DEPENDENCY_MAP.csv
│   ├── PHASE_4_FRONTEND_BACKEND_API_CONTRACT_MAP.md
│   ├── PHASE_4_API_CONTRACT_MAP.csv
│   ├── PHASE_4_API_CONTRACT_ISSUES.csv
│   ├── PHASE_5_BACKEND_ROUTE_AUDIT.md
│   ├── PHASE_5_BACKEND_ROUTE_MAP.csv
│   ├── PHASE_5_BACKEND_ROUTE_REVIEW_CANDIDATES.csv
│   ├── PHASE_6_CONTROLLER_SERVICE_DATA_ACCESS_AUDIT.md
│   ├── PHASE_6_BACKEND_RESPONSIBILITY_MAP.csv
│   ├── PHASE_6_BACKEND_REVIEW_CANDIDATES.csv
│   ├── PHASE_7_DATABASE_MIGRATION_SEED_LINKAGE_AUDIT.md
│   ├── PHASE_7_DATABASE_ARTIFACT_MAP.csv
│   ├── PHASE_7_DATABASE_REVIEW_CANDIDATES.csv
│   ├── PHASE_7_SQL_ARTIFACT_RECONCILIATION_ADDENDUM.md
│   ├── PHASE_7_TABLE_RUNTIME_USAGE.csv
│   ├── PHASE_8_SCRIPTS_COMMANDS_NON_HTTP_ENTRY_POINTS.md
│   ├── PHASE_8_NON_HTTP_ENTRY_POINT_REGISTER.csv
│   ├── PHASE_8_SCRIPT_REVIEW_CANDIDATES.csv
│   ├── PHASE_8_ENTRY_POINT_RECONCILIATION_ADDENDUM.md
│   ├── PHASE_9_DOCUMENTATION_REPORTS_ROOT_CLUTTER_AUDIT.md
│   ├── PHASE_9_DOCUMENTATION_ARTIFACT_REGISTER.csv
│   ├── PHASE_9_CLEANUP_REVIEW_CANDIDATES.csv
│   ├── PHASE_9_GENERATED_DEPENDENCY_RECONCILIATION_ADDENDUM.md
│   ├── PHASE_10_OBSOLETE_TECHNOLOGY_AUDIT.md
│   ├── PHASE_10_LEGACY_TECHNOLOGY_REGISTER.csv
│   ├── PHASE_10_DEPRECATION_REVIEW_CANDIDATES.csv
│   ├── PHASE_11_DUPLICATE_NEAR_DUPLICATE_DETECTION.md
│   ├── PHASE_11_DUPLICATE_REGISTER.csv
│   ├── PHASE_11_CONSOLIDATION_REVIEW_CANDIDATES.csv
│   ├── PHASE_12_DEAD_CODE_CANDIDATE_REGISTER.md
│   ├── PHASE_12_DEAD_CODE_CANDIDATES.csv
│   ├── PHASE_12_INTENTIONAL_SCOPE_REMOVALS.csv
│   ├── PHASE_12_RETAINED_NON_DEAD_ARTIFACTS.csv
│   ├── PHASE_13_TARGET_FILE_ORGANIZATION_REVIEW.md
│   ├── PHASE_13_TARGET_ORGANIZATION_MAP.csv
│   ├── PHASE_13_MOVE_REVIEW_CANDIDATES.csv
│   └── PHASE_13_TARGET_REPOSITORY_TREE.md
├── history/
│   └── AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md
├── reports/
│   ├── AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md
│   ├── AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md
│   ├── AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md
│   ├── AchieveNest_Phase_7_Test_Reconciliation_Report.md
│   ├── AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md
│   └── AchieveNest_Phase_8_E2E_Test_Matrix.md
└── runbooks/
    └── STARTUP_COMMANDS.md
```

---

## 6. Files and Folders Expected to Disappear After Phase 14

### A. Intentional Scope Removals (1 file + caller bindings)
1. `frontend/src/pages/student/modals/DigitalBarcodeIDCardModal.jsx` (DCE-FE-030)

### B. High-Confidence Dead Code Candidates (22 files)
1. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/portfolio/FacultyPortfolioPane.jsx` (DCE-FE-001)
2. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/NDMURatingPane.jsx` (DCE-FE-002)
3. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/portfolio/EvidenceDocumentViewer.jsx` (DCE-FE-003)
4. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/AutomaticDerivedScoring.jsx` (DCE-FE-004)
5. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/FixedOptionScoring.jsx` (DCE-FE-005)
6. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/ManualBoundedScoring.jsx` (DCE-FE-006)
7. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/MixedDegreeScoring.jsx` (DCE-FE-007)
8. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/MultiFactorScoring.jsx` (DCE-FE-008)
9. `frontend/src/pages/hr-admin/evaluation-submissions/studio/EvaluationScoreStrip.jsx` (DCE-FE-009)
10. `frontend/src/pages/hr-admin/modals/HRScoreAuditModal.jsx` (DCE-FE-010)
11. `frontend/src/pages/hr-admin/personnel-directory/CustomDatePicker.jsx` (DCE-FE-011)
12. `frontend/src/pages/hr-admin/personnel-directory/DiscardOnboardingDraftModal.jsx` (DCE-FE-012)
13. `frontend/src/pages/hr-admin/personnel-directory/FacultyDirectory.jsx` (DCE-FE-013)
14. `frontend/src/pages/hr-admin/personnel-directory/OnboardingDraftRecoveryBanner.jsx` (DCE-FE-014)
15. `frontend/src/pages/personnel/PersonnelPortfolioForm.jsx` (DCE-FE-015)
16. `frontend/src/pages/personnel/program-coordinator/ProgramCoordinatorDashboard.jsx` (DCE-FE-016)
17. `frontend/src/pages/personnel/program-coordinator/tabs/CoordinatorQueueTab.jsx` (DCE-FE-017)
18. `frontend/src/pages/personnel/organization-moderator/OrganizationModeratorDashboard.jsx` (DCE-FE-018)
19. `frontend/src/models/AcademicStructureModel.js` (DCE-FE-019)
20. `frontend/src/components/common/ProtectedRoute.jsx` (DCE-FE-020)
21. `frontend/src/components/osad/OSADQuickActions.jsx` (DCE-FE-021)
22. `backend/development/verify-admin-bootstrap-full.mjs` (DCE-BE-001)

### C. Tracked Generated Cache & Dependencies (Untracked in Phase 14)
1. `backend/development/node_modules/` (1,108 tracked files, 20.47 MB)
2. `node_modules/.vite/deps/` (15 tracked files, 6.82 MB)

### D. Directories Naturally Disappearing / Retiring
1. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/portfolio/` (Empty after DCE-FE-001, DCE-FE-003 removal)
2. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/scoring/` (Empty after DCE-FE-004 to DCE-FE-008 removal)
3. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/rating/` (Empty after DCE-FE-002 removal)
4. `frontend/src/pages/hr-admin/evaluation-submissions/evaluation/` (Entire subfolder tree disappears)
5. `frontend/src/pages/personnel/program-coordinator/tabs/` (Empty after DCE-FE-017 removal)
6. `frontend/src/pages/personnel/department-secretary/` (Empty legacy folder; retired in Phase 14)
