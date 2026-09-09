<?php

namespace App\Services;

use RuntimeException;
use Throwable;

/**
 * PersonnelEvidenceVersioningService
 *
 * Authoritative Backend Evidence Versioning, Replacement & Deletion Service for Plan I — Phase I4.
 * Enforces strict boundaries between editable working data and immutable submitted versions.
 * Closes RISK-I0-02 by ensuring physical file unlinks and database cleanups during confirmed owner complete deletion.
 *
 * Core Governance Rules:
 * 1. Evidence replacement is permitted ONLY on editable working records (drafts, reopened revisions).
 * 2. Replacing evidence generates a new canonical evidence identity (`evidence_id` UUID) and distinct physical file.
 * 3. Old evidence identity, metadata, and physical files are preserved untouched for historical submitted versions.
 * 4. Version 1 submitted snapshot retains original Evidence A; Version 2 snapshot links Evidence B.
 * 5. Owner-authorized complete deletion removes all evidence rows, links, and unlinks physical disk files.
 * 6. HR may execute complete deletion ONLY on behalf of an owner with documented authorization/reason.
 */
class PersonnelEvidenceVersioningService
{
    public const REASON_REPLACEMENT_ALLOWED = 'replacement_allowed';
    public const REASON_LOCKED = 'portfolio_submission_locked';
    public const REASON_FORBIDDEN = 'evidence_access_forbidden';
    public const REASON_OWNER_REQUIRED = 'owner_authorization_required';

    protected string $storageRoot;
    protected ?PersonnelEvidenceIdentityService $identityService;
    protected ?PersonnelSecureUploadService $uploadService;

    public function __construct(
        ?string $storageRoot = null,
        ?PersonnelEvidenceIdentityService $identityService = null,
        ?PersonnelSecureUploadService $uploadService = null
    ) {
        $this->storageRoot = $storageRoot ?? (defined('WRITEPATH') ? rtrim(WRITEPATH, '\\/') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'personnel_evidence' : sys_get_temp_dir());
        $this->identityService = $identityService ?? new PersonnelEvidenceIdentityService();
        $this->uploadService = $uploadService ?? new PersonnelSecureUploadService();
    }

