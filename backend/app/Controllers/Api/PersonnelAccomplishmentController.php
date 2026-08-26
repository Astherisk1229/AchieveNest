<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelAccomplishmentController extends Controller
{
    use ResponseTrait;

    private AuthenticatedActorService $actorService;

    public function __construct(?AuthenticatedActorService $actorService = null)
    {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    private function actor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    public function index(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $profileId = $actor['profile']['id'];
        $isHr = ($actor['profile']['account_type'] ?? '') === 'hr_admin'
            && in_array('hr_staff', $actor['roles'], true);
        $requestedProfileId = trim((string) $this->request->getGet('personnel_profile_id'));

        if ($requestedProfileId !== '' && ! $isHr && $requestedProfileId !== $profileId) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You may only view your own accomplishments.']], 403);
        }

        $targetId = $requestedProfileId !== '' ? $requestedProfileId : $profileId;
        $rows = db_connect()->table('public.personnel_accomplishments a')
            ->select('a.*, COUNT(e.id) AS evidence_count')
            ->join('public.personnel_accomplishment_evidence e', 'e.accomplishment_id = a.id', 'left')
            ->where('a.personnel_profile_id', $targetId)
            ->groupBy('a.id')
            ->orderBy('a.created_at', 'DESC')
            ->get()->getResultArray();

        return $this->respond(['data' => ['accomplishments' => $rows, 'total' => count($rows)]]);
    }

    public function create(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }
        if (($actor['profile']['account_type'] ?? '') !== 'personnel') {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only Personnel may create portfolio accomplishments.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $title = trim((string) ($json['title'] ?? ''));
        $categoryCode = trim((string) ($json['category_code'] ?? ''));
        $categoryArea = trim((string) ($json['category_area'] ?? ''));
        $description = trim((string) ($json['description'] ?? ''));
        $dateAchieved = trim((string) ($json['date_achieved'] ?? ''));
        $metadata = $json['category_metadata'] ?? [];

        if (! ValidationHelper::validateBoundedText($title, ValidationHelper::MAX_LABEL_LENGTH)
            || ! ValidationHelper::validateBoundedText($categoryCode, 100)
            || ! ValidationHelper::validateEnum($categoryArea, ['areaA', 'areaB', 'areaC'])
            || ($description !== '' && ! ValidationHelper::validateBoundedText($description, ValidationHelper::MAX_DESCRIPTION_LENGTH, true))
            || ($dateAchieved !== '' && ! ValidationHelper::validateDateString($dateAchieved))
            || ! is_array($metadata)) {
            return $this->respond(['error' => ['code' => 'INVALID_ACCOMPLISHMENT', 'message' => 'Invalid accomplishment fields.']], 422);
        }

        $id = (string) service('uuid')->uuid4();
        try {
            db_connect()->table('public.personnel_accomplishments')->insert([
                'id' => $id,
                'personnel_profile_id' => $actor['profile']['id'],
                'category_code' => $categoryCode,
                'category_area' => $categoryArea,
                'title' => $title,
                'category_metadata' => json_encode($metadata),
                'date_achieved' => $dateAchieved ?: null,
                'description' => $description ?: null,
                'status' => 'draft',
            ]);
        } catch (Throwable) {
            return $this->respond(['error' => ['code' => 'CREATE_FAILED', 'message' => 'Unable to create the accomplishment.']], 500);
        }

        return $this->respondCreated(['data' => ['id' => $id, 'status' => 'draft']]);
    }

    public function addEvidence(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $accomplishment = $db->table('public.personnel_accomplishments')
            ->where('id', $id)->where('personnel_profile_id', $actor['profile']['id'])
            ->whereIn('status', ['draft', 'rejected'])->get()->getRowArray();
        if ($accomplishment === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Editable accomplishment not found.']], 404);
        }

        $json = $this->request->getJSON(true) ?? [];
        $path = trim((string) ($json['storage_path'] ?? ''));
        $filename = trim((string) ($json['original_filename'] ?? ''));
        $mime = trim((string) ($json['mime_type'] ?? ''));
        $size = filter_var($json['byte_size'] ?? null, FILTER_VALIDATE_INT);
        $allowedMime = ['application/pdf', 'image/jpeg', 'image/png'];

        if ($path === '' || ! str_starts_with($path, $actor['profile']['id'] . '/')
            || ! ValidationHelper::validateBoundedText($filename, 255)
            || ! in_array($mime, $allowedMime, true)
            || $size === false || $size < 1 || $size > 10 * 1024 * 1024) {
            return $this->respond(['error' => ['code' => 'INVALID_EVIDENCE', 'message' => 'Invalid evidence metadata or object path.']], 422);
        }

        $evidenceId = (string) service('uuid')->uuid4();
        $db->table('public.personnel_accomplishment_evidence')->insert([
            'id' => $evidenceId,
            'accomplishment_id' => $id,
            'storage_path' => $path,
            'original_filename' => $filename,
            'mime_type' => $mime,
            'byte_size' => $size,
            'checksum' => trim((string) ($json['checksum'] ?? '')) ?: null,
            'uploaded_by' => $actor['profile']['id'],
        ]);

        return $this->respondCreated(['data' => ['id' => $evidenceId]]);
    }
}
