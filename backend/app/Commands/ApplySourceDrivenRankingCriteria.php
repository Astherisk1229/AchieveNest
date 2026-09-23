<?php

namespace App\Commands;

use App\Database\Migrations\AddEvaluationScaleVersionGovernance;
use App\Database\Migrations\SeedSourceDrivenRankingCriteria;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ApplySourceDrivenRankingCriteria extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'ranking:source-seed';
    protected $description = 'Applies only the idempotent source-driven Faculty and Non-Teaching criteria schema and seed.';

    public function run(array $params)
    {
        require_once APPPATH . 'Database/Migrations/2026-09-12-000005_AddEvaluationScaleVersionGovernance.php';
        require_once APPPATH . 'Database/Migrations/2026-09-12-000006_SeedSourceDrivenRankingCriteria.php';
        (new AddEvaluationScaleVersionGovernance())->up();
        (new SeedSourceDrivenRankingCriteria())->up();
        CLI::write('Source-driven ranking criteria were applied without running unrelated migrations.', 'green');
    }
}
