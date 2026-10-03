<?php
namespace Tests\Isolated;

use App\Controllers\Api\PersonnelAccomplishmentController;
use App\Helpers\ValidationHelper;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionClass;
use ReflectionMethod;

/** G1: completed achievements cannot be dated in the future; end never before start. */
final class CompletedAchievementDatesTest extends CIUnitTestCase
{
    public function testIsFutureDate(): void
    {
        self::assertTrue(ValidationHelper::isFutureDate('2026-10-03', '2026-10-02'));
        self::assertFalse(ValidationHelper::isFutureDate('2026-10-02', '2026-10-02'));
        self::assertFalse(ValidationHelper::isFutureDate('2026-02-30', '2026-01-01'), 'invalid dates are left to the format check');
    }

    private function check(string $date, array $metadata): ?string
    {
        $controller = (new ReflectionClass(PersonnelAccomplishmentController::class))->newInstanceWithoutConstructor();
        return (new ReflectionMethod($controller, 'validateCompletedDates'))->invoke($controller, $date, $metadata);
    }

    public function testPersonnelAccomplishmentDates(): void
    {
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        self::assertNull($this->check('2025-05-01', []));
        self::assertNotNull($this->check($tomorrow, []));
        self::assertNotNull($this->check('', ['start_date' => $tomorrow]));
        self::assertNotNull($this->check('', ['start_date' => '2025-05-02', 'end_date' => '2025-05-01']));
        self::assertNotNull($this->check('', ['start_date' => '2025-05-01', 'end_date' => $tomorrow]));
        self::assertNull($this->check('', ['start_date' => '2025-05-01', 'end_date' => '', 'ongoing' => true]));
    }
}
