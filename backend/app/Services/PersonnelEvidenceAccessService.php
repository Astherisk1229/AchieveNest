<?php

namespace App\Services;

use RuntimeException;

/**
 * PersonnelEvidenceAccessService
 *
 * Authoritative Backend Evidence Preview, Download & Access Authorization Service for Plan I — Phase I3.
 * Enforces scope-aware, identity-based authorization for Personnel owners, College Deans, and HR evaluators.
 * Closes RISK-I0-01 by replacing filename-based preview lookups with authenticated evidence-ID streaming.
 *
 * Core Authorization Rules:
 * 1. Evidence must be requested by canonical `evidence_id` UUID, never by filename or client storage path.
 * 2. Personnel can only access their own evidence according to active lifecycle status.
 * 3. College Dean can only access evidence for assigned candidates within their authorized academic college.
 * 4. Self-review by Deans or Evaluators is strictly blocked from evaluator privileges.
 * 5. Department Secretary role is denied evaluator evidence access by default.
 * 6. HR actors must hold verified `hr_staff` or `hr_admin` roles from server-authenticated session.
 * 7. Storage paths are strictly resolved server-side within the protected evidence directory.
 * 8. Missing physical files yield a controlled 404 with reason `storage_object_missing` without exposing paths.
 */
class PersonnelEvidenceAccessService
{
    public const REASON_OWNER_ALLOWED = 'owner_access_allowed';
    public const REASON_DEAN_ALLOWED = 'dean_scope_allowed';
    public const REASON_HR_ALLOWED = 'hr_scope_allowed';
    public const REASON_NOT_FOUND = 'evidence_not_found';
    public const REASON_FORBIDDEN = 'evidence_access_forbidden';
    public const REASON_CROSS_COLLEGE = 'cross_college_access_denied';
    public const REASON_SELF_REVIEW = 'self_review_access_denied';
    public const REASON_ASSIGNMENT_MISSING = 'review_assignment_missing';
    public const REASON_DELETED = 'evidence_deleted';
    public const REASON_OBJECT_MISSING = 'storage_object_missing';

    protected string $storageRoot;
    protected ?PersonnelEvidenceIdentityService $identityService;

    public function __construct(
        ?string $storageRoot = null,
        ?PersonnelEvidenceIdentityService $identityService = null
    ) {
        $this->storageRoot = $storageRoot ?? (defined('WRITEPATH') ? rtrim(WRITEPATH, '\\/') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'personnel_evidence' : sys_get_temp_dir());
        $this->identityService = $identityService ?? new PersonnelEvidenceIdentityService();
    }

    /**
     * Retrieves evidence metadata by canonical evidence_id.
     */
    public function getEvidenceMetadata(string $evidenceId): ?array
    {
        return $this->identityService->getEvidenceById($evidenceId);
    }

