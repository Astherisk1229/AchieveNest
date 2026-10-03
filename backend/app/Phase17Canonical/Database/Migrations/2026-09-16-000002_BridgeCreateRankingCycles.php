<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

class BridgeCreateRankingCycles extends Migration
{
    use September15BridgeGuard;

public function up()
    {
        $this->assertBridgeStep(2);
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS ranking_cycles (
    id VARCHAR(36) PRIMARY KEY,
    cycle_code VARCHAR(40) NOT NULL UNIQUE,
    cycle_name VARCHAR(160) NOT NULL,
    academic_year VARCHAR(9) NOT NULL,
    legacy_source_period_id VARCHAR(36) NULL UNIQUE,
    created_by VARCHAR(36) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(36) NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_ranking_cycles_year (academic_year),
    CONSTRAINT fk_ranking_cycle_creator FOREIGN KEY (created_by) REFERENCES profiles(id),
    CONSTRAINT fk_ranking_cycle_updater FOREIGN KEY (updated_by) REFERENCES profiles(id),
    CONSTRAINT ck_ranking_cycle_academic_year CHECK (academic_year REGEXP '^[0-9]{4}-[0-9]{4}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        if (! $this->db->fieldExists('ranking_cycle_id', 'personnel_evaluation_periods')) {
            $this->db->query('ALTER TABLE personnel_evaluation_periods ADD COLUMN ranking_cycle_id VARCHAR(36) NULL AFTER id');
            $this->db->query('CREATE INDEX idx_personnel_period_cycle ON personnel_evaluation_periods (ranking_cycle_id)');
            $this->db->query('ALTER TABLE personnel_evaluation_periods ADD CONSTRAINT fk_personnel_period_cycle FOREIGN KEY (ranking_cycle_id) REFERENCES ranking_cycles(id)');
        }

        // Compatibility backfill: one cycle per period. Historical periods are never guessed into pairs.
        $periods = $this->db->table('personnel_evaluation_periods')->where('ranking_cycle_id', null)->get()->getResultArray();
        foreach ($periods as $period) {
            $cycleId = $this->compatibilityCycleId((string) $period['id']);
            $code = 'LEGACY-' . substr(hash('sha256', (string) $period['id']), 0, 16);
            $this->db->table('ranking_cycles')->insert([
                'id' => $cycleId,
                'cycle_code' => $code,
                'cycle_name' => 'Legacy cycle — ' . $period['period_name'],
                'academic_year' => $period['academic_year'],
                'legacy_source_period_id' => $period['id'],
                'created_by' => $period['created_by'] ?? null,
                'created_at' => $period['created_at'] ?? date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
            $this->db->table('personnel_evaluation_periods')->where('id', $period['id'])->update(['ranking_cycle_id' => $cycleId]);
        }

        $this->db->query('ALTER TABLE personnel_evaluation_periods ADD UNIQUE KEY uq_ranking_cycle_group_track (ranking_cycle_id, personnel_group)');
    }

    private function compatibilityCycleId(string $periodId): string
    {
        $hex = hash('sha256', 'ranking-cycle:' . $periodId);
        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-4' . substr($hex, 13, 3)
            . '-a' . substr($hex, 17, 3) . '-' . substr($hex, 20, 12);
    }
}
