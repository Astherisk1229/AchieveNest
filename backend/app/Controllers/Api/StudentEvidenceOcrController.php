<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use App\Services\StudentEvidencePaddleOcrService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use CodeIgniter\Database\BaseConnection;

final class StudentEvidenceOcrController extends Controller
{
    use ResponseTrait;

    public function __construct(
        private ?AuthorizationService $authorization = null,
        private ?LocalEvidenceStorageService $storage = null,
        private ?StudentEvidencePaddleOcrService $ocr = null,
        private ?BaseConnection $database = null,
    ) {
    }

    public function options(): mixed { return $this->respond(null, 204); }
    public function extract(string $evidenceId): mixed
    {
        $actor = ($this->authorization ??= new AuthorizationService())->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED']], 401);
        if (($actor['profile']['account_type'] ?? '') !== 'student') return $this->respond(['error' => ['code' => 'FORBIDDEN']], 403);
        $db = $this->database ??= db_connect();
        $row = $db->table('achievement_evidence e')
            ->select('e.storage_path,e.original_filename,e.detected_mime_type,e.mime_type,e.byte_size')
            ->join('achievement_version_evidence ave', 'ave.evidence_id = e.id')
            ->join('achievement_record_versions arv', 'arv.id = ave.record_version_id')
            ->join('achievement_records ar', 'ar.id = arv.achievement_record_id')
            ->where('e.id', $evidenceId)
            ->where('ar.current_version_id', 'arv.id', false)
            ->where('ar.owner_domain', 'STUDENT')
            ->where('ar.owner_profile_id', $actor['profile']['id'])
            ->where('e.uploaded_by', $actor['profile']['id'])
            ->where('e.status', 'active')
            ->where('e.security_status', 'clean')
            ->whereIn('arv.submission_state', ['draft', 'revision_requested'])
            ->get()->getRowArray();
        if ($row === null) return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND']], 404);
        $storage = $this->storage ??= new LocalEvidenceStorageService();
        $path = $storage->resolveAbsolutePath((string) $row['storage_path']);
        if ($path === null) return $this->respond(['error' => ['code' => 'EVIDENCE_FILE_MISSING']], 410);
        $validation = $storage->validateFile($path, (string) $row['original_filename']);
        if (! ($validation['success'] ?? false)) return $this->respond(['error' => ['code' => $validation['error_code']]], 422);
        try { return $this->respond(['data' => ['ocr' => ($this->ocr ??= new StudentEvidencePaddleOcrService())->extract($path, (string) $validation['detected_mime'])]]); }
        catch (\Throwable $e) { log_message('error', 'Student OCR error: {code}', ['code' => $e->getMessage()]); return $this->respond(['error' => ['code' => $e->getMessage(), 'message' => 'OCR assistance was unavailable. You can continue with manual entry.']], 422); }
    }
}
