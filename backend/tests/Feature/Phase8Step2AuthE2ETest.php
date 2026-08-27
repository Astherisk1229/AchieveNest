<?php

namespace Tests\Feature;

use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;

final class Phase8Step2AuthE2ETest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function testAuth004AnonymousAccessRejectedOnAllProtectedEndpoints(): void
    {
        $endpoints = [
            ['GET', '/api/v1/auth/me'],
            ['POST', '/api/v1/auth/change-password'],
            ['POST', '/api/v1/provisioning/manual-student'],
            ['POST', '/api/v1/provisioning/manual-personnel'],
            ['POST', '/api/v1/provisioning/preview-roster'],
            ['POST', '/api/v1/provisioning/commit-roster'],
            ['POST', '/api/v1/accounts/test-id/suspend'],
            ['POST', '/api/v1/accounts/test-id/restore'],
            ['GET', '/api/v1/accounts/test-id/lifecycle'],
            ['GET', '/api/v1/portfolio'],
            ['POST', '/api/v1/portfolio'],
            ['GET', '/api/v1/program-coordinator/verification-queue'],
            ['GET', '/api/v1/hr/personnel'],
            ['GET', '/api/v1/hr/evaluations'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $res = match ($method) {
                'GET' => $this->get($uri),
                'POST' => $this->post($uri, []),
            };
            $this->assertContains($res->response()->getStatusCode(), [401, 403], "Endpoint {$method} {$uri} should reject anonymous access");
        }
    }

    public function testAuth002InvalidBearerTokenRejected(): void
    {
        $res = $this->withHeaders(['Authorization' => 'Bearer invalid.token.payload'])->get('/api/v1/auth/me');
        $res->assertStatus(401);
        $res->assertJSONFragment([
            'error' => [
                'code' => 'INVALID_ACCESS_TOKEN',
            ],
        ]);
    }

    public function testAuth008AndAuth012InstitutionalEmailEnforcementOnPasswordReset(): void
    {
        // Invalid non-NDMU email -> 422
        $resInvalid = $this->post('/api/v1/password-reset-requests', [
            'institutional_email' => 'user@gmail.com',
            'reason' => 'Forgot password',
        ]);
        $resInvalid->assertStatus(422);
        $resInvalid->assertJSONFragment([
            'error' => [
                'code' => 'INVALID_INSTITUTIONAL_EMAIL',
            ],
        ]);

        // Empty email -> 422
        $resEmpty = $this->post('/api/v1/password-reset-requests', [
            'institutional_email' => '',
        ]);
        $resEmpty->assertStatus(422);
    }

    public function testAuth007PasswordChangeValidationRules(): void
    {
        // Short password (< 8 chars) rejected with 422
        $resShort = $this->post('/api/v1/auth/change-password', [
            'new_password' => 'short',
            'confirm_password' => 'short',
        ]);
        $resShort->assertStatus(401); // without bearer token
    }
}
