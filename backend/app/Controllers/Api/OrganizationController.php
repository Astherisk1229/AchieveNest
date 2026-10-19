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

        $moderatedOrganizationIds = array_column(array_filter(
            $actor['assignments'] ?? [],
            static fn (array $assignment): bool => ($assignment['role_key'] ?? '') === 'organization_moderator'
        ), 'scope_id');
        $isAssignedModerator = in_array('organization_moderator', $actor['roles'] ?? [], true)
            && in_array($id, array_map('strval', $moderatedOrganizationIds), true);
        if (! $this->checkOSADAuthorization($actor) && ! $isAssignedModerator) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Organization details are available only to OSAD administrators and the organization’s assigned moderator.']], 403);
        }

        try {
            $org = $this->organizationService->getOrganization($id);
            if (! $org) {
                return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Organization not found.']], 404);
            }
            return $this->respond([
                'organization'         => $org,
                'program_scope'        => $org['programs'] ?? [],
                'current_moderator'    => $org['current_moderator'] ?? null,
                'configuration_status' => $org['configuration_status'] ?? 'COMPLETE',
            ], 200);
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

        $actorProfileId = $actor['profile']['id'] ?? null;

        try {
            $created = $this->organizationService->createOrganization($data, $logoFile, $actorProfileId);
            return $this->respond([
                'message'              => 'Organization created successfully.',
                'organization'         => $created,
                'program_scope'        => $created['programs'] ?? [],
                'current_moderator'    => $created['current_moderator'] ?? null,
                'configuration_status' => $created['configuration_status'] ?? 'COMPLETE',
            ], 201);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'CREATE_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * POST /api/v1/osad/organizations/{id}/moderator
     * Assigns or reassigns an Organization Moderator to an organization.
     */
    public function assignModerator(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may assign organization moderators.']], 403);
        }

        $json = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];
        $personnelProfileId = ! empty($json['personnel_profile_id'])
            ? trim((string) $json['personnel_profile_id'])
            : (! empty($json['moderator_profile_id']) ? trim((string) $json['moderator_profile_id']) : null);

        if (! $personnelProfileId) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => 'personnel_profile_id is required.']], 422);
        }

        $actorProfileId = $actor['profile']['id'] ?? null;

        try {
            $updated = $this->organizationService->assignModerator($id, $personnelProfileId, $actorProfileId);
            return $this->respond([
                'message'              => 'Organization Moderator assigned successfully.',
                'organization'         => $updated,
                'current_moderator'    => $updated['current_moderator'] ?? null,
                'configuration_status' => $updated['configuration_status'] ?? 'COMPLETE',
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'ASSIGN_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /** GET /api/v1/osad/organizations/{id}/moderator-candidates */
    public function moderatorCandidates(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may view eligible organization moderators.']], 403);
        }

        try {
            return $this->respond([
                'personnel' => $this->organizationService->listModeratorCandidates($id),
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
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
     * PATCH /api/v1/osad/organizations/{id}
     * Updates organization master data.
     */
    public function update(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may update student organizations.']], 403);
        }

        // The edit modal sends JSON for ordinary detail updates. Parse JSON
        // before getRawInput(), which is intended for URL-encoded PATCH bodies
        // and can return a non-empty, incorrectly parsed array for JSON.
        $contentType = strtolower($this->request->getHeaderLine('Content-Type'));
        if (str_contains($contentType, 'application/json')) {
            $data = $this->request->getJSON(true);
        } else {
            $data = $this->request->getPost();
            if (empty($data)) {
                $data = $this->request->getRawInput();
            }
        }
        $data = is_array($data) ? $data : [];

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
            $updated = $this->organizationService->updateOrganization($id, $data, $logoFile);
            return $this->respond([
                'message'              => 'Organization updated successfully.',
                'organization'         => $updated,
                'program_scope'        => $updated['programs'] ?? [],
                'current_moderator'    => $updated['current_moderator'] ?? null,
                'configuration_status' => $updated['configuration_status'] ?? 'COMPLETE',
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * PATCH /api/v1/osad/organizations/{id}/moderator-profile
     * Updates public-facing profile fields for the moderator's assigned organization.
     */
    public function updateModeratorProfile(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }

        $isAssignedModerator = in_array('organization_moderator', $actor['roles'] ?? [], true)
            && in_array($id, $this->authService->getModeratedOrganizationIds($actor), true);
        if (! $isAssignedModerator) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only the assigned organization moderator may update this profile.']], 403);
        }

        $input = $this->request->getJSON(true);
        $allowedFields = ['description', 'contact_email', 'facebook_url'];
        if (! is_array($input) || array_diff(array_keys($input), $allowedFields) !== []) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => 'Submit only description, contact email, and social page fields.']], 422);
        }

        try {
            $db = db_connect();
            if (! $db->fieldExists('profile_configuration', 'organizations')) {
                return $this->respond(['error' => ['code' => 'PROFILE_SCHEMA_UNAVAILABLE', 'message' => 'Organization profile saving is temporarily unavailable until the database migration is applied.']], 503);
            }
            $organization = $db->table('organizations')->select('profile_configuration')->where('id', $id)->get()->getRowArray();
            if (! $organization) {
                return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Organization not found.']], 404);
            }

            $configuration = $organization['profile_configuration'] ?? [];
            if (is_string($configuration)) $configuration = json_decode($configuration, true) ?: [];
            if (! is_array($configuration)) $configuration = [];

            foreach ($allowedFields as $field) {
                if (! array_key_exists($field, $input)) continue;
                $value = trim((string) $input[$field]);
                $maxLength = $field === 'description' ? 2000 : ($field === 'facebook_url' ? 500 : 254);
                if (mb_strlen($value) > $maxLength) {
                    return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => ucfirst(str_replace('_', ' ', $field)) . " may not exceed {$maxLength} characters."]], 422);
                }
                if ($field === 'contact_email' && $value !== '' && filter_var($value, FILTER_VALIDATE_EMAIL) === false) {
                    return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => 'Enter a valid contact email address.']], 422);
                }
                if ($field === 'facebook_url' && $value !== '') {
                    $parts = parse_url($value);
                    if ($parts === false || ! in_array(strtolower($parts['scheme'] ?? ''), ['http', 'https'], true) || empty($parts['host'])) {
                        return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => 'Enter a valid http or https social page URL.']], 422);
                    }
                }
                $configuration[$field] = $value;
            }

            $db->table('organizations')->where('id', $id)->update([
                'profile_configuration' => json_encode($configuration, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

            return $this->respond(['message' => 'Organization profile saved.', 'profile_configuration' => $configuration], 200);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => 'The organization profile could not be saved.']], 500);
        }
    }

    /**
     * POST /api/v1/osad/organizations/{id}/programs
     * Adds academic programs to an organization's program scope.
     */
    public function addPrograms(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage organization program scope.']], 403);
        }

        $json = $this->request->getJSON(true) ?? $this->request->getPost() ?? [];
        $programIds = $json['program_ids'] ?? [];

        if (is_string($programIds)) {
            $decoded = json_decode($programIds, true);
            $programIds = is_array($decoded) ? $decoded : array_filter(array_map('trim', explode(',', $programIds)));
        }

        try {
            $updated = $this->organizationService->addProgramAffiliations($id, $programIds);
            return $this->respond([
                'message'              => 'Program scope updated successfully.',
                'organization'         => $updated,
                'program_scope'        => $updated['programs'] ?? [],
                'configuration_status' => $updated['configuration_status'] ?? 'COMPLETE',
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'ADD_PROGRAMS_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * DELETE /api/v1/osad/organizations/{id}/programs/{programId}
     * Removes an academic program from an organization's scope.
     */
    public function removeProgram(string $id, string $programId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage organization program scope.']], 403);
        }

        try {
            $updated = $this->organizationService->removeProgramAffiliation($id, $programId);
            return $this->respond([
                'message'              => 'Academic program removed from organization scope.',
                'organization'         => $updated,
                'program_scope'        => $updated['programs'] ?? [],
                'configuration_status' => $updated['configuration_status'] ?? 'COMPLETE',
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'REMOVE_PROGRAM_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * DELETE /api/v1/osad/organizations/{id}/moderator
     * Removes / unassigns the active moderator.
     */
    public function removeModerator(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage organization moderators.']], 403);
        }

        $actorProfileId = $actor['profile']['id'] ?? null;

        try {
            $updated = $this->organizationService->removeModerator($id, $actorProfileId);
            return $this->respond([
                'message'              => 'Organization Moderator removed successfully.',
                'organization'         => $updated,
                'current_moderator'    => null,
                'configuration_status' => $updated['configuration_status'] ?? 'COMPLETE',
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_FAILED', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'REMOVE_MODERATOR_FAILED', 'message' => $e->getMessage()]], 500);
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
