/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_programs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `degree_level` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'undergraduate',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_academic_programs_college` (`college_id`),
  CONSTRAINT `fk_academic_programs_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_academic_programs_degree_level` CHECK ((`degree_level` in (_utf8mb4'undergraduate',_utf8mb4'graduate',_utf8mb4'certificate',_utf8mb4'diploma'))),
  CONSTRAINT `ck_academic_programs_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_lifecycle_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `occurred_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_account_lifecycle_profile` (`profile_id`),
  KEY `fk_account_lifecycle_actor` (`actor_profile_id`),
  CONSTRAINT `fk_account_lifecycle_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_account_lifecycle_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `administrative_units` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'central_office',
  `college_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `name` (`name`),
  KEY `idx_administrative_units_college` (`college_id`),
  CONSTRAINT `fk_administrative_units_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_administrative_units_college_scope` CHECK ((((`unit_type` = _utf8mb4'college_based_office') and (`college_id` is not null)) or ((`unit_type` <> _utf8mb4'college_based_office') and (`college_id` is null)))),
  CONSTRAINT `ck_administrative_units_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived'))),
  CONSTRAINT `ck_administrative_units_unit_type` CHECK ((`unit_type` in (_utf8mb4'central_office',_utf8mb4'college_based_office',_utf8mb4'other')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_records` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `attendee_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `checked_in_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `verification_method` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'qr_scan',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_session_attendee` (`session_id`,`attendee_profile_id`),
  KEY `fk_attendance_records_scanner` (`scanned_by`),
  KEY `idx_attendance_records_attendee` (`attendee_profile_id`),
  CONSTRAINT `fk_attendance_records_attendee` FOREIGN KEY (`attendee_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_records_scanner` FOREIGN KEY (`scanned_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_attendance_records_session` FOREIGN KEY (`session_id`) REFERENCES `attendance_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_attendance_records_method` CHECK ((`verification_method` in (_utf8mb4'qr_scan',_utf8mb4'manual',_utf8mb4'self_checkin')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'general',
  `check_in_start` datetime(6) NOT NULL,
  `check_in_end` datetime(6) NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_attendance_sessions_event` (`event_id`),
  CONSTRAINT `fk_attendance_sessions_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_attendance_sessions_status` CHECK ((`status` in (_utf8mb4'scheduled',_utf8mb4'open',_utf8mb4'closed'))),
  CONSTRAINT `ck_attendance_sessions_type` CHECK ((`session_type` in (_utf8mb4'general',_utf8mb4'morning',_utf8mb4'afternoon',_utf8mb4'breakout')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outcome` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `details` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `safe_context` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_actor` (`actor_profile_id`),
  KEY `idx_audit_logs_event_code` (`event_code`),
  KEY `idx_audit_logs_created_at` (`created_at`),
  CONSTRAINT `fk_audit_logs_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_audit_logs_outcome` CHECK ((`outcome` in (_utf8mb4'success',_utf8mb4'failure',_utf8mb4'denied')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_candidate_manual_decisions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `decision_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `decided_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_acmd_cycle` (`cycle_id`),
  KEY `idx_acmd_award` (`award_definition_id`),
  KEY `idx_acmd_student` (`student_profile_id`),
  KEY `idx_acmd_decided_by` (`decided_by`),
  CONSTRAINT `fk_acmd_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_acmd_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_acmd_decided_by` FOREIGN KEY (`decided_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_acmd_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_criteria` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scoring_model_version_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `weight` decimal(5,2) NOT NULL DEFAULT '100.00',
  `max_points` decimal(10,2) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '1',
  `is_portfolio_computable` tinyint(1) NOT NULL DEFAULT '1',
  `authority_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFICIAL',
  `source_rubric_reference` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_published` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_award_criterion_code` (`award_definition_id`,`code`),
  KEY `idx_award_criteria_award` (`award_definition_id`),
  CONSTRAINT `fk_award_criteria_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_award_criteria_max_points` CHECK ((`max_points` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_criterion_components` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `max_points` decimal(10,2) NOT NULL,
  `sort_order` int NOT NULL DEFAULT '1',
  `is_computable` tinyint(1) NOT NULL DEFAULT '1',
  `authority_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFICIAL',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_acc_criterion` (`criterion_id`),
  CONSTRAINT `fk_acc_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_cycles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2nd Semester',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `candidate_threshold` decimal(5,2) NOT NULL DEFAULT '80.00',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `opens_at` datetime(6) DEFAULT NULL,
  `closes_at` datetime(6) DEFAULT NULL,
  `created_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `fk_award_cycles_creator` (`created_by`),
  CONSTRAINT `fk_award_cycles_creator` FOREIGN KEY (`created_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_award_cycles_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'evaluating',_utf8mb4'active',_utf8mb4'evaluation_closed',_utf8mb4'finalized',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_definitions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'leadership',
  `description` text COLLATE utf8mb4_unicode_ci,
  `candidate_threshold_percent` decimal(5,2) NOT NULL DEFAULT '80.00',
  `gender_restriction` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `graduating_only` tinyint(1) NOT NULL DEFAULT '1',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `authority_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFICIAL',
  `source_fidelity_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING_RECONCILIATION',
  `is_catalog_visible` tinyint(1) NOT NULL DEFAULT '1',
  `active_scoring_version` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0',
  `metadata` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  UNIQUE KEY `name` (`name`),
  CONSTRAINT `ck_award_definitions_gender` CHECK (((`gender_restriction` is null) or (`gender_restriction` in (_utf8mb4'male',_utf8mb4'female')))),
  CONSTRAINT `ck_award_definitions_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'active',_utf8mb4'archived'))),
  CONSTRAINT `ck_award_definitions_threshold` CHECK (((`candidate_threshold_percent` >= 0.00) and (`candidate_threshold_percent` <= 100.00)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_evaluation_summary_reports` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `generated_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_payload` json NOT NULL,
  `total_evaluated` int NOT NULL DEFAULT '0',
  `potential_candidates_count` int NOT NULL DEFAULT '0',
  `generated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_summary_reports_cycle` (`cycle_id`),
  KEY `fk_summary_reports_award` (`award_definition_id`),
  KEY `fk_summary_reports_college` (`college_id`),
  KEY `fk_summary_reports_generator` (`generated_by`),
  CONSTRAINT `fk_summary_reports_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_summary_reports_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_summary_reports_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_summary_reports_generator` FOREIGN KEY (`generated_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_evidence_mapping_conditions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mapping_rule_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `field_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'EQ',
  `comparison_value` text COLLATE utf8mb4_unicode_ci,
  `group_number` int NOT NULL DEFAULT '1',
  `display_order` int NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_aemc_rule` (`mapping_rule_id`),
  KEY `idx_aemc_field` (`field_key`),
  CONSTRAINT `fk_aemc_rule` FOREIGN KEY (`mapping_rule_id`) REFERENCES `award_evidence_mapping_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_evidence_mapping_rules` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scoring_model_version_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_component_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rule_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `portfolio_category_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `portfolio_subcategory_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authority_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFICIAL',
  `priority` int NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_aemr_version` (`scoring_model_version_id`),
  KEY `idx_aemr_criterion` (`criterion_id`),
  KEY `idx_aemr_component` (`criterion_component_id`),
  KEY `idx_aemr_category` (`portfolio_category_id`),
  KEY `idx_aemr_subcategory` (`portfolio_subcategory_id`),
  KEY `idx_aemr_active` (`is_active`),
  CONSTRAINT `fk_aemr_category` FOREIGN KEY (`portfolio_category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_aemr_component` FOREIGN KEY (`criterion_component_id`) REFERENCES `award_criterion_components` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_aemr_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_aemr_version` FOREIGN KEY (`scoring_model_version_id`) REFERENCES `award_scoring_model_versions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_interview_eligibilities` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `eligibility_source` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `pathway` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'automated_threshold',
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dean_nomination_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `potential_score` decimal(5,2) DEFAULT NULL,
  `eligible_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'eligible',
  `revoked_at` datetime(6) DEFAULT NULL,
  `revoked_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `revocation_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cycle_award_student_source` (`cycle_id`,`award_definition_id`,`student_profile_id`,`eligibility_source`),
  KEY `fk_interview_eligibility_award` (`award_definition_id`),
  KEY `fk_interview_eligibility_evaluation` (`evaluation_id`),
  KEY `fk_interview_eligibility_nomination` (`dean_nomination_id`),
  KEY `fk_interview_eligibility_revoker` (`revoked_by`),
  KEY `idx_interview_eligibility_student` (`student_profile_id`),
  CONSTRAINT `fk_interview_eligibility_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_interview_eligibility_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_interview_eligibility_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `student_award_evaluations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_interview_eligibility_nomination` FOREIGN KEY (`dean_nomination_id`) REFERENCES `dean_student_nominations` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_interview_eligibility_revoker` FOREIGN KEY (`revoked_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_interview_eligibility_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_award_eligibility_source_reference` CHECK ((((`eligibility_source` = _utf8mb4'portfolio_based') and (`evaluation_id` is not null) and (`dean_nomination_id` is null)) or ((`eligibility_source` = _utf8mb4'dean_nomination') and (`dean_nomination_id` is not null) and (`evaluation_id` is null)))),
  CONSTRAINT `ck_interview_eligibility_pathway` CHECK ((`pathway` in (_utf8mb4'automated_threshold',_utf8mb4'dean_nomination',_utf8mb4'both'))),
  CONSTRAINT `ck_interview_eligibility_score` CHECK (((`potential_score` is null) or ((`potential_score` >= 0.00) and (`potential_score` <= 100.00)))),
  CONSTRAINT `ck_interview_eligibility_source` CHECK ((`eligibility_source` in (_utf8mb4'portfolio_based',_utf8mb4'dean_nomination'))),
  CONSTRAINT `ck_interview_eligibility_status` CHECK ((`status` in (_utf8mb4'eligible',_utf8mb4'scheduled',_utf8mb4'completed',_utf8mb4'withdrawn',_utf8mb4'revoked')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_portfolio_mappings` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scoring_rule_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `portfolio_category_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `portfolio_subcategory_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata_predicate` json DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_award_mappings_category` (`portfolio_category_id`),
  KEY `fk_award_mappings_subcategory` (`portfolio_subcategory_id`),
  KEY `idx_award_mappings_rule` (`scoring_rule_id`),
  CONSTRAINT `fk_award_mappings_category` FOREIGN KEY (`portfolio_category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_award_mappings_rule` FOREIGN KEY (`scoring_rule_id`) REFERENCES `award_scoring_rules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_award_mappings_subcategory` FOREIGN KEY (`portfolio_subcategory_id`) REFERENCES `portfolio_subcategories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_scoring_model_versions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_cycle_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `version_number` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1.0',
  `version_label` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `candidate_threshold_percent` decimal(5,2) NOT NULL DEFAULT '80.00',
  `graduating_only` tinyint(1) NOT NULL DEFAULT '1',
  `gender_requirement` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authority_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFICIAL',
  `published_at` datetime(6) DEFAULT NULL,
  `published_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `retired_at` datetime(6) DEFAULT NULL,
  `retired_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_asmv_award` (`award_definition_id`),
  KEY `idx_asmv_cycle` (`award_cycle_id`),
  KEY `idx_asmv_status` (`status`),
  CONSTRAINT `fk_asmv_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_asmv_cycle` FOREIGN KEY (`award_cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_scoring_rules` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scoring_model_version_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `criterion_component_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_rule_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rule_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `points` decimal(10,2) DEFAULT NULL,
  `max_points` decimal(10,2) DEFAULT NULL,
  `rule_config` json DEFAULT NULL,
  `authority_status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OFFICIAL',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_criterion_rule_code` (`criterion_id`,`code`),
  KEY `fk_scoring_rules_parent` (`parent_rule_id`),
  KEY `idx_award_scoring_rules_criterion` (`criterion_id`),
  KEY `idx_asr_version` (`scoring_model_version_id`),
  KEY `idx_asr_component` (`criterion_component_id`),
  KEY `idx_asr_active` (`is_active`),
  CONSTRAINT `fk_scoring_rules_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_scoring_rules_parent` FOREIGN KEY (`parent_rule_id`) REFERENCES `award_scoring_rules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_scoring_rules_max_points` CHECK (((`max_points` is null) or (`max_points` >= 0.00))),
  CONSTRAINT `ck_scoring_rules_type` CHECK ((`rule_type` in (_utf8mb4'highest_only',_utf8mb4'sum_capped',_utf8mb4'count_mapping',_utf8mb4'fixed_presence',_utf8mb4'matrix_mapping',_utf8mb4'formula',_utf8mb4'other_configured')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `award_student_evaluation_summaries` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scoring_model_version_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `summary_payload` json NOT NULL,
  `raw_score` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_computable_score` decimal(10,2) NOT NULL DEFAULT '100.00',
  `potential_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `candidate_threshold_percent` decimal(5,2) NOT NULL DEFAULT '80.00',
  `qualifies_portfolio_based` tinyint(1) NOT NULL DEFAULT '0',
  `candidate_pathway` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'automatic_portfolio',
  `generated_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ases_eval` (`evaluation_id`),
  KEY `idx_ases_student` (`student_profile_id`),
  KEY `idx_ases_award` (`award_definition_id`),
  KEY `idx_ases_cycle` (`cycle_id`),
  KEY `idx_ases_version` (`scoring_model_version_id`),
  CONSTRAINT `fk_ases_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ases_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ases_eval` FOREIGN KEY (`evaluation_id`) REFERENCES `student_award_evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ases_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_issuance_batches` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `event_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `template_version_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issuer_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issued_count` int NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `issued_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_issuance_batches_event` (`event_id`),
  KEY `fk_issuance_batches_template` (`template_version_id`),
  KEY `fk_issuance_batches_issuer` (`issuer_profile_id`),
  CONSTRAINT `fk_issuance_batches_event` FOREIGN KEY (`event_id`) REFERENCES `events` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_issuance_batches_issuer` FOREIGN KEY (`issuer_profile_id`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_issuance_batches_template` FOREIGN KEY (`template_version_id`) REFERENCES `certificate_template_versions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_issuance_batches_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'processing',_utf8mb4'completed',_utf8mb4'failed')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_template_families` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `ck_template_families_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `certificate_template_versions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `family_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version_number` int NOT NULL,
  `layout_config` json NOT NULL,
  `signatories_config` json NOT NULL,
  `background_storage_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_family_version` (`family_id`,`version_number`),
  CONSTRAINT `fk_template_versions_family` FOREIGN KEY (`family_id`) REFERENCES `certificate_template_families` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_template_versions_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'active',_utf8mb4'deprecated')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `colleges` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `logo_storage_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_updated_at` datetime(6) DEFAULT NULL,
  `acronym_badge_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `ck_colleges_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dean_assignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_college_dean_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `college_id` else NULL end)) VIRTUAL,
  `active_personnel_dean_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `personnel_profile_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_college_dean` (`active_college_dean_guard`),
  UNIQUE KEY `uq_active_personnel_dean` (`active_personnel_dean_guard`),
  KEY `fk_dean_assign_assigner` (`assigned_by`),
  KEY `idx_dean_assignments_personnel` (`personnel_profile_id`),
  KEY `idx_dean_assignments_college` (`college_id`),
  CONSTRAINT `fk_dean_assign_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_dean_assign_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dean_assign_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dean_student_nominations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `dean_assignment_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dean_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `justification` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `nominated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `withdrawn_at` datetime(6) DEFAULT NULL,
  `withdrawal_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_dean_nominations_award` (`award_definition_id`),
  KEY `fk_dean_nominations_dean_assignment` (`dean_assignment_id`),
  KEY `fk_dean_nominations_dean_profile` (`dean_profile_id`),
  KEY `fk_dean_nominations_college` (`college_id`),
  KEY `idx_dean_nominations_cycle_award` (`cycle_id`,`award_definition_id`),
  KEY `idx_dean_nominations_student` (`student_profile_id`),
  CONSTRAINT `fk_dean_nominations_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dean_nominations_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dean_nominations_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_dean_nominations_dean_assignment` FOREIGN KEY (`dean_assignment_id`) REFERENCES `dean_assignments` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dean_nominations_dean_profile` FOREIGN KEY (`dean_profile_id`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_dean_nominations_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_dean_nominations_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'endorsed',_utf8mb4'withdrawn',_utf8mb4'revoked')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organizer_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `organization_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `administrative_unit_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `event_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` datetime(6) NOT NULL,
  `end_time` datetime(6) NOT NULL,
  `venue` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'published',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_events_organization` (`organization_id`),
  KEY `fk_events_college` (`college_id`),
  KEY `fk_events_admin_unit` (`administrative_unit_id`),
  KEY `idx_events_organizer` (`organizer_profile_id`),
  KEY `idx_events_status` (`status`),
  KEY `idx_events_start_time` (`start_time`),
  CONSTRAINT `fk_events_admin_unit` FOREIGN KEY (`administrative_unit_id`) REFERENCES `administrative_units` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_organization` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_events_organizer` FOREIGN KEY (`organizer_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_events_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'published',_utf8mb4'ongoing',_utf8mb4'completed',_utf8mb4'cancelled')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `file_security_audit_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evidence_domain` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evidence_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_bucket` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detected_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `byte_size` bigint NOT NULL,
  `sha256` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scanner` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `result` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_file_security_actor` (`actor_profile_id`),
  KEY `idx_file_security_evidence` (`evidence_domain`,`evidence_id`),
  CONSTRAINT `fk_file_security_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_file_security_byte_size` CHECK ((`byte_size` > 0)),
  CONSTRAINT `ck_file_security_domain` CHECK ((`evidence_domain` in (_utf8mb4'student_portfolio',_utf8mb4'personnel_accomplishment'))),
  CONSTRAINT `ck_file_security_result` CHECK ((`result` in (_utf8mb4'clean',_utf8mb4'rejected',_utf8mb4'scan_error')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `issued_certificates` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `render_payload` json NOT NULL,
  `storage_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valid',
  `issued_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `revoked_at` datetime(6) DEFAULT NULL,
  `revocation_reason` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `certificate_code` (`certificate_code`),
  KEY `fk_issued_certificates_batch` (`batch_id`),
  KEY `idx_issued_certificates_recipient` (`recipient_profile_id`),
  KEY `idx_issued_certificates_code` (`certificate_code`),
  CONSTRAINT `fk_issued_certificates_batch` FOREIGN KEY (`batch_id`) REFERENCES `certificate_issuance_batches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_issued_certificates_recipient` FOREIGN KEY (`recipient_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_issued_certificates_status` CHECK ((`status` in (_utf8mb4'valid',_utf8mb4'revoked',_utf8mb4'expired')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `local_auth_credentials` (
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_changed_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`profile_id`),
  CONSTRAINT `fk_local_auth_credentials_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_local_auth_credentials_status` CHECK ((`status` in (_cp850'active',_cp850'disabled',_cp850'locked')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `local_auth_sessions` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token_hash` char(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `issued_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `expires_at` datetime(6) NOT NULL,
  `last_seen_at` datetime(6) DEFAULT NULL,
  `revoked_at` datetime(6) DEFAULT NULL,
  `revocation_reason` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent_hash` char(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `idx_local_auth_sessions_profile` (`profile_id`),
  KEY `idx_local_auth_sessions_revoked` (`revoked_at`),
  KEY `idx_local_auth_sessions_expires` (`expires_at`),
  CONSTRAINT `fk_local_auth_sessions_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `in_app_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_profile_notif_category` (`profile_id`,`category`),
  CONSTRAINT `fk_notif_prefs_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `recipient_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notification_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_mandatory` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_notifications_actor` (`actor_profile_id`),
  KEY `idx_notifications_recipient` (`recipient_profile_id`,`read_at`),
  CONSTRAINT `fk_notifications_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_notifications_recipient` FOREIGN KEY (`recipient_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_moderator_assignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_org_moderator_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `organization_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_org_moderator` (`active_org_moderator_guard`),
  KEY `fk_org_mod_assigner` (`assigned_by`),
  KEY `idx_org_mod_personnel` (`personnel_profile_id`),
  KEY `idx_org_mod_organization` (`organization_id`),
  CONSTRAINT `fk_org_mod_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_org_mod_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_org_mod_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organization_program_affiliations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organization_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_program_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_org_program` (`organization_id`,`academic_program_id`),
  KEY `fk_org_prog_program` (`academic_program_id`),
  CONSTRAINT `fk_org_prog_org` FOREIGN KEY (`organization_id`) REFERENCES `organizations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_org_prog_program` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `code` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `logo_storage_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_original_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logo_updated_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_organizations_college` (`college_id`),
  CONSTRAINT `fk_organizations_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_organizations_category` CHECK ((`category` in (_utf8mb4'academic_college',_utf8mb4'co_curricular',_utf8mb4'special_interest',_utf8mb4'socio_cultural',_utf8mb4'religious',_utf8mb4'sports',_utf8mb4'student_council'))),
  CONSTRAINT `ck_organizations_scope` CHECK ((`scope` in (_utf8mb4'university',_utf8mb4'college',_utf8mb4'program'))),
  CONSTRAINT `ck_organizations_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_requests` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institutional_email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `processed_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `processed_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_password_resets_processor` (`processed_by`),
  CONSTRAINT `fk_password_resets_processor` FOREIGN KEY (`processed_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `ck_password_resets_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'approved',_utf8mb4'rejected',_utf8mb4'completed')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_accomplishment_evidence` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accomplishment_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detected_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `byte_size` bigint NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sha256` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `security_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'clean',
  `malware_scanner` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'backend_clamav_v1',
  `security_validated_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `fk_personnel_evidence_accomplishment` (`accomplishment_id`),
  KEY `fk_personnel_evidence_uploader` (`uploaded_by`),
  CONSTRAINT `fk_personnel_evidence_accomplishment` FOREIGN KEY (`accomplishment_id`) REFERENCES `personnel_accomplishments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_personnel_evidence_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_personnel_evidence_byte_size` CHECK ((`byte_size` > 0)),
  CONSTRAINT `ck_personnel_evidence_security_status` CHECK ((`security_status` in (_utf8mb4'pending',_utf8mb4'clean',_utf8mb4'rejected',_utf8mb4'quarantined'))),
  CONSTRAINT `ck_personnel_evidence_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'archived',_utf8mb4'deleted')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_accomplishments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organizer_or_publisher` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occurrence_date` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `claimed_points` decimal(6,2) NOT NULL DEFAULT '0.00',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_personnel_accomplishments_personnel` (`personnel_profile_id`),
  CONSTRAINT `fk_personnel_accomplishments_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_personnel_accomplishments_domain` CHECK ((`domain` in (_utf8mb4'professional_development',_utf8mb4'productivity_creative_work',_utf8mb4'service_leadership'))),
  CONSTRAINT `ck_personnel_accomplishments_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'submitted',_utf8mb4'under_review',_utf8mb4'verified',_utf8mb4'rejected',_utf8mb4'returned')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_administrative_unit_affiliations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `administrative_unit_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_personnel_unit_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `personnel_profile_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_personnel_admin_unit` (`active_personnel_unit_guard`),
  KEY `idx_personnel_unit_personnel` (`personnel_profile_id`),
  KEY `idx_personnel_unit_unit` (`administrative_unit_id`),
  CONSTRAINT `fk_personnel_unit_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_personnel_unit_unit` FOREIGN KEY (`administrative_unit_id`) REFERENCES `administrative_units` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_college_affiliations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `college_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_personnel_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `personnel_profile_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_personnel_college` (`active_personnel_guard`),
  KEY `idx_personnel_college_personnel` (`personnel_profile_id`),
  KEY `idx_personnel_college_college` (`college_id`),
  CONSTRAINT `fk_personnel_college_college` FOREIGN KEY (`college_id`) REFERENCES `colleges` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_personnel_college_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_evaluation_deficiency_requests` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requested_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deficiency_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `response_text` text COLLATE utf8mb4_unicode_ci,
  `responded_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_deficiency_requests_evaluation` (`evaluation_id`),
  KEY `fk_deficiency_requests_item` (`item_id`),
  KEY `fk_deficiency_requests_requester` (`requested_by`),
  CONSTRAINT `fk_deficiency_requests_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `personnel_evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_deficiency_requests_item` FOREIGN KEY (`item_id`) REFERENCES `personnel_evaluation_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_deficiency_requests_requester` FOREIGN KEY (`requested_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_deficiency_requests_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'responded',_utf8mb4'resolved',_utf8mb4'cancelled')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_evaluation_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `occurred_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_evaluation_events_evaluation` (`evaluation_id`),
  KEY `fk_evaluation_events_actor` (`actor_profile_id`),
  CONSTRAINT `fk_evaluation_events_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_evaluation_events_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `personnel_evaluations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_evaluation_items` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `accomplishment_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `domain` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `item_description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `claimed_points` decimal(5,2) NOT NULL DEFAULT '0.00',
  `verified_points` decimal(5,2) NOT NULL DEFAULT '0.00',
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_evaluation_items_evaluation` (`evaluation_id`),
  KEY `fk_evaluation_items_accomplishment` (`accomplishment_id`),
  CONSTRAINT `fk_evaluation_items_accomplishment` FOREIGN KEY (`accomplishment_id`) REFERENCES `personnel_accomplishments` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_evaluation_items_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `personnel_evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_evaluation_items_domain` CHECK ((`domain` in (_utf8mb4'professional_development',_utf8mb4'productivity_creative_work',_utf8mb4'service_leadership')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_evaluation_reports` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generated_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `report_payload` json NOT NULL,
  `summary_score` decimal(6,2) NOT NULL,
  `passing_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `generated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_evaluation_reports_evaluation` (`evaluation_id`),
  KEY `fk_evaluation_reports_generator` (`generated_by`),
  CONSTRAINT `fk_evaluation_reports_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `personnel_evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_evaluation_reports_generator` FOREIGN KEY (`generated_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_evaluations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluator_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `score_professional_development` decimal(5,2) NOT NULL DEFAULT '0.00',
  `score_productivity_creative_work` decimal(5,2) NOT NULL DEFAULT '0.00',
  `score_service_leadership` decimal(5,2) NOT NULL DEFAULT '0.00',
  `total_score` decimal(6,2) NOT NULL DEFAULT '0.00',
  `passing_status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fail',
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `finalized_at` datetime(6) DEFAULT NULL,
  `finalized_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_personnel_evaluations_finalizer` (`finalized_by`),
  KEY `idx_personnel_evaluations_personnel` (`personnel_profile_id`),
  KEY `idx_personnel_evaluations_evaluator` (`evaluator_profile_id`),
  CONSTRAINT `fk_personnel_evaluations_evaluator` FOREIGN KEY (`evaluator_profile_id`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_personnel_evaluations_finalizer` FOREIGN KEY (`finalized_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_personnel_evaluations_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_evaluations_passing_status` CHECK ((`passing_status` in (_utf8mb4'pass',_utf8mb4'fail'))),
  CONSTRAINT `ck_evaluations_score_productivity` CHECK (((`score_productivity_creative_work` >= 0.00) and (`score_productivity_creative_work` <= 50.00))),
  CONSTRAINT `ck_evaluations_score_prof_dev` CHECK (((`score_professional_development` >= 0.00) and (`score_professional_development` <= 70.00))),
  CONSTRAINT `ck_evaluations_score_service` CHECK (((`score_service_leadership` >= 0.00) and (`score_service_leadership` <= 40.00))),
  CONSTRAINT `ck_evaluations_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'in_progress',_utf8mb4'under_review',_utf8mb4'revision_requested',_utf8mb4'ready_for_finalization',_utf8mb4'finalized'))),
  CONSTRAINT `ck_evaluations_total_score` CHECK (((`total_score` >= 0.00) and (`total_score` <= 160.00)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_profiles` (
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_classification` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'academic',
  `employment_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'full_time',
  `rank_level` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`profile_id`),
  CONSTRAINT `fk_personnel_profiles_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_personnel_profiles_classification` CHECK ((`personnel_classification` in (_utf8mb4'academic',_utf8mb4'non_academic'))),
  CONSTRAINT `ck_personnel_profiles_employment_status` CHECK ((`employment_status` in (_utf8mb4'full_time',_utf8mb4'part_time',_utf8mb4'contractual',_utf8mb4'visiting')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_program_affiliations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_program_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_personnel_program_personnel` (`personnel_profile_id`),
  KEY `idx_personnel_program_program` (`academic_program_id`),
  CONSTRAINT `fk_personnel_program_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_personnel_program_program` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personnel_qualification_reviews` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reviewer_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `qualification_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `reviewed_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_qualification_reviews_personnel` (`personnel_profile_id`),
  KEY `fk_qualification_reviews_reviewer` (`reviewer_profile_id`),
  CONSTRAINT `fk_qualification_reviews_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_qualification_reviews_reviewer` FOREIGN KEY (`reviewer_profile_id`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_qualification_reviews_status` CHECK ((`qualification_status` in (_utf8mb4'qualified',_utf8mb4'not_qualified',_utf8mb4'conditional')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portfolio_categories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `ck_portfolio_categories_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `portfolio_subcategories` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `metadata_requirements` json DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cat_subcat_code` (`category_id`,`code`),
  CONSTRAINT `fk_portfolio_subcategories_category` FOREIGN KEY (`category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_portfolio_subcategories_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profile_roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scope_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'university',
  `scope_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_profile_roles_assigner` (`assigned_by`),
  KEY `idx_profile_roles_profile` (`profile_id`),
  KEY `idx_profile_roles_role` (`role_id`),
  KEY `idx_profile_roles_scope` (`scope_type`,`scope_id`),
  CONSTRAINT `fk_profile_roles_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_profile_roles_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_profile_roles_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_profile_roles_scope_type` CHECK ((`scope_type` in (_utf8mb4'university',_utf8mb4'college',_utf8mb4'academic_program',_utf8mb4'administrative_unit',_utf8mb4'organization')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `profiles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `institutional_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_type` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `full_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `middle_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `designation_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `must_change_password` tinyint(1) NOT NULL DEFAULT '1',
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_hr_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when ((`account_type` = _utf8mb4'hr_admin') and (`status` = _utf8mb4'active')) then `id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `institutional_id` (`institutional_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `uq_profiles_one_active_hr_admin` (`active_hr_guard`),
  KEY `idx_profiles_account_type_status` (`account_type`,`status`),
  KEY `idx_profiles_email` (`email`),
  CONSTRAINT `ck_profiles_account_type` CHECK ((`account_type` in (_utf8mb4'student',_utf8mb4'personnel',_utf8mb4'hr_admin',_utf8mb4'osad_admin'))),
  CONSTRAINT `ck_profiles_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'suspended',_utf8mb4'inactive',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_coordinator_assignments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `personnel_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_program_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `assigned_by` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_program_coord_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `academic_program_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_program_coordinator` (`active_program_coord_guard`),
  KEY `fk_prog_coord_assigner` (`assigned_by`),
  KEY `idx_prog_coord_personnel` (`personnel_profile_id`),
  KEY `idx_prog_coord_program` (`academic_program_id`),
  CONSTRAINT `fk_prog_coord_assigner` FOREIGN KEY (`assigned_by`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_prog_coord_personnel` FOREIGN KEY (`personnel_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prog_coord_program` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_assignment_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `assignment_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_or_scope_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL,
  `occurred_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_role_events_actor` (`actor_profile_id`),
  KEY `fk_role_events_target` (`target_profile_id`),
  CONSTRAINT `fk_role_events_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_role_events_target` FOREIGN KEY (`target_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_role_events_action` CHECK ((`action` in (_utf8mb4'assigned',_utf8mb4'revoked',_utf8mb4'activated',_utf8mb4'deactivated')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_system_role` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `role_key` (`role_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_award_criterion_scores` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluation_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `awarded_points` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_points` decimal(10,2) NOT NULL,
  `scoring_snapshot` json DEFAULT NULL,
  `evaluator_remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_eval_criterion` (`evaluation_id`,`criterion_id`),
  KEY `fk_criterion_scores_criterion` (`criterion_id`),
  KEY `idx_award_criterion_scores_eval` (`evaluation_id`),
  CONSTRAINT `fk_criterion_scores_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_criterion_scores_evaluation` FOREIGN KEY (`evaluation_id`) REFERENCES `student_award_evaluations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_criterion_scores_awarded` CHECK ((`awarded_points` >= 0.00)),
  CONSTRAINT `ck_criterion_scores_max` CHECK ((`max_points` >= 0.00))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_award_evaluations` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cycle_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `award_definition_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `evaluator_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `raw_score` decimal(10,2) NOT NULL DEFAULT '0.00',
  `max_computable_score` decimal(10,2) NOT NULL DEFAULT '100.00',
  `potential_score` decimal(5,2) NOT NULL DEFAULT '0.00',
  `qualifies_portfolio_based` tinyint(1) NOT NULL DEFAULT '0',
  `evaluated_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `fk_student_evaluations_evaluator` (`evaluator_profile_id`),
  KEY `idx_award_evaluations_cycle` (`cycle_id`),
  KEY `idx_award_evaluations_award` (`award_definition_id`),
  KEY `idx_award_evaluations_student` (`student_profile_id`),
  CONSTRAINT `fk_student_evaluations_award` FOREIGN KEY (`award_definition_id`) REFERENCES `award_definitions` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_student_evaluations_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `award_cycles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_student_evaluations_evaluator` FOREIGN KEY (`evaluator_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_student_evaluations_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_student_evaluations_max_score` CHECK ((`max_computable_score` > 0.00)),
  CONSTRAINT `ck_student_evaluations_potential_score` CHECK (((`potential_score` >= 0.00) and (`potential_score` <= 100.00))),
  CONSTRAINT `ck_student_evaluations_raw_score` CHECK ((`raw_score` >= 0.00)),
  CONSTRAINT `ck_student_evaluations_status` CHECK ((`status` in (_utf8mb4'pending',_utf8mb4'calculated',_utf8mb4'in_review',_utf8mb4'completed',_utf8mb4'verified',_utf8mb4'finalized',_utf8mb4'superseded')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_award_score_evidence` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `criterion_score_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `portfolio_record_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scoring_rule_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `points_effect` decimal(10,2) NOT NULL DEFAULT '0.00',
  `basis_snapshot` json DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_critscore_portrec` (`criterion_score_id`,`portfolio_record_id`),
  KEY `fk_score_evidence_scoring_rule` (`scoring_rule_id`),
  KEY `idx_award_score_evidence_port` (`portfolio_record_id`),
  CONSTRAINT `fk_score_evidence_criterion_score` FOREIGN KEY (`criterion_score_id`) REFERENCES `student_award_criterion_scores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_score_evidence_portfolio_record` FOREIGN KEY (`portfolio_record_id`) REFERENCES `student_portfolio_records` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_score_evidence_scoring_rule` FOREIGN KEY (`scoring_rule_id`) REFERENCES `award_scoring_rules` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_portfolio_evidence` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `portfolio_record_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `storage_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mime_type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `detected_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `byte_size` bigint NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sha256` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `evidence_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'certificate',
  `uploaded_by` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uploaded_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `security_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'clean',
  `malware_scanner` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'backend_clamav_v1',
  `security_validated_at` datetime(6) DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  PRIMARY KEY (`id`),
  KEY `idx_portfolio_evidence_record` (`portfolio_record_id`),
  KEY `idx_portfolio_evidence_uploader` (`uploaded_by`),
  CONSTRAINT `fk_portfolio_evidence_record` FOREIGN KEY (`portfolio_record_id`) REFERENCES `student_portfolio_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_portfolio_evidence_uploader` FOREIGN KEY (`uploaded_by`) REFERENCES `profiles` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_student_evidence_byte_size` CHECK ((`byte_size` > 0)),
  CONSTRAINT `ck_student_evidence_security_status` CHECK ((`security_status` in (_utf8mb4'pending',_utf8mb4'clean',_utf8mb4'rejected',_utf8mb4'quarantined'))),
  CONSTRAINT `ck_student_evidence_status` CHECK ((`status` in (_utf8mb4'active',_utf8mb4'archived',_utf8mb4'deleted')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_portfolio_records` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subcategory_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `organizer_or_body` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `occurrence_date` date DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `structured_metadata` json DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'draft',
  `submitted_at` datetime(6) DEFAULT NULL,
  `verified_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_portfolio_records_student` (`student_profile_id`),
  KEY `idx_portfolio_records_category` (`category_id`),
  KEY `idx_portfolio_records_subcategory` (`subcategory_id`),
  KEY `idx_portfolio_records_status` (`status`),
  KEY `idx_portfolio_records_submitted` (`submitted_at`),
  CONSTRAINT `fk_portfolio_records_category` FOREIGN KEY (`category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_portfolio_records_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_portfolio_records_subcategory` FOREIGN KEY (`subcategory_id`) REFERENCES `portfolio_subcategories` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `ck_portfolio_records_status` CHECK ((`status` in (_utf8mb4'draft',_utf8mb4'submitted',_utf8mb4'revision_requested',_utf8mb4'verified',_utf8mb4'rejected',_utf8mb4'archived')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_portfolio_verification_events` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `portfolio_record_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_profile_id` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `action` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `previous_status` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `new_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `occurred_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  KEY `idx_verification_events_record` (`portfolio_record_id`),
  KEY `idx_verification_events_actor` (`actor_profile_id`),
  CONSTRAINT `fk_verification_events_actor` FOREIGN KEY (`actor_profile_id`) REFERENCES `profiles` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_verification_events_record` FOREIGN KEY (`portfolio_record_id`) REFERENCES `student_portfolio_records` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_verification_events_action` CHECK ((`action` in (_utf8mb4'submitted',_utf8mb4'revision_requested',_utf8mb4'resubmitted',_utf8mb4'verified',_utf8mb4'rejected')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_profiles` (
  `profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enrollment_status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'enrolled',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`profile_id`),
  CONSTRAINT `fk_student_profiles_profile` FOREIGN KEY (`profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ck_student_profiles_enrollment_status` CHECK ((`enrollment_status` in (_utf8mb4'enrolled',_utf8mb4'graduated',_utf8mb4'leave_of_absence',_utf8mb4'withdrawn',_utf8mb4'dropped')))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_program_enrollments` (
  `id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `student_profile_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_program_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effective_from` date NOT NULL,
  `effective_until` date DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `active_student_guard` char(36) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS ((case when (`is_active` = 1) then `student_profile_id` else NULL end)) VIRTUAL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_student_enrollment` (`active_student_guard`),
  KEY `idx_student_enrollments_student` (`student_profile_id`),
  KEY `idx_student_enrollments_program` (`academic_program_id`),
  CONSTRAINT `fk_student_enrollment_program` FOREIGN KEY (`academic_program_id`) REFERENCES `academic_programs` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `fk_student_enrollment_student` FOREIGN KEY (`student_profile_id`) REFERENCES `profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
