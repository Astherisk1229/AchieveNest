-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000027_socio_cultural_male_award_remediation.sql
--
-- Phase 8: Outstanding Performance in Socio-Cultural - Male — Proposed Model Source-Fidelity Remediation
-- Exact proposed 55-point computable model, socio-cultural skills presence,
-- meets/competitions participation matrix, and awards matrix with NDEA Silver = 3.
-- Preserves PROPOSED authority status without fabricating a 100-point official rubric.
-- ============================================================================

-- 1. Reconcile Award Definition for Outstanding Performance in Socio-Cultural - Male
UPDATE `award_definitions` SET
    `code` = 'SOCIO_CULTURAL_AWARD_MALE',
    `name` = 'Outstanding Performance in Socio-Cultural - Male',
    `category` = 'socio_cultural',
    `description` = 'Proposed AchieveNest portfolio-based criteria recognizing exemplary male performing arts distinction, cultural competition excellence, stage discipline, and institutional artistic representation.',
    `authority_status` = 'PROPOSED',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 1,
    `gender_restriction` = 'male',
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000027';

-- 2. Published Scoring Model Version v1.0 (PROPOSED)
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `gender_requirement`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707327', '50000001-0000-0000-0000-000000000027', '1.0', 'v1.0 Proposed Published', 'published', 80.00, 1, 'male', 'PROPOSED', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00, `gender_requirement` = 'male', `authority_status` = 'PROPOSED';

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000027');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000027');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000027');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000027');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000027';

-- 4. Re-insert 3 Proposed Criteria (Total 55 pts, All Computable)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0027-0000-0000-000000000001', '50000001-0000-0000-0000-000000000027', '0f85b20c-a461-11f1-a155-08453f707327', 'CRIT_SOCIO_M_SKILLS', 'Socio-Cultural Skills Evidence', 20.00, 20.00, 1, 1, 'PROPOSED', 1),
('50000002-0027-0000-0000-000000000002', '50000001-0000-0000-0000-000000000027', '0f85b20c-a461-11f1-a155-08453f707327', 'CRIT_SOCIO_M_PARTICIPATION', 'Participation in Socio-Cultural Meets / Competitions', 20.00, 20.00, 2, 1, 'PROPOSED', 1),
('50000002-0027-0000-0000-000000000003', '50000001-0000-0000-0000-000000000027', '0f85b20c-a461-11f1-a155-08453f707327', 'CRIT_SOCIO_M_AWARDS', 'Awards Received', 15.00, 15.00, 3, 1, 'PROPOSED', 1);

-- 5. Criterion Components (20 Skills + 20 Participation + 15 Awards = 55 Computable)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0027-0000-0000-000000000001', '50000002-0027-0000-0000-000000000001', 'COMP_SOCIO_M_INDIV_SKILLS', 'Individual Performance Skills Evidence', 'Verified participation in individual socio-cultural performances (10 pts presence).', 10.00, 1, 1, 'PROPOSED'),
('50000003-0027-0000-0000-000000000002', '50000002-0027-0000-0000-000000000001', 'COMP_SOCIO_M_GROUP_SKILLS', 'Group / Ensemble Performance Skills Evidence', 'Verified participation in group/ensemble socio-cultural performances (10 pts presence).', 10.00, 2, 1, 'PROPOSED'),
('50000003-0027-0000-0000-000000000003', '50000002-0027-0000-0000-000000000002', 'COMP_SOCIO_M_PARTICIPATION', 'Participation in Socio-Cultural Meets', 'Accumulated verified participation: PRISAA Nat=7, Reg=5, Local=2, NDEA=4, University=2 (capped at 20).', 20.00, 1, 1, 'PROPOSED'),
('50000003-0027-0000-0000-000000000004', '50000002-0027-0000-0000-000000000003', 'COMP_SOCIO_M_AWARDS', 'Awards Received in Socio-Cultural Events', 'Accumulated verified socio-cultural awards across PRISAA, NDEA (Silver=3), and University meets (capped at 15).', 15.00, 1, 1, 'PROPOSED');

-- 6. Evidence Mapping Rules for Outstanding Performance in Socio-Cultural - Male
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0027-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000001', '50000003-0027-0000-0000-000000000001', 'MAP_SOCIO_M_INDIV', 'Individual Socio-Cultural Skills Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 10, 'PROPOSED', 1),
('50000004-0027-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000001', '50000003-0027-0000-0000-000000000002', 'MAP_SOCIO_M_GROUP', 'Group Socio-Cultural Skills Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 20, 'PROPOSED', 1),
('50000004-0027-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000002', '50000003-0027-0000-0000-000000000003', 'MAP_SOCIO_M_PARTICIPATION', 'Socio-Cultural Meets Participation Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 10, 'PROPOSED', 1),
('50000004-0027-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000003', '50000003-0027-0000-0000-000000000004', 'MAP_SOCIO_M_AWARDS', 'Socio-Cultural Honors & Placements Mapping', '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', NULL, 10, 'PROPOSED', 1);

-- 7. Scoring Rules for Outstanding Performance in Socio-Cultural - Male
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0027-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000001', '50000003-0027-0000-0000-000000000001', 'RULE_SOCIO_M_INDIV', 'Individual Socio-Cultural Skills Rule', 'sum_capped', 10.00, 10.00, '{"fixed_presence_points": 10.0, "cap": 10.0, "max_points": 10.0}', 'PROPOSED', 1, 1),
('50000005-0027-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000001', '50000003-0027-0000-0000-000000000002', 'RULE_SOCIO_M_GROUP', 'Group Socio-Cultural Skills Rule', 'sum_capped', 10.00, 10.00, '{"fixed_presence_points": 10.0, "cap": 10.0, "max_points": 10.0}', 'PROPOSED', 1, 2),
('50000005-0027-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000002', '50000003-0027-0000-0000-000000000003', 'RULE_SOCIO_M_PARTICIPATION', 'Socio-Cultural Meets Participation Matrix Rule', 'sum_capped', 20.00, 20.00, '{"event_level_points": {"prisaa_national": 7.0, "prisaa_regional": 5.0, "prisaa_local": 2.0, "ndea": 4.0, "university_level": 2.0, "intramurals": 2.0}, "cap": 20.0, "max_points": 20.0}', 'PROPOSED', 1, 1),
('50000005-0027-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707327', '50000002-0027-0000-0000-000000000003', '50000003-0027-0000-0000-000000000004', 'RULE_SOCIO_M_AWARDS', 'Socio-Cultural Awards Matrix Rule', 'sum_capped', 15.00, 15.00, '{"medal_matrix": {"prisaa_national": {"gold": 7.0, "silver": 5.0, "bronze": 3.0}, "prisaa_regional": {"gold": 5.0, "silver": 3.0, "bronze": 2.0}, "prisaa_local": {"gold": 3.0, "silver": 2.0, "bronze": 1.0}, "ndea": {"gold": 4.0, "silver": 3.0, "bronze": 2.0}, "university_level": {"gold": 2.0, "silver": 1.0, "bronze": 1.0}, "intramurals": {"gold": 2.0, "silver": 1.0, "bronze": 1.0}}, "cap": 15.0, "max_points": 15.0}', 'PROPOSED', 1, 1);
