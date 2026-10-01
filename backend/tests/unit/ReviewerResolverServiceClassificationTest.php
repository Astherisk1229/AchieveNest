<?php

namespace Tests\Unit;

use App\Services\ReviewerResolverService;
use PHPUnit\Framework\TestCase;

final class ReviewerResolverServiceClassificationTest extends TestCase
{
    public function test_personnel_group_alone_controls_dean_evaluability(): void
    {
        $service = new ReviewerResolverService();

        self::assertTrue($service->isDeanEvaluable(['personnel_group' => 'faculty', 'organizational_side' => 'academic']));
        self::assertFalse($service->isDeanEvaluable(['personnel_group' => 'non_teaching_faculty', 'organizational_side' => 'academic']));
        self::assertTrue($service->isDeanEvaluable(['personnel_group' => 'faculty', 'organizational_side' => 'non_academic']));
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
