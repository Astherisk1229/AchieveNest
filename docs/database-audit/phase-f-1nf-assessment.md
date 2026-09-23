# AchieveNest — Phase F: 1NF Assessment Report

> **Database:** `achievenest_local`  
> **Evaluated Tables:** 64  

---

| Table | Atomic Fields | Repeating Groups | Multi-Value Relational Fields | Unique Row Identifier | 1NF Status | Notes |
|---|:---:|:---:|:---:|:---:|:---:|---|
| `academic_programs` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `account_lifecycle_events` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `administrative_units` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `attendance_records` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `attendance_sessions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `audit_logs` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_candidate_manual_decisions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_criteria` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_criterion_components` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_cycles` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_definitions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_evaluation_summary_reports` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_evidence_mapping_conditions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_evidence_mapping_rules` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_interview_eligibilities` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_portfolio_mappings` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_scoring_model_versions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_scoring_rules` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `award_student_evaluation_summaries` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `certificate_issuance_batches` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `certificate_template_families` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `certificate_template_versions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `colleges` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `dean_assignments` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `dean_student_nominations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `events` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `file_security_audit_events` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `issued_certificates` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `local_auth_credentials` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `local_auth_sessions` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `migrations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `notification_preferences` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `notifications` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `organization_moderator_assignments` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `organization_program_affiliations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `organizations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `password_reset_requests` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_accomplishment_evidence` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_accomplishments` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_administrative_unit_affiliations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_college_affiliations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_evaluation_deficiency_requests` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_evaluation_events` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_evaluation_items` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_evaluation_reports` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_evaluations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_profiles` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_program_affiliations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `personnel_qualification_reviews` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `portfolio_categories` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `portfolio_subcategories` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `profile_roles` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `profiles` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `program_coordinator_assignments` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `role_assignment_events` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `roles` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_award_criterion_scores` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_award_evaluations` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_award_score_evidence` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_portfolio_evidence` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_portfolio_records` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_portfolio_verification_events` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_profiles` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
| `student_program_enrollments` | YES | NONE | NONE | YES (PK) | **PASS** | Fully atomic relational attributes |
