# AchieveNest — Phase F: 3NF Assessment Report

> **Database:** `achievenest_local`  

---

| Table | Non-Key Determinants | Transitive Dependencies | Documented Cache / Snapshot | 3NF Status | Notes |
|---|:---:|:---:|---|:---:|---|
| `academic_programs` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `account_lifecycle_events` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `administrative_units` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `attendance_records` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `attendance_sessions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `audit_logs` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_candidate_manual_decisions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_criteria` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_criterion_components` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_cycles` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_definitions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_evaluation_summary_reports` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_evidence_mapping_conditions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_evidence_mapping_rules` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_interview_eligibilities` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_portfolio_mappings` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_scoring_model_versions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_scoring_rules` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `award_student_evaluation_summaries` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `certificate_issuance_batches` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `certificate_template_families` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `certificate_template_versions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `colleges` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `dean_assignments` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `dean_student_nominations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `events` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `file_security_audit_events` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `issued_certificates` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `local_auth_credentials` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `local_auth_sessions` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `migrations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `notification_preferences` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `notifications` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `organization_moderator_assignments` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `organization_program_affiliations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `organizations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `password_reset_requests` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_accomplishment_evidence` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_accomplishments` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_administrative_unit_affiliations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_college_affiliations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_evaluation_deficiency_requests` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_evaluation_events` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_evaluation_items` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_evaluation_reports` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_evaluations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_profiles` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_program_affiliations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `personnel_qualification_reviews` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `portfolio_categories` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `portfolio_subcategories` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `profile_roles` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `profiles` | NONE | NONE | `full_name` (Search/Display cache derived from atomic name components) | **PASS (Justified)** | Clean relational normalization |
| `program_coordinator_assignments` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `role_assignment_events` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `roles` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_award_criterion_scores` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_award_evaluations` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_award_score_evidence` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_portfolio_evidence` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_portfolio_records` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_portfolio_verification_events` | NONE | NONE | None | **PASS** | Clean relational normalization |
| `student_profiles` | NONE | NONE | `year_level` (Performance cache of current active academic term enrollment) | **PASS (Justified)** | Clean relational normalization |
| `student_program_enrollments` | NONE | NONE | None | **PASS** | Clean relational normalization |
