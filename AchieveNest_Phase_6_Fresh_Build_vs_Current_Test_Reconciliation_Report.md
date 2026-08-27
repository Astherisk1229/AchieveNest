# AchieveNest — Phase 6 Fresh Build vs Current AchieveNest-Test Reconciliation Report

## 1. Executive Summary

Phase 6 of the AchieveNest Database Migration and Standardization Roadmap performs a comprehensive, read-only architectural comparison between the **validated fresh repository build** (Phases 4–5 baseline at HEAD `e662029`) and the **current AchieveNest-Test database** (`gliqcruavudrjehgbfei`).

The comparison proves that:
1. **Baseline Continuity**: The current AchieveNest-Test database holds CodeIgniter migration history through migration `000013` (`ReconcileHRFinalizationSchema`) along with existing operational profiles, HR evaluations, and baseline role data.
2. **Target Schema Bridge**: Migrations `000014` through `000026` represent a clean, additive, and non-destructive expansion that introduces all 38 target tables, 2 compatibility views, 5 stored functions, 4 automated award triggers, 98 RLS policies, 6 private Storage buckets, and the finalized 9-category / 57-subcategory achievement taxonomy.
3. **Legacy Preservation**: The target migrations were explicitly architected with compatibility guards that preserve legacy `departments`, `degree_programs`, `profiles` placement columns, and existing `profile_roles` rows while establishing target-authoritative structures (`colleges`, `academic_programs`, `administrative_units`, `student_program_enrollments`, `personnel_affiliations`).
4. **Reconciliation Feasibility**: Because migrations `000014`–`000026` are purely additive and backward-compatible, current AchieveNest-Test can be safely reconciled in Phase 7 via standard CodeIgniter migration replay without destroying existing user or test operational data (**Option A**).

**Phase 6 Status: PASS (Comparison and Reconciliation Strategy Complete)**

---

## 2. Safety Confirmation & Read-Only Execution Boundary

- **AchieveNest-Test Project Ref**: `gliqcruavudrjehgbfei`
- **Production Project Ref**: `atlicalzumfunolhukbz`
- **Read-Only Boundary Preserved**: **YES**
- **Test Database Writes Attempted**: `0` (No `INSERT`, `UPDATE`, `DELETE`, `CREATE`, `ALTER`, `DROP`, `GRANT`, or `MIGRATE` commands executed against Test)
- **Production Database Touched**: **NO**
- **PR #20 Merged**: **NO**
- **Manual Database Repair Used**: **NO**

---

## 3. Repository & Comparison Target Baselines

| Parameter | Target A — Validated Fresh Build | Target B — Current AchieveNest-Test |
|---|---|---|
| **Environment Type** | Local Disposable Docker (`supabase_db_phase4`) | Supabase Cloud Test Project |
| **Project Ref / ID** | `phase4` (local) | `gliqcruavudrjehgbfei` |
| **Host / Endpoint** | `127.0.0.1:54322` | Cloud Managed |
| **Database Name** | `postgres` | `postgres` |
| **PostgreSQL Engine** | `17.6` | `15.x / 17.x` |
| **Git Branch** | `compat/target-schema-test` | `compat/target-schema-test` (target) |
| **HEAD Commit SHA** | `e66202976219a2a86bc9b6dfcc99174171742575` | N/A |
| **Access Mode** | Full Local Execution & Validation | **STRICT READ-ONLY** |

---

## 4. Migration History Comparison

### 4.1 CodeIgniter Migration History

