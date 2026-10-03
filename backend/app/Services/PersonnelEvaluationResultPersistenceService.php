<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelEvaluationResultPersistenceService
 *
 * Authoritative Evaluation Result Separation, Persistence & Presentation Engine (Plan H — Phase H1).
 * Consumes the authoritative Plan F evaluation outcome via the Plan H0 Finalization Readiness Gate
 * and persists/presents it strictly as 'Passed' or 'Retained' while keeping it completely separated
 * from later Promotion Decisions (Phase H3).
 *
 * Core Governance Invariants:
 * 1. Vocabulary is strictly two values: 'Passed' or 'Retained'.
 * 2. Passed means the evaluation passed only; it does NOT automatically mean promotion.
 * 3. Retained preserves the candidate's current rank and title without demotion.
 * 4. Evaluation Result and Promotion Decision are distinct, non-conflated facts.
 * 5. Phase H1 executes ZERO rank mutations (no writes to current_rank, next_rank, or approved_rank).
 * 6. Client-provided results, totals, or promotion fields are strictly ignored/rejected.
 * 7. Result recording is idempotent and historically stable across rule version configurations.
 * 8. Only authorized HR actors (hr_staff, hr_admin) have authority to record evaluation results.
 */
class PersonnelEvaluationResultPersistenceService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const RESULT_PASSED = 'Passed';
    public const RESULT_RETAINED = 'Retained';

    public const STATUS_FINALIZED = 'finalized';
    public const STATUS_PENDING = 'pending';

    public const SOURCE_PLAN_F = 'plan_f';

    public const REASON_FINALIZATION_PRECONDITIONS_NOT_MET = 'finalization_preconditions_not_met';
    public const REASON_RESULT_RECORDED_SUCCESSFULLY = 'result_recorded_successfully';
    public const REASON_RESULT_ALREADY_RECORDED = 'result_already_recorded';
    public const REASON_UNAUTHORIZED_HR_ACTOR = 'unauthorized_hr_actor';
    public const REASON_FORGED_RESULT_IGNORED = 'forged_result_ignored';

    protected PersonnelEvaluationFinalizationReadinessService $readinessService;
    protected PersonnelEvaluationResultService $resultService;

    public function __construct(
        ?PersonnelEvaluationFinalizationReadinessService $readinessService = null,
        ?PersonnelEvaluationResultService $resultService = null
    ) {
        $this->readinessService = $readinessService ?? new PersonnelEvaluationFinalizationReadinessService();
        $this->resultService = $resultService ?? new PersonnelEvaluationResultService();
    }

    /**
     * Validates whether an authenticated actor has HR authority to record evaluation results.
     */
    public function validateHRAccess(array $actor): bool
    {
        $roles = isset($actor['roles']) && is_array($actor['roles'])
            ? $actor['roles']
            : (isset($actor['role']) ? [$actor['role']] : []);

        if (in_array('hr_staff', $roles, true) || in_array('hr_admin', $roles, true)) {
            return true;
        }

        throw new RuntimeException('Access Denied (403): Only authorized HR personnel may record Plan H evaluation results.', 403);
    }

    /**
     * Validates that the evaluation result is strictly within canonical vocabulary.
     */
    public function validateResultVocabulary(string $result): void
    {
        if ($result !== self::RESULT_PASSED && $result !== self::RESULT_RETAINED) {
            throw new InvalidArgumentException("Invalid Evaluation Result [{$result}]. Only 'Passed' or 'Retained' are allowed in Plan H.", 422);
        }
    }

    /**
     * Authoritatively records the Plan F Evaluation Result after verifying the Plan H0 Pre-Finalization Gate.
     *
     * @param array $params [
     *   'evaluation_record' => array,
     *   'snapshot_data' => array,
     *   'area_a_inputs' => ?array,
     *   'actor' => ?array,
     *   'active_cycle_evaluations' => array,
     *   'existing_result_record' => ?array,
     *   'client_payload' => ?array (tested for tampering rejection)
     * ]
     * @return array Standardized H1 Evaluation Result DTO
     */
    public function recordEvaluationResult(array $params): array
    {
        $evaluationRecord = $params['evaluation_record'] ?? [];
        $snapshotData = $params['snapshot_data'] ?? [];
        $areaAInputs = $params['area_a_inputs'] ?? null;
        $actor = $params['actor'] ?? null;
        $activeCycleEvaluations = $params['active_cycle_evaluations'] ?? [];
        $existingResultRecord = $params['existing_result_record'] ?? null;
        $clientPayload = $params['client_payload'] ?? [];

        // 1. Authorize HR Actor
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        $evaluationId = $evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? null;
        $personnelProfileId = $evaluationRecord['personnel_profile_id'] ?? null;

        // 2. Idempotency Check: If already finalized, return the existing stable result DTO
        if ($existingResultRecord !== null && !empty($existingResultRecord['evaluation_result'])) {
            return $this->buildIdempotentResponse($existingResultRecord, $evaluationRecord);
        }

        // 3. Execute Phase H0 Pre-Finalization Readiness Gate
        $readiness = $this->readinessService->canFinalize(
            $evaluationRecord,
            $snapshotData,
            $areaAInputs,
            $actor,
            $activeCycleEvaluations
        );

        if (!$readiness['ready_for_finalization']) {
            throw new RuntimeException(
                "Cannot record evaluation result: Finalization preconditions not met. Reason: [{$readiness['reason_code']}] - {$readiness['message']}",
                422
            );
        }

        // 4. Extract Authoritative Scoring & Result from Plan F via H0 Gate
        $evaluationResult = $readiness['evaluation_result'] ?? ($readiness['plan_f_result']['final_result'] ?? null);
        $this->validateResultVocabulary($evaluationResult);

        $finalAcceptedTotal = (float) ($readiness['official_accepted_total'] ?? ($readiness['plan_f_result']['final_accepted_total'] ?? 0.0));
        $passingScore = (float) ($readiness['passing_score'] ?? ($readiness['plan_f_result']['passing_score'] ?? 0.0));
        $maximumScore = (float) ($readiness['maximum_score'] ?? ($readiness['plan_f_result']['maximum_score'] ?? 0.0));
        $scaleCode = $readiness['evaluation_scale_code'] ?? ($readiness['plan_f_result']['scale_code'] ?? null);
        $ruleVersion = $readiness['rule_version'] ?? ($readiness['plan_f_result']['rule_version'] ?? self::RULE_VERSION);
        $explanation = (
            $evaluationResult === self::RESULT_PASSED
                ? sprintf("Final accepted total %.2f meets or exceeds the required passing score of %.2f.", $finalAcceptedTotal, $passingScore)
                : sprintf("Final accepted total %.2f is below the required passing score of %.2f.", $finalAcceptedTotal, $passingScore)
        );

        // 5. Client Tampering Defense: Discard any client-submitted evaluation_result, totals, or rank modifications
        // The authoritative result is strictly derived from readiness / Plan F.

        $recordedAt = date('c');
        $recordedBy = $actor['profile_id'] ?? $actor['id'] ?? 'system_hr';

        // 6. Build Standardized Phase H1 Result Record
        $resultRecord = [
            'evaluation_id' => $evaluationId,
            'personnel_profile_id' => $personnelProfileId,
            'evaluation_result' => $evaluationResult,
            'final_accepted_total' => $finalAcceptedTotal,
            'passing_score' => $passingScore,
            'maximum_score' => $maximumScore,
            'evaluation_scale_code' => $scaleCode,
            'rule_version' => $ruleVersion,
            'result_explanation' => $explanation,
            'result_status' => self::STATUS_FINALIZED,
            'source' => self::SOURCE_PLAN_F,
            'recorded_by' => $recordedBy,
            'recorded_at' => $recordedAt,
            // Strict Separation Invariant: Promotion decision is not recorded in H1
            'promotion_decision' => null,
            'is_promoted' => false,
            // Strict Rank Guard: Candidate rank remains completely unchanged
            'current_rank' => $evaluationRecord['current_rank'] ?? null,
            'rank_mutation_applied' => false
        ];

        return [
            'success' => true,
            'status' => self::STATUS_FINALIZED,
            'reason_code' => self::REASON_RESULT_RECORDED_SUCCESSFULLY,
            'message' => "Authoritative evaluation result [{$evaluationResult}] successfully recorded for evaluation [{$evaluationId}].",
            'result' => $resultRecord,
            'read_model' => $this->formatPresentationReadModel($resultRecord, $evaluationRecord)
        ];
    }

    /**
     * Formats the presentation read model for HR and Candidate UI.
     */
    public function formatPresentationReadModel(array $resultRecord, array $evaluationRecord): array
    {
        $evaluationResult = $resultRecord['evaluation_result'];
        $currentRank = $evaluationRecord['current_rank'] ?? 'Unassigned';

        $deliberationNotice = $evaluationResult === self::RESULT_PASSED
            ? 'Evaluation passed. Eligible to proceed to deliberation under Plan H.'
            : 'Current rank/title retained. No rank adjustment required.';

        return [
            'evaluation_id' => $resultRecord['evaluation_id'],
            'personnel_profile_id' => $resultRecord['personnel_profile_id'],
            'evaluation_result' => $evaluationResult,
            'final_accepted_total' => (float) $resultRecord['final_accepted_total'],
            'passing_score' => (float) $resultRecord['passing_score'],
            'maximum_score' => (float) $resultRecord['maximum_score'],
            'evaluation_scale_code' => $resultRecord['evaluation_scale_code'],
            'rule_version' => $resultRecord['rule_version'],
            'result_explanation' => $resultRecord['result_explanation'],
            'deliberation_notice' => $deliberationNotice,
            'current_rank' => $currentRank,
            'promotion_decision_status' => 'pending_deliberation_phase_h3',
            'promotion_decision' => null,
            'recorded_at' => $resultRecord['recorded_at']
        ];
    }

    /**
     * Handles idempotent retrieval of already persisted evaluation results.
     */
    protected function buildIdempotentResponse(array $existingResult, array $evaluationRecord): array
    {
        return [
            'success' => true,
            'status' => self::STATUS_FINALIZED,
            'reason_code' => self::REASON_RESULT_ALREADY_RECORDED,
            'message' => "Authoritative evaluation result was previously recorded and is historically locked.",
            'result' => $existingResult,
            'read_model' => $this->formatPresentationReadModel($existingResult, $evaluationRecord)
        ];
    }
}
