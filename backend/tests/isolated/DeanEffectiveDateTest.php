<?php
namespace Tests\Isolated;

use App\Services\DeanAssignmentService;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;

/** HR-2: Dean assignment effective date is real, not in the future, and not before the outgoing Dean's start. */
final class DeanEffectiveDateTest extends CIUnitTestCase
{
    private function svc(): DeanAssignmentService
    {
        return (new ReflectionClass(DeanAssignmentService::class))->newInstanceWithoutConstructor();
    }

    public function testRules(): void
    {
        $s = $this->svc();
        self::assertNull($s->effectiveDateFailure('2026-10-02', null, '2026-10-02'));
        self::assertSame('INVALID_EFFECTIVE_DATE', $s->effectiveDateFailure('2026-02-30', null, '2026-10-02')['error']['code']);
        self::assertSame('INVALID_EFFECTIVE_DATE', $s->effectiveDateFailure('next week', null, '2026-10-02')['error']['code']);
        self::assertSame('FUTURE_EFFECTIVE_DATE', $s->effectiveDateFailure('2026-10-03', null, '2026-10-02')['error']['code']);
        self::assertSame('EFFECTIVE_DATE_BEFORE_CURRENT_DEAN', $s->effectiveDateFailure('2025-05-31', '2025-06-01', '2026-10-02')['error']['code']);
        self::assertNull($s->effectiveDateFailure('2025-06-01', '2025-06-01', '2026-10-02'));
    }
}
