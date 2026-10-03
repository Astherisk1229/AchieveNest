<?php

namespace App\Services;

use InvalidArgumentException;

/**
 * Class PersonnelWorkflowEventRegistry
 *
 * Authoritative Canonical Status & Event Registry for Plan J — Phase J1.
 * Centralizes all internal status keys, user-facing display labels, evaluation result
 * vocabulary, promotion decision vocabulary, canonical event keys, and idempotency rules.
 */
class PersonnelWorkflowEventRegistry
{
    // =========================================================================
    // 1. Canonical Lifecycle Statuses (5 Only)
    // =========================================================================
    public const STATUS_SUBMITTED              = 'submitted';
    public const STATUS_IN_EVALUATION          = 'in_evaluation';
    public const STATUS_RETURNED_FOR_REVISION  = 'returned_for_revision';
    public const STATUS_READY_FOR_FINALIZATION = 'ready_for_finalization';
    public const STATUS_COMPLETED              = 'completed';

    public const CANONICAL_STATUSES = [
        self::STATUS_SUBMITTED,
        self::STATUS_IN_EVALUATION,
        self::STATUS_RETURNED_FOR_REVISION,
        self::STATUS_READY_FOR_FINALIZATION,
        self::STATUS_COMPLETED,
    ];

    // =========================================================================
    // 2. User-Facing Display Labels
    // =========================================================================
    public const STATUS_DISPLAY_LABELS = [
        self::STATUS_SUBMITTED              => 'Submitted for Review',
        self::STATUS_IN_EVALUATION          => 'Under Review',
        self::STATUS_RETURNED_FOR_REVISION  => 'Returned for Revision',
        self::STATUS_READY_FOR_FINALIZATION => 'Ready for Finalization',
        self::STATUS_COMPLETED              => 'Completed / Finalized',
    ];

    // =========================================================================
    // 3. Canonical Evaluation Results (Plan F / Plan J)
    // =========================================================================
    public const RESULT_PASSED   = 'Passed';
    public const RESULT_RETAINED = 'Retained';

    public const EVALUATION_RESULTS = [
        self::RESULT_PASSED,
        self::RESULT_RETAINED,
    ];

    // =========================================================================
    // 4. Canonical Promotion Decisions (Plan H / Plan J)
    // =========================================================================
    public const PROMOTION_APPROVED     = 'Approved';
    public const PROMOTION_NOT_APPROVED = 'Not Approved';

    public const PROMOTION_DECISIONS = [
        self::PROMOTION_APPROVED,
        self::PROMOTION_NOT_APPROVED,
    ];

    // =========================================================================
    // 5. Canonical Material Workflow Events
    // =========================================================================
    public const EVENT_ACHIEVEMENT_UPLOAD_SAVED          = 'achievement_upload_saved';
    public const EVENT_PORTFOLIO_SUBMITTED               = 'portfolio_submitted';
    public const EVENT_REVIEW_STARTED                    = 'review_started';
    public const EVENT_QUALIFICATION_STATE_CHANGED       = 'qualification_state_changed';
    public const EVENT_REVISION_REQUESTED                = 'revision_requested';
    public const EVENT_PORTFOLIO_RESUBMITTED             = 'portfolio_resubmitted';
    public const EVENT_EVALUATION_RESULT_RECORDED        = 'evaluation_result_recorded';
    public const EVENT_EVALUATION_READY_FOR_FINALIZATION = 'evaluation_ready_for_finalization';
    public const EVENT_EVALUATION_FINALIZED              = 'evaluation_finalized';
    public const EVENT_SUMMARY_AVAILABLE                 = 'summary_available';
    public const EVENT_REVIEWER_ASSIGNED                 = 'reviewer_assigned';
    public const EVENT_EVALUATION_SCALE_OVERRIDDEN       = 'evaluation_scale_overridden';
    public const EVENT_PROMOTION_DECISION_RECORDED       = 'promotion_decision_recorded';
    public const EVENT_APPROVED_RANK_APPLIED             = 'approved_rank_applied';
    public const EVENT_PORTFOLIO_PURGED                  = 'portfolio_purged';

