<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class AchievementAndEventEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testListAchievementsRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/achievements');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testCreateAchievementRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/achievements', [
            'title' => 'First Place Hackathon',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testVerificationQueueRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/verification/queue');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testVerificationDecisionRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/verification/req_123/decide', [
            'decision' => 'approved',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testListEventsRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/events');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }

    public function testCreateEventRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/events', [
            'title' => 'Annual CSD Tech Summit',
        ]);

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'UNAUTHORIZED',
            ],
        ]);
    }
}
