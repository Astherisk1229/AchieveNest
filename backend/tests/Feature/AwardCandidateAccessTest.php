<?php

namespace Tests\Feature;

use App\Services\Policies\AwardPolicy;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class AwardCandidateAccessTest extends CIUnitTestCase
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

    }

    public function testAwardPolicyRestrictsEvaluationExecutionToOSADAdmin(): void
    {
        $deanActor = [
            'profile' => ['id' => 'dean-uuid', 'account_type' => 'dean'],
            'roles'   => ['dean'],
        ];
        $this->assertFalse($this->policy->canRunAwardEvaluation($deanActor));

        $osadActor = [
            'profile' => ['id' => 'osad-uuid', 'account_type' => 'osad_admin', 'status' => 'active'],
            'roles'   => ['osad_staff'],
        ];
        $this->assertTrue($this->policy->canRunAwardEvaluation($osadActor));
    }
}
