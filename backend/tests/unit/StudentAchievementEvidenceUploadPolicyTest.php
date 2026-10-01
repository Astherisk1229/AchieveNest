<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\LocalEvidenceStorageService;
use App\Services\StudentAchievementEvidenceUploadPolicy;
use CodeIgniter\Test\CIUnitTestCase;

final class StudentAchievementEvidenceUploadPolicyTest extends CIUnitTestCase
{
    private StudentAchievementEvidenceUploadPolicy $policy;
    private string $temporaryDirectory;

    protected function setUp(): void
    {
        parent::setUp();
        $this->temporaryDirectory = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'achievenest-upload-policy-' . bin2hex(random_bytes(6));
        mkdir($this->temporaryDirectory, 0700, true);
        $this->policy = new StudentAchievementEvidenceUploadPolicy(new LocalEvidenceStorageService());
    }

    protected function tearDown(): void
    {
        foreach (glob($this->temporaryDirectory . DIRECTORY_SEPARATOR . '*') ?: [] as $file) {
            @unlink($file);
        }
        @rmdir($this->temporaryDirectory);
        parent::tearDown();
    }

    public function testAcceptsRepresentativeJpegPngAndOneOrTwoPagePdf(): void
    {
        $dataset = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/';
        foreach ([
            ['P01_clean_academic_certificate.jpg', 'evidence.jpg'],
            ['P04_campus_journalism_certificate.png', 'evidence.png'],
            ['P06_seminar_training_certificate.pdf', 'one-page.pdf'],
            ['P13_multipage_achievement_evidence.pdf', 'two-page.pdf'],
        ] as [$source, $name]) {
            $result = $this->policy->validate($dataset . $source, $name);
            self::assertTrue($result['success'] ?? false, $source . ': ' . ($result['error_code'] ?? 'unknown'));
        }
    }

    public function testRejectsUnsupportedOversizeAndThreePageFiles(): void
    {
        $unsupported = $this->temporaryDirectory . '/unsupported.txt';
        file_put_contents($unsupported, 'not student evidence');
        self::assertSame('UNSUPPORTED_FILE_TYPE', $this->policy->validate($unsupported, 'unsupported.txt')['error_code'] ?? null);

        $oversize = $this->temporaryDirectory . '/oversize.jpg';
        $jpeg = file_get_contents(dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg');
        file_put_contents($oversize, $jpeg . str_repeat("\0", LocalEvidenceStorageService::DEFAULT_MAX_BYTES));
        self::assertSame('FILE_TOO_LARGE', $this->policy->validate($oversize, 'oversize.jpg')['error_code'] ?? null);

        $threePage = $this->temporaryDirectory . '/three-pages.pdf';
        file_put_contents($threePage, "%PDF-1.4\n1 0 obj<</Type/Page>>endobj\n2 0 obj<</Type/Page>>endobj\n3 0 obj<</Type/Page>>endobj\n%%EOF");
        self::assertSame('STUDENT_EVIDENCE_PDF_PAGE_LIMIT_EXCEEDED', $this->policy->validate($threePage, 'three-pages.pdf')['error_code'] ?? null);
    }
}
