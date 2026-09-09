<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\DeanAnnualReviewService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

class DeanAnnualReviewController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected DeanAnnualReviewService $deanReviewService;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?DeanAnnualReviewService $deanReviewService = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->deanReviewService = $deanReviewService ?? new DeanAnnualReviewService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * GET /api/v1/dean/annual-reviews
     * Cycle-based Dean queue with filters and decision state.
     */
    public function index(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->failUnauthorized('UNAUTHORIZED');
        }

        $isDean = $this->authz->hasRole($actor, 'dean');
        if (! $isDean) {
            return $this->failForbidden('Only assigned College Deans may access the Annual Review queue.');
        }

        $deanProfileId = $actor['profile']['id'] ?? '';
        $filters = $this->request->getGet();

        try {
            $data = $this->deanReviewService->listForDean($deanProfileId, $filters);
            return $this->respond(['data' => $data]);
        } catch (RuntimeException $e) {
            if (str_starts_with($e->getMessage(), 'FORBIDDEN')) {
                return $this->failForbidden($e->getMessage());
            }
            return $this->failServerError($e->getMessage());
        } catch (Throwable $e) {
            return $this->failServerError('Unexpected error retrieving dean annual reviews.');
        }
    }

    /**
     * GET /api/v1/dean/annual-reviews/{personnelProfileId}
     * Current decision plus previous superseded records for a person/cycle.
     */
    public function show(string $personnelProfileId = ''): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->failUnauthorized('UNAUTHORIZED');
        }

        $isDean = $this->authz->hasRole($actor, 'dean');
        if (! $isDean) {
            return $this->failForbidden('Only assigned College Deans may access annual review details.');
        }

        $deanProfileId = $actor['profile']['id'] ?? '';
        $evaluationCycleId = trim((string) ($this->request->getGet('evaluation_cycle_id') ?: '2025-2026'));

        try {
            $this->deanReviewService->validateDeanAuthorization($deanProfileId, $personnelProfileId);

            $db = db_connect();
            $effective = $db->query(
                "SELECT * FROM personnel_annual_reviews
                 WHERE personnel_profile_id = ?
                   AND evaluation_cycle_id = ?
                   AND superseded_at IS NULL
                 LIMIT 1",
                [$personnelProfileId, $evaluationCycleId]
            )->getRowArray();

            $superseded = $db->query(
                "SELECT * FROM personnel_annual_reviews
                 WHERE personnel_profile_id = ?
                   AND evaluation_cycle_id = ?
                   AND superseded_at IS NOT NULL
                 ORDER BY superseded_at DESC",
                [$personnelProfileId, $evaluationCycleId]
            )->getResultArray();

            return $this->respond([
                'data' => [
                    'personnel_profile_id' => $personnelProfileId,
                    'evaluation_cycle_id'  => $evaluationCycleId,
                    'effective_review'     => $effective,
                    'superseded_reviews'   => $superseded,
                ]
            ]);
        } catch (RuntimeException $e) {
            if (str_starts_with($e->getMessage(), 'FORBIDDEN')) {
                return $this->failForbidden($e->getMessage());
            }
            if (str_starts_with($e->getMessage(), 'NOT_FOUND')) {
                return $this->failNotFound($e->getMessage());
            }
            if (str_starts_with($e->getMessage(), 'ANNUAL_REVIEW_NOT_APPLICABLE')) {
                return $this->fail(
                    ['error' => ['code' => 'ANNUAL_REVIEW_NOT_APPLICABLE', 'message' => $e->getMessage()]],
                    422
                );
            }
            return $this->failServerError($e->getMessage());
        } catch (Throwable $e) {
            return $this->failServerError('Unexpected error loading annual review detail.');
        }
    }

    /**
     * POST /api/v1/dean/annual-reviews
     * Record the first effective annual-review decision.
     */
    public function create(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->failUnauthorized('UNAUTHORIZED');
        }

        $isDean = $this->authz->hasRole($actor, 'dean');
        if (! $isDean) {
            return $this->failForbidden('Only assigned College Deans may record annual review decisions.');
        }

        $deanProfileId = $actor['profile']['id'] ?? '';
        $body = (array) ($this->request->getJSON(true) ?? $this->request->getPost());

        try {
            $created = $this->deanReviewService->recordReview($deanProfileId, $body);
            return $this->respondCreated([
                'data'    => $created,
                'message' => 'Annual review decision recorded successfully.'
            ]);
        } catch (InvalidArgumentException $e) {
            $code = str_starts_with($e->getMessage(), 'DECISION_REASON_REQUIRED') ? 'DECISION_REASON_REQUIRED' : 'VALIDATION_ERROR';
            return $this->fail(['error' => ['code' => $code, 'message' => $e->getMessage()]], 422);
        } catch (RuntimeException $e) {
            if (str_starts_with($e->getMessage(), 'FORBIDDEN')) {
                return $this->failForbidden($e->getMessage());
            }
            if (str_starts_with($e->getMessage(), 'ANNUAL_REVIEW_ALREADY_RECORDED')) {
                return $this->fail(['error' => ['code' => 'ANNUAL_REVIEW_ALREADY_RECORDED', 'message' => $e->getMessage()]], 409);
            }
            if (str_starts_with($e->getMessage(), 'ANNUAL_REVIEW_NOT_APPLICABLE')) {
                return $this->fail(['error' => ['code' => 'ANNUAL_REVIEW_NOT_APPLICABLE', 'message' => $e->getMessage()]], 422);
            }
            return $this->failServerError($e->getMessage());
        } catch (Throwable $e) {
            return $this->failServerError('Unexpected error creating annual review record.');
        }
    }

    /**
     * POST /api/v1/dean/annual-reviews/{id}/supersede
     * Correct an effective decision by creating a successor.
     */
    public function supersede(string $id = ''): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->failUnauthorized('UNAUTHORIZED');
        }

        $isDean = $this->authz->hasRole($actor, 'dean');
        if (! $isDean) {
            return $this->failForbidden('Only assigned College Deans may supersede annual review decisions.');
        }

        $deanProfileId = $actor['profile']['id'] ?? '';
        $body = (array) ($this->request->getJSON(true) ?? $this->request->getPost());

        try {
            $superseded = $this->deanReviewService->supersedeReview($id, $deanProfileId, $body);
            return $this->respond([
                'data'    => $superseded,
                'message' => 'Annual review decision superseded successfully.'
            ]);
        } catch (InvalidArgumentException $e) {
            $code = str_starts_with($e->getMessage(), 'DECISION_REASON_REQUIRED') ? 'DECISION_REASON_REQUIRED' : 'VALIDATION_ERROR';
            return $this->fail(['error' => ['code' => $code, 'message' => $e->getMessage()]], 422);
        } catch (RuntimeException $e) {
            if (str_starts_with($e->getMessage(), 'FORBIDDEN')) {
                return $this->failForbidden($e->getMessage());
            }
            if (str_starts_with($e->getMessage(), 'NOT_FOUND')) {
                return $this->failNotFound($e->getMessage());
            }
            if (str_starts_with($e->getMessage(), 'INVALID_REVIEW_TRANSITION')) {
                return $this->fail(['error' => ['code' => 'INVALID_REVIEW_TRANSITION', 'message' => $e->getMessage()]], 409);
            }
            return $this->failServerError($e->getMessage());
        } catch (Throwable $e) {
            return $this->failServerError('Unexpected error superseding annual review record.');
        }
    }
}
