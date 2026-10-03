# AchieveNest — Phase F: 2NF Assessment Report (Reconciled)

> **Database:** `achievenest_local` (MySQL `8.4.7`)  
> **Git Revision:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
> **Evaluated Tables:** 64 (100% Single-Column Primary Keys: 61 `id` + 3 `profile_id`)  

---

## 1. 2NF Partial-Key Dependency Evaluation
In relational database theory (Codd 1971), a table violates Second Normal Form (2NF) if and only if it is in 1NF and contains a non-prime attribute that is functionally dependent on a *proper subset* of a candidate key (a partial dependency).

- Because all 64 tables in `achievenest_local` possess single-column primary keys (`id` or `profile_id`), no proper subset of the primary key exists.
- For all candidate composite keys enforced via `UNIQUE` constraints (e.g. `profile_roles(profile_id, role_id)`, `portfolio_subcategories(category_id, code)`), all non-key attributes describe the entire composite relation instance and are not determined by a partial key component.
- Therefore, partial key dependency is **structurally impossible** across all 64 base tables, and every table passes 2NF.

## 2. Table-by-Table 2NF Evaluation

| Table | PK Type | Primary Key Column | Partial Key Dependencies | 2NF Status | Notes |
|---|---|---|:---:|:---:|---|
| `academic_programs` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `account_lifecycle_events` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `administrative_units` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `attendance_records` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `attendance_sessions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `audit_logs` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_candidate_manual_decisions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_criteria` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_criterion_components` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_cycles` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_definitions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_evaluation_summary_reports` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_evidence_mapping_conditions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_evidence_mapping_rules` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_interview_eligibilities` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_portfolio_mappings` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_scoring_model_versions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_scoring_rules` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `award_student_evaluation_summaries` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `certificate_issuance_batches` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `certificate_template_families` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `certificate_template_versions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `colleges` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `dean_assignments` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `dean_student_nominations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `events` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `file_security_audit_events` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `issued_certificates` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `local_auth_credentials` | Single-Column PK | `profile_id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `local_auth_sessions` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `migrations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `notification_preferences` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `notifications` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `organization_moderator_assignments` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `organization_program_affiliations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `organizations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `password_reset_requests` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_accomplishment_evidence` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_accomplishments` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_administrative_unit_affiliations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_college_affiliations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_evaluation_deficiency_requests` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_evaluation_events` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_evaluation_items` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_evaluation_reports` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_evaluations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_profiles` | Single-Column PK | `profile_id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_program_affiliations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `personnel_qualification_reviews` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `portfolio_categories` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `portfolio_subcategories` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `profile_roles` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `profiles` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `program_coordinator_assignments` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `role_assignment_events` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `roles` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_award_criterion_scores` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_award_evaluations` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_award_score_evidence` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_portfolio_evidence` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_portfolio_records` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_portfolio_verification_events` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_profiles` | Single-Column PK | `profile_id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
| `student_program_enrollments` | Single-Column PK | `id` | NONE (N/A) | **PASS** | Single-column PK structurally precludes partial dependencies |
