# AchieveNest — Local Database Functional Dependencies Master Catalog

> **Database:** `achievenest_local`  
> **Coverage:** All 64 Relational Base Tables  

---

### Table: `academic_programs`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { college_id, code, name, degree_level, status, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { college_id, code, name, degree_level, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `account_lifecycle_events`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { profile_id, actor_profile_id, event_type, previous_status, new_status, reason, metadata, occurred_at }`
- **Normalization Conclusion**: **PASS**

### Table: `administrative_units`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { code, name, unit_type, college_id, description, status, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { code, name, unit_type, college_id, description, status, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`name`)**: `(name) -> { code, name, unit_type, college_id, description, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `attendance_records`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { session_id, attendee_profile_id, scanned_by, checked_in_at, verification_method }`
- **Candidate Key / Unique Constraint (`uq_session_attendee`)**: `(session_id, attendee_profile_id) -> { session_id, attendee_profile_id, scanned_by, checked_in_at, verification_method }`
- **Normalization Conclusion**: **PASS**

### Table: `attendance_sessions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { event_id, session_name, session_type, check_in_start, check_in_end, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `audit_logs`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { actor_profile_id, event_code, category, target_type, target_id, outcome, ip_address, user_agent, details, safe_context, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_candidate_manual_decisions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { cycle_id, award_definition_id, student_profile_id, decision_type, reason, decided_by, previous_status, new_status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_criteria`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { award_definition_id, scoring_model_version_id, code, name, weight, max_points, sort_order, is_portfolio_computable, authority_status, source_rubric_reference, is_published, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`uq_award_criterion_code`)**: `(award_definition_id, code) -> { award_definition_id, scoring_model_version_id, code, name, weight, max_points, sort_order, is_portfolio_computable, authority_status, source_rubric_reference, is_published, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_criterion_components`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { criterion_id, code, name, description, max_points, sort_order, is_computable, authority_status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_cycles`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { code, academic_year, name, semester, start_date, end_date, candidate_threshold, status, opens_at, closes_at, created_by, created_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { code, academic_year, name, semester, start_date, end_date, candidate_threshold, status, opens_at, closes_at, created_by, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_definitions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { code, name, category, description, candidate_threshold_percent, gender_restriction, graduating_only, status, authority_status, source_fidelity_status, is_catalog_visible, active_scoring_version, metadata, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { code, name, category, description, candidate_threshold_percent, gender_restriction, graduating_only, status, authority_status, source_fidelity_status, is_catalog_visible, active_scoring_version, metadata, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`name`)**: `(name) -> { code, name, category, description, candidate_threshold_percent, gender_restriction, graduating_only, status, authority_status, source_fidelity_status, is_catalog_visible, active_scoring_version, metadata, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_evaluation_summary_reports`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { cycle_id, award_definition_id, college_id, generated_by, report_payload, total_evaluated, potential_candidates_count, generated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_evidence_mapping_conditions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { mapping_rule_id, field_key, operator, comparison_value, group_number, display_order, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_evidence_mapping_rules`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { scoring_model_version_id, criterion_id, criterion_component_id, rule_code, name, description, portfolio_category_id, portfolio_subcategory_id, authority_status, priority, is_active, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_interview_eligibilities`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { cycle_id, award_definition_id, student_profile_id, eligibility_source, pathway, evaluation_id, dean_nomination_id, potential_score, eligible_at, status, revoked_at, revoked_by, revocation_reason }`
- **Candidate Key / Unique Constraint (`uq_cycle_award_student_source`)**: `(cycle_id, award_definition_id, student_profile_id, eligibility_source) -> { cycle_id, award_definition_id, student_profile_id, eligibility_source, pathway, evaluation_id, dean_nomination_id, potential_score, eligible_at, status, revoked_at, revoked_by, revocation_reason }`
- **Normalization Conclusion**: **PASS**

