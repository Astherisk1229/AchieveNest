<?php

namespace Tests\Unit;

use App\Services\StudentEvidencePaddleOcrService;
use PHPUnit\Framework\TestCase;
use RuntimeException;

final class StudentEvidencePaddleOcrBoundaryTest extends TestCase
{
    public function testUnsupportedMimeIsRejectedBeforeRuntimeInvocation(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OCR_TYPE_UNSUPPORTED');
        (new StudentEvidencePaddleOcrService())->extract(__FILE__, 'text/plain');
    }

    public function testMissingEvidenceIsRejectedBeforeRuntimeInvocation(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('OCR_EVIDENCE_INVALID');
        (new StudentEvidencePaddleOcrService())->extract(__DIR__ . '/missing.png', 'image/png');
    }

    public function testTimeoutPolicyExceedsRepresentativeCeiling(): void
    {
        $this->assertSame(60, StudentEvidencePaddleOcrService::TIMEOUT_SECONDS);
        $this->assertGreaterThan(40.9, StudentEvidencePaddleOcrService::TIMEOUT_SECONDS);
    }
}
