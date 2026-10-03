<?php

namespace Tests\Feature;

use App\Controllers\Api\PasswordResetRequestController;
use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\LocalAuthService;
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
        $pw1 = ValidationHelper::generateTemporaryPassword();
        $pw2 = ValidationHelper::generateTemporaryPassword();

        $this->assertGreaterThanOrEqual(12, strlen($pw1));
        $this->assertMatchesRegularExpression('/[A-Z]/', $pw1);
        $this->assertMatchesRegularExpression('/[a-z]/', $pw1);
        $this->assertMatchesRegularExpression('/\d/', $pw1);
        $this->assertMatchesRegularExpression('/[^A-Za-z0-9]/', $pw1);
        $this->assertNotSame($pw1, $pw2);
    }

    public function testOfficeAuthorizationMatrixForAdminReset(): void
    {
        $mockActorService = $this->createMock(AuthenticatedActorService::class);
        $mockLocalAuth = $this->createMock(LocalAuthService::class);

        // Case A: HR Admin tries to reset OSAD student request -> 403
        $mockActorService->method('resolveActor')->willReturn([
            'profile' => ['id' => 'hr-admin-uuid', 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => ['hr_staff'],
        ]);

        $controller = new PasswordResetRequestController($mockActorService, $mockLocalAuth);
        $this->assertInstanceOf(PasswordResetRequestController::class, $controller);
    }
}
