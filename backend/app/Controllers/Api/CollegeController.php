<?php

namespace App\Controllers\Api;

use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\CollegeService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use InvalidArgumentException;
use Throwable;

class CollegeController extends Controller
{
    use ResponseTrait;

    protected AuthenticatedActorService $actorService;
    protected AuthorizationService $authService;
    protected CollegeService $collegeService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?AuthorizationService $authService = null,
        ?CollegeService $collegeService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->authService = $authService ?? new AuthorizationService();
        $this->collegeService = $collegeService ?? new CollegeService();
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

        return $this->authService->governance()->canManageAcademicStructure($actor);
    }

    /**
     * GET /api/v1/osad/colleges
     */
    public function index()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }

        $status = $this->request->getGet('status');

        try {
            $colleges = $this->collegeService->listColleges($status);
            return $this->respond(['colleges' => $colleges], 200);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/colleges/{id}
     */
    public function show(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }

        try {
            $college = $this->collegeService->getCollege($id);
            if (! $college) {
                return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'College not found.']], 404);
            }
            return $this->respond(['college' => $college], 200);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * POST /api/v1/osad/colleges
     * Handles transactional creation of College, optional logo, and optional nested programs.
     */
    public function create()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage academic structure.']], 403);
        }

        // Support JSON or Multipart
        $json = $this->request->getJSON(true);
        $post = $this->request->getPost();
        $payload = is_array($json) && count($json) > 0 ? $json : (is_array($post) ? $post : []);

        // Optional logo file from multipart
        $logoFile = null;
        if ($this->request->getFile('logo') !== null && $this->request->getFile('logo')->isValid()) {
            $logoFile = $this->request->getFile('logo');
        }

        try {
            $result = $this->collegeService->createCollege($payload, $logoFile);

            return $this->respondCreated([
                'message'  => 'College created successfully.',
                'college'  => $result['college'],
                'programs' => $result['programs']
            ]);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'CREATION_FAILED', 'message' => 'Failed to create college: ' . $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/colleges/{id}/logo
     * Streams the college logo image binary.
     */
    public function logo(string $id)
    {
        try {
            $logoInfo = $this->collegeService->getLogoPathAndMime($id);
            if (! $logoInfo) {
                return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Logo not found for this college.']], 404);
            }

            $content = file_get_contents($logoInfo['path']);
            if ($content === false) {
                return $this->respond(['error' => ['code' => 'READ_FAILED', 'message' => 'Unable to read logo file.']], 500);
            }

            return $this->response
                ->setHeader('Content-Type', $logoInfo['mime_type'])
                ->setHeader('Content-Disposition', 'inline; filename="' . $logoInfo['original_name'] . '"')
                ->setHeader('Cache-Control', 'public, max-age=86400')
                ->setBody($content);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'STREAM_ERROR', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/academic-programs
     */
    public function listPrograms()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }

        $collegeId = $this->request->getGet('college_id');

        try {
            $programs = $this->collegeService->listPrograms($collegeId);
            return $this->respond(['programs' => $programs], 200);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * POST /api/v1/osad/academic-programs
     */
    public function createProgram()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage academic programs.']], 403);
        }

        $json = $this->request->getJSON(true);
        $post = $this->request->getPost();
        $payload = is_array($json) && count($json) > 0 ? $json : (is_array($post) ? $post : []);

        try {
            $program = $this->collegeService->createProgram($payload);
            return $this->respondCreated([
                'message' => 'Academic program created successfully.',
                'program' => $program
            ]);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'CREATION_FAILED', 'message' => 'Failed to create academic program: ' . $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/colleges/{id}/coordinator-personnel
     * Lists personnel eligible for Program Coordinator assignment under this College.
     */
    public function listCoordinatorPersonnel(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage coordinator assignments.']], 403);
        }

        try {
            $result = $this->collegeService->listCoordinatorPersonnel($id);
            return $this->respond($result, 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 404);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * GET /api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}
     * Retrieves one personnel member's assignment context for a specific College.
     */
    public function getPersonnelCoordinatorContext(string $id, string $profileId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage coordinator assignments.']], 403);
        }

        try {
            $result = $this->collegeService->getPersonnelCoordinatorContext($id, $profileId);
            return $this->respond($result, 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 404);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'FETCH_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * PUT /api/v1/osad/colleges/{id}/coordinator-personnel/{profileId}
     * Atomically saves desired coordinator assignments for one personnel across multiple programs in this College.
     */
    public function updatePersonnelCoordinatorAssignments(string $id, string $profileId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage coordinator assignments.']], 403);
        }

        $json = $this->request->getJSON(true);
        $programIds = is_array($json) && isset($json['program_ids']) ? (array) $json['program_ids'] : [];

        try {
            $actorProfileId = $actor['profile_id'] ?? null;
            $result = $this->collegeService->updatePersonnelCoordinatorAssignments($id, $profileId, $programIds, $actorProfileId);
            return $this->respond($result, 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }

    /**
     * PUT /api/v1/osad/academic-programs/{id}
     * Updates Academic Program master data (name, degree_level, status, and code).
     */
    public function updateProgram(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage academic programs.']], 403);
        }

        $json = $this->request->getJSON(true);
        $post = $this->request->getPost();
        $payload = is_array($json) && count($json) > 0 ? $json : (is_array($post) ? $post : []);

        try {
            $program = $this->collegeService->updateProgram($id, $payload);
            return $this->respond([
                'message' => 'Academic program updated successfully.',
                'program' => $program
            ], 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => 'Failed to update academic program: ' . $e->getMessage()]], 500);
        }
    }

    /**
     * POST /api/v1/osad/colleges/{id}/reassign-coordinator
     * Explicitly reassigns an academic program coordinator under this College.
     */
    public function reassignCoordinator(string $id)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid authenticated session required.']], 401);
        }
        if (! $this->checkOSADAuthorization($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only OSAD administrators may manage coordinator assignments.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $programId = trim((string) ($json['program_id'] ?? ''));
        $newCoordinatorId = trim((string) ($json['new_coordinator_profile_id'] ?? ($json['coordinator_profile_id'] ?? '')));

        if ($programId === '' || $newCoordinatorId === '') {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'program_id and new_coordinator_profile_id are required.']], 422);
        }

        try {
            $actorProfileId = $actor['profile_id'] ?? null;
            $result = $this->collegeService->reassignCoordinator($id, $programId, $newCoordinatorId, $actorProfileId);
            return $this->respond($result, 200);
        } catch (InvalidArgumentException $e) {
            return $this->respond(['error' => ['code' => 'VALIDATION_ERROR', 'message' => $e->getMessage()]], 422);
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'REASSIGNMENT_FAILED', 'message' => $e->getMessage()]], 500);
        }
    }
}

