<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class DemoReset extends BaseCommand
{
    protected $group       = 'AchieveNest';
    protected $name        = 'demo:reset';
    protected $description = 'Resets and reseeds the Phase 12 defense demonstration personas and scenario fixtures.';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Resetting Defense Demonstration Fixtures", 'yellow');
        CLI::write("========================================================================", 'yellow');

        $seeder = \Config\Database::seeder();
        $seeder->call('DefenseDemoSeeder');

        CLI::write("Defense demo personas and scenario fixtures successfully reset & reseeded.", 'green');
    }
}
