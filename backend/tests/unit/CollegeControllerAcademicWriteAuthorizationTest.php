<?php

namespace Tests\Unit;

use App\Controllers\Api\CollegeController;
use App\Services\AuthenticatedActorService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\Response;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use PHPUnit\Framework\TestCase;

class CollegeControllerAcademicWriteAuthorizationTest extends TestCase
{
    private function controllerForOsad(): CollegeController
    {
        $actors = $this->createMock(AuthenticatedActorService::class);
        $actors->method('resolveActor')->willReturn([
            'profile' => ['id' => 'osad-1', 'account_type' => 'osad_admin'],
            'roles' => ['osad_staff'],
        ]);

        $controller = new CollegeController(actorService: $actors);
        $controller->initController(
            new IncomingRequest(config('App'), new URI('http://example.com/api/v1/osad/colleges'), null, new UserAgent()),
            new Response(config('App')),
            service('logger')
        );

        return $controller;
    }

    public function testOsadCannotMutateCollegesOrCoordinatorAssignmentsThroughApiMethods(): void
    {
        $cases = [
            fn (CollegeController $controller) => $controller->create(),
            fn (CollegeController $controller) => $controller->update('college-1'),
            fn (CollegeController $controller) => $controller->updateStatus('college-1'),
            fn (CollegeController $controller) => $controller->delete('college-1'),
            fn (CollegeController $controller) => $controller->updatePersonnelCoordinatorAssignments('college-1', 'personnel-1'),
            fn (CollegeController $controller) => $controller->reassignCoordinator('college-1'),
        ];

        foreach ($cases as $invoke) {
            $response = $invoke($this->controllerForOsad());
            self::assertInstanceOf(Response::class, $response);
            self::assertSame(403, $response->getStatusCode());
            self::assertStringContainsString('Only HR administrators', $response->getBody());
        }
    }

}
