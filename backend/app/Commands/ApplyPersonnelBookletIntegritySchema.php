<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ApplyPersonnelBookletIntegritySchema extends BaseCommand
{
    protected $group = 'Database';
    protected $name = 'db:migrate-personnel-booklet';
    protected $description = 'Applies the idempotent Personnel booklet classification and no-pre-Dean-score schema change.';

    public function run(array $params)
    {
        require_once APPPATH . 'Database/Migrations/2026-09-10-000074_AddCanonicalClassificationToPersonnelAccomplishments.php';
        $migration = new \App\Database\Migrations\AddCanonicalClassificationToPersonnelAccomplishments();
        $migration->up();
        CLI::write('Personnel booklet integrity schema applied.', 'green');
    }
}