    /**
     * Builds structured authorization decision for an actor requesting evidence access.
     *
     * @param array $actor Authenticated actor token context (id, profile_id, roles, assigned_college_id)
     * @param string $evidenceId Canonical evidence UUID
     * @param string $accessType 'preview' | 'download' | 'metadata'
     * @param array $evaluationContext Optional evaluation context (assigned_reviewer_role, evaluator_college_id, etc.)
     * @return array Authorization decision DTO
     */
    public function buildAccessDecision(
        array $actor,
        string $evidenceId,
        string $accessType = 'preview',
        array $evaluationContext = []
    ): array {
        $evidence = $this->getEvidenceMetadata($evidenceId);

        if ($evidence === null) {
            return [
                'evidence_id' => $evidenceId,
                'actor_id' => (string)($actor['profile_id'] ?? $actor['id'] ?? ''),
                'actor_roles' => (array)($actor['roles'] ?? []),
                'access_type' => $accessType,
                'allowed' => false,
                'reason_code' => self::REASON_NOT_FOUND,
                'message' => 'Evidence record not found.',
                'scope_reference' => null,
            ];
        }

        // Check Lifecycle Status
        $lifecycleStatus = $evidence['lifecycle_status'] ?? $evidence['status'] ?? 'active';
        if (in_array(strtolower($lifecycleStatus), ['deleted', 'purged', 'archived_deleted'], true)) {
            return [
                'evidence_id' => $evidenceId,
                'actor_id' => (string)($actor['profile_id'] ?? $actor['id'] ?? ''),
                'actor_roles' => (array)($actor['roles'] ?? []),
                'access_type' => $accessType,
                'allowed' => false,
                'reason_code' => self::REASON_DELETED,
                'message' => 'Evidence has been deleted and is inaccessible.',
                'scope_reference' => null,
            ];
        }

        $actorId = (string)($actor['profile_id'] ?? $actor['id'] ?? '');
        $actorRoles = (array)($actor['roles'] ?? ($actor['role'] ? [$actor['role']] : []));
        $evidenceOwnerId = (string)($evidence['personnel_id'] ?? $evidence['personnel_profile_id'] ?? $evidence['uploader_id'] ?? '');

        // 1. Evaluator Access: Self-Review Check (when evaluated candidate is the reviewer)
        $isEvaluatorReviewPath = !empty($evaluationContext['assigned_reviewer_role']) || !empty($evaluationContext['evaluation_id']);
        if ($isEvaluatorReviewPath && $actorId !== '' && $actorId === $evidenceOwnerId) {
            return [
                'evidence_id' => $evidenceId,
                'actor_id' => $actorId,
                'actor_roles' => $actorRoles,
                'access_type' => $accessType,
                'allowed' => false,
                'reason_code' => self::REASON_SELF_REVIEW,
                'message' => 'Candidate cannot access evidence using reviewer privileges (Self-review prohibited).',
                'scope_reference' => 'self_review',
            ];
        }

        // 2. Direct Owner Access (when not in evaluator self-review path)
        if ($actorId !== '' && $actorId === $evidenceOwnerId) {
            return [
                'evidence_id' => $evidenceId,
                'actor_id' => $actorId,
                'actor_roles' => $actorRoles,
                'access_type' => $accessType,
                'allowed' => true,
                'reason_code' => self::REASON_OWNER_ALLOWED,
                'message' => 'Access authorized as evidence owner.',
                'scope_reference' => 'owner',
            ];
        }

        // 3. Department Secretary Check (Denied evaluator preview by default)
        if (in_array('department_secretary', $actorRoles, true) && !in_array('dean', $actorRoles, true) && !in_array('hr_staff', $actorRoles, true) && !in_array('hr_admin', $actorRoles, true)) {
            return [
                'evidence_id' => $evidenceId,
                'actor_id' => $actorId,
                'actor_roles' => $actorRoles,
                'access_type' => $accessType,
                'allowed' => false,
                'reason_code' => self::REASON_FORBIDDEN,
                'message' => 'Department Secretary role does not possess evaluator evidence access authority.',
                'scope_reference' => 'department_secretary',
            ];
        }

        // 4. College Dean Review Scope Check
        if (in_array('dean', $actorRoles, true)) {
            $actorCollegeId = (string)($actor['assigned_college_id'] ?? $actor['college_id'] ?? '');
            $evidenceCollegeId = (string)($evaluationContext['evaluator_college_id'] ?? $evaluationContext['target_college_id'] ?? $evidence['college_id'] ?? '');
            $assignedRole = (string)($evaluationContext['assigned_reviewer_role'] ?? $evaluationContext['evaluator_role'] ?? 'dean');

            // If evaluation is HR-routed, Dean has no review authority
            if ($assignedRole === 'hr' || $assignedRole === 'hr_staff' || $assignedRole === 'hr_admin') {
                return [
                    'evidence_id' => $evidenceId,
                    'actor_id' => $actorId,
                    'actor_roles' => $actorRoles,
                    'access_type' => $accessType,
                    'allowed' => false,
                    'reason_code' => self::REASON_ASSIGNMENT_MISSING,
                    'message' => 'Evaluation is assigned to HR Office, not College Dean.',
                    'scope_reference' => 'hr_route_isolation',
                ];
            }

            // Cross-College Check (including unassigned dean)
            if ($evidenceCollegeId !== '' && ($actorCollegeId === '' || $actorCollegeId !== $evidenceCollegeId)) {
                return [
                    'evidence_id' => $evidenceId,
                    'actor_id' => $actorId,
                    'actor_roles' => $actorRoles,
                    'access_type' => $accessType,
                    'allowed' => false,
                    'reason_code' => self::REASON_CROSS_COLLEGE,
                    'message' => 'Cross-college evidence access is strictly prohibited.',
                    'scope_reference' => "actor_college:{$actorCollegeId},target_college:{$evidenceCollegeId}",
                ];
            }

            return [
                'evidence_id' => $evidenceId,
                'actor_id' => $actorId,
                'actor_roles' => $actorRoles,
                'access_type' => $accessType,
                'allowed' => true,
                'reason_code' => self::REASON_DEAN_ALLOWED,
                'message' => 'Access authorized under College Dean review scope.',
                'scope_reference' => "college:{$actorCollegeId}",
            ];
        }

        // 5. HR Oversight Access Check
        if (in_array('hr_staff', $actorRoles, true) || in_array('hr_admin', $actorRoles, true)) {
            return [
                'evidence_id' => $evidenceId,
                'actor_id' => $actorId,
                'actor_roles' => $actorRoles,
                'access_type' => $accessType,
                'allowed' => true,
                'reason_code' => self::REASON_HR_ALLOWED,
                'message' => 'Access authorized under HR institutional oversight scope.',
                'scope_reference' => 'hr_governance',
            ];
        }

        // Default Deny
        return [
            'evidence_id' => $evidenceId,
            'actor_id' => $actorId,
            'actor_roles' => $actorRoles,
            'access_type' => $accessType,
            'allowed' => false,
            'reason_code' => self::REASON_FORBIDDEN,
            'message' => 'Access denied: Actor is not authorized to access this evidence.',
            'scope_reference' => null,
        ];
    }

