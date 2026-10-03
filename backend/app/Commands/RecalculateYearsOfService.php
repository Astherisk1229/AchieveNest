<?php

namespace App\Commands;

use App\Services\EmploymentServiceDurationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use CodeIgniter\Database\BaseConnection;
use Throwable;

/**
 * php spark personnel:recalculate-years-of-service [--apply]
 *
 * Portfolio submissions made before the length-of-service change stored the Years of Service
 * (personnel_evaluations.tenure_years, used for C.3 / B.3) from a browser-supplied value.
 * This recalculates it for evaluations that are NOT finalized, using the server's qualifying
 * length of service (full-time only, HR service history) as of each evaluation period's end date.
 *
 * Dry run by default: prints what would change and writes nothing.
 * --apply updates only rows whose value differs, in one transaction, and writes a before/after
 * report to writable/logs/ so the change can be reviewed or reverted. Finalized evaluations are never touched.
 */
class RecalculateYearsOfService extends BaseCommand
{
    protected $group = 'Personnel';
    protected $name = 'personnel:recalculate-years-of-service';
    protected $description = 'Recalculates Years of Service (tenure_years) on non-finalized evaluations from the HR service history. Dry run unless --apply.';
    protected $usage = 'personnel:recalculate-years-of-service [--apply]';
    protected $options = ['--apply' => 'Write the changes (default is a dry run).'];

    public function run(array $params)
    {
        $db = db_connect();
        $apply = CLI::getOption('apply') !== null || in_array('--apply', $_SERVER['argv'] ?? [], true);
        $plan = self::plan($db);

        CLI::write(($apply ? 'APPLY' : 'DRY RUN') . ' — non-finalized evaluations considered: ' . count($plan['rows']) . ', skipped: ' . count($plan['skipped']));
        foreach ($plan['rows'] as $row) {
            $mark = $row['changed'] ? '*' : ' ';
            CLI::write(sprintf('%s %s  %-32s  %2d -> %2d  (%s, as of %s)', $mark, $row['evaluation_id'], mb_strimwidth((string) $row['full_name'], 0, 32, '…'), $row['old_tenure_years'], $row['new_tenure_years'], $row['basis'], $row['reference_date']));
        }
        foreach ($plan['skipped'] as $skip) CLI::write('  skipped ' . $skip['evaluation_id'] . ': ' . $skip['reason'], 'yellow');
        $changes = array_values(array_filter($plan['rows'], fn ($r) => $r['changed']));
        CLI::write(count($changes) . ' evaluation(s) would change (marked *).');

        if (! $apply) {
            CLI::write('Nothing written. Re-run with --apply to update these rows.', 'yellow');
            return EXIT_SUCCESS;
        }
        if ($changes === []) {
            CLI::write('Nothing to update.', 'green');
            return EXIT_SUCCESS;
        }
        try {
            $updated = self::apply($db, $changes);
        } catch (Throwable $e) {
            CLI::error('Rolled back, nothing changed: ' . $e->getMessage());
            return EXIT_ERROR;
        }
        $report = WRITEPATH . 'logs/years-of-service-recalc-' . date('Ymd-His') . '.json';
        @file_put_contents($report, json_encode(['applied_at' => date('c'), 'rows' => $changes], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        CLI::write("Updated {$updated} evaluation(s). Before/after report: {$report}", 'green');
        return EXIT_SUCCESS;
    }

    /**
     * @return array{rows: list<array>, skipped: list<array>}
     */
    public static function plan(BaseConnection $db, ?EmploymentServiceDurationService $duration = null): array
    {
        $duration ??= new EmploymentServiceDurationService($db);
        $evaluations = $db->table('personnel_evaluations pe')
            ->select('pe.id, pe.personnel_profile_id, pe.tenure_years, pe.evaluation_period_id, pe.status, p.full_name, per.evaluation_end_at')
            ->join('profiles p', 'p.id = pe.personnel_profile_id', 'left')
            ->join('personnel_evaluation_periods per', 'per.id = pe.evaluation_period_id', 'left')
            ->where('pe.finalized_at', null)
            ->orderBy('p.full_name', 'ASC')
            ->get()->getResultArray();

        $rows = $skipped = [];
        foreach ($evaluations as $e) {
            $cutoff = substr((string) ($e['evaluation_end_at'] ?? ''), 0, 10);
            if ($cutoff === '') { $skipped[] = ['evaluation_id' => $e['id'], 'reason' => 'no evaluation period end date']; continue; }
            try {
                $service = $duration->calculateQualifyingService($e['personnel_profile_id'], $cutoff);
            } catch (Throwable $t) {
                $skipped[] = ['evaluation_id' => $e['id'], 'reason' => 'length of service unavailable: ' . $t->getMessage()];
                continue;
            }
            $new = (int) ($service['completed_years'] ?? 0);
            $old = (int) $e['tenure_years'];
            $rows[] = [
                'evaluation_id' => $e['id'], 'personnel_profile_id' => $e['personnel_profile_id'], 'full_name' => $e['full_name'],
                'status' => $e['status'], 'reference_date' => $cutoff, 'basis' => $service['basis'] ?? 'unavailable',
                'service_history_version_id' => $service['service_history_version_id'] ?? null,
                'old_tenure_years' => $old, 'new_tenure_years' => $new, 'changed' => $old !== $new,
            ];
        }
        return ['rows' => $rows, 'skipped' => $skipped];
    }

    /** Updates tenure_years for the given changed rows in one transaction. Finalized rows are re-checked and never updated. */
    public static function apply(BaseConnection $db, array $changes): int
    {
        $updated = 0;
        $db->transBegin();
        try {
            foreach ($changes as $row) {
                $db->table('personnel_evaluations')
                    ->where('id', $row['evaluation_id'])->where('finalized_at', null)->where('tenure_years', $row['old_tenure_years'])
                    ->update(['tenure_years' => $row['new_tenure_years']]);
                $updated += $db->affectedRows();
            }
            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            throw $e;
        }
        return $updated;
    }
}
