# Service-to-Table Access Map

| Service Class | File Path | Tables Accessed |
|---|---|---|
| `AccountLifecycleResolver` | `app/Services/AccountLifecycleResolver.php` | `profiles`, `local_auth_credentials` |
| `AuthenticatedActorService` | `app/Services/AuthenticatedActorService.php` | `Authorization`, `profile_roles`, `their`, `profiles`, `roles`, `dean_assignments`, `colleges`, `program_coordinator_assignments`, `academic_programs`, `organization_moderator_assignments`, `organizations` |
| `AuthorizationService` | `app/Services/AuthorizationService.php` | In-Memory / Policy |
| `AwardCandidateGenerationService` | `app/Services/AwardCandidateGenerationService.php` | `student_program_enrollments`, `award_definitions`, `award_scoring_model_versions`, `profiles`, `award_interview_eligibilities aie` |
| `AwardEligibilityService` | `app/Services/AwardEligibilityService.php` | `institutional`, `student`, `student_program_enrollments`, `award_definitions`, `profiles` |
| `AwardEvaluationService` | `app/Services/AwardEvaluationService.php` | `award_cycles`, `verified`, `award_definitions`, `profiles`, `award_criteria`, `student_portfolio_records`, `award_scoring_rules`, `portfolio_categories`, `award_portfolio_mappings`, `award_evidence_mapping_rules`, `student_award_evaluations`, `student_award_criterion_scores`, `student_award_score_evidence`, `award_interview_eligibilities`, `student_portfolio_records spr`, `dean_assignments`, `student_program_enrollments spe`, `dean_student_nominations`, `interview` |
| `AwardEvaluationSummaryService` | `app/Services/AwardEvaluationSummaryService.php` | `award_definitions`, `profiles`, `award_scoring_model_versions`, `dean_student_nominations`, `award_criteria`, `student_award_criterion_scores`, `student_award_score_evidence sase`, `award_scoring_rules`, `award_student_evaluation_summaries` |
| `AwardEvidenceMappingService` | `app/Services/AwardEvidenceMappingService.php` | `student_portfolio_records`, `award_definitions`, `profiles`, `award_criteria` |
| `AwardPotentialCandidateService` | `app/Services/AwardPotentialCandidateService.php` | `the`, `current`, `student_award_evaluations`, `award_definitions`, `profiles` |
| `AwardReviewService` | `app/Services/AwardReviewService.php` | `award_criteria`, `verified`, `ID`, `award_definitions`, `profiles`, `database`, `student_award_evaluations`, `student_award_criterion_scores s`, `student_award_criterion_scores`, `award_cycles` |
| `AwardScoringRuleEngine` | `app/Services/AwardScoringRuleEngine.php` | `matched`, `award_scoring_rules` |
| `AwardScoringService` | `app/Services/AwardScoringService.php` | In-Memory / Policy |
| `CampusJournalismEligibilityService` | `app/Services/CampusJournalismEligibilityService.php` | `student_portfolio_evidence`, `student_portfolio_records spr`, `profiles`, `student_program_enrollments` |
| `CampusJournalismScoringService` | `app/Services/CampusJournalismScoringService.php` | `student_portfolio_evidence`, `profiles p` |
| `CollegeService` | `app/Services/CollegeService.php` | `colleges c`, `academic_programs`, `dean_assignments`, `profiles`, `academic_programs ap`, `program_coordinator_assignments`, `colleges`, `program`, `an`, `personnel_program_affiliations`, `program_coordinator_assignments pca`, `profiles p`, `Program` |
| `DeanAnnualReviewService` | `app/Services/DeanAnnualReviewService.php` | `dean_assignments`, `profiles`, `personnel_profiles`, `personnel_college_affiliations`, `colleges`, `personnel_annual_reviews`, `account_lifecycle_events` |
| `DefenseDemoConfigService` | `app/Services/DefenseDemoConfigService.php` | In-Memory / Policy |
| `DefenseDemoPreflightService` | `app/Services/DefenseDemoPreflightService.php` | `colleges`, `academic_programs`, `administrative_units`, `roles`, `the` |
| `EvaluationInstrumentRegistry` | `app/Services/EvaluationInstrumentRegistry.php` | In-Memory / Policy |
| `EvaluationScaleAssignmentService` | `app/Services/EvaluationScaleAssignmentService.php` | `personnel_profiles`, `a` |
| `EvaluationScaleResolver` | `app/Services/EvaluationScaleResolver.php` | `evaluation_scales`, `evaluation_scale_versions`, `personnel_profiles` |
| `EvidenceMappingService` | `app/Services/EvidenceMappingService.php` | `award_evidence_mapping_rules`, `award_evidence_mapping_conditions` |
| `FacultyInitialRankService` | `app/Services/FacultyInitialRankService.php` | `verified`, `Full`, `text` |
| `FacultyRankCatalogService` | `app/Services/FacultyRankCatalogService.php` | `faculty_rank_catalog` |
| `FacultyRankProgressionService` | `app/Services/FacultyRankProgressionService.php` | `faculty_rank_transitions`, `this` |
| `FacultyStatusService` | `app/Services/FacultyStatusService.php` | `payload` |
| `HREvaluationService` | `app/Services/HREvaluationService.php` | `V2` |
| `LocalAuthService` | `app/Services/LocalAuthService.php` | `profiles`, `local_auth_credentials`, `authentication`, `audit_logs`, `account_lifecycle_events`, `password` |
| `LocalEvidenceStorageService` | `app/Services/LocalEvidenceStorageService.php` | In-Memory / Policy |
| `LocalTokenService` | `app/Services/LocalTokenService.php` | `local_auth_sessions`, `profiles`, `last` |
| `OrganizationService` | `app/Services/OrganizationService.php` | `organizations o`, `organization_moderator_assignments`, `profiles`, `organization_program_affiliations opa`, `organization_moderator_assignments oma`, `organizations`, `colleges`, `academic_programs`, `personnel_college_affiliations`, `organization_program_affiliations`, `an`, `if` |
| `PartTimeFacultyTitleService` | `app/Services/PartTimeFacultyTitleService.php` | `faculty_rank_catalog`, `verified` |
| `PersonnelClassificationService` | `app/Services/PersonnelClassificationService.php` | `an` |
| `PersonnelEligibilityService` | `app/Services/PersonnelEligibilityService.php` | `profiles`, `personnel_profiles`, `personnel_annual_reviews`, `personnel_evaluation_roots` |
| `PersonnelEvaluationAuditService` | `app/Services/PersonnelEvaluationAuditService.php` | `inspecting`, `accessing`, `raw` |
| `PersonnelEvaluationFinalizationReadinessService` | `app/Services/PersonnelEvaluationFinalizationReadinessService.php` | `workflows` |
| `PersonnelEvaluationFinalLockService` | `app/Services/PersonnelEvaluationFinalLockService.php` | `ordinary`, `future`, `metadata`, `Promotion` |
| `PersonnelEvaluationPlanHHandoffService` | `app/Services/PersonnelEvaluationPlanHHandoffService.php` | In-Memory / Policy |
| `PersonnelEvaluationPrintService` | `app/Services/PersonnelEvaluationPrintService.php` | `persisted` |
| `PersonnelEvaluationResultPersistenceService` | `app/Services/PersonnelEvaluationResultPersistenceService.php` | `later`, `Plan`, `readiness` |
| `PersonnelEvaluationResultService` | `app/Services/PersonnelEvaluationResultService.php` | `PersonnelEvaluationScoringService`, `rank` |
| `PersonnelEvaluationScoringService` | `app/Services/PersonnelEvaluationScoringService.php` | `verified` |
| `PersonnelEvaluatorScoringService` | `app/Services/PersonnelEvaluatorScoringService.php` | `Item`, `category` |
| `PersonnelEvaluatorWorkspaceService` | `app/Services/PersonnelEvaluatorWorkspaceService.php` | `Plan` |
| `PersonnelEvidenceAccessService` | `app/Services/PersonnelEvidenceAccessService.php` | `evaluator`, `server` |
| `PersonnelEvidenceIdentityService` | `app/Services/PersonnelEvidenceIdentityService.php` | `match`, `{$itemsTable} i`, `{$evTable} e` |
| `PersonnelEvidenceOcrIntegrationService` | `app/Services/PersonnelEvidenceOcrIntegrationService.php` | `file`, `storage` |
| `PersonnelEvidenceUploadService` | `app/Services/PersonnelEvidenceUploadService.php` | `personnel_accomplishments`, `token`, `personnel_accomplishment_evidence` |
| `PersonnelEvidenceVersioningService` | `app/Services/PersonnelEvidenceVersioningService.php` | `accomplishment`, `personnel_accomplishments`, `personnel_accomplishment_evidence`, `working`, `personnel_accomplishment_evidence pae` |
| `PersonnelPromotionDecisionService` | `app/Services/PersonnelPromotionDecisionService.php` | `Engine`, `rank` |
| `PersonnelReviewerAssignmentService` | `app/Services/PersonnelReviewerAssignmentService.php` | `authoritative`, `personnel` |
| `PersonnelReviewerRoutingRegistry` | `app/Services/PersonnelReviewerRoutingRegistry.php` | `authoritative` |
| `PersonnelRevisionRequestService` | `app/Services/PersonnelRevisionRequestService.php` | `returning`, `status`, `Evaluation`, `item` |
| `PersonnelWorkflowEventRegistry` | `app/Services/PersonnelWorkflowEventRegistry.php` | In-Memory / Policy |
| `PersonnelWorkflowEventService` | `app/Services/PersonnelWorkflowEventService.php` | In-Memory / Policy |
| `PersonnelWorkflowNotificationRegistry` | `app/Services/PersonnelWorkflowNotificationRegistry.php` | `occurred` |
| `PersonnelWorkflowNotificationService` | `app/Services/PersonnelWorkflowNotificationService.php` | `persisted`, `page`, `an`, `authoritative` |
| `PersonnelWorkflowStatusService` | `app/Services/PersonnelWorkflowStatusService.php` | `persisted` |
| `AwardPolicy` | `app/Services/Policies/AwardPolicy.php` | In-Memory / Policy |
| `EvidencePolicy` | `app/Services/Policies/EvidencePolicy.php` | `student_portfolio_records`, `a`, `dean_assignments`, `personnel_college_affiliations` |
| `GovernancePolicy` | `app/Services/Policies/GovernancePolicy.php` | In-Memory / Policy |
| `PersonnelPolicy` | `app/Services/Policies/PersonnelPolicy.php` | `personnel_college_affiliations` |
| `StudentPortfolioPolicy` | `app/Services/Policies/StudentPortfolioPolicy.php` | `student_program_enrollments`, `student_program_enrollments spe` |
| `PortfolioConfigurationService` | `app/Services/PortfolioConfigurationService.php` | `evaluation_scale_areas`, `evaluation_scale_categories`, `evaluation_scale_subcategories`, `Parish` |
| `PortfolioCriterionValidationService` | `app/Services/PortfolioCriterionValidationService.php` | `evaluation_scale_areas` |
| `PortfolioStructuredMetadataValidator` | `app/Services/PortfolioStructuredMetadataValidator.php` | `portfolio_categories`, `portfolio_subcategories` |
| `RestrictedSessionRoutePolicy` | `app/Services/RestrictedSessionRoutePolicy.php` | In-Memory / Policy |
| `ReviewerResolverService` | `app/Services/ReviewerResolverService.php` | `profiles`, `personnel_profiles`, `dean_assignments`, `program_coordinator_assignments`, `profile_roles`, `roles`, `personnel_college_affiliations` |
| `RubricAdministrationService` | `app/Services/RubricAdministrationService.php` | `evaluation_scales`, `evaluation_scale_versions`, `evaluation_scale_change_events` |
| `SupabaseAdminAuthService` | `app/Services/SupabaseAdminAuthService.php` | In-Memory / Policy |
| `SupabaseAuthService` | `app/Services/SupabaseAuthService.php` | In-Memory / Policy |
