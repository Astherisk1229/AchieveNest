<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AuthenticatedActorService;
use App\Services\FacultyRankCatalogService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class FacultyRankCatalogController extends BaseController
{
    protected AuthenticatedActorService $actorService;
    protected FacultyRankCatalogService $rankService;
    protected \App\Services\FacultyRankProgressionService $progressionService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?FacultyRankCatalogService $rankService = null,
        ?\App\Services\FacultyRankProgressionService $progressionService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->rankService = $rankService ?? new FacultyRankCatalogService();
        $this->progressionService = $progressionService ?? new \App\Services\FacultyRankProgressionService($this->rankService);
    }

    /**
     * GET /api/v1/faculty-ranks
     * GET /api/v1/hr/faculty-ranks
     * Returns the active Full-Time Academic Ranks list.
     */
    public function listRanks(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $tier = $this->request->getGet('tier');
            $ranks = $this->rankService->getFullTimeFacultyRanks($tier);
            $metadata = $this->rankService->getCatalogMetadata();

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'metadata' => $metadata,
                'data' => $ranks,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/v1/faculty-ranks/{code}
     * Returns details of a specific rank by stable rank_code.
     */
    public function getRank(string $code): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $rank = $this->rankService->getRankByCode($code);

            if (!$rank) {
                return $this->response->setStatusCode(404)->setJSON([
                    'code' => 'RANK_NOT_FOUND',
                    'message' => "Academic rank with code [{$code}] was not found in the active catalogue.",
                ]);
            }

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $rank,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/v1/faculty-ranks/hierarchy
     * Returns full tier hierarchy.
     */
    public function getHierarchy(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $hierarchy = $this->rankService->getRankHierarchy();

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $hierarchy,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/v1/faculty-ranks/{code}/next
     * Returns the normal sequential next rank.
     */
    public function getNextRank(string $code): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $next = $this->progressionService->getNextNormalRank($code);
            $isTerminal = $this->progressionService->isTerminalRank($code);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'current_rank_code' => $code,
                'is_terminal' => $isTerminal,
                'next_rank' => $next,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/v1/faculty-ranks/{code}/transitions
     * Returns structured allowed transitions DTO.
     */
    public function getTransitions(string $code): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $hasVerifiedPhd = filter_var($this->request->getGet('has_verified_phd'), FILTER_VALIDATE_BOOLEAN);
            $engagement = $this->request->getGet('faculty_engagement') ?? 'full_time_faculty';
            $group = $this->request->getGet('personnel_group') ?? 'faculty';

            $context = [
                'has_verified_phd' => $hasVerifiedPhd,
                'faculty_engagement' => $engagement,
                'personnel_group' => $group,
                'personnel_profile_id' => (string) ($this->request->getGet('personnel_profile_id') ?? ''),
            ];

            $transitions = $this->progressionService->getAllowedTransitions($code, $context);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $transitions,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/v1/faculty-ranks/validate-transition
     * Validates a proposed progression transition.
     */
    public function validateTransition(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $payload = $this->request->getJSON(true) ?? [];
            $from = $payload['from_rank_code'] ?? '';
            $to = $payload['to_rank_code'] ?? '';
            $context = $payload['context'] ?? [];

            $result = $this->progressionService->validateTransition($from, $to, $context);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Mutation endpoints are blocked to protect source freeze integrity.
     */
    public function mutate(): ResponseInterface
    {
        return $this->response->setStatusCode(403)->setJSON([
            'code' => 'CATALOG_MUTATION_RESTRICTED',
            'message' => 'Direct rank catalogue mutation is prohibited. Catalogue changes require an approved source revision and seed migration.',
        ]);
    }

    /**
     * Phase 2 access guard. Returns an error response when the caller has no valid session,
     * or (when $roles is given) holds none of the listed roles; null when the call may proceed.
     */
    private function denyUnlessAuthorized(?array $roles = null, ?string $allowSelfId = null): ?ResponseInterface
    {
        $actor = $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) {
            return $this->response->setStatusCode(401)->setJSON([
                'error' => ['code' => 'AUTH_TOKEN_INVALID', 'message' => 'Unable to verify the current session. Please sign in again.'],
            ]);
        }
        if ($roles === null) {
            return null;
        }
        if ($allowSelfId !== null && (string) ($actor['profile']['id'] ?? '') === $allowSelfId) {
            return null;
        }
        if (count(array_intersect($roles, (array) ($actor['roles'] ?? []))) === 0) {
            return $this->response->setStatusCode(403)->setJSON([
                'error' => ['code' => 'FORBIDDEN', 'message' => 'You do not have permission to perform this action.'],
            ]);
        }
        return null;
    }
}
