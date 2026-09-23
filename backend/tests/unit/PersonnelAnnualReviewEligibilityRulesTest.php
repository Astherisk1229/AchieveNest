<?php

use App\Services\PersonnelEligibilityService;
use PHPUnit\Framework\TestCase;

final class PersonnelAnnualReviewEligibilityRulesTest extends TestCase
{
    public function testCanonicalRatingThreshold(): void
    {
        foreach (['outstanding','very_satisfactory','satisfactory'] as $rating) $this->assertTrue(PersonnelEligibilityService::isEligibleRating($rating));
        foreach (['fair','poor','cleared','not_cleared',null] as $rating) $this->assertFalse(PersonnelEligibilityService::isEligibleRating($rating));
    }

    public function testEmploymentServiceThreshold(): void
    {
        $this->assertTrue(PersonnelEligibilityService::serviceCondition('permanent', 0.0));
        $this->assertFalse(PersonnelEligibilityService::serviceCondition('probationary', 2.99));
        $this->assertTrue(PersonnelEligibilityService::serviceCondition('probationary', 3.0));
        $this->assertTrue(PersonnelEligibilityService::serviceCondition('probationary', 4.25));
        $this->assertNull(PersonnelEligibilityService::serviceCondition('probationary', null));
    }
}
