-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000020_award_catalog_runtime_cleanup_and_quarantine.sql
--
-- Phase 1A: Catalog Runtime Cleanup & Legacy Award Quarantine
-- Additive columns: source_fidelity_status, is_catalog_visible.
-- Quarantines non-source legacy award rows while preserving 100% historical FK integrity.
-- Establishes Authoritative 15-Award Master Baseline with explicit remediation states.
-- ============================================================================

-- 1. Add additive columns to award_definitions if not already present
SET @col_sfs_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_definitions' AND COLUMN_NAME = 'source_fidelity_status');
SET @sql_sfs := IF(@col_sfs_exists = 0, 'ALTER TABLE `award_definitions` ADD COLUMN `source_fidelity_status` VARCHAR(50) NOT NULL DEFAULT \'PENDING_RECONCILIATION\' AFTER `authority_status`', 'SELECT 1');
PREPARE stmt_sfs FROM @sql_sfs;
EXECUTE stmt_sfs;
DEALLOCATE PREPARE stmt_sfs;

SET @col_icv_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'award_definitions' AND COLUMN_NAME = 'is_catalog_visible');
SET @sql_icv := IF(@col_icv_exists = 0, 'ALTER TABLE `award_definitions` ADD COLUMN `is_catalog_visible` TINYINT(1) NOT NULL DEFAULT 1 AFTER `source_fidelity_status`', 'SELECT 1');
PREPARE stmt_icv FROM @sql_icv;
EXECUTE stmt_icv;
DEALLOCATE PREPARE stmt_icv;

-- 2. Mark Notre Dame Award as VERIFIED
UPDATE `award_definitions` SET
    `source_fidelity_status` = 'VERIFIED',
    `is_catalog_visible` = 1,
    `status` = 'active',
    `authority_status` = 'OFFICIAL'
WHERE `id` = '50000001-0000-0000-0000-000000000001';

-- 3. Quarantine Legacy / Non-Source / Ambiguous Placeholder Award Rows (Preserve DB rows & FKs, hide from active catalog)
UPDATE `award_definitions` SET
    `source_fidelity_status` = 'LEGACY_QUARANTINED',
    `is_catalog_visible` = 0,
    `status` = 'archived'
WHERE `code` IN (
    'ACADEMIC_EXCELLENCE',
    'DEANS_MEDAL_OF_DISTINCTION',
    'LOYALTY_AWARD',
    'PRESIDENTS_MEDAL_OF_EXCELLENCE',
    'RESEARCH_AND_INNOVATION',
    'OUTSTANDING_CHURCH_MINISTRY',
    'OUTSTANDING_EXTRA_CURRICULAR',
    'OUTSTANDING_LEADERSHIP',
    'OUTSTANDING_COMMUNITY_SERVICE',
    'OUTSTANDING_CAMPUS_JOURNALISM',
    'OUTSTANDING_ATHLETE_MALE',
    'OUTSTANDING_ATHLETE_FEMALE',
    'OUTSTANDING_CULTURAL_ARTIST',
    'OUTSTANDING_CO_CURRICULAR'
);

