<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Services\AuthenticatedActorService;
use App\Services\PartTimeFacultyTitleService;
use CodeIgniter\HTTP\ResponseInterface;
use Throwable;

class PartTimeFacultyTitleController extends BaseController
{
    protected AuthenticatedActorService $actorService;
    protected PartTimeFacultyTitleService $titleService;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?PartTimeFacultyTitleService $titleService = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->titleService = $titleService ?? new PartTimeFacultyTitleService();
    }

    /**
     * GET /api/v1/faculty-titles/part-time
     * Lists the four canonical Part-Time Faculty Titles.
     */
    public function listTitles(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $titles = $this->titleService->getAllTitles();

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'metadata' => [
                    'source_document_id' => 'NDMU-DOC-ACAD-RANKS-2026-V1',
                    'catalog_type' => 'part_time_faculty_title',
                    'seed_version' => '2026.1',
                    'total_titles' => count($titles),
                ],
                'data' => $titles,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * GET /api/v1/faculty-titles/part-time/{code}
     * Returns details of a specific Part-Time Title.
     */
    public function getTitle(string $code): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $title = $this->titleService->getTitleByCode($code);

            if (!$title) {
                return $this->response->setStatusCode(404)->setJSON([
                    'code' => 'TITLE_NOT_FOUND',
                    'message' => "Part-Time Faculty Title with code [{$code}] was not found in the active catalogue.",
                ]);
            }

            return $this->response->setStatusCode(200)->setJSON([
                'success' => true,
                'data' => $title,
            ]);
        } catch (Throwable $e) {
            return $this->response->setStatusCode(500)->setJSON([
                'code' => 'SERVER_ERROR',
                'message' => $e->getMessage(),
            ]);
        }
    }

    /**
     * POST /api/v1/faculty-titles/part-time/resolve
     * Resolves Part-Time Title from verified qualification context.
     */
    public function resolveTitle(): ResponseInterface
    {
        if ($deny = $this->denyUnlessAuthorized()) {
            return $deny;
        }
        try {
            $payload = $this->request->getJSON(true) ?? [];
            $result = $this->titleService->resolveTitleFromQualification($payload);

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
     * Mutation endpoints blocked to protect source freeze integrity.
     */
    public function mutate(): ResponseInterface
    {
        return $this->response->setStatusCode(403)->setJSON([
            'code' => 'CATALOG_MUTATION_RESTRICTED',
            'message' => 'Direct Part-Time title catalogue mutation is prohibited.',
        ]);
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
