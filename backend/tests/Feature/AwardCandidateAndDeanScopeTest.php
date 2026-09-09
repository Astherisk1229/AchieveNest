<?php

namespace Tests\Feature;

use App\Services\Policies\AwardPolicy;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class AwardCandidateAndDeanScopeTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected AwardPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new AwardPolicy();
    }

    public function testUnauthenticatedAwardsAndCandidatesReturn401(): void
    {
        $resAwards = $this->get('api/v1/osad/awards');
        $resAwards->assertStatus(401);

        $resCandidates = $this->get('api/v1/osad/candidates');
        $resCandidates->assertStatus(401);

        $resNominate = $this->post('api/v1/dean/nominations', [
            'student_profile_id'  => 'some-student',
            'award_definition_id' => 'some-award',
            'justification'       => 'test',
        ]);
        $resNominate->assertStatus(401);
    }

    public function testAwardPolicyEnforcesDeanRoleForNomination(): void
    {
        // 1. Student actor -> cannot nominate
        $studentActor = [
            'profile' => ['id' => 'student-uuid', 'account_type' => 'student'],
            'roles'   => ['student'],
            'assignments' => [],
        ];
        $this->assertFalse($this->policy->canNominateStudent($studentActor));

        // 2. OSAD admin without Dean assignment -> cannot nominate via Dean pathway
        $osadActor = [
            'profile' => ['id' => 'osad-uuid', 'account_type' => 'osad_admin'],
            'roles'   => ['osad_staff'],
            'assignments' => [],
        ];
        $this->assertFalse($this->policy->canNominateStudent($osadActor));

        // 3. Faculty without active Dean assignment -> cannot nominate
        $facultyActor = [
            'profile' => ['id' => 'faculty-uuid', 'account_type' => 'faculty'],
            'roles'   => ['faculty'],
            'assignments' => [],
        ];
        $this->assertFalse($this->policy->canNominateStudent($facultyActor));

        // 4. Active Dean of CBA -> can nominate
        $deanActor = [
            'profile' => ['id' => 'dean-uuid', 'account_type' => 'dean'],
            'roles'   => ['dean'],
            'assignments' => [
                [
                    'role_key'   => 'dean',
                    'scope_type' => 'college',
                    'scope_id'   => '20000000-0000-0000-0000-000000000002',
                ]
            ],
        ];
        $this->assertTrue($this->policy->canNominateStudent($deanActor));
    }

    public function testAwardPolicyRestrictsEvaluationExecutionToOSADAdmin(): void
    {
        $deanActor = [
            'profile' => ['id' => 'dean-uuid', 'account_type' => 'dean'],
            'roles'   => ['dean'],
        ];
        $this->assertFalse($this->policy->canRunAwardEvaluation($deanActor));

        $osadActor = [
            'profile' => ['id' => 'osad-uuid', 'account_type' => 'osad_admin'],
            'roles'   => ['osad_staff'],
        ];
        $this->assertTrue($this->policy->canRunAwardEvaluation($osadActor));
    }
}
