-- ============================================================================
-- AchieveNest MySQL Defense Migration
-- 000015_award_evidence_mapping_rules.sql
--
-- Phase D: Evidence Mapping & Duplicate-Safe Rule Matching
-- Additive schema for versioned evidence mapping rules and condition predicates.
-- ============================================================================

-- 1. Create award_evidence_mapping_rules table
CREATE TABLE IF NOT EXISTS `award_evidence_mapping_rules` (
    `id` CHAR(36) NOT NULL,
    `scoring_model_version_id` CHAR(36) NOT NULL,
    `criterion_id` CHAR(36) NOT NULL,
    `criterion_component_id` CHAR(36) NULL,
    `rule_code` VARCHAR(100) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `portfolio_category_id` CHAR(36) NOT NULL,
    `portfolio_subcategory_id` CHAR(36) NULL,
    `authority_status` VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL',
    `priority` INT NOT NULL DEFAULT 1,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_aemr_version` (`scoring_model_version_id`),
    KEY `idx_aemr_criterion` (`criterion_id`),
    KEY `idx_aemr_component` (`criterion_component_id`),
    KEY `idx_aemr_category` (`portfolio_category_id`),
    KEY `idx_aemr_subcategory` (`portfolio_subcategory_id`),
    KEY `idx_aemr_active` (`is_active`),
    CONSTRAINT `fk_aemr_version` FOREIGN KEY (`scoring_model_version_id`) REFERENCES `award_scoring_model_versions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_aemr_criterion` FOREIGN KEY (`criterion_id`) REFERENCES `award_criteria` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_aemr_component` FOREIGN KEY (`criterion_component_id`) REFERENCES `award_criterion_components` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_aemr_category` FOREIGN KEY (`portfolio_category_id`) REFERENCES `portfolio_categories` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Create award_evidence_mapping_conditions table
CREATE TABLE IF NOT EXISTS `award_evidence_mapping_conditions` (
    `id` CHAR(36) NOT NULL,
    `mapping_rule_id` CHAR(36) NOT NULL,
    `field_key` VARCHAR(100) NOT NULL,
    `operator` VARCHAR(20) NOT NULL DEFAULT 'EQ',
    `comparison_value` TEXT NULL,
    `group_number` INT NOT NULL DEFAULT 1,
    `display_order` INT NOT NULL DEFAULT 1,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (`id`),
    KEY `idx_aemc_rule` (`mapping_rule_id`),
    KEY `idx_aemc_field` (`field_key`),
    CONSTRAINT `fk_aemc_rule` FOREIGN KEY (`mapping_rule_id`) REFERENCES `award_evidence_mapping_rules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Deterministic Backfill: Generate Evidence Mapping Rules for all 40 Criteria in v1.0 Scoring Models
-- Journalism rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_JOURN'), CONCAT(ac.`name`, ' - Journalism Evidence'),
    '2b09cd61-7a23-4466-be58-889398e8f201', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%JOURN%' OR ac.`code` LIKE '%PUB%';

-- Sports rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_SPORTS'), CONCAT(ac.`name`, ' - Sports Evidence'),
    '2d20d412-bf34-46b4-a21d-d7131d4b514a', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%SPORT%' OR ac.`code` LIKE '%ATHL%';

-- Socio-Cultural Performing Arts rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_CULT'), CONCAT(ac.`name`, ' - Socio-Cultural Evidence'),
    '6514e620-b5a0-4ff2-9353-0ee8787b5ce6', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%CULT%' OR ac.`code` LIKE '%ART%' OR ac.`code` LIKE '%PERF%';

-- Church Ministry Involvement rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_MINISTRY'), CONCAT(ac.`name`, ' - Ministry Evidence'),
    '779a9653-d972-47ce-93dc-cb381150568b', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%MINISTRY%' OR ac.`code` LIKE '%LOYAL_COMM%';

-- Community Service Volunteerism rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_COMMUNITY'), CONCAT(ac.`name`, ' - Community Service Evidence'),
    'ace24637-66f7-4329-9451-ccc61e18eab9', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%COMMUNITY%' OR ac.`code` LIKE '%SERVICE%' OR ac.`code` LIKE '%VOL%' OR ac.`code` LIKE '%PRES_SERVICE%' OR ac.`code` LIKE '%LEAD_COMM%';

-- Organization Membership / Participation rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_ORG'), CONCAT(ac.`name`, ' - Organization Evidence'),
    'c9a6d837-78f4-4516-b2db-d438ae717be5', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%COCURR%' OR ac.`code` LIKE '%EXTR%';

-- Seminar / Training rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_SEMINAR'), CONCAT(ac.`name`, ' - Seminar Evidence'),
    '802de57b-54d7-4d38-9433-052ca9636380', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%DEVELOPMENT%' OR ac.`code` LIKE '%SEMINAR%' OR ac.`code` LIKE '%CONFERENCE%' OR ac.`code` LIKE '%ACAD_COMPETITION%';

-- Citation & Recognition rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_CITATION'), CONCAT(ac.`name`, ' - Citation / Recognition Evidence'),
    '448beadb-a254-4cb6-84fb-a3d5f4f8822e', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%ACAD%' OR ac.`code` LIKE '%RES%' OR ac.`code` LIKE '%RECOG%' OR ac.`code` LIKE '%MERIT%' OR ac.`code` LIKE '%HOLISTIC%' OR ac.`code` LIKE '%AWARDS%';

-- Leadership Position rules
INSERT INTO `award_evidence_mapping_rules` (`id`, `scoring_model_version_id`, `criterion_id`, `rule_code`, `name`, `portfolio_category_id`, `authority_status`, `priority`, `is_active`)
SELECT 
    UUID(), ac.`scoring_model_version_id`, ac.`id`, CONCAT(ac.`code`, '_MAP_LEAD'), CONCAT(ac.`name`, ' - Leadership Evidence'),
    '8461c4f3-3f7d-4e1a-a5ff-c4c5941ef646', ac.`authority_status`, 1, 1
FROM `award_criteria` ac
WHERE ac.`code` LIKE '%LEAD%' OR ac.`code` LIKE '%GOV%' OR ac.`code` LIKE '%PRES_LEAD%' OR ac.`code` LIKE '%DEAN_SERVICE%';