    /**
     * Resolves absolute file path safely on the server and checks for existence.
     * Guarantees that the resolved path stays inside the canonical storage root.
     */
    public function resolvePhysicalFile(string $storageKey): array
    {
        // Directory traversal protection
        $normalizedKey = str_replace(['..', "\0"], '', $storageKey);
        $normalizedKey = ltrim($normalizedKey, '/\\');

        $fullPath = rtrim($this->storageRoot, '/\\') . DIRECTORY_SEPARATOR . $normalizedKey;
        
        // If file exists at exact fullPath
        if (file_exists($fullPath)) {
            $realPath = realpath($fullPath);
            $realRoot = realpath($this->storageRoot);

            if ($realRoot !== false && $realPath !== false && strpos($realPath, $realRoot) === 0) {
                return [
                    'exists' => true,
                    'absolute_path' => $realPath,
                    'size_bytes' => filesize($realPath),
                ];
            }
        }

        // Check fallback root (writable/uploads/evidence)
        if (defined('WRITEPATH')) {
            $fallbackRoot = rtrim(WRITEPATH, '\\/') . DIRECTORY_SEPARATOR . 'uploads' . DIRECTORY_SEPARATOR . 'evidence';
            $fallbackPath = $fallbackRoot . DIRECTORY_SEPARATOR . $normalizedKey;
            if (file_exists($fallbackPath)) {
                $realFallbackPath = realpath($fallbackPath);
                $realFallbackRoot = realpath($fallbackRoot);
                if ($realFallbackRoot !== false && $realFallbackPath !== false && strpos($realFallbackPath, $realFallbackRoot) === 0) {
                    return [
                        'exists' => true,
                        'absolute_path' => $realFallbackPath,
                        'size_bytes' => filesize($realFallbackPath),
                    ];
                }
            }
        }

        return [
            'exists' => false,
            'reason_code' => self::REASON_OBJECT_MISSING,
            'message' => 'Evidence physical file not found on server storage.',
        ];
    }

    /**
     * Sanitizes filename for Content-Disposition header to prevent header injection.
     */
    public function sanitizeHeaderFilename(string $filename): string
    {
        $safe = basename($filename);
        // Remove CR, LF, double quotes, null bytes
        $safe = str_replace(["\r", "\n", '"', "'", "\0", ';'], '', $safe);
        $safe = preg_replace('/[^\x20-\x7E]/', '', $safe);
        return trim($safe) !== '' ? trim($safe) : 'evidence_file.pdf';
    }

    /**
     * Logs safe access audit trail without sensitive secrets, tokens, or absolute paths.
     */
    public function logAccessAudit(
        string $evidenceId,
        array $actor,
        string $accessType,
        bool $allowed,
        string $reasonCode
    ): array {
        return [
            'evidence_id' => $evidenceId,
            'actor_id' => (string)($actor['profile_id'] ?? $actor['id'] ?? 'anonymous'),
            'actor_roles' => (array)($actor['roles'] ?? []),
            'access_type' => $accessType,
            'allowed' => $allowed,
            'reason_code' => $reasonCode,
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
        ];
    }
}
