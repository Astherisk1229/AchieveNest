# Controller-to-Table Access Map

| Controller Class | File Path | Tables Accessed Directly |
|---|---|---|
| `AccountLifecycleController` | `app/Controllers/Api/AccountLifecycleController.php` | `profiles`, `account_lifecycle_events`, `audit_logs` |
| `AchievementController` | `app/Controllers/Api/AchievementController.php` | `student_portfolio_records spr`, `portfolio_categories`, `student_portfolio_records`, `student_portfolio_verification_events` |
| `AuthController` | `app/Controllers/Api/AuthController.php` | `student_program_enrollments`, `academic_programs`, `colleges`, `personnel_profiles`, `personnel_college_affiliations`, `personnel_administrative_unit_affiliations`, `administrative_units`, `personnel_program_affiliations`, `local_auth_credentials`, `try`, `password`, `profiles`, `password_reset_events` |
| `AwardEvaluationController` | `app/Controllers/Api/AwardEvaluationController.php` | `award_definitions`, `award_criteria`, `award_criterion_components`, `student_award_evaluations sae`, `dean_student_nominations dsn`, `student_award_criterion_scores sacs`, `student_award_score_evidence sase`, `dean_assignments`, `profiles`, `verified` |
| `CollegeController` | `app/Controllers/Api/CollegeController.php` | `multipart`, `academic` |
| `DeanAnnualReviewController` | `app/Controllers/Api/DeanAnnualReviewController.php` | `personnel_annual_reviews` |
| `EvaluationScaleController` | `app/Controllers/Api/EvaluationScaleController.php` | `personnel` |
| `EventController` | `app/Controllers/Api/EventController.php` | `events`, `profiles`, `portfolio_categories`, `student_portfolio_records` |
| `EvidenceController` | `app/Controllers/Api/EvidenceController.php` | `student_portfolio_evidence spe`, `personnel_accomplishment_evidence pae` |
| `FacultyInitialRankController` | `app/Controllers/Api/FacultyInitialRankController.php` | `verified`, `personnel_profiles` |
| `FacultyRankCatalogController` | `app/Controllers/Api/FacultyRankCatalogController.php` | Delegates to Services |
| `HealthController` | `app/Controllers/Api/HealthController.php` | Delegates to Services |
| `HREvaluationController` | `app/Controllers/Api/HREvaluationController.php` | `public.personnel_qualification_reviews`, `public.personnel_evaluation_deficiency_requests`, `public.personnel_evaluations pe`, `public.personnel_evaluation_items`, `public.personnel_evaluations`, `public.personnel_evaluation_events`, `public`, `public.personnel_evaluation_reports`, `may` |
| `HRPersonnelController` | `app/Controllers/Api/HRPersonnelController.php` | `profiles p`, `dean_assignments`, `colleges`, `personnel_qualification_reviews`, `profiles`, `personnel_qualification_reviews qr`, `password_reset_requests`, `personnel_evaluations`, `account_lifecycle_events` |
| `OrganizationController` | `app/Controllers/Api/OrganizationController.php` | `organization`, `student`, `an` |
| `PartTimeFacultyTitleController` | `app/Controllers/Api/PartTimeFacultyTitleController.php` | `verified` |
| `PasswordResetRequestController` | `app/Controllers/Api/PasswordResetRequestController.php` | `profiles`, `password_reset_requests`, `password_reset_requests prr`, `user` |
| `PersonnelAccomplishmentController` | `app/Controllers/Api/PersonnelAccomplishmentController.php` | `personnel_accomplishments pa`, `personnel_accomplishment_evidence`, `personnel_accomplishments`, `accomplishment` |
| `PersonnelEligibilityController` | `app/Controllers/Api/PersonnelEligibilityController.php` | Delegates to Services |
| `PersonnelPortfolioSubmissionController` | `app/Controllers/Api/PersonnelPortfolioSubmissionController.php` | `personnel_accomplishments pa`, `personnel_accomplishment_evidence`, `the`, `actor`, `evaluation`, `item`, `to`, `a`, `public.profiles`, `profiles`, `public.personnel_evaluation_deficiency_requests`, `personnel_evaluation_deficiency_requests`, `public.personnel_evaluation_reports`, `personnel_evaluation_reports`, `personnel_accomplishments` |
| `PersonnelRoleController` | `app/Controllers/Api/PersonnelRoleController.php` | `dean_assignments`, `profiles`, `colleges`, `program_coordinator_assignments`, `academic_programs`, `organization_moderator_assignments`, `organizations`, `personnel_profiles`, `personnel_college_affiliations`, `personnel_program_affiliations` |
| `ProvisioningController` | `app/Controllers/Api/ProvisioningController.php` | `public.profiles`, `public.degree_programs`, `public.roles`, `public.profile_roles`, `public.account_lifecycle_events` |
| `StudentPortfolioController` | `app/Controllers/Api/StudentPortfolioController.php` | `portfolio_categories`, `portfolio_subcategories`, `student_portfolio_records spr`, `student_portfolio_evidence`, `student_portfolio_verification_events ve`, `student_portfolio_records`, `student_portfolio_verification_events`, `notifications` |
| `StudentProfileController` | `app/Controllers/Api/StudentProfileController.php` | `student_program_enrollments`, `academic_programs`, `colleges`, `program_coordinator_assignments`, `profiles`, `organization_program_affiliations`, `organizations`, `organization_moderator_assignments` |
| `TargetHRPersonnelController` | `app/Controllers/Api/TargetHRPersonnelController.php` | `dean_assignments`, `colleges`, `personnel_qualification_reviews`, `profiles p`, `personnel_program_affiliations`, `academic_programs`, `program_coordinator_assignments`, `organization_moderator_assignments`, `personnel`, `profiles`, `personnel_profiles`, `account_lifecycle_events`, `personnel_college_affiliations` |
| `TargetProvisioningController` | `app/Controllers/Api/TargetProvisioningController.php` | `profiles`, `academic_programs`, `roles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, `local_auth_credentials`, `audit_logs`, `profiles p`, `administrative_units`, `personnel_profiles`, `personnel_college_affiliations`, `personnel_program_affiliations`, `personnel_administrative_unit_affiliations`, `account_lifecycle_events` |
| `VerificationQueueController` | `app/Controllers/Api/VerificationQueueController.php` | `student_portfolio_records`, `student_portfolio_records spr`, `student_portfolio_verification_events` |
| `in` | `app/Controllers/BaseController.php` | Delegates to Services |
| `Home` | `app/Controllers/Home.php` | Delegates to Services |
