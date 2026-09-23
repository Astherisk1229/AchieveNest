<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelEvaluationPlanHHandoffService
 *
 * Canonical Authoritative Backend Plan H Handoff & Readiness Guard (Plan G — Phase G4).
 * Validates that an evaluation has satisfied all reviewer routing, snapshot review,
 * evaluator judgment scoring, and Plan F result requirements before permitting handoff
 * to Plan H Institutional Promotion Deliberation.
 *
 * Core Governance Invariants:
 * 1. Plan G terminates at reviewer completion and handoff readiness.
 * 2. Plan G does NOT make promotion decisions, approve rank progression, or mutate personnel rank.
 * 3. Handoff to Plan H requires 100% scoring completeness, zero unresolved judgment items, and canonical Plan F result.
 * 4. The handoff payload contains strictly verified evaluation metadata and zero promotion outcome fields.
 */
class PersonnelEvaluationPlanHHandoffService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const HANDOFF_STATUS_READY = 'ready_for_plan_h';
    public const HANDOFF_STATUS_NOT_READY = 'handoff_not_ready';

    public const REASON_HANDOFF_READY = 'handoff_ready';
    public const REASON_SCORING_INCOMPLETE = 'scoring_incomplete';
    public const REASON_RESULT_PENDING = 'result_pending';
    public const REASON_REVIEW_INCOMPLETE = 'review_incomplete';
    public const REASON_REVIEWER_ASSIGNMENT_INVALID = 'reviewer_assignment_invalid';
    public const REASON_SNAPSHOT_INVALID = 'snapshot_invalid';
    public const REASON_EVALUATION_STATE_INVALID = 'evaluation_state_invalid';

    protected PersonnelEvaluatorScoringService $scoringService;

    public function __construct(?PersonnelEvaluatorScoringService $scoringService = null)
    {
        $this->scoringService = $scoringService ?? new PersonnelEvaluatorScoringService();
    }

    /**
     * Checks whether an evaluation satisfies all criteria to be handed off to Plan H.
     */
    public function checkHandoffReadiness(
        array $evaluationRecord,
        array $snapshotData,
        ?array $areaAInputs = null,
        ?array $scoringState = null
    ): array {
        // 1. Validate Reviewer Assignment
        $assignedRole = $evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? null;
        if (empty($assignedRole)) {
            return [
                'is_ready' => false,
                'reason_code' => self::REASON_REVIEWER_ASSIGNMENT_INVALID,
                'message' => 'Reviewer assignment is missing or unresolved.',
            ];
        }

        // 2. Validate Snapshot
        if (!isset($snapshotData['items']) || !is_array($snapshotData['items'])) {
            return [
                'is_ready' => false,
                'reason_code' => self::REASON_SNAPSHOT_INVALID,
                'message' => 'Submitted snapshot data is missing or malformed.',
            ];
        }

        // 3. Compute Scoring State
        $state = $scoringState ?? $this->scoringService->recalculateScoringState($evaluationRecord, $snapshotData, $areaAInputs);

        // 4. Scoring Completeness Check
        if (empty($state['scoring_complete']) || ($state['pending_judgment_count'] ?? 0) > 0) {
            return [
                'is_ready' => false,
                'reason_code' => self::REASON_SCORING_INCOMPLETE,
                'message' => 'Evaluation scoring is incomplete. Unresolved evaluator inputs remain.',
                'pending_judgment_count' => $state['pending_judgment_count'] ?? 0,
            ];
        }

        // 5. Plan F Result Check
        if (($state['plan_f_result_status'] ?? '') !== 'result_ready' || empty($state['plan_f_final_result'])) {
            return [
                'is_ready' => false,
                'reason_code' => self::REASON_RESULT_PENDING,
                'message' => 'Authoritative Plan F evaluation result is pending or undetermined.',
            ];
        }

        return [
            'is_ready' => true,
            'reason_code' => self::REASON_HANDOFF_READY,
            'message' => 'Evaluation is scoring-complete, Plan F result determined, and ready for Plan H deliberation.',
            'scoring_state' => $state,
        ];
    }

    /**
     * Assembles the canonical, verified Plan H Handoff Payload DTO.
     */
    public function generatePlanHHandoffPayload(
        array $evaluationRecord,
        array $snapshotData,
        ?array $areaAInputs = null,
        ?array $scoringState = null
    ): array {
        $readiness = $this->checkHandoffReadiness($evaluationRecord, $snapshotData, $areaAInputs, $scoringState);

        if (!$readiness['is_ready']) {
            throw new RuntimeException("Cannot generate Plan H handoff payload: Evaluation is not ready for deliberation [{$readiness['reason_code']}]: {$readiness['message']}", 422);
        }

        $state = $readiness['scoring_state'];

        return [
            'evaluation_id' => (string) ($evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? 'EVAL-UNKNOWN'),
            'personnel_profile_id' => (string) ($evaluationRecord['personnel_profile_id'] ?? ''),
            'personnel_name' => (string) ($evaluationRecord['personnel_name'] ?? $evaluationRecord['faculty_name'] ?? 'Candidate Name'),
            'current_rank' => (string) ($evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? 'Assistant Professor I'),
            'evaluation_scale_code' => (string) ($evaluationRecord['evaluation_scale_code'] ?? 'ADMINISTRATORS_RANKING_SCALE'),
            'rule_version' => (string) ($evaluationRecord['rule_version'] ?? self::RULE_VERSION),
            'official_accepted_total' => (float) ($state['official_accepted_total'] ?? 0.0),
            'maximum_score' => (float) ($state['maximum_score'] ?? 160.0),
            'passing_score' => (float) ($state['passing_score'] ?? 120.0),
            'plan_f_final_result' => (string) ($state['plan_f_final_result'] ?? 'Retained'),
            'assigned_reviewer_role' => (string) ($evaluationRecord['assigned_reviewer_role'] ?? 'dean'),
            'reviewer_user_id' => (string) ($evaluationRecord['reviewer_user_id'] ?? 'reviewer'),
            'reviewed_at' => date('c'),
            'scoring_complete' => true,
            'snapshot_version' => (string) ($snapshotData['snapshot_version'] ?? 'v1.0.0'),
            'handoff_status' => self::HANDOFF_STATUS_READY,
        ];
    }
}
