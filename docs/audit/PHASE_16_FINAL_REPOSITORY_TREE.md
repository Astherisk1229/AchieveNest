# AchieveNest — Phase 16: Final Post-Cleanup Repository Tree

> **Scope:** Authoritative architecture-level directory tree of the post-Phase-15 AchieveNest repository.  
> **Status:** `PASSED / COMPLETED`  
> **Branch:** `audit/project-architecture-linkage`  
> **Starting HEAD:** `f97453d`

---

```text
c:/Users/Admin/Documents/AchieveNest/
├── frontend/                                   # React 18 + Vite Web Application
│   ├── public/                                 # Static public web assets
│   │   ├── favicon.ico
│   │   └── ndmu_seal.png
│   ├── src/
│   │   ├── assets/                             # Bundled image and visual assets
│   │   │   ├── ndmu_campus_banner.png
│   │   │   └── ndmu_login_bg.jpg
│   │   ├── components/                         # Component layer
│   │   │   ├── navigation/                     # AppNavbar, Sidebar, Breadcrumbs
│   │   │   ├── notifications/                  # In-app notifications dropdown & badges
│   │   │   └── ui/                             # Standard UI library (Avatar, Button, Card, Modal, etc.)
│   │   │       └── __tests__/                  # UI unit test suites
│   │   ├── config/                             # Client configuration
│   │   │   ├── constants.js                    # System constants and enumerations
│   │   │   └── supabase.js                     # Dormant local-defense compatibility stub
│   │   ├── context/                            # React Context Providers
│   │   │   ├── AuthContext.jsx                 # Master session and identity provider
│   │   │   └── NotificationContext.jsx         # Realtime notifications provider
│   │   ├── controllers/                        # Frontend orchestration controllers
│   │   │   ├── AdminSetupGuideController.js
│   │   │   ├── AttendanceController.js
│   │   │   ├── CertificateIssuanceController.js
│   │   │   ├── CertificateTemplateController.js
│   │   │   ├── OcrScanController.js
│   │   │   ├── OrganizationController.js
│   │   │   ├── PersonnelPortfolioController.js
│   │   │   ├── RouteAccessController.js
│   │   │   ├── StudentPortfolioController.js
│   │   │   └── __tests__/                      # Controller unit tests
│   │   ├── hooks/                              # Custom React hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useHR.js
│   │   │   ├── useNotification.js
│   │   │   ├── useOSAD.js
│   │   │   ├── usePersonnelPortfolio.js
│   │   │   └── useStudentPortfolio.js
│   │   ├── models/                             # Client-side domain and view models
│   │   │   ├── AchievementModel.js
│   │   │   ├── AdminSetupGuideRegistry.js
│   │   │   ├── AdminSetupStatusModel.js
│   │   │   ├── AwardCandidacyModel.js
│   │   │   ├── AwardCycleModel.js
│   │   │   ├── CertificateTemplateRegistry.js
│   │   │   ├── OSADAcademicHierarchy.js
│   │   │   ├── PersonnelPortfolioModel.js
│   │   │   ├── RankingCriteriaModel.js
│   │   │   └── __tests__/                      # Model unit tests
│   │   ├── pages/                              # Domain-specific page components
│   │   │   ├── auth/                           # Authentication pages (Login, Reset, Change)
│   │   │   ├── common/                         # Common shared pages (Account, Settings, Notifications)
│   │   │   ├── hr-admin/                       # HR Administrator views
│   │   │   │   ├── HRDashboardPage.jsx
│   │   │   │   ├── HRAuditTrailPage.jsx
│   │   │   │   ├── HRPasswordResetRequestsPage.jsx
│   │   │   │   ├── HRRankAssignmentLogsPage.jsx
│   │   │   │   ├── HRFacultyEvaluationOversightPage.jsx
│   │   │   │   ├── personnel-directory/        # HRPersonnelDirectoryPage & filters
│   │   │   │   └── evaluation-submissions/     # HREvaluationSubmissionsPage
│   │   │   │       ├── studio/                 # StudioHeader, ScoreAuditModal
│   │   │   │       └── evaluation/             # PortfolioEvaluationStudio
│   │   │   │           ├── actions/            # FinalizeEvaluationModal, ReturnForRevisionModal
│   │   │   │           └── rating/             # NDMURatingEngine, NDMURatingRules
│   │   │   │               └── scoring/        # 7 Active evaluation scoring controls
│   │   │   ├── osad-admin/                     # OSAD Administrator views
│   │   │   │   ├── OSADDashboardPage.jsx
│   │   │   │   ├── OSADAwardCandidateReviewPage.jsx
│   │   │   │   └── modals/                     # AwardCriteriaModal, AcademicStructureManagerModal
│   │   │   ├── personnel/                      # Academic & Non-Academic Personnel views
│   │   │   │   ├── PersonnelDashboardPage.jsx  # Main dashboard (Personnel + Dean oversight)
│   │   │   │   ├── PersonnelAchievementsPage.jsx
│   │   │   │   ├── PersonnelPortfolioPage.jsx
│   │   │   │   ├── PersonnelPortfolioEditPage.jsx
│   │   │   │   ├── PortfolioSummaryCard.jsx
│   │   │   │   ├── PersonnelSubmissionModal.jsx
│   │   │   │   ├── PersonnelPortfolioBookletModal.jsx
│   │   │   │   ├── DeanNominationModal.jsx
│   │   │   │   ├── program-coordinator/        # CoordinatorVerificationQueuePage & metrics
│   │   │   │   └── organization-moderator/     # ModeratorDashboard, Scanner, Modals
│   │   │   └── student/                        # Student views
│   │   │       ├── StudentDashboardPage.jsx
│   │   │       ├── StudentAchievementsPage.jsx
│   │   │       ├── StudentPortfolioPage.jsx
│   │   │       └── modals/                     # AchievementSubmissionModal, etc.
│   │   ├── security/                           # Frontend permission and governance resolvers
│   │   │   ├── governanceOwnership.js
│   │   │   ├── permissionResolver.js
│   │   │   └── __tests__/                      # Security unit tests
│   │   ├── services/                           # HTTP services and API clients
│   │   │   ├── apiClient.js
│   │   │   ├── authService.js
│   │   │   ├── AwardPortfolioReviewService.js
│   │   │   ├── passwordResetAdminService.js
│   │   │   ├── Stage1CandidateReportService.js
│   │   │   └── __tests__/                      # Service unit tests & live E2E fixture
│   │   ├── utils/                              # Utility helpers (formatting, placement, roleContext)
│   │   │   └── __tests__/                      # Utility unit tests
│   │   ├── App.jsx                             # Root React Router and top-level routing
│   │   ├── index.css                           # Global design system tokens and Tailwind styles
│   │   └── main.jsx                            # React 18 DOM mount entrypoint
│   ├── package.json
│   └── vite.config.js
│
├── backend/                                    # CodeIgniter 4.7.4 REST API Application
│   ├── app/
│   │   ├── Commands/                           # CLI commands (VerifyPhase15, VerifyPhase14, etc.)
│   │   ├── Config/                             # Framework configuration (Routes, Database, CORS, etc.)
│   │   │   └── Routes.php                      # Authoritative 38 functional routes
│   │   ├── Controllers/
│   │   │   ├── BaseController.php              # Abstract framework controller parent
│   │   │   ├── Home.php                        # Default landing controller
│   │   │   └── Api/                            # 17 Functional API Controllers
│   │   │       ├── AuthController.php
│   │   │       ├── AwardEvaluationController.php
│   │   │       ├── CoordinatorController.php
│   │   │       ├── DeanController.php
│   │   │       ├── EventController.php
│   │   │       ├── EvidenceController.php
│   │   │       ├── HealthController.php
│   │   │       ├── HREvaluationController.php
│   │   │       ├── HRPersonnelController.php
│   │   │       ├── ModeratorController.php
│   │   │       ├── OSADController.php
│   │   │       ├── PasswordResetAdminController.php
│   │   │       ├── PersonnelAccomplishmentController.php
│   │   │       ├── ReferenceDataController.php
│   │   │       ├── StudentPortfolioController.php
│   │   │       ├── TargetHRPersonnelController.php
│   │   │       └── VerificationController.php
│   │   ├── Database/
│   │   │   ├── Migrations/                     # 26 CodeIgniter PHP database migrations
│   │   │   └── Seeds/                          # 5 CodeIgniter PHP database seeders
│   │   ├── Filters/                            # Request filters (CORS, SecureHeaders)
│   │   ├── Models/                             # CodeIgniter Data Models
│   │   ├── Policies/                           # 5 Authorization Policy classes
│   │   │   ├── AwardPolicy.php
│   │   │   ├── EvidencePolicy.php
│   │   │   ├── GovernancePolicy.php
│   │   │   ├── PersonnelPolicy.php
│   │   │   └── StudentPortfolioPolicy.php
│   │   └── Services/                           # Domain and Infrastructure Services
│   │       ├── AuthenticatedActorService.php
│   │       ├── AuthorizationService.php
│   │       ├── EvidenceStorageService.php
│   │       ├── LocalAuthService.php
│   │       ├── LocalTokenService.php
│   │       ├── PermanentReferenceService.php
│   │       ├── SupabaseAdminAuthService.php    # Compatibility stub
│   │       └── SupabaseAuthService.php         # Compatibility stub
│   ├── database/
│   │   └── mysql-defense/
│   │       └── migrations/                     # 11 MySQL Replay SQL Files (000001..000011)
│   ├── public/                                 # Public web entrypoint (index.php, .htaccess)
│   ├── scripts/                                # Maintenance and verification Node.js scripts
│   │   └── verify-admin-bootstrap-full.mjs
│   ├── spark                                   # CodeIgniter CLI executable
│   └── writable/                               # Protected runtime storage (uploads, logs, session cache)
│
├── docs/                                       # Project Documentation & Audit Artifacts
│   ├── architecture/                           # Target architecture specifications
│   │   └── USER_WORKFLOW_AND_IMPROVEMENTS.md
│   ├── audit/                                  # Audit registers, reports & execution plans (Phases 0-16)
│   │   ├── PHASE_14_SAFE_CLEANUP_IMPLEMENTATION.md
│   │   ├── PHASE_14_VALIDATION_ADDENDUM.md
│   │   ├── PHASE_15_REGRESSION_VALIDATION.md
│   │   ├── PHASE_16_FINAL_ARCHITECTURE_MAP.md
│   │   └── ... (CSV registers & audit logs)
│   ├── history/                                # Historical phase reviews and pre-execution audits
│   │   └── AchieveNest_Phase_2_Pre_Execution_Migration_Code_Review.md
│   ├── reports/                                # Historical execution & verification reports (Phases 4-8)
│   │   ├── AchieveNest_Phase_4_Fresh_Disposable_Database_Build_Report.md
│   │   ├── AchieveNest_Phase_5_Reset_and_Replay_Validation_Report.md
│   │   ├── AchieveNest_Phase_6_Fresh_Build_vs_Current_Test_Reconciliation_Report.md
│   │   ├── AchieveNest_Phase_7_Test_Reconciliation_Report.md
│   │   ├── AchieveNest_Phase_8_Application_Security_and_Role_Based_E2E_Validation_Report.md
│   │   └── AchieveNest_Phase_8_E2E_Test_Matrix.md
│   └── runbooks/                               # Operational guides and startup runbooks
│       └── STARTUP_COMMANDS.md
│
├── archive/                                    # Local preserved offline archives
│   └── database/
│       └── AchieveNest-Test_Pre_Phase7_2026-08-28_0036.dump  # SHA256 verified, git-ignored
│
├── .gitignore                                  # Authoritative VCS ignore rules
└── README.md
```
