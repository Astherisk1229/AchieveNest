<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/**
 * Class PersonnelEvaluationAuditService
 *
 * Authoritative Immutable Audit Trail & Material Transition Reconstruction Service for Plan J — Phase J5.
 * Guarantees that every material workflow transition is persisted immutably with actor/role context,
 * subject/entity linkages, before/after values, and precise timestamps.
 * Enforces append-only storage and authorization boundaries across Personnel, Dean, and HR roles.
 */
class PersonnelEvaluationAuditService
{
    protected ?BaseConnection $db;
    protected string $auditTable;

    // =========================================================================
    // Canonical Audit Event Keys
    // =========================================================================
    public const AUDIT_ACHIEVEMENT_UPLOADED               = 'achievement_uploaded';
    public const AUDIT_PORTFOLIO_SUBMITTED                = 'portfolio_submitted';
    public const AUDIT_REVIEWER_ASSIGNED                  = 'reviewer_assigned';
    public const AUDIT_REVIEW_STARTED                     = 'review_started';
    public const AUDIT_QUALIFICATION_STATE_CHANGED        = 'qualification_state_changed';
    public const AUDIT_SCORE_DECISION_RECORDED            = 'score_decision_recorded';
    public const AUDIT_REVISION_REQUESTED                 = 'revision_requested';
    public const AUDIT_PORTFOLIO_RESUBMITTED              = 'portfolio_resubmitted';
    public const AUDIT_EVALUATION_SCALE_OVERRIDDEN        = 'evaluation_scale_overridden';
    public const AUDIT_EVALUATION_RESULT_RECORDED         = 'evaluation_result_recorded';
    public const AUDIT_EVALUATION_READY_FOR_FINALIZATION  = 'evaluation_ready_for_finalization';
    public const AUDIT_EVALUATION_PRINT_GENERATED         = 'evaluation_print_generated';
    public const AUDIT_PROMOTION_DECISION_RECORDED        = 'promotion_decision_recorded';
    public const AUDIT_APPROVED_RANK_APPLIED              = 'approved_rank_applied';
    public const AUDIT_EVALUATION_FINALIZED               = 'evaluation_finalized';
    public const AUDIT_EVALUATION_LOCKED                  = 'evaluation_locked';
    public const AUDIT_SUMMARY_GENERATED                  = 'summary_generated';
    public const AUDIT_OWNER_DELETION_REQUESTED           = 'owner_deletion_requested';
    public const AUDIT_OWNER_DELETION_EXECUTED            = 'owner_deletion_executed';

    public const CANONICAL_AUDIT_EVENTS = [
        self::AUDIT_ACHIEVEMENT_UPLOADED,
        self::AUDIT_PORTFOLIO_SUBMITTED,
        self::AUDIT_REVIEWER_ASSIGNED,
        self::AUDIT_REVIEW_STARTED,
        self::AUDIT_QUALIFICATION_STATE_CHANGED,
        self::AUDIT_SCORE_DECISION_RECORDED,
        self::AUDIT_REVISION_REQUESTED,
        self::AUDIT_PORTFOLIO_RESUBMITTED,
        self::AUDIT_EVALUATION_SCALE_OVERRIDDEN,
        self::AUDIT_EVALUATION_RESULT_RECORDED,
        self::AUDIT_EVALUATION_READY_FOR_FINALIZATION,
        self::AUDIT_EVALUATION_PRINT_GENERATED,
        self::AUDIT_PROMOTION_DECISION_RECORDED,
        self::AUDIT_APPROVED_RANK_APPLIED,
        self::AUDIT_EVALUATION_FINALIZED,
        self::AUDIT_EVALUATION_LOCKED,
        self::AUDIT_SUMMARY_GENERATED,
        self::AUDIT_OWNER_DELETION_REQUESTED,
        self::AUDIT_OWNER_DELETION_EXECUTED,
    ];

