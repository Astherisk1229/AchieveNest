<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;

class EvidenceController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected LocalEvidenceStorageService $storage;

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

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * GET /api/v1/evidence/student/{id}
     * Returns safe metadata for student evidence.
     */
    public function studentMetadata(string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $evidence = $db->table('student_portfolio_evidence spe')
            ->select(['spe.*', 'spr.student_profile_id'])
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id')
            ->where('spe.id', $evidenceId)
            ->get()->getRowArray();

        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Evidence record not found.']], 404);
        }

        if (! $this->authz->evidence()->canReadStudentEvidence($actor, $evidence)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to this student evidence.']], 403);
        }

        return $this->respond([
            'data' => [
                'evidence' => $this->storage->formatSafeEvidence($evidence, 'student'),
            ],
        ], 200);
    }

    /**
     * GET /api/v1/evidence/student/{id}/download
     * Authenticated file streaming with security headers.
     */
    public function studentDownload(string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $evidence = $db->table('student_portfolio_evidence spe')
            ->select(['spe.*', 'spr.student_profile_id'])
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id')
            ->where('spe.id', $evidenceId)
            ->get()->getRowArray();

        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Evidence record not found.']], 404);
        }

        if (! $this->authz->evidence()->canReadStudentEvidence($actor, $evidence)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to this student evidence.']], 403);
        }

        $absPath = $this->storage->resolveAbsolutePath($evidence['storage_path']);
        if ($absPath === null || ! file_exists($absPath)) {
            return $this->respond(['error' => ['code' => 'FILE_NOT_FOUND', 'message' => 'Evidence physical file not found on server storage.']], 404);
        }

        $mimeType = $evidence['detected_mime_type'] ?: ($evidence['mime_type'] ?: 'application/octet-stream');
        $safeFilename = basename($evidence['original_filename'] ?: 'evidence.pdf');
        $safeFilename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $safeFilename);

        $fileContent = file_get_contents($absPath);
        if ($fileContent === false) {
            return $this->respond(['error' => ['code' => 'STREAM_ERROR', 'message' => 'Could not read evidence file content.']], 500);
        }

        return $this->response
            ->setHeader('Content-Type', $mimeType)
            ->setHeader('Content-Length', (string) filesize($absPath))
            ->setHeader('X-Content-Type-Options', 'nosniff')
            ->setHeader('Content-Disposition', sprintf('inline; filename="%s"', $safeFilename))
            ->setHeader('Cache-Control', 'private, no-store, must-revalidate')
            ->setBody($fileContent);
    }

    /**
     * GET /api/v1/evidence/personnel/{id}
     * Returns safe metadata for personnel evidence.
     */
    public function personnelMetadata(string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $evidence = $db->table('personnel_accomplishment_evidence pae')
            ->select(['pae.*', 'pa.personnel_profile_id'])
            ->join('personnel_accomplishments pa', 'pa.id = pae.accomplishment_id')
            ->where('pae.id', $evidenceId)
            ->get()->getRowArray();

        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Personnel evidence record not found.']], 404);
        }

        if (! $this->authz->evidence()->canReadPersonnelEvidence($actor, $evidence)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to this personnel evidence.']], 403);
        }

        return $this->respond([
            'data' => [
                'evidence' => $this->storage->formatSafeEvidence($evidence, 'personnel'),
            ],
        ], 200);
    }

    /**
     * GET /api/v1/evidence/personnel/{id}/download
     * Authenticated file streaming with security headers.
     */
    public function personnelDownload(string $evidenceId): mixed
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = db_connect();
        $evidence = $db->table('personnel_accomplishment_evidence pae')
            ->select(['pae.*', 'pa.personnel_profile_id'])
            ->join('personnel_accomplishments pa', 'pa.id = pae.accomplishment_id')
            ->where('pae.id', $evidenceId)
            ->get()->getRowArray();

        if ($evidence === null) {
            return $this->respond(['error' => ['code' => 'EVIDENCE_NOT_FOUND', 'message' => 'Personnel evidence record not found.']], 404);
        }

        if (! $this->authz->evidence()->canReadPersonnelEvidence($actor, $evidence)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Access denied to this personnel evidence.']], 403);
        }

        $absPath = $this->storage->resolveAbsolutePath($evidence['storage_path']);
        if ($absPath === null || ! file_exists($absPath)) {
            return $this->respond(['error' => ['code' => 'FILE_NOT_FOUND', 'message' => 'Evidence physical file not found on server storage.']], 404);
        }

        $mimeType = $evidence['detected_mime_type'] ?: ($evidence['mime_type'] ?: 'application/octet-stream');
        $safeFilename = basename($evidence['original_filename'] ?: 'accomplishment_evidence.pdf');
        $safeFilename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $safeFilename);

        $fileContent = file_get_contents($absPath);
        if ($fileContent === false) {
            return $this->respond(['error' => ['code' => 'STREAM_ERROR', 'message' => 'Could not read evidence file content.']], 500);
        }

        return $this->response
            ->setHeader('Content-Type', $mimeType)
            ->setHeader('Content-Length', (string) filesize($absPath))
            ->setHeader('X-Content-Type-Options', 'nosniff')
            ->setHeader('Content-Disposition', sprintf('inline; filename="%s"', $safeFilename))
            ->setHeader('Cache-Control', 'private, no-store, must-revalidate')
            ->setBody($fileContent);
    }
}
