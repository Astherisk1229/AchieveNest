<?php

namespace App\Services;

use App\Services\AuthorizationService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\Files\UploadedFile;
use RuntimeException;
use Throwable;

/**
 * PersonnelEvidenceUploadService
 *
 * Plan I — Phase I1: Secure Upload Pipeline.
 * Canonical backend authority for validating, storing, hashing, linking,
 * and maintaining upload atomicity for Personnel portfolio evidence documents.
 */
class PersonnelEvidenceUploadService
{
    public const DEFAULT_MAX_BYTES = 10485760; // 10 MiB

    public const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

    public const ALLOWED_MIME_MAP = [
        'pdf'  => ['application/pdf'],
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
    ];

    protected AuthorizationService $authz;
    protected LocalEvidenceStorageService $storage;
    protected BaseConnection $db;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?LocalEvidenceStorageService $storage = null,
        ?BaseConnection $db = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->storage = $storage ?? new LocalEvidenceStorageService();
        $this->db = $db ?? db_connect();
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

    /**
     * Sanitizes original client filename to remove path traversal and control characters.
     */
    public function sanitizeOriginalFilename(?string $filename): string
    {
        if ($filename === null || trim($filename) === '') {
            return 'supporting_evidence.pdf';
        }

        // Strip path traversal prefixes (both slash directions)
        $clean = basename(str_replace(["\0", "\\"], '/', $filename));
        // Replace non-safe characters with underscore
        $clean = preg_replace('/[^a-zA-Z0-9._-]/', '_', $clean);
        // Collapse consecutive dots
        $clean = preg_replace('/\.{2,}/', '.', $clean);

        return $clean ?: 'supporting_evidence.pdf';
    }

    /**
     * Validates that the accomplishment exists and belongs to the authenticated actor.
     *
     * @return array [success => bool, code => string, message => string, accomplishment => ?array]
     */
    public function validateOwnership(array $actor, string $accomplishmentId): array
    {
        $accomplishment = $this->db->table('personnel_accomplishments')
            ->where('id', $accomplishmentId)
            ->get()->getRowArray();

        if ($accomplishment === null) {
            return [
                'success' => false,
                'code'    => 'NOT_FOUND',
                'status'  => 404,
                'message' => 'Target accomplishment not found.',
                'accomplishment' => null,
            ];
        }

        $ownerProfileId = $accomplishment['personnel_profile_id'] ?? '';
        $actorProfileId = $actor['profile']['id'] ?? '';

        if (! $this->authz->evidence()->canUploadPersonnelEvidence($actor, $accomplishment)) {
            return [
                'success' => false,
                'code'    => 'FORBIDDEN',
                'status'  => 403,
                'message' => 'You are not authorized to upload evidence for this accomplishment (Owner mismatch or unauthorized role).',
                'accomplishment' => null,
            ];
        }

        return [
            'success' => true,
            'code'    => 'OK',
            'status'  => 200,
            'message' => 'Ownership verified.',
            'accomplishment' => $accomplishment,
        ];
    }

    /**
     * Validates file size, extension, and server-detected MIME type.
     *
     * @return array [success => bool, code => string, status => int, message => string, extension => string, detected_mime => string, byte_size => int]
     */
    public function validateFileDetails(string $tempFilePath, string $clientFilename): array
    {
        if (! file_exists($tempFilePath)) {
            return [
                'success' => false,
                'code'    => 'FILE_NOT_FOUND',
                'status'  => 400,
                'message' => 'Uploaded temporary file does not exist on server.',
            ];
        }

        $size = filesize($tempFilePath);
        if ($size === false || $size <= 0) {
            return [
                'success' => false,
                'code'    => 'EMPTY_FILE',
                'status'  => 422,
                'message' => 'Zero-byte or empty files are not permitted.',
            ];
        }

        if ($size > self::DEFAULT_MAX_BYTES) {
            return [
                'success' => false,
                'code'    => 'FILE_TOO_LARGE',
                'status'  => 413,
                'message' => sprintf('File size (%d bytes) exceeds the maximum allowed limit of %d bytes (10 MiB).', $size, self::DEFAULT_MAX_BYTES),
            ];
        }

        $cleanFilename = $this->sanitizeOriginalFilename($clientFilename);
        $ext = strtolower(pathinfo($cleanFilename, PATHINFO_EXTENSION));

        if ($ext === '' || ! in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
            return [
                'success' => false,
                'code'    => 'UNSUPPORTED_FILE_TYPE',
                'status'  => 415,
                'message' => 'Only PDF, JPEG, and PNG files are permitted.',
            ];
        }

        $detectedMime = $this->storage->detectMimeType($tempFilePath);
        if ($detectedMime === null) {
            return [
                'success' => false,
                'code'    => 'MIME_DETECTION_FAILED',
                'status'  => 422,
                'message' => 'Could not detect authoritative server-side MIME type.',
            ];
        }

        $allowedMimes = self::ALLOWED_MIME_MAP[$ext] ?? [];
        if (! in_array($detectedMime, $allowedMimes, true)) {
            return [
                'success' => false,
                'code'    => 'MIME_EXTENSION_MISMATCH',
                'status'  => 422,
                'message' => sprintf('File content (%s) does not match the file extension (.%s).', $detectedMime, $ext),
            ];
        }

        return [
            'success'       => true,
            'code'          => 'OK',
            'status'        => 200,
            'message'       => 'File validation passed.',
            'extension'     => $ext,
            'detected_mime' => $detectedMime,
            'byte_size'     => (int) $size,
        ];
    }

