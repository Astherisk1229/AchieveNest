<?php

use App\Services\EvidenceFileSecurityService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Test wrapper exposes only the protected byte-inspection core. Production
 * HTTP requests still go through inspectAndScan(), which requires a valid
 * UploadedFile created by PHP's HTTP upload mechanism.
 */
final class TestableEvidenceFileSecurityService extends EvidenceFileSecurityService
{
    public function inspectPathForTest(string $path, string $clientName): array
    {
        return $this->inspectPath($path, $clientName);
    }
}

/**
 * @internal
 */
final class EvidenceFileSecurityServiceTest extends CIUnitTestCase
{
    private array $tempFiles = [];

    protected function setUp(): void
    {
        parent::setUp();
        putenv('EVIDENCE_MALWARE_SCAN_REQUIRED=false');
        $_ENV['EVIDENCE_MALWARE_SCAN_REQUIRED'] = 'false';
        $_SERVER['EVIDENCE_MALWARE_SCAN_REQUIRED'] = 'false';
        putenv('EVIDENCE_MALWARE_SCANNER_PATH');
        unset($_ENV['EVIDENCE_MALWARE_SCANNER_PATH'], $_SERVER['EVIDENCE_MALWARE_SCANNER_PATH']);
    }

    protected function tearDown(): void
    {
        foreach ($this->tempFiles as $file) {
            if (is_file($file)) {
                @unlink($file);
            }
        }
        putenv('EVIDENCE_MALWARE_SCAN_REQUIRED');
        unset($_ENV['EVIDENCE_MALWARE_SCAN_REQUIRED'], $_SERVER['EVIDENCE_MALWARE_SCAN_REQUIRED']);
        parent::tearDown();
    }

    public function testAcceptsCleanPdfAndDerivesChecksumFromBytes(): void
    {
        $bytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<<>>\n%%EOF\n";
        $path = $this->tempFile($bytes);

        $result = (new TestableEvidenceFileSecurityService())->inspectPathForTest($path, 'certificate.pdf');

        $this->assertSame('application/pdf', $result['mime_type']);
        $this->assertSame('pdf', $result['extension']);
        $this->assertSame(strlen($bytes), $result['byte_size']);
        $this->assertSame(hash('sha256', $bytes), $result['sha256']);
        $this->assertSame('not_required', $result['scan_status']);
    }

    public function testRejectsPdfWithActiveJavaScriptMarker(): void
    {
        $bytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /OpenAction 2 0 R >>\nendobj\n2 0 obj\n<< /S /JavaScript /JS (app.alert('x')) >>\nendobj\n%%EOF\n";
        $path = $this->tempFile($bytes);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('unsupported active or embedded content');
        (new TestableEvidenceFileSecurityService())->inspectPathForTest($path, 'unsafe.pdf');
    }

    public function testRejectsDisguisedPdfWhoseBytesArePlainText(): void
    {
        $path = $this->tempFile('This is not a PDF file.');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Unsupported evidence file type');
        (new TestableEvidenceFileSecurityService())->inspectPathForTest($path, 'fake.pdf');
    }

    public function testRejectsOversizedFile(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'achievenest-evidence-');
        $this->tempFiles[] = $path;
        $handle = fopen($path, 'wb');
        $this->assertNotFalse($handle);
        fseek($handle, (20 * 1024 * 1024));
        fwrite($handle, "X");
        fclose($handle);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('between 1 byte and 20 MB');
        (new TestableEvidenceFileSecurityService())->inspectPathForTest($path, 'too-large.pdf');
    }

    public function testFailsClosedWhenMalwareScannerIsRequiredButMissing(): void
    {
        putenv('EVIDENCE_MALWARE_SCAN_REQUIRED=true');
        $_ENV['EVIDENCE_MALWARE_SCAN_REQUIRED'] = 'true';
        $_SERVER['EVIDENCE_MALWARE_SCAN_REQUIRED'] = 'true';
        $bytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";
        $path = $this->tempFile($bytes);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('malware scanner is not configured');
        (new TestableEvidenceFileSecurityService())->inspectPathForTest($path, 'certificate.pdf');
    }

    private function tempFile(string $bytes): string
    {
        $path = tempnam(sys_get_temp_dir(), 'achievenest-evidence-');
        file_put_contents($path, $bytes);
        $this->tempFiles[] = $path;
        return $path;
    }
}
