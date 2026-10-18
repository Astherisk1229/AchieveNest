<?php

namespace Tests\Unit;

use App\Services\NonTeachingRankRecommendationService as Recommendation;
use CodeIgniter\Test\CIUnitTestCase;

final class NonTeachingRankRecommendationTest extends CIUnitTestCase
{
    public function testLockedPassingScoreMustBePositiveAndUnambiguous(): void
    {
        self::assertSame(75.0, Recommendation::lockedPassingScore(['version' => ['passing_score' => 75], 'sheet' => ['passing_score' => 75]]));
        self::assertNull(Recommendation::lockedPassingScore(['version' => ['passing_score' => 0]]));
        self::assertNull(Recommendation::lockedPassingScore(['version' => ['passing_score' => 75], 'sheet' => ['passing_score' => 80]]));
    }

    public function testFailedEvaluationRetainsPresentRankEvenWhenApplicationIsUnresolved(): void
    {
        self::assertSame(['rank' => 'Assistant Instructor', 'status' => 'retained_present_rank'],
            Recommendation::outcome(70, 75, 'Assistant Instructor', '', 'RULE_REVIEW_REQUIRED', false));
    }

    public function testPassingEvaluationRequiresValidTargetButNotConfirmation(): void
    {
        self::assertSame(['rank' => 'Assistant Instructor', 'status' => 'retained_masters_required'],
            Recommendation::outcome(90, 75, 'Assistant Instructor', '', 'MASTERS_REQUIRED', false));
        self::assertSame(['rank' => 'Senior Instructor', 'status' => 'retained_masters_required'],
            Recommendation::outcome(90, 75, 'Senior Instructor', '', 'MASTERS_REQUIRED', false));
        self::assertSame(['rank' => null, 'status' => 'pending_rule_review'],
            Recommendation::outcome(90, 75, 'Assistant Instructor', '', 'RULE_REVIEW_REQUIRED', false));
        self::assertSame(['rank' => 'Professor II', 'status' => 'passed_applied_rank'],
            Recommendation::outcome(90, 75, 'Professor I', 'Professor II', 'PENDING_CONFIRMATION', true));
        self::assertSame(['rank' => null, 'status' => 'pending_rule_review'],
            Recommendation::outcome(90, 75, 'Professor I', 'Professor II', 'confirmed', false));
        self::assertSame(['rank' => 'Professor II', 'status' => 'passed_applied_rank'],
            Recommendation::outcome(90, 75, 'Professor I', 'Professor II', 'confirmed', true));
    }
}