### Table: `award_portfolio_mappings`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { scoring_rule_id, portfolio_category_id, portfolio_subcategory_id, metadata_predicate, is_active, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_scoring_model_versions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { award_definition_id, award_cycle_id, version_number, version_label, status, candidate_threshold_percent, graduating_only, gender_requirement, authority_status, published_at, published_by, retired_at, retired_by, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_scoring_rules`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { criterion_id, scoring_model_version_id, criterion_component_id, parent_rule_id, code, name, rule_type, points, max_points, rule_config, authority_status, is_active, sort_order, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`uq_criterion_rule_code`)**: `(criterion_id, code) -> { criterion_id, scoring_model_version_id, criterion_component_id, parent_rule_id, code, name, rule_type, points, max_points, rule_config, authority_status, is_active, sort_order, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `award_student_evaluation_summaries`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { evaluation_id, student_profile_id, award_definition_id, cycle_id, scoring_model_version_id, summary_payload, raw_score, max_computable_score, potential_score, candidate_threshold_percent, qualifies_portfolio_based, candidate_pathway, generated_by, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`uq_ases_eval`)**: `(evaluation_id) -> { evaluation_id, student_profile_id, award_definition_id, cycle_id, scoring_model_version_id, summary_payload, raw_score, max_computable_score, potential_score, candidate_threshold_percent, qualifies_portfolio_based, candidate_pathway, generated_by, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `certificate_issuance_batches`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { event_id, template_version_id, issuer_profile_id, batch_name, issued_count, status, issued_at }`
- **Normalization Conclusion**: **PASS**

### Table: `certificate_template_families`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { code, name, description, category, status, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { code, name, description, category, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `certificate_template_versions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { family_id, version_number, layout_config, signatories_config, background_storage_path, status, created_at }`
- **Candidate Key / Unique Constraint (`uq_family_version`)**: `(family_id, version_number) -> { family_id, version_number, layout_config, signatories_config, background_storage_path, status, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `colleges`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { code, name, description, status, logo_storage_key, logo_original_name, logo_mime_type, logo_updated_at, acronym_badge_color, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { code, name, description, status, logo_storage_key, logo_original_name, logo_mime_type, logo_updated_at, acronym_badge_color, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `dean_assignments`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, college_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_college_dean_guard, active_personnel_dean_guard }`
- **Candidate Key / Unique Constraint (`uq_active_college_dean`)**: `(active_college_dean_guard) -> { personnel_profile_id, college_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_college_dean_guard, active_personnel_dean_guard }`
- **Candidate Key / Unique Constraint (`uq_active_personnel_dean`)**: `(active_personnel_dean_guard) -> { personnel_profile_id, college_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_college_dean_guard, active_personnel_dean_guard }`
- **Normalization Conclusion**: **PASS**

### Table: `dean_student_nominations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { cycle_id, award_definition_id, student_profile_id, dean_assignment_id, dean_profile_id, college_id, justification, status, nominated_at, withdrawn_at, withdrawal_reason }`
- **Normalization Conclusion**: **PASS**

### Table: `events`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { organizer_profile_id, organization_id, college_id, administrative_unit_id, title, description, event_type, start_time, end_time, venue, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `file_security_audit_events`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { actor_profile_id, evidence_domain, evidence_id, storage_bucket, storage_path, detected_mime_type, byte_size, sha256, scanner, result, details, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `issued_certificates`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { batch_id, recipient_profile_id, certificate_code, render_payload, storage_path, status, issued_at, revoked_at, revocation_reason }`
- **Candidate Key / Unique Constraint (`certificate_code`)**: `(certificate_code) -> { batch_id, recipient_profile_id, certificate_code, render_payload, storage_path, status, issued_at, revoked_at, revocation_reason }`
- **Normalization Conclusion**: **PASS**

### Table: `local_auth_credentials`
- **Primary Key**: `(profile_id)`
- **Primary Functional Dependency**:
  `(profile_id) -> { password_hash, password_changed_at, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `local_auth_sessions`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { profile_id, token_hash, issued_at, expires_at, last_seen_at, revoked_at, revocation_reason, created_ip, user_agent_hash }`
- **Candidate Key / Unique Constraint (`token_hash`)**: `(token_hash) -> { profile_id, token_hash, issued_at, expires_at, last_seen_at, revoked_at, revocation_reason, created_ip, user_agent_hash }`
- **Normalization Conclusion**: **PASS**

### Table: `migrations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { version, class, group, namespace, time, batch }`
- **Normalization Conclusion**: **PASS**

