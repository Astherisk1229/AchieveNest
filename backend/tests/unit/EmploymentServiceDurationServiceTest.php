<?php

use App\Services\EmploymentServiceDurationService;
use CodeIgniter\Test\CIUnitTestCase;

final class EmploymentServiceDurationServiceTest extends CIUnitTestCase
{
    private EmploymentServiceDurationService $service;

    protected function setUp(): void { parent::setUp(); $this->service = new EmploymentServiceDurationService(); }

    public function testCalendarAwareDurations(): void
    {
        $cases = [
            ['2023-06-01','2026-06-01',3,0,0], ['2023-06-01','2026-05-31',2,11,30],
            ['2023-06-01','2026-06-02',3,0,1], ['2020-02-29','2024-02-29',4,0,0],
            ['2024-02-29','2025-02-28',0,11,30], ['2023-01-31','2023-02-28',0,0,28],
        ];
        foreach ($cases as [$start,$reference,$years,$months,$days]) {
            $actual = $this->service->calculate($start,$reference);
            $this->assertSame([$years,$months,$days],[$actual['years'],$actual['months'],$actual['days']]);
        }
    }

    public function testMissingDateIsUnavailable(): void { $this->assertNull($this->service->calculate(null,'2026-01-01')); }

    public function testRequiredAndFutureDatesAreRejected(): void
    {
        foreach ([['','2026-01-01'],['2026-01-02','2026-01-01'],['2026-02-30','2026-03-01']] as [$start,$reference]) {
            try { $this->service->validateRequiredStartDate($start,$reference); $this->fail('Expected validation failure.'); }
            catch (InvalidArgumentException) { $this->addToAssertionCount(1); }
        }
    }
}
