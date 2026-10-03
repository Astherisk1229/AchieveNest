-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000023_campus_journalism_award_remediation.sql
--
-- Phase 4: Campus Journalism Award — Full Source-Fidelity Remediation
-- Exact 100-point official rubric, 70-point computable model, components,
-- taxonomy-aligned publication and leadership evidence mapping, and deterministic scoring rules.
-- ============================================================================

-- 1. Reconcile Award Definition for Campus Journalism Award
UPDATE `award_definitions` SET
    `code` = 'CAMPUS_JOURNALISM_AWARD',
    `name` = 'Campus Journalism Award',
    `category` = 'journalism',
    `description` = 'Premier graduating award recognizing exemplary journalistic dedication, verified publication excellence, editorial integrity, and campus publication leadership.',
    `authority_status` = 'OFFICIAL',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 1,
    `gender_restriction` = NULL,
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000023';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707323', '50000001-0000-0000-0000-000000000023', '1.0', 'v1.0 Published', 'published', 80.00, 1, 'OFFICIAL', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00;

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000023');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000023');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000023');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000023');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000023';

-- 4. Re-insert 4 Official Criteria (Total 100 pts, Computable 70 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0023-0000-0000-000000000001', '50000001-0000-0000-0000-000000000023', '0f85b20c-a461-11f1-a155-08453f707323', 'CRIT_JOURN_CHARACTER', 'Character', 20.00, 20.00, 1, 0, 'OFFICIAL', 1),
('50000002-0023-0000-0000-000000000002', '50000001-0000-0000-0000-000000000023', '0f85b20c-a461-11f1-a155-08453f707323', 'CRIT_JOURN_PUB_QUALITY', 'Quality of Publication', 60.00, 60.00, 2, 1, 'SYSTEM_OPERATIONALIZATION', 1),
('50000002-0023-0000-0000-000000000003', '50000001-0000-0000-0000-000000000023', '0f85b20c-a461-11f1-a155-08453f707323', 'CRIT_JOURN_LEADERSHIP', 'Leadership', 10.00, 10.00, 3, 1, 'OFFICIAL', 1),
('50000002-0023-0000-0000-000000000004', '50000001-0000-0000-0000-000000000023', '0f85b20c-a461-11f1-a155-08453f707323', 'CRIT_JOURN_INTERVIEW', 'Interview', 10.00, 10.00, 4, 0, 'OFFICIAL', 1);

-- 5. Criterion Components (60 Publication Evidence + 10 Leadership)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0023-0000-0000-000000000001', '50000002-0023-0000-0000-000000000002', 'COMP_JOURN_NEWS', 'News Item Evidence', 'Verified published news items (2 pts each, capped at 10).', 10.00, 1, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0023-0000-0000-000000000002', '50000002-0023-0000-0000-000000000002', 'COMP_JOURN_LITERARY', 'Literary Evidence', 'Verified published literary works (2 pts each, capped at 10).', 10.00, 2, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0023-0000-0000-000000000003', '50000002-0023-0000-0000-000000000002', 'COMP_JOURN_COLUMN', 'Column Evidence', 'Verified published columns (4 pts each, capped at 20).', 20.00, 3, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0023-0000-0000-000000000004', '50000002-0023-0000-0000-000000000002', 'COMP_JOURN_EDITORIAL', 'Editorial Evidence', 'Verified published editorials (4 pts each, capped at 20).', 20.00, 4, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0023-0000-0000-000000000005', '50000002-0023-0000-0000-000000000003', 'COMP_JOURN_LEAD_ROLE', 'Leadership Involvement', 'Verified publication staff role (Officer=3 pts, Member/contributor=2 pts, capped at 5).', 5.00, 1, 1, 'OFFICIAL'),
('50000003-0023-0000-0000-000000000006', '50000002-0023-0000-0000-000000000003', 'COMP_JOURN_LEAD_AWARDS', 'Journalism Awards / Citations', 'Verified journalism awards/citations (3 intl/natl, 2 local, capped at 5; seminars = 0 pts).', 5.00, 2, 1, 'OFFICIAL');

-- 6. Evidence Mapping Rules for Campus Journalism Award
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0023-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000001', 'MAP_JOURN_NEWS', 'Published News Items Mapping', '2b09cd61-7a23-4466-be58-889398e8f201', '40000009-0001-0000-0000-000000000001', 10, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0023-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000002', 'MAP_JOURN_LITERARY', 'Published Literary Works Mapping', '2b09cd61-7a23-4466-be58-889398e8f201', '40000009-0001-0000-0000-000000000002', 20, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0023-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000003', 'MAP_JOURN_COLUMN', 'Published Columns Mapping', '2b09cd61-7a23-4466-be58-889398e8f201', '40000009-0001-0000-0000-000000000003', 30, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0023-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000004', 'MAP_JOURN_EDITORIAL', 'Published Editorials Mapping', '2b09cd61-7a23-4466-be58-889398e8f201', '40000009-0001-0000-0000-000000000004', 40, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0023-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000003', '50000003-0023-0000-0000-000000000005', 'MAP_JOURN_OFFICER', 'Publication Officer Role Mapping', '2b09cd61-7a23-4466-be58-889398e8f201', '40000009-0001-0000-0000-000000000006', 10, 'OFFICIAL', 1),
('50000004-0023-0000-0000-000000000006', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000003', '50000003-0023-0000-0000-000000000005', 'MAP_JOURN_MEMBER', 'Publication Member / Contributor Role Mapping', '2b09cd61-7a23-4466-be58-889398e8f201', '40000009-0001-0000-0000-000000000005', 20, 'OFFICIAL', 1),
('50000004-0023-0000-0000-000000000007', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000003', '50000003-0023-0000-0000-000000000006', 'MAP_JOURN_AWARDS', 'Journalism Awards & Citations Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 10, 'OFFICIAL', 1),
('50000004-0023-0000-0000-000000000008', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000003', '50000003-0023-0000-0000-000000000006', 'MAP_JOURN_SEMINARS', 'Journalism Seminars Supporting Mapping (0 Pts)', '802de57b-54d7-4d38-9433-052ca9636380', NULL, 20, 'OFFICIAL', 1);

-- 7. Scoring Rules for Campus Journalism Award
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0023-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000001', 'RULE_JOURN_NEWS', 'Published News Items Capped Rule', 'sum_capped', 10.00, 10.00, '{"points_per_item": 2.0, "cap": 10.0, "max_points": 10.0}', 'SYSTEM_OPERATIONALIZATION', 1, 1),
('50000005-0023-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000002', 'RULE_JOURN_LITERARY', 'Published Literary Works Capped Rule', 'sum_capped', 10.00, 10.00, '{"points_per_item": 2.0, "cap": 10.0, "max_points": 10.0}', 'SYSTEM_OPERATIONALIZATION', 1, 2),
('50000005-0023-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000003', 'RULE_JOURN_COLUMN', 'Published Columns Capped Rule', 'sum_capped', 20.00, 20.00, '{"points_per_item": 4.0, "cap": 20.0, "max_points": 20.0}', 'SYSTEM_OPERATIONALIZATION', 1, 3),
('50000005-0023-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000002', '50000003-0023-0000-0000-000000000004', 'RULE_JOURN_EDITORIAL', 'Published Editorials Capped Rule', 'sum_capped', 20.00, 20.00, '{"points_per_item": 4.0, "cap": 20.0, "max_points": 20.0}', 'SYSTEM_OPERATIONALIZATION', 1, 4),
('50000005-0023-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000003', '50000003-0023-0000-0000-000000000005', 'RULE_JOURN_LEAD_ROLE', 'Publication Leadership Roles Rule', 'sum_capped', 5.00, 5.00, '{"role_points": {"officer": 3.0, "member": 2.0, "contributor": 2.0}, "cap": 5.0, "max_points": 5.0}', 'OFFICIAL', 1, 1),
('50000005-0023-0000-0000-000000000006', '0f85b20c-a461-11f1-a155-08453f707323', '50000002-0023-0000-0000-000000000003', '50000003-0023-0000-0000-000000000006', 'RULE_JOURN_LEAD_AWARDS', 'Journalism Awards & Citations Rule', 'sum_capped', 5.00, 5.00, '{"points_per_record": {"award_international": 3.0, "award_national": 3.0, "award_local": 2.0, "seminar": 0.0}, "cap": 5.0, "max_points": 5.0}', 'OFFICIAL', 1, 2);
