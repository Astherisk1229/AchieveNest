<?php

namespace App\Commands;

use App\Services\EventSourceRecordBridgeService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/** Backfills automatic portfolio certificates for attendance sessions closed before this workflow was deployed. */
final class SyncClosedAttendancePortfolioRecords extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'attendance:sync-closed-portfolio';
    protected $description = 'Synchronize a closed attendance session into verified student portfolio certificate records.';
    protected $usage = 'attendance:sync-closed-portfolio <session-id> <actor-profile-id>';

    public function run(array $params)
    {
        [$sessionId, $actorId] = $params + [null, null];
        if (!is_string($sessionId) || trim($sessionId) === '' || !is_string($actorId) || trim($actorId) === '') {
            throw new RuntimeException('A closed attendance session ID and the responsible personnel profile ID are required.');
        }

        /** @var BaseConnection $db */
        $db = db_connect('default');
        $results = (new EventSourceRecordBridgeService($db))->recordClosedSessionAttendance(trim($sessionId), trim($actorId));
        CLI::write(sprintf('Synchronized %d verified student portfolio certificate record(s).', count($results)), 'green');
    }
}
