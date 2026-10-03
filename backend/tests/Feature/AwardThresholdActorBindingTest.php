<?php

namespace Tests\Feature;

use App\Controllers\Api\AwardEvaluationController;
use CodeIgniter\Test\CIUnitTestCase;
use ReflectionMethod;

final class AwardThresholdActorBindingTest extends CIUnitTestCase
{
    public function testThresholdMutationUsesAuthenticatedActorAndIgnoresClientActorFields(): void
    {
        $controller = new AwardEvaluationController();
        $method = new ReflectionMethod($controller, 'thresholdMutationArguments');
        $method->setAccessible(true);

        $actor = ['profile' => ['id' => 'server-verified-osad-id']];
        $payload = [
            'candidate_threshold_percent' => '82.50',
            'actor_profile_id' => 'client-spoofed-id',
            'p_actor_profile_id' => 'another-spoofed-id',
        ];

        $arguments = $method->invoke($controller, $actor, 'award-id', $payload);

        $this->assertSame(['server-verified-osad-id', 'award-id', '82.50'], $arguments);
        $this->assertNotContains('client-spoofed-id', $arguments);
        $this->assertNotContains('another-spoofed-id', $arguments);
    }

    public function testThresholdMutationRejectsUnapprovedOrInvalidConfigurationFields(): void
    {
        $controller = new AwardEvaluationController();
        $method = new ReflectionMethod($controller, 'thresholdMutationArguments');
        $method->setAccessible(true);
        $actor = ['profile' => ['id' => 'server-verified-osad-id']];

        $this->assertNull($method->invoke($controller, $actor, 'award-id', ['actor_profile_id' => 'spoofed']));
        $this->assertNull($method->invoke($controller, $actor, 'award-id', ['candidate_threshold_percent' => '100.001']));
        $this->assertNull($method->invoke($controller, $actor, 'award-id', ['candidate_threshold_percent' => '-1']));
    }

    public function testThresholdMutationRequiresActiveDualAuthorizedOsadAdministrator(): void
    {
        $controller = new AwardEvaluationController();
        $method = new ReflectionMethod($controller, 'isAuthorizedThresholdActor');
        $method->setAccessible(true);

        $this->assertTrue($method->invoke($controller, [
            'profile' => ['account_type' => 'osad_admin', 'status' => 'active'],
            'roles' => ['osad_staff'],
        ]));
        $this->assertFalse($method->invoke($controller, [
            'profile' => ['account_type' => 'personnel', 'status' => 'active'],
            'roles' => ['osad_staff'],
        ]));
        $this->assertFalse($method->invoke($controller, [
            'profile' => ['account_type' => 'osad_admin', 'status' => 'active'],
            'roles' => [],
        ]));
        $this->assertFalse($method->invoke($controller, [
            'profile' => ['account_type' => 'osad_admin', 'status' => 'inactive'],
            'roles' => ['osad_staff'],
        ]));
    }
}
