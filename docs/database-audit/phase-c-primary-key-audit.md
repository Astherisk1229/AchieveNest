# AchieveNest — Phase C: Primary Key Audit (Reconciled)

> **Database:** `achievenest_local`  
> **Reconciliation Note:** Revalidated during Phase F PK reconciliation on 2026-08-31 19:32:40 UTC.  
> **Git Revision:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  

---

## 1. Primary Key Summary
- **Single-Column PK Tables:** 64 (61 tables use `id`, 3 subtype/extension tables use `profile_id`)
- **Composite PK Tables:** 0 (Junction tables use surrogate `id` with composite `UNIQUE` constraints)
- **Tables Without PK:** 0 (100% PK coverage)

## 2. Table-by-Table Primary Key Inventory

| Table Name | Primary Key Column(s) | Key Structure | 3NF Identity Assessment |
|---|---|---|---|
| `academic_programs` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `account_lifecycle_events` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `administrative_units` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `attendance_records` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `attendance_sessions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `audit_logs` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_candidate_manual_decisions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_criteria` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_criterion_components` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_cycles` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_definitions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_evaluation_summary_reports` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_evidence_mapping_conditions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_evidence_mapping_rules` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_interview_eligibilities` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_portfolio_mappings` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_scoring_model_versions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_scoring_rules` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `award_student_evaluation_summaries` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `certificate_issuance_batches` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `certificate_template_families` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `certificate_template_versions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `colleges` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `dean_assignments` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `dean_student_nominations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `events` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `file_security_audit_events` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `issued_certificates` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `local_auth_credentials` | `profile_id` | Single Column PK | **PASS** (Canonical Subtype Profile PK-FK) |
| `local_auth_sessions` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `migrations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `notification_preferences` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `notifications` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `organization_moderator_assignments` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `organization_program_affiliations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `organizations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `password_reset_requests` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_accomplishment_evidence` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_accomplishments` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_administrative_unit_affiliations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_college_affiliations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_evaluation_deficiency_requests` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_evaluation_events` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_evaluation_items` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_evaluation_reports` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_evaluations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_profiles` | `profile_id` | Single Column PK | **PASS** (Canonical Subtype Profile PK-FK) |
| `personnel_program_affiliations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `personnel_qualification_reviews` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `portfolio_categories` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `portfolio_subcategories` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `profile_roles` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `profiles` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `program_coordinator_assignments` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `role_assignment_events` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `roles` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_award_criterion_scores` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_award_evaluations` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_award_score_evidence` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_portfolio_evidence` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_portfolio_records` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_portfolio_verification_events` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
| `student_profiles` | `profile_id` | Single Column PK | **PASS** (Canonical Subtype Profile PK-FK) |
| `student_program_enrollments` | `id` | Single Column PK | **PASS** (Canonical UUID / Surrogate ID) |
