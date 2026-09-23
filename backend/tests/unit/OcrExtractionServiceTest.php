<?php

namespace Tests\Unit;

use App\Services\OcrExtractionService;
use CodeIgniter\Test\CIUnitTestCase;

final class OcrExtractionServiceTest extends CIUnitTestCase
{
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
