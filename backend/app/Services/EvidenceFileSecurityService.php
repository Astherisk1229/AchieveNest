<?php

namespace App\Services;

use CodeIgniter\HTTP\Files\UploadedFile;
use RuntimeException;

/**
 * Validates the actual evidence bytes before permanent Storage upload.
 */
class EvidenceFileSecurityService
{
    private const MAX_BYTES = 20 * 1024 * 1024;

    /** @var array<string,string> */
    private const MIME_TO_EXTENSION = [
        'application/pdf' => 'pdf',
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    /**
     * Production HTTP entry point. Synthetic/local files do not pass this gate.
     *
     * @return array{
     *   temp_path:string,original_filename:string,mime_type:string,extension:string,
     *   byte_size:int,sha256:string,scanner:string,scan_status:string
     * }
     */
    public function inspectAndScan(UploadedFile $file): array
    {
        if (! $file->isValid() || $file->hasMoved()) {
            throw new RuntimeException('The uploaded evidence file is invalid or unavailable.');
        }

        $tempPath = $file->getTempName();
        if ($tempPath === '' || ! is_file($tempPath) || ! is_readable($tempPath)) {
            throw new RuntimeException('Unable to read the uploaded evidence file.');
        }

        return $this->inspectPath($tempPath, (string) $file->getClientName());
    }

    /**
     * Core byte-inspection pipeline. Kept protected so tests can exercise the
     * actual validation logic without weakening the HTTP upload gate above.
     *
     * @return array{
     *   temp_path:string,original_filename:string,mime_type:string,extension:string,
     *   byte_size:int,sha256:string,scanner:string,scan_status:string
     * }
     */
    protected function inspectPath(string $tempPath, string $clientName): array
    {
        if ($tempPath === '' || ! is_file($tempPath) || ! is_readable($tempPath)) {
            throw new RuntimeException('Unable to read the uploaded evidence file.');
        }

        $size = filesize($tempPath);
        if ($size === false || $size < 1 || $size > self::MAX_BYTES) {
            throw new RuntimeException('Evidence file must be between 1 byte and 20 MB.');
        }

        $finfo = new \finfo(FILEINFO_MIME_TYPE);
        $detectedMime = strtolower(trim((string) $finfo->file($tempPath)));
        if (! isset(self::MIME_TO_EXTENSION[$detectedMime])) {
            throw new RuntimeException('Unsupported evidence file type. Only PDF, JPEG, PNG, and WebP are allowed.');
        }

        $this->assertMagicBytes($tempPath, $detectedMime);
        if ($detectedMime === 'application/pdf') {
            $this->assertSafePdfStructure($tempPath);
        }

        $sha256 = hash_file('sha256', $tempPath);
        if (! is_string($sha256) || strlen($sha256) !== 64) {
            throw new RuntimeException('Unable to calculate evidence file checksum.');
        }

        [$scanner, $scanStatus] = $this->runMalwareScan($tempPath);

        $original = basename(trim($clientName));
        $original = preg_replace('/[^A-Za-z0-9._ ()-]/', '_', $original) ?: 'evidence.' . self::MIME_TO_EXTENSION[$detectedMime];
        if (strlen($original) > 255) {
            $original = substr($original, 0, 240) . '.' . self::MIME_TO_EXTENSION[$detectedMime];
        }

        return [
            'temp_path' => $tempPath,
            'original_filename' => $original,
            'mime_type' => $detectedMime,
            'extension' => self::MIME_TO_EXTENSION[$detectedMime],
            'byte_size' => (int) $size,
            'sha256' => $sha256,
            'scanner' => $scanner,
            'scan_status' => $scanStatus,
        ];
    }

    private function assertMagicBytes(string $path, string $mime): void
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new RuntimeException('Unable to inspect evidence file signature.');
        }
        $head = fread($handle, 16);
        fclose($handle);
        if (! is_string($head)) {
            throw new RuntimeException('Unable to inspect evidence file signature.');
        }

