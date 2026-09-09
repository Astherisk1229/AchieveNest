-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000021_smc_award_remediation.sql
--
-- Phase 2: Saint Marcellin Champagnat (SMC) Award — Full Source-Fidelity Remediation
-- Exact 100-point official rubric, 60-point computable model, components,
-- taxonomy-aligned evidence mapping, and deterministic scoring rules.
-- ============================================================================

-- 1. Reconcile Award Definition for SMC Award
UPDATE `award_definitions` SET
    `code` = 'SMC_AWARD',
    `name` = 'Saint Marcellin Champagnat (SMC) Award',
    `category` = 'service',
    `description` = 'Premier graduating award recognizing exceptional Christian leadership, apostolic zeal, Marist spirituality, and service to Church and community.',
    `authority_status` = 'OFFICIAL',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 1,
    `gender_restriction` = NULL,
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000021';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707321', '50000001-0000-0000-0000-000000000021', '1.0', 'v1.0 Published', 'published', 80.00, 1, 'OFFICIAL', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00;

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000021');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000021');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000021');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000021');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000021';

-- 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 60 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0021-0000-0000-000000000001', '50000001-0000-0000-0000-000000000021', '0f85b20c-a461-11f1-a155-08453f707321', 'CRIT_SMC_SCHOLASTIC', 'Scholastic Achievement', 20.00, 20.00, 1, 0, 'OFFICIAL', 1),
('50000002-0021-0000-0000-000000000002', '50000001-0000-0000-0000-000000000021', '0f85b20c-a461-11f1-a155-08453f707321', 'CRIT_SMC_LEADERSHIP', 'Leadership: On and Off Campus', 20.00, 20.00, 2, 1, 'OFFICIAL', 1),
('50000002-0021-0000-0000-000000000003', '50000001-0000-0000-0000-000000000021', '0f85b20c-a461-11f1-a155-08453f707321', 'CRIT_SMC_COMMUNITY', 'Community Involvement', 30.00, 30.00, 3, 1, 'OFFICIAL', 1),
('50000002-0021-0000-0000-000000000004', '50000001-0000-0000-0000-000000000021', '0f85b20c-a461-11f1-a155-08453f707321', 'CRIT_SMC_CITATIONS', 'Citations Received Other than Academics', 10.00, 10.00, 4, 1, 'OFFICIAL', 1),
('50000002-0021-0000-0000-000000000005', '50000001-0000-0000-0000-000000000021', '0f85b20c-a461-11f1-a155-08453f707321', 'CRIT_SMC_CHARACTER', 'Character', 20.00, 20.00, 5, 0, 'OFFICIAL', 1);

-- 5. Criterion Components for Computable Sections (20 Leadership + 30 Community)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0021-0000-0000-000000000001', '50000002-0021-0000-0000-000000000002', 'COMP_SMC_LEAD_INVOLVE', 'Leadership Involvement', 'Highest applicable verified student governance or organization leadership position.', 10.00, 1, 1, 'OFFICIAL'),
('50000003-0021-0000-0000-000000000002', '50000002-0021-0000-0000-000000000002', 'COMP_SMC_LEAD_AWARDS', 'Leadership Awards, Citations, and Seminars', 'Cumulative verified leadership-related awards, citations, and leadership development seminars (capped at 10).', 10.00, 2, 1, 'OFFICIAL'),
('50000003-0021-0000-0000-000000000003', '50000002-0021-0000-0000-000000000003', 'COMP_SMC_COMM_INVOLVE', 'Community & Ministry Involvement', 'Count-based points for verified involvements in community outreach, civic extension, and parish/church ministries (capped at 15).', 15.00, 1, 1, 'OFFICIAL'),
('50000003-0021-0000-0000-000000000004', '50000002-0021-0000-0000-000000000003', 'COMP_SMC_COMM_INITIATED', 'Initiated Community / Church Activities', 'Role-based points for organizing, facilitating, or heading community outreach or ministry initiatives (capped at 15).', 15.00, 2, 1, 'OFFICIAL');

