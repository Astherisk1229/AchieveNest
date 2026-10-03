<?php

namespace App\Commands;

use App\Services\ApprovedAchievementScoringService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

/**
 * php spark scoring:backfill-verified [--student <profile id>]
 *
 * Scores every verified student_portfolio_records row that has no contribution row yet.
 * Idempotent: a second run creates no new contribution rows. Output is counts only.
 */
class BackfillVerifiedScoring extends BaseCommand
{
    protected $group = 'Awards';
    protected $name = 'scoring:backfill-verified';
    protected $description = 'Scores verified portfolio records that lack criterion contributions (idempotent).';
    protected $usage = 'scoring:backfill-verified [--student <profile id>]';
    protected $options = ['--student' => 'Limit the backfill to one student profile id.'];

    public function run(array $params)
    {
        $service = new ApprovedAchievementScoringService(db_connect());
        $student = CLI::getOption('student');
        $summary = self::backfill($service, is_string($student) && $student !== '' ? $student : null);

        foreach ($summary as $key => $value) {
            CLI::write(str_pad($key, 22) . ': ' . $value);
        }
        CLI::write('Contribution rows (all statuses): ' . db_connect()->table(ApprovedAchievementScoringService::TABLE)->countAllResults());

        return $summary['failed'] > 0 ? EXIT_ERROR : EXIT_SUCCESS;
    }

    /** @return array<string, int> */
    public static function backfill(ApprovedAchievementScoringService $service, ?string $studentId = null): array
    {
        $summary = ['records_considered' => 0, 'scored' => 0, 'failed' => 0, 'inserted' => 0, 'updated' => 0, 'reactivated' => 0, 'superseded' => 0];
        foreach ($service->verifiedRecordsLackingContributions($studentId) as $recordId) {
            $summary['records_considered']++;
            try {
                $counts = $service->scoreApprovedRecord((string) $recordId, null, 'backfill');
                $summary['scored']++;
                foreach (['inserted', 'updated', 'reactivated', 'superseded'] as $key) {
                    $summary[$key] += (int) $counts[$key];
                }
            } catch (Throwable $e) {
                $summary['failed']++;
                $code = ApprovedAchievementScoringService::errorCode($e);
                log_message('error', '[scoring:backfill-verified] record {id}: {code} {message}', ['id' => $recordId, 'code' => $code, 'message' => $e->getMessage()]);
                try {
                    $service->audit((string) $recordId, null, 'scoring_failed', 'error_code=' . $code);
                } catch (Throwable) {
                }
            }
        }

        return $summary;
    }
}
