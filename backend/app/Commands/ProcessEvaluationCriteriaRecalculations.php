<?php

namespace App\Commands;

use App\Services\PersonnelEvaluationCriteriaRecalculationService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

/** Processes pending criteria recalculation jobs; safe to run repeatedly. */
final class ProcessEvaluationCriteriaRecalculations extends BaseCommand
{
    protected $group = 'Evaluation';
    protected $name = 'evaluation-criteria:recalculate';
    protected $description = 'Process durable evaluation criteria recalculation jobs.';
    protected $usage = 'evaluation-criteria:recalculate [limit]';

    public function run(array $params)
    {
        $results = (new PersonnelEvaluationCriteriaRecalculationService())->processNext((int)($params[0] ?? 20));
        CLI::write(json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}
