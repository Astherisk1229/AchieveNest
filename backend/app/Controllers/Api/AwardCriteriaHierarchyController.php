<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\AwardCriteriaHierarchyAdministrationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use RuntimeException;

final class AwardCriteriaHierarchyController extends Controller
{
    use ResponseTrait;

    private AuthorizationService $authz;
    private AwardCriteriaHierarchyAdministrationService $service;

    public function __construct(?AuthorizationService $authz = null, ?AwardCriteriaHierarchyAdministrationService $service = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
        $this->service = $service ?? new AwardCriteriaHierarchyAdministrationService();
    }

    public function options(): mixed { return $this->respond(null, 204); }

    public function index(string $awardId): mixed
    {
        $actor = $this->authorize();
        if (isset($actor['__http_error'])) return $this->authorizationResponse($actor['__http_error']);
        try { return $this->respond(['data' => $this->service->get($awardId)], 200); }
        catch (RuntimeException $e) { return $this->failure($e); }
    }

    public function createDraft(string $awardId): mixed
    {
        $actor = $this->authorize();
        if (isset($actor['__http_error'])) return $this->authorizationResponse($actor['__http_error']);
        try { return $this->respond(['data' => $this->service->createDraft($awardId, (array) $this->request->getJSON(true), (string) ($actor['profile']['id'] ?? ''))], 201); }
        catch (RuntimeException $e) { return $this->failure($e); }
    }

    public function saveDraft(string $awardId, string $versionId): mixed
    {
        $actor = $this->authorize();
        if (isset($actor['__http_error'])) return $this->authorizationResponse($actor['__http_error']);
        try {
            $body = (array) $this->request->getJSON(true);
            return $this->respond(['data' => $this->service->saveDraft($awardId, $versionId, (array) ($body['hierarchy'] ?? []))], 200);
        } catch (RuntimeException $e) { return $this->failure($e); }
    }

    public function validateDraft(string $awardId, string $versionId): mixed
    {
        $actor = $this->authorize();
        if (isset($actor['__http_error'])) return $this->authorizationResponse($actor['__http_error']);
        try { return $this->respond(['data' => $this->service->validate($awardId, $versionId)], 200); }
        catch (RuntimeException $e) { return $this->failure($e); }
    }

    public function publishDraft(string $awardId, string $versionId): mixed
    {
        $actor = $this->authorize();
        if (isset($actor['__http_error'])) return $this->authorizationResponse($actor['__http_error']);
        try { return $this->respond(['data' => $this->service->publish($awardId, $versionId, (string) ($actor['profile']['id'] ?? ''))], 200); }
        catch (RuntimeException $e) { return $this->failure($e); }
    }

    private function authorize(): array
    {
        $actor = $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return ['__http_error' => 401];
        if (! $this->authz->award()->canRunAwardEvaluation($actor)) return ['__http_error' => 403];
        return $actor;
    }

    private function authorizationResponse(int $status): mixed
    {
        return $status === 401
            ? $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401)
            : $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Active OSAD administrator authorization required.']], 403);
    }

    private function failure(RuntimeException $e): mixed
    {
        $code = $e->getMessage();
        $status = match (true) {
            $code === 'AWARD_NOT_FOUND', $code === 'VERSION_NOT_FOUND' => 404,
            $code === 'PUBLISHED_VERSION_IMMUTABLE' => 409,
            default => 422,
        };
        return $this->respond(['error' => ['code' => explode(':', $code, 2)[0], 'message' => $code]], $status);
    }
}
