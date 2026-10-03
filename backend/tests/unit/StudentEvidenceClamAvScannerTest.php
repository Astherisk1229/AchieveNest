<?php

namespace Tests\unit;

use App\Services\StudentEvidenceClamAvScanner;
use CodeIgniter\Test\CIUnitTestCase;

final class StudentEvidenceClamAvScannerTest extends CIUnitTestCase
{
    public function testRailwaySafeEnvironmentNamesOverrideRuntimePaths(): void
    {
        putenv('CLAMAV_CLAMSCAN_PATH=/railway/bin/clamscan');
        putenv('CLAMAV_DATABASE_DIRECTORY=/railway/var/lib/clamav');

        try {
            $scanner = new StudentEvidenceClamAvScanner();
            $reflection = new \ReflectionClass($scanner);

            self::assertSame('/railway/bin/clamscan', $reflection->getProperty('binary')->getValue($scanner));
            self::assertSame('/railway/var/lib/clamav', $reflection->getProperty('databaseDirectory')->getValue($scanner));
        } finally {
            putenv('CLAMAV_CLAMSCAN_PATH');
            putenv('CLAMAV_DATABASE_DIRECTORY');
        }
    }

    public function testDeploymentOwnedClamAvRuntimeIsHealthy(): void
    {
        $scanner = $this->requireDeploymentRuntime();
        $health = $scanner->health();
        self::assertTrue($health['available']);
        self::assertStringContainsString('ClamAV', (string) $health['engine']);
    }

    public function testMissingFileNeverProducesCleanResult(): void
    {
        $result = (new StudentEvidenceClamAvScanner())->scan('C:/not-a-real-achievenest-evidence-file');
        self::assertSame('unavailable', $result['status']);
        self::assertSame('EVIDENCE_FILE_MISSING', $result['code']);
    }

    public function testUnavailableRuntimeNeverProducesCleanResult(): void
    {
        $missingRuntime = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'achievenest-clamav-not-installed';
        $scanner = new StudentEvidenceClamAvScanner(
            $missingRuntime . DIRECTORY_SEPARATOR . 'clamscan',
            $missingRuntime . DIRECTORY_SEPARATOR . 'database'
        );

        self::assertSame([
            'available' => false,
            'engine' => null,
            'code' => 'CLAMAV_RUNTIME_UNAVAILABLE',
        ], $scanner->health());
        self::assertSame([
            'status' => 'unavailable',
            'code' => 'CLAMAV_RUNTIME_UNAVAILABLE',
        ], $scanner->scan(__FILE__));
    }

    public function testRealDeploymentScannerAcceptsHarmlessPersistedFile(): void
    {
        $result = $this->requireDeploymentRuntime()->scan(__FILE__);
        self::assertSame('clean', $result['status']);
        self::assertSame('CLAMAV_CLEAN', $result['code']);
    }

    private function requireDeploymentRuntime(): StudentEvidenceClamAvScanner
    {
        $scanner = new StudentEvidenceClamAvScanner();
        if (! $scanner->health()['available']) {
            self::markTestSkipped('Deployment-owned ClamAV runtime is not installed in this test environment.');
        }

        return $scanner;
    }
}
