-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000019_notre_dame_award_remediation.sql
--
-- Phase 1: Notre Dame Award — Source-Fidelity Remediation
-- Exact 100-point official rubric, 50-point computable model, components,
-- taxonomy-aligned evidence mapping, and deterministic scoring rules.
-- ============================================================================

-- 1. Reconcile Award Definition
UPDATE `award_definitions` SET
    `code` = 'NOTRE_DAME_AWARD',
    `name` = 'Notre Dame Award',
    `description` = 'Highest institutional award for graduating students demonstrating excellence across leadership, church involvement, non-academic citations, scholastic achievement, and character.',
    `authority_status` = 'OFFICIAL',
    `graduating_only` = 1,
    `gender_restriction` = NULL,
    `candidate_threshold_percent` = 80.00
WHERE `id` = '50000001-0000-0000-0000-000000000001';

-- 2. Pin the published scoring model identity. The original foundation seed
-- used UUID(), but every rule below has always referenced this approved fixed
-- ID. Explicitly reconciling it makes a zero-state defense replay deterministic.
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001';
DELETE FROM `award_scoring_model_versions`
WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001'
  AND `version_number` = '1.0'
  AND `id` <> '0f85b20c-a461-11f1-a155-08453f7073ee';
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`,
    `candidate_threshold_percent`, `graduating_only`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f7073ee',
    '50000001-0000-0000-0000-000000000001',
    '1.0',
    'Most Outstanding Student Award Scoring Model v1.0 (AY 2025-2026)',
    'published', 80.00, 1, 'OFFICIAL', '2026-08-30 18:53:40.435726'
) ON DUPLICATE KEY UPDATE
    `id` = VALUES(`id`),
    `version_label` = VALUES(`version_label`),
    `status` = VALUES(`status`),
    `candidate_threshold_percent` = VALUES(`candidate_threshold_percent`),
    `graduating_only` = VALUES(`graduating_only`),
    `authority_status` = VALUES(`authority_status`);

-- 3. Reconcile Criteria for Notre Dame Award
-- Clean existing criteria scores/evidence references for re-seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000001';

-- Re-insert 5 Official Criteria (Total 100 pts, Computable 50 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0001-0000-0000-000000000011', '50000001-0000-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', 'CRIT_NDA_SCHOLASTIC', 'Scholastic Achievement', 30.00, 30.00, 1, 0, 'OFFICIAL', 1),
('50000002-0001-0000-0000-000000000001', '50000001-0000-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', 'CRIT_NDA_LEADERSHIP', 'Leadership: On and Off Campus', 20.00, 20.00, 2, 1, 'OFFICIAL', 1),
('50000002-0001-0000-0000-000000000002', '50000001-0000-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', 'CRIT_NDA_CHURCH', 'Church Activities', 20.00, 20.00, 3, 1, 'SYSTEM_OPERATIONALIZATION', 1),
('50000002-0001-0000-0000-000000000003', '50000001-0000-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', 'CRIT_NDA_CITATIONS', 'Citations Received Other than Academics', 10.00, 10.00, 4, 1, 'OFFICIAL', 1),
('50000002-0001-0000-0000-000000000012', '50000001-0000-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', 'CRIT_NDA_CHARACTER', 'Character', 20.00, 20.00, 5, 0, 'OFFICIAL', 1);

-- 4. Criterion Components for Computable Sections
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0001-0000-0000-000000000001', '50000002-0001-0000-0000-000000000001', 'COMP_NDA_LEAD_INVOLVE', 'Leadership Involvement', 'Highest applicable verified student governance or organization leadership position.', 10.00, 1, 1, 'OFFICIAL'),
('50000003-0001-0000-0000-000000000002', '50000002-0001-0000-0000-000000000001', 'COMP_NDA_LEAD_AWARDS', 'Leadership Awards, Citations, and Seminars', 'Cumulative verified leadership-related awards, citations, and leadership development seminars (capped at 10).', 10.00, 2, 1, 'OFFICIAL'),
('50000003-0001-0000-0000-000000000003', '50000002-0001-0000-0000-000000000002', 'COMP_NDA_CHURCH_MINISTRY', 'Involvement in Church Ministries / Organizations', 'Count-based points for verified church ministry, parish, or campus ministry involvements (capped at 10).', 10.00, 1, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0001-0000-0000-000000000004', '50000002-0001-0000-0000-000000000002', 'COMP_NDA_CHURCH_INITIATED', 'Initiated Church-Related Activities', 'Role-based points for organizing, facilitating, or heading church-related activities (capped at 10).', 10.00, 2, 1, 'SYSTEM_OPERATIONALIZATION');

-- 5. Evidence Mapping Rules for Notre Dame Award
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0001-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000001', '50000003-0001-0000-0000-000000000001', 'MAP_NDA_LEAD_POS', 'Leadership Positions Matrix Mapping', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', NULL, 10, 'OFFICIAL', 1),
('50000004-0001-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000001', '50000003-0001-0000-0000-000000000002', 'MAP_NDA_LEAD_AWARDS', 'Leadership Citations & Awards Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 20, 'OFFICIAL', 1),
('50000004-0001-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000001', '50000003-0001-0000-0000-000000000002', 'MAP_NDA_LEAD_SEMINARS', 'Leadership Development Seminars Mapping', '802de57b-54d7-4d38-9433-052ca9636380', NULL, 30, 'OFFICIAL', 1),
('50000004-0001-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000002', '50000003-0001-0000-0000-000000000003', 'MAP_NDA_CHURCH_MINISTRY', 'Church Ministries & Organizations Mapping', '779a9653-d972-47ce-93dc-cb381150568b', NULL, 10, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0001-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000002', '50000003-0001-0000-0000-000000000004', 'MAP_NDA_CHURCH_INITIATED', 'Initiated Church Activities Mapping', '779a9653-d972-47ce-93dc-cb381150568b', NULL, 20, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0001-0000-0000-000000000006', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000003', NULL, 'MAP_NDA_NONACAD_CITATIONS', 'Non-Academic Citations Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 10, 'OFFICIAL', 1);

-- 6. Scoring Rules for Notre Dame Award
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0001-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000001', '50000003-0001-0000-0000-000000000001', 'RULE_NDA_LEAD_INVOLVE', 'Leadership Involvement Highest Level Rule', 'highest_only', 10.00, 10.00, '{"points_matrix": {"university": 10.0, "college": 8.0, "club": 6.0, "year_level": 4.0}, "max_points": 10.0}', 'OFFICIAL', 1, 1),
('50000005-0001-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000001', '50000003-0001-0000-0000-000000000002', 'RULE_NDA_LEAD_AWARDS', 'Leadership Awards & Seminars Capped Rule', 'sum_capped', 10.00, 10.00, '{"points_per_record": {"award_international": 5.0, "award_local": 2.0, "seminar": 2.0}, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 2),
('50000005-0001-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000002', '50000003-0001-0000-0000-000000000003', 'RULE_NDA_CHURCH_MINISTRY', 'Church Ministries Count Matrix Rule', 'matrix_mapping', 10.00, 10.00, '{"count_matrix": {"1": 2.0, "2": 4.0, "3": 6.0, "4": 8.0, "5": 10.0}, "max_points": 10.0}', 'SYSTEM_OPERATIONALIZATION', 1, 1),
('50000005-0001-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000002', '50000003-0001-0000-0000-000000000004', 'RULE_NDA_CHURCH_INITIATED', 'Initiated Church Activities Capped Rule', 'sum_capped', 10.00, 10.00, '{"role_points": {"organizer": 2.0, "facilitator": 3.0, "head": 4.0, "initiator": 5.0}, "cap": 10.0, "max_points": 10.0}', 'SYSTEM_OPERATIONALIZATION', 1, 2),
('50000005-0001-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f7073ee', '50000002-0001-0000-0000-000000000003', NULL, 'RULE_NDA_NONACAD_CITATIONS', 'Non-Academic Citations Formula Rule', 'sum_capped', 10.00, 10.00, '{"points_per_item": 2.0, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 1);
