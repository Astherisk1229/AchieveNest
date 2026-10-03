<?php

namespace App\Database\Testing;

use RuntimeException;

/** Check identity before connecting and before every SQL execution, not after a write. */
final class Connection extends \CodeIgniter\Database\SQLite3\Connection
{
    public function connect(bool $persistent = false)
    {
        $this->assertIdentity();
        return parent::connect($persistent);
    }

    protected function execute(string $sql)
    {
        $this->assertIdentity();
        if (preg_match('/\b(?:ATTACH|VACUUM)\b/i', $sql)) {
            throw new RuntimeException('TEST_DATABASE_FILE_ACCESS_DENIED');
        }
        $databases = $this->connID->query('PRAGMA database_list');
        while ($database = $databases->fetchArray(SQLITE3_ASSOC)) {
            if (($database['file'] ?? '') !== '') {
                throw new RuntimeException('TEST_DATABASE_NOT_DISPOSABLE: attached file database.');
            }
        }
        $databases->finalize();
        return parent::execute($sql);
    }

    private function assertIdentity(): void
    {
        DatabaseIdentityGuard::assertConfiguration([
            'DBDriver' => $this->DBDriver, 'database' => $this->database,
            'DSN' => $this->DSN, 'failover' => $this->failover,
        ]);
    }
}
