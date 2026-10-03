# Phase 17M Migration Dialect Classification Matrix

## Decision record

- Execution authority: local repository at `ea987bf32c208cc99ebe1a60b989c0c09ca83e98` plus uncommitted Phase 1–17 work.
- Canonical runtime: MySQL 8.4.7 on WAMP, selected from the active `.env`, startup runbook, local-defense test suite, zero-Supabase tests, and backend authorization/authentication services.
- Historical policy: **Strategy 2 — new canonical MySQL baseline namespace**. The protected MySQL `migrations` table contains zero rows, so the PostgreSQL/transition history was never the mechanism that built WAMP. Existing mixed files remain immutable audit history.
- Authentication: local credentials, sessions, JWTs, and backend authorization own the WAMP path. Hosted Supabase remains an optional separate mode; its `auth`, Storage, grants, and RLS are not falsely represented as MySQL features.
- Target UUID: `CHAR(36)` with application/database UUID strings, preserving all fixed Award IDs and FK compatibility.
- Target time: UTC `DATETIME(6)`; application serialization owns timezone conversion.

## Complete inventory

| Order | Filename / class suffix | Dialect | Portability | Domain | Up/down style | Action / notes |
|---:|---|---|---|---|---|---|
| 1 | `000001_CreateIdentityAndAcademicFoundation` | POSTGRESQL | ENGINE-SPECIFIC | Legacy identity/foundation | Raw PostgreSQL | LEGACY_ONLY; Supabase auth FK, RLS, UUID, PL/pgSQL; do not resurrect departments |
| 2 | `000002_AddStructuredNameToProfiles` | POSTGRESQL | ENGINE-SPECIFIC | Identity | Raw PostgreSQL | LEGACY_ONLY; baseline preserves final structured names |
| 3 | `000003_ExpandAdminAccountTypesAndAddRoleAssignmentEvents` | POSTGRESQL | ENGINE-SPECIFIC | Identity/audit | Raw PostgreSQL | LEGACY_ONLY; `NULLS NOT DISTINCT`; final MySQL guard retained |
| 4 | `000004_EnforceAdminProfileIntegrity` | POSTGRESQL | ENGINE-SPECIFIC | Identity constraints | Raw PostgreSQL | LEGACY_ONLY; final equivalent constraints represented |
| 5 | `000005_CreatePersonnelEvaluationDomain` | POSTGRESQL | ENGINE-SPECIFIC | HR evaluation | Raw PostgreSQL | LEGACY_ONLY; final tables represented |
| 6 | `000006_ReplaceDepartmentSecretaryWithDean` | POSTGRESQL | ENGINE-SPECIFIC | Governance | Raw PostgreSQL | SUPERSEDED; final model contains Dean, no Department Secretary |
| 7 | `000007_CreatePasswordResetRequestsDomain` | POSTGRESQL | ENGINE-SPECIFIC | Authentication | Raw PostgreSQL | LEGACY_ONLY; local reset domain represented |
| 8 | `000008_CreatePersonnelAccomplishmentDomain` | POSTGRESQL | ENGINE-SPECIFIC | HR portfolio | Raw PostgreSQL/RLS | LEGACY_ONLY; backend policy replaces RLS |
| 9 | `000009_CreateQualificationGateDomain` | POSTGRESQL | ENGINE-SPECIFIC | HR qualification | Raw PostgreSQL/RLS | LEGACY_ONLY |
| 10 | `000010_CreateDeficiencyAndReportDomain` | MIXED_WITHIN_FILE | ENGINE-SPECIFIC | HR workflow | PostgreSQL plus MySQL-token false/real mix | LEGACY_ONLY; final schema baseline |
| 11 | `000011_EnableRLSOnSensitiveHRTables` | POSTGRESQL | ENGINE-SPECIFIC | Security | Raw RLS/policies | SUPERSEDED in WAMP by backend authorization |
| 12 | `000012_AddHRPerformanceIndexes` | POSTGRESQL | ENGINE-SPECIFIC | Performance | Raw PostgreSQL indexes | LEGACY_ONLY; final indexes represented |
| 13 | `000013_ReconcileHRFinalizationSchema` | POSTGRESQL | ENGINE-SPECIFIC | HR reconciliation | Raw PostgreSQL | LEGACY_ONLY |
| 14 | `000014_CreateTargetInstitutionalStructure` | POSTGRESQL | ENGINE-SPECIFIC | Academic structure | Raw PostgreSQL/upserts/RLS | SUPERSEDED foundation; final College → Academic Program model retained |
| 15 | `000015_CreateIdentityAffiliationGovernance` | POSTGRESQL | ENGINE-SPECIFIC | Identity/governance | Raw PostgreSQL | LEGACY_ONLY |
| 16 | `000016_CreateStudentPortfolioDomain` | POSTGRESQL | ENGINE-SPECIFIC | Student portfolio | Raw PostgreSQL | LEGACY_ONLY |
| 17 | `000017_CreateAwardScoringDomain` | POSTGRESQL | ENGINE-SPECIFIC | Awards | Raw PostgreSQL | LEGACY_ONLY; final frozen Award schema/data retained by baseline |
| 18 | `000018_CreateNotificationsCertificatesAudit` | POSTGRESQL | ENGINE-SPECIFIC | Notifications/certificates/audit | Raw PostgreSQL | LEGACY_ONLY |
| 19 | `000019_HardenAdminAndHrConstraints` | POSTGRESQL | ENGINE-SPECIFIC | Integrity | Raw PostgreSQL | LEGACY_ONLY; final guards retained |
| 20 | `000020_CreateAuthorizationAndIntegrityGuards` | POSTGRESQL | ENGINE-SPECIFIC | Authorization | PL/pgSQL/private functions | SUPERSEDED in WAMP by service/policy authorization |
| 21 | `000021_CreateCompatibilityViewsAndValidation` | POSTGRESQL | ENGINE-SPECIFIC | Compatibility | Raw PostgreSQL views/checks | LEGACY_ONLY; only final approved MySQL objects retained |
| 22 | `000022_EnableTargetRlsAndGrants` | POSTGRESQL | ENGINE-SPECIFIC | Security | RLS/policies/grants | SUPERSEDED for WAMP; not falsely ported |
| 23 | `000023_CreateStorageBucketsAndPolicies` | POSTGRESQL | ENGINE-SPECIFIC | Supabase Storage | storage schema/RLS | SUPERSEDED for WAMP by protected local evidence routes/filesystem |
| 24 | `000024_SeedPermanentReferenceData` | POSTGRESQL | ENGINE-SPECIFIC | Reference data | `ON CONFLICT`, arrays/JSON | BASELINE_ONLY final deterministic values |
| 25 | `000025_AutomateAwardInterviewEligibility` | MIXED_WITHIN_FILE | ENGINE-SPECIFIC | Awards automation | PostgreSQL functions/triggers | LEGACY_ONLY; application service owns current behavior |
| 26 | `000026_HardenEvidenceUploadSecurity` | POSTGRESQL | ENGINE-SPECIFIC | Storage security | RLS/storage policy | SUPERSEDED by backend/file-security controls |
| 27 | `000028_AddOrganizationLogoMetadata` | MYSQL | ENGINE-SPECIFIC | Organization branding | Raw MySQL DDL | BASELINE_ONLY final columns |
| 28 | `000029_AddCollegeBrandingMetadata` | MYSQL | ENGINE-SPECIFIC | College branding | Raw MySQL DDL | BASELINE_ONLY final columns |
| 29 | `000030_AddAwardConfigurationAndAuthorityMetadata` | MIXED_WITHIN_FILE | ENGINE-SPECIFIC | Awards configuration | MySQL DDL + generic builder | BASELINE_ONLY final schema/data |
| 30 | `000031_AddAwardEvidenceMappingRules` | MIXED_WITHIN_FILE | ENGINE-SPECIFIC | Award mapping | MySQL DDL/backfill | BASELINE_ONLY final schema/data |
| 31 | `000032_AddAwardScoringEngineRules` | MIXED_WITHIN_FILE | ENGINE-SPECIFIC | Award scoring | MySQL DDL/backfill | BASELINE_ONLY final schema/data |
| 32 | `000033_AddAwardStudentEvaluationSummaries` | MYSQL | ENGINE-SPECIFIC | Evaluation snapshots | Raw MySQL DDL | BASELINE_ONLY final schema |
| 33 | `000034_AddAwardCandidateManualDecisions` | MYSQL | ENGINE-SPECIFIC | Manual decisions | Raw MySQL DDL | BASELINE_ONLY final schema |
| 34 | `000035_RemediateNotreDameAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 01 | Query Builder | KEEP semantics in baseline |
| 35 | `000036_AwardCatalogRuntimeCleanupAndQuarantine` | MYSQL | ENGINE-SPECIFIC | Catalog cleanup | MySQL DDL/updates | BASELINE_ONLY final active/quarantine state |
| 36 | `000037_RemediateSMCAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 02 | Query Builder | KEEP semantics in baseline |
| 37 | `000038_RemediateLeadershipAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 03 | Query Builder | KEEP semantics in baseline |
| 38 | `000039_RemediateCampusJournalismAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 04 | Query Builder | KEEP semantics in baseline |
| 39 | `000041_RemediateSportsFemaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 05 | Query Builder | KEEP semantics in baseline |
| 40 | `000043_RemediateSportsMaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 06 | Query Builder | KEEP semantics in baseline |
| 41 | `000044_RemediateSocioCulturalFemaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 07 | Query Builder | KEEP semantics in baseline |
| 42 | `000045_RemediateSocioCulturalMaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 08 | Query Builder | KEEP semantics in baseline |
| 43 | `000046_RemediateStudentLeaderAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 09 | Query Builder | KEEP semantics in baseline |
| 44 | `000047_RemediateMemberOfTheYearAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 10 | Query Builder | KEEP semantics in baseline |
| 45 | `000048_RemediateVolunteerOfTheYearAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 11 | Query Builder | KEEP semantics in baseline |
| 46 | `000049_RemediateAthleteOfTheYearFemaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 12 | Query Builder | KEEP semantics in baseline |
| 47 | `000050_RemediateAthleteOfTheYearMaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 13 | Query Builder | KEEP semantics in baseline |
| 48 | `000051_RemediatePerformerOfTheYearFemaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 14 | Query Builder | KEEP semantics in baseline |
| 49 | `000052_RemediatePerformerOfTheYearMaleAward` | PORTABLE_CODEIGNITER | PORTABLE_WITH_DRIVER_BRANCH | Award 15 | Query Builder | KEEP semantics in baseline |

## Transition timeline

```text
000001–000009  PostgreSQL
000010         mixed/transitional
000011–000024  PostgreSQL
000025         mixed/transitional
000026         PostgreSQL
000028–000034  MySQL or mixed MySQL-oriented
000035–000052  Query Builder remediation with one MySQL catalog migration
```

There is no local migration 000027, 000040, or 000042. The first operational MySQL transition is 000028, but mixed-token files occur earlier; the complete chain is not valid on one driver.

## Constraint/security equivalence

- PostgreSQL RLS is not claimed on MySQL. `AuthorizationService`, policy services, authenticated-actor resolution, server-side sessions, scoped queries, and protected evidence routes provide the WAMP enforcement boundary and are regression-tested.
- Supabase `auth.users` is not copied into MySQL. Local identity uses profiles plus local credentials/session registries.
- Generated-column uniqueness guards in the final MySQL schema preserve active-history uniqueness where ordinary MySQL unique indexes treat `NULL` differently.
- The baseline must reproduce final business constraints, FKs, indexes, checks, and fixed reference IDs exactly; runtime/demo rows are excluded.
