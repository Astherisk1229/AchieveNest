<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelAccomplishmentController extends Controller
{
    use ResponseTrait;

    private AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    private function actor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    public function index(): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $profileId = $actor['profile']['id'];
        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        $requestedProfileId = trim((string) $this->request->getGet('personnel_profile_id'));

        if ($requestedProfileId !== '' && ! $isHr && $requestedProfileId !== $profileId) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You may only view your own accomplishments.']], 403);
        }

        $targetId = $requestedProfileId !== '' ? $requestedProfileId : $profileId;
        $db = db_connect();
        $builder = $db->table('personnel_accomplishments a')
            ->select('a.*, COUNT(e.id) AS evidence_count')
            ->join('personnel_accomplishment_evidence e', 'e.accomplishment_id = a.id', 'left');

        if ($requestedProfileId !== '') {
            $builder->where('a.personnel_profile_id', $requestedProfileId);
        } else {
            $this->authz->personnel()->scopeAccomplishmentQuery($actor, $builder);
        }

        $rows = $builder->groupBy('a.id')
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
        if (! $this->authz->personnel()->canCreateAccomplishment($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Only active Personnel may create portfolio accomplishments.']], 403);
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

        $id = $this->genUuid();
        try {
            db_connect()->table('personnel_accomplishments')->insert([
                'id'                   => $id,
                'personnel_profile_id' => $actor['profile']['id'],
                'category_code'        => $categoryCode,
                'category_area'        => $categoryArea,
                'title'                => $title,
                'category_metadata'    => json_encode($metadata),
                'date_achieved'        => $dateAchieved ?: null,
                'description'          => $description ?: null,
                'status'               => 'draft',
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
        $accomplishment = $db->table('personnel_accomplishments')
            ->where('id', $id)->where('personnel_profile_id', $actor['profile']['id'])
            ->whereIn('status', ['draft', 'rejected', 'pending'])->get()->getRowArray();
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

        $evidenceId = $this->genUuid();
        $db->table('personnel_accomplishment_evidence')->insert([
            'id'                => $evidenceId,
            'accomplishment_id' => $id,
            'storage_path'      => $path,
            'original_filename' => $filename,
            'mime_type'         => $mime,
            'byte_size'         => $size,
            'checksum'          => trim((string) ($json['checksum'] ?? '')) ?: null,
            'uploaded_by'       => $actor['profile']['id'],
        ]);

        return $this->respondCreated(['data' => ['id' => $evidenceId]]);
    }
}