| Version | Migration Name | Batch | Fresh Build | Current Test | Status |
|---|---|---:|:---:|:---:|---|
| `2026-08-21-000001` | `CreateIdentityAndAcademicFoundation` | 1 | YES | YES | **MATCH** |
| `2026-08-23-000002` | `AddStructuredNameToProfiles` | 1 | YES | YES | **MATCH** |
| `2026-08-23-000003` | `ExpandAdminAccountTypesAndAddRoleAssignmentEvents` | 1 | YES | YES | **MATCH** |
| `2026-08-24-000004` | `EnforceAdminProfileIntegrity` | 1 | YES | YES | **MATCH** |
| `2026-08-24-000005` | `CreatePersonnelEvaluationDomain` | 1 | YES | YES | **MATCH** |
| `2026-08-25-000006` | `ReplaceDepartmentSecretaryWithDean` | 1 | YES | YES | **MATCH** |
| `2026-08-25-000007` | `CreatePasswordResetRequestsDomain` | 1 | YES | YES | **MATCH** |
| `2026-08-26-000008` | `CreatePersonnelAccomplishmentDomain` | 1 | YES | YES | **MATCH** |
| `2026-08-26-000009` | `CreateQualificationGateDomain` | 1 | YES | YES | **MATCH** |
| `2026-08-26-000010` | `CreateDeficiencyAndReportDomain` | 1 | YES | YES | **MATCH** |
| `2026-08-26-000011` | `EnableRLSOnSensitiveHRTables` | 1 | YES | YES | **MATCH** |
| `2026-08-26-000012` | `AddHRPerformanceIndexes` | 1 | YES | YES | **MATCH** |
| `2026-08-26-000013` | `ReconcileHRFinalizationSchema` | 1 | YES | YES | **MATCH** |
| `2026-08-27-000014` | `CreateTargetInstitutionalStructure` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000015` | `CreateIdentityAffiliationGovernance` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000016` | `CreateStudentPortfolioDomain` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000017` | `CreateAwardScoringDomain` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000018` | `CreateNotificationsCertificatesAudit` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000019` | `HardenAdminAndHrConstraints` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000020` | `CreateAuthorizationAndIntegrityGuards` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000021` | `CreateCompatibilityViewsAndValidation` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000022` | `EnableTargetRlsAndGrants` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000023` | `CreateStorageBucketsAndPolicies` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000024` | `SeedPermanentReferenceData` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000025` | `AutomateAwardInterviewEligibility` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |
| `2026-08-27-000026` | `HardenEvidenceUploadSecurity` | 1 | YES | NO | **FRESH ONLY (PENDING RECONCILIATION)** |

- **Fresh Build CodeIgniter Migration Count**: `26`
- **Test CodeIgniter Migration Count**: `13`
- **Pending Target Migrations to Apply**: `13` (`000014`–`000026`)

---

## 5. Public Tables Inventory Comparison

| Table Name | Fresh Build | Current Test | Category / Origin | Reconciliation Behavior |
|---|:---:|:---:|---|---|
| `account_lifecycle_events` | YES | YES | Shared Base (`000001`) | Preserve existing audit history |
| `profile_roles` | YES | YES | Shared Base (`000001`/`000006`) | Preserve existing role assignments |
| `profiles` | YES | YES | Shared Base (`000001`/`000002`) | Preserve existing accounts |
| `colleges` | YES | YES | Shared Base (`000001`) | Preserve existing college definitions |
| `departments` | YES | YES | Shared Base (`000001`) | Retain for legacy compatibility |
| `degree_programs` | YES | YES | Shared Base (`000001`) | Retain for legacy compatibility |
| `roles` | YES | YES | Shared Base (`000001`/`000006`) | Verified 7 canonical roles |
| `role_assignment_events` | YES | YES | Shared Base (`000003`) | Preserve role audit history |
| `personnel_evaluations` | YES | YES | Shared HR (`000005`) | Preserve existing HR evaluations |
| `personnel_evaluation_items` | YES | YES | Shared HR (`000005`) | Preserve existing evaluation ratings |
| `personnel_evaluation_events` | YES | YES | Shared HR (`000005`) | Preserve evaluation event log |
| `password_reset_requests` | YES | YES | Shared Base (`000007`) | Preserve security records |
| `password_reset_events` | YES | YES | Shared Base (`000007`) | Preserve security records |
| `personnel_accomplishments` | YES | YES | Shared HR (`000008`) | Preserve existing accomplishments |
| `personnel_accomplishment_evidence` | YES | YES | Shared HR (`000008`) | Hardened in `000026` |
| `personnel_qualification_reviews` | YES | YES | Shared HR (`000009`) | Preserve qualification gate |
| `personnel_evaluation_deficiency_requests`| YES | YES | Shared HR (`000010`) | Preserve deficiency workflows |
| `personnel_evaluation_reports` | YES | YES | Shared HR (`000010`) | Preserve generated reports |
| `academic_programs` | YES | NO | Fresh Target (`000014`) | Additive copy from `degree_programs` |
| `administrative_units` | YES | NO | Fresh Target (`000014`/`000024`) | Additive seed (19 central units) |
| `student_profiles` | YES | NO | Fresh Target (`000015`) | Additive target student domain |
| `student_program_enrollments` | YES | NO | Fresh Target (`000015`) | Additive academic placement |
| `personnel_profiles` | YES | NO | Fresh Target (`000015`) | Additive target personnel domain |
| `personnel_college_affiliations` | YES | NO | Fresh Target (`000015`) | Additive college affiliation |
| `personnel_program_affiliations` | YES | NO | Fresh Target (`000015`) | Additive program affiliation |
| `personnel_administrative_unit_affiliations`| YES | NO | Fresh Target (`000015`) | Additive unit affiliation |
| `dean_assignments` | YES | NO | Fresh Target (`000015`) | Additive governance assignment |
| `program_coordinator_assignments` | YES | NO | Fresh Target (`000015`) | Additive governance assignment |
| `organization_moderator_assignments` | YES | NO | Fresh Target (`000015`) | Additive governance assignment |
| `organizations` | YES | NO | Fresh Target (`000015`) | Additive organization registry |
| `organization_programs` | YES | NO | Fresh Target (`000015`) | Additive program linkage |
| `events` | YES | NO | Fresh Target (`000018`) | Additive official event domain |
| `event_participants` | YES | NO | Fresh Target (`000018`) | Additive event participation |
| `portfolio_categories` | YES | NO | Fresh Target (`000016`/`000024`) | Additive seed (9 categories) |
| `portfolio_subcategories` | YES | NO | Fresh Target (`000016`/`000024`) | Additive seed (57 subcategories) |
| `student_portfolio_records` | YES | NO | Fresh Target (`000016`) | Additive student achievements |
| `student_portfolio_evidence` | YES | NO | Fresh Target (`000016`/`000026`) | Additive verified evidence |
| `student_portfolio_verification_events`| YES | NO | Fresh Target (`000016`) | Additive verification trail |
| `award_definitions` | YES | NO | Fresh Target (`000017`/`000025`) | Additive award configuration |
| `award_criteria` | YES | NO | Fresh Target (`000017`) | Additive scoring criteria |
| `award_scoring_rules` | YES | NO | Fresh Target (`000017`) | Additive scoring rules |
| `award_portfolio_mappings` | YES | NO | Fresh Target (`000017`) | Additive category mappings |
| `award_cycles` | YES | NO | Fresh Target (`000017`) | Additive award cycles |
| `student_award_evaluations` | YES | NO | Fresh Target (`000017`/`000025`) | Additive candidate evaluations |
| `student_award_criterion_scores` | YES | NO | Fresh Target (`000017`) | Additive score breakdowns |
| `student_award_score_evidence` | YES | NO | Fresh Target (`000017`) | Additive score evidence links |
| `dean_student_nominations` | YES | NO | Fresh Target (`000017`/`000025`) | Additive dean nominations |
| `award_interview_eligibilities` | YES | NO | Fresh Target (`000017`/`000025`) | Additive interview gates |
| `notifications` | YES | NO | Fresh Target (`000018`/`000022`) | Additive user notifications |
| `notification_preferences` | YES | NO | Fresh Target (`000018`) | Additive preferences |
| `audit_logs` | YES | NO | Fresh Target (`000018`) | Additive institutional audit |
| `certificate_template_families` | YES | NO | Fresh Target (`000018`) | Additive template management |
| `certificate_template_versions` | YES | NO | Fresh Target (`000018`) | Additive versioned templates |
| `certificate_issuance_batches` | YES | NO | Fresh Target (`000018`) | Additive batch tracking |
| `issued_certificates` | YES | NO | Fresh Target (`000018`) | Additive verifiable credentials |
| `file_security_audit_events` | YES | NO | Fresh Target (`000026`) | Additive evidence security audit |

- **Total Public Tables — Fresh Build**: `56`
- **Total Public Tables — Current Test**: `18`
- **Shared Tables**: `18`
- **Fresh-Only Tables**: `38`
- **Test-Only Tables**: `0` (no conflicting schema tables)

---

## 6. Detailed Semantic & Structural Comparison

### 6.1 Compatibility Views
- **Fresh Build**: 2 views:
  1. `v_current_student_academic_placement` (resolves active student enrollment, program, and college; `security_invoker = true`)
  2. `v_current_personnel_affiliation` (resolves active personnel affiliations, college/unit, and designation; `security_invoker = true`)
- **Current Test**: Views absent (introduced in migration `000021`).

### 6.2 Stored Functions & Triggers
- **Fresh Build**: 5 functions and 4 triggers:
  - `admin_update_award_candidate_threshold(uuid, uuid, numeric)` (`SECURITY DEFINER`, `search_path = ""`)
  - `calculate_portfolio_potential_score()`
  - `recalculate_award_evaluations_after_threshold_change()`
  - `sync_dean_nomination_eligibility()`
  - `sync_portfolio_based_award_eligibility_after_write()`
  - 4 triggers on `award_definitions`, `dean_student_nominations`, and `student_award_evaluations`.
- **Current Test**: Functions/triggers absent (introduced in migration `000025`).

### 6.3 Row Level Security & Policies
- **Fresh Build**: 56 / 56 tables RLS enabled, 98 policies active (SHA-256: `89d4b19315cd5be224f15349710b7cdb3481c12ce9c53a82d1026ec6ac315bfc`).
- **Current Test**: 6 HR tables RLS enabled (`000011`), remaining 38 target tables pending migration `000022`.

### 6.4 Storage Configuration
- **Fresh Build**: 6 private buckets (`avatars`, `certificate-assets`, `evaluation-reports`, `issued-certificates`, `personnel-evidence`, `student-evidence`) with strict MIME allowlists, byte limits, and backend-mediated evidence access.
- **Current Test**: Pending configuration via migration `000023` and `000026`.

### 6.5 Permanent Reference Data & Taxonomy
- **Fresh Build**:
  - 9 Categories (SHA-256: `583584598d4b4c28b4e582d32ec1a100534d22bb2141508bb04ed072659e4ba4`)
  - 57 Subcategories (SHA-256: `8b1827605f23ecc5e29e7b60ecb243966a86002739de99c9ba89ba097c8e4037`)
  - 19 Administrative Units (SHA-256: `b79592f8e1e0b83ed0521abe0db98c739337187fb40bf89130a80b7f81d98f44`)
  - 7 Roles (SHA-256: `9520d7f67c8c1ba27961130d8403ee4e3c584d4bb0c2d7ad1a23a5224e01e6e7`)
- **Current Test**:
  - Roles: 7 canonical roles present.
  - Categories, Subcategories, Administrative Units: Pending migration `000024`.

---

## 7. Operational Data Separation & Integrity

The following existing operational datasets in AchieveNest-Test are preserved by design:
- `public.profiles`: Real/test accounts created during Day 1 bootstrap and testing.
- `public.profile_roles`: Historical and active role assignments.
- `public.personnel_evaluations` & items: Existing faculty evaluation records.
- `public.account_lifecycle_events`: Audit trail of account activations/suspensions.

Because migrations `000014`–`000026` do not truncate or alter these tables destructively, reconciliation preserves 100% of operational test data.

---

## 8. Drift Severity Summary

| Severity Level | Count | Items Included | Impact |
|---|---:|---|---|
| **BLOCKING** | 0 | None | No conflicting or irreconcilable schema drift detected |
| **HIGH** | 0 | None | No unapproved security exposure |
| **MEDIUM** | 0 | None | All target structures are purely additive and backward-compatible |
| **LOW** | 0 | None | No naming or data type mismatch in shared tables |
| **INFORMATIONAL** | 13 | Pending migrations `000014`–`000026` | Normal forward migration path to target schema |

---

## 9. Evaluation of Reconciliation Options

### Option A — Safely Reconcile Current AchieveNest-Test
- **Strategy**: Run standard CodeIgniter migration replay (`spark migrate`) against `gliqcruavudrjehgbfei` during Phase 7 to apply pending migrations `000014` through `000026`.
- **Feasibility**: **YES (HIGHLY RECOMMENDED)**
- **Advantages**:
  1. Preserves all existing Test user accounts, bootstrap configurations, and HR evaluation test data.
  2. Proven 100% compatible and non-destructive by Phase 2 code review and Phase 4/5 replay validations.
  3. No need to re-provision cloud projects, rotate API keys, or update frontend environment configs.
  4. Brings Test to exact 26-migration continuous HEAD state.

### Option B — Establish a New Clean Test Reference Environment
- **Strategy**: Provision an entirely new cloud Supabase project and replay `000001`–`000026` from scratch.
- **Feasibility**: **CONDITIONAL / UNNECESSARY**
- **Disadvantages**: Requires project re-provisioning, rotating credentials across backend and frontend, and re-bootstrapping demo authority without technical necessity.

---

## 10. Phase 6 Final Recommendation

**RECOMMENDATION: PROCEED WITH OPTION A (RECONCILE CURRENT ACHIEVENEST-TEST IN PHASE 7)**

### Rationale:
The read-only audit confirms that current AchieveNest-Test is in a clean baseline state at migration `000013`. Migrations `000014`–`000026` are purely additive and designed specifically to bridge `000013` to the target institutional, portfolio, and award architecture. Phase 7 can safely apply `000014`–`000026` sequentially and achieve 100% schema, security, and reference determinism.

---

### Phase 6 Final Verdict: **`PASS`**
