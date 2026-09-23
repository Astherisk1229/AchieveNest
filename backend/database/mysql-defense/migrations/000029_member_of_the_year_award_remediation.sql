-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000029_member_of_the_year_award_remediation.sql
--
-- Phase 10: Outstanding Member of the Year — Full Source-Fidelity Remediation
-- Exact 100-point official rubric, 40-point computable model, membership involvement
-- (activity=2, outreach=3, co-curricular=3, committee=4, sustained=5, cap 20),
-- important contribution (support=2, committee resp=3, organizer=4, major=5, cap 10),
-- leadership involvement (SSG/Collegiate=3, Club=2, cap 5), and leadership awards/citations
-- (Int/Nat=3, Local=2, cap 5, no seminar points). Annual Award cycle.
-- ============================================================================

-- 1. Reconcile Award Definition for Outstanding Member of the Year
UPDATE `award_definitions` SET
    `code` = 'MEMBER_OF_THE_YEAR',
    `name` = 'Outstanding Member of the Year',
    `category` = 'organization',
    `description` = 'Premier annual institutional award honoring an active member of a recognized student organization who has manifested outstanding membership commitment, significant contribution, leadership, and moral character.',
    `authority_status` = 'OFFICIAL',
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `graduating_only` = 0,
    `gender_restriction` = NULL,
    `candidate_threshold_percent` = 80.00,
    `status` = 'active',
    `active_scoring_version` = '1.0'
WHERE `id` = '50000001-0000-0000-0000-000000000029';

-- 2. Published Scoring Model Version v1.0
INSERT INTO `award_scoring_model_versions` (
    `id`, `award_definition_id`, `version_number`, `version_label`, `status`, `candidate_threshold_percent`, `graduating_only`, `gender_requirement`, `authority_status`, `published_at`
) VALUES (
    '0f85b20c-a461-11f1-a155-08453f707329', '50000001-0000-0000-0000-000000000029', '1.0', 'v1.0 Published', 'published', 80.00, 0, NULL, 'OFFICIAL', '2026-08-30 00:00:00'
) ON DUPLICATE KEY UPDATE
    `version_label` = VALUES(`version_label`), `status` = 'published', `candidate_threshold_percent` = 80.00, `graduating_only` = 0, `gender_requirement` = NULL;

-- 3. Clear Existing Sub-Records for Clean Idempotent Seeding
DELETE FROM `student_award_criterion_scores` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000029');
DELETE FROM `award_scoring_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000029');
DELETE FROM `award_evidence_mapping_rules` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000029');
DELETE FROM `award_criterion_components` WHERE `criterion_id` IN (SELECT `id` FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000029');
DELETE FROM `award_criteria` WHERE `award_definition_id` = '50000001-0000-0000-0000-000000000029';

-- 4. Re-insert 5 Official Criteria (Total 100 pts, Computable 40 pts)
INSERT INTO `award_criteria` (
    `id`, `award_definition_id`, `scoring_model_version_id`, `code`, `name`, `weight`, `max_points`, `sort_order`, `is_portfolio_computable`, `authority_status`, `is_published`
) VALUES
('50000002-0029-0000-0000-000000000001', '50000001-0000-0000-0000-000000000029', '0f85b20c-a461-11f1-a155-08453f707329', 'CRIT_MEMBER_YR_SCHOLASTIC', 'Scholastic Achievement', 15.00, 15.00, 1, 0, 'OFFICIAL', 1),
('50000002-0029-0000-0000-000000000002', '50000001-0000-0000-0000-000000000029', '0f85b20c-a461-11f1-a155-08453f707329', 'CRIT_MEMBER_YR_MEMBERSHIP_QUALITY', 'Quality of Membership Involvement', 40.00, 30.00, 2, 1, 'OFFICIAL', 1),
('50000002-0029-0000-0000-000000000003', '50000001-0000-0000-0000-000000000029', '0f85b20c-a461-11f1-a155-08453f707329', 'CRIT_MEMBER_YR_LEADERSHIP', 'Leadership', 10.00, 10.00, 3, 1, 'OFFICIAL', 1),
('50000002-0029-0000-0000-000000000004', '50000001-0000-0000-0000-000000000029', '0f85b20c-a461-11f1-a155-08453f707329', 'CRIT_MEMBER_YR_CHARACTER', 'Character', 20.00, 20.00, 4, 0, 'OFFICIAL', 1),
('50000002-0029-0000-0000-000000000005', '50000001-0000-0000-0000-000000000029', '0f85b20c-a461-11f1-a155-08453f707329', 'CRIT_MEMBER_YR_INTERVIEW', 'Interview', 15.00, 15.00, 5, 0, 'OFFICIAL', 1);

-- 5. Criterion Components (30 Membership Quality + 10 Leadership = 40 Computable)
INSERT INTO `award_criterion_components` (
    `id`, `criterion_id`, `code`, `name`, `description`, `max_points`, `sort_order`, `is_computable`, `authority_status`
) VALUES
('50000003-0029-0000-0000-000000000001', '50000002-0029-0000-0000-000000000002', 'COMP_MEMBER_YR_INVOLVEMENT', 'Membership Involvement and Participation', 'Documented participation: activity=2, outreach=3, extra/co-curricular=3, committee=4, sustained=5 (capped at 20).', 20.00, 1, 1, 'OFFICIAL'),
('50000003-0029-0000-0000-000000000002', '50000002-0029-0000-0000-000000000002', 'COMP_MEMBER_YR_CONTRIBUTION', 'Important Contribution to the Organization', 'Documented responsibility: support=2, committee responsibility=3, organizer=4, major project=5 (capped at 10).', 10.00, 2, 1, 'OFFICIAL'),
('50000003-0029-0000-0000-000000000003', '50000002-0029-0000-0000-000000000003', 'COMP_MEMBER_YR_LEAD_INVOLVEMENT', 'Leadership Involvement', 'Verified leadership roles: SSG/Collegiate Council=3, Club/Org=2 (capped at 5).', 5.00, 1, 1, 'OFFICIAL'),
('50000003-0029-0000-0000-000000000004', '50000002-0029-0000-0000-000000000003', 'COMP_MEMBER_YR_LEAD_AWARDS', 'Leadership Awards & Citations', 'Verified leadership recognition: Int/Nat Award=3, Local Award/Citation=2 (capped at 5).', 5.00, 2, 1, 'OFFICIAL');

-- 6. Evidence Mapping Rules for Outstanding Member of the Year
INSERT INTO `award_evidence_mapping_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `rule_code`, `name`, `portfolio_category_id`, `portfolio_subcategory_id`, `priority`, `authority_status`, `is_active`
) VALUES
('50000004-0029-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000002', '50000003-0029-0000-0000-000000000001', 'MAP_MEMBER_YR_INVOLVEMENT', 'Organization Membership & Participation Mapping', 'c9a6d837-78f4-4516-b2db-d438ae717be5', NULL, 10, 'OFFICIAL', 1),
('50000004-0029-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000002', '50000003-0029-0000-0000-000000000002', 'MAP_MEMBER_YR_CONTRIBUTION', 'Organization Contribution Mapping', 'c9a6d837-78f4-4516-b2db-d438ae717be5', NULL, 20, 'OFFICIAL', 1),
('50000004-0029-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000003', '50000003-0029-0000-0000-000000000003', 'MAP_MEMBER_YR_LEAD_POS', 'Leadership Position Mapping', '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', NULL, 10, 'OFFICIAL', 1),
('50000004-0029-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000003', '50000003-0029-0000-0000-000000000004', 'MAP_MEMBER_YR_LEAD_AWARDS', 'Leadership Citations & Awards Mapping', '448beadb-a254-4cb6-84fb-a3d5f4f8822e', NULL, 10, 'OFFICIAL', 1);