        $valid = match ($mime) {
            'application/pdf' => str_starts_with($head, '%PDF-'),
            'image/jpeg' => strlen($head) >= 3 && substr($head, 0, 3) === "\xFF\xD8\xFF",
            'image/png' => str_starts_with($head, "\x89PNG\r\n\x1A\n"),
            'image/webp' => strlen($head) >= 12 && substr($head, 0, 4) === 'RIFF' && substr($head, 8, 4) === 'WEBP',
            default => false,
        };

        if (! $valid) {
            throw new RuntimeException('File signature does not match the detected evidence type.');
        }
    }

    /**
     * Conservative PDF hardening: reject active-content features that are not
     * needed for certificates/portfolio evidence.
     */
    private function assertSafePdfStructure(string $path): void
    {
        $bytes = file_get_contents($path);
        if (! is_string($bytes)) {
            throw new RuntimeException('Unable to inspect PDF evidence content.');
        }

        $forbidden = [
            '/JavaScript', '/JS', '/OpenAction', '/AA', '/Launch', '/EmbeddedFile',
            '/RichMedia', '/SubmitForm', '/ImportData', '/XFA',
        ];

        foreach ($forbidden as $token) {
            if (stripos($bytes, $token) !== false) {
                throw new RuntimeException('PDF evidence contains unsupported active or embedded content.');
            }
        }
    }

    /**
     * Fail-closed malware scanning.
     *
     * Configure EVIDENCE_MALWARE_SCANNER_PATH to clamdscan or clamscan.
     * EVIDENCE_MALWARE_SCAN_REQUIRED defaults to true.
     *
     * @return array{0:string,1:string}
     */
    private function runMalwareScan(string $path): array
    {
        $requiredRaw = strtolower(trim((string) (env('EVIDENCE_MALWARE_SCAN_REQUIRED', 'true') ?: 'true')));
        $required = ! in_array($requiredRaw, ['0', 'false', 'no', 'off'], true);
        $scannerPath = trim((string) (env('EVIDENCE_MALWARE_SCANNER_PATH', '') ?: getenv('EVIDENCE_MALWARE_SCANNER_PATH')));

        if ($scannerPath === '') {
            if ($required) {
                throw new RuntimeException('Secure evidence upload is unavailable because the malware scanner is not configured.');
            }
            return ['disabled-by-explicit-config', 'not_required'];
        }

        if (! is_file($scannerPath) || ! is_executable($scannerPath)) {
            throw new RuntimeException('Configured malware scanner executable is unavailable.');
        }

        $scannerName = strtolower(basename($scannerPath));
        $command = [$scannerPath, '--no-summary'];
        if (str_contains($scannerName, 'clamdscan')) {
            $command[] = '--fdpass';
        }
        $command[] = $path;

        $descriptors = [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ];
        $process = proc_open($command, $descriptors, $pipes, null, null, ['bypass_shell' => true]);
        if (! is_resource($process)) {
            throw new RuntimeException('Unable to start malware scanner.');
        }

        fclose($pipes[0]);
        stream_set_blocking($pipes[1], false);
        stream_set_blocking($pipes[2], false);

        $deadline = microtime(true) + 20.0;
        $stdout = '';
        $stderr = '';
        $exitCode = null;

        while (microtime(true) < $deadline) {
            $stdout .= stream_get_contents($pipes[1]) ?: '';
            $stderr .= stream_get_contents($pipes[2]) ?: '';
            $status = proc_get_status($process);
            if (! $status['running']) {
                $exitCode = (int) $status['exitcode'];
                break;
            }
            usleep(100000);
        }

        if ($exitCode === null) {
            proc_terminate($process, 9);
        }
        $stdout .= stream_get_contents($pipes[1]) ?: '';
        $stderr .= stream_get_contents($pipes[2]) ?: '';
        fclose($pipes[1]);
        fclose($pipes[2]);
        $closeCode = proc_close($process);
        if ($exitCode === null && is_int($closeCode) && $closeCode >= 0) {
            $exitCode = $closeCode;
        }

        if ($exitCode === 0) {
            return [$scannerName, 'clean'];
        }
        if ($exitCode === 1) {
            log_message('warning', 'Malware scanner rejected evidence upload: ' . trim($stdout . ' ' . $stderr));
            throw new RuntimeException('Evidence file failed malware screening.');
        }

        throw new RuntimeException('Malware screening could not be completed safely.');
    }
}
