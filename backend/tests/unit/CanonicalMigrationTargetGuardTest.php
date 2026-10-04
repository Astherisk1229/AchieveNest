<?php

use App\Services\CanonicalMigrationTargetGuard;
use PHPUnit\Framework\TestCase;

final class CanonicalMigrationTargetGuardTest extends TestCase
{
    private const APPROVED = [
        'CANONICAL_MIGRATION_APPROVAL' => CanonicalMigrationTargetGuard::APPROVAL,
        'CANONICAL_MIGRATION_APPROVED_DATABASE' => 'railway',
        'CANONICAL_MIGRATION_APPROVED_ENVIRONMENT' => 'staging',
        'RAILWAY_ENVIRONMENT_NAME' => 'staging',
    ];

    public function testDisposableReplayDatabaseRemainsAllowed(): void
    {
        self::assertTrue(CanonicalMigrationTargetGuard::isAllowed(
            'achievenest_phase17m_replay',
            'MySQLi',
            []
        ));
    }

    public function testExactPersistentTargetApprovalIsAllowed(): void
    {
        self::assertTrue(CanonicalMigrationTargetGuard::isAllowed('railway', 'MySQLi', self::APPROVED));
    }

    /** @dataProvider rejectedTargets */
    public function testUnsafeTargetsAreRejected(string $database, string $driver, array $environment): void
    {
        self::assertFalse(CanonicalMigrationTargetGuard::isAllowed($database, $driver, $environment));
    }

    public static function rejectedTargets(): array
    {
        return [
            'protected local database' => ['achievenest_local', 'MySQLi', self::APPROVED],
            'wrong driver' => ['railway', 'Postgre', self::APPROVED],
            'missing approval phrase' => ['railway', 'MySQLi', array_diff_key(self::APPROVED, ['CANONICAL_MIGRATION_APPROVAL' => true])],
            'wrong database' => ['production', 'MySQLi', self::APPROVED],
            'wrong Railway environment' => ['railway', 'MySQLi', array_replace(self::APPROVED, ['RAILWAY_ENVIRONMENT_NAME' => 'production'])],
            'blank Railway environment' => ['railway', 'MySQLi', array_replace(self::APPROVED, ['RAILWAY_ENVIRONMENT_NAME' => ''])],
        ];
    }

    public function testGuardIsUsedByEveryProtectedCanonicalMigration(): void
    {
        foreach ([
            '2026-08-31-000001_CreateCanonicalMySQLBaseline.php',
            '2026-09-15-000016_RestoreBridgeCompatibilityActor.php',
            '2026-09-15-000017_RestoreBridgeCompatibilityPeriods.php',
        ] as $file) {
            $source = file_get_contents(APPPATH . 'Phase17Canonical/Database/Migrations/' . $file);
            self::assertStringContainsString('CanonicalMigrationTargetGuard::assertAllowed(', $source);
        }
    }
}
