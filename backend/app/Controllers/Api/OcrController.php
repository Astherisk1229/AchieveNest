<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use App\Services\OcrExtractionService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

final class OcrController extends Controller
{
    use ResponseTrait;

    public function options(): mixed { return $this->respond(null, 204); }

    public function extract(): mixed
    {
        $actor = (new AuthorizationService())->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        if (($actor['profile']['account_type'] ?? '') !== 'personnel') return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Personnel account required.']], 403);

        $file = $this->request->getFile('document');
        if ($file === null || ! $file->isValid()) return $this->respond(['error' => ['code' => 'INVALID_UPLOAD', 'message' => 'Select a readable PDF, JPEG, or PNG document.']], 422);
        $storage = new LocalEvidenceStorageService();
        $validation = $storage->validateFile($file->getTempName(), $file->getClientName());
        if (! ($validation['success'] ?? false)) return $this->respond(['error' => ['code' => $validation['error_code'], 'message' => $validation['error_message']]], 422);
        if (! in_array($validation['extension'], ['pdf', 'jpg', 'jpeg', 'png'], true)) return $this->respond(['error' => ['code' => 'OCR_TYPE_UNSUPPORTED', 'message' => 'OCR supports PDF, JPEG, and PNG files.']], 422);

        try {
            $result = (new OcrExtractionService())->extract($file->getTempName(), $validation['detected_mime']);
            return $this->respond(['data' => ['document' => $result]], 200);
        } catch (\Throwable $error) {
            log_message('error', 'OCR extraction failed: {message}', ['message' => $error->getMessage()]);
            return $this->respond(['error' => ['code' => 'OCR_EXTRACTION_FAILED', 'message' => 'OCR could not reliably read this document. You can continue with manual entry.']], 422);
        }
    }

    public function extractEvidence(string $evidenceId): mixed
    {
        $actor = (new AuthorizationService())->resolveActor($this->request->getHeaderLine('Authorization'));
        if ($actor === null) return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        if (($actor['profile']['account_type'] ?? '') !== 'personnel') return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Personnel account required.']], 403);

        $db = db_connect();
        $evidence = $db->table('personnel_accomplishment_evidence e')
            ->select('e.storage_path, e.detected_mime_type, e.mime_type')
            ->join('personnel_accomplishments a', 'a.id = e.accomplishment_id')
            ->where('e.id', $evidenceId)
            ->where('a.personnel_profile_id', $actor['profile']['id'])
            ->get()->getRowArray();
        if ($evidence === null) return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Persisted evidence was not found for this account.']], 404);

        $storage = new LocalEvidenceStorageService();
        $path = $storage->resolveAbsolutePath((string) $evidence['storage_path']);
        if ($path === null) return $this->respond(['error' => ['code' => 'EVIDENCE_FILE_MISSING', 'message' => 'The persisted evidence file is unavailable. Upload it again.']], 410);
        try {
            $mime = (string) ($evidence['detected_mime_type'] ?: $evidence['mime_type']);
            return $this->respond(['data' => ['document' => (new OcrExtractionService())->extract($path, $mime)]], 200);
        } catch (\Throwable $error) {
            log_message('error', 'Persisted evidence OCR failed: {message}', ['message' => $error->getMessage()]);
            return $this->respond(['error' => ['code' => 'OCR_EXTRACTION_FAILED', 'message' => 'OCR could not reliably read this persisted document. Continue with manual classification or retry.']], 422);
        }
    }
}
