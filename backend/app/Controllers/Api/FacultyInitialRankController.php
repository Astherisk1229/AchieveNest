<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AuthenticatedActorService;
use App\Services\FacultyInitialRankService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

/**
 * Class FacultyInitialRankController
 *
 * REST API Endpoints for Full-Time Faculty Initial Rank Seeding and Current-Rank Reconciliation.
 * Plan E — Phase E4.
 */
class FacultyInitialRankController extends BaseController
{
    protected AuthenticatedActorService $actorService;
    protected FacultyInitialRankService $initialRankService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?FacultyInitialRankService $initialRankService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->initialRankService = $initialRankService ?? new FacultyInitialRankService();
    }

    /**
     * POST /api/v1/faculty-ranks/resolve-initial
     * Deterministically resolves initial/base rank from verified qualification and licensure context.
     */
    public function resolveInitial(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized(['hr_staff'])) {
            return $deny;
        }
        try {
            $payload = $this->request->getJSON(true) ?? [];
            $result = $this->initialRankService->resolveInitialRank($payload);

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
     * POST /api/v1/faculty-ranks/reconcile-current
     * Reconciles current Personnel rank against catalog with Non-Demotion and Non-Promotion safety.
     */
    public function reconcileCurrent(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized(['hr_staff'])) {
            return $deny;
        }
        try {
            $payload = $this->request->getJSON(true) ?? [];
            $result = $this->initialRankService->reconcileCurrentRank($payload);

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
     * GET /api/v1/faculty-ranks/reconcile/(:segment)
     * GET /api/v1/hr/personnel/(:segment)/rank-resolution
     * Resolves rank status for a specific personnel member by ID.
     */
    public function reconcilePersonnel(string $id): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized(['hr_staff'])) {
            return $deny;
        }
        try {
            $db = \Config\Database::connect();
            // personnel_profiles is keyed by profile_id (a UUID string), not an integer id.
            $personnel = $db->table('personnel_profiles')
                ->where('profile_id', $id)
                ->get()
                ->getRowArray();

            if (!$personnel) {
                return $this->response->setStatusCode(404)->setJSON([
                    'code' => 'PERSONNEL_NOT_FOUND',
                    'message' => "Personnel profile with ID [{$id}] was not found.",
                ]);
            }

            $context = [
                'personnel_profile_id' => $personnel['profile_id'],
                'current_rank' => $personnel['current_rank_title'] ?? null,
                'qualification_code' => $personnel['highest_educational_attainment'] ?? $personnel['qualifications'] ?? null,
                'qualification_verified' => true, // HR profile records are considered verified
                'licensure_verified' => !empty($personnel['licensure_board_passer']),
                'faculty_engagement' => $personnel['faculty_engagement'] ?? 'full_time_faculty',
                'personnel_group' => $personnel['personnel_group'] ?? 'faculty',
                'employment_status' => $personnel['employment_status'] ?? 'permanent',
            ];

            $result = $this->initialRankService->reconcileCurrentRank($context);

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
     * OPTIONS handler for CORS preflight requests.
     */
    public function options(): ResponseInterface
    {
        return $this->response
            ->setStatusCode(200)
            ->setHeader('Access-Control-Allow-Origin', '*')
            ->setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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