    /**
     * Checks if an accomplishment's evidence can be replaced.
     */
    public function canReplaceEvidence(
        array $actor,
        array $accomplishment,
        ?array $existingEvidence = null,
        ?array $submissionContext = null
    ): array {
        $actorId = (string)($actor['profile_id'] ?? $actor['id'] ?? '');
        $ownerId = (string)($accomplishment['personnel_profile_id'] ?? $accomplishment['personnel_id'] ?? '');

        // 1. Ownership validation
        if ($actorId === '' || ($ownerId !== '' && $actorId !== $ownerId)) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_FORBIDDEN,
                'message' => 'Only the achievement owner can replace attached evidence.',
            ];
        }

        // 2. Submission & Lifecycle Lock Check
        $submissionStatus = strtolower((string)($submissionContext['status'] ?? ''));
        if (in_array($submissionStatus, ['submitted', 'under_review', 'deliberated', 'finalized', 'locked'], true)) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_LOCKED,
                'message' => "Evidence cannot be replaced while portfolio submission is in locked status: '{$submissionStatus}'.",
            ];
        }

        $accomplishmentStatus = strtolower((string)($accomplishment['status'] ?? 'active'));
        if (in_array($accomplishmentStatus, ['submitted', 'locked', 'archived'], true)) {
            return [
                'allowed' => false,
                'reason_code' => self::REASON_LOCKED,
                'message' => "Accomplishment is locked in '{$accomplishmentStatus}' status and cannot be modified.",
            ];
        }

        return [
            'allowed' => true,
            'reason_code' => self::REASON_REPLACEMENT_ALLOWED,
            'message' => 'Evidence replacement permitted in editable working state.',
        ];
    }

    /**
     * Replaces evidence on an editable working accomplishment.
     * Generates a new evidence_id without altering historical evidence.
     */
    public function replaceWorkingEvidence(
        array $actor,
        array $accomplishment,
        array $newFilePayload,
        ?array $submissionContext = null
    ): array {
        $check = $this->canReplaceEvidence($actor, $accomplishment, null, $submissionContext);
        if (!$check['allowed']) {
            throw new RuntimeException($check['message'], 409);
        }

        $oldEvidenceId = $accomplishment['evidence_id'] ?? $accomplishment['primary_evidence_id'] ?? null;
        $accomplishmentId = $accomplishment['id'] ?? $accomplishment['accomplishment_id'] ?? null;
        $personnelId = $accomplishment['personnel_profile_id'] ?? $accomplishment['personnel_id'] ?? $actor['profile_id'];

        // 1. Upload new file through secure pipeline (assigns new UUID and stores bytes)
        $uploadResult = $this->uploadService->processUpload(
            $newFilePayload,
            $personnelId,
            $accomplishmentId,
            (string)($actor['profile_id'] ?? $actor['id'] ?? '')
        );

        if (!$uploadResult['success']) {
            throw new RuntimeException("Evidence upload failed: " . ($uploadResult['error'] ?? 'Unknown error'), 422);
        }

        $newEvidence = $uploadResult['evidence'];
        $newEvidenceId = $newEvidence['evidence_id'];

        $db = db_connect();
        $db->transBegin();
        try {
            // Update accomplishment's live working evidence pointer
            if ($accomplishmentId && $db->tableExists('personnel_accomplishments')) {
                $db->table('personnel_accomplishments')
                    ->where('id', $accomplishmentId)
                    ->update([
                        'primary_evidence_id' => $newEvidenceId,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            // Rollback newly created physical file and evidence record
            $this->cleanupPhysicalFile($newEvidence['storage_key'] ?? '');
            if ($db->tableExists('personnel_accomplishment_evidence')) {
                $db->table('personnel_accomplishment_evidence')->where('evidence_id', $newEvidenceId)->delete();
            }
            throw new RuntimeException("Failed to update working accomplishment reference: " . $e->getMessage(), 500);
        }

        return [
            'success' => true,
            'replaces_evidence_id' => $oldEvidenceId,
            'new_evidence_id' => $newEvidenceId,
            'evidence' => $newEvidence,
            'message' => 'Evidence successfully replaced in working accomplishment.',
        ];
    }

    /**
     * Executes owner-authorized complete deletion.
     * Unlinks all physical evidence files and removes all DB evidence records.
     */
    public function purgeOwnerEvidence(
        string $ownerId,
        array $actor,
        ?string $authorizationReference = null
    ): array {
        $actorId = (string)($actor['profile_id'] ?? $actor['id'] ?? '');
        $actorRoles = (array)($actor['roles'] ?? ($actor['role'] ? [$actor['role']] : []));
        $isHR = in_array('hr_staff', $actorRoles, true) || in_array('hr_admin', $actorRoles, true);
        $isOwner = ($actorId !== '' && $actorId === $ownerId);

        // 1. Authorization check
        if (!$isOwner && !$isHR) {
            return [
                'success' => false,
                'reason_code' => self::REASON_FORBIDDEN,
                'message' => 'Only the record owner or HR on their behalf may execute complete deletion.',
            ];
        }

        if ($isHR && empty($authorizationReference)) {
            return [
                'success' => false,
                'reason_code' => self::REASON_OWNER_REQUIRED,
                'message' => 'HR execution of complete deletion requires documented owner authorization reference.',
            ];
        }

        $db = db_connect();
        $evidenceRows = [];

        if ($db->tableExists('personnel_accomplishment_evidence')) {
            // Find all evidence records owned by this personnel
            $evidenceRows = $db->table('personnel_accomplishment_evidence pae')
                ->select('pae.*')
                ->join('personnel_accomplishments pa', 'pa.id = pae.accomplishment_id', 'left')
                ->where('pae.personnel_id', $ownerId)
                ->orWhere('pae.uploader_id', $ownerId)
                ->orWhere('pa.personnel_profile_id', $ownerId)
                ->get()
                ->getResultArray();
        }

        $unlinkedCount = 0;
        $failedUnlinks = [];

        // 2. Unlink physical files
        foreach ($evidenceRows as $ev) {
            $storageKey = $ev['storage_key'] ?? $ev['storage_path'] ?? '';
            if ($storageKey !== '') {
                $unlinked = $this->cleanupPhysicalFile($storageKey);
                if ($unlinked) {
                    $unlinkedCount++;
                } else {
                    $failedUnlinks[] = $storageKey;
                }
            }
        }

        // 3. Delete evidence database rows
        $evidenceIds = array_filter(array_column($evidenceRows, 'evidence_id'));
        $dbEvidenceIds = array_filter(array_column($evidenceRows, 'id'));
        $allIds = array_unique(array_merge($evidenceIds, $dbEvidenceIds));

        if (!empty($allIds) && $db->tableExists('personnel_accomplishment_evidence')) {
            $db->table('personnel_accomplishment_evidence')
                ->whereIn('evidence_id', $allIds)
                ->orWhereIn('id', $allIds)
                ->delete();
        }

        return [
            'success' => true,
            'owner_id' => $ownerId,
            'purged_evidence_count' => count($evidenceRows),
            'unlinked_file_count' => $unlinkedCount,
            'failed_unlinks' => $failedUnlinks,
            'purged_at' => gmdate('Y-m-d\TH:i:s\Z'),
            'message' => 'All owner evidence and physical files successfully purged.',
        ];
    }

    /**
     * Unlinks a single physical storage file safely.
     */
    public function cleanupPhysicalFile(string $storageKey): bool
    {
        if (trim($storageKey) === '') {
            return false;
        }

        $normalizedKey = str_replace(['..', "\0"], '', $storageKey);
        $normalizedKey = ltrim($normalizedKey, '/\\');

        $roots = [
            $this->storageRoot,
            defined('WRITEPATH') ? rtrim(WRITEPATH, '\\/') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'evidence' : null,
        ];

        $unlinked = false;
        foreach ($roots as $root) {
            if ($root === null) continue;
            $fullPath = rtrim($root, '/\\') . DIRECTORY_SEPARATOR . $normalizedKey;
            if (file_exists($fullPath)) {
                $realPath = realpath($fullPath);
                $realRoot = realpath($root);
                if ($realRoot !== false && $realPath !== false && strpos($realPath, $realRoot) === 0) {
                    if (@unlink($realPath)) {
                        $unlinked = true;
                    }
                }
            }
        }

        return $unlinked;
    }

    /**
     * Scans for orphaned evidence files or missing database linkages.
     */
    public function scanForOrphans(?string $ownerId = null): array
    {
        return $this->identityService->findOrphanReferences();
    }
}
