<?php

declare(strict_types=1);

use App\Controllers\Api\PersonnelPortfolioSubmissionController;
use Config\Database as DatabaseConfig;
use PHPUnit\Framework\TestCase;

final class PersonnelSubmissionHistoryPhase3Test extends TestCase
{
    public function testHistoryIncludesVersionedSnapshotsAcrossEvaluationRootsForOnlyTheOwner(): void
    {
        $db = DatabaseConfig::connect([
            'DSN'      => '',
            'hostname' => '',
            'username' => '',
            'password' => '',
            'database' => ':memory:',
            'DBDriver' => 'SQLite3',
            'DBPrefix' => '',
            'pConnect' => false,
            'DBDebug'  => true,
        ]);
        $db->query('CREATE TABLE personnel_evaluations (
            id TEXT PRIMARY KEY,
            personnel_profile_id TEXT NOT NULL,
            evaluation_root_id TEXT,
            version_number INTEGER,
            status TEXT,
            submitted_at TEXT,
            created_at TEXT
        )');
        $db->table('personnel_evaluations')->insertBatch([
            ['id' => 'CYCLE-A-V1', 'personnel_profile_id' => 'PERSON-1', 'evaluation_root_id' => 'ROOT-A', 'version_number' => 1, 'status' => 'submitted', 'submitted_at' => '2025-01-10 10:00:00', 'created_at' => '2025-01-10 10:00:00'],
            ['id' => 'CYCLE-A-V2', 'personnel_profile_id' => 'PERSON-1', 'evaluation_root_id' => 'ROOT-A', 'version_number' => 2, 'status' => 'completed', 'submitted_at' => '2025-01-20 10:00:00', 'created_at' => '2025-01-20 10:00:00'],
            ['id' => 'CYCLE-B-V1', 'personnel_profile_id' => 'PERSON-1', 'evaluation_root_id' => 'ROOT-B', 'version_number' => 1, 'status' => 'submitted', 'submitted_at' => '2026-01-10 10:00:00', 'created_at' => '2026-01-10 10:00:00'],
            ['id' => 'OTHER-PERSON', 'personnel_profile_id' => 'PERSON-2', 'evaluation_root_id' => 'ROOT-C', 'version_number' => 1, 'status' => 'submitted', 'submitted_at' => '2026-01-11 10:00:00', 'created_at' => '2026-01-11 10:00:00'],
        ]);

        $controller = (new ReflectionClass(PersonnelPortfolioSubmissionController::class))->newInstanceWithoutConstructor();
        $method = new ReflectionMethod(PersonnelPortfolioSubmissionController::class, 'loadSubmissionHistoryRows');
        $method->setAccessible(true);
        $rows = $method->invoke($controller, $db, 'personnel_evaluations', 'PERSON-1');

        self::assertSame(['CYCLE-A-V1', 'CYCLE-A-V2', 'CYCLE-B-V1'], array_column($rows, 'id'));
        self::assertSame(['ROOT-A', 'ROOT-A', 'ROOT-B'], array_column($rows, 'evaluation_root_id'));
        self::assertNotContains('OTHER-PERSON', array_column($rows, 'id'));
        $db->close();
    }
}
