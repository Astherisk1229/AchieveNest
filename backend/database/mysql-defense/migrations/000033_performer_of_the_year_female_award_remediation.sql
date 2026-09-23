-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000033_performer_of_the_year_female_award_remediation.sql
--
-- Phase 14: Outstanding Performer of the Year - Female — Proposed Model Source-Fidelity Remediation
-- Proposed 55-point portfolio model, socio-cultural skills evidence (Individual=10,
-- Group=10, cap 20), meets participation (PRISAA Nat=7, Reg=5, Local=2, NDEA=4,
-- Univ=2, cap 20), and awards placement (Gold: 7/5/3/4/2, Silver: 5/3/2/3/1, Bronze: 3/2/1/2/1,
-- cap 15). Annual Female Award cycle. Authority locked to PROPOSED.
-- ============================================================================

-- 1. Reconcile Award Definition for Outstanding Performer of the Year - Female
UPDATE `award_definitions` SET
    `code` = 'PERFORMER_OF_THE_YEAR_FEMALE',
    `name` = 'Outstanding Performer of the Year - Female',
    `category` = 'performing_arts',
    `description` = 'Proposed AchieveNest portfolio-based model for annual recognition of an outstanding female student performer who has demonstrated excellence in socio-cultural competitions, musical, dance, or theatrical arts while maintaining academic standing.',
    `authority_status` = 'PROPOSED',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 0,
    `gender_restriction` = 'female',
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000033';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `gender_requirement`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707333', '50000001-0000-0000-0000-000000000033', '1.0', 'v1.0 Proposed Published', 'published', 80.00, 0, 'female', 'PROPOSED', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00, `graduating_only` = 0, `gender_requirement` = 'female', `authority_status` = 'PROPOSED';

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000033');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000033');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000033');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000033');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000033';

-- 4. Re-insert 3 Proposed Criteria (Total 55 pts Computable)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0033-0000-0000-000000000001', '50000001-0000-0000-0000-000000000033', '0f85b20c-a461-11f1-a155-08453f707333', 'CRIT_PERFORMER_F_SKILLS', 'Socio-Cultural Skills Evidence', 20.00, 20.00, 1, 1, 'PROPOSED', 1),
('50000002-0033-0000-0000-000000000002', '50000001-0000-0000-0000-000000000033', '0f85b20c-a461-11f1-a155-08453f707333', 'CRIT_PERFORMER_F_PARTICIPATION', 'Participation in Socio-Cultural Meets / Competitions', 20.00, 20.00, 2, 1, 'PROPOSED', 1),
('50000002-0033-0000-0000-000000000003', '50000001-0000-0000-0000-000000000033', '0f85b20c-a461-11f1-a155-08453f707333', 'CRIT_PERFORMER_F_AWARDS', 'Awards Received', 15.00, 15.00, 3, 1, 'PROPOSED', 1);

-- 5. Proposed Criterion Components (20 Skills + 20 Participation + 15 Awards = 55 Computable)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0033-0000-0000-000000000001', '50000002-0033-0000-0000-000000000001', 'COMP_PERFORMER_F_INDIV_SKILLS', 'Individual Socio-Cultural Performance Evidence', 'Presence of at least one verified individual socio-cultural performance record (10.00 pts).', 10.00, 1, 1, 'PROPOSED'),
('50000003-0033-0000-0000-000000000002', '50000002-0033-0000-0000-000000000001', 'COMP_PERFORMER_F_GROUP_SKILLS', 'Group / Ensemble Socio-Cultural Performance Evidence', 'Presence of at least one verified group/ensemble socio-cultural performance record (10.00 pts).', 10.00, 2, 1, 'PROPOSED'),
('50000003-0033-0000-0000-000000000003', '50000002-0033-0000-0000-000000000002', 'COMP_PERFORMER_F_PARTICIPATION', 'Participation in Socio-Cultural Meets / Competitions', 'PRISAA Nat=7, Reg=5, Local=2, NDEA=4, Univ=2 (capped at 20).', 20.00, 1, 1, 'PROPOSED'),
('50000003-0033-0000-0000-000000000004', '50000002-0033-0000-0000-000000000003', 'COMP_PERFORMER_F_AWARDS', 'Awards Received in Socio-Cultural Competitions', 'Socio-cultural awards: Gold: 7/5/3/4/2, Silver: 5/3/2/3/1, Bronze: 3/2/1/2/1 (capped at 15).', 15.00, 1, 1, 'PROPOSED');

-- 6. Evidence Mapping Rules for Outstanding Performer of the Year - Female
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0033-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000001', '50000003-0033-0000-0000-000000000001', 'MAP_PERFORMER_F_INDIV_SKILLS', 'Individual Socio-Cultural Skills Evidence Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 10, 'PROPOSED', 1),
('50000004-0033-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000001', '50000003-0033-0000-0000-000000000002', 'MAP_PERFORMER_F_GROUP_SKILLS', 'Group Socio-Cultural Skills Evidence Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 20, 'PROPOSED', 1),
('50000004-0033-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000002', '50000003-0033-0000-0000-000000000003', 'MAP_PERFORMER_F_PARTICIPATION', 'Socio-Cultural Meets Participation Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 10, 'PROPOSED', 1),
('50000004-0033-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000003', '50000003-0033-0000-0000-000000000004', 'MAP_PERFORMER_F_AWARDS', 'Socio-Cultural Awards & Honors Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 10, 'PROPOSED', 1);

-- 7. Scoring Rules for Outstanding Performer of the Year - Female
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0033-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000001', '50000003-0033-0000-0000-000000000001', 'RULE_PERFORMER_F_INDIV', 'Individual Performance Presence Rule', 'sum_capped', 10.00, 10.00, '{"presence_points": 10.0, "cap": 10.0, "max_points": 10.0}', 'PROPOSED', 1, 1),
('50000005-0033-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000001', '50000003-0033-0000-0000-000000000002', 'RULE_PERFORMER_F_GROUP', 'Group Performance Presence Rule', 'sum_capped', 10.00, 10.00, '{"presence_points": 10.0, "cap": 10.0, "max_points": 10.0}', 'PROPOSED', 1, 2),
('50000005-0033-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000002', '50000003-0033-0000-0000-000000000003', 'RULE_PERFORMER_F_PARTICIPATION', 'Socio-Cultural Meets Participation Matrix Rule', 'sum_capped', 20.00, 20.00, '{"event_level_points": {"prisaa_national": 7.0, "prisaa_regional": 5.0, "prisaa_local": 2.0, "ndea_inter_school": 4.0, "university_level": 2.0}, "cap": 20.0, "max_points": 20.0}', 'PROPOSED', 1, 1),
('50000005-0033-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707333', '50000002-0033-0000-0000-000000000003', '50000003-0033-0000-0000-000000000004', 'RULE_PERFORMER_F_AWARDS', 'Socio-Cultural Awards Placement Matrix Rule', 'sum_capped', 15.00, 15.00, '{"medal_matrix": {"prisaa_national": {"gold": 7.0, "silver": 5.0, "bronze": 3.0}, "prisaa_regional": {"gold": 5.0, "silver": 3.0, "bronze": 2.0}, "prisaa_local": {"gold": 3.0, "silver": 2.0, "bronze": 1.0}, "ndea_inter_school": {"gold": 4.0, "silver": 3.0, "bronze": 2.0}, "university_level": {"gold": 2.0, "silver": 1.0, "bronze": 1.0}}, "cap": 15.0, "max_points": 15.0}', 'PROPOSED', 1, 1);
