<?php

namespace Tests\Unit;

use App\Services\ReviewerResolverService;
use PHPUnit\Framework\TestCase;

final class ReviewerResolverServiceClassificationTest extends TestCase
{
    public function test_only_faculty_on_academic_side_is_dean_evaluable(): void
    {
        $service = new ReviewerResolverService();

        self::assertTrue($service->isDeanEvaluable(['personnel_group' => 'faculty', 'organizational_side' => 'academic']));
        self::assertFalse($service->isDeanEvaluable(['personnel_group' => 'non_teaching_faculty', 'organizational_side' => 'academic']));
        self::assertFalse($service->isDeanEvaluable(['personnel_group' => 'faculty', 'organizational_side' => 'non_academic']));
    }

    public function test_position_or_designation_never_changes_the_canonical_route(): void
    {
        $service = new ReviewerResolverService();

        self::assertTrue($service->isDeanEvaluable([
            'personnel_group' => 'faculty',
            'organizational_side' => 'academic',
            'designation' => 'Program Coordinator',
        ]));
        self::assertFalse($service->isDeanEvaluable([
            'personnel_group' => 'non_teaching_faculty',
            'organizational_side' => 'academic',
            'designation' => 'Professor',
        ]));
    }
}
