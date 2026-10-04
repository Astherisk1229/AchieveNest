<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

final class CanonicalMigrationTargetGuard
{
    public const APPROVAL = 'APPLY_CANONICAL_MYSQL_BASELINE';

    /** @param array<string, string> $environment */
    public static function isAllowed(string $database, string $driver, array $environment): bool
    {
        if ($driver !== 'MySQLi' || $database === '' || $database === 'achievenest_local') {
            return false;
        }

        if (str_starts_with($database, 'achievenest_phase17m_')) {
            return true;
        }

        $railwayEnvironment = $environment['RAILWAY_ENVIRONMENT_NAME'] ?? '';

        return ($environment['CANONICAL_MIGRATION_APPROVAL'] ?? '') === self::APPROVAL
            && ($environment['CANONICAL_MIGRATION_APPROVED_DATABASE'] ?? '') === $database
            && $railwayEnvironment !== ''
            && ($environment['CANONICAL_MIGRATION_APPROVED_ENVIRONMENT'] ?? '') === $railwayEnvironment;
    }

    public static function assertAllowed(BaseConnection $db, string $operation): void
    {
        $database = (string) $db->getDatabase();
        $environment = [
            'CANONICAL_MIGRATION_APPROVAL' => (string) getenv('CANONICAL_MIGRATION_APPROVAL'),
            'CANONICAL_MIGRATION_APPROVED_DATABASE' => (string) getenv('CANONICAL_MIGRATION_APPROVED_DATABASE'),
            'CANONICAL_MIGRATION_APPROVED_ENVIRONMENT' => (string) getenv('CANONICAL_MIGRATION_APPROVED_ENVIRONMENT'),
            'RAILWAY_ENVIRONMENT_NAME' => (string) getenv('RAILWAY_ENVIRONMENT_NAME'),
        ];

        if (! self::isAllowed($database, (string) $db->DBDriver, $environment)) {
            throw new RuntimeException(
                "Refusing canonical migration operation [{$operation}] against database [{$database}]."
            );
        }
    }
}
