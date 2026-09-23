# AchieveNest — Phase 1: Relationship Skeleton

> **Database:** `achievenest_local` (Derived Strictly from Proven Foreign Keys)  

---

| Parent Table | Parent Key | Child Table | Child FK | FK Exists | Delete Rule | Update Rule |
|---|---|---|---|---|---|---|
| `colleges` | `id` | `academic_programs` | `college_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `account_lifecycle_events` | `actor_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `account_lifecycle_events` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `colleges` | `id` | `administrative_units` | `college_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `attendance_records` | `attendee_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `attendance_records` | `scanned_by` | **YES** | `SET NULL` | `NO ACTION` |
| `attendance_sessions` | `id` | `attendance_records` | `session_id` | **YES** | `CASCADE` | `NO ACTION` |
| `events` | `id` | `attendance_sessions` | `event_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `audit_logs` | `actor_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `award_definitions` | `id` | `award_candidate_manual_decisions` | `award_definition_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_cycles` | `id` | `award_candidate_manual_decisions` | `cycle_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `award_candidate_manual_decisions` | `decided_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `award_candidate_manual_decisions` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_definitions` | `id` | `award_criteria` | `award_definition_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_criteria` | `id` | `award_criterion_components` | `criterion_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `award_cycles` | `created_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_definitions` | `id` | `award_evaluation_summary_reports` | `award_definition_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `colleges` | `id` | `award_evaluation_summary_reports` | `college_id` | **YES** | `SET NULL` | `NO ACTION` |
| `award_cycles` | `id` | `award_evaluation_summary_reports` | `cycle_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `award_evaluation_summary_reports` | `generated_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_evidence_mapping_rules` | `id` | `award_evidence_mapping_conditions` | `mapping_rule_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_criterion_components` | `id` | `award_evidence_mapping_rules` | `criterion_component_id` | **YES** | `SET NULL` | `NO ACTION` |
| `award_criteria` | `id` | `award_evidence_mapping_rules` | `criterion_id` | **YES** | `CASCADE` | `NO ACTION` |
| `portfolio_categories` | `id` | `award_evidence_mapping_rules` | `portfolio_category_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_scoring_model_versions` | `id` | `award_evidence_mapping_rules` | `scoring_model_version_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_definitions` | `id` | `award_interview_eligibilities` | `award_definition_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_cycles` | `id` | `award_interview_eligibilities` | `cycle_id` | **YES** | `CASCADE` | `NO ACTION` |
| `dean_student_nominations` | `id` | `award_interview_eligibilities` | `dean_nomination_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `student_award_evaluations` | `id` | `award_interview_eligibilities` | `evaluation_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `award_interview_eligibilities` | `revoked_by` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `award_interview_eligibilities` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `portfolio_categories` | `id` | `award_portfolio_mappings` | `portfolio_category_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `portfolio_subcategories` | `id` | `award_portfolio_mappings` | `portfolio_subcategory_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_scoring_rules` | `id` | `award_portfolio_mappings` | `scoring_rule_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_cycles` | `id` | `award_scoring_model_versions` | `award_cycle_id` | **YES** | `SET NULL` | `NO ACTION` |
| `award_definitions` | `id` | `award_scoring_model_versions` | `award_definition_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_criteria` | `id` | `award_scoring_rules` | `criterion_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_scoring_rules` | `id` | `award_scoring_rules` | `parent_rule_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_definitions` | `id` | `award_student_evaluation_summaries` | `award_definition_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_cycles` | `id` | `award_student_evaluation_summaries` | `cycle_id` | **YES** | `CASCADE` | `NO ACTION` |
| `student_award_evaluations` | `id` | `award_student_evaluation_summaries` | `evaluation_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `award_student_evaluation_summaries` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `events` | `id` | `certificate_issuance_batches` | `event_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `certificate_issuance_batches` | `issuer_profile_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `certificate_template_versions` | `id` | `certificate_issuance_batches` | `template_version_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `certificate_template_families` | `id` | `certificate_template_versions` | `family_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `dean_assignments` | `assigned_by` | **YES** | `SET NULL` | `NO ACTION` |
| `colleges` | `id` | `dean_assignments` | `college_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `dean_assignments` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_definitions` | `id` | `dean_student_nominations` | `award_definition_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `colleges` | `id` | `dean_student_nominations` | `college_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_cycles` | `id` | `dean_student_nominations` | `cycle_id` | **YES** | `CASCADE` | `NO ACTION` |
| `dean_assignments` | `id` | `dean_student_nominations` | `dean_assignment_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `dean_student_nominations` | `dean_profile_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `dean_student_nominations` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `administrative_units` | `id` | `events` | `administrative_unit_id` | **YES** | `SET NULL` | `NO ACTION` |
| `colleges` | `id` | `events` | `college_id` | **YES** | `SET NULL` | `NO ACTION` |
| `organizations` | `id` | `events` | `organization_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `events` | `organizer_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `file_security_audit_events` | `actor_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `certificate_issuance_batches` | `id` | `issued_certificates` | `batch_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `issued_certificates` | `recipient_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `local_auth_credentials` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `local_auth_sessions` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `notification_preferences` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `notifications` | `actor_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `notifications` | `recipient_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `organization_moderator_assignments` | `assigned_by` | **YES** | `SET NULL` | `NO ACTION` |
| `organizations` | `id` | `organization_moderator_assignments` | `organization_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `organization_moderator_assignments` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `academic_programs` | `id` | `organization_program_affiliations` | `academic_program_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `organizations` | `id` | `organization_program_affiliations` | `organization_id` | **YES** | `CASCADE` | `NO ACTION` |
| `colleges` | `id` | `organizations` | `college_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `password_reset_requests` | `processed_by` | **YES** | `SET NULL` | `NO ACTION` |
| `personnel_accomplishments` | `id` | `personnel_accomplishment_evidence` | `accomplishment_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `personnel_accomplishment_evidence` | `uploaded_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_accomplishments` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `administrative_units` | `id` | `personnel_administrative_unit_affiliations` | `administrative_unit_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_administrative_unit_affiliations` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `colleges` | `id` | `personnel_college_affiliations` | `college_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_college_affiliations` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `personnel_evaluations` | `id` | `personnel_evaluation_deficiency_requests` | `evaluation_id` | **YES** | `CASCADE` | `NO ACTION` |
| `personnel_evaluation_items` | `id` | `personnel_evaluation_deficiency_requests` | `item_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `personnel_evaluation_deficiency_requests` | `requested_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_evaluation_events` | `actor_profile_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `personnel_evaluations` | `id` | `personnel_evaluation_events` | `evaluation_id` | **YES** | `CASCADE` | `NO ACTION` |
| `personnel_accomplishments` | `id` | `personnel_evaluation_items` | `accomplishment_id` | **YES** | `SET NULL` | `NO ACTION` |
| `personnel_evaluations` | `id` | `personnel_evaluation_items` | `evaluation_id` | **YES** | `CASCADE` | `NO ACTION` |
| `personnel_evaluations` | `id` | `personnel_evaluation_reports` | `evaluation_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `personnel_evaluation_reports` | `generated_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_evaluations` | `evaluator_profile_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_evaluations` | `finalized_by` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `personnel_evaluations` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `personnel_profiles` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `academic_programs` | `id` | `personnel_program_affiliations` | `academic_program_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `personnel_program_affiliations` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `personnel_qualification_reviews` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `personnel_qualification_reviews` | `reviewer_profile_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `portfolio_categories` | `id` | `portfolio_subcategories` | `category_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `profile_roles` | `assigned_by` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `profile_roles` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `roles` | `id` | `profile_roles` | `role_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `academic_programs` | `id` | `program_coordinator_assignments` | `academic_program_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `program_coordinator_assignments` | `assigned_by` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `program_coordinator_assignments` | `personnel_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `role_assignment_events` | `actor_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `role_assignment_events` | `target_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_criteria` | `id` | `student_award_criterion_scores` | `criterion_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `student_award_evaluations` | `id` | `student_award_criterion_scores` | `evaluation_id` | **YES** | `CASCADE` | `NO ACTION` |
| `award_definitions` | `id` | `student_award_evaluations` | `award_definition_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_cycles` | `id` | `student_award_evaluations` | `cycle_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `student_award_evaluations` | `evaluator_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `profiles` | `id` | `student_award_evaluations` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `student_award_criterion_scores` | `id` | `student_award_score_evidence` | `criterion_score_id` | **YES** | `CASCADE` | `NO ACTION` |
| `student_portfolio_records` | `id` | `student_award_score_evidence` | `portfolio_record_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `award_scoring_rules` | `id` | `student_award_score_evidence` | `scoring_rule_id` | **YES** | `SET NULL` | `NO ACTION` |
| `student_portfolio_records` | `id` | `student_portfolio_evidence` | `portfolio_record_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `student_portfolio_evidence` | `uploaded_by` | **YES** | `RESTRICT` | `NO ACTION` |
| `portfolio_categories` | `id` | `student_portfolio_records` | `category_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `student_portfolio_records` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `portfolio_subcategories` | `id` | `student_portfolio_records` | `subcategory_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `student_portfolio_verification_events` | `actor_profile_id` | **YES** | `SET NULL` | `NO ACTION` |
| `student_portfolio_records` | `id` | `student_portfolio_verification_events` | `portfolio_record_id` | **YES** | `CASCADE` | `NO ACTION` |
| `profiles` | `id` | `student_profiles` | `profile_id` | **YES** | `CASCADE` | `NO ACTION` |
| `academic_programs` | `id` | `student_program_enrollments` | `academic_program_id` | **YES** | `RESTRICT` | `NO ACTION` |
| `profiles` | `id` | `student_program_enrollments` | `student_profile_id` | **YES** | `CASCADE` | `NO ACTION` |
