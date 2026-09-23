<?php

namespace App\Commands;

use App\Services\PersonnelRankPlacementService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class ActivateDueRankPlacements extends BaseCommand
{
    protected $group='Ranking';
    protected $name='ranking:activate-due-placements';
    protected $description='Activates due confirmed personnel rank placements without changing Present Rank.';
    public function run(array $params){$results=(new PersonnelRankPlacementService())->activateDue();CLI::write(json_encode($results,JSON_PRETTY_PRINT));}
}
