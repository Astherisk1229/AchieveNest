<?php

namespace Tests\Unit;

use App\Services\OcrExtractionService;
use CodeIgniter\Test\CIUnitTestCase;

final class OcrExtractionServiceTest extends CIUnitTestCase
{
    public function testRailwaySafeEnvironmentNamesOverrideRuntimePaths(): void
    {
        putenv('OCR_TESSERACT_PATH=/railway/bin/tesseract');
        putenv('OCR_PDF_TO_TEXT_PATH=/railway/bin/pdftotext');
        putenv('OCR_PDF_TO_PPM_PATH=/railway/bin/pdftoppm');

        try {
            $service = new OcrExtractionService();
            $reflection = new \ReflectionClass($service);

            self::assertSame('/railway/bin/tesseract', $reflection->getProperty('tesseract')->getValue($service));
            self::assertSame('/railway/bin/pdftotext', $reflection->getProperty('pdfToText')->getValue($service));
            self::assertSame('/railway/bin/pdftoppm', $reflection->getProperty('pdfToPpm')->getValue($service));
        } finally {
            putenv('OCR_TESSERACT_PATH');
            putenv('OCR_PDF_TO_TEXT_PATH');
            putenv('OCR_PDF_TO_PPM_PATH');
        }
    }

    public function testNormalizationRemovesInvisibleAndControlCharacters(): void
    {
        $service = new OcrExtractionService('missing', 'missing', 'missing');
        $this->assertSame("Doctor of Philosophy\n36 units", $service->normalize(" Doctor  of Philosophy\u{200B}\r\n36\tunits\0 "));
    }

    public function testQualityGateRejectsBinaryGarbage(): void
    {
        $service = new OcrExtractionService('missing', 'missing', 'missing');
        $this->assertSame('failed', $service->quality("\x01\x02���%%%")['label']);
        $this->assertContains($service->quality('Doctor of Philosophy conferred by Notre Dame University')['label'], ['good', 'review']);
    }
}
