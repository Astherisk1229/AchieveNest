# CodeIgniter Migration Index (000001 to 000067)

Total Migration Files: **64**

| # | Migration File | Class Name | Tables Created | Tables Altered | Down() Safe? |
|---|---|---|---|---|---|
| 1 | `2026-08-21-000001_CreateIdentityAndAcademicFoundation.php` | `CreateIdentityAndAcademicFoundation` | `public` | — | YES |
| 2 | `2026-08-23-000002_AddStructuredNameToProfiles.php` | `AddStructuredNameToProfiles` | — | `public` | YES |
| 3 | `2026-08-23-000003_ExpandAdminAccountTypesAndAddRoleAssignmentEvents.php` | `ExpandAdminAccountTypesAndAddRoleAssignmentEvents` | `public` | — | YES |
| 4 | `2026-08-24-000004_EnforceAdminProfileIntegrity.php` | `EnforceAdminProfileIntegrity` | — | `public` | YES |
| 5 | `2026-08-24-000005_CreatePersonnelEvaluationDomain.php` | `CreatePersonnelEvaluationDomain` | `public` | — | YES |
| 6 | `2026-08-25-000006_ReplaceDepartmentSecretaryWithDean.php` | `ReplaceDepartmentSecretaryWithDean` | — | — | YES |
| 7 | `2026-08-25-000007_CreatePasswordResetRequestsDomain.php` | `CreatePasswordResetRequestsDomain` | `public` | — | YES |
| 8 | `2026-08-26-000008_CreatePersonnelAccomplishmentDomain.php` | `CreatePersonnelAccomplishmentDomain` | `public` | — | YES |
| 9 | `2026-08-26-000009_CreateQualificationGateDomain.php` | `CreateQualificationGateDomain` | `public` | — | YES |
| 10 | `2026-08-26-000010_CreateDeficiencyAndReportDomain.php` | `CreateDeficiencyAndReportDomain` | `public` | — | YES |
| 11 | `2026-08-26-000011_EnableRLSOnSensitiveHRTables.php` | `EnableRLSOnSensitiveHRTables` | — | `public` | YES |
| 12 | `2026-08-26-000012_AddHRPerformanceIndexes.php` | `AddHRPerformanceIndexes` | — | — | YES |
| 13 | `2026-08-26-000013_ReconcileHRFinalizationSchema.php` | `ReconcileHRFinalizationSchema` | — | `public` | YES |
| 14 | `2026-08-27-000014_CreateTargetInstitutionalStructure.php` | `CreateTargetInstitutionalStructure` | `public` | — | YES |
| 15 | `2026-08-27-000015_CreateIdentityAffiliationGovernance.php` | `CreateIdentityAffiliationGovernance` | `public` | — | YES |
| 16 | `2026-08-27-000016_CreateStudentPortfolioDomain.php` | `CreateStudentPortfolioDomain` | `public` | — | YES |
| 17 | `2026-08-27-000017_CreateAwardScoringDomain.php` | `CreateAwardScoringDomain` | `public` | — | YES |
| 18 | `2026-08-27-000018_CreateNotificationsCertificatesAudit.php` | `CreateNotificationsCertificatesAudit` | `public` | — | YES |
| 19 | `2026-08-27-000019_HardenAdminAndHrConstraints.php` | `HardenAdminAndHrConstraints` | — | `public` | YES |
| 20 | `2026-08-27-000020_CreateAuthorizationAndIntegrityGuards.php` | `CreateAuthorizationAndIntegrityGuards` | — | — | YES |
| 21 | `2026-08-27-000021_CreateCompatibilityViewsAndValidation.php` | `CreateCompatibilityViewsAndValidation` | — | — | YES |
| 22 | `2026-08-27-000022_EnableTargetRlsAndGrants.php` | `EnableTargetRlsAndGrants` | — | `public` | YES |
| 23 | `2026-08-27-000023_CreateStorageBucketsAndPolicies.php` | `CreateStorageBucketsAndPolicies` | — | — | YES |
| 24 | `2026-08-27-000024_SeedPermanentReferenceData.php` | `SeedPermanentReferenceData` | — | — | YES |
| 25 | `2026-08-27-000025_AutomateAwardInterviewEligibility.php` | `AutomateAwardInterviewEligibility` | — | — | YES |
| 26 | `2026-08-27-000026_HardenEvidenceUploadSecurity.php` | `HardenEvidenceUploadSecurity` | `public` | — | YES |
| 27 | `2026-08-30-000028_AddOrganizationLogoMetadata.php` | `AddOrganizationLogoMetadata` | — | `organizations` | YES |
| 28 | `2026-08-30-000029_AddCollegeBrandingMetadata.php` | `AddCollegeBrandingMetadata` | — | `colleges` | YES |
| 29 | `2026-08-30-000030_AddAwardConfigurationAndAuthorityMetadata.php` | `AddAwardConfigurationAndAuthorityMetadata` | `award_scoring_model_versions`, `award_criterion_components` | `award_definitions`, `award_criteria` | YES |
| 30 | `2026-08-30-000031_AddAwardEvidenceMappingRules.php` | `AddAwardEvidenceMappingRules` | `award_evidence_mapping_rules`, `award_evidence_mapping_conditions` | — | YES |
| 31 | `2026-08-30-000032_AddAwardScoringEngineRules.php` | `AddAwardScoringEngineRules` | — | `award_scoring_rules` | YES |
| 32 | `2026-08-30-000033_AddAwardStudentEvaluationSummaries.php` | `AddAwardStudentEvaluationSummaries` | `award_student_evaluation_summaries` | — | YES |
| 33 | `2026-08-30-000034_AddAwardCandidateManualDecisions.php` | `AddAwardCandidateManualDecisions` | `award_candidate_manual_decisions` | — | YES |
| 34 | `2026-08-30-000035_RemediateNotreDameAward.php` | `RemediateNotreDameAward` | — | — | NO / Forward-only |
| 35 | `2026-08-30-000036_AwardCatalogRuntimeCleanupAndQuarantine.php` | `AwardCatalogRuntimeCleanupAndQuarantine` | — | `award_definitions` | NO / Forward-only |
| 36 | `2026-08-30-000037_RemediateSMCAward.php` | `RemediateSMCAward` | — | — | NO / Forward-only |
| 37 | `2026-08-30-000038_RemediateLeadershipAward.php` | `RemediateLeadershipAward` | — | — | NO / Forward-only |
| 38 | `2026-08-30-000039_RemediateCampusJournalismAward.php` | `RemediateCampusJournalismAward` | — | — | NO / Forward-only |
| 39 | `2026-08-30-000041_RemediateSportsFemaleAward.php` | `RemediateSportsFemaleAward` | — | — | NO / Forward-only |
| 40 | `2026-08-30-000043_RemediateSportsMaleAward.php` | `RemediateSportsMaleAward` | — | — | NO / Forward-only |
| 41 | `2026-08-30-000044_RemediateSocioCulturalFemaleAward.php` | `RemediateSocioCulturalFemaleAward` | — | — | NO / Forward-only |
| 42 | `2026-08-30-000045_RemediateSocioCulturalMaleAward.php` | `RemediateSocioCulturalMaleAward` | — | — | NO / Forward-only |
| 43 | `2026-08-30-000046_RemediateStudentLeaderAward.php` | `RemediateStudentLeaderAward` | — | — | NO / Forward-only |
| 44 | `2026-08-30-000047_RemediateMemberOfTheYearAward.php` | `RemediateMemberOfTheYearAward` | — | — | NO / Forward-only |
| 45 | `2026-08-30-000048_RemediateVolunteerOfTheYearAward.php` | `RemediateVolunteerOfTheYearAward` | — | — | NO / Forward-only |
| 46 | `2026-08-30-000049_RemediateAthleteOfTheYearFemaleAward.php` | `RemediateAthleteOfTheYearFemaleAward` | — | — | NO / Forward-only |
| 47 | `2026-08-30-000050_RemediateAthleteOfTheYearMaleAward.php` | `RemediateAthleteOfTheYearMaleAward` | — | — | NO / Forward-only |
| 48 | `2026-08-30-000051_RemediatePerformerOfTheYearFemaleAward.php` | `RemediatePerformerOfTheYearFemaleAward` | — | — | NO / Forward-only |
| 49 | `2026-08-30-000052_RemediatePerformerOfTheYearMaleAward.php` | `RemediatePerformerOfTheYearMaleAward` | — | — | NO / Forward-only |
| 50 | `2026-09-01-000053_AddSexToProfiles.php` | `AddSexToProfiles` | — | `profiles` | YES |
| 51 | `2026-09-02-000054_AddMustChangePasswordToLocalAuthCredentials.php` | `AddMustChangePasswordToLocalAuthCredentials` | — | `local_auth_credentials` | YES |
| 52 | `2026-09-02-000055_RemoveMustChangePasswordFromProfiles.php` | `RemoveMustChangePasswordFromProfiles` | — | `profiles` | YES |
| 53 | `2026-09-02-000056_AddPlan08CanonicalCheckConstraints.php` | `AddPlan08CanonicalCheckConstraints` | — | `student_profiles`, `student_program_enrollments`, `profiles` | YES |
| 54 | `2026-09-08-000057_AddPersonnelPortfolioMultiVersionSupport.php` | `AddPersonnelPortfolioMultiVersionSupport` | — | — | YES |
| 55 | `2026-09-08-000058_AddPersonnelEvaluationOnePerCycleConstraints.php` | `AddPersonnelEvaluationOnePerCycleConstraints` | — | — | YES |
| 56 | `2026-09-08-000059_CreatePersonnelEvaluationRootsAndLineage.php` | `CreatePersonnelEvaluationRootsAndLineage` | — | — | YES |
| 57 | `2026-09-08-000060_AddPersonnelGroupAndOrganizationalSide.php` | `AddPersonnelGroupAndOrganizationalSide` | — | — | YES |
| 58 | `2026-09-08-000061_AddFacultyStatusAndMasterDataFields.php` | `AddFacultyStatusAndMasterDataFields` | — | — | YES |
| 59 | `2026-09-08-000062_CreatePersonnelAnnualReviews.php` | `CreatePersonnelAnnualReviews` | — | `personnel_annual_reviews` | YES |
| 60 | `2026-09-08-000063_CreateEvaluationScaleCatalogue.php` | `CreateEvaluationScaleCatalogue` | `evaluation_scales`, `evaluation_scale_versions`, `evaluation_scale_areas`, `evaluation_scale_categories`, `evaluation_scale_subcategories`, `evaluation_scale_criteria`, `evaluation_scale_change_events` | — | YES |
| 61 | `2026-09-08-000064_CreateFacultyRankCatalog.php` | `CreateFacultyRankCatalog` | `faculty_rank_catalog` | — | YES |
| 62 | `2026-09-08-000065_CreateFacultyRankTransitions.php` | `CreateFacultyRankTransitions` | `faculty_rank_transitions` | — | YES |
| 63 | `2026-09-08-000066_SeedPartTimeFacultyTitles.php` | `SeedPartTimeFacultyTitles` | — | — | YES |
| 64 | `2026-09-09-000067_AddEvidenceIdToPersonnelEvaluationItems.php` | `AddEvidenceIdToPersonnelEvaluationItems` | — | — | YES |
