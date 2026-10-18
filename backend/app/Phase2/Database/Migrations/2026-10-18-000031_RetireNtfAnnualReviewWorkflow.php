<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Removes NTF annual-review configuration while retaining any historical review payloads. */
final class RetireNtfAnnualReviewWorkflow extends Migration
{
    public function up()
    {
        $this->forge->dropTable('personnel_annual_review_settings', true);

        // Keep legacy data intact if a deployment already contains NTF workbook imports.
        $hasNtfPayloadData = $this->db->fieldExists('area_a_payload', 'personnel_annual_review_imports')
            && $this->db->table('personnel_annual_review_imports')->where('area_a_payload IS NOT NULL', null, false)->countAllResults() > 0;
        if (! $hasNtfPayloadData && $this->db->fieldExists('area_a_payload', 'personnel_annual_review_imports')) {
            $this->db->query('ALTER TABLE personnel_annual_review_imports DROP COLUMN area_a_payload');
        }

        $hasLegacyNtfItems = $this->db->table('personnel_evaluation_items')->where('domain', 'ntf_annual_review')->countAllResults() > 0;
        if (! $hasLegacyNtfItems) $this->replaceDomainCheck(['professional_development', 'productivity_creative_work', 'service_leadership']);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS personnel_annual_review_settings (
    id CHAR(36) NOT NULL PRIMARY KEY,
    personnel_group VARCHAR(30) NOT NULL,
    setting_key VARCHAR(50) NOT NULL,
    version INT NOT NULL,
    value_json JSON NOT NULL,
    change_reason VARCHAR(500) NULL,
    created_by CHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_annual_review_setting_version (personnel_group, setting_key, version),
    KEY idx_annual_review_setting_lookup (personnel_group, setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);
        if (! $this->db->fieldExists('area_a_payload', 'personnel_annual_review_imports')) {
            $this->db->query('ALTER TABLE personnel_annual_review_imports ADD COLUMN area_a_payload JSON NULL AFTER two_review_reason');
        }
        $this->replaceDomainCheck(['professional_development', 'productivity_creative_work', 'service_leadership', 'ntf_annual_review']);
    }

    private function replaceDomainCheck(array $domains): void
    {
        $exists = $this->db->query("SELECT COUNT(*) AS c FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel_evaluation_items' AND CONSTRAINT_NAME = 'ck_evaluation_items_domain'")->getRowArray();
        if ((int) ($exists['c'] ?? 0) > 0) $this->db->query('ALTER TABLE personnel_evaluation_items DROP CHECK ck_evaluation_items_domain');
        $list = implode(',', array_map(fn (string $domain) => $this->db->escape($domain), $domains));
        $this->db->query("ALTER TABLE personnel_evaluation_items ADD CONSTRAINT ck_evaluation_items_domain CHECK (domain IN ({$list}))");
    }
}
