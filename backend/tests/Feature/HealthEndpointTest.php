<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class HealthEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testHealthEndpointReportsStatusWithoutLeakingSecrets(): void
    {
        $result = $this->get('/api/v1/health');

        $this->assertContains($result->response()->getStatusCode(), [200, 503]);
        $result->assertJSONFragment([
            'service' => 'AchieveNest API',
        ]);
        $json = json_decode($result->getJSON(), true);
        $this->assertArrayHasKey('database', $json);
        $this->assertArrayHasKey('configured', $json['database']);
        $this->assertArrayHasKey('connected', $json['database']);
    }
}
