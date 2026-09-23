# AchieveNest — Phase 1: CHECK Constraint Inventory

> **Database:** `achievenest_local`  

---

| Table Name | Constraint Name | Check Clause | Audit Status |
|---|---|---|---|
| `academic_programs` | `ck_academic_programs_degree_level` | `(`degree_level` in (_utf8mb4\'undergraduate\',_utf8mb4\'graduate\',_utf8mb4\'certificate\',_utf8mb4\'diploma\'))` | **CONFIRMED** |
| `academic_programs` | `ck_academic_programs_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `administrative_units` | `ck_administrative_units_college_scope` | `(((`unit_type` = _utf8mb4\'college_based_office\') and (`college_id` is not null)) or ((`unit_type` <> _utf8mb4\'college_based_office\') and (`college_id` is null)))` | **CONFIRMED** |
| `administrative_units` | `ck_administrative_units_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `administrative_units` | `ck_administrative_units_unit_type` | `(`unit_type` in (_utf8mb4\'central_office\',_utf8mb4\'college_based_office\',_utf8mb4\'other\'))` | **CONFIRMED** |
| `attendance_records` | `ck_attendance_records_method` | `(`verification_method` in (_utf8mb4\'qr_scan\',_utf8mb4\'manual\',_utf8mb4\'self_checkin\'))` | **CONFIRMED** |
| `attendance_sessions` | `ck_attendance_sessions_status` | `(`status` in (_utf8mb4\'scheduled\',_utf8mb4\'open\',_utf8mb4\'closed\'))` | **CONFIRMED** |
| `attendance_sessions` | `ck_attendance_sessions_type` | `(`session_type` in (_utf8mb4\'general\',_utf8mb4\'morning\',_utf8mb4\'afternoon\',_utf8mb4\'breakout\'))` | **CONFIRMED** |
| `audit_logs` | `ck_audit_logs_outcome` | `(`outcome` in (_utf8mb4\'success\',_utf8mb4\'failure\',_utf8mb4\'denied\'))` | **CONFIRMED** |
| `award_criteria` | `ck_award_criteria_max_points` | `(`max_points` >= 0.00)` | **CONFIRMED** |
| `award_cycles` | `ck_award_cycles_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'evaluating\',_utf8mb4\'active\',_utf8mb4\'evaluation_closed\',_utf8mb4\'finalized\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `award_definitions` | `ck_award_definitions_gender` | `((`gender_restriction` is null) or (`gender_restriction` in (_utf8mb4\'male\',_utf8mb4\'female\')))` | **CONFIRMED** |
| `award_definitions` | `ck_award_definitions_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'active\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `award_definitions` | `ck_award_definitions_threshold` | `((`candidate_threshold_percent` >= 0.00) and (`candidate_threshold_percent` <= 100.00))` | **CONFIRMED** |
| `award_interview_eligibilities` | `ck_award_eligibility_source_reference` | `(((`eligibility_source` = _utf8mb4\'portfolio_based\') and (`evaluation_id` is not null) and (`dean_nomination_id` is null)) or ((`eligibility_source` = _utf8mb4\'dean_nomination\') and (`dean_nomination_id` is not null) and (`evaluation_id` is null)))` | **CONFIRMED** |
| `award_interview_eligibilities` | `ck_interview_eligibility_pathway` | `(`pathway` in (_utf8mb4\'automated_threshold\',_utf8mb4\'dean_nomination\',_utf8mb4\'both\'))` | **CONFIRMED** |
| `award_interview_eligibilities` | `ck_interview_eligibility_score` | `((`potential_score` is null) or ((`potential_score` >= 0.00) and (`potential_score` <= 100.00)))` | **CONFIRMED** |
| `award_interview_eligibilities` | `ck_interview_eligibility_source` | `(`eligibility_source` in (_utf8mb4\'portfolio_based\',_utf8mb4\'dean_nomination\'))` | **CONFIRMED** |
| `award_interview_eligibilities` | `ck_interview_eligibility_status` | `(`status` in (_utf8mb4\'eligible\',_utf8mb4\'scheduled\',_utf8mb4\'completed\',_utf8mb4\'withdrawn\',_utf8mb4\'revoked\'))` | **CONFIRMED** |
| `award_scoring_rules` | `ck_scoring_rules_max_points` | `((`max_points` is null) or (`max_points` >= 0.00))` | **CONFIRMED** |
| `award_scoring_rules` | `ck_scoring_rules_type` | `(`rule_type` in (_utf8mb4\'highest_only\',_utf8mb4\'sum_capped\',_utf8mb4\'count_mapping\',_utf8mb4\'fixed_presence\',_utf8mb4\'matrix_mapping\',_utf8mb4\'formula\',_utf8mb4\'other_configured\'))` | **CONFIRMED** |
| `certificate_issuance_batches` | `ck_issuance_batches_status` | `(`status` in (_utf8mb4\'pending\',_utf8mb4\'processing\',_utf8mb4\'completed\',_utf8mb4\'failed\'))` | **CONFIRMED** |
| `certificate_template_families` | `ck_template_families_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\'))` | **CONFIRMED** |
| `certificate_template_versions` | `ck_template_versions_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'active\',_utf8mb4\'deprecated\'))` | **CONFIRMED** |
| `colleges` | `ck_colleges_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\'))` | **CONFIRMED** |
| `dean_student_nominations` | `ck_dean_nominations_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'endorsed\',_utf8mb4\'withdrawn\',_utf8mb4\'revoked\'))` | **CONFIRMED** |
| `events` | `ck_events_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'published\',_utf8mb4\'ongoing\',_utf8mb4\'completed\',_utf8mb4\'cancelled\'))` | **CONFIRMED** |
| `file_security_audit_events` | `ck_file_security_byte_size` | `(`byte_size` > 0)` | **CONFIRMED** |
| `file_security_audit_events` | `ck_file_security_domain` | `(`evidence_domain` in (_utf8mb4\'student_portfolio\',_utf8mb4\'personnel_accomplishment\'))` | **CONFIRMED** |
| `file_security_audit_events` | `ck_file_security_result` | `(`result` in (_utf8mb4\'clean\',_utf8mb4\'rejected\',_utf8mb4\'scan_error\'))` | **CONFIRMED** |
| `issued_certificates` | `ck_issued_certificates_status` | `(`status` in (_utf8mb4\'valid\',_utf8mb4\'revoked\',_utf8mb4\'expired\'))` | **CONFIRMED** |
| `local_auth_credentials` | `ck_local_auth_credentials_status` | `(`status` in (_cp850\'active\',_cp850\'disabled\',_cp850\'locked\'))` | **CONFIRMED** |
| `organizations` | `ck_organizations_category` | `(`category` in (_utf8mb4\'academic_college\',_utf8mb4\'co_curricular\',_utf8mb4\'special_interest\',_utf8mb4\'socio_cultural\',_utf8mb4\'religious\',_utf8mb4\'sports\',_utf8mb4\'student_council\'))` | **CONFIRMED** |
| `organizations` | `ck_organizations_scope` | `(`scope` in (_utf8mb4\'university\',_utf8mb4\'college\',_utf8mb4\'program\'))` | **CONFIRMED** |
| `organizations` | `ck_organizations_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `password_reset_requests` | `ck_password_resets_status` | `(`status` in (_utf8mb4\'pending\',_utf8mb4\'approved\',_utf8mb4\'rejected\',_utf8mb4\'completed\'))` | **CONFIRMED** |
| `personnel_accomplishment_evidence` | `ck_personnel_evidence_byte_size` | `(`byte_size` > 0)` | **CONFIRMED** |
| `personnel_accomplishment_evidence` | `ck_personnel_evidence_security_status` | `(`security_status` in (_utf8mb4\'pending\',_utf8mb4\'clean\',_utf8mb4\'rejected\',_utf8mb4\'quarantined\'))` | **CONFIRMED** |
| `personnel_accomplishment_evidence` | `ck_personnel_evidence_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'archived\',_utf8mb4\'deleted\'))` | **CONFIRMED** |
| `personnel_accomplishments` | `ck_personnel_accomplishments_domain` | `(`domain` in (_utf8mb4\'professional_development\',_utf8mb4\'productivity_creative_work\',_utf8mb4\'service_leadership\'))` | **CONFIRMED** |
| `personnel_accomplishments` | `ck_personnel_accomplishments_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'submitted\',_utf8mb4\'under_review\',_utf8mb4\'verified\',_utf8mb4\'rejected\',_utf8mb4\'returned\'))` | **CONFIRMED** |
| `personnel_evaluation_deficiency_requests` | `ck_deficiency_requests_status` | `(`status` in (_utf8mb4\'pending\',_utf8mb4\'responded\',_utf8mb4\'resolved\',_utf8mb4\'cancelled\'))` | **CONFIRMED** |
| `personnel_evaluation_items` | `ck_evaluation_items_domain` | `(`domain` in (_utf8mb4\'professional_development\',_utf8mb4\'productivity_creative_work\',_utf8mb4\'service_leadership\'))` | **CONFIRMED** |
| `personnel_evaluations` | `ck_evaluations_passing_status` | `(`passing_status` in (_utf8mb4\'pass\',_utf8mb4\'fail\'))` | **CONFIRMED** |
| `personnel_evaluations` | `ck_evaluations_score_productivity` | `((`score_productivity_creative_work` >= 0.00) and (`score_productivity_creative_work` <= 50.00))` | **CONFIRMED** |
| `personnel_evaluations` | `ck_evaluations_score_prof_dev` | `((`score_professional_development` >= 0.00) and (`score_professional_development` <= 70.00))` | **CONFIRMED** |
| `personnel_evaluations` | `ck_evaluations_score_service` | `((`score_service_leadership` >= 0.00) and (`score_service_leadership` <= 40.00))` | **CONFIRMED** |
| `personnel_evaluations` | `ck_evaluations_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'in_progress\',_utf8mb4\'under_review\',_utf8mb4\'revision_requested\',_utf8mb4\'ready_for_finalization\',_utf8mb4\'finalized\'))` | **CONFIRMED** |
| `personnel_evaluations` | `ck_evaluations_total_score` | `((`total_score` >= 0.00) and (`total_score` <= 160.00))` | **CONFIRMED** |
| `personnel_profiles` | `ck_personnel_profiles_classification` | `(`personnel_classification` in (_utf8mb4\'academic\',_utf8mb4\'non_academic\'))` | **CONFIRMED** |
| `personnel_profiles` | `ck_personnel_profiles_employment_status` | `(`employment_status` in (_utf8mb4\'full_time\',_utf8mb4\'part_time\',_utf8mb4\'contractual\',_utf8mb4\'visiting\'))` | **CONFIRMED** |
| `personnel_qualification_reviews` | `ck_qualification_reviews_status` | `(`qualification_status` in (_utf8mb4\'qualified\',_utf8mb4\'not_qualified\',_utf8mb4\'conditional\'))` | **CONFIRMED** |
| `portfolio_categories` | `ck_portfolio_categories_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `portfolio_subcategories` | `ck_portfolio_subcategories_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'inactive\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `profile_roles` | `ck_profile_roles_scope_type` | `(`scope_type` in (_utf8mb4\'university\',_utf8mb4\'college\',_utf8mb4\'academic_program\',_utf8mb4\'administrative_unit\',_utf8mb4\'organization\'))` | **CONFIRMED** |
| `profiles` | `ck_profiles_account_type` | `(`account_type` in (_utf8mb4\'student\',_utf8mb4\'personnel\',_utf8mb4\'hr_admin\',_utf8mb4\'osad_admin\'))` | **CONFIRMED** |
| `profiles` | `ck_profiles_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'suspended\',_utf8mb4\'inactive\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `role_assignment_events` | `ck_role_events_action` | `(`action` in (_utf8mb4\'assigned\',_utf8mb4\'revoked\',_utf8mb4\'activated\',_utf8mb4\'deactivated\'))` | **CONFIRMED** |
| `student_award_criterion_scores` | `ck_criterion_scores_awarded` | `(`awarded_points` >= 0.00)` | **CONFIRMED** |
| `student_award_criterion_scores` | `ck_criterion_scores_max` | `(`max_points` >= 0.00)` | **CONFIRMED** |
| `student_award_evaluations` | `ck_student_evaluations_max_score` | `(`max_computable_score` > 0.00)` | **CONFIRMED** |
| `student_award_evaluations` | `ck_student_evaluations_potential_score` | `((`potential_score` >= 0.00) and (`potential_score` <= 100.00))` | **CONFIRMED** |
| `student_award_evaluations` | `ck_student_evaluations_raw_score` | `(`raw_score` >= 0.00)` | **CONFIRMED** |
| `student_award_evaluations` | `ck_student_evaluations_status` | `(`status` in (_utf8mb4\'pending\',_utf8mb4\'calculated\',_utf8mb4\'in_review\',_utf8mb4\'completed\',_utf8mb4\'verified\',_utf8mb4\'finalized\',_utf8mb4\'superseded\'))` | **CONFIRMED** |
| `student_portfolio_evidence` | `ck_student_evidence_byte_size` | `(`byte_size` > 0)` | **CONFIRMED** |
| `student_portfolio_evidence` | `ck_student_evidence_security_status` | `(`security_status` in (_utf8mb4\'pending\',_utf8mb4\'clean\',_utf8mb4\'rejected\',_utf8mb4\'quarantined\'))` | **CONFIRMED** |
| `student_portfolio_evidence` | `ck_student_evidence_status` | `(`status` in (_utf8mb4\'active\',_utf8mb4\'archived\',_utf8mb4\'deleted\'))` | **CONFIRMED** |
| `student_portfolio_records` | `ck_portfolio_records_status` | `(`status` in (_utf8mb4\'draft\',_utf8mb4\'submitted\',_utf8mb4\'revision_requested\',_utf8mb4\'verified\',_utf8mb4\'rejected\',_utf8mb4\'archived\'))` | **CONFIRMED** |
| `student_portfolio_verification_events` | `ck_verification_events_action` | `(`action` in (_utf8mb4\'submitted\',_utf8mb4\'revision_requested\',_utf8mb4\'resubmitted\',_utf8mb4\'verified\',_utf8mb4\'rejected\'))` | **CONFIRMED** |
| `student_profiles` | `ck_student_profiles_enrollment_status` | `(`enrollment_status` in (_utf8mb4\'enrolled\',_utf8mb4\'graduated\',_utf8mb4\'leave_of_absence\',_utf8mb4\'withdrawn\',_utf8mb4\'dropped\'))` | **CONFIRMED** |
