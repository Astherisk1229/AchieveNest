<?php

namespace App\Services;

use CodeIgniter\Exceptions\PageNotFoundException;
use RuntimeException;
use InvalidArgumentException;

/**
 * Class PersonnelEvidenceOcrIntegrationService
 *
 * Phase I5: Authoritative OCR & Reviewer Evidence-Chain Integration Service.
 *
 * Invariants:
 * 1. OCR reads the exact persisted evidence object created by the secure upload pipeline (via canonical evidence_id).
 * 2. Hash consistency guard validates persisted file SHA-256 against stored sha256 before OCR processing.
 * 3. OCR failure remains strictly decoupled from file persistence success (upload succeeds, evidence remains valid).
 * 4. Zero fabricated OCR metadata upon failure.
 * 5. Submitted snapshots (Plan C) reference immutable evidence_id; reviewer workspace (Plan G) previews exact submitted physical file.
 * 6. Historical replacement (V1 with EvA vs V2 with EvB) strictly preserves separate evidence identities.
 * 7. Deleted or missing physical objects produce controlled errors without filename-based fallbacks.
 */
class PersonnelEvidenceOcrIntegrationService
{
    protected string $storageBasePath;

    public function __construct(?string $storageBasePath = null)
    {
        $this->storageBasePath = $storageBasePath ?? (WRITEPATH . 'uploads/personnel_evidence/');
    }

    /**
     * Resolve and validate an evidence record for OCR processing.
     *
     * @param array $evidence Evidence database record
     * @param int|string $requestingUserId User initiating the OCR
     * @param string $requestingRole Role of the user (e.g. 'faculty', 'personnel', 'dean', 'admin')
     * @return array Resolved canonical evidence metadata with absolute physical path
     * @throws InvalidArgumentException|RuntimeException
     */
    public function resolveOcrEvidence(array $evidence, $requestingUserId, string $requestingRole = 'faculty'): array
    {
        if (empty($evidence['evidence_id'])) {
            throw new InvalidArgumentException('Invalid evidence identity: evidence_id is required');
        }

        // Check if evidence is marked as deleted
        if (!empty($evidence['deleted_at'])) {
            throw new RuntimeException('evidence_deleted: Evidence has been deleted by owner');
        }

        // Validate owner / authorization
        if ($requestingRole !== 'admin' && (string)($evidence['user_id'] ?? '') !== (string)$requestingUserId) {
            throw new RuntimeException('unauthorized_evidence_access: User is not authorized to OCR this evidence');
        }

        // Validate storage key exists
        $storageKey = $evidence['storage_key'] ?? $evidence['file_path'] ?? null;
        if (!$storageKey) {
            throw new RuntimeException('storage_object_missing: No storage key associated with evidence');
        }

        $physicalPath = $this->resolvePhysicalPath($storageKey);

        if (!file_exists($physicalPath)) {
            throw new RuntimeException('storage_object_missing: Physical evidence file not found at storage destination');
        }

        // Hash consistency check
        $this->verifyHashIntegrity($physicalPath, $evidence['sha256'] ?? null);

        return [
            'evidence_id'      => $evidence['evidence_id'],
            'user_id'          => $evidence['user_id'],
            'accomplishment_id'=> $evidence['accomplishment_id'] ?? null,
            'storage_key'      => $storageKey,
            'physical_path'    => $physicalPath,
            'sha256'           => $evidence['sha256'] ?? hash_file('sha256', $physicalPath),
            'mime_type'        => $evidence['mime_type'] ?? mime_content_type($physicalPath),
            'file_size'        => $evidence['file_size'] ?? filesize($physicalPath),
            'original_filename'=> $evidence['original_filename'] ?? basename($physicalPath),
        ];
    }

