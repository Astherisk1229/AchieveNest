<?php

namespace App\Commands;

use App\Database\Migrations\AddPersonnelEmploymentStartDate;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ApplyPersonnelEmploymentFoundation extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'personnel:employment-foundation';
    protected $description = 'Applies only the personnel employment start date schema change.';

    public function run(array $params)
    {
        require_once APPPATH . 'Database/Migrations/2026-09-12-000007_AddPersonnelEmploymentStartDate.php';
        (new AddPersonnelEmploymentStartDate())->up();
        CLI::write('Personnel employment foundation applied without running unrelated migrations.', 'green');
    }
}
