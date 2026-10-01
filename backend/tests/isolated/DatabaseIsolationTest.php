<?php
namespace Tests\Isolated;

use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

final class DatabaseIsolationTest extends CIUnitTestCase
{
    public function testTestingOverridesLocalDefense(): void
    {
        $previous = getenv('ACHIEVENEST_ENV');
        putenv('ACHIEVENEST_ENV=local-defense');
        try {
            $config = new Database();
            self::assertSame('tests', $config->defaultGroup);
            self::assertSame(':memory:', $config->tests['database']);
            self::assertSame('SQLite3', $config->tests['DBDriver']);
        } finally {
            putenv($previous === false ? 'ACHIEVENEST_ENV' : 'ACHIEVENEST_ENV=' . $previous);
        }
    }

    public function testUnsafeIdentitiesAreRejectedBeforeConnection(): void
    {
        foreach (['default', 'local_defense', 'development',
            ['DBDriver' => 'MySQLi', 'database' => 'achievenest_local', 'hostname' => '127.0.0.1', 'port' => 1],
            ['DBDriver' => 'SQLite3', 'database' => 'working.sqlite'],
            ['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DSN' => 'sqlite:working.sqlite'],
            ['DBDriver' => 'SQLite3', 'database' => ':memory:', 'failover' => [['database' => 'working.sqlite']]],
        ] as $target) {
            try {
                Database::connect($target, false);
                self::fail('Unsafe database accepted');
            } catch (\RuntimeException $e) {
                self::assertStringContainsString('TEST_DATABASE_NOT_DISPOSABLE', $e->getMessage());
            }
        }
        try {
            \CodeIgniter\Database\Config::connect('local_defense', false);
            self::fail('Parent factory bypass accepted');
        } catch (\RuntimeException $e) {
            self::assertStringContainsString('TEST_DATABASE_NOT_DISPOSABLE', $e->getMessage());
        }
    }

    public function testDisposableWritesAndIdentityRecheck(): void
    {
        $db = Database::connect('tests', false);
        self::assertInstanceOf(\App\Database\Testing\Connection::class, $db);
        $db->query('CREATE TABLE isolation_probe (value TEXT)');
        $db->query("INSERT INTO isolation_probe VALUES ('safe')");
        $identity = new \ReflectionProperty($db, 'database');
        $identity->setValue($db, 'achievenest_local');
        try {
            $db->query('DELETE FROM isolation_probe');
            self::fail('Changed identity accepted');
        } catch (\RuntimeException $e) {
            self::assertStringContainsString('TEST_DATABASE_NOT_DISPOSABLE', $e->getMessage());
        }
        $identity->setValue($db, ':memory:');
        self::assertSame('safe', $db->query('SELECT value FROM isolation_probe')->getRow()->value);
        foreach (["ATTACH DATABASE 'working.sqlite' AS working", "VACUUM INTO 'working.sqlite'"] as $sql) {
            try {
                $db->query($sql);
                self::fail('File database operation accepted');
            } catch (\RuntimeException $e) {
                self::assertSame('TEST_DATABASE_FILE_ACCESS_DENIED', $e->getMessage());
            }
        }
        $db->close();
    }

    public function testManualProofCatalogIsExcluded(): void
    {
        foreach (['phpunit.dist.xml', 'phpunit.local-defense.xml'] as $name) {
            $xml = simplexml_load_file(ROOTPATH . $name);
            self::assertSame('tests/bootstrap.php', (string) $xml['bootstrap']);
            self::assertNotEmpty($xml->xpath('//groups/exclude/group[text()="manual-proof"]'));
        }
        $files = json_decode(file_get_contents(TESTPATH . 'manual-proof-files.json'), true, 512, JSON_THROW_ON_ERROR);
        self::assertNotEmpty($files);
        foreach ($files as $file) {
            $source = file_get_contents(ROOTPATH . $file);
            self::assertStringContainsString("Group('manual-proof')", $source, $file);
            self::assertStringContainsString('ManualProofGate::requireOptIn(', $source, $file);
        }
        $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(TESTPATH));
        foreach ($iterator as $file) {
            $path = str_replace('\\', '/', $file->getPathname());
            if (!str_ends_with($path, 'Test.php') || str_contains($path, '/isolated/')) {
                continue;
            }
            $source = file_get_contents($path);
            if (preg_match('/(?:db_connect|Database::connect)\s*\(\s*[\x27\x22](?:default|local_defense)[\x27\x22]|new\s+\\\\?PDO\b|(?:127\.0\.0\.1|localhost):8080|curl_init\s*\(/', $source)) {
                self::assertStringContainsString("Group('manual-proof')", $source, $path);
                self::assertStringContainsString('ManualProofGate::requireOptIn(', $source, $path);
            }
        }
    }

    public function testRawLegacyProofCannotBypassGuardEvenWithOptIn(): void
    {
        $previous = getenv('ACHIEVENEST_MANUAL_PROOFS');
        putenv('ACHIEVENEST_MANUAL_PROOFS=1');
        try {
            $this->expectException(\RuntimeException::class);
            $this->expectExceptionMessage('MANUAL_PROOF_UNSAFE_DATABASE');
            \Tests\Support\ManualProofGate::requireOptIn(true);
        } finally {
            putenv($previous === false ? 'ACHIEVENEST_MANUAL_PROOFS' : 'ACHIEVENEST_MANUAL_PROOFS=' . $previous);
        }
    }

    public function testManualProofRequiresOptInBeforeSetup(): void
    {
        $previous = getenv('ACHIEVENEST_MANUAL_PROOFS');
        putenv('ACHIEVENEST_MANUAL_PROOFS');
        try {
            \Tests\Support\ManualProofGate::requireOptIn();
            self::fail('Manual setup accepted without opt-in');
        } catch (\PHPUnit\Framework\SkippedWithMessageException $e) {
            self::assertStringContainsString('ACHIEVENEST_MANUAL_PROOFS=1', $e->getMessage());
        } finally {
            putenv($previous === false ? 'ACHIEVENEST_MANUAL_PROOFS' : 'ACHIEVENEST_MANUAL_PROOFS=' . $previous);
        }
    }
}