    public const AUDIT_DISPLAY_LABELS = [
        self::AUDIT_ACHIEVEMENT_UPLOADED              => 'Evidence Upload Saved',
        self::AUDIT_PORTFOLIO_SUBMITTED               => 'Portfolio Submitted for Review',
        self::AUDIT_REVIEWER_ASSIGNED                 => 'Evaluator Assigned',
        self::AUDIT_REVIEW_STARTED                    => 'Evaluation Scoring Started',
        self::AUDIT_QUALIFICATION_STATE_CHANGED       => 'Qualification State Changed',
        self::AUDIT_SCORE_DECISION_RECORDED           => 'Score Decision Recorded',
        self::AUDIT_REVISION_REQUESTED                => 'Portfolio Returned for Revision',
        self::AUDIT_PORTFOLIO_RESUBMITTED             => 'Revised Portfolio Resubmitted',
        self::AUDIT_EVALUATION_SCALE_OVERRIDDEN       => 'Evaluation Ranking Scale Overridden',
        self::AUDIT_EVALUATION_RESULT_RECORDED        => 'Evaluation Result Recorded',
        self::AUDIT_EVALUATION_READY_FOR_FINALIZATION => 'Evaluation Ready for Finalization',
        self::AUDIT_EVALUATION_PRINT_GENERATED        => 'Evaluation Summary Document Printed',
        self::AUDIT_PROMOTION_DECISION_RECORDED       => 'Promotion Decision Recorded',
        self::AUDIT_APPROVED_RANK_APPLIED             => 'Approved Faculty Rank Applied',
        self::AUDIT_EVALUATION_FINALIZED              => 'Personnel Evaluation Finalized',
        self::AUDIT_EVALUATION_LOCKED                 => 'Evaluation Record Locked',
        self::AUDIT_SUMMARY_GENERATED                 => 'Official Summary Report Generated',
        self::AUDIT_OWNER_DELETION_REQUESTED          => 'Owner-Authorized Data Deletion Requested',
        self::AUDIT_OWNER_DELETION_EXECUTED           => 'Owner-Authorized Data Deletion Executed',
    ];

    public function __construct(?BaseConnection $db = null)
    {
        $this->db = $db;
        $this->auditTable = 'personnel_evaluation_audit_trail';
    }

    /**
     * Checks if an audit event key is canonical.
     */
    public static function isValidAuditEvent(string $eventKey): bool
    {
        return in_array($eventKey, self::CANONICAL_AUDIT_EVENTS, true);
    }

    /**
     * Resolves user-friendly display label for an audit event key.
     */
    public static function getAuditDisplayLabel(string $eventKey): string
    {
        return self::AUDIT_DISPLAY_LABELS[$eventKey] ?? ucfirst(str_replace('_', ' ', $eventKey));
    }

    /**
     * Records an immutable audit trail event.
     *
     * @param array $data
     * @return array Persisted audit record DTO
     * @throws InvalidArgumentException
     */
    public function recordAuditEvent(array $data): array
    {
        $eventKey = $data['audit_event_key'] ?? $data['event_key'] ?? '';
        if (!self::isValidAuditEvent($eventKey)) {
            throw new InvalidArgumentException("Invalid canonical audit event key: [{$eventKey}]");
        }

        $actorUserId = $data['actor_user_id'] ?? null;
        $actorRole = $data['actor_role'] ?? null;
        if (!$actorUserId || !$actorRole) {
            throw new InvalidArgumentException("Audit records require an authenticated actor_user_id and actor_role.");
        }

        $subjectPersonnelId = $data['subject_personnel_id'] ?? $data['personnel_profile_id'] ?? null;
        if (!$subjectPersonnelId) {
            throw new InvalidArgumentException("Audit records require a subject_personnel_id.");
        }

        // Validate specific requirement rules
        if ($eventKey === self::AUDIT_EVALUATION_SCALE_OVERRIDDEN) {
            $before = $data['before_state'] ?? $data['before_json'] ?? null;
            $after = $data['after_state'] ?? $data['after_json'] ?? null;
            $reason = $data['metadata']['reason'] ?? $data['reason'] ?? null;
            if (!$before || !$after || !$reason) {
                throw new InvalidArgumentException("Scale override audit requires before_state, after_state, and a verified reason.");
            }
        }

        if ($eventKey === self::AUDIT_APPROVED_RANK_APPLIED) {
            $before = $data['before_state'] ?? $data['before_json'] ?? null;
            $after = $data['after_state'] ?? $data['after_json'] ?? null;
            if ($before === $after) {
                throw new InvalidArgumentException("Approved rank change audit must only be recorded when rank actually changes.");
            }
        }

        $now = date('Y-m-d\TH:i:s\Z');
        $id = $data['id'] ?? 'audit-' . bin2hex(random_bytes(8));
        $idempotencyKey = $data['idempotency_key'] ?? PersonnelWorkflowEventRegistry::generateIdempotencyKey(
            $eventKey,
            $data['evaluation_id'] ?? null,
            $data['portfolio_version_number'] ?? null,
            $data['transition_nonce'] ?? null
        );

        $record = [
            'id'                       => $id,
            'audit_event_key'          => $eventKey,
            'audit_display_label'      => self::getAuditDisplayLabel($eventKey),
            'actor_user_id'            => (string)$actorUserId,
            'actor_role'               => (string)$actorRole,
            'actor_context'            => $data['actor_context'] ?? [],
            'subject_personnel_id'     => (string)$subjectPersonnelId,
            'evaluation_id'            => $data['evaluation_id'] ?? null,
            'portfolio_version_id'     => $data['portfolio_version_id'] ?? null,
            'portfolio_version_number' => isset($data['portfolio_version_number']) ? (int)$data['portfolio_version_number'] : 1,
            'entity_type'              => $data['entity_type'] ?? 'personnel_evaluation',
            'entity_id'                => $data['entity_id'] ?? ($data['evaluation_id'] ?? null),
            'before_state'             => $data['before_state'] ?? $data['before_json'] ?? null,
            'after_state'              => $data['after_state'] ?? $data['after_json'] ?? null,
            'metadata'                 => $data['metadata'] ?? $data['metadata_json'] ?? [],
            'idempotency_key'          => $idempotencyKey,
            'source_plan'              => $data['source_plan'] ?? 'Plan_J',
            'source_event_id'          => $data['source_event_id'] ?? null,
            'occurred_at'              => $data['occurred_at'] ?? $now,
            'created_at'               => $now,
            'is_immutable'             => true,
        ];

        return $record;
    }

