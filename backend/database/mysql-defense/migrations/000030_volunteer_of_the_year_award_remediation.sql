-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000030_volunteer_of_the_year_award_remediation.sql
--
-- Phase 11: Outstanding Volunteer of the Year — Full Source-Fidelity Remediation
-- Exact 100-point official rubric, 50-point computable model, church involvement
-- (School=5, Community=5, Church=5, cap 15), initiated church activities
-- (School=5, Community=5, Church=5, cap 15), volunteerism citations (2 each, cap 10),
-- leadership involvement (SSG/Collegiate=3, Club=2, cap 5), and leadership awards/citations
-- (Int/Nat=3, Local=2, cap 5, no seminar points). Annual Award cycle.
-- ============================================================================

-- 1. Reconcile Award Definition for Outstanding Volunteer of the Year
UPDATE `award_definitions` SET
    `code` = 'VOLUNTEER_OF_THE_YEAR',
    `name` = 'Outstanding Volunteer of the Year',
    `category` = 'community',
    `description` = 'Premier annual institutional award honoring an exceptional student who has excelled in volunteerism work, community extension programs, and church/ministry engagement while maintaining moral character and academic performance.',
    `authority_status` = 'OFFICIAL',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 0,
    `gender_restriction` = NULL,
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000030';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `gender_requirement`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707330', '50000001-0000-0000-0000-000000000030', '1.0', 'v1.0 Published', 'published', 80.00, 0, NULL, 'OFFICIAL', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00, `graduating_only` = 0, `gender_requirement` = NULL;

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000030');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000030');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000030');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000030');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000030';

-- 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 50 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0030-0000-0000-000000000001', '50000001-0000-0000-0000-000000000030', '0f85b20c-a461-11f1-a155-08453f707330', 'CRIT_VOLUNTEER_YR_SCHOLASTIC', 'Scholastic Achievement', 15.00, 15.00, 1, 0, 'OFFICIAL', 1),
('50000002-0030-0000-0000-000000000002', '50000001-0000-0000-0000-000000000030', '0f85b20c-a461-11f1-a155-08453f707330', 'CRIT_VOLUNTEER_YR_VOLUNTEERISM', 'Volunteerism: On and Off Campus', 40.00, 40.00, 2, 1, 'OFFICIAL', 1),
('50000002-0030-0000-0000-000000000003', '50000001-0000-0000-0000-000000000030', '0f85b20c-a461-11f1-a155-08453f707330', 'CRIT_VOLUNTEER_YR_LEADERSHIP', 'Leadership', 10.00, 10.00, 3, 1, 'OFFICIAL', 1),
('50000002-0030-0000-0000-000000000004', '50000001-0000-0000-0000-000000000030', '0f85b20c-a461-11f1-a155-08453f707330', 'CRIT_VOLUNTEER_YR_CHARACTER', 'Character', 20.00, 20.00, 4, 0, 'OFFICIAL', 1),
('50000002-0030-0000-0000-000000000005', '50000001-0000-0000-0000-000000000030', '0f85b20c-a461-11f1-a155-08453f707330', 'CRIT_VOLUNTEER_YR_INTERVIEW', 'Interview', 15.00, 15.00, 5, 0, 'OFFICIAL', 1);

-- 5. Criterion Components (40 Volunteerism + 10 Leadership = 50 Computable)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0030-0000-0000-000000000001', '50000002-0030-0000-0000-000000000002', 'COMP_VOLUNTEER_YR_CHURCH_INVOLVEMENT', 'Church Involvement - Ministries / Organizations', 'Verified church/ministry engagement: School=5, Community=5, Church=5 (presence-based, capped at 15).', 15.00, 1, 1, 'OFFICIAL'),
('50000003-0030-0000-0000-000000000002', '50000002-0030-0000-0000-000000000002', 'COMP_VOLUNTEER_YR_INITIATED_ACTIVITIES', 'Initiated Church-Related Activities', 'Verified initiated/lead outreach: School=5, Community=5, Church=5 (active-role presence, capped at 15).', 15.00, 2, 1, 'OFFICIAL'),
('50000003-0030-0000-0000-000000000003', '50000002-0030-0000-0000-000000000002', 'COMP_VOLUNTEER_YR_CITATIONS', 'Citations Received', 'Verified community service/volunteerism citations: 2.0 pts each (capped at 10).', 10.00, 3, 1, 'OFFICIAL'),
('50000003-0030-0000-0000-000000000004', '50000002-0030-0000-0000-000000000003', 'COMP_VOLUNTEER_YR_LEAD_INVOLVEMENT', 'Leadership Involvement', 'Verified leadership roles: SSG/Collegiate Council=3, Club=2 (capped at 5).', 5.00, 1, 1, 'OFFICIAL'),
('50000003-0030-0000-0000-000000000005', '50000002-0030-0000-0000-000000000003', 'COMP_VOLUNTEER_YR_LEAD_AWARDS', 'Leadership Awards & Citations', 'Verified leadership recognition: Int/Nat Award=3, Local Award/Citation=2 (capped at 5).', 5.00, 2, 1, 'OFFICIAL');