### Table: `notification_preferences`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { profile_id, category, email_enabled, in_app_enabled, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`uq_profile_notif_category`)**: `(profile_id, category) -> { profile_id, category, email_enabled, in_app_enabled, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `notifications`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { recipient_profile_id, actor_profile_id, notification_type, title, message, reference_type, reference_id, is_mandatory, read_at, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `organization_moderator_assignments`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { organization_id, personnel_profile_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_org_moderator_guard }`
- **Candidate Key / Unique Constraint (`uq_active_org_moderator`)**: `(active_org_moderator_guard) -> { organization_id, personnel_profile_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_org_moderator_guard }`
- **Normalization Conclusion**: **PASS**

### Table: `organization_program_affiliations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { organization_id, academic_program_id, created_at }`
- **Candidate Key / Unique Constraint (`uq_org_program`)**: `(organization_id, academic_program_id) -> { organization_id, academic_program_id, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `organizations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { college_id, code, name, scope, category, status, logo_storage_key, logo_original_name, logo_mime_type, logo_updated_at, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { college_id, code, name, scope, category, status, logo_storage_key, logo_original_name, logo_mime_type, logo_updated_at, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `password_reset_requests`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { institutional_email, reason, status, ip_address, user_agent, processed_by, processed_at, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_accomplishment_evidence`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { accomplishment_id, storage_path, original_filename, mime_type, detected_mime_type, byte_size, checksum, sha256, uploaded_by, uploaded_at, security_status, malware_scanner, security_validated_at, status }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_accomplishments`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, domain, title, organizer_or_publisher, occurrence_date, description, claimed_points, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_administrative_unit_affiliations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, administrative_unit_id, effective_from, effective_until, is_active, created_at, updated_at, active_personnel_unit_guard }`
- **Candidate Key / Unique Constraint (`uq_active_personnel_admin_unit`)**: `(active_personnel_unit_guard) -> { personnel_profile_id, administrative_unit_id, effective_from, effective_until, is_active, created_at, updated_at, active_personnel_unit_guard }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_college_affiliations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, college_id, effective_from, effective_until, is_active, created_at, updated_at, active_personnel_guard }`
- **Candidate Key / Unique Constraint (`uq_active_personnel_college`)**: `(active_personnel_guard) -> { personnel_profile_id, college_id, effective_from, effective_until, is_active, created_at, updated_at, active_personnel_guard }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_evaluation_deficiency_requests`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { evaluation_id, item_id, requested_by, deficiency_description, status, response_text, responded_at, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_evaluation_events`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { evaluation_id, actor_profile_id, action, previous_status, new_status, remarks, occurred_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_evaluation_items`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { evaluation_id, accomplishment_id, domain, item_description, claimed_points, verified_points, remarks, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_evaluation_reports`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { evaluation_id, generated_by, report_payload, summary_score, passing_status, generated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_evaluations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, evaluator_profile_id, academic_year, semester, score_professional_development, score_productivity_creative_work, score_service_leadership, total_score, passing_status, status, finalized_at, finalized_by, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_profiles`
- **Primary Key**: `(profile_id)`
- **Primary Functional Dependency**:
  `(profile_id) -> { personnel_classification, employment_status, rank_level, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_program_affiliations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, academic_program_id, effective_from, effective_until, is_active, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `personnel_qualification_reviews`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, reviewer_profile_id, qualification_status, remarks, reviewed_at }`
- **Normalization Conclusion**: **PASS**

### Table: `portfolio_categories`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { code, name, description, sort_order, status, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`code`)**: `(code) -> { code, name, description, sort_order, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `portfolio_subcategories`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { category_id, code, name, description, metadata_requirements, sort_order, status, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`uq_cat_subcat_code`)**: `(category_id, code) -> { category_id, code, name, description, metadata_requirements, sort_order, status, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `profile_roles`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { profile_id, role_id, scope_type, scope_id, is_active, assigned_at, assigned_by }`
- **Normalization Conclusion**: **PASS**

### Table: `profiles`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { institutional_id, account_type, email, full_name, first_name, middle_name, last_name, designation_title, avatar_url, status, must_change_password, password_hash, created_at, updated_at, active_hr_guard }`
- **Candidate Key / Unique Constraint (`email`)**: `(email) -> { institutional_id, account_type, email, full_name, first_name, middle_name, last_name, designation_title, avatar_url, status, must_change_password, password_hash, created_at, updated_at, active_hr_guard }`
- **Candidate Key / Unique Constraint (`institutional_id`)**: `(institutional_id) -> { institutional_id, account_type, email, full_name, first_name, middle_name, last_name, designation_title, avatar_url, status, must_change_password, password_hash, created_at, updated_at, active_hr_guard }`
- **Candidate Key / Unique Constraint (`uq_profiles_one_active_hr_admin`)**: `(active_hr_guard) -> { institutional_id, account_type, email, full_name, first_name, middle_name, last_name, designation_title, avatar_url, status, must_change_password, password_hash, created_at, updated_at, active_hr_guard }`
- **Derived Dependency**: `(first_name, middle_name, last_name) -> full_name` (Search Index Cache)
- **Normalization Conclusion**: **PASS — JUSTIFIED DENORMALIZATION**

### Table: `program_coordinator_assignments`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { personnel_profile_id, academic_program_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_program_coord_guard }`
- **Candidate Key / Unique Constraint (`uq_active_program_coordinator`)**: `(active_program_coord_guard) -> { personnel_profile_id, academic_program_id, effective_from, effective_until, is_active, assigned_by, assigned_at, created_at, updated_at, active_program_coord_guard }`
- **Normalization Conclusion**: **PASS**

### Table: `role_assignment_events`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { actor_profile_id, target_profile_id, assignment_type, role_or_scope_id, action, metadata, occurred_at }`
- **Normalization Conclusion**: **PASS**

### Table: `roles`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { role_key, display_name, description, is_system_role, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`role_key`)**: `(role_key) -> { role_key, display_name, description, is_system_role, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `student_award_criterion_scores`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { evaluation_id, criterion_id, awarded_points, max_points, scoring_snapshot, evaluator_remarks, created_at, updated_at }`
- **Candidate Key / Unique Constraint (`uq_eval_criterion`)**: `(evaluation_id, criterion_id) -> { evaluation_id, criterion_id, awarded_points, max_points, scoring_snapshot, evaluator_remarks, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `student_award_evaluations`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { cycle_id, award_definition_id, student_profile_id, evaluator_profile_id, status, raw_score, max_computable_score, potential_score, qualifies_portfolio_based, candidate_status, candidate_classified_at, evaluated_at, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `student_award_score_evidence`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { criterion_score_id, portfolio_record_id, scoring_rule_id, points_effect, basis_snapshot, created_at }`
- **Candidate Key / Unique Constraint (`uq_critscore_portrec`)**: `(criterion_score_id, portfolio_record_id) -> { criterion_score_id, portfolio_record_id, scoring_rule_id, points_effect, basis_snapshot, created_at }`
- **Normalization Conclusion**: **PASS**

### Table: `student_portfolio_evidence`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { portfolio_record_id, storage_path, original_filename, mime_type, detected_mime_type, byte_size, checksum, sha256, evidence_type, uploaded_by, uploaded_at, security_status, malware_scanner, security_validated_at, status }`
- **Normalization Conclusion**: **PASS**

### Table: `student_portfolio_records`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { student_profile_id, category_id, subcategory_id, title, organizer_or_body, occurrence_date, start_date, end_date, description, structured_metadata, status, submitted_at, verified_at, created_at, updated_at }`
- **Normalization Conclusion**: **PASS**

### Table: `student_portfolio_verification_events`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { portfolio_record_id, actor_profile_id, action, previous_status, new_status, remarks, occurred_at }`
- **Normalization Conclusion**: **PASS**

### Table: `student_profiles`
- **Primary Key**: `(profile_id)`
- **Primary Functional Dependency**:
  `(profile_id) -> { year_level, enrollment_status, created_at, updated_at }`
- **Derived Dependency**: `year_level` (Cached active year level from active enrollment)
- **Normalization Conclusion**: **PASS — JUSTIFIED DENORMALIZATION**

### Table: `student_program_enrollments`
- **Primary Key**: `(id)`
- **Primary Functional Dependency**:
  `(id) -> { student_profile_id, academic_program_id, year_level, academic_year, effective_from, effective_until, is_active, created_at, updated_at, active_student_guard }`
- **Candidate Key / Unique Constraint (`uq_active_student_enrollment`)**: `(active_student_guard) -> { student_profile_id, academic_program_id, year_level, academic_year, effective_from, effective_until, is_active, created_at, updated_at, active_student_guard }`
- **Normalization Conclusion**: **PASS**

