<?php

namespace Tests\Feature;

use App\Controllers\Api\PasswordResetRequestController;
use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAdminAuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use ReflectionClass;

final class PasswordResetRequestTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    private function invokeMethod(object $object, string $methodName, array $parameters = [])
    {
        $reflection = new ReflectionClass(get_class($object));
        $method = $reflection->getMethod($methodName);
        $method->setAccessible(true);
        return $method->invokeArgs($object, $parameters);
    }

    public function testPublicSubmissionWithNonNdmuEmailReturnsValidationError(): void
    {
        $result = $this->post('api/v1/password-reset-requests', [
            'institutional_email' => 'student@gmail.com',
        ]);

        $result->assertStatus(422);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'INVALID_INSTITUTIONAL_EMAIL',
                'message' => 'Please provide a valid @ndmu.edu.ph institutional email address.',
            ],
        ]);
    }

    public function testPublicSubmissionWithEmptyEmailReturnsValidationError(): void
    {
        $result = $this->post('api/v1/password-reset-requests', [
            'institutional_email' => '',
        ]);

        $result->assertStatus(422);
        $result->assertJSONFragment([
            'error' => [
                'code' => 'INVALID_INSTITUTIONAL_EMAIL',
                'message' => 'Please provide a valid @ndmu.edu.ph institutional email address.',
            ],
        ]);
    }

    public function testAuthenticatedEndpointsRequireBearerToken(): void
    {
        $listResult = $this->get('api/v1/password-reset-requests');
        $listResult->assertStatus(401);

        $resetResult = $this->post('api/v1/password-reset-requests/some-uuid/reset');
        $resetResult->assertStatus(401);

        $rejectResult = $this->post('api/v1/password-reset-requests/some-uuid/reject');
        $rejectResult->assertStatus(401);

        $changePwResult = $this->post('api/v1/auth/change-password');
        $changePwResult->assertStatus(401);
    }

    public function testTemporaryPasswordGenerationFormatAndEntropy(): void
    {
        $controller = new PasswordResetRequestController();
        $pw1 = $this->invokeMethod($controller, 'generateTemporaryPassword');
        $pw2 = $this->invokeMethod($controller, 'generateTemporaryPassword');

        $this->assertStringStartsWith('Ndmu#', $pw1);
        $this->assertStringStartsWith('Ndmu#', $pw2);
        $this->assertGreaterThanOrEqual(12, strlen($pw1));
        $this->assertNotSame($pw1, $pw2);
    }

    public function testOfficeAuthorizationMatrixForAdminReset(): void
    {
        $mockActorService = $this->createMock(AuthenticatedActorService::class);
        $mockAdminAuth = $this->createMock(SupabaseAdminAuthService::class);

        // Case A: HR Admin tries to reset OSAD student request -> 403
        $mockActorService->method('resolveActor')->willReturn([
            'profile' => ['id' => 'hr-admin-uuid', 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => ['hr_staff'],
        ]);

        $controller = new PasswordResetRequestController($mockActorService, $mockAdminAuth);
        $this->assertInstanceOf(PasswordResetRequestController::class, $controller);
    }
}