-- 4. Ensure Authoritative Baseline Awards Exist with Correct Progress States
-- SMC Award (AWD 02)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000021', 'SMC_AWARD', 'Saint Marcellin Champagnat (SMC) Award', 'service',
    'Premier graduating award recognizing exceptional Christian leadership, apostolic zeal, Marist spirituality, and service to Church and community.',
    80.00, 1, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Leadership Award (AWD 03)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000022', 'LEADERSHIP_AWARD', 'Leadership Award', 'leadership',
    'Graduating award honoring outstanding governance, club leadership, and university-wide service leadership.',
    80.00, 1, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Campus Journalism Award (AWD 04)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000023', 'CAMPUS_JOURNALISM_AWARD', 'Campus Journalism Award', 'journalism',
    'Graduating award honoring editorial excellence, investigative journalism, and campus publication management.',
    80.00, 1, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Performance in Sports - Female (AWD 05)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000024', 'SPORTS_AWARD_FEMALE', 'Outstanding Performance in Sports - Female', 'sports',
    'Graduating honor for exemplary athletic prowess, varsity competition performance, sportsmanship, and academic balance (Female).',
    80.00, 'female', 1, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Performance in Sports - Male (AWD 06)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000025', 'SPORTS_AWARD_MALE', 'Outstanding Performance in Sports - Male', 'sports',
    'Graduating honor for exemplary athletic prowess, varsity competition performance, sportsmanship, and academic balance (Male).',
    80.00, 'male', 1, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Performance in Socio-Cultural - Female (AWD 07)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000026', 'SOCIO_CULTURAL_AWARD_FEMALE', 'Outstanding Performance in Socio-Cultural - Female', 'culture',
    'Graduating honor for artistic brilliance, cultural troupe performance, music/theatre showcases, and cultural leadership (Female).',
    80.00, 'female', 1, 'active', 'PROPOSED', 'PROPOSED_PENDING_APPROVAL', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Performance in Socio-Cultural - Male (AWD 08)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000027', 'SOCIO_CULTURAL_AWARD_MALE', 'Outstanding Performance in Socio-Cultural - Male', 'culture',
    'Graduating honor for artistic brilliance, cultural troupe performance, music/theatre showcases, and cultural leadership (Male).',
    80.00, 'male', 1, 'active', 'PROPOSED', 'PROPOSED_PENDING_APPROVAL', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Student Leader of the Year (AWD 09)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000028', 'STUDENT_LEADER_OF_THE_YEAR', 'Outstanding Student Leader of the Year', 'leadership',
    'Annual non-graduating recognition for active student leadership, governance, and community involvement during the academic year.',
    80.00, 0, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Member of the Year (AWD 10)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000029', 'MEMBER_OF_THE_YEAR', 'Outstanding Member of the Year', 'leadership',
    'Annual recognition honoring exemplary membership commitment, active involvement, and substantial organizational contribution.',
    80.00, 0, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Volunteer of the Year (AWD 11)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000030', 'VOLUNTEER_OF_THE_YEAR', 'Outstanding Volunteer of the Year', 'service',
    'Annual recognition celebrating selflessness, community service, disaster outreach, and social ministry volunteerism.',
    80.00, 0, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Athlete of the Year - Female (AWD 12)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000031', 'ATHLETE_OF_THE_YEAR_FEMALE', 'Outstanding Athlete of the Year - Female', 'sports',
    'Annual athletic award for top performance in university and national tournaments during the academic year (Female).',
    80.00, 'female', 0, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Athlete of the Year - Male (AWD 13)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000032', 'ATHLETE_OF_THE_YEAR_MALE', 'Outstanding Athlete of the Year - Male', 'sports',
    'Annual athletic award for top performance in university and national tournaments during the academic year (Male).',
    80.00, 'male', 0, 'active', 'OFFICIAL', 'PENDING_RECONCILIATION', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Performer of the Year - Female (AWD 14)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000033', 'PERFORMER_OF_THE_YEAR_FEMALE', 'Outstanding Performer of the Year - Female', 'culture',
    'Annual socio-cultural award honoring highest artistic achievement in performing arts during the academic year (Female).',
    80.00, 'female', 0, 'active', 'PROPOSED', 'PROPOSED_PENDING_APPROVAL', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';

-- Outstanding Performer of the Year - Male (AWD 15)
INSERT INTO `award_definitions` (
    `id`, `code`, `name`, `category`, `description`, `candidate_threshold_percent`, `gender_restriction`, `graduating_only`, `status`, `authority_status`, `source_fidelity_status`, `is_catalog_visible`, `active_scoring_version`
) VALUES (
    '50000001-0000-0000-0000-000000000034', 'PERFORMER_OF_THE_YEAR_MALE', 'Outstanding Performer of the Year - Male', 'culture',
    'Annual socio-cultural award honoring highest artistic achievement in performing arts during the academic year (Male).',
    80.00, 'male', 0, 'active', 'PROPOSED', 'PROPOSED_PENDING_APPROVAL', 1, '1.0'
) ON DUPLICATE KEY UPDATE
    `code` = VALUES(`code`), `name` = VALUES(`name`), `authority_status` = VALUES(`authority_status`), `source_fidelity_status` = VALUES(`source_fidelity_status`), `is_catalog_visible` = 1, `status` = 'active';
