<?php

namespace App\Commands;

use App\Services\AwardCandidateDiscoveryService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

/**
 * php spark awards:scores <AWARD_CODE>
 *
 * Read-only: lists every student with points for one award in the active cycle (candidates and
 * below-threshold), with the browser path of each student's Evaluation Summary. Writes nothing.
 * Without an award code it lists the award codes.
 */
class ListAwardScores extends BaseCommand
{
    protected $group = 'Awards';
    protected $name = 'awards:scores';
    protected $description = 'Lists students with points for an award and the path to their Evaluation Summary (read-only).';
    protected $usage = 'awards:scores [AWARD_CODE]';
    protected $arguments = ['AWARD_CODE' => 'award_definitions.code, e.g. LEADERSHIP_AWARD'];

    public function run(array $params)
    {
        $db = db_connect();
        $code = trim((string) ($params[0] ?? ''));
        if ($code === '') {
            foreach ($db->table('award_definitions')->select('code, name')->where('status', 'active')->orderBy('name', 'ASC')->get()->getResultArray() as $award) {
                CLI::write(str_pad((string) $award['code'], 40) . $award['name']);
            }
            CLI::write('Run: php spark awards:scores <AWARD_CODE>');

            return EXIT_SUCCESS;
        }

        $award = $db->table('award_definitions')->where('code', $code)->where('status', 'active')->get()->getRowArray();
        if ($award === null) {
            CLI::error("No active award with code {$code}. Run php spark awards:scores to list codes.");

            return EXIT_ERROR;
        }

        try {
            $scored = (new AwardCandidateDiscoveryService($db))->scoredStudentsForAward((string) $award['id']);
        } catch (Throwable $e) {
            CLI::error('Could not score this award: ' . $e->getMessage());

            return EXIT_ERROR;
        }

        CLI::write($award['name'] . ' | cycle: ' . ($scored['cycle']['name'] ?? 'none active') . ' | maximum ' . $scored['award']['computable_max_score'] . ' | threshold ' . $scored['award']['candidate_threshold_percent'] . '%');
        if ($scored['students'] === []) {
            CLI::write('No student has points for this award yet.');

            return EXIT_SUCCESS;
        }
        foreach ($scored['students'] as $student) {
            CLI::write(sprintf(
                '%-30s %-14s %6s / %-6s %7s%%  %s',
                mb_strimwidth((string) ($student['student_name'] ?? '?'), 0, 30),
                (string) ($student['student_id_number'] ?? ''),
                $student['raw_portfolio_score'],
                $student['computable_max_score'],
                $student['portfolio_potential_score'],
                $student['candidate_status']
            ));
            CLI::write('    /osad/awards/' . $award['id'] . '/candidates/' . $student['student_id'] . '/review');
        }

        return EXIT_SUCCESS;
    }
}
