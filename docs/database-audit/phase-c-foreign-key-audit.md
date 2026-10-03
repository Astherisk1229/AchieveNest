# AchieveNest — Phase C: Foreign Key Inventory

> **Database:** `achievenest_local`  
> **Total Foreign Key Constraints:** 126  

---

| Child Table | Child Column | Constraint Name | Parent Table | Parent Key | Nullable | Update Rule | Delete Rule |
|---|---|---|---|---|:---:|---|---|
| `academic_programs` | `college_id` | `fk_academic_programs_college` | `colleges` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `account_lifecycle_events` | `actor_profile_id` | `fk_account_lifecycle_actor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `account_lifecycle_events` | `profile_id` | `fk_account_lifecycle_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `administrative_units` | `college_id` | `fk_administrative_units_college` | `colleges` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `attendance_records` | `attendee_profile_id` | `fk_attendance_records_attendee` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `attendance_records` | `scanned_by` | `fk_attendance_records_scanner` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `attendance_records` | `session_id` | `fk_attendance_records_session` | `attendance_sessions` | `id` | NO | `NO ACTION` | `CASCADE` |
| `attendance_sessions` | `event_id` | `fk_attendance_sessions_event` | `events` | `id` | NO | `NO ACTION` | `CASCADE` |
| `audit_logs` | `actor_profile_id` | `fk_audit_logs_actor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `award_candidate_manual_decisions` | `award_definition_id` | `fk_acmd_award` | `award_definitions` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_candidate_manual_decisions` | `cycle_id` | `fk_acmd_cycle` | `award_cycles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_candidate_manual_decisions` | `decided_by` | `fk_acmd_decided_by` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_candidate_manual_decisions` | `student_profile_id` | `fk_acmd_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_criteria` | `award_definition_id` | `fk_award_criteria_award` | `award_definitions` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_criterion_components` | `criterion_id` | `fk_acc_criterion` | `award_criteria` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_cycles` | `created_by` | `fk_award_cycles_creator` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_evaluation_summary_reports` | `award_definition_id` | `fk_summary_reports_award` | `award_definitions` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_evaluation_summary_reports` | `college_id` | `fk_summary_reports_college` | `colleges` | `id` | YES | `NO ACTION` | `SET NULL` |
| `award_evaluation_summary_reports` | `cycle_id` | `fk_summary_reports_cycle` | `award_cycles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_evaluation_summary_reports` | `generated_by` | `fk_summary_reports_generator` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_evidence_mapping_conditions` | `mapping_rule_id` | `fk_aemc_rule` | `award_evidence_mapping_rules` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_evidence_mapping_rules` | `criterion_component_id` | `fk_aemr_component` | `award_criterion_components` | `id` | YES | `NO ACTION` | `SET NULL` |
| `award_evidence_mapping_rules` | `criterion_id` | `fk_aemr_criterion` | `award_criteria` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_evidence_mapping_rules` | `portfolio_category_id` | `fk_aemr_category` | `portfolio_categories` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_evidence_mapping_rules` | `scoring_model_version_id` | `fk_aemr_version` | `award_scoring_model_versions` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_interview_eligibilities` | `award_definition_id` | `fk_interview_eligibility_award` | `award_definitions` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_interview_eligibilities` | `cycle_id` | `fk_interview_eligibility_cycle` | `award_cycles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_interview_eligibilities` | `dean_nomination_id` | `fk_interview_eligibility_nomination` | `dean_student_nominations` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `award_interview_eligibilities` | `evaluation_id` | `fk_interview_eligibility_evaluation` | `student_award_evaluations` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `award_interview_eligibilities` | `revoked_by` | `fk_interview_eligibility_revoker` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `award_interview_eligibilities` | `student_profile_id` | `fk_interview_eligibility_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_portfolio_mappings` | `portfolio_category_id` | `fk_award_mappings_category` | `portfolio_categories` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `award_portfolio_mappings` | `portfolio_subcategory_id` | `fk_award_mappings_subcategory` | `portfolio_subcategories` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `award_portfolio_mappings` | `scoring_rule_id` | `fk_award_mappings_rule` | `award_scoring_rules` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_scoring_model_versions` | `award_cycle_id` | `fk_asmv_cycle` | `award_cycles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `award_scoring_model_versions` | `award_definition_id` | `fk_asmv_award` | `award_definitions` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_scoring_rules` | `criterion_id` | `fk_scoring_rules_criterion` | `award_criteria` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_scoring_rules` | `parent_rule_id` | `fk_scoring_rules_parent` | `award_scoring_rules` | `id` | YES | `NO ACTION` | `CASCADE` |
| `award_student_evaluation_summaries` | `award_definition_id` | `fk_ases_award` | `award_definitions` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_student_evaluation_summaries` | `cycle_id` | `fk_ases_cycle` | `award_cycles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_student_evaluation_summaries` | `evaluation_id` | `fk_ases_eval` | `student_award_evaluations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `award_student_evaluation_summaries` | `student_profile_id` | `fk_ases_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `certificate_issuance_batches` | `event_id` | `fk_issuance_batches_event` | `events` | `id` | YES | `NO ACTION` | `SET NULL` |
| `certificate_issuance_batches` | `issuer_profile_id` | `fk_issuance_batches_issuer` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `certificate_issuance_batches` | `template_version_id` | `fk_issuance_batches_template` | `certificate_template_versions` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `certificate_template_versions` | `family_id` | `fk_template_versions_family` | `certificate_template_families` | `id` | NO | `NO ACTION` | `CASCADE` |
| `dean_assignments` | `assigned_by` | `fk_dean_assign_assigner` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `dean_assignments` | `college_id` | `fk_dean_assign_college` | `colleges` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `dean_assignments` | `personnel_profile_id` | `fk_dean_assign_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `dean_student_nominations` | `award_definition_id` | `fk_dean_nominations_award` | `award_definitions` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `dean_student_nominations` | `college_id` | `fk_dean_nominations_college` | `colleges` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `dean_student_nominations` | `cycle_id` | `fk_dean_nominations_cycle` | `award_cycles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `dean_student_nominations` | `dean_assignment_id` | `fk_dean_nominations_dean_assignment` | `dean_assignments` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `dean_student_nominations` | `dean_profile_id` | `fk_dean_nominations_dean_profile` | `profiles` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `dean_student_nominations` | `student_profile_id` | `fk_dean_nominations_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `events` | `administrative_unit_id` | `fk_events_admin_unit` | `administrative_units` | `id` | YES | `NO ACTION` | `SET NULL` |
| `events` | `college_id` | `fk_events_college` | `colleges` | `id` | YES | `NO ACTION` | `SET NULL` |
| `events` | `organization_id` | `fk_events_organization` | `organizations` | `id` | YES | `NO ACTION` | `SET NULL` |
| `events` | `organizer_profile_id` | `fk_events_organizer` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `file_security_audit_events` | `actor_profile_id` | `fk_file_security_actor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `issued_certificates` | `batch_id` | `fk_issued_certificates_batch` | `certificate_issuance_batches` | `id` | NO | `NO ACTION` | `CASCADE` |
| `issued_certificates` | `recipient_profile_id` | `fk_issued_certificates_recipient` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `local_auth_credentials` | `profile_id` | `fk_local_auth_credentials_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `local_auth_sessions` | `profile_id` | `fk_local_auth_sessions_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `notification_preferences` | `profile_id` | `fk_notif_prefs_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `notifications` | `actor_profile_id` | `fk_notifications_actor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `notifications` | `recipient_profile_id` | `fk_notifications_recipient` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `organization_moderator_assignments` | `assigned_by` | `fk_org_mod_assigner` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `organization_moderator_assignments` | `organization_id` | `fk_org_mod_org` | `organizations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `organization_moderator_assignments` | `personnel_profile_id` | `fk_org_mod_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `organization_program_affiliations` | `academic_program_id` | `fk_org_prog_program` | `academic_programs` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `organization_program_affiliations` | `organization_id` | `fk_org_prog_org` | `organizations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `organizations` | `college_id` | `fk_organizations_college` | `colleges` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `password_reset_requests` | `processed_by` | `fk_password_resets_processor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `personnel_accomplishment_evidence` | `accomplishment_id` | `fk_personnel_evidence_accomplishment` | `personnel_accomplishments` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_accomplishment_evidence` | `uploaded_by` | `fk_personnel_evidence_uploader` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_accomplishments` | `personnel_profile_id` | `fk_personnel_accomplishments_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_administrative_unit_affiliations` | `administrative_unit_id` | `fk_personnel_unit_unit` | `administrative_units` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_administrative_unit_affiliations` | `personnel_profile_id` | `fk_personnel_unit_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_college_affiliations` | `college_id` | `fk_personnel_college_college` | `colleges` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_college_affiliations` | `personnel_profile_id` | `fk_personnel_college_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_evaluation_deficiency_requests` | `evaluation_id` | `fk_deficiency_requests_evaluation` | `personnel_evaluations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_evaluation_deficiency_requests` | `item_id` | `fk_deficiency_requests_item` | `personnel_evaluation_items` | `id` | YES | `NO ACTION` | `SET NULL` |
| `personnel_evaluation_deficiency_requests` | `requested_by` | `fk_deficiency_requests_requester` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_evaluation_events` | `actor_profile_id` | `fk_evaluation_events_actor` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_evaluation_events` | `evaluation_id` | `fk_evaluation_events_evaluation` | `personnel_evaluations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_evaluation_items` | `accomplishment_id` | `fk_evaluation_items_accomplishment` | `personnel_accomplishments` | `id` | YES | `NO ACTION` | `SET NULL` |
| `personnel_evaluation_items` | `evaluation_id` | `fk_evaluation_items_evaluation` | `personnel_evaluations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_evaluation_reports` | `evaluation_id` | `fk_evaluation_reports_evaluation` | `personnel_evaluations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_evaluation_reports` | `generated_by` | `fk_evaluation_reports_generator` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_evaluations` | `evaluator_profile_id` | `fk_personnel_evaluations_evaluator` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_evaluations` | `finalized_by` | `fk_personnel_evaluations_finalizer` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `personnel_evaluations` | `personnel_profile_id` | `fk_personnel_evaluations_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_profiles` | `profile_id` | `fk_personnel_profiles_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_program_affiliations` | `academic_program_id` | `fk_personnel_program_program` | `academic_programs` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `personnel_program_affiliations` | `personnel_profile_id` | `fk_personnel_program_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_qualification_reviews` | `personnel_profile_id` | `fk_qualification_reviews_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `personnel_qualification_reviews` | `reviewer_profile_id` | `fk_qualification_reviews_reviewer` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `portfolio_subcategories` | `category_id` | `fk_portfolio_subcategories_category` | `portfolio_categories` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `profile_roles` | `assigned_by` | `fk_profile_roles_assigner` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `profile_roles` | `profile_id` | `fk_profile_roles_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `profile_roles` | `role_id` | `fk_profile_roles_role` | `roles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `program_coordinator_assignments` | `academic_program_id` | `fk_prog_coord_program` | `academic_programs` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `program_coordinator_assignments` | `assigned_by` | `fk_prog_coord_assigner` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `program_coordinator_assignments` | `personnel_profile_id` | `fk_prog_coord_personnel` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `role_assignment_events` | `actor_profile_id` | `fk_role_events_actor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `role_assignment_events` | `target_profile_id` | `fk_role_events_target` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_award_criterion_scores` | `criterion_id` | `fk_criterion_scores_criterion` | `award_criteria` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `student_award_criterion_scores` | `evaluation_id` | `fk_criterion_scores_evaluation` | `student_award_evaluations` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_award_evaluations` | `award_definition_id` | `fk_student_evaluations_award` | `award_definitions` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `student_award_evaluations` | `cycle_id` | `fk_student_evaluations_cycle` | `award_cycles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_award_evaluations` | `evaluator_profile_id` | `fk_student_evaluations_evaluator` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `student_award_evaluations` | `student_profile_id` | `fk_student_evaluations_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_award_score_evidence` | `criterion_score_id` | `fk_score_evidence_criterion_score` | `student_award_criterion_scores` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_award_score_evidence` | `portfolio_record_id` | `fk_score_evidence_portfolio_record` | `student_portfolio_records` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `student_award_score_evidence` | `scoring_rule_id` | `fk_score_evidence_scoring_rule` | `award_scoring_rules` | `id` | YES | `NO ACTION` | `SET NULL` |
| `student_portfolio_evidence` | `portfolio_record_id` | `fk_portfolio_evidence_record` | `student_portfolio_records` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_portfolio_evidence` | `uploaded_by` | `fk_portfolio_evidence_uploader` | `profiles` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `student_portfolio_records` | `category_id` | `fk_portfolio_records_category` | `portfolio_categories` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `student_portfolio_records` | `student_profile_id` | `fk_portfolio_records_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_portfolio_records` | `subcategory_id` | `fk_portfolio_records_subcategory` | `portfolio_subcategories` | `id` | YES | `NO ACTION` | `RESTRICT` |
| `student_portfolio_verification_events` | `actor_profile_id` | `fk_verification_events_actor` | `profiles` | `id` | YES | `NO ACTION` | `SET NULL` |
| `student_portfolio_verification_events` | `portfolio_record_id` | `fk_verification_events_record` | `student_portfolio_records` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_profiles` | `profile_id` | `fk_student_profiles_profile` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
| `student_program_enrollments` | `academic_program_id` | `fk_student_enrollment_program` | `academic_programs` | `id` | NO | `NO ACTION` | `RESTRICT` |
| `student_program_enrollments` | `student_profile_id` | `fk_student_enrollment_student` | `profiles` | `id` | NO | `NO ACTION` | `CASCADE` |
