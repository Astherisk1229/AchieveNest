<?php

namespace Tests\Feature;

use App\Controllers\Api\AwardEvaluationController;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\AwardPotentialCandidateService;
use App\Services\Policies\AwardPolicy;
use CodeIgniter\HTTP\ResponseInterface;
use CodeIgniter\Test\CIUnitTestCase;

final class AwardEvaluationAuthorizationHardeningPhase7ATest extends CIUnitTestCase
{
    /**
     * @return array<string, array{0: string, 1: list<string>}>
     */
    public static function sensitiveEndpointProvider(): array
    {
        return [
            'candidate list' => ['listAllCandidates', []],
            'legacy score' => ['campusJournalismScore', ['student-id']],
            'legacy candidate generation' => ['campusJournalismCandidates', []],
            'eligibility' => ['studentAwardEligibility', ['award-id', 'student-id']],
            'evaluation queue' => ['studentsForEvaluation', ['award-id']],
            'evidence' => ['studentAwardEvidence', ['award-id', 'student-id']],
            'score generation' => ['scoreStudentAward', ['award-id', 'student-id']],
            'scoring basis' => ['studentScoringBasis', ['award-id', 'student-id']],
            'persisted scoring basis' => ['scoringBasis', ['award-id', 'student-id']],
            'review workspace' => ['studentAwardReview', ['award-id', 'student-id']],
            'manual review mutation' => ['saveManualCriteria', ['award-id', 'student-id']],
            'evaluation finalization' => ['finalizeStudentAwardEvaluation', ['award-id', 'student-id']],
            'score recalculation' => ['recalculatePortfolioScore', ['award-id', 'student-id']],
            'candidate classification' => ['classifyPotentialCandidate', ['award-id', 'student-id']],
            'candidate status' => ['studentCandidateStatus', ['award-id', 'student-id']],
            'potential candidates' => ['listPotentialCandidates', ['award-id']],
            'evaluated results' => ['listEvaluatedResults', ['award-id']],
        ];
    }

    /**
     * @dataProvider sensitiveEndpointProvider
     */
    public function testSensitiveEndpointRejectsUnauthenticatedDirectAccess(string $method, array $arguments): void
    {
        $response = $this->invokeEndpoint(null, $method, $arguments);

        $this->assertSame(401, $response->getStatusCode());
    }

    /**
     * @dataProvider sensitiveEndpointProvider
     */
    public function testSensitiveEndpointRejectsNonOsadRoles(string $method, array $arguments): void
    {
        foreach ($this->unauthorizedActors() as $label => $actor) {
            $response = $this->invokeEndpoint($actor, $method, $arguments);
            $this->assertSame(403, $response->getStatusCode(), $label . ' reached ' . $method);
        }
    }

    public function testPolicyAllowsOnlyActiveDualAuthorizedOsadAdministrator(): void
    {
        $policy = new AwardPolicy();

        $this->assertTrue($policy->canViewAwardEvaluation($this->osadActor()));
        foreach ($this->unauthorizedActors() as $actor) {
            $this->assertFalse($policy->canViewAwardEvaluation($actor));
        }
        $this->assertFalse($policy->canViewAwardEvaluation([
            'profile' => ['id' => 'inactive-osad', 'account_type' => 'osad_admin', 'status' => 'inactive'],
            'roles' => ['osad_staff'],
        ]));
    }

    public function testAuthorizedOsadUserCanDirectlyAccessPotentialCandidateEndpoint(): void
    {
        $actorService = $this->createMock(AuthenticatedActorService::class);
        $actorService->method('resolveActor')->willReturn($this->osadActor());
        $candidateService = $this->createMock(AwardPotentialCandidateService::class);
        $candidateService->expects($this->once())
            ->method('getPotentialCandidatesForAward')
            ->with('award-id')
            ->willReturn(['award_id' => 'award-id', 'candidates' => []]);

        $controller = new AwardEvaluationController(
            new AuthorizationService($actorService),
            null,
            null,
            null,
            null,
            null,
            $candidateService
        );
        $controller->initController(service('request'), service('response'), service('logger'));

        $response = $controller->listPotentialCandidates('award-id');

        $this->assertSame(200, $response->getStatusCode());
    }

    public function testCatalogAndAwardDetailRemainAuthenticatedReadableByDesign(): void
    {
        $source = file_get_contents(APPPATH . 'Controllers/Api/AwardEvaluationController.php');

        $this->assertIsString($source);
        $this->assertStringContainsString('public function listAwards()', $source);
        $this->assertStringContainsString('public function showAward(string $awardId)', $source);
    }

    private function invokeEndpoint(?array $actor, string $method, array $arguments): ResponseInterface
    {
        $actorService = $this->createMock(AuthenticatedActorService::class);
        $actorService->method('resolveActor')->willReturn($actor);
        $authorization = new AuthorizationService($actorService);
        $controller = new AwardEvaluationController($authorization);
        $controller->initController(
            service('request'),
            service('response'),
            service('logger')
        );

        return $controller->{$method}(...$arguments);
    }

    /** @return array<string, array<string, mixed>> */
    private function unauthorizedActors(): array
    {
        return [
            'student' => [
                'profile' => ['id' => 'student-id', 'account_type' => 'student', 'status' => 'active'],
                'roles' => ['student'],
            ],
            'ordinary personnel' => [
                'profile' => ['id' => 'personnel-id', 'account_type' => 'personnel', 'status' => 'active'],
                'roles' => ['personnel'],
            ],
            'unrelated administrator' => [
                'profile' => ['id' => 'hr-id', 'account_type' => 'hr_admin', 'status' => 'active'],
                'roles' => ['hr_staff'],
            ],
            'role-only impostor' => [
                'profile' => ['id' => 'personnel-osad-role', 'account_type' => 'personnel', 'status' => 'active'],
                'roles' => ['osad_staff'],
            ],
        ];
    }

    /** @return array<string, mixed> */
    private function osadActor(): array
    {
        return [
            'profile' => ['id' => 'osad-id', 'account_type' => 'osad_admin', 'status' => 'active'],
            'roles' => ['osad_staff'],
        ];
    }
}