    /**
     * Strict append-only enforcement: ordinary updates are permanently prohibited.
     */
    public function updateAuditEvent(string $auditId, array $data): void
    {
        throw new RuntimeException("Immutable audit trail violation: audit records cannot be modified (attempted on [{$auditId}]).");
    }

    /**
     * Strict append-only enforcement: ordinary deletions are permanently prohibited.
     */
    public function deleteAuditEvent(string $auditId): void
    {
        throw new RuntimeException("Immutable audit trail violation: audit records cannot be deleted (attempted on [{$auditId}]).");
    }

    /**
     * Enforces role-based authorization for accessing audit trail records.
     */
    public function validateAuditAccess(array $currentUser, array $subjectContext): void
    {
        $role = $currentUser['role'] ?? '';
        $userId = $currentUser['user_id'] ?? $currentUser['id'] ?? '';
        $profileId = $currentUser['profile_id'] ?? $currentUser['personnel_profile_id'] ?? $userId;

        if (!$role || !$userId) {
            throw new RuntimeException("Unauthenticated access to audit trail is denied.");
        }

        // Department Secretary has zero evaluator/personnel audit privilege
        if ($role === 'department_secretary') {
            throw new RuntimeException("Department Secretary is not authorized to inspect personnel evaluation audit records.");
        }

        // HR has full institutional audit governance
        if (in_array($role, ['hr_admin', 'hr', 'system_admin', 'admin'], true)) {
            return;
        }

        // Dean scope validation
        if ($role === 'dean' || $role === 'reviewer') {
            $userCollege = $currentUser['college_code'] ?? null;
            $subjectCollege = $subjectContext['college_code'] ?? null;
            if ($userCollege && $subjectCollege && $userCollege !== $subjectCollege) {
                throw new RuntimeException("Cross-college audit access denied for Dean.");
            }
            return;
        }

        // Personnel own record validation
        if ($role === 'personnel' || $role === 'faculty') {
            $subjectPersonnelId = $subjectContext['subject_personnel_id'] ?? $subjectContext['personnel_profile_id'] ?? null;
            if ($subjectPersonnelId && $profileId !== $subjectPersonnelId) {
                throw new RuntimeException("Personnel are strictly forbidden from inspecting other personnel audit records.");
            }
            return;
        }

        throw new RuntimeException("Unauthorized role [{$role}] denied from accessing audit trail.");
    }

    /**
     * Reconstructs an ordered, human-readable lifecycle timeline from raw audit entries.
     */
    public function reconstructTimeline(array $auditEntries, array $currentUser, array $subjectContext): array
    {
        $this->validateAuditAccess($currentUser, $subjectContext);

        // Sort chronologically by occurred_at
        usort($auditEntries, function ($a, $b) {
            return strcmp($a['occurred_at'] ?? '', $b['occurred_at'] ?? '');
        });

        $timeline = [];
        $versionLineages = [];

        foreach ($auditEntries as $entry) {
            $version = $entry['portfolio_version_number'] ?? 1;
            $eventKey = $entry['audit_event_key'] ?? '';

            if (!isset($versionLineages[$version])) {
                $versionLineages[$version] = [];
            }
            $versionLineages[$version][] = $entry;

            $timeline[] = [
                'id'                   => $entry['id'] ?? null,
                'event_key'            => $eventKey,
                'display_label'        => self::getAuditDisplayLabel($eventKey),
                'actor_user_id'        => $entry['actor_user_id'] ?? null,
                'actor_role'           => $entry['actor_role'] ?? null,
                'version_number'       => $version,
                'before_state'         => $entry['before_state'] ?? null,
                'after_state'          => $entry['after_state'] ?? null,
                'occurred_at'          => $entry['occurred_at'] ?? null,
                'metadata'             => $entry['metadata'] ?? [],
            ];
        }

        return [
            'total_events'     => count($timeline),
            'timeline'         => $timeline,
            'version_lineages' => $versionLineages,
            'is_complete'      => count($timeline) > 0,
        ];
    }
}
