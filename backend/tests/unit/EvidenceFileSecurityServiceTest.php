<?php

use App\Services\EvidenceFileSecurityService;
use CodeIgniter\HTTP\Files\UploadedFile;
use CodeIgniter\Test\CIUnitTestCase;

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
        $file = $this->uploadedFile($bytes, 'certificate.pdf', 'application/pdf');

        $result = (new EvidenceFileSecurityService())->inspectAndScan($file);

        $this->assertSame('application/pdf', $result['mime_type']);
        $this->assertSame('pdf', $result['extension']);
        $this->assertSame(strlen($bytes), $result['byte_size']);
        $this->assertSame(hash('sha256', $bytes), $result['sha256']);
        $this->assertSame('not_required', $result['scan_status']);
    }

    public function testRejectsPdfWithActiveJavaScriptMarker(): void
    {
        $bytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /OpenAction 2 0 R >>\nendobj\n2 0 obj\n<< /S /JavaScript /JS (app.alert('x')) >>\nendobj\n%%EOF\n";
        $file = $this->uploadedFile($bytes, 'unsafe.pdf', 'application/pdf');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('unsupported active or embedded content');
        (new EvidenceFileSecurityService())->inspectAndScan($file);
    }

    public function testRejectsDisguisedPdfWhoseBytesArePlainText(): void
    {
        $file = $this->uploadedFile('This is not a PDF file.', 'fake.pdf', 'application/pdf');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Unsupported evidence file type');
        (new EvidenceFileSecurityService())->inspectAndScan($file);
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

        $file = new UploadedFile($path, 'too-large.pdf', 'application/pdf', filesize($path), UPLOAD_ERR_OK);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('between 1 byte and 20 MB');
        (new EvidenceFileSecurityService())->inspectAndScan($file);
    }

    public function testFailsClosedWhenMalwareScannerIsRequiredButMissing(): void
    {
        putenv('EVIDENCE_MALWARE_SCAN_REQUIRED=true');
        $_ENV['EVIDENCE_MALWARE_SCAN_REQUIRED'] = 'true';
        $_SERVER['EVIDENCE_MALWARE_SCAN_REQUIRED'] = 'true';
        $bytes = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n";
        $file = $this->uploadedFile($bytes, 'certificate.pdf', 'application/pdf');

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('malware scanner is not configured');
        (new EvidenceFileSecurityService())->inspectAndScan($file);
    }

    private function uploadedFile(string $bytes, string $name, string $declaredMime): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'achievenest-evidence-');
        file_put_contents($path, $bytes);
        $this->tempFiles[] = $path;

        return new UploadedFile($path, $name, $declaredMime, strlen($bytes), UPLOAD_ERR_OK);
    }
}
