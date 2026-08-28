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
        $domain = trim((string) ($json['domain'] ?? ''));
        $categoryArea = trim((string) ($json['category_area'] ?? ''));
        if ($domain === '') {
            $domain = match ($categoryArea) {
                'areaA' => 'productivity_creative_work',
                'areaB' => 'professional_development',
                'areaC' => 'service_leadership',
                default => 'professional_development',
            };
        }
        $organizer = ! empty($json['organizer_or_publisher']) ? trim((string) $json['organizer_or_publisher']) : null;
        $description = trim((string) ($json['description'] ?? ''));
        $dateAchieved = trim((string) ($json['date_achieved'] ?? $json['occurrence_date'] ?? ''));
        $claimedPoints = (float) ($json['claimed_points'] ?? 0.0);

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

    public function addEvidence(string $id): mixed
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

        if (! $this->authz->evidence()->canUploadPersonnelEvidence($actor, $accomplishment)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'You are not authorized to upload evidence for this accomplishment.']], 403);
        }

        $file = $this->request->getFile('file') ?? $this->request->getFile('evidence_file');
        if ($file === null || ! $file->isValid()) {
            return $this->respond(['error' => ['code' => 'FILE_REQUIRED', 'message' => 'A valid evidence file is required in multipart/form-data.']], 400);
        }

        $val = $this->storage->validateFile($file->getTempName(), $file->getClientName());
        if (! $val['success']) {
            $status = $val['error_code'] === 'FILE_TOO_LARGE' ? 413 : ($val['error_code'] === 'UNSUPPORTED_FILE_TYPE' ? 415 : 422);
            return $this->respond(['error' => ['code' => $val['error_code'], 'message' => $val['error_message']]], $status);
        }

        try {
            $stored = $this->storage->storeFile(
                $file->getTempName(),
                'personnel',
                $actor['profile']['id'],
                $id,
                $val['extension'],
                true
            );
        } catch (Throwable $e) {
            return $this->respond(['error' => ['code' => 'STORAGE_FAILED', 'message' => 'Failed to store uploaded file.']], 500);
        }

        $evidenceId = $this->genUuid();
        $now = date('Y-m-d H:i:s');
        $evidenceRow = [
            'id'                  => $evidenceId,
            'accomplishment_id'   => $id,
            'storage_path'        => $stored['storage_path'],
            'original_filename'   => $file->getClientName(),
            'mime_type'           => $val['detected_mime'],
            'detected_mime_type'  => $val['detected_mime'],
            'byte_size'           => $stored['byte_size'],
            'checksum'            => $stored['sha256'],
            'sha256'              => $stored['sha256'],
            'uploaded_by'         => $actor['profile']['id'],
            'uploaded_at'         => $now,
            'security_status'     => 'pending',
            'malware_scanner'     => 'none_deferred',
            'status'              => 'active',
        ];

        $db->transStart();
        try {
            $db->table('personnel_accomplishment_evidence')->insert($evidenceRow);
            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            $this->storage->deletePhysicalFile($stored['storage_path']);
            return $this->respond(['error' => ['code' => 'DATABASE_ERROR', 'message' => 'Failed to persist evidence record.']], 500);
        }

        if ($db->transStatus() === false) {
            $this->storage->deletePhysicalFile($stored['storage_path']);
            return $this->respond(['error' => ['code' => 'DATABASE_ERROR', 'message' => 'Failed to persist evidence record.']], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'  => 'Evidence uploaded and secured successfully.',
                'evidence' => $this->storage->formatSafeEvidence($evidenceRow, 'personnel'),
            ],
        ]);
    }
}
