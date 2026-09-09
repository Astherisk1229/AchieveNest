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

    /**
     * GET /api/v1/personnel/evaluation-scale
     * GET /api/v1/evaluation-instruments/assigned
     * Returns the server-authoritative scale assignment DTO for the caller's personnel profile.
     */
    public function getAssignedScale(): ResponseInterface
    {
        try {
            $actor = $this->actorService->getAuthenticatedActor();
            $personnelProfileId = $actor['personnel_profile_id'] ?? $actor['profile_id'] ?? $actor['id'] ?? null;

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
            $actor = $this->actorService->getAuthenticatedActor();
            $personnelProfileId = $actor['personnel_profile_id'] ?? $actor['profile_id'] ?? $actor['id'] ?? null;

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
                'data' => $config
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
                $actor = $this->actorService->getAuthenticatedActor();
                $personnelProfileId = $actor['personnel_profile_id'] ?? $actor['profile_id'] ?? $actor['id'] ?? null;
                $config = $this->configService->getWorkspaceConfiguration($personnelProfileId, '2025-2026');
                $scaleVersionId = $config['version']['id'];
            }

            $areaConfig = $this->configService->getAreaConfiguration($scaleVersionId, $areaCode);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $areaConfig
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
            $actor = $this->actorService->getAuthenticatedActor();
            $personnelProfileId = $actor['personnel_profile_id'] ?? $actor['profile_id'] ?? $actor['id'] ?? null;

            $json = $this->request->getJSON(true) ?? [];
            $cycleId = $json['evaluation_cycle_id'] ?? '2025-2026';

            $trace = $this->validationService->validateAndTracePoints($personnelProfileId, $json, $cycleId);

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $trace
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
            $actor = $this->actorService->getAuthenticatedActor();
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
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage()
            ]);
        }
    }

    /**
     * POST /api/v1/admin/evaluation-scales/{versionId}/approve
     */
    public function approveVersion(string $versionId): ResponseInterface
    {
        try {
            $actor = $this->actorService->getAuthenticatedActor();
            $roles = $actor['roles'] ?? [];
            if (!in_array('hr_admin', $roles) && !in_array('super_admin', $roles)) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Only HR Administrators may approve scale versions.'
                ]);
            }

            $json = $this->request->getJSON(true) ?? [];
            $reason = trim($json['reason'] ?? 'Official rubric version approval');

            $result = $this->adminService->approveVersion($versionId, $actor['id'] ?? 'hr_admin', $reason);

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
            $actor = $this->actorService->getAuthenticatedActor();
            $roles = $actor['roles'] ?? [];
            if (!in_array('hr_admin', $roles) && !in_array('super_admin', $roles)) {
                return $this->response->setStatusCode(403)->setJSON([
                    'code' => 'FORBIDDEN',
                    'message' => 'Only HR Administrators may retire scale versions.'
                ]);
            }

            $json = $this->request->getJSON(true) ?? [];
            $reason = trim($json['reason'] ?? 'Official rubric version retirement');

            $result = $this->adminService->retireVersion($versionId, $actor['id'] ?? 'hr_admin', $reason);

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
