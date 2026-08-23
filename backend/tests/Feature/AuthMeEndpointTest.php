<?php

namespace Tests\Feature;

use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class AuthMeEndpointTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    public function testAuthMeRequiresBearerToken(): void
    {
        $result = $this->get('/api/v1/auth/me');

        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'MISSING_BEARER_TOKEN',
            ],
        ]);
    }
}
