<?php

namespace Tests\Feature;

use App\Controllers\Api\AwardCriteriaHierarchyController;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use CodeIgniter\Test\CIUnitTestCase;

final class AwardCriteriaHierarchyAuthorizationTest extends CIUnitTestCase
{
    public static function editorMethods(): array
    {
        return [
            ['index', ['award-id']], ['createDraft', ['award-id']], ['saveDraft', ['award-id', 'version-id']],
            ['validateDraft', ['award-id', 'version-id']], ['publishDraft', ['award-id', 'version-id']],
        ];
    }

    /** @dataProvider editorMethods */
    public function test_all_editor_endpoints_require_authentication(string $method, array $args): void
    {
        $response = $this->invoke(null, $method, $args);
        $this->assertSame(401, $response->getStatusCode());
    }

    /** @dataProvider editorMethods */
    public function test_all_editor_endpoints_reject_hr_and_other_non_osad_roles(string $method, array $args): void
    {
        foreach ([
            ['profile' => ['account_type' => 'hr_admin', 'status' => 'active'], 'roles' => ['hr_staff']],
            ['profile' => ['account_type' => 'student', 'status' => 'active'], 'roles' => ['student']],
            ['profile' => ['account_type' => 'osad_admin', 'status' => 'inactive'], 'roles' => ['osad_staff']],
        ] as $actor) {
            $this->assertSame(403, $this->invoke($actor, $method, $args)->getStatusCode());
        }
    }

    private function invoke(?array $actor, string $method, array $args)
    {
        $actorService = $this->createMock(AuthenticatedActorService::class);
        $actorService->method('resolveActor')->willReturn($actor);
        $controller = new AwardCriteriaHierarchyController(new AuthorizationService($actorService));
        $controller->initController(service('request'), service('response'), service('logger'));
        return $controller->{$method}(...$args);
    }
}
