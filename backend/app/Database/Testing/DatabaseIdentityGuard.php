<?php

namespace App\Database\Testing;

use RuntimeException;

/** Automated tests may use only disposable, process-local SQLite databases. */
final class DatabaseIdentityGuard
{
    public static function assertConfiguration(array $config, string $group = ''): void
    {
        if (in_array($group, ['default', 'development', 'local_defense'], true)
            || ($config['DBDriver'] ?? '') !== 'SQLite3'
            || ($config['database'] ?? '') !== ':memory:'
            || ! empty($config['DSN']) || ! empty($config['failover'])) {
            throw new RuntimeException('TEST_DATABASE_NOT_DISPOSABLE: use the tests group or explicit SQLite :memory:.');
        }
    }
}
