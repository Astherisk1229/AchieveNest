<?php

namespace Tests\Unit;

use App\Services\NtfAnnualReviewAreaAService;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;
use ReflectionClass;

final class NtfAnnualReviewAreaADirectScoreTest extends TestCase
{
    public function testDirectScoreRejectsFractionalDsBeforeSaving(): void
    {
        $service = (new ReflectionClass(NtfAnnualReviewAreaAService::class))->newInstanceWithoutConstructor();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('DS_WHOLE_NUMBER_REQUIRED');
        $service->setDirectScore([], 'A.1', 30.5, 'hr-profile');
    }
}
