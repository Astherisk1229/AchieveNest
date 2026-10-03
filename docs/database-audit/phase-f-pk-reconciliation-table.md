# AchieveNest — Phase F: Primary Key Reconciliation Table

> **Database:** `achievenest_local` (MySQL `8.4.7`)  
> **Git Revision:** `ea987bf32c208cc99ebe1a60b989c0c09ca83e98`  
> **Audit Timestamp:** `2026-08-31 19:32:40 UTC`  

---

## 1. Summary of Primary Key Topology
- **Total Base Tables:** 64
- **Single-Column PK Tables:** 64 (61 with `id`, 3 with `profile_id`)
- **Composite-PK Tables:** 0
- **Tables Without PK:** 0 (100% Primary Key Coverage)

## 2. Table-by-Table Primary Key Verification

| # | Table Name | Primary Key Column(s) | PK Column Count | PK Type | 2NF Partial Dependency Risk |
|---|---|---|---:|---|:---:|
| 1 | `academic_programs` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 2 | `account_lifecycle_events` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 3 | `administrative_units` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 4 | `attendance_records` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 5 | `attendance_sessions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 6 | `audit_logs` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 7 | `award_candidate_manual_decisions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 8 | `award_criteria` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 9 | `award_criterion_components` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 10 | `award_cycles` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 11 | `award_definitions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 12 | `award_evaluation_summary_reports` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 13 | `award_evidence_mapping_conditions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 14 | `award_evidence_mapping_rules` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 15 | `award_interview_eligibilities` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 16 | `award_portfolio_mappings` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 17 | `award_scoring_model_versions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 18 | `award_scoring_rules` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 19 | `award_student_evaluation_summaries` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 20 | `certificate_issuance_batches` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 21 | `certificate_template_families` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 22 | `certificate_template_versions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 23 | `colleges` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 24 | `dean_assignments` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 25 | `dean_student_nominations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 26 | `events` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 27 | `file_security_audit_events` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 28 | `issued_certificates` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 29 | `local_auth_credentials` | `profile_id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 30 | `local_auth_sessions` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 31 | `migrations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 32 | `notification_preferences` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 33 | `notifications` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 34 | `organization_moderator_assignments` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 35 | `organization_program_affiliations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 36 | `organizations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 37 | `password_reset_requests` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 38 | `personnel_accomplishment_evidence` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 39 | `personnel_accomplishments` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 40 | `personnel_administrative_unit_affiliations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 41 | `personnel_college_affiliations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 42 | `personnel_evaluation_deficiency_requests` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 43 | `personnel_evaluation_events` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 44 | `personnel_evaluation_items` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 45 | `personnel_evaluation_reports` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 46 | `personnel_evaluations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 47 | `personnel_profiles` | `profile_id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 48 | `personnel_program_affiliations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 49 | `personnel_qualification_reviews` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 50 | `portfolio_categories` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 51 | `portfolio_subcategories` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 52 | `profile_roles` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 53 | `profiles` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 54 | `program_coordinator_assignments` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 55 | `role_assignment_events` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 56 | `roles` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 57 | `student_award_criterion_scores` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 58 | `student_award_evaluations` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 59 | `student_award_score_evidence` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 60 | `student_portfolio_evidence` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 61 | `student_portfolio_records` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 62 | `student_portfolio_verification_events` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 63 | `student_profiles` | `profile_id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
| 64 | `student_program_enrollments` | `id` | 1 | SINGLE-COLUMN PK | **N/A (Single-Column PK)** |
