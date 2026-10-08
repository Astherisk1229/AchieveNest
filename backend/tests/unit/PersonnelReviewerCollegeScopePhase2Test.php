<?php

declare(strict_types=1);

use App\Services\PersonnelReviewerAssignmentService;
use App\Services\PersonnelReviewerRoutingRegistry;
use App\Services\PersonnelRevisionRequestService;
use PHPUnit\Framework\TestCase;

final class PersonnelReviewerCollegeScopePhase2Test extends TestCase
{
    public function testDeanAuthorizationRequiresMatchingNonEmptyCollegeScopes(): void
    {
        $dean = ['profile_id' => 'DEAN-CEAC', 'roles' => ['dean'], 'assigned_college_id' => 'COLLEGE-CEAC'];
        $target = ['personnel_profile_id' => 'FACULTY-1', 'assigned_reviewer_role' => 'dean', 'target_college_id' => 'COLLEGE-CEAC'];

        self::assertTrue(PersonnelReviewerRoutingRegistry::isAuthorizedReviewer($dean, $target));
        self::assertFalse(PersonnelReviewerRoutingRegistry::isAuthorizedReviewer($dean, [...$target, 'target_college_id' => null]));
        self::assertFalse(PersonnelReviewerRoutingRegistry::isAuthorizedReviewer($dean, [...$target, 'target_college_id' => '']));
        self::assertFalse(PersonnelReviewerRoutingRegistry::isAuthorizedReviewer(
            ['profile_id' => 'DEAN-UNSCOPED', 'roles' => ['dean']],
            $target
        ));
    }

    public function testReviewerQueueAuthorizationRequiresDeanCollegeScope(): void
    {
        $service = new PersonnelReviewerAssignmentService();
        $dean = ['profile_id' => 'DEAN-CEAC', 'roles' => ['dean'], 'assigned_college_id' => 'COLLEGE-CEAC'];

        self::assertFalse($service->canReviewerAccessEvaluation($dean, [
            'personnel_profile_id' => 'FACULTY-1',
            'assigned_reviewer_role' => 'dean',
            'evaluator_college_id' => null,
        ]));
        self::assertFalse($service->canReviewerAccessEvaluation(
            ['profile_id' => 'DEAN-UNSCOPED', 'roles' => ['dean']],
            ['personnel_profile_id' => 'FACULTY-1', 'assigned_reviewer_role' => 'dean', 'evaluator_college_id' => 'COLLEGE-CEAC']
        ));
    }

    public function testRevisionRequestAuthorizationFailsClosedForUnscopedDean(): void
    {
        $service = (new ReflectionClass(PersonnelRevisionRequestService::class))->newInstanceWithoutConstructor();
        $decision = $service->canRequestRevision(
            ['profile_id' => 'DEAN-CEAC', 'roles' => ['dean'], 'assigned_college_id' => 'COLLEGE-CEAC'],
            [
                'personnel_profile_id' => 'FACULTY-1',
                'status' => 'in_evaluation',
                'assigned_reviewer_role' => 'dean',
                'target_college_id' => null,
            ]
        );

        self::assertFalse($decision['allowed']);
    }
}
