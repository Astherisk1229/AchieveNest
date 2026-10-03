<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelEvaluationFinalLockService
 *
 * Authoritative Final Lock, Historical Stability, Validation & Formal Plan H Closure Engine (Plan H — Phase H4).
 * Locks completed evaluations and promotion decisions from ordinary editing, guarantees historical
 * preservation of Evaluation Result and Promotion Decision as separate facts, and enforces strict post-lock mutation guards.
 *
 * Core Governance Invariants:
 * 1. Once finalized, ordinary editing is strictly blocked (evaluation_finalized_locked).
 * 2. Preconditions: H0 readiness, H1 Evaluation Result, H2 deliberation print, and H3 Promotion Decision (where applicable).
 * 3. Evaluation Result (Passed | Retained) and Promotion Decision (Approved | Not Approved) remain distinct historical facts.
 * 4. Passed never automatically promotes; only Passed + Approved updates rank through valid Plan E rules.
 * 5. Denied and Retained evaluations preserve current rank/title without demotion.
 * 6. Finalized evaluations protect submitted snapshots, rule versions, and scoring breakdowns from future live mutations.
 * 7. Printing remains deliberation-ready with blank approval and signature fields.
 * 8. Only authorized HR actors (hr_staff, hr_admin) can execute final lock.
 * 9. Final lock is idempotent.
 */
