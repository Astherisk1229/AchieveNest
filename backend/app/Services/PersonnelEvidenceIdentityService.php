<?php

namespace App\Services;

use App\Services\AuthorizationService;
use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/**
 * PersonnelEvidenceIdentityService
 *
 * Plan I — Phase I2: Evidence Identity, Integrity, Snapshot Linkage & Duplicate Advisory.
 * Manages stable evidence identities, snapshot foreign-key linkage,
 * advisory SHA-256 duplicate content detection, and historical integrity verification.
 */
class PersonnelEvidenceIdentityService
{
    protected AuthorizationService $authz;
    protected BaseConnection $db;

    public function __construct(?AuthorizationService $authz = null, ?BaseConnection $db = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
        $this->db = $db ?? db_connect();
    }

    private function getItemsTable(): string
    {
        return $this->db->tableExists('public.personnel_evaluation_items')
            ? 'public.personnel_evaluation_items'
            : 'personnel_evaluation_items';
    }

    private function getEvidenceTable(): string
    {
        return $this->db->tableExists('public.personnel_accomplishment_evidence')
            ? 'public.personnel_accomplishment_evidence'
            : 'personnel_accomplishment_evidence';
    }

    /**
     * Retrieves an authoritative evidence record by UUID.
     */
    public function getEvidenceById(string $evidenceId): ?array
    {
        $table = $this->getEvidenceTable();
        return $this->db->table($table)
            ->where('id', $evidenceId)
            ->get()
            ->getRowArray();
    }

    /**
     * Validates that an evidence record exists and belongs to the authenticated actor.
     */
    public function validateEvidenceOwnership(array $actor, string $evidenceId): array
    {
        $evidence = $this->getEvidenceById($evidenceId);
        if ($evidence === null) {
            return [
                'valid' => false,
                'code' => 'EVIDENCE_NOT_FOUND',
                'status' => 404,
                'message' => 'Evidence record not found.',
                'evidence' => null,
            ];
        }

        $ownerId = $evidence['uploaded_by'] ?? null;
        $actorProfileId = $actor['profile']['id'] ?? '';
        $isHR = $this->authz->hasRole($actor, 'hr_staff') || ($actor['profile']['account_type'] ?? '') === 'hr_admin';

        if (! $isHR && $ownerId !== null && $ownerId !== $actorProfileId) {
            return [
                'valid' => false,
                'code' => 'FORBIDDEN',
                'status' => 403,
                'message' => 'You are not authorized to access or link this evidence record (Cross-owner evidence forbidden).',
                'evidence' => null,
            ];
        }

        return [
            'valid' => true,
            'code' => 'OK',
            'status' => 200,
            'message' => 'Evidence ownership verified.',
            'evidence' => $evidence,
        ];
    }

    /**
     * Validates that an evidence record is legitimately attached to a target accomplishment.
     */
    public function validateEvidenceReference(string $evidenceId, string $accomplishmentId): bool
    {
        $evidence = $this->getEvidenceById($evidenceId);
        if ($evidence === null) {
            return false;
        }

        return ($evidence['accomplishment_id'] === $accomplishmentId && ($evidence['status'] ?? 'active') === 'active');
    }

    /**
     * Builds safe evidence identity DTO (no server filesystem path leakage).
     */
    public function buildEvidenceIdentityReadModel(array $evidence): array
    {
        return [
            'evidence_id'        => $evidence['id'] ?? '',
            'accomplishment_id'  => $evidence['accomplishment_id'] ?? null,
            'owner_id'           => $evidence['uploaded_by'] ?? null,
            'original_filename'  => $evidence['original_filename'] ?? 'document.pdf',
            'mime_type'          => $evidence['detected_mime_type'] ?? $evidence['mime_type'] ?? 'application/octet-stream',
            'byte_size'          => (int) ($evidence['byte_size'] ?? 0),
            'sha256'             => $evidence['sha256'] ?? $evidence['checksum'] ?? '',
            'security_status'    => $evidence['security_status'] ?? 'verified',
            'status'             => $evidence['status'] ?? 'active',
            'uploaded_at'        => $evidence['uploaded_at'] ?? '',
            'download_endpoint'  => sprintf('/api/v1/evidence/personnel/%s/download', $evidence['id'] ?? ''),
        ];
    }

