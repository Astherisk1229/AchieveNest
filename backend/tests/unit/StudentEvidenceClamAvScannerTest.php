<?php

namespace Tests\unit;

use App\Services\StudentEvidenceClamAvScanner;
use CodeIgniter\Test\CIUnitTestCase;

final class StudentEvidenceClamAvScannerTest extends CIUnitTestCase
{
    public function testDeploymentOwnedClamAvRuntimeIsHealthy(): void
    {
        $health = (new StudentEvidenceClamAvScanner())->health();
        self::assertTrue($health['available']);
        self::assertStringContainsString('ClamAV', (string) $health['engine']);
    }

    public function testMissingFileNeverProducesCleanResult(): void
    {
        $result = (new StudentEvidenceClamAvScanner())->scan('C:/not-a-real-achievenest-evidence-file');
        self::assertSame('unavailable', $result['status']);
        self::assertSame('EVIDENCE_FILE_MISSING', $result['code']);
    }

    public function testRealDeploymentScannerAcceptsHarmlessPersistedFile(): void
    {
        $result = (new StudentEvidenceClamAvScanner())->scan(__FILE__);
        self::assertSame('clean', $result['status']);
        self::assertSame('CLAMAV_CLEAN', $result['code']);
    }
}
