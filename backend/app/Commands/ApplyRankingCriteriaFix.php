<?php

namespace App\Commands;

use App\Database\Migrations\AddRankingCriteriaClassification;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ApplyRankingCriteriaFix extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'ranking:criteria-fix';
    protected $description = 'Applies the isolated, idempotent MySQL Faculty Ranking criteria classification and seed correction.';

    public function run(array $params)
    {
        require_once APPPATH . 'Database/Migrations/2026-09-11-000004_AddRankingCriteriaClassification.php';
        (new AddRankingCriteriaClassification())->up();
        CLI::write('Faculty and Non-Teaching Faculty ranking criteria are configured.', 'green');
    }
}
