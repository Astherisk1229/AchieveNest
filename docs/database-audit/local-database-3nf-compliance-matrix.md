# AchieveNest — Local Database 3NF Compliance Matrix

> **Database:** `achievenest_local`  
> **Coverage:** All 64 Relational Base Tables  

---

| Table Name | 1NF | 2NF | 3NF | Justified Denormalization | Normalization Status | Recommended Action |
|---|:---:|:---:|:---:|---|:---:|---|
| `academic_programs` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `account_lifecycle_events` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `administrative_units` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `attendance_records` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `attendance_sessions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `audit_logs` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_candidate_manual_decisions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_criteria` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_criterion_components` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_cycles` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_definitions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_evaluation_summary_reports` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_evidence_mapping_conditions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_evidence_mapping_rules` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_interview_eligibilities` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_portfolio_mappings` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_scoring_model_versions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_scoring_rules` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `award_student_evaluation_summaries` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `certificate_issuance_batches` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `certificate_template_families` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `certificate_template_versions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `colleges` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `dean_assignments` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `dean_student_nominations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `events` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `file_security_audit_events` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `issued_certificates` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `local_auth_credentials` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `local_auth_sessions` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `migrations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `notification_preferences` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `notifications` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `organization_moderator_assignments` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `organization_program_affiliations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `organizations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `password_reset_requests` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_accomplishment_evidence` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_accomplishments` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_administrative_unit_affiliations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_college_affiliations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_evaluation_deficiency_requests` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_evaluation_events` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_evaluation_items` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_evaluation_reports` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_evaluations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_profiles` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_program_affiliations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `personnel_qualification_reviews` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `portfolio_categories` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `portfolio_subcategories` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `profile_roles` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `profiles` | PASS | PASS | PASS (Justified) | `full_name` (Search/Display cache derived from atomic name components) | **PASS — JUSTIFIED DENORMALIZATION** | KEEP |
| `program_coordinator_assignments` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `role_assignment_events` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `roles` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_award_criterion_scores` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_award_evaluations` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_award_score_evidence` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_portfolio_evidence` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_portfolio_records` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_portfolio_verification_events` | PASS | PASS | PASS | None | **PASS** | KEEP |
| `student_profiles` | PASS | PASS | PASS (Justified) | `year_level` (Performance cache of current active academic term enrollment) | **PASS — JUSTIFIED DENORMALIZATION** | KEEP |
| `student_program_enrollments` | PASS | PASS | PASS | None | **PASS** | KEEP |