-- 6. Evidence Mapping Rules for SMC Award
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0021-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000002', '50000003-0021-0000-0000-000000000001', 'MAP_SMC_LEAD_POS', 'Leadership Positions Matrix Mapping', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', NULL, 10, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000002', '50000003-0021-0000-0000-000000000002', 'MAP_SMC_LEAD_AWARDS', 'Leadership Citations & Awards Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 20, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000002', '50000003-0021-0000-0000-000000000002', 'MAP_SMC_LEAD_SEMINARS', 'Leadership Development Seminars Mapping', '802de57b-54d7-4d38-9433-052ca9636380', NULL, 30, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000003', '50000003-0021-0000-0000-000000000003', 'MAP_SMC_COMM_SERVICE', 'Community Service & Volunteerism Mapping', 'ace24637-66f7-4329-9451-ccc61e18eab9', NULL, 10, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000003', '50000003-0021-0000-0000-000000000003', 'MAP_SMC_CHURCH_MINISTRY', 'Church & Ministry Involvement Mapping', '779a9653-d972-47ce-93dc-cb381150568b', NULL, 20, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000006', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000003', '50000003-0021-0000-0000-000000000004', 'MAP_SMC_COMM_INITIATED', 'Initiated Community Activities Mapping', 'ace24637-66f7-4329-9451-ccc61e18eab9', NULL, 10, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000007', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000003', '50000003-0021-0000-0000-000000000004', 'MAP_SMC_CHURCH_INITIATED', 'Initiated Ministry Activities Mapping', '779a9653-d972-47ce-93dc-cb381150568b', NULL, 20, 'OFFICIAL', 1),
('50000004-0021-0000-0000-000000000008', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000004', NULL, 'MAP_SMC_NONACAD_CITATIONS', 'Non-Academic Citations Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 10, 'OFFICIAL', 1);

-- 7. Scoring Rules for SMC Award
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0021-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000002', '50000003-0021-0000-0000-000000000001', 'RULE_SMC_LEAD_INVOLVE', 'SMC Leadership Involvement Highest Level Rule', 'highest_only', 10.00, 10.00, '{"points_matrix": {"university": 10.0, "college": 8.0, "club": 6.0, "year_level": 4.0}, "max_points": 10.0}', 'OFFICIAL', 1, 1),
('50000005-0021-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000002', '50000003-0021-0000-0000-000000000002', 'RULE_SMC_LEAD_AWARDS', 'SMC Leadership Awards & Seminars Capped Rule', 'sum_capped', 10.00, 10.00, '{"points_per_record": {"award_international": 5.0, "award_local": 2.0, "seminar": 2.0}, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 2),
('50000005-0021-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000003', '50000003-0021-0000-0000-000000000003', 'RULE_SMC_COMM_INVOLVE', 'SMC Community & Ministry Count Matrix Rule', 'matrix_mapping', 15.00, 15.00, '{"count_matrix": {"1": 3.0, "2": 6.0, "3": 9.0, "4": 12.0, "5": 15.0}, "max_points": 15.0}', 'OFFICIAL', 1, 1),
('50000005-0021-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000003', '50000003-0021-0000-0000-000000000004', 'RULE_SMC_COMM_INITIATED', 'SMC Initiated Community Activities Capped Rule', 'sum_capped', 15.00, 15.00, '{"role_points": {"organizer": 3.0, "facilitator": 4.0, "head": 6.0, "initiator": 8.0}, "cap": 15.0, "max_points": 15.0}', 'OFFICIAL', 1, 2),
('50000005-0021-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f707321', '50000002-0021-0000-0000-000000000004', NULL, 'RULE_SMC_NONACAD_CITATIONS', 'SMC Non-Academic Citations Formula Rule', 'sum_capped', 10.00, 10.00, '{"points_per_item": 2.0, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 1);
