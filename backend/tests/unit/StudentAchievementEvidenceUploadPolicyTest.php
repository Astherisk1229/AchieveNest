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
        $jpeg = $this->temporaryDirectory . '/evidence.jpg';
        $png = $this->temporaryDirectory . '/evidence.png';
        $onePagePdf = $this->temporaryDirectory . '/one-page.pdf';
        $twoPagePdf = $this->temporaryDirectory . '/two-page.pdf';
        $this->createImageFixture($jpeg, 'jpeg');
        $this->createImageFixture($png, 'png');
        $this->createPdfFixture($onePagePdf, 1);
        $this->createPdfFixture($twoPagePdf, 2);

        foreach ([
            [$jpeg, 'evidence.jpg'],
            [$png, 'evidence.png'],
            [$onePagePdf, 'one-page.pdf'],
            [$twoPagePdf, 'two-page.pdf'],
        ] as [$source, $name]) {
            $result = $this->policy->validate($source, $name);
            self::assertTrue($result['success'] ?? false, $name . ': ' . ($result['error_code'] ?? 'unknown'));
        }
    }

    public function testRejectsUnsupportedOversizeAndThreePageFiles(): void
    {
        $unsupported = $this->temporaryDirectory . '/unsupported.txt';
        file_put_contents($unsupported, 'not student evidence');
        self::assertSame('UNSUPPORTED_FILE_TYPE', $this->policy->validate($unsupported, 'unsupported.txt')['error_code'] ?? null);

        $oversize = $this->temporaryDirectory . '/oversize.jpg';
        file_put_contents($oversize, str_repeat("\0", LocalEvidenceStorageService::DEFAULT_MAX_BYTES + 1));
        self::assertSame('FILE_TOO_LARGE', $this->policy->validate($oversize, 'oversize.jpg')['error_code'] ?? null);

        $threePage = $this->temporaryDirectory . '/three-pages.pdf';
        file_put_contents($threePage, "%PDF-1.4\n1 0 obj<</Type/Page>>endobj\n2 0 obj<</Type/Page>>endobj\n3 0 obj<</Type/Page>>endobj\n%%EOF");
        self::assertSame('STUDENT_EVIDENCE_PDF_PAGE_LIMIT_EXCEEDED', $this->policy->validate($threePage, 'three-pages.pdf')['error_code'] ?? null);
    }

    private function createImageFixture(string $path, string $format): void
    {
        $image = imagecreatetruecolor(2, 2);
        self::assertNotFalse($image);

        try {
            $created = $format === 'jpeg' ? imagejpeg($image, $path) : imagepng($image, $path);
            self::assertTrue($created);
        } finally {
            imagedestroy($image);
        }
    }

    private function createPdfFixture(string $path, int $pageCount): void
    {
        $pages = '';
        for ($page = 1; $page <= $pageCount; $page++) {
            $pages .= sprintf("%d 0 obj<</Type/Page>>endobj\n", $page);
        }
        file_put_contents($path, "%PDF-1.4\n{$pages}%%EOF");
    }
}
