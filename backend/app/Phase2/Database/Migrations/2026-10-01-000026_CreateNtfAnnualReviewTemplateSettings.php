<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Non-Teaching Faculty annual-review workbook support.
 *
 * - personnel_annual_review_settings: append-only, versioned HR settings. The newest version of a
 *   (personnel_group, setting_key) pair is active; older versions stay as history. Two keys are used:
 *   `rating_scale` (percentage bands → verbal rating, with a passing flag per band) and
 *   `signatories` (role/configuration-driven signature lines per organizational context).
 * - personnel_annual_review_imports.area_a_payload: the server-computed Area A breakdown of an NTF
 *   workbook (DS per year, points, averages, percentages and the rating-scale version applied).
 *
 * The seeded rating scale is an AchieveNest provisional scale, not an official HR policy.
 * No signatory is seeded: the institution has not provided an authoritative mapping.
 */
final class CreateNtfAnnualReviewTemplateSettings extends Migration
{
    public function up()
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

        // Locked NTF Area A items are stored as evaluation items with their own domain.
        $this->replaceDomainCheck(['professional_development', 'productivity_creative_work', 'service_leadership', 'ntf_annual_review']);

        $now = date('Y-m-d H:i:s');
        $seed = [
            'rating_scale' => [
                'scale_name' => 'AchieveNest provisional NTF annual-review rating scale',
                'is_provisional' => true,
                'basis' => 'percentage_of_area_a_maximum',
                'bands' => [
                    ['key' => 'outstanding', 'label' => 'Outstanding', 'min_percent' => 90, 'passing' => true],
                    ['key' => 'very_satisfactory', 'label' => 'Very Satisfactory', 'min_percent' => 80, 'passing' => true],
                    ['key' => 'satisfactory', 'label' => 'Satisfactory', 'min_percent' => 70, 'passing' => true],
                    ['key' => 'unsatisfactory', 'label' => 'Unsatisfactory', 'min_percent' => 60, 'passing' => false],
                    ['key' => 'poor', 'label' => 'Poor', 'min_percent' => 0, 'passing' => false],
                ],
            ],
            'signatories' => ['college' => [], 'office' => []],
        ];
        foreach ($seed as $key => $value) {
            $exists = $this->db->table('personnel_annual_review_settings')->where(['personnel_group' => 'NON_TEACHING_FACULTY', 'setting_key' => $key])->countAllResults();
            if ($exists) continue;
            $this->db->table('personnel_annual_review_settings')->insert([
                'id' => $this->uuid(),
                'personnel_group' => 'NON_TEACHING_FACULTY',
                'setting_key' => $key,
                'version' => 1,
                'value_json' => json_encode($value, JSON_UNESCAPED_UNICODE),
                'change_reason' => 'Initial AchieveNest default',
                'created_at' => $now,
            ]);
        }
    }

    public function down()
    {
        if ($this->db->table('personnel_evaluation_items')->where('domain', 'ntf_annual_review')->countAllResults() === 0) {
            $this->replaceDomainCheck(['professional_development', 'productivity_creative_work', 'service_leadership']);
        }
        if ($this->db->fieldExists('area_a_payload', 'personnel_annual_review_imports')) {
            $this->db->query('ALTER TABLE personnel_annual_review_imports DROP COLUMN area_a_payload');
        }
        $this->forge->dropTable('personnel_annual_review_settings', true);
    }

    private function replaceDomainCheck(array $domains): void
    {
        $exists = $this->db->query("SELECT COUNT(*) AS c FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'personnel_evaluation_items' AND CONSTRAINT_NAME = 'ck_evaluation_items_domain'")->getRowArray();
        if ((int) ($exists['c'] ?? 0) > 0) $this->db->query('ALTER TABLE personnel_evaluation_items DROP CHECK ck_evaluation_items_domain');
        $list = implode(',', array_map(fn(string $d) => $this->db->escape($d), $domains));
        $this->db->query("ALTER TABLE personnel_evaluation_items ADD CONSTRAINT ck_evaluation_items_domain CHECK (domain IN ({$list}))");
    }

    private function uuid(): string
    {
        $d = random_bytes(16); $d[6] = chr((ord($d[6]) & 0x0f) | 0x40); $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }
}
