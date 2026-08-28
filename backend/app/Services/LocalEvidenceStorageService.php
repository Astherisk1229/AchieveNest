<?php

namespace App\Services;

use CodeIgniter\HTTP\Files\UploadedFile;
use RuntimeException;
use Throwable;

class LocalEvidenceStorageService
{
    public const DEFAULT_MAX_BYTES = 10485760; // 10 MiB

    public const ALLOWED_EXTENSIONS_MAP = [
        'pdf'  => ['application/pdf'],
        'jpg'  => ['image/jpeg'],
        'jpeg' => ['image/jpeg'],
        'png'  => ['image/png'],
    ];

    public const DANGEROUS_EXTENSIONS = [
        'php', 'phar', 'phtml', 'html', 'htm', 'js', 'exe', 'dll', 'bat', 'cmd', 'com', 'msi', 'sh', 'ps1', 'jar', 'svg', 'py', 'vbs', 'scr', 'bin'
    ];

    protected string $storageRoot;
    protected int $maxBytes;

    public function __construct(?string $storageRoot = null, int $maxBytes = self::DEFAULT_MAX_BYTES)
    {
        $this->storageRoot = $storageRoot ?? (defined('WRITEPATH') ? WRITEPATH . 'uploads/evidence/' : dirname(__DIR__, 2) . '/writable/uploads/evidence/');
        $this->maxBytes = $maxBytes;

        $this->ensureDirectories();
    }

    public function getStorageRoot(): string
    {
        return $this->storageRoot;
    }

    public function ensureDirectories(): void
    {
        $dirs = [
            $this->storageRoot,
            $this->storageRoot . 'student',
            $this->storageRoot . 'personnel',
            $this->storageRoot . 'quarantine',
            $this->storageRoot . 'tmp',
        ];

        foreach ($dirs as $d) {
            if (! is_dir($d)) {
                @mkdir($d, 0755, true);
            }
        }
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
     * Server-side MIME detection using finfo_file / finfo_open.
     */
    public function detectMimeType(string $filePath): ?string
    {
        if (! file_exists($filePath)) {
            return null;
        }

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo !== false) {
                $mime = finfo_file($finfo, $filePath);
                finfo_close($finfo);
                if ($mime && is_string($mime)) {
                    return strtolower(trim($mime));
                }
            }
        }

        if (function_exists('mime_content_type')) {
            $mime = mime_content_type($filePath);
            if ($mime && is_string($mime)) {
                return strtolower(trim($mime));
            }
        }

