<?php
namespace App\Commands;use App\Services\ApprovedRankActivationService;use CodeIgniter\CLI\BaseCommand;use CodeIgniter\CLI\CLI;
class ActivateDueApprovedRanks extends BaseCommand{protected $group='Ranking';protected $name='ranking:activate-due-approved-ranks';protected $description='Safely activates due offline-approved ranks and records failures for HR recovery.';public function run(array$params){$results=(new ApprovedRankActivationService())->activateDue();CLI::write(json_encode($results,JSON_PRETTY_PRINT));}}