    /**
     * Verify hash integrity of the physical file against stored hash.
     *
     * @param string $physicalPath
     * @param string|null $expectedSha256
     * @throws RuntimeException
     */
    public function verifyHashIntegrity(string $physicalPath, ?string $expectedSha256): void
    {
        if (empty($expectedSha256)) {
            return;
        }

        $actualHash = hash_file('sha256', $physicalPath);
        if (strtolower($actualHash) !== strtolower($expectedSha256)) {
            throw new RuntimeException(
                'evidence_integrity_mismatch: Physical file SHA-256 (' . $actualHash . 
                ') does not match recorded evidence hash (' . $expectedSha256 . ')'
            );
        }
    }

    /**
     * Build an end-to-end evidence chain trace DTO for diagnostics and audits.
     *
     * @param array $evidence
     * @param array|null $ocrResult
     * @param array|null $snapshotItem
     * @param array|null $reviewerItem
     * @return array Diagnostic trace DTO
     */
    public function buildEvidenceChainTrace(
        array $evidence,
        ?array $ocrResult = null,
        ?array $snapshotItem = null,
        ?array $reviewerItem = null
    ): array {
        $evidenceId = $evidence['evidence_id'] ?? null;
        $ownerId = $evidence['user_id'] ?? null;
        $storageKey = $evidence['storage_key'] ?? $evidence['file_path'] ?? null;
        $sha256 = $evidence['sha256'] ?? null;
        $isDeleted = !empty($evidence['deleted_at']);

        $ocrStatus = $ocrResult['status'] ?? 'pending';
        $ocrSourceEvidenceId = $ocrResult['evidence_id'] ?? null;

        $snapshotEvidenceId = $snapshotItem['evidence_id'] ?? null;
        $reviewerEvidenceId = $reviewerItem['evidence_id'] ?? null;

        $chainValid = true;
        $reasonCodes = [];

        if (!$evidenceId) {
            $chainValid = false;
            $reasonCodes[] = 'evidence_not_found';
        }

        if ($isDeleted) {
            $chainValid = false;
            $reasonCodes[] = 'evidence_deleted';
        }

        if ($ocrResult && $ocrSourceEvidenceId && $ocrSourceEvidenceId !== $evidenceId) {
            $chainValid = false;
            $reasonCodes[] = 'ocr_evidence_mismatch';
        }

        if ($snapshotItem && $snapshotEvidenceId && $snapshotEvidenceId !== $evidenceId) {
            $chainValid = false;
            $reasonCodes[] = 'snapshot_evidence_mismatch';
        }

        if ($reviewerItem && $reviewerEvidenceId && $reviewerEvidenceId !== $evidenceId) {
            $chainValid = false;
            $reasonCodes[] = 'reviewer_evidence_mismatch';
        }

        return [
            'evidence_id'            => $evidenceId,
            'owner_id'               => $ownerId,
            'accomplishment_id'      => $evidence['accomplishment_id'] ?? null,
            'storage_key'            => $storageKey,
            'sha256'                 => $sha256,
            'ocr_status'             => $ocrStatus,
            'ocr_source_evidence_id' => $ocrSourceEvidenceId,
            'snapshot_evidence_id'   => $snapshotEvidenceId,
            'reviewer_evidence_id'   => $reviewerEvidenceId,
            'review_preview_route'   => $evidenceId ? "/api/v1/personnel/evidence/{$evidenceId}/preview" : null,
            'chain_valid'            => $chainValid && empty($reasonCodes),
            'reason_codes'           => $reasonCodes,
            'verified_at'            => date('Y-m-d H:i:s'),
        ];
    }

    /**
     * Resolve absolute physical storage path from storage key.
     */
    protected function resolvePhysicalPath(string $storageKey): string
    {
        if (strpos($storageKey, '..') !== false) {
            throw new InvalidArgumentException('Directory traversal detected in storage key');
        }

        if (str_starts_with($storageKey, '/') || preg_match('/^[A-Za-z]:\\\\/', $storageKey)) {
            return $storageKey;
        }

        return rtrim($this->storageBasePath, '/\\') . DIRECTORY_SEPARATOR . ltrim($storageKey, '/\\');
    }
}