-- 7. Scoring Rules for Outstanding Member of the Year
INSERT INTO `award_scoring_rules` (
    `id`, `scoring_model_version_id`, `criterion_id`, `criterion_component_id`, `code`, `name`, `rule_type`, `points`, `max_points`, `rule_config`, `authority_status`, `is_active`, `sort_order`
) VALUES
('50000005-0029-0000-0000-000000000001', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000002', '50000003-0029-0000-0000-000000000001', 'RULE_MEMBER_YR_INVOLVEMENT', 'Membership Involvement Participation Rule', 'sum_capped', 20.00, 20.00, '{"type_points": {"activity_program": 2.0, "outreach_extension": 3.0, "extra_co_curricular": 3.0, "committee_involvement": 4.0, "sustained_participation": 5.0}, "cap": 20.0, "max_points": 20.0}', 'OFFICIAL', 1, 1),
('50000005-0029-0000-0000-000000000002', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000002', '50000003-0029-0000-0000-000000000002', 'RULE_MEMBER_YR_CONTRIBUTION', 'Important Contribution Responsibility Rule', 'sum_capped', 10.00, 10.00, '{"role_points": {"contributor_support": 2.0, "committee_responsibility": 3.0, "facilitator_organizer": 4.0, "major_project_responsibility": 5.0}, "cap": 10.0, "max_points": 10.0}', 'OFFICIAL', 1, 2),
('50000005-0029-0000-0000-000000000003', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000003', '50000003-0029-0000-0000-000000000003', 'RULE_MEMBER_YR_LEAD_INVOLVEMENT', 'Leadership Involvement Rule', 'sum_capped', 5.00, 5.00, '{"level_points": {"ssg_collegiate_council": 3.0, "club_organization": 2.0}, "cap": 5.0, "max_points": 5.0}', 'OFFICIAL', 1, 1),
('50000005-0029-0000-0000-000000000004', '0f85b20c-a461-11f1-a155-08453f707329', '50000002-0029-0000-0000-000000000003', '50000003-0029-0000-0000-000000000004', 'RULE_MEMBER_YR_LEAD_AWARDS', 'Leadership Citations & Awards Rule', 'sum_capped', 5.00, 5.00, '{"type_points": {"international_national_award": 3.0, "local_award_citation": 2.0}, "cap": 5.0, "max_points": 5.0}', 'OFFICIAL', 1, 2);
