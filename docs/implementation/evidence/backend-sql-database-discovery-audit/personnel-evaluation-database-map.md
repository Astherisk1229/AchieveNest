# Personnel Evaluation Track (Plans D–K) Database Map

| Domain Concept | Relevant Database Table(s) | Primary Backend Service | Controller & Endpoint | Migration Source | Seeder Source |
|---|---|---|---|---|---|
| **Personnel Master Data** | `profiles`, `personnel_profiles` | `PersonnelClassificationService`, `FacultyStatusService` | `TargetHRPersonnelController` (`GET/PUT /api/v1/hr/personnel/:id/master-data`) | `000060`, `000061` | `DefenseDemoPersonaSeeder` |
| **Colleges & Depts** | `colleges`, `administrative_units` | `CollegeService`, `OrganizationService` | `CollegeController`, `TargetProvisioningController` | `000014`, `000029` | `DemoAcademicStructureSeeder` |
| **Faculty Rank Catalog** | `faculty_rank_catalog`, `faculty_rank_transitions` | `FacultyRankCatalogService`, `FacultyRankProgressionService` | `FacultyRankCatalogController` (`GET /api/v1/faculty-ranks`) | `000064`, `000065` | `000064` (built-in seed) |
| **Part-Time Titles** | `part_time_faculty_titles` | `PartTimeFacultyTitleService` | `PartTimeFacultyTitleController` (`GET /api/v1/faculty-titles/part-time`) | `000066` | `000066` (built-in seed) |
| **Rank Recommendation** | `faculty_rank_catalog`, `personnel_qualifications` | `FacultyInitialRankService` | `FacultyInitialRankController` (`POST /api/v1/faculty-ranks/resolve-initial`) | `000009`, `000064` | N/A (Rule Engine) |
| **Annual Reviews** | `personnel_annual_reviews` | `DeanAnnualReviewService`, `PersonnelEligibilityService` | `DeanAnnualReviewController`, `PersonnelEligibilityController` | `000062` | `DefenseDemoScenarioSeeder` |
| **Evaluation Scales** | `evaluation_scales`, `evaluation_scale_areas`, `evaluation_scale_criteria` | `EvaluationScaleResolver`, `EvaluationInstrumentRegistry` | `EvaluationScaleController` (`GET /api/v1/personnel/evaluation-scale`) | `000063` | `000063` (built-in seed) |
| **Portfolio Submissions** | `personnel_portfolio_submissions`, `personnel_accomplishments` | `PersonnelEvaluationScoringService` | `PersonnelPortfolioSubmissionController` (`POST /api/v1/personnel/portfolio/submit`) | `000008`, `000057` | `DefenseDemoScenarioSeeder` |
| **Evaluation Lifecycle** | `personnel_evaluations`, `personnel_evaluation_items` | `HREvaluationService`, `PersonnelWorkflowStatusService` | `HREvaluationController` (`POST /api/v1/hr/evaluations/:id/start`) | `000005`, `000059` | `DefenseDemoScenarioSeeder` |
| **Scoring & Decision** | `personnel_evaluations`, `personnel_evaluation_items` | `PersonnelEvaluationResultPersistenceService`, `PersonnelPromotionDecisionService` | `HREvaluationController` (`POST /api/v1/hr/evaluations/:id/finalize`) | `000013`, `000059` | N/A |
| **Deliberation Print** | `personnel_evaluations`, `personnel_evaluation_items` | `PersonnelEvaluationPrintService` | `HREvaluationController` (`GET /api/v1/hr/evaluations/:id/report`) | `000059`, `000063` | N/A |
| **Audit Trail** | `personnel_evaluation_audits` | `PersonnelEvaluationAuditService` | `HRPersonnelController` (`GET /api/v1/hr/audit`) | `000018` | Dynamic runtime |
| **Notifications** | `personnel_workflow_notifications` | `PersonnelWorkflowNotificationService` | Internal Event Bus | `000018` | Dynamic runtime |