    /**
     * SHA-256 Advisory Duplicate Content Detection.
     * Finds matching evidence records with the same hash without leaking other users' private metadata.
     *
     * @param string $sha256 Hex-encoded SHA-256 hash
     * @param string|null $excludeEvidenceId Current evidence ID to exclude from match count
     * @param string|null $ownerProfileId If provided, identifies same-owner duplicates vs general matches
     * @return array [duplicate_detected => bool, matching_evidence_count => int, same_owner_count => int, message => string]
     */
    public function findDuplicateCandidatesByHash(string $sha256, ?string $excludeEvidenceId = null, ?string $ownerProfileId = null): array
    {
        if (trim($sha256) === '') {
            return [
                'duplicate_detected'      => false,
                'matching_evidence_count' => 0,
                'same_owner_count'        => 0,
                'message'                 => 'No hash provided for duplicate check.',
            ];
        }

        $table = $this->getEvidenceTable();
        $builder = $this->db->table($table)
            ->where('sha256', strtolower(trim($sha256)))
            ->where('status', 'active');

        if ($excludeEvidenceId !== null) {
            $builder->where('id !=', $excludeEvidenceId);
        }

        $matches = $builder->get()->getResultArray();
        $totalCount = count($matches);

        if ($totalCount === 0) {
            return [
                'duplicate_detected'      => false,
                'matching_evidence_count' => 0,
                'same_owner_count'        => 0,
                'message'                 => 'No duplicate content detected.',
            ];
        }

        $sameOwnerMatches = 0;
        if ($ownerProfileId !== null) {
            foreach ($matches as $m) {
                if (($m['uploaded_by'] ?? null) === $ownerProfileId) {
                    $sameOwnerMatches++;
                }
            }
        }

        $msg = $sameOwnerMatches > 0
            ? sprintf('Advisory Notice: This document appears identical in content (SHA-256 match) to %d previously uploaded evidence item(s) in your portfolio.', $sameOwnerMatches)
            : 'Advisory Notice: This document shares identical content with an existing system document.';

        return [
            'duplicate_detected'      => true,
            'matching_evidence_count' => $totalCount,
            'same_owner_count'        => $sameOwnerMatches,
            'message'                 => $msg,
        ];
    }

    /**
     * Non-destructive scan to detect orphaned or broken evidence references.
     */
    public function detectOrphanReferences(): array
    {
        $itemsTable = $this->getItemsTable();
        $evTable = $this->getEvidenceTable();

        $brokenItemReferences = 0;
        if ($this->db->fieldExists('evidence_id', $itemsTable)) {
            $brokenItems = $this->db->table("{$itemsTable} i")
                ->join("{$evTable} e", 'e.id = i.evidence_id', 'left')
                ->where('i.evidence_id IS NOT NULL')
                ->where('e.id IS NULL')
                ->get()
                ->getResultArray();
            $brokenItemReferences = count($brokenItems);
        }

        $unlinkedEvidenceRows = $this->db->table("{$evTable} e")
            ->join('personnel_accomplishments a', 'a.id = e.accomplishment_id', 'left')
            ->where('a.id IS NULL')
            ->get()
            ->getResultArray();

        return [
            'broken_item_evidence_references' => $brokenItemReferences,
            'unlinked_evidence_rows'          => count($unlinkedEvidenceRows),
            'status'                          => ($brokenItemReferences === 0 && count($unlinkedEvidenceRows) === 0) ? 'clean' : 'reconciliation_recommended',
        ];
    }
}
