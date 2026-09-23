-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000028_student_leader_award_remediation.sql
--
-- Phase 9: Outstanding Student Leader of the Year — Full Source-Fidelity Remediation
-- Exact 100-point official rubric, 50-point computable model, leadership involvement
-- accumulation (SSG=12, Collegiate=8, Club=6, Year Level=4, cap 30), leadership awards/
-- seminars (Int/Nat=4, Local=2, Citation=2, Seminar=2, cap 10), and community buckets
-- (School=4, Community=3, Church=3, cap 10). Annual Award cycle.
-- ============================================================================

-- 1. Reconcile Award Definition for Outstanding Student Leader of the Year
UPDATE `award_definitions` SET
    `code` = 'STUDENT_LEADER_OF_THE_YEAR',
    `name` = 'Outstanding Student Leader of the Year',
    `category` = 'leadership',
    `description` = 'Premier annual institutional leadership award honoring an exceptional student leader who manifests moral character, satisfactory academic performance with no failing grades, university/community impact, and organizational excellence.',
    `authority_status` = 'OFFICIAL',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 0,
    `gender_restriction` = NULL,
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000028';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `gender_requirement`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707328', '50000001-0000-0000-0000-000000000028', '1.0', 'v1.0 Published', 'published', 80.00, 0, NULL, 'OFFICIAL', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00, `graduating_only` = 0, `gender_requirement` = NULL;

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000028');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000028');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000028');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000028');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000028';

-- 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 50 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0028-0000-0000-000000000001', '50000001-0000-0000-0000-000000000028', '0f85b20c-a461-11f1-a155-08453f707328', 'CRIT_LEADER_YR_SCHOLASTIC', 'Scholastic Achievement', 15.00, 15.00, 1, 0, 'OFFICIAL', 1),
('50000002-0028-0000-0000-000000000002', '50000001-0000-0000-0000-000000000028', '0f85b20c-a461-11f1-a155-08453f707328', 'CRIT_LEADER_YR_LEADERSHIP', 'Leadership: On and Off Campus', 40.00, 40.00, 2, 1, 'OFFICIAL', 1),
('50000002-0028-0000-0000-000000000003', '50000001-0000-0000-0000-000000000028', '0f85b20c-a461-11f1-a155-08453f707328', 'CRIT_LEADER_YR_COMMUNITY', 'Community Involvement', 10.00, 10.00, 3, 1, 'OFFICIAL', 1),
('50000002-0028-0000-0000-000000000004', '50000001-0000-0000-0000-000000000028', '0f85b20c-a461-11f1-a155-08453f707328', 'CRIT_LEADER_YR_CHARACTER', 'Character', 20.00, 20.00, 4, 0, 'OFFICIAL', 1),
('50000002-0028-0000-0000-000000000005', '50000001-0000-0000-0000-000000000028', '0f85b20c-a461-11f1-a155-08453f707328', 'CRIT_LEADER_YR_INTERVIEW', 'Interview', 15.00, 15.00, 5, 0, 'OFFICIAL', 1);

-- 5. Criterion Components (40 Leadership + 10 Community = 50 Computable)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0028-0000-0000-000000000001', '50000002-0028-0000-0000-000000000002', 'COMP_LEADER_YR_INVOLVEMENT', 'Leadership Involvement', 'Accumulated verified leadership roles: SSG=12, Collegiate Council=8, Club=6, Year Level=4 (capped at 30).', 30.00, 1, 1, 'OFFICIAL'),
('50000003-0028-0000-0000-000000000002', '50000002-0028-0000-0000-000000000002', 'COMP_LEADER_YR_AWARDS_SEMINARS', 'Leadership Awards, Citations, and Seminars', 'Accumulated verified honors: Int/Nat Award=4, Local Award=2, Citation=2, Seminar=2 (capped at 10).', 10.00, 2, 1, 'OFFICIAL'),
('50000003-0028-0000-0000-000000000003', '50000002-0028-0000-0000-000000000003', 'COMP_LEADER_YR_COMMUNITY', 'Community Involvement Buckets', 'Verified community engagement: School/Univ=4, Community=3, Church=3 (presence-based, capped at 10).', 10.00, 1, 1, 'OFFICIAL');

-- 6. Evidence Mapping Rules for Outstanding Student Leader of the Year
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0028-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000002', '50000003-0028-0000-0000-000000000001', 'MAP_LEADER_YR_POS', 'Leadership Position Mapping', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', NULL, 10, 'OFFICIAL', 1),
('50000004-0028-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000002', '50000003-0028-0000-0000-000000000002', 'MAP_LEADER_YR_AWARDS', 'Leadership Honors & Citations Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 10, 'OFFICIAL', 1),
('50000004-0028-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000002', '50000003-0028-0000-0000-000000000002', 'MAP_LEADER_YR_SEMINARS', 'Leadership Seminars & Training Mapping', '802de57b-54d7-4d38-9433-052ca9636380', NULL, 20, 'OFFICIAL', 1),
('50000004-0028-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000003', '50000003-0028-0000-0000-000000000003', 'MAP_LEADER_YR_COMMUNITY', 'Community Service & Volunteerism Mapping', 'ace24637-66f7-4329-9451-ccc61e18eab9', NULL, 10, 'OFFICIAL', 1);

-- 7. Scoring Rules for Outstanding Student Leader of the Year
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0028-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000002', '50000003-0028-0000-0000-000000000001', 'RULE_LEADER_YR_INVOLVEMENT', 'Leadership Involvement Accumulation Rule', 'sum_capped', 30.00, 30.00, '{"level_points": {"ssg_university": 12.0, "collegiate_council": 8.0, "club_organization": 6.0, "year_level": 4.0}, "cap": 30.0, "max_points": 30.0}', 'OFFICIAL', 1, 1),
('50000005-0028-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000002', '50000003-0028-0000-0000-000000000002', 'RULE_LEADER_YR_AWARDS_SEMINARS', 'Leadership Awards & Seminars Matrix Rule', 'sum_capped', 10.00, 10.00, '{"type_points": {"international_national_award": 4.0, "local_award": 2.0, "leadership_citation": 2.0, "leadership_seminar": 2.0}, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 2),
('50000005-0028-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707328', '50000002-0028-0000-0000-000000000003', '50000003-0028-0000-0000-000000000003', 'RULE_LEADER_YR_COMMUNITY', 'Community Involvement Presence Buckets Rule', 'sum_capped', 10.00, 10.00, '{"bucket_points": {"school_university_based": 4.0, "community_based": 3.0, "church_based": 3.0}, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 1);
