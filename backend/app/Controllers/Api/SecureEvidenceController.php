<?php

namespace App\Controllers\Api;

use App\Helpers\ValidationHelper;
use App\Services\AuthenticatedActorService;
use App\Services\EvidenceFileSecurityService;
use App\Services\SupabaseStorageService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use RuntimeException;
use Throwable;

/**
 * Backend-mediated evidence upload/download.
 *
 * The browser never chooses a permanent Storage path and never supplies trusted
 * MIME/size/checksum values. All security metadata is derived from actual bytes.
 */
class SecureEvidenceController extends Controller
{
    use ResponseTrait;

    private AuthenticatedActorService $actorService;
    private EvidenceFileSecurityService $fileSecurity;
    private SupabaseStorageService $storage;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?EvidenceFileSecurityService $fileSecurity = null,
        ?SupabaseStorageService $storage = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->fileSecurity = $fileSecurity ?? new EvidenceFileSecurityService();
        $this->storage = $storage ?? new SupabaseStorageService();
    }

    public function options(): mixed
    {
        return $this->respond(null, 204);
    }

    public function uploadStudent(string $portfolioId): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->failSecure('UNAUTHORIZED', 'Authentication required.', 401);
        }
        if (($actor['profile']['account_type'] ?? '') !== 'student') {
            return $this->failSecure('FORBIDDEN', 'Only Students may upload Student Portfolio evidence.', 403);
        }
        if (! ValidationHelper::validateUuid($portfolioId)) {
            return $this->failSecure('INVALID_ID', 'Invalid Portfolio record identifier.', 422);
        }

        $db = db_connect();
        $record = $db->table('public.student_portfolio_records')
            ->where('id', $portfolioId)
            ->where('student_profile_id', $actor['profile']['id'])
            ->get()->getRowArray();

        if ($record === null) {
            return $this->failSecure('NOT_FOUND', 'Portfolio record not found.', 404);
        }
        if (! in_array($record['status'], ['draft', 'submitted', 'revision_requested'], true)) {
            return $this->failSecure('RECORD_LOCKED', 'Evidence cannot be changed in the current Portfolio state.', 422);
        }

        return $this->processUpload(
            actor: $actor,
            bucket: 'student-evidence',
            ownerId: $actor['profile']['id'],
            parentId: $portfolioId,
            table: 'public.student_portfolio_evidence',
            parentColumn: 'portfolio_record_id',
            evidenceType: trim((string) ($this->request->getPost('evidence_type') ?? 'certificate')) ?: 'certificate'
        );
    }

    public function uploadPersonnel(string $accomplishmentId): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->failSecure('UNAUTHORIZED', 'Authentication required.', 401);
        }
        if (($actor['profile']['account_type'] ?? '') !== 'personnel') {
            return $this->failSecure('FORBIDDEN', 'Only Personnel may upload Personnel evidence.', 403);
        }
        if (! ValidationHelper::validateUuid($accomplishmentId)) {
            return $this->failSecure('INVALID_ID', 'Invalid accomplishment identifier.', 422);
        }

        $db = db_connect();
        $record = $db->table('public.personnel_accomplishments')
            ->where('id', $accomplishmentId)
            ->where('personnel_profile_id', $actor['profile']['id'])
            ->whereIn('status', ['draft', 'rejected'])
            ->get()->getRowArray();

        if ($record === null) {
            return $this->failSecure('NOT_FOUND', 'Editable accomplishment not found.', 404);
        }

        return $this->processUpload(
            actor: $actor,
            bucket: 'personnel-evidence',
            ownerId: $actor['profile']['id'],
            parentId: $accomplishmentId,
            table: 'public.personnel_accomplishment_evidence',
            parentColumn: 'accomplishment_id',
            evidenceType: null
        );
    }

    public function studentDownload(string $evidenceId): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->failSecure('UNAUTHORIZED', 'Authentication required.', 401);
        }
        if (! ValidationHelper::validateUuid($evidenceId)) {
            return $this->failSecure('INVALID_ID', 'Invalid evidence identifier.', 422);
        }

        $db = db_connect();
        $evidence = $db->table('public.student_portfolio_evidence e')
            ->select('e.*, r.student_profile_id')
            ->join('public.student_portfolio_records r', 'r.id=e.portfolio_record_id')
            ->where('e.id', $evidenceId)
            ->where('e.status', 'active')
            ->get()->getRowArray();

        if ($evidence === null) {
            return $this->failSecure('NOT_FOUND', 'Evidence not found.', 404);
        }

        if (! $this->canReadStudentEvidence($actor, $evidence['student_profile_id'])) {
            return $this->failSecure('FORBIDDEN', 'You are not authorized to access this evidence.', 403);
        }

        return $this->signedDownload('student-evidence', $evidence);
    }

    public function personnelDownload(string $evidenceId): mixed
    {
        $actor = $this->actor();
        if ($actor === null) {
            return $this->failSecure('UNAUTHORIZED', 'Authentication required.', 401);
        }
        if (! ValidationHelper::validateUuid($evidenceId)) {
            return $this->failSecure('INVALID_ID', 'Invalid evidence identifier.', 422);
        }

        $db = db_connect();
        $evidence = $db->table('public.personnel_accomplishment_evidence e')
            ->select('e.*, a.personnel_profile_id')
            ->join('public.personnel_accomplishments a', 'a.id=e.accomplishment_id')
            ->where('e.id', $evidenceId)
            ->get()->getRowArray();

        if ($evidence === null) {
            return $this->failSecure('NOT_FOUND', 'Evidence not found.', 404);
        }

        if (! $this->canReadPersonnelEvidence($actor, $evidence['personnel_profile_id'])) {
            return $this->failSecure('FORBIDDEN', 'You are not authorized to access this evidence.', 403);
        }

        return $this->signedDownload('personnel-evidence', $evidence);
    }

    private function processUpload(
        array $actor,
        string $bucket,
        string $ownerId,
        string $parentId,
        string $table,
        string $parentColumn,
        ?string $evidenceType
    ): mixed {
        $file = $this->request->getFile('file');
        if ($file === null) {
            return $this->failSecure('FILE_REQUIRED', 'A multipart evidence file is required.', 422);
        }

        try {
            $security = $this->fileSecurity->inspectAndScan($file);
            $evidenceId = (string) service('uuid')->uuid4();
            $objectPath = $ownerId . '/' . $parentId . '/' . $evidenceId . '.' . $security['extension'];
            $bytes = file_get_contents($security['temp_path']);
            if (! is_string($bytes)) {
                throw new RuntimeException('Unable to read validated evidence bytes.');
            }

            $this->storage->uploadObject($bucket, $objectPath, $bytes, $security['mime_type']);

            $db = db_connect();
            $db->transBegin();
            try {
                $row = [
                    'id' => $evidenceId,
                    $parentColumn => $parentId,
                    'storage_path' => $objectPath,
                    'original_filename' => $security['original_filename'],
                    'mime_type' => $security['mime_type'],
                    'byte_size' => $security['byte_size'],
                    'checksum' => $security['sha256'],
                    'uploaded_by' => $actor['profile']['id'],
                    'security_status' => 'clean',
                    'detected_mime_type' => $security['mime_type'],
                    'sha256' => $security['sha256'],
                    'malware_scanner' => $security['scanner'],
                    'security_validated_at' => date('Y-m-d H:i:s'),
                ];
                if ($evidenceType !== null) {
                    $row['evidence_type'] = $evidenceType;
                    $row['status'] = 'active';
                }

                $db->table($table)->insert($row);
                $db->table('public.file_security_audit_events')->insert([
                    'id' => (string) service('uuid')->uuid4(),
                    'actor_profile_id' => $actor['profile']['id'],
                    'evidence_domain' => $bucket === 'student-evidence' ? 'student_portfolio' : 'personnel_accomplishment',
                    'evidence_id' => $evidenceId,
                    'storage_bucket' => $bucket,
                    'storage_path' => $objectPath,
                    'detected_mime_type' => $security['mime_type'],
                    'byte_size' => $security['byte_size'],
                    'sha256' => $security['sha256'],
                    'scanner' => $security['scanner'],
                    'result' => 'clean',
                ]);

                if (! $db->transStatus()) {
                    throw new RuntimeException('Evidence metadata transaction failed.');
                }
                $db->transCommit();
            } catch (Throwable $e) {
                $db->transRollback();
                $this->storage->deleteObject($bucket, $objectPath);
                throw $e;
            }

            return $this->respondCreated(['data' => [
                'id' => $evidenceId,
                'original_filename' => $security['original_filename'],
                'mime_type' => $security['mime_type'],
                'byte_size' => $security['byte_size'],
                'sha256' => $security['sha256'],
                'security_status' => 'clean',
            ]]);
        } catch (RuntimeException $e) {
            log_message('warning', 'Secure evidence upload rejected: ' . $e->getMessage());
            return $this->failSecure('EVIDENCE_REJECTED', $e->getMessage(), 422);
        } catch (Throwable $e) {
            log_message('error', 'Secure evidence upload failed: ' . $e->getMessage());
            return $this->failSecure('UPLOAD_FAILED', 'Secure evidence upload could not be completed.', 500);
        }
    }

    private function signedDownload(string $bucket, array $evidence): mixed
    {
        if (($evidence['security_status'] ?? '') !== 'clean') {
            return $this->failSecure('EVIDENCE_NOT_CLEARED', 'Evidence has not passed security validation.', 423);
        }

        try {
            $url = $this->storage->createSignedUrl($bucket, (string) $evidence['storage_path'], 120);
            return $this->respond(['data' => [
                'url' => $url,
                'expires_in' => 120,
                'filename' => $evidence['original_filename'],
                'mime_type' => $evidence['detected_mime_type'] ?? $evidence['mime_type'],
            ]]);
        } catch (Throwable $e) {
            log_message('error', 'Signed evidence download failed: ' . $e->getMessage());
            return $this->failSecure('DOWNLOAD_FAILED', 'Unable to create secure evidence download.', 500);
        }
    }

    private function canReadStudentEvidence(array $actor, string $studentId): bool
    {
        $profile = $actor['profile'] ?? [];
        if (($profile['account_type'] ?? '') === 'student') {
            return ($profile['id'] ?? '') === $studentId;
        }
        if (($profile['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $actor['roles'] ?? [], true)) {
            return true;
        }
        if (($profile['account_type'] ?? '') !== 'personnel') {
            return false;
        }

        return db_connect()->table('public.student_program_enrollments e')
            ->join('public.program_coordinator_assignments a', 'a.academic_program_id=e.academic_program_id AND a.is_active=true')
            ->where('e.student_profile_id', $studentId)
            ->where('e.is_active', true)
            ->where('a.personnel_profile_id', $profile['id'])
            ->countAllResults() > 0;
    }

    private function canReadPersonnelEvidence(array $actor, string $personnelId): bool
    {
        $profile = $actor['profile'] ?? [];
        if (($profile['account_type'] ?? '') === 'personnel' && ($profile['id'] ?? '') === $personnelId) {
            return true;
        }
        if (($profile['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $actor['roles'] ?? [], true)) {
            return true;
        }
        if (($profile['account_type'] ?? '') !== 'personnel') {
            return false;
        }

        return db_connect()->table('public.personnel_college_affiliations pca')
            ->join('public.dean_assignments da', 'da.college_id=pca.college_id AND da.is_active=true')
            ->where('pca.personnel_profile_id', $personnelId)
            ->where('pca.is_active', true)
            ->where('da.personnel_profile_id', $profile['id'])
            ->countAllResults() > 0;
    }

    private function actor(): ?array
    {
        return $this->actorService->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function failSecure(string $code, string $message, int $status): mixed
    {
        return $this->respond(['error' => ['code' => $code, 'message' => $message]], $status);
    }
}