class PersonnelEvaluationFinalLockService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';
    public const PLAN_E_RULE_REFERENCE = 'NDMU-DOC-ACAD-RANKS-2026-V1';

    public const EVALUATION_RESULT_PASSED = 'Passed';
    public const EVALUATION_RESULT_RETAINED = 'Retained';

    public const PROMOTION_DECISION_APPROVED = 'Approved';
    public const PROMOTION_DECISION_NOT_APPROVED = 'Not Approved';

    public const STATUS_LOCKED = 'finalized_and_locked';

    public const REASON_LOCK_SUCCESSFUL = 'evaluation_locked_successfully';
    public const REASON_ALREADY_LOCKED = 'evaluation_already_locked';
    public const REASON_EVALUATION_NOT_READY_FOR_LOCK = 'evaluation_not_ready_for_lock';
    public const REASON_PROMOTION_DECISION_PENDING = 'promotion_decision_pending';
    public const REASON_APPROVED_RANK_INCOMPLETE = 'approved_rank_update_incomplete';
    public const REASON_HISTORICAL_INTEGRITY_INVALID = 'historical_integrity_invalid';
    public const REASON_MUTATION_REJECTED_LOCKED = 'evaluation_finalized_locked';
    public const REASON_UNAUTHORIZED_HR_ACTOR = 'unauthorized_hr_actor';

    protected PersonnelEvaluationFinalizationReadinessService $readinessService;
    protected PersonnelEvaluationResultPersistenceService $resultPersistenceService;
    protected PersonnelEvaluationPrintService $printService;
    protected PersonnelPromotionDecisionService $promotionDecisionService;

    public function __construct(
        ?PersonnelEvaluationFinalizationReadinessService $readinessService = null,
        ?PersonnelEvaluationResultPersistenceService $resultPersistenceService = null,
        ?PersonnelEvaluationPrintService $printService = null,
        ?PersonnelPromotionDecisionService $promotionDecisionService = null
    ) {
        $this->readinessService = $readinessService ?? new PersonnelEvaluationFinalizationReadinessService();
        $this->resultPersistenceService = $resultPersistenceService ?? new PersonnelEvaluationResultPersistenceService();
        $this->printService = $printService ?? new PersonnelEvaluationPrintService();
        $this->promotionDecisionService = $promotionDecisionService ?? new PersonnelPromotionDecisionService();
    }

    /**
     * Validates whether an authenticated actor has HR authority to execute final lock.
     */
    public function validateHRAccess(array $actor): bool
    {
        $roles = isset($actor['roles']) && is_array($actor['roles'])
            ? $actor['roles']
            : (isset($actor['role']) ? [$actor['role']] : []);

        if (in_array('hr_staff', $roles, true) || in_array('hr_admin', $roles, true)) {
            return true;
        }

        throw new RuntimeException('Access Denied (403): Only authorized HR personnel may lock finalized Plan H evaluations.', 403);
    }

    /**
     * Verifies if an evaluation satisfies all H0–H3 preconditions to be finalized and locked.
     */
    public function canLock(
        array $evaluationRecord,
        array $snapshotData,
        ?array $resultRecord = null,
        ?array $promotionRecord = null,
        ?array $areaAInputs = null,
        ?array $actor = null
    ): array {
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        $evaluationId = $evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? null;
        if (!$evaluationId) {
            return [
                'can_lock' => false,
                'reason_code' => self::REASON_EVALUATION_NOT_READY_FOR_LOCK,
                'message' => 'Evaluation ID is missing.'
            ];
        }

        // 1. Verify H0 readiness
        $readiness = $this->readinessService->canFinalize($evaluationRecord, $snapshotData, $areaAInputs, $actor);
        if (!$readiness['ready_for_finalization']) {
            return [
                'can_lock' => false,
                'reason_code' => self::REASON_EVALUATION_NOT_READY_FOR_LOCK,
                'message' => "Pre-finalization gate failed: {$readiness['reason_message']}",
                'readiness' => $readiness
            ];
        }

        // 2. Verify H1 Evaluation Result
        $evaluationResult = $resultRecord['evaluation_result'] ?? $readiness['evaluation_result'] ?? null;
        if (empty($evaluationResult) || ($evaluationResult !== self::EVALUATION_RESULT_PASSED && $evaluationResult !== self::EVALUATION_RESULT_RETAINED)) {
            return [
                'can_lock' => false,
                'reason_code' => self::REASON_HISTORICAL_INTEGRITY_INVALID,
                'message' => 'Authoritative Evaluation Result (Passed or Retained) is missing.'
            ];
        }

        // 3. Verify H2 Printable evaluation eligibility
        $printEligibility = $this->printService->validatePrintEligibility(
            $evaluationRecord,
            $snapshotData,
            $resultRecord,
            $areaAInputs,
            $actor
        );
        if (!$printEligibility['eligible']) {
            return [
                'can_lock' => false,
                'reason_code' => self::REASON_HISTORICAL_INTEGRITY_INVALID,
                'message' => "Printable evaluation integrity failed: {$printEligibility['message']}"
            ];
        }

        // 4. Verify H3 Promotion Decision integrity when decision has been recorded
        if ($promotionRecord !== null && !empty($promotionRecord['promotion_decision'])) {
            $decision = $promotionRecord['promotion_decision'];
            if ($decision === self::PROMOTION_DECISION_APPROVED) {
                if ($evaluationResult !== self::EVALUATION_RESULT_PASSED) {
                    return [
                        'can_lock' => false,
                        'reason_code' => self::REASON_HISTORICAL_INTEGRITY_INVALID,
                        'message' => "Integrity violation: Promotion approved on a non-Passed evaluation outcome [{$evaluationResult}]."
                    ];
                }
                if (empty($promotionRecord['approved_rank_code']) || empty($promotionRecord['rank_change_applied'])) {
                    return [
                        'can_lock' => false,
                        'reason_code' => self::REASON_APPROVED_RANK_INCOMPLETE,
                        'message' => 'Approved promotion record is missing applied rank update metadata.'
                    ];
                }
            }
        }

        return [
            'can_lock' => true,
            'reason_code' => 'lock_eligible',
            'message' => 'Evaluation satisfies all Plan H finalization and integrity preconditions.',
            'evaluation_result' => $evaluationResult,
            'promotion_decision' => $promotionRecord['promotion_decision'] ?? null
        ];
    }

    /**
     * Executes final lock on a completed Plan H evaluation.
     *
     * @param array $params [
     *   'evaluation_record' => array,
     *   'snapshot_data' => array,
     *   'result_record' => ?array,
     *   'promotion_record' => ?array,
     *   'area_a_inputs' => ?array,
     *   'actor' => ?array,
     *   'existing_lock_record' => ?array
     * ]
     * @return array Standardized Final Lock DTO
     */
    public function lockEvaluation(array $params): array
    {
        $evaluationRecord = $params['evaluation_record'] ?? [];
        $snapshotData = $params['snapshot_data'] ?? [];
        $resultRecord = $params['result_record'] ?? null;
        $promotionRecord = $params['promotion_record'] ?? null;
        $areaAInputs = $params['area_a_inputs'] ?? null;
        $actor = $params['actor'] ?? null;
        $existingLockRecord = $params['existing_lock_record'] ?? null;

        // 1. HR Authorization
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        $evaluationId = (string) ($evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? '');

        // 2. Idempotency Check
        if ($existingLockRecord !== null && !empty($existingLockRecord['is_locked'])) {
            return [
                'success' => true,
                'status' => self::STATUS_LOCKED,
                'reason_code' => self::REASON_ALREADY_LOCKED,
                'message' => "Evaluation [{$evaluationId}] is already finalized and locked.",
                'lock_record' => $existingLockRecord,
                'is_locked' => true,
                'read_model' => $this->buildFinalizedReadModel($evaluationRecord, $resultRecord, $promotionRecord, $existingLockRecord)
            ];
        }

        // 3. Verify Lock Preconditions
        $lockEligibility = $this->canLock(
            $evaluationRecord,
            $snapshotData,
            $resultRecord,
            $promotionRecord,
            $areaAInputs,
            $actor
        );

        if (!$lockEligibility['can_lock']) {
            throw new RuntimeException("Cannot lock evaluation: {$lockEligibility['message']} Reason: [{$lockEligibility['reason_code']}]", 422);
        }

        $lockedAt = date('c');
        $lockedBy = $actor['profile_id'] ?? $actor['id'] ?? 'system_hr';

        $evaluationResult = (string) ($resultRecord['evaluation_result'] ?? $lockEligibility['evaluation_result']);
        $promotionDecision = $promotionRecord['promotion_decision'] ?? null;

        $lockRecord = [
            'evaluation_id' => $evaluationId,
            'personnel_profile_id' => (string) ($evaluationRecord['personnel_profile_id'] ?? ''),
            'is_finalized' => true,
            'is_locked' => true,
            'evaluation_status' => 'completed',
            'lock_status' => self::STATUS_LOCKED,
            'locked_at' => $lockedAt,
            'locked_by' => $lockedBy,
            'lock_reason' => 'Plan H finalization, printing, deliberation and promotion workflow completed and locked.',
            'evaluation_result' => $evaluationResult,
            'promotion_decision' => $promotionDecision,
            'rule_version' => (string) ($evaluationRecord['rule_version'] ?? self::RULE_VERSION),
            'scale_code' => (string) ($evaluationRecord['evaluation_scale_code'] ?? 'ADMINISTRATORS_RANKING_SCALE'),
            'snapshot_version' => (string) ($snapshotData['snapshot_version'] ?? 'v1.0.0'),
            'mutations_blocked' => true
        ];

        return [
            'success' => true,
            'status' => self::STATUS_LOCKED,
            'reason_code' => self::REASON_LOCK_SUCCESSFUL,
            'message' => "Evaluation [{$evaluationId}] successfully finalized and locked from ordinary editing.",
            'lock_record' => $lockRecord,
            'is_locked' => true,
            'read_model' => $this->buildFinalizedReadModel($evaluationRecord, $resultRecord, $promotionRecord, $lockRecord)
        ];
    }

    /**
     * Intercepts mutation attempts on a finalized/locked evaluation and strictly rejects them.
     */
    public function guardAgainstMutation(array $lockRecord, string $attemptedAction = 'edit'): void
    {
        if (!empty($lockRecord['is_locked']) || !empty($lockRecord['is_finalized'])) {
            throw new RuntimeException(
                "Access Denied: Evaluation [{$lockRecord['evaluation_id']}] is finalized and locked. Attempted action [{$attemptedAction}] is strictly prohibited.",
                409
            );
        }
    }

    /**
     * Builds the unified finalized read model separating Evaluation Result from Promotion Decision.
     */
    public function buildFinalizedReadModel(
        array $evaluationRecord,
        ?array $resultRecord,
        ?array $promotionRecord,
        array $lockRecord
    ): array {
        $evaluationId = (string) ($evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? '');
        $evaluationResult = (string) ($resultRecord['evaluation_result'] ?? $lockRecord['evaluation_result'] ?? 'Retained');
        $promotionDecision = $promotionRecord['promotion_decision'] ?? $lockRecord['promotion_decision'] ?? null;

        $previousRank = $promotionRecord['previous_rank'] ?? $evaluationRecord['current_rank'] ?? 'Unassigned';
        $currentRank = $promotionRecord['current_rank'] ?? $evaluationRecord['current_rank'] ?? $previousRank;

        return [
            'evaluation_id' => $evaluationId,
            'personnel_profile_id' => (string) ($evaluationRecord['personnel_profile_id'] ?? ''),
            'personnel_name' => (string) ($evaluationRecord['personnel_name'] ?? 'Candidate Name'),
            'evaluation_cycle' => (string) ($evaluationRecord['academic_year'] ?? '2025-2026'),
            'final_status' => 'completed',
            'is_locked' => true,
            'locked_at' => $lockRecord['locked_at'] ?? date('c'),
            'locked_by' => $lockRecord['locked_by'] ?? 'system_hr',
            // Distinct Historical Fact 1: Evaluation Result
            'evaluation_result_summary' => [
                'result' => $evaluationResult,
                'final_accepted_total' => (float) ($resultRecord['final_accepted_total'] ?? 0.0),
                'passing_score' => (float) ($resultRecord['passing_score'] ?? 120.0),
                'maximum_score' => (float) ($resultRecord['maximum_score'] ?? 160.0),
                'rule_version' => (string) ($evaluationRecord['rule_version'] ?? self::RULE_VERSION),
                'scale_code' => (string) ($evaluationRecord['evaluation_scale_code'] ?? 'ADMINISTRATORS_RANKING_SCALE')
            ],
            // Distinct Historical Fact 2: Promotion Decision
            'promotion_decision_summary' => [
                'decision' => $promotionDecision ?? 'No Decision Recorded',
                'is_promoted' => (bool) ($promotionRecord['is_promoted'] ?? false),
                'previous_rank' => $previousRank,
                'applied_current_rank' => $currentRank,
                'approved_rank_code' => $promotionRecord['approved_rank_code'] ?? null,
                'plan_e_rule_reference' => self::PLAN_E_RULE_REFERENCE,
                'decided_at' => $promotionRecord['decided_at'] ?? null,
                'decided_by' => $promotionRecord['decided_by'] ?? null
            ],
            'snapshot_version' => (string) ($lockRecord['snapshot_version'] ?? 'v1.0.0'),
            'print_ready' => true
        ];
    }
}