    public const CANONICAL_EVENTS = [
        self::EVENT_ACHIEVEMENT_UPLOAD_SAVED,
        self::EVENT_PORTFOLIO_SUBMITTED,
        self::EVENT_REVIEW_STARTED,
        self::EVENT_QUALIFICATION_STATE_CHANGED,
        self::EVENT_REVISION_REQUESTED,
        self::EVENT_PORTFOLIO_RESUBMITTED,
        self::EVENT_EVALUATION_RESULT_RECORDED,
        self::EVENT_EVALUATION_READY_FOR_FINALIZATION,
        self::EVENT_EVALUATION_FINALIZED,
        self::EVENT_SUMMARY_AVAILABLE,
        self::EVENT_REVIEWER_ASSIGNED,
        self::EVENT_EVALUATION_SCALE_OVERRIDDEN,
        self::EVENT_PROMOTION_DECISION_RECORDED,
        self::EVENT_APPROVED_RANK_APPLIED,
        self::EVENT_PORTFOLIO_PURGED,
    ];

    // =========================================================================
    // 6. Required Metadata Schema per Event Key
    // =========================================================================
    public const REQUIRED_METADATA_KEYS = [
        self::EVENT_PORTFOLIO_SUBMITTED => ['version_number', 'total_items'],
        self::EVENT_PORTFOLIO_RESUBMITTED => ['version_number', 'prior_version_number'],
        self::EVENT_REVISION_REQUESTED => ['reason', 'required_corrections'],
        self::EVENT_EVALUATION_SCALE_OVERRIDDEN => ['original_scale', 'overridden_scale', 'reason'],
        self::EVENT_EVALUATION_RESULT_RECORDED => ['evaluation_result', 'total_score', 'scale_code'],
        self::EVENT_PROMOTION_DECISION_RECORDED => ['promotion_decision', 'current_rank'],
        self::EVENT_APPROVED_RANK_APPLIED => ['previous_rank', 'new_rank'],
        self::EVENT_REVIEWER_ASSIGNED => ['reviewer_id', 'reviewer_role'],
        self::EVENT_PORTFOLIO_PURGED => ['target_profile_id', 'purged_by_role'],
    ];

    /**
     * Validates if a status string is a canonical lifecycle status.
     */
    public static function isValidStatus(string $status): bool
    {
        return in_array($status, self::CANONICAL_STATUSES, true);
    }

    /**
     * Resolves human-readable display label for an internal status key.
     */
    public static function getStatusDisplayLabel(string $status): string
    {
        return self::STATUS_DISPLAY_LABELS[$status] ?? ucfirst(str_replace('_', ' ', $status));
    }

    /**
     * Validates if an event key is a canonical workflow event.
     */
    public static function isValidEvent(string $eventKey): bool
    {
        return in_array($eventKey, self::CANONICAL_EVENTS, true);
    }

    /**
     * Validates that an event payload contains all required metadata keys.
     *
     * @param string $eventKey
     * @param array $metadata
     * @throws InvalidArgumentException
     */
    public static function validateRequiredMetadata(string $eventKey, array $metadata): void
    {
        if (!self::isValidEvent($eventKey)) {
            throw new InvalidArgumentException("Invalid event key: [{$eventKey}]");
        }

        $required = self::REQUIRED_METADATA_KEYS[$eventKey] ?? [];
        foreach ($required as $field) {
            if (!array_key_exists($field, $metadata) || $metadata[$field] === null || $metadata[$field] === '') {
                throw new InvalidArgumentException("Missing required metadata field [{$field}] for event [{$eventKey}]");
            }
        }
    }

    /**
     * Composes a deterministic idempotency key for an event.
     */
    public static function generateIdempotencyKey(
        string $eventKey,
        ?string $evaluationId = null,
        ?int $versionNumber = null,
        ?string $transitionNonce = null
    ): string {
        $parts = [$eventKey];
        if ($evaluationId) {
            $parts[] = $evaluationId;
        }
        if ($versionNumber !== null) {
            $parts[] = 'v' . $versionNumber;
        }
        if ($transitionNonce) {
            $parts[] = $transitionNonce;
        }
        return implode(':', $parts);
    }
}
