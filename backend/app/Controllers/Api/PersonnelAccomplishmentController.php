<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class PersonnelAccomplishmentController extends Controller
{
    use ResponseTrait;

    private AuthorizationService $authz;
    private LocalEvidenceStorageService $storage;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?LocalEvidenceStorageService $storage = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->storage = $storage ?? new LocalEvidenceStorageService();
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

        $db = db_connect();
        $builder = $db->table('personnel_accomplishments pa')
            ->select('pa.*, COUNT(e.id) AS evidence_count')
            ->join('personnel_accomplishment_evidence e', 'e.accomplishment_id = pa.id', 'left');

        if ($requestedProfileId !== '') {
            $builder->where('pa.personnel_profile_id', $requestedProfileId);
        } else {
            $this->authz->personnel()->scopeAccomplishmentQuery($actor, $builder);
        }

        $rows = $builder->groupBy('pa.id')
            ->orderBy('pa.created_at', 'DESC')
            ->get()->getResultArray();

        $accIds = array_column($rows, 'id');
        $evidenceMap = [];
        if (! empty($accIds)) {
            $evRows = $db->table('personnel_accomplishment_evidence')
                ->whereIn('accomplishment_id', $accIds)
                ->orderBy('uploaded_at', 'ASC')
                ->get()->getResultArray();
            foreach ($evRows as $ev) {
                $evidenceMap[$ev['accomplishment_id']][] = [
                    'id'                => $ev['id'],
                    'original_filename' => $ev['original_filename'],
                    'byte_size'         => (int) $ev['byte_size'],
                    'mime_type'         => $ev['detected_mime_type'] ?: $ev['mime_type'],
                    'checksum'          => $ev['checksum'] ?: $ev['sha256'],
                    'uploaded_at'       => $ev['uploaded_at'],
                    'status'            => $ev['status'] ?? 'active',
                ];
            }
        }
        foreach ($rows as &$r) {
            $r['evidence'] = $evidenceMap[$r['id']] ?? [];
            $r['primary_evidence'] = $r['evidence'][0] ?? null;
        }

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
        $domain = trim((string) ($json['domain'] ?? ''));
        $categoryArea = trim((string) ($json['category_area'] ?? ''));
        $category = trim((string) ($json['category'] ?? ''));
        if ($domain === '') {
            if ($categoryArea === 'areaA' || str_starts_with($category, 'A.') || str_starts_with($category, 'A ')) {
                $domain = 'professional_development';
            } elseif ($categoryArea === 'areaB' || str_starts_with($category, 'B.') || str_starts_with($category, 'B ')) {
                $domain = 'productivity_creative_work';
            } elseif ($categoryArea === 'areaC' || str_starts_with($category, 'C.') || str_starts_with($category, 'C ')) {
                $domain = 'service_leadership';
            } else {
                $domain = match ($categoryArea) {
                    'areaB' => 'productivity_creative_work',
                    'areaC' => 'service_leadership',
                    default => 'professional_development',
                };
            }
        }
        $organizer = trim((string) ($json['organizer_or_publisher'] ?? $json['institution'] ?? $json['issuer'] ?? $json['location'] ?? '')) ?: null;
        $description = trim((string) ($json['description'] ?? ''));
        $dateAchieved = trim((string) ($json['date_achieved'] ?? $json['occurrence_date'] ?? $json['date'] ?? ''));
        $claimedPoints = (float) ($json['claimed_points'] ?? $json['points'] ?? 0.0);

        if (! ValidationHelper::validateBoundedText($title, ValidationHelper::MAX_LABEL_LENGTH)
            || ! in_array($domain, ['professional_development', 'productivity_creative_work', 'service_leadership'], true)
            || ($description !== '' && ! ValidationHelper::validateBoundedText($description, ValidationHelper::MAX_DESCRIPTION_LENGTH, true))
            || ($dateAchieved !== '' && ! ValidationHelper::validateDateString($dateAchieved))) {
            return $this->respond(['error' => ['code' => 'INVALID_ACCOMPLISHMENT', 'message' => 'Invalid accomplishment fields.']], 422);
        }

        $id = $this->genUuid();
        $now = date('Y-m-d H:i:s');
        try {
            db_connect()->table('personnel_accomplishments')->insert([
                'id'                     => $id,
                'personnel_profile_id'   => $actor['profile']['id'],
                'domain'                 => $domain,
                'title'                  => $title,
                'organizer_or_publisher' => $organizer,
                'occurrence_date'        => $dateAchieved ?: null,
                'description'            => $description ?: null,
                'claimed_points'         => $claimedPoints,
                'status'                 => 'draft',
                'created_at'             => $now,
                'updated_at'             => $now,
            ]);
        } catch (Throwable) {
            return $this->respond(['error' => ['code' => 'CREATE_FAILED', 'message' => 'Unable to create the accomplishment.']], 500);
        }

        return $this->respondCreated(['data' => ['id' => $id, 'status' => 'draft']]);
    }

    public function update(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $accomplishment = $db->table('personnel_accomplishments')
            ->where('id', $id)
            ->get()->getRowArray();

        if ($accomplishment === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Accomplishment not found.']], 404);
        }

        $isOwner = ($accomplishment['personnel_profile_id'] === $actor['profile']['id']);
        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        if (! $isOwner && ! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You cannot edit this accomplishment.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $title = isset($json['title']) ? trim((string) $json['title']) : $accomplishment['title'];
        $domain = isset($json['domain']) ? trim((string) $json['domain']) : $accomplishment['domain'];
        $categoryArea = trim((string) ($json['category_area'] ?? ''));
        $category = trim((string) ($json['category'] ?? ''));
        if ($category !== '' || $categoryArea !== '') {
            if ($categoryArea === 'areaA' || str_starts_with($category, 'A.') || str_starts_with($category, 'A ')) {
                $domain = 'professional_development';
            } elseif ($categoryArea === 'areaB' || str_starts_with($category, 'B.') || str_starts_with($category, 'B ')) {
                $domain = 'productivity_creative_work';
            } elseif ($categoryArea === 'areaC' || str_starts_with($category, 'C.') || str_starts_with($category, 'C ')) {
                $domain = 'service_leadership';
            }
        }
        $organizer = isset($json['organizer_or_publisher']) || isset($json['issuer']) || isset($json['location'])
            ? (trim((string) ($json['organizer_or_publisher'] ?? $json['issuer'] ?? $json['location'] ?? '')) ?: null)
            : $accomplishment['organizer_or_publisher'];
        $description = isset($json['description']) ? trim((string) $json['description']) : ($accomplishment['description'] ?? '');
        $dateAchieved = isset($json['date_achieved']) || isset($json['occurrence_date']) || isset($json['date'])
            ? trim((string) ($json['date_achieved'] ?? $json['occurrence_date'] ?? $json['date'] ?? ''))
            : ($accomplishment['occurrence_date'] ?? '');
        $claimedPoints = isset($json['claimed_points']) || isset($json['points'])
            ? (float) ($json['claimed_points'] ?? $json['points'] ?? 0.0)
            : (float) ($accomplishment['claimed_points'] ?? 0.0);

        if (! ValidationHelper::validateBoundedText($title, ValidationHelper::MAX_LABEL_LENGTH)
            || ! in_array($domain, ['professional_development', 'productivity_creative_work', 'service_leadership'], true)
            || ($description !== '' && ! ValidationHelper::validateBoundedText($description, ValidationHelper::MAX_DESCRIPTION_LENGTH, true))
            || ($dateAchieved !== '' && ! ValidationHelper::validateDateString($dateAchieved))) {
            return $this->respond(['error' => ['code' => 'INVALID_ACCOMPLISHMENT', 'message' => 'Invalid accomplishment fields.']], 422);
        }

        $now = date('Y-m-d H:i:s');
        try {
            $db->table('personnel_accomplishments')->where('id', $id)->update([
                'title'                  => $title,
                'domain'                 => $domain,
                'organizer_or_publisher' => $organizer,
                'occurrence_date'        => $dateAchieved ?: null,
                'description'            => $description ?: null,
                'claimed_points'         => $claimedPoints,
                'updated_at'             => $now,
            ]);
        } catch (Throwable) {
            return $this->respond(['error' => ['code' => 'UPDATE_FAILED', 'message' => 'Unable to update accomplishment.']], 500);
        }

        return $this->respond(['data' => ['id' => $id, 'message' => 'Accomplishment updated successfully.']]);
    }

    public function addEvidence(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $file = $this->request->getFile('file') ?? $this->request->getFile('evidence_file');
        if ($file === null || ! $file->isValid()) {
            return $this->respond(['error' => ['code' => 'FILE_REQUIRED', 'message' => 'A valid evidence file is required in multipart/form-data.']], 400);
        }

        $uploadService = new \App\Services\PersonnelEvidenceUploadService($this->authz, $this->storage);
        $result = $uploadService->uploadEvidence($actor, $id, $file);

        if (! $result['success']) {
            return $this->respond(['error' => $result['error']], $result['status']);
        }

        return $this->respondCreated(['data' => $result['data']]);
    }

    public function delete(string $id): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']], 401);
        }

        $db = db_connect();
        $accomplishment = $db->table('personnel_accomplishments')
            ->where('id', $id)
            ->get()->getRowArray();

        if ($accomplishment === null) {
            return $this->respond(['error' => ['code' => 'NOT_FOUND', 'message' => 'Accomplishment not found.']], 404);
        }

        $isOwner = ($accomplishment['personnel_profile_id'] === $actor['profile']['id']);
        $isHr = $this->authz->hasRole($actor, 'hr_staff');
        if (! $isOwner && ! $isHr) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You cannot delete this accomplishment.']], 403);
        }

        // Clean up attached physical evidence files
        $evidenceRows = $db->table('personnel_accomplishment_evidence')
            ->where('accomplishment_id', $id)
            ->get()->getResultArray();

        foreach ($evidenceRows as $ev) {
            if (! empty($ev['storage_path'])) {
                $this->storage->deletePhysicalFile($ev['storage_path']);
            }
        }

        $db->table('personnel_accomplishment_evidence')->where('accomplishment_id', $id)->delete();
        $db->table('personnel_accomplishments')->where('id', $id)->delete();

        return $this->respond(['data' => ['message' => 'Accomplishment and linked evidence deleted successfully.']]);
    }
}
