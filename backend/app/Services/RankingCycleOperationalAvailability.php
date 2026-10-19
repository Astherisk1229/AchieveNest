<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/** Central guard for work linked to an HR ranking period. */
final class RankingCycleOperationalAvailability
{
    public static function assertEnabled(BaseConnection $db, string $periodId): void
    {
        $period = $db->table('personnel_evaluation_periods')
            ->select('id, ranking_cycle_id')
            ->where('id', $periodId)
            ->get()->getRowArray();

        if (! $period) {
            throw new RuntimeException('EVALUATION_PERIOD_INVALID: Evaluation period was not found.');
        }

        if (empty($period['ranking_cycle_id'])) return;

        $cycle = $db->table('ranking_cycles')
            ->select('operational_enabled')
            ->where('id', $period['ranking_cycle_id'])
            ->get()->getRowArray();

        // Legacy cycles remain enabled when the field is absent or NULL.
        if ($cycle && array_key_exists('operational_enabled', $cycle) && (int) $cycle['operational_enabled'] !== 1) {
            throw new RuntimeException('RANKING_PERIOD_DISABLED: This ranking period is temporarily disabled by HR.');
        }
    }
}
