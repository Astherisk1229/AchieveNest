-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000025_sports_male_award_remediation.sql
--
-- Phase 6: Outstanding Performance in Sports - Male — Full Source-Fidelity Remediation
-- Exact 100-point official rubric, 55-point computable model, sports skills presence,
-- athletic meets participation matrix, and medal achievement matrix.
-- ============================================================================

-- 1. Reconcile Award Definition for Outstanding Performance in Sports - Male
UPDATE `award_definitions` SET
    `code` = 'SPORTS_AWARD_MALE',
    `name` = 'Outstanding Performance in Sports - Male',
    `category` = 'sports',
    `description` = 'Premier graduating award recognizing exemplary male athletic distinction, verified tournament competition excellence, medal honors, sportsmanship, and leadership.',
    `authority_status` = 'OFFICIAL',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 1,
    `gender_restriction` = 'male',
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000025';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `gender_requirement`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707325', '50000001-0000-0000-0000-000000000025', '1.0', 'v1.0 Published', 'published', 80.00, 1, 'male', 'OFFICIAL', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00, `gender_requirement` = 'male';

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000025');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000025');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000025');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000025');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000025';

-- 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 55 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0025-0000-0000-000000000001', '50000001-0000-0000-0000-000000000025', '0f85b20c-a461-11f1-a155-08453f707325', 'CRIT_SPORTS_M_ACADEMIC', 'Academic Achievement', 15.00, 15.00, 1, 0, 'OFFICIAL', 1),
('50000002-0025-0000-0000-000000000002', '50000001-0000-0000-0000-000000000025', '0f85b20c-a461-11f1-a155-08453f707325', 'CRIT_SPORTS_M_SKILLS_ATTITUDE', 'Skills and Attitude', 40.00, 20.00, 2, 1, 'OFFICIAL', 1),
('50000002-0025-0000-0000-000000000003', '50000001-0000-0000-0000-000000000025', '0f85b20c-a461-11f1-a155-08453f707325', 'CRIT_SPORTS_M_PARTICIPATION', 'Participation in Sports and Athletic Meets', 20.00, 20.00, 3, 1, 'OFFICIAL', 1),
('50000002-0025-0000-0000-000000000004', '50000001-0000-0000-0000-000000000025', '0f85b20c-a461-11f1-a155-08453f707325', 'CRIT_SPORTS_M_AWARDS', 'Awards Received', 15.00, 15.00, 4, 1, 'OFFICIAL', 1),
('50000002-0025-0000-0000-000000000005', '50000001-0000-0000-0000-000000000025', '0f85b20c-a461-11f1-a155-08453f707325', 'CRIT_SPORTS_M_INTERVIEW', 'Interview', 10.00, 10.00, 5, 0, 'OFFICIAL', 1);

-- 5. Criterion Components (20 Skills + 20 Participation + 15 Awards = 55 Computable)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0025-0000-0000-000000000001', '50000002-0025-0000-0000-000000000002', 'COMP_SPORTS_M_INDIV_SKILLS', 'Individual Event Skills Evidence', 'Verified participation in individual sports events (10 pts presence).', 10.00, 1, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0025-0000-0000-000000000002', '50000002-0025-0000-0000-000000000002', 'COMP_SPORTS_M_TEAM_SKILLS', 'Team Sports Skills Evidence', 'Verified participation in team sports events (10 pts presence).', 10.00, 2, 1, 'SYSTEM_OPERATIONALIZATION'),
('50000003-0025-0000-0000-000000000003', '50000002-0025-0000-0000-000000000003', 'COMP_SPORTS_M_PARTICIPATION', 'Participation in Sports Meets', 'Accumulated verified participation: PRISAA Nat=7, Reg=5, Local=2, NDEA=4, INTRAMS=2 (capped at 20).', 20.00, 1, 1, 'OFFICIAL'),
('50000003-0025-0000-0000-000000000004', '50000002-0025-0000-0000-000000000004', 'COMP_SPORTS_M_AWARDS', 'Awards Received in Sports', 'Accumulated verified sports medals across PRISAA, NDEA, and INTRAMS meets (capped at 15).', 15.00, 1, 1, 'OFFICIAL');

-- 6. Evidence Mapping Rules for Outstanding Performance in Sports - Male
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0025-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000002', '50000003-0025-0000-0000-000000000001', 'MAP_SPORTS_M_INDIV', 'Individual Sports Skills Mapping', '2d20d412-bf34-46b4-a21d-d7131d4b514a', NULL, 10, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0025-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000002', '50000003-0025-0000-0000-000000000002', 'MAP_SPORTS_M_TEAM', 'Team Sports Skills Mapping', '2d20d412-bf34-46b4-a21d-d7131d4b514a', NULL, 20, 'SYSTEM_OPERATIONALIZATION', 1),
('50000004-0025-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000003', '50000003-0025-0000-0000-000000000003', 'MAP_SPORTS_M_PARTICIPATION', 'Sports Meets Participation Mapping', '2d20d412-bf34-46b4-a21d-d7131d4b514a', NULL, 10, 'OFFICIAL', 1),
('50000004-0025-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000004', '50000003-0025-0000-0000-000000000004', 'MAP_SPORTS_M_AWARDS', 'Sports Medals & Honors Mapping', '2d20d412-bf34-46b4-a21d-d7131d4b514a', NULL, 10, 'OFFICIAL', 1);

-- 7. Scoring Rules for Outstanding Performance in Sports - Male
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0025-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000002', '50000003-0025-0000-0000-000000000001', 'RULE_SPORTS_M_INDIV', 'Individual Sports Skills Rule', 'sum_capped', 10.00, 10.00, '{"fixed_presence_points": 10.0, "cap": 10.0, "max_points": 10.0}', 'SYSTEM_OPERATIONALIZATION', 1, 1),
('50000005-0025-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000002', '50000003-0025-0000-0000-000000000002', 'RULE_SPORTS_M_TEAM', 'Team Sports Skills Rule', 'sum_capped', 10.00, 10.00, '{"fixed_presence_points": 10.0, "cap": 10.0, "max_points": 10.0}', 'SYSTEM_OPERATIONALIZATION', 1, 2),
('50000005-0025-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000003', '50000003-0025-0000-0000-000000000003', 'RULE_SPORTS_M_PARTICIPATION', 'Sports Meets Participation Matrix Rule', 'sum_capped', 20.00, 20.00, '{"event_level_points": {"prisaa_national": 7.0, "prisaa_regional": 5.0, "prisaa_local": 2.0, "ndea": 4.0, "intramurals": 2.0}, "cap": 20.0, "max_points": 20.0}', 'OFFICIAL', 1, 1),
('50000005-0025-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707325', '50000002-0025-0000-0000-000000000004', '50000003-0025-0000-0000-000000000004', 'RULE_SPORTS_M_AWARDS', 'Sports Medals Matrix Rule', 'sum_capped', 15.00, 15.00, '{"medal_matrix": {"prisaa_national": {"gold": 7.0, "silver": 5.0, "bronze": 3.0}, "prisaa_regional": {"gold": 5.0, "silver": 3.0, "bronze": 2.0}, "prisaa_local": {"gold": 3.0, "silver": 2.0, "bronze": 1.0}, "ndea": {"gold": 4.0, "silver": 4.0, "bronze": 2.0}, "intramurals": {"gold": 2.0, "silver": 1.0, "bronze": 1.0}}, "cap": 15.0, "max_points": 15.0}', 'OFFICIAL', 1, 1);
