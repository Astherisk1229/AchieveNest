<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Restores the exact period set consumed by the September 15 bridge. */
class RestoreBridgeCompatibilityPeriods extends Migration
{
    private const ACTOR_ID = 'd0000000-0000-0000-0001-000000000005';
    private const PERIOD_IDS = [
        'acceptance-closed-period-2026-09',
        'd198ba23-1571-4c5d-98e2-f57d50eee79d',
    ];

    public function up()
    {
        $this->assertCanonicalMySQL();
        if (! $this->db->tableExists('personnel_evaluation_periods')) {
            throw new RuntimeException('Bridge compatibility periods require personnel_evaluation_periods.');
        }
        if ($this->db->tableExists('ranking_cycles') || $this->db->fieldExists('ranking_cycle_id', 'personnel_evaluation_periods')) {
            throw new RuntimeException('Bridge compatibility periods must run before ranking-cycle construction.');
        }

        $periods = [
            [
                'id' => self::PERIOD_IDS[0],
                'period_code' => 'ACCEPT-CLOSED-2026-09',
                'period_name' => 'Acceptance Fixture — Closed Annual Review',
                'evaluation_type' => 'TENURE_EVALUATION',
                'personnel_group' => 'FACULTY',
                'academic_year' => '2024-2025',
                'semester' => 'FULL_ACADEMIC_YEAR',
                'coverage_label' => 'Acceptance-only closed-period lock fixture',
                'submission_open_at' => '2024-06-01 00:00:00',
                'submission_close_at' => '2025-03-31 23:59:59',
                'evaluation_start_at' => '2025-04-01 00:00:00',
                'evaluation_end_at' => '2025-05-31 23:59:59',
                'status' => 'CLOSED',
                'version' => 1,
                'evaluation_scale_version_id' => 'ver-admin-2025-001',
                'created_by' => self::ACTOR_ID,
                'created_at' => '2026-09-13 09:20:18',
                'updated_by' => null,
                'updated_at' => '2026-09-13 09:20:18',
                'closed_by' => self::ACTOR_ID,
                'closed_at' => '2026-09-13 09:20:18',
                'archived_at' => null,
            ],
            [
                'id' => self::PERIOD_IDS[1],
                'period_code' => 'PEP-RANK-20262027-CU-3F6BB7',
                'period_name' => 'Problem 1 Closure Faculty Ranking Period',
                'evaluation_type' => 'RANKING_PROMOTION',
                'personnel_group' => 'FACULTY',
                'academic_year' => '2026-2027',
                'semester' => 'CUSTOM_COVERAGE',
                'coverage_label' => 'Problem 1 Closure 20260912-235453',
                'submission_open_at' => '2026-09-12 22:54:53',
                'submission_close_at' => '2026-09-13 23:54:53',
                'evaluation_start_at' => '2026-09-13 23:54:53',
                'evaluation_end_at' => '2026-09-20 23:54:53',
                'status' => 'OPEN_FOR_SUBMISSION',
                'version' => 2,
                'evaluation_scale_version_id' => 'ver-admin-2025-001',
                'created_by' => self::ACTOR_ID,
                'created_at' => '2026-09-12 23:54:56',
                'updated_by' => self::ACTOR_ID,
                'updated_at' => '2026-09-12 23:54:59',
                'closed_by' => null,
                'closed_at' => null,
                'archived_at' => null,
            ],
        ];

        foreach ($periods as $expected) {
            $actual = $this->db->table('personnel_evaluation_periods')->where('id', $expected['id'])->get()->getRowArray();
            if ($actual === null) {
                $this->db->table('personnel_evaluation_periods')->insert($expected);
            } elseif (! $this->compatible($actual, $expected)) {
                throw new RuntimeException("Bridge compatibility period {$expected['id']} conflicts with existing data.");
            }
        }

        $actualIds = array_column(
            $this->db->table('personnel_evaluation_periods')->select('id')->orderBy('id')->get()->getResultArray(),
            'id'
        );
        if ($actualIds !== self::PERIOD_IDS) {
            throw new RuntimeException('Bridge compatibility period set contains unexpected rows: ' . implode(', ', $actualIds));
        }
    }

    public function down()
    {
        $this->assertCanonicalMySQL();
        if (! $this->db->tableExists('personnel_evaluation_periods')) {
            return;
        }
        if ($this->db->fieldExists('ranking_cycle_id', 'personnel_evaluation_periods')) {
            throw new RuntimeException('Refusing to remove bridge periods while ranking_cycle_id exists.');
        }

        $references = $this->db->query(
            'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE '
            . "WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = 'personnel_evaluation_periods' "
            . "AND REFERENCED_COLUMN_NAME = 'id'"
        )->getResultArray();
        foreach ($references as $reference) {
            $count = $this->db->table($reference['TABLE_NAME'])->whereIn($reference['COLUMN_NAME'], self::PERIOD_IDS)->countAllResults();
            if ($count > 0) {
                throw new RuntimeException("Refusing to remove bridge periods: {$reference['TABLE_NAME']} still references them.");
            }
        }
        $this->db->table('personnel_evaluation_periods')->whereIn('id', self::PERIOD_IDS)->delete();
    }

    private function compatible(array $actual, array $expected): bool
    {
        foreach ($expected as $field => $value) {
            if ($value === null ? $actual[$field] !== null : (string) $actual[$field] !== (string) $value) {
                return false;
            }
        }
        return true;
    }

    private function assertCanonicalMySQL(): void
    {
        $database = (string) $this->db->getDatabase();
        if ($this->db->DBDriver !== 'MySQLi' || ! str_starts_with($database, 'achievenest_phase17m_')) {
            throw new RuntimeException("Refusing bridge period restoration against [{$database}].");
        }
    }
}
