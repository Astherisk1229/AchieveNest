<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AuthenticatedActorService;
use App\Services\PortfolioConfigurationService;
use App\Services\PortfolioCriterionValidationService;
use App\Services\RubricAdministrationService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class EvaluationScaleController extends BaseController
{
    private function withoutPersonnelScoring(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        $sanitized = [];
        foreach ($value as $key => $item) {
            if (is_string($key) && preg_match('/(?:points?|score|scoring|cap|ceiling)/i', $key)) {
                continue;
            }
            $sanitized[$key] = $this->withoutPersonnelScoring($item);
        }
        return $sanitized;
    }
    protected AuthenticatedActorService $actorService;
    protected PortfolioConfigurationService $configService;
    protected PortfolioCriterionValidationService $validationService;
    protected RubricAdministrationService $adminService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?PortfolioConfigurationService $configService = null,
        ?PortfolioCriterionValidationService $validationService = null,
        ?RubricAdministrationService $adminService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->configService = $configService ?? new PortfolioConfigurationService();
        $this->validationService = $validationService ?? new PortfolioCriterionValidationService();
        $this->adminService = $adminService ?? new RubricAdministrationService();
    }

    /** Use the same explicit bearer-header contract as the working HR controllers. */
    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    protected function authenticationRequired(): ResponseInterface
    {
        return $this->response->setStatusCode(401)->setJSON([
            'error' => ['code' => 'AUTH_TOKEN_INVALID', 'message' => 'Unable to verify the current session. Please sign in again.'],
        ]);
    }

    /**
     * GET /api/v1/personnel/evaluation-scale
     * GET /api/v1/evaluation-instruments/assigned
     * Returns the server-authoritative scale assignment DTO for the caller's personnel profile.
     */
    public function getAssignedScale(): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $personnelProfileId = $actor['profile']['id'] ?? null;

            if (!$personnelProfileId) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Caller does not have an associated personnel profile.'
                ]);
            }

            $assignmentService = new \App\Services\EvaluationScaleAssignmentService();
            $cycleId = $this->request->getGet('evaluation_cycle_id') ?? '2025-2026';
            $assignment = $assignmentService->resolveScaleForPersonnel($personnelProfileId, $cycleId);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $this->withoutPersonnelScoring($assignment)
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => $code === 422 ? 'UNSUPPORTED_PERSONNEL_COMBINATION' : 'SERVER_ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * GET /api/v1/personnel/{id}/evaluation-scale
     * Returns server-authoritative scale assignment for a specific personnel member.
     */
    public function getPersonnelAssignedScale(string $id): ResponseInterface
    {
        try {
            $assignmentService = new \App\Services\EvaluationScaleAssignmentService();
            $cycleId = $this->request->getGet('evaluation_cycle_id') ?? '2025-2026';
            $assignment = $assignmentService->resolveScaleForPersonnel($id, $cycleId);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $assignment
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => $code === 422 ? 'UNSUPPORTED_PERSONNEL_COMBINATION' : 'SERVER_ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * GET /api/v1/personnel/portfolio/configuration
     * Returns resolved scale/version and dynamic workspace configuration for current personnel.
     */
    public function getPersonnelConfiguration(): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $personnelProfileId = $actor['profile']['id'] ?? null;

            if (!$personnelProfileId) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Caller does not have an associated personnel profile.'
                ]);
            }

            $cycleId = $this->request->getGet('evaluation_cycle_id') ?? '2025-2026';
            $config = $this->configService->getWorkspaceConfiguration($personnelProfileId, $cycleId);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $this->withoutPersonnelScoring($config)
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => $code === 422 ? 'INVALID_PERSONNEL_CLASSIFICATION' : ($code === 409 ? 'SCALE_CONFIGURATION_UNAVAILABLE' : 'SERVER_ERROR'),
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * GET /api/v1/personnel/portfolio/configuration/areas/{areaCode}
     * Returns schema and categories for a specific area.
     */
    public function getAreaConfiguration(string $areaCode): ResponseInterface
    {
        try {
            $scaleVersionId = $this->request->getGet('scale_version_id');
            if (!$scaleVersionId) {
                // Fallback: resolve from personnel context
                $actor = $this->resolveActor();
                if ($actor === null) return $this->authenticationRequired();
                $personnelProfileId = $actor['profile']['id'] ?? null;
                $config = $this->configService->getWorkspaceConfiguration($personnelProfileId, '2025-2026');
                $scaleVersionId = $config['version']['id'];
            }

            $areaConfig = $this->configService->getAreaConfiguration($scaleVersionId, $areaCode);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $this->withoutPersonnelScoring($areaConfig)
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => 'ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/v1/personnel/portfolio/validate-entry
     * Validates accomplishment entry and returns calculated points & trace.
     */
    public function validateEntry(): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $personnelProfileId = $actor['profile']['id'] ?? null;

            $json = $this->request->getJSON(true) ?? [];
            $cycleId = $json['evaluation_cycle_id'] ?? '2025-2026';

            $trace = $this->validationService->validateAndTracePoints($personnelProfileId, $json, $cycleId);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $this->withoutPersonnelScoring($trace)
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => $code === 409 ? 'PORTFOLIO_AREA_READ_ONLY' : 'VALIDATION_ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * GET /api/v1/admin/evaluation-scales
     * Lists all evaluation scales and versions for administrators.
     */
    public function listScales(): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $roles = $actor['roles'] ?? [];
            if (!in_array('hr_admin', $roles) && !in_array('hr_staff', $roles) && !in_array('super_admin', $roles)) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Only authorized HR administrators may view the full evaluation scale catalogue.'
                ]);
            }

            $scales = $this->adminService->listScalesWithVersions();

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $scales
            ]);
        } catch (Throwable $e) {
            log_message('error', 'Evaluation scale catalogue authentication/load failure on {path}: {exception}: {message}', [
                'path' => $this->request->getPath(),
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);
            return $this->response->setStatusCode(500)->setJSON([
                'error' => [
                    'code' => 'SCALE_CATALOGUE_LOAD_FAILED',
                    'message' => 'Unable to load approved evaluation scales.',
                ],
            ]);
        }
    }

    public function showScaleVersion(string $versionId): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $roles = $actor['roles'] ?? [];
            if (!array_intersect(['hr_admin','hr_staff','super_admin','dean'], $roles)) return $this->response->setStatusCode(403)->setJSON(['error'=>['code'=>'FORBIDDEN','message'=>'You are not authorized to view ranking criteria.']]);
            return $this->response->setJSON(['success'=>true, 'data'=>$this->adminService->getScaleVersionHierarchy($versionId)]);
        } catch (Throwable $e) {
            $status = in_array((int)$e->getCode(), [404], true) ? 404 : 500;
            return $this->response->setStatusCode($status)->setJSON(['error'=>['code'=>$status===404?'CRITERIA_NOT_FOUND':'CRITERIA_LOAD_FAILED','message'=>$e->getMessage()]]);
        }
    }

    public function activeRankingCriteria(): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $group = (string)$this->request->getGet('personnel_group');
            return $this->response->setJSON(['success'=>true,'data'=>$this->adminService->findActiveCriteriaForPersonnelGroup($group)]);
        } catch (Throwable $e) {
            $code = $e->getMessage();
            $status = ['CRITERIA_NOT_CONFIGURED'=>404,'MULTIPLE_ACTIVE_CRITERIA'=>409,'INVALID_PERSONNEL_GROUP'=>422][$code] ?? 500;
            $message = ['CRITERIA_NOT_CONFIGURED'=>'No active ranking criteria is configured for this personnel group.','MULTIPLE_ACTIVE_CRITERIA'=>'More than one active criteria version is configured for this personnel group.','INVALID_PERSONNEL_GROUP'=>'Select a valid personnel group.'][$code] ?? 'Unable to load ranking criteria.';
            return $this->response->setStatusCode($status)->setJSON(['error'=>['code'=>$status===500?'CRITERIA_LOOKUP_FAILED':$code,'message'=>$message]]);
        }
    }

    /** POST /api/v1/admin/evaluation-scales/versions/{sourceVersionId}/clone */
    public function cloneVersion(string $sourceVersionId): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            if (! array_intersect(['hr_admin', 'super_admin'], $actor['roles'] ?? [])) {
                return $this->response->setStatusCode(403)->setJSON(['error'=>['code'=>'FORBIDDEN', 'message'=>'Only HR Administrators may create criteria versions.']]);
            }
            $result = $this->adminService->cloneVersion($sourceVersionId, $this->request->getJSON(true) ?? [], $actor['profile']['id']);
            return $this->response->setStatusCode(201)->setJSON(['success'=>true, 'data'=>$result]);
        } catch (Throwable $e) {
            $status = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($status)->setJSON(['error'=>['code'=>'CRITERIA_VERSION_CREATE_FAILED', 'message'=>$e->getMessage()]]);
        }
    }

    public function updateVersion(string $versionId): ResponseInterface
    { return $this->criteriaAdminAction(fn($actor) => $this->adminService->saveDraft($versionId, $this->request->getJSON(true) ?? [], $actor['profile']['id']), 200); }

    public function validateScaleVersion(string $versionId): ResponseInterface
    { return $this->criteriaAdminAction(fn() => $this->adminService->validateVersion($versionId), 200); }

    public function compareScaleVersions(string $versionId, string $otherVersionId): ResponseInterface
    { return $this->criteriaAdminAction(fn() => $this->adminService->compareVersions($versionId, $otherVersionId), 200); }

    private function criteriaAdminAction(callable $action, int $successStatus): ResponseInterface
    {
        try {
            $actor = $this->resolveActor(); if ($actor === null) return $this->authenticationRequired();
            if (!array_intersect(['hr_admin','super_admin'], $actor['roles'] ?? [])) return $this->response->setStatusCode(403)->setJSON(['error'=>['code'=>'FORBIDDEN','message'=>'Only HR Administrators may manage criteria versions.']]);
            return $this->response->setStatusCode($successStatus)->setJSON(['success'=>true,'data'=>$action($actor)]);
        } catch (Throwable $e) {
            $status=$e->getCode()>=400&&$e->getCode()<600?$e->getCode():500;
            return $this->response->setStatusCode($status)->setJSON(['error'=>['code'=>'CRITERIA_VERSION_ACTION_FAILED','message'=>$e->getMessage()]]);
        }
    }

    /**
     * POST /api/v1/admin/evaluation-scales/{versionId}/approve
     */
    public function approveVersion(string $versionId): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $roles = $actor['roles'] ?? [];
            if (!in_array('hr_admin', $roles) && !in_array('super_admin', $roles)) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Only HR Administrators may approve scale versions.'
                ]);
            }

            $json = $this->request->getJSON(true) ?? [];
            $reason = trim($json['reason'] ?? 'Official rubric version approval');

            $result = $this->adminService->approveVersion($versionId, $actor['profile']['id'], $reason);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $result
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => 'ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/v1/admin/evaluation-scales/{versionId}/retire
     */
    public function retireVersion(string $versionId): ResponseInterface
    {
        try {
            $actor = $this->resolveActor();
            if ($actor === null) return $this->authenticationRequired();
            $roles = $actor['roles'] ?? [];
            if (!in_array('hr_admin', $roles) && !in_array('super_admin', $roles)) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Only HR Administrators may retire scale versions.'
                ]);
            }

            $json = $this->request->getJSON(true) ?? [];
            $reason = trim($json['reason'] ?? 'Official rubric version retirement');

            $result = $this->adminService->retireVersion($versionId, $actor['profile']['id'], $reason);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $result
            ]);
        } catch (Throwable $e) {
            $code = $e->getCode() >= 400 && $e->getCode() < 600 ? $e->getCode() : 500;
            return $this->response->setStatusCode($code)->setJSON([
                'code' => 'ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }
}
