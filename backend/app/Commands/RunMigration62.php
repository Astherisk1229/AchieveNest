<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class RunMigration62 extends BaseCommand
{
    protected $group       = 'Database';
    protected $name        = 'db:migrate-62';
    protected $description = 'Runs migration 62 for personnel_annual_reviews';

    public function run(array $params)
    {
        require_once APPPATH . 'Database/Migrations/2026-09-08-000062_CreatePersonnelAnnualReviews.php';
        $migration = new \App\Database\Migrations\CreatePersonnelAnnualReviews();
        $migration->up();
        CLI::write('Migration 62 successfully executed for personnel_annual_reviews!', 'green');
    }
}