-- 6. Evidence Mapping Rules for Outstanding Volunteer of the Year
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0030-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000002', '50000003-0030-0000-0000-000000000001', 'MAP_VOLUNTEER_YR_CHURCH', 'Church & Ministry Involvement Mapping', '779a9653-d972-47ce-93dc-cb381150568b', NULL, 10, 'OFFICIAL', 1),
('50000004-0030-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000002', '50000003-0030-0000-0000-000000000002', 'MAP_VOLUNTEER_YR_COMMUNITY', 'Community Service Initiated Activities Mapping', 'ace24637-66f7-4329-9451-ccc61e18eab9', NULL, 20, 'OFFICIAL', 1),
('50000004-0030-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000002', '50000003-0030-0000-0000-000000000003', 'MAP_VOLUNTEER_YR_CITATIONS', 'Volunteerism Citations Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 10, 'OFFICIAL', 1),
('50000004-0030-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000003', '50000003-0030-0000-0000-000000000004', 'MAP_VOLUNTEER_YR_LEAD_POS', 'Leadership Position Mapping', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', NULL, 10, 'OFFICIAL', 1),
('50000004-0030-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000003', '50000003-0030-0000-0000-000000000005', 'MAP_VOLUNTEER_YR_LEAD_AWARDS', 'Leadership Citations & Awards Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 20, 'OFFICIAL', 1);

-- 7. Scoring Rules for Outstanding Volunteer of the Year
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0030-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000002', '50000003-0030-0000-0000-000000000001', 'RULE_VOLUNTEER_YR_CHURCH', 'Church Involvement Context Buckets Rule', 'sum_capped', 15.00, 15.00, '{"bucket_points": {"school_based": 5.0, "community_based": 5.0, "church_based": 5.0}, "cap": 15.0, "max_points": 15.0}', 'OFFICIAL', 1, 1),
('50000005-0030-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000002', '50000003-0030-0000-0000-000000000002', 'RULE_VOLUNTEER_YR_INITIATED', 'Initiated Activities Context Buckets Rule', 'sum_capped', 15.00, 15.00, '{"bucket_points": {"school_based": 5.0, "community_based": 5.0, "church_based": 5.0}, "cap": 15.0, "max_points": 15.0}', 'OFFICIAL', 1, 2),
('50000005-0030-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000002', '50000003-0030-0000-0000-000000000003', 'RULE_VOLUNTEER_YR_CITATIONS', 'Volunteerism Citations Rule', 'sum_capped', 10.00, 10.00, '{"points_per_item": 2.0, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 3),
('50000005-0030-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000003', '50000003-0030-0000-0000-000000000004', 'RULE_VOLUNTEER_YR_LEAD_INVOLVEMENT', 'Leadership Involvement Rule', 'sum_capped', 5.00, 5.00, '{"level_points": {"ssg_collegiate_council": 3.0, "club": 2.0}, "cap": 5.0, "max_points": 5.0}', 'OFFICIAL', 1, 1),
('50000005-0030-0000-0000-000000000005', '0f85b20c-a461-11f1-a155-08453f707330', '50000002-0030-0000-0000-000000000003', '50000003-0030-0000-0000-000000000005', 'RULE_VOLUNTEER_YR_LEAD_AWARDS', 'Leadership Citations & Awards Rule', 'sum_capped', 5.00, 5.00, '{"type_points": {"international_national_award": 3.0, "local_award_citation": 2.0}, "cap": 5.0, "max_points": 5.0}', 'OFFICIAL', 1, 2);