        return null;
    }

    /**
     * Normalizes and validates client-supplied filename extension.
     */
    public function extractExtension(string $filename): string
    {
        $filename = str_replace(["\0", "\\", "/"], '', $filename);
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return ltrim($ext, '.');
    }

    /**
     * Validates file size, extension, server-detected MIME type, and dangerous signatures.
     *
     * @param string $tempFilePath Actual path to the temporary or stored file
     * @param string $clientFilename Original filename sent by client
     * @return array [success => bool, error_code => string, error_message => string, detected_mime => string, extension => string, byte_size => int]
     */
    public function validateFile(string $tempFilePath, string $clientFilename): array
    {
        if (! file_exists($tempFilePath)) {
            return [
                'success'       => false,
                'error_code'    => 'FILE_NOT_FOUND',
                'error_message' => 'Uploaded temporary file does not exist on server.',
            ];
        }

        $size = filesize($tempFilePath);
        if ($size === false || $size <= 0) {
            return [
                'success'       => false,
                'error_code'    => 'EMPTY_FILE',
                'error_message' => 'Zero-byte or empty files are not permitted.',
            ];
        }

        if ($size > $this->maxBytes) {
            return [
                'success'       => false,
                'error_code'    => 'FILE_TOO_LARGE',
                'error_message' => sprintf('File size exceeds maximum allowed limit of %d bytes.', $this->maxBytes),
            ];
        }

        $ext = $this->extractExtension($clientFilename);
        if ($ext === '' || in_array($ext, self::DANGEROUS_EXTENSIONS, true)) {
            return [
                'success'       => false,
                'error_code'    => 'UNSUPPORTED_FILE_TYPE',
                'error_message' => 'Unsupported or restricted file extension.',
            ];
        }

        if (! array_key_exists($ext, self::ALLOWED_EXTENSIONS_MAP)) {
            return [
                'success'       => false,
                'error_code'    => 'UNSUPPORTED_FILE_TYPE',
                'error_message' => 'Only PDF, JPEG, and PNG files are permitted.',
            ];
        }

        $detectedMime = $this->detectMimeType($tempFilePath);
        if ($detectedMime === null) {
            return [
                'success'       => false,
                'error_code'    => 'MIME_DETECTION_FAILED',
                'error_message' => 'Could not detect authoritative server-side MIME type.',
            ];
        }

        $allowedMimes = self::ALLOWED_EXTENSIONS_MAP[$ext];
        if (! in_array($detectedMime, $allowedMimes, true)) {
            return [
                'success'       => false,
                'error_code'    => 'MIME_EXTENSION_MISMATCH',
                'error_message' => sprintf('File content (%s) does not match the file extension (.%s).', $detectedMime, $ext),
            ];
        }

        return [
            'success'       => true,
            'extension'     => $ext,
            'detected_mime' => $detectedMime,
            'byte_size'     => $size,
        ];
    }

    /**
     * Stores a validated file into the protected storage root.
     *
     * @param string $sourceFilePath Absolute path to temp or source file
     * @param string $domain 'student' or 'personnel'
     * @param string $ownerUuid User profile UUID
     * @param string $recordUuid Record or accomplishment UUID
     * @param string $extension Normalized extension (e.g. 'pdf')
     * @param bool $isUploadedFile If true, uses move_uploaded_file / copy
     * @return array [stored_filename, storage_path, absolute_path, sha256, byte_size, detected_mime_type]
     */
    public function storeFile(
        string $sourceFilePath,
        string $domain,
        string $ownerUuid,
        string $recordUuid,
        string $extension,
        bool $isUploadedFile = false
    ): array {
        // Sanitize path segments (only alphanumeric and dash)
        $domain = preg_replace('/[^a-z0-9_-]/i', '', strtolower($domain));
        $ownerUuid = preg_replace('/[^a-z0-9-]/i', '', strtolower($ownerUuid));
        $recordUuid = preg_replace('/[^a-z0-9-]/i', '', strtolower($recordUuid));
        $extension = preg_replace('/[^a-z0-9]/i', '', strtolower($extension));

        $storedFilename = $this->genUuid() . '.' . $extension;
        $relativeStoragePath = sprintf('%s/%s/%s/%s', $domain, $ownerUuid, $recordUuid, $storedFilename);
        $targetDirectory = rtrim($this->storageRoot, '/\\') . DIRECTORY_SEPARATOR . sprintf('%s/%s/%s', $domain, $ownerUuid, $recordUuid);

        if (! is_dir($targetDirectory)) {
            if (! @mkdir($targetDirectory, 0755, true) && ! is_dir($targetDirectory)) {
                throw new RuntimeException('Failed to create target storage directory.');
            }
        }

        $absoluteTargetPath = $targetDirectory . DIRECTORY_SEPARATOR . $storedFilename;

        if ($isUploadedFile && is_uploaded_file($sourceFilePath)) {
            if (! @move_uploaded_file($sourceFilePath, $absoluteTargetPath)) {
                throw new RuntimeException('Failed to move uploaded file to protected storage.');
            }
        } else {
            if (! @copy($sourceFilePath, $absoluteTargetPath)) {
                throw new RuntimeException('Failed to copy file to protected storage.');
            }
        }

        $sha256 = hash_file('sha256', $absoluteTargetPath);
        $size = filesize($absoluteTargetPath);
        $detectedMime = $this->detectMimeType($absoluteTargetPath);

        return [
            'stored_filename'    => $storedFilename,
            'storage_path'       => str_replace('\\', '/', $relativeStoragePath),
            'absolute_path'      => $absoluteTargetPath,
            'sha256'             => strtolower((string) $sha256),
            'byte_size'          => (int) $size,
            'detected_mime_type' => (string) $detectedMime,
        ];
    }

    /**
     * Resolves the canonical absolute path of a stored evidence file while guaranteeing containment.
     */
    public function resolveAbsolutePath(string $relativeStoragePath): ?string
    {
        if (str_contains($relativeStoragePath, '..') || str_contains($relativeStoragePath, "\0")) {
            return null;
        }

        $fullPath = rtrim($this->storageRoot, '/\\') . DIRECTORY_SEPARATOR . ltrim($relativeStoragePath, '/\\');
        $realRoot = realpath($this->storageRoot);
        $realPath = realpath($fullPath);

        if ($realPath === false || $realRoot === false) {
            return null;
        }

        // Must be contained under root
        if (! str_starts_with(str_replace('\\', '/', $realPath), str_replace('\\', '/', $realRoot))) {
            return null;
        }

        return $realPath;
    }

    /**
     * Safely deletes a physical stored file.
     */
    public function deletePhysicalFile(string $relativeStoragePath): bool
    {
        $abs = $this->resolveAbsolutePath($relativeStoragePath);
        if ($abs !== null && file_exists($abs)) {
            return @unlink($abs);
        }
        return false;
    }

    /**
     * Formats safe evidence response for frontend API output (no physical path leakage).
     */
    public function formatSafeEvidence(array $evidence, string $domain = 'student'): array
    {
        $id = $evidence['id'] ?? '';
        return [
            'id'                => $id,
            'portfolio_record_id' => $evidence['portfolio_record_id'] ?? null,
            'accomplishment_id' => $evidence['accomplishment_id'] ?? null,
            'original_filename' => $evidence['original_filename'] ?? '',
            'mime_type'         => $evidence['detected_mime_type'] ?? $evidence['mime_type'] ?? 'application/octet-stream',
            'detected_mime_type'=> $evidence['detected_mime_type'] ?? $evidence['mime_type'] ?? 'application/octet-stream',
            'byte_size'         => (int) ($evidence['byte_size'] ?? 0),
            'sha256'            => $evidence['sha256'] ?? $evidence['checksum'] ?? '',
            'evidence_type'     => $evidence['evidence_type'] ?? 'certificate',
            'security_status'   => $evidence['security_status'] ?? 'pending',
            'status'            => $evidence['status'] ?? 'active',
            'uploaded_at'       => $evidence['uploaded_at'] ?? '',
            'download_endpoint' => sprintf('/api/v1/evidence/%s/%s/download', $domain, $id),
        ];
    }
}
