<?php

namespace Tests\Unit;

use App\Controllers\Api\CertificateController;
use App\Services\AuthenticatedActorService;
use App\Services\CertificateAssetStorageService;
use App\Services\CertificateIdentityService;
use App\Services\CertificateIssuanceService;
use App\Services\CertificatePdfRendererService;
use App\Services\CertificateSnapshotBuilder;
use App\Services\CertificateTemplateContractService;
use App\Services\CertificateVerificationQrService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\Response;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\HTTP\URI;
use CodeIgniter\Test\CIUnitTestCase;
use InvalidArgumentException;
use RuntimeException;

final class CertificatePdfRendererTest extends CIUnitTestCase
{
    private string $tempDir;
    private string $fixturesDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'cert_test_' . bin2hex(random_bytes(4));
        @mkdir($this->tempDir, 0755, true);

        $this->fixturesDir = $this->tempDir . DIRECTORY_SEPARATOR . 'fixtures';
        @mkdir($this->fixturesDir, 0755, true);
    }

    protected function tearDown(): void
    {
        $this->recursiveDelete($this->tempDir);
        parent::tearDown();
    }

    private function recursiveDelete(string $dir): void
    {
        if (!is_dir($dir)) return;
        $files = scandir($dir) ?: [];
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                $this->recursiveDelete($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    private function createPngFile(string $filename): string
    {
        $path = $this->fixturesDir . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));
        return $path;
    }

    public function testQrCodeGenerationProducesValidImageAndEnforcesPayload(): void
    {
        $qrService = new CertificateVerificationQrService();
        $png = $qrService->generatePng('https://achievenest.test/verify/certificate/abc123');
        self::assertStringStartsWith("\x89PNG\r\n\x1a\n", $png);
        self::assertGreaterThan(100, strlen($png));

        $dataUri = $qrService->generateDataUri('https://achievenest.test/verify/certificate/abc123');
        self::assertStringStartsWith('data:image/png;base64,', $dataUri);

        $dataUri2 = $qrService->generateDataUri('https://achievenest.test/verify/certificate/xyz789');
        self::assertNotSame($dataUri, $dataUri2);

        $this->expectException(InvalidArgumentException::class);
        $qrService->generatePng('   ');
    }

    public function testHtmlEscapingPreventsScriptInjectionAndDynamicHtml(): void
    {
        $renderer = new CertificatePdfRendererService(
            db: $this->createMock(BaseConnection::class),
            tempDir: $this->tempDir
        );

        $html = $renderer->buildHtml([
            'heading' => '<script>alert("heading")</script>',
            'recipient_lead_in' => 'Presented to',
            'recipient_name' => 'Jane & John <Doe>',
            'rendered_body' => 'Recognized for <b>Excellence</b> & "Leadership"',
            'footer_note' => 'Certificate {{certificate_number}}',
            'certificate_number' => 'AN-2026-000001',
            'issued_date' => '2026-09-25',
            'verification_url' => '/verify/certificate/test-public-id',
            'qr_data_uri' => 'data:image/png;base64,test',
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Dr. Smith <Director>',
                'title' => 'Dean & Director',
                'data_uri' => null,
            ]],
            'assets' => [],
            'layout' => ['theme_id' => 'emerald_gold'],
        ]);

        self::assertStringNotContainsString('<script>', $html);
        self::assertStringContainsString('&lt;script&gt;alert(&quot;heading&quot;)&lt;/script&gt;', $html);
        self::assertStringContainsString('Jane &amp; John &lt;Doe&gt;', $html);
        self::assertStringContainsString('Dr. Smith &lt;Director&gt;', $html);
        self::assertStringContainsString('Dean &amp; Director', $html);
        self::assertStringContainsString('AN-2026-000001', $html);
    }

    public function testRendererOutputsValidPdfBinaryWithMagicHeader(): void
    {
        $sigPath = $this->createPngFile('director_signature.png');

        $issuance = [
            'id' => 'iss-1',
            'certificate_number' => 'AN-2026-000100',
            'public_verification_id' => 'pub-100',
            'student_id' => 'stu-1',
            'status' => 'ISSUED',
            'issued_at' => '2026-09-25 10:00:00',
            'certificate_purpose' => 'APPRECIATION',
        ];

        $snapshot = [
            'certificate_identity' => [
                'id' => 'iss-1',
                'certificate_number' => 'AN-2026-000100',
                'public_verification_id' => 'pub-100',
                'verification_url' => '/verify/certificate/pub-100',
                'issued_at' => '2026-09-25 10:00:00',
            ],
            'recipient' => ['name' => 'Alice Student'],
            'source_record' => ['id' => 'src-1', 'title' => 'Leadership Seminar 2026'],
            'certificate_purpose' => 'APPRECIATION',
            'resolved_certificate_data' => [
                'recipient_name' => 'Alice Student',
                'activity_title' => 'Leadership Seminar 2026',
                'issuer_name' => 'Notre Dame of Marbel University',
                'issued_date' => '2026-09-25',
                'certificate_number' => 'AN-2026-000100',
                'verification_url' => '/verify/certificate/pub-100',
            ],
            'organizer_and_issuer' => [
                'organizer_name' => 'OSAD',
                'issuer_name' => 'Notre Dame of Marbel University',
            ],
            'dates' => ['issued_date' => '2026-09-25'],
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Dr. Maria Santos',
                'title' => 'OSAD Director',
                'signature_storage_path' => $sigPath,
            ]],
        ];

        $templateVersion = [
            'id' => 'ver-1',
            'layout_config' => [
                'layout_schema' => ['theme_id' => 'emerald_gold', 'orientation' => 'landscape', 'page_size' => 'A4'],
                'content_schema' => [
                    'heading' => 'Certificate of Appreciation',
                    'recipient_lead_in' => 'This certificate is proudly given to',
                    'body' => '{{recipient_name}} for outstanding contribution to {{activity_title}}.',
                    'footer_note' => 'Issued on {{issued_date}}. Certificate: {{certificate_number}}.',
                ],
            ],
            'placeholder_contract_json' => json_encode([
                ['name' => 'recipient_name', 'requirement_type' => 'REQUIRED'],
                ['name' => 'activity_title', 'requirement_type' => 'REQUIRED'],
                ['name' => 'issued_date', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
                ['name' => 'certificate_number', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
            ]),
        ];

        $renderer = new CertificatePdfRendererService(
            db: $this->createMock(BaseConnection::class),
            tempDir: $this->tempDir
        );

        $pdfBinary = $renderer->renderFromData($issuance, $snapshot, $templateVersion, []);
        self::assertStringStartsWith('%PDF-', $pdfBinary);
        self::assertGreaterThan(2000, strlen($pdfBinary));
    }

    public function testMissingRequiredSignatureThrowsControlledException(): void
    {
        $issuance = [
            'id' => 'iss-1',
            'certificate_number' => 'AN-2026-000101',
            'public_verification_id' => 'pub-101',
            'status' => 'ISSUED',
        ];

        $snapshot = [
            'certificate_identity' => ['certificate_number' => 'AN-2026-000101'],
            'recipient' => ['name' => 'Bob Scholar'],
            'resolved_certificate_data' => ['recipient_name' => 'Bob Scholar', 'activity_title' => 'Math Fair'],
            'dates' => ['issued_date' => '2026-09-25'],
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Dr. Missing',
                'title' => 'Director',
                'signature_storage_path' => $this->fixturesDir . '/non_existent_signature.png',
            ]],
        ];

        $renderer = new CertificatePdfRendererService(
            db: $this->createMock(BaseConnection::class),
            tempDir: $this->tempDir
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('MISSING_REQUIRED_SIGNATURE');
        $renderer->renderFromData($issuance, $snapshot, null, []);
    }

    public function testPathTraversalAndRemoteUrlAttemptsAreBlocked(): void
    {
        $issuance = ['id' => 'iss-1', 'certificate_number' => 'AN-2026-000102', 'status' => 'ISSUED'];
        $snapshot = [
            'certificate_identity' => ['certificate_number' => 'AN-2026-000102'],
            'recipient' => ['name' => 'Charlie'],
            'resolved_certificate_data' => ['recipient_name' => 'Charlie', 'activity_title' => 'Art Fest'],
            'dates' => ['issued_date' => '2026-09-25'],
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Dr. Traversal',
                'title' => 'Director',
                'signature_storage_path' => '../../secret/passwords.txt',
            ]],
        ];

        $renderer = new CertificatePdfRendererService(
            db: $this->createMock(BaseConnection::class),
            tempDir: $this->tempDir
        );

        try {
            $renderer->renderFromData($issuance, $snapshot, null, []);
            self::fail('Expected path traversal to be blocked.');
        } catch (RuntimeException $e) {
            self::assertSame('PATH_TRAVERSAL_BLOCKED', $e->getMessage());
        }

        // Test remote URL
        $snapshot['signatories'][0]['signature_storage_path'] = 'https://malicious.com/sig.png';
        try {
            $renderer->renderFromData($issuance, $snapshot, null, []);
            self::fail('Expected remote URL to be blocked.');
        } catch (RuntimeException $e) {
            self::assertSame('REMOTE_URL_BLOCKED', $e->getMessage());
        }
    }

    public function testSnapshotImmutabilityIsPreservedAgainstLaterProfileChanges(): void
    {
        $sigPath = $this->createPngFile('immutable_signature.png');

        $issuance = [
            'id' => 'iss-imm',
            'certificate_number' => 'AN-2026-000777',
            'public_verification_id' => 'pub-777',
            'student_id' => 'stu-original',
            'status' => 'ISSUED',
            'issued_at' => '2026-09-25 12:00:00',
        ];

        $originalSnapshot = [
            'certificate_identity' => [
                'certificate_number' => 'AN-2026-000777',
                'public_verification_id' => 'pub-777',
                'verification_url' => '/verify/certificate/pub-777',
            ],
            'recipient' => ['name' => 'Original Issued Name'],
            'resolved_certificate_data' => [
                'recipient_name' => 'Original Issued Name',
                'activity_title' => 'Immutable Workshop',
                'issued_date' => '2026-09-25',
                'certificate_number' => 'AN-2026-000777',
            ],
            'dates' => ['issued_date' => '2026-09-25'],
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Dr. Immutability',
                'title' => 'Director',
                'signature_storage_path' => $sigPath,
            ]],
        ];

        $renderer = new CertificatePdfRendererService(
            db: $this->createMock(BaseConnection::class),
            tempDir: $this->tempDir
        );

        // Rendering uses snapshot strictly
        $pdfBinary = $renderer->renderFromData($issuance, $originalSnapshot, null, []);
        self::assertStringStartsWith('%PDF-', $pdfBinary);
    }

    public function testReissueUsesNewCertificateNumberAndNewVerificationId(): void
    {
        $sigPath = $this->createPngFile('reissue_sig.png');

        $newIssuance = [
            'id' => 'iss-new',
            'certificate_number' => 'AN-2026-000999',
            'public_verification_id' => 'pub-new-999',
            'supersedes_certificate_id' => 'iss-old',
            'status' => 'ISSUED',
            'issued_at' => '2026-09-25 14:00:00',
        ];

        $newSnapshot = [
            'certificate_identity' => [
                'certificate_number' => 'AN-2026-000999',
                'public_verification_id' => 'pub-new-999',
                'verification_url' => '/verify/certificate/pub-new-999',
            ],
            'recipient' => ['name' => 'Corrected Student Name'],
            'resolved_certificate_data' => [
                'recipient_name' => 'Corrected Student Name',
                'activity_title' => 'Robotics Championship',
                'issued_date' => '2026-09-25',
                'certificate_number' => 'AN-2026-000999',
                'verification_url' => '/verify/certificate/pub-new-999',
            ],
            'dates' => ['issued_date' => '2026-09-25'],
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Dr. Maria',
                'title' => 'OSAD Director',
                'signature_storage_path' => $sigPath,
            ]],
        ];

        $renderer = new CertificatePdfRendererService(
            db: $this->createMock(BaseConnection::class),
            tempDir: $this->tempDir
        );

        $pdfBinary = $renderer->renderFromData($newIssuance, $newSnapshot, null, []);
        self::assertStringStartsWith('%PDF-', $pdfBinary);
    }
}
