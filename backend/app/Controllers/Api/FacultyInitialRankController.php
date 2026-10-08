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
            $profileId = trim((string) ($payload['personnel_profile_id'] ?? ''));
            if ($profileId === '') {
                $result = $this->initialRankService->resolveInitialRank([
                    'personnel_group' => $payload['personnel_group'] ?? null,
                    'faculty_engagement' => $payload['faculty_engagement'] ?? null,
                    'qualification_verified' => false,
                ]);
                return $this->response->setStatusCode(200)->setJSON(['success' => true, 'data' => $result]);
            }
            $db = \Config\Database::connect();
            $personnel = $db->table('personnel_profiles')->where('profile_id', $profileId)->get()->getRowArray();
            if (!$personnel) return $this->response->setStatusCode(404)->setJSON(['code' => 'PERSONNEL_NOT_FOUND', 'message' => 'Personnel profile was not found.']);
            $payload = $this->verifiedCredentialContext($db, $personnel) + ['faculty_engagement' => $personnel['faculty_engagement'] ?? 'full_time_faculty'];
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

            $context = $this->verifiedCredentialContext($db, $personnel) + [
                'personnel_profile_id' => $personnel['profile_id'],
                'current_rank' => $personnel['current_rank_title'] ?? null,
                'faculty_engagement' => $personnel['faculty_engagement'] ?? 'full_time_faculty',
                'personnel_group' => $personnel['personnel_group'] ?? null,
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

    /** Only verified active credentials can determine the initial rank qualification tier. */
    private function verifiedCredentialContext($db, array $personnel): array
    {
        $group = strtolower(trim((string) ($personnel['personnel_group'] ?? '')));
        $base = ['personnel_group' => $group ?: null, 'qualification_verified' => false, 'licensure_verified' => false];
        if ($group !== 'faculty') return $base;
        $credentials = $db->table('personnel_credentials')
            ->where(['personnel_profile_id' => $personnel['profile_id'], 'verification_status' => 'verified', 'record_state' => 'active'])
            ->get()->getResultArray();
        $degrees = array_values(array_filter($credentials, static fn($c) => ($c['credential_type'] ?? '') === 'degree'));
        $levels = array_column($degrees, 'degree_level');
        $hasDoctorate = in_array('doctorate', $levels, true);
        $hasMasters = in_array('masters', $levels, true);
        $hasBachelor = in_array('baccalaureate', $levels, true);
        $boardStatuses = array_values(array_unique(array_column(array_filter($credentials, static fn($c) => ($c['credential_type'] ?? '') === 'board_licensure'), 'board_licensure_status')));
        if (count($boardStatuses) > 1) return array_merge($base, ['qualification_code' => null, 'credential_resolution' => 'conflicting_board_records']);
        if ($hasDoctorate) return array_merge($base, ['qualification_code' => 'doctorate', 'qualification_verified' => true]);
        if ($hasMasters) return array_merge($base, ['qualification_code' => 'masters', 'qualification_verified' => true]);
        if (count($boardStatuses) === 1 && ($boardStatuses[0] === 'board_passer' || $hasBachelor)) {
            return array_merge($base, [
                'qualification_code' => $boardStatuses[0] === 'board_passer' ? 'CPA' : 'bachelor',
                'qualification_verified' => true,
                'licensure_verified' => $boardStatuses[0] === 'board_passer',
            ]);
        }
        return array_merge($base, ['qualification_code' => null, 'credential_resolution' => 'hr_verification_required']);
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
