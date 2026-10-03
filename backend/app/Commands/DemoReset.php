<?php

namespace App\Commands;

use App\Services\DefenseDemoPreflightService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

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

        $preflight = new DefenseDemoPreflightService();
        try {
            $preflight->validate();
        } catch (Throwable $e) {
            CLI::error("[ERROR] Preflight validation failed: " . $e->getMessage());
            return 1;
        }

        $seeder = \Config\Database::seeder();
        $seeder->call('DefenseDemoSeeder');

        CLI::write("Defense demo personas and scenario fixtures successfully reset & reseeded.", 'green');
        return 0;
    }
}
