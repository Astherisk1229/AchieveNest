<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: 2026-08-30-000032_AddAwardScoringEngineRules.php
 * Domain: OSAD Awards & Scoring Criteria — Configurable Scoring Engine Rules
 * Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
 */
class AddAwardScoringEngineRules extends Migration
{
    public function up()
    {
        // 1. Extend award_scoring_rules table with versioning and authority metadata if not exists
        $columns = $this->db->getFieldNames('award_scoring_rules');
        if (! in_array('scoring_model_version_id', $columns, true)) {
            $this->db->query(<<<'SQL'
ALTER TABLE award_scoring_rules
    ADD COLUMN scoring_model_version_id CHAR(36) NULL AFTER criterion_id,
    ADD COLUMN criterion_component_id CHAR(36) NULL AFTER scoring_model_version_id,
    ADD COLUMN authority_status VARCHAR(50) NOT NULL DEFAULT 'OFFICIAL' AFTER rule_config,
    ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER authority_status,
    ADD COLUMN updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) AFTER created_at,
    ADD KEY idx_asr_version (scoring_model_version_id),
    ADD KEY idx_asr_component (criterion_component_id),
    ADD KEY idx_asr_active (is_active);
SQL);
        }

        // 2. Deterministic Backfill: Seed Scoring Rules for all 40 Criteria in v1.0 Scoring Models
        $this->db->query(<<<'SQL'
INSERT INTO award_scoring_rules (
    id,
    criterion_id,
    scoring_model_version_id,
    criterion_component_id,
    parent_rule_id,
    code,
    name,
    rule_type,
    points,
    max_points,
    rule_config,
    authority_status,
    sort_order,
    is_active,
    created_at,
    updated_at
)
SELECT 
    UUID() AS id,
    ac.id AS criterion_id,
    ac.scoring_model_version_id,
    NULL AS criterion_component_id,
    NULL AS parent_rule_id,
    CONCAT(ac.code, '_RULE_SCORE') AS code,
    CONCAT(ac.name, ' - Scoring Rule') AS name,
    CASE 
        WHEN ac.code LIKE '%SPORT%' OR ac.code LIKE '%ATHL%' THEN 'matrix_mapping'
        WHEN ac.code LIKE '%CULT%' OR ac.code LIKE '%PERF%' THEN 'matrix_mapping'
        WHEN ac.code LIKE '%JOURN%' OR ac.code LIKE '%PUB%' THEN 'matrix_mapping'
        WHEN ac.code LIKE '%LEAD%' OR ac.code LIKE '%GOV%' THEN 'sum_capped'
        ELSE 'sum_capped'
    END AS rule_type,
    15.00 AS points,
    ac.max_points,
    JSON_OBJECT(
        'points_per_record', 15.00,
        'cap', ac.max_points,
        'deduplicate_by_record', true
    ) AS rule_config,
    ac.authority_status,
    ac.sort_order,
    1 AS is_active,
    NOW(6) AS created_at,
    NOW(6) AS updated_at
FROM award_criteria ac
WHERE ac.scoring_model_version_id IS NOT NULL
ON DUPLICATE KEY UPDATE
    scoring_model_version_id = VALUES(scoring_model_version_id),
    rule_type = VALUES(rule_type),
    max_points = VALUES(max_points),
    rule_config = VALUES(rule_config),
    authority_status = VALUES(authority_status),
    is_active = VALUES(is_active);
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
DELETE FROM award_scoring_rules WHERE code LIKE '%_RULE_SCORE';
SQL);
    }
}
