<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class HealthEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testHealthEndpointReportsUnconfiguredDatabaseWithoutLeakingSecrets(): void
    {
        $result = $this->get('/api/v1/health');

        $result->assertStatus(200);
        $result->assertJSONFragment([
            'service'  => 'AchieveNest API',
            'status'   => 'ok',
            'database' => [
                'configured' => false,
                'connected'  => false,
            ],
        ]);
    }
}
