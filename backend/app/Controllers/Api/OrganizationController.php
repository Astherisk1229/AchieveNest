<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\OrganizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;

class OrganizationController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected AuthorizationService $authService;
    protected OrganizationService $organizationService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?AuthorizationService $authService = null,
        ?OrganizationService $organizationService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->authService = $authService ?? new AuthorizationService();
        $this->organizationService = $organizationService ?? new OrganizationService();
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    protected function checkOSADAuthorization(?array $actor): bool
    {
        if ($actor === null) {
            return false;
        }

        return $this->authService->governance()->canManageOrganizations($actor);
    }

    /**
     * GET /api/v1/osad/organizations
     */
    public function index()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage student organizations.']], 403);
        }

        $status = $this->request->getGet('status');
        $category = $this->request->getGet('category');
        $scope = $this->request->getGet('scope');

        try {
            $organizations = $this->organizationService->listOrganizations($status, $category, $scope);
            return $this->respond(['organizations' => $organizations], 200);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/organizations/{id}
     */
    public function show(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }

        try {
            $org = $this->organizationService->getOrganization($id);
            if (! $org) {
                return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Organization not found.']], 404);
            }
            return $this->respond(['organization' => $org], 200);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * POST /api/v1/osad/organizations
     */
    public function create()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may create student organizations.']], 403);
        }

        // Support both multipart/form-data and JSON payloads
        $data = $this->request->getPost();
        if (empty($data)) {
            $data = $this->request->getJSON(true) ?? [];
        }

        // Support program_ids passed as JSON string or comma-separated string or array
        if (isset($data['program_ids']) && is_string($data['program_ids'])) {
            $decoded = json_decode($data['program_ids'], true);
            $data['program_ids'] = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $data['program_ids'])));
        }

        $logoFile = null;
        $file = $this->request->getFile('logo');
        if ($file && $file->isValid() && ! $file->hasMoved()) {
            $logoFile = [
                'tmp_name' => $file->getTempName(),
                'name'     => $file->getClientName(),
                'size'     => $file->getSize(),
                'error'    => $file->getError(),
            ];
        } elseif (! empty($_FILES['logo']['tmp_name'])) {
            $logoFile = $_FILES['logo'];
        }

        try {
            $created = $this->organizationService->createOrganization($data, $logoFile);
            return $this->respond(['message' => 'Organization created successfully.', 'organization' => $created], 201);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'CREATE_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/organizations/{id}/logo
     * Serves the logo image file.
     */
    public function logo(string $id)
    {
        try {
            $logoInfo = $this->organizationService->getLogoPath($id);
            if (! $logoInfo || ! file_exists($logoInfo['path'])) {
                return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Logo not found.']], 404);
            }

            $mime = $logoInfo['mime_type'];
            $fileContent = file_get_contents($logoInfo['path']);

            return $this->response
                ->setHeader('Content-Type', $mime)
                ->setHeader('Content-Length', (string) strlen($fileContent))
                ->setHeader('Cache-Control', 'public, max-age=86400')
                ->setBody($fileContent);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * POST /api/v1/osad/organizations/{id}/logo
     */
    public function updateLogo(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may update organization logos.']], 403);
        }

        $logoFile = null;
        $file = $this->request->getFile('logo');
        if ($file && $file->isValid() && ! $file->hasMoved()) {
            $logoFile = [
                'tmp_name' => $file->getTempName(),
                'name'     => $file->getClientName(),
                'size'     => $file->getSize(),
                'error'    => $file->getError(),
            ];
        } elseif (! empty($_FILES['logo']['tmp_name'])) {
            $logoFile = $_FILES['logo'];
        }

        if (! $logoFile) {
            return $this->respond(['error' => ['code' => 'MISSING_FILE', 'message' => 'No logo file provided.']], 422);
        }

        try {
            $updated = $this->organizationService->updateLogo($id, $logoFile);
            return $this->respond(['message' => 'Logo updated successfully.', 'organization' => $updated], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * DELETE /api/v1/osad/organizations/{id}/logo
     */
    public function deleteLogo(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may remove organization logos.']], 403);
        }

        try {
            $updated = $this->organizationService->deleteLogo($id);
            return $this->respond(['message' => 'Logo removed successfully.', 'organization' => $updated], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'DELETE_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }
}
