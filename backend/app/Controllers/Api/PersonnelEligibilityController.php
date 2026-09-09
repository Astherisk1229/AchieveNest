<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\PersonnelEligibilityService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelEligibilityController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected PersonnelEligibilityService $eligibilityService;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?PersonnelEligibilityService $eligibilityService = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->eligibilityService = $eligibilityService ?? new PersonnelEligibilityService();
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
     * GET /api/v1/personnel/eligibility/current
     * Owner-facing current portfolio-validation and ranking-readiness explanation.
     */
    public function current(): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->failUnauthorized('UNAUTHORIZED');
        }

        $profileId = $actor['profile']['id'] ?? '';
        $evaluationCycleId = trim((string) ($this->request->getGet('evaluation_cycle_id') ?: '2025-2026'));

        try {
            $eligibility = $this->eligibilityService->evaluateEligibility($profileId, $evaluationCycleId);
            return $this->respond(['data' => $eligibility]);
        } catch (Throwable $e) {
            return $this->failServerError('Unexpected error evaluating personnel eligibility.');
        }
    }

    /**
     * GET /api/v1/hr/personnel/{id}/eligibility
     * HR read-only decision and reason-code view.
     */
    public function show(string $id = ''): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->failUnauthorized('UNAUTHORIZED');
        }

        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        if (! $isHr) {
            return $this->failForbidden('Only HR Admin may view personnel eligibility diagnostic.');
        }

        $evaluationCycleId = trim((string) ($this->request->getGet('evaluation_cycle_id') ?: '2025-2026'));

        try {
            $eligibility = $this->eligibilityService->evaluateEligibility($id, $evaluationCycleId);
            return $this->respond(['data' => $eligibility]);
        } catch (Throwable $e) {
            return $this->failServerError('Unexpected error evaluating personnel eligibility for HR.');
        }
    }
}