    /**
     * Executes the complete, authoritative secure evidence upload pipeline.
     *
     * @param array $actor Authenticated actor resolving from token
     * @param string $accomplishmentId Target accomplishment UUID
     * @param mixed $uploadedFile Instance of UploadedFile or array containing temp_path, client_name
     * @return array [success => bool, status => int, data => ?array, error => ?array]
     */
    public function uploadEvidence(array $actor, string $accomplishmentId, mixed $uploadedFile): array
    {
        // 1. Ownership & Accomplishment Existence Check
        $ownership = $this->validateOwnership($actor, $accomplishmentId);
        if (! $ownership['success']) {
            return [
                'success' => false,
                'status'  => $ownership['status'],
                'error'   => [
                    'code'    => $ownership['code'],
                    'message' => $ownership['message'],
                ],
            ];
        }

        $accomplishment = $ownership['accomplishment'];
        $ownerProfileId = $accomplishment['personnel_profile_id'];

        // 2. Resolve File Path & Client Name
        $tempPath = '';
        $clientName = '';
        $isUploadedHttpFile = false;

        if ($uploadedFile instanceof UploadedFile) {
            if (! $uploadedFile->isValid()) {
                return [
                    'success' => false,
                    'status'  => 400,
                    'error'   => [
                        'code'    => 'FILE_REQUIRED',
                        'message' => 'A valid evidence file is required in multipart/form-data: ' . $uploadedFile->getErrorString(),
                    ],
                ];
            }
            $tempPath = $uploadedFile->getTempName();
            $clientName = $uploadedFile->getClientName();
            $isUploadedHttpFile = true;
        } elseif (is_array($uploadedFile)) {
            $tempPath = $uploadedFile['temp_path'] ?? $uploadedFile['tmp_name'] ?? '';
            $clientName = $uploadedFile['client_name'] ?? $uploadedFile['name'] ?? 'document.pdf';
            $isUploadedHttpFile = false;
        } elseif (is_object($uploadedFile) && method_exists($uploadedFile, 'getTempName')) {
            $tempPath = $uploadedFile->getTempName();
            $clientName = method_exists($uploadedFile, 'getClientName') ? $uploadedFile->getClientName() : 'document.pdf';
            $isUploadedHttpFile = true;
        }

        if ($tempPath === '' || ! file_exists($tempPath)) {
            return [
                'success' => false,
                'status'  => 400,
                'error'   => [
                    'code'    => 'FILE_REQUIRED',
                    'message' => 'A valid evidence file payload is required.',
                ],
            ];
        }

        // 3. Strict Server-Side Validation
        $fileVal = $this->validateFileDetails($tempPath, $clientName);
        if (! $fileVal['success']) {
            return [
                'success' => false,
                'status'  => $fileVal['status'],
                'error'   => [
                    'code'    => $fileVal['code'],
                    'message' => $fileVal['message'],
                ],
            ];
        }

        // 4. Store Real Physical File into Protected Root
        $stored = null;
        try {
            $stored = $this->storage->storeFile(
                $tempPath,
                'personnel',
                $ownerProfileId,
                $accomplishmentId,
                $fileVal['extension'],
                $isUploadedHttpFile
            );
        } catch (Throwable $e) {
            return [
                'success' => false,
                'status'  => 500,
                'error'   => [
                    'code'    => 'STORAGE_FAILED',
                    'message' => 'Failed to persist evidence bytes to protected storage: ' . $e->getMessage(),
                ],
            ];
        }

        // 5. Atomic Metadata Persistence with Rollback Cleanup
        $evidenceId = $this->genUuid();
        $now = date('Y-m-d H:i:s');
        $safeOriginalFilename = $this->sanitizeOriginalFilename($clientName);

        $evidenceRow = [
            'id'                 => $evidenceId,
            'accomplishment_id'  => $accomplishmentId,
            'storage_path'       => $stored['storage_path'],
            'original_filename'  => $safeOriginalFilename,
            'mime_type'          => $fileVal['detected_mime'],
            'detected_mime_type' => $fileVal['detected_mime'],
            'byte_size'          => $stored['byte_size'],
            'checksum'           => $stored['sha256'],
            'sha256'             => $stored['sha256'],
            'uploaded_by'        => $actor['profile']['id'] ?? $ownerProfileId,
            'uploaded_at'        => $now,
            'security_status'    => 'verified',
            'malware_scanner'    => 'none_deferred',
            'status'             => 'active',
        ];

        $this->db->transStart();
        try {
            $this->db->table('personnel_accomplishment_evidence')->insert($evidenceRow);
            $this->db->transComplete();
        } catch (Throwable $e) {
            $this->db->transRollback();
            $this->storage->deletePhysicalFile($stored['storage_path']);

            return [
                'success' => false,
                'status'  => 500,
                'error'   => [
                    'code'    => 'DATABASE_ERROR',
                    'message' => 'Failed to persist evidence metadata record to database.',
                ],
            ];
        }

        if ($this->db->transStatus() === false) {
            $this->storage->deletePhysicalFile($stored['storage_path']);

            return [
                'success' => false,
                'status'  => 500,
                'error'   => [
                    'code'    => 'DATABASE_ERROR',
                    'message' => 'Database transaction failed while recording evidence.',
                ],
            ];
        }

        // 6. Return Normalized Safe Response (No absolute server filesystem path leakage)
        return [
            'success' => true,
            'status'  => 201,
            'data'    => [
                'message'  => 'Evidence uploaded and secured successfully.',
                'evidence' => $this->storage->formatSafeEvidence($evidenceRow, 'personnel'),
            ],
        ];
    }
}
