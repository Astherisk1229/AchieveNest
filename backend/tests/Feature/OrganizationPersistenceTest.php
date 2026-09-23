<?php

namespace Tests\Feature;

use App\Controllers\Api\OrganizationController;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\OrganizationService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use InvalidArgumentException;

final class OrganizationPersistenceTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected OrganizationService $orgService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->orgService = new OrganizationService();
    }

    public function testUnauthenticatedRequestsReturn401(): void
    {
        $listResult = $this->get('api/v1/osad/organizations');
        $listResult->assertStatus(401);

        $createResult = $this->post('api/v1/osad/organizations', [
            'name' => 'Test Org',
            'code' => 'TEST_ORG',
            'category' => 'academic_college',
            'scope' => 'university',
        ]);
        $createResult->assertStatus(401);
    }

    public function testNonOSADActorIsForbiddenFromManagingOrganizations(): void
    {
        $mockActorService = $this->createMock(AuthenticatedActorService::class);
        $mockAuthService = new AuthorizationService($mockActorService);

        // Student actor
        $mockActorService->method('resolveActor')->willReturn([
            'profile' => ['id' => 'student-uuid', 'account_type' => 'student', 'status' => 'active'],
            'roles'   => ['student'],
        ]);

        $controller = new OrganizationController($mockActorService, $mockAuthService, $this->orgService);
        $this->assertInstanceOf(OrganizationController::class, $controller);

        $reflection = new \ReflectionClass($controller);
        $checkMethod = $reflection->getMethod('checkOSADAuthorization');
        $checkMethod->setAccessible(true);

        $actor = $mockActorService->resolveActor();
        $this->assertFalse($checkMethod->invoke($controller, $actor));

        // HR Admin actor (without OSAD role) -> forbidden
        $hrActor = [
            'profile' => ['id' => 'hr-uuid', 'account_type' => 'hr_admin', 'status' => 'active'],
            'roles'   => ['hr_staff'],
        ];
        $this->assertFalse($checkMethod->invoke($controller, $hrActor));

        // OSAD Admin actor -> allowed
        $osadActor = [
            'profile' => ['id' => 'osad-uuid', 'account_type' => 'osad_admin', 'status' => 'active'],
            'roles'   => ['osad_staff'],
        ];
        $this->assertTrue($checkMethod->invoke($controller, $osadActor));
    }

    public function testServiceValidationRejectsEmptyName(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Organization name is required.');

        $this->orgService->createOrganization([
            'name' => '',
            'code' => 'VAL_EMPTY_NAME',
            'category' => 'academic_college',
            'scope' => 'university',
        ]);
    }

    public function testServiceValidationRejectsEmptyCode(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Organization code / acronym is required.');

        $this->orgService->createOrganization([
            'name' => 'Valid Name',
            'code' => '',
            'category' => 'academic_college',
            'scope' => 'university',
        ]);
    }

    public function testServiceValidationRejectsInvalidCategory(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid organization category 'invalid_category'.");

        $this->orgService->createOrganization([
            'name' => 'Valid Name',
            'code' => 'VAL_CAT',
            'category' => 'invalid_category',
            'scope' => 'university',
        ]);
    }

    public function testServiceValidationRejectsInvalidScope(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage("Invalid organization scope 'invalid_scope'.");

        $this->orgService->createOrganization([
            'name' => 'Valid Name',
            'code' => 'VAL_SCOPE',
            'category' => 'academic_college',
            'scope' => 'invalid_scope',
        ]);
    }

    public function testServiceValidationRejectsCollegeScopeWithoutCollegeId(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('College selection is required for college-scoped organizations.');

        $this->orgService->createOrganization([
            'name' => 'College Society',
            'code' => 'COLL_NO_ID',
            'category' => 'academic_college',
            'scope' => 'college',
            'college_id' => '',
        ]);
    }

    public function testServiceValidationRejectsProgramScopeWithoutPrograms(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('At least one academic program affiliation is required for program-scoped organizations.');

        $this->orgService->createOrganization([
            'name' => 'Program Society',
            'code' => 'PROG_NO_IDS',
            'category' => 'academic_college',
            'scope' => 'program',
            'college_id' => '20000000-0000-0000-0000-000000000001',
            'program_ids' => [],
        ]);
    }

    public function testLogoValidationConstantsAndAllowlist(): void
    {
        $this->assertArrayHasKey('image/png', OrganizationService::ALLOWED_MIME_TYPES);
        $this->assertArrayHasKey('image/jpeg', OrganizationService::ALLOWED_MIME_TYPES);
        $this->assertArrayHasKey('image/webp', OrganizationService::ALLOWED_MIME_TYPES);
        $this->assertArrayNotHasKey('image/svg+xml', OrganizationService::ALLOWED_MIME_TYPES);
        $this->assertArrayNotHasKey('application/x-php', OrganizationService::ALLOWED_MIME_TYPES);

        $this->assertSame(5242880, OrganizationService::MAX_LOGO_SIZE_BYTES);
    }
}
