# AchieveNest — Phase B: Attribute Analysis & Normalization Findings

> **Database:** `achievenest_local`  
> **Phase:** Phase B — Table Attribute Inventory Analysis  
> **Authoritative Authority:** Master 3NF Plan & OSAD Award System  

---

## 1. Core Identity & Profile Attribute Ownership
### 1.1 `profiles` Table (Supertype)
- **Role**: Base identity for all accounts (students, personnel, administrators).
- **Attributes**:
  - `id`: Canonical UUID (Primary Key).
  - `institutional_id`: Unique institutional ID (e.g. `2022-0001`, `EMP-0101`). Authoritative candidate key.
  - `email`: Institutional email address (`@ndmu.edu.ph`). Authoritative candidate key.
  - `account_type`: Primary identity subtype discriminator (`student`, `faculty`, `staff`, `osad_admin`, `hr_admin`, `admin`). Authoritative.
  - `first_name`, `middle_name`, `last_name`: Atomic name components. Authoritative.
  - `full_name`: Formatted display name. **Classified as DERIVED/CACHED**. Kept for query performance and full-text search.
  - `sex`: Legal/institutional sex (`Male` / `Female`). **Single Authoritative Source** for all sex-gated award eligibility logic.
  - `designation_title`: Professional/administrative designation. Maintained in `profiles` for unified navbar/profile card rendering across both OSAD and HR domains.
  - `status`, `avatar_url`, `password_hash`, `must_change_password`, `created_at`, `updated_at`: Standard auth & profile lifecycle attributes.

## 2. Priority Normalization Analyses

### 2.1 `year_level`: Source of Truth Analysis
- **Observed in**: `student_profiles.year_level` and `student_program_enrollments.year_level`.
- **Detailed Evaluation**:
  1. `student_program_enrollments.year_level` records the year level (`1`, `2`, `3`, `4`) for a specific academic period (`academic_year`, `semester`) and program (`academic_program_id`). This is the **AUTHORITATIVE HISTORICAL SOURCE OF TRUTH**.
  2. `student_profiles.year_level` represents the current active year level of the student. In 3NF terms, it is a **CACHED DERIVED ATTRIBUTE** representing the year level of the active enrollment record.
- **Resolution**: `student_program_enrollments.year_level` is the authoritative source. `student_profiles.year_level` is retained as a justified, performance-optimized cache of the active enrollment to prevent expensive joins on high-frequency student portfolio pages.

### 2.2 `account_type` vs `profile_roles`
- **Observed in**: `profiles.account_type` vs `profile_roles` linking to `roles`.
- **Detailed Evaluation**:
  1. `profiles.account_type` is the immutable/primary base account class (e.g. `student`, `personnel`, `admin`) used for authentication routing and layout selection.
  2. `profile_roles` implements dynamic, grantable governance roles (e.g. `dean`, `program_coordinator`, `organization_moderator`, `osad_evaluator`, `evaluator`).
- **Resolution**: Non-redundant. `account_type` defines identity classification; `profile_roles` defines dynamic RBAC capabilities. Fully compliant with 3NF.

### 2.3 `profiles.sex` Authority
- **Detailed Evaluation**:
  - `profiles.sex` is confirmed as the **SOLE AUTHORITATIVE SOURCE** of student sex.
  - No duplicate `student_profiles.sex` or `personnel_profiles.sex` columns exist in the database.
  - All 8 sex-gated award eligibility rules (Male/Female variants) consume `profiles.sex` directly.

### 2.4 Portfolio Domain Attribute Ownership
- **Master Records**: `student_portfolio_records` stores core record attributes (`student_profile_id`, `category_id`, `subcategory_id`, `title`, `description`, `activity_date`, `academic_year`, `verification_status`).
- **Category Hierarchy**: Category codes and names reside exclusively in `portfolio_categories` and `portfolio_subcategories`. Zero free-text category strings in portfolio records.
- **Structured Metadata**: Domain parameters (e.g. `role`, `leadership_level`, `scope`, `event_level`, `placement_result`, `publication_type`) are stored in `metadata` (JSON), preventing sparse, multi-column tables.
- **Evidence Separation**: Evidence files reside in `student_portfolio_evidence` (1:N) with audit tracking (`uploaded_by`, `uploaded_at`).
- **Verification Audit**: Verification history resides in `student_portfolio_verification_events` (1:N).

## 3. Subsystem Attribute Ownership Summary

| Subsystem | Primary Entity | Subtypes / Extensions | Key Relationships | 3NF Status |
|---|---|---|---|:---:|
| **Identity** | `profiles` | `student_profiles`, `personnel_profiles` | 1:0..1 PK-to-PK extension | **PASS** |
| **Role Access** | `roles` | `profile_roles` | N:M mapping table with assignment audit | **PASS** |
| **Academic** | `colleges` $\rightarrow$ `academic_programs` | `student_program_enrollments` | 1:N hierarchy, enrollment history preserved | **PASS** |
| **Personnel** | `personnel_profiles` | Affiliation tables (Program, College, Unit) | Clean separation of employment vs placement | **PASS** |
| **Organization** | `organizations` | `organization_program_affiliations`, `organization_moderator_assignments` | Normalized M:N relationships | **PASS** |
| **Portfolio** | `portfolio_categories` $\rightarrow$ `portfolio_subcategories` | `student_portfolio_records` $\rightarrow$ `student_portfolio_evidence` | Structured 9-category taxonomy with 1:N evidence | **PASS** |
| **Award Evaluation** | `award_definitions` $\rightarrow$ `award_criteria` $\rightarrow$ `award_criterion_components` | `student_award_evaluations` $\rightarrow$ `student_award_criterion_scores` $\rightarrow$ `student_award_score_evidence` | 15 authoritative awards with complete scoring traceability | **PASS** |

## 4. Phase B Verification Conclusion
```text
PHASE B ATTRIBUTE INVENTORY & FINDINGS: PASS
All 64 tables and attributes semantically analyzed.
Zero unresolved source-of-truth conflicts.
Zero destructive changes executed.
Ready to proceed to Phase C — Key and Constraint Inventory.
```
