<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelPromotionDecisionService
 *
 * Authoritative Post-Evaluation Deliberation, HR Promotion Decision & Approved Rank Update Engine (Plan H — Phase H3).
 * Manages post-evaluation deliberation, processes HR-recorded promotion decisions ('Approved' or 'Not Approved'),
 * preserves current rank for denied/retained cases, and applies approved rank updates strictly validated
 * against Plan E faculty rank progression rules and confirmed PhD exceptions.
 *
 * Core Governance Invariants:
 * 1. A Passed evaluation may proceed to deliberation, but Passed does NOT guarantee promotion.
 * 2. HR records the authoritative Promotion Decision ('Approved' or 'Not Approved').
 * 3. Evaluation Result ('Passed' | 'Retained') and Promotion Decision ('Approved' | 'Not Approved') are separate facts.
 * 4. Retained evaluations are ineligible for promotion and keep current rank/title.
 * 5. Not Approved decisions keep current rank/title without demotion.
 * 6. Approved decisions update rank/title ONLY through valid Plan E rank transitions (sequential or verified PhD exception).
 * 7. Unsupported jumps, lower-rank transitions, Part-Time faculty promotions, or unverified PhD exceptions are rejected.
 * 8. All approval/signature fields (President, Date) remain manual and are NEVER auto-filled.
 * 9. Only authorized HR personnel (hr_staff, hr_admin) have authority to record promotion decisions.
 * 10. Repeated promotion decision submissions are idempotent (zero double-promotions).
 */
class PersonnelPromotionDecisionService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';
    public const PLAN_E_RULE_REFERENCE = 'NDMU-DOC-ACAD-RANKS-2026-V1';

    public const EVALUATION_RESULT_PASSED = 'Passed';
    public const EVALUATION_RESULT_RETAINED = 'Retained';

    public const DECISION_APPROVED = 'Approved';
    public const DECISION_NOT_APPROVED = 'Not Approved';

    public const STATUS_DELIBERATION_READY = 'ready_for_deliberation';
    public const STATUS_DECIDED = 'promotion_decided';

    public const REASON_DECISION_RECORDED = 'promotion_decision_recorded_successfully';
    public const REASON_DECISION_ALREADY_RECORDED = 'promotion_decision_already_recorded';
    public const REASON_EVALUATION_NOT_READY = 'evaluation_not_ready_for_deliberation';
    public const REASON_RETAINED_INELIGIBLE = 'evaluation_result_not_eligible_for_promotion';
    public const REASON_INVALID_RANK_TRANSITION = 'invalid_rank_transition';
    public const REASON_PART_TIME_INELIGIBLE = 'part_time_not_eligible_for_promotion';
    public const REASON_UNSUPPORTED_PERSONNEL_GROUP = 'unsupported_personnel_group';
    public const REASON_UNAUTHORIZED_HR_ACTOR = 'unauthorized_hr_actor';

    protected PersonnelEvaluationFinalizationReadinessService $readinessService;
    protected PersonnelEvaluationResultPersistenceService $resultPersistenceService;
    protected FacultyRankProgressionService $rankProgressionService;
    protected FacultyRankCatalogService $rankCatalogService;

    public function __construct(
        ?PersonnelEvaluationFinalizationReadinessService $readinessService = null,
        ?PersonnelEvaluationResultPersistenceService $resultPersistenceService = null,
        ?FacultyRankProgressionService $rankProgressionService = null,
        ?FacultyRankCatalogService $rankCatalogService = null
    ) {
        $this->readinessService = $readinessService ?? new PersonnelEvaluationFinalizationReadinessService();
        $this->resultPersistenceService = $resultPersistenceService ?? new PersonnelEvaluationResultPersistenceService();
        $this->rankProgressionService = $rankProgressionService ?? new FacultyRankProgressionService();
        $this->rankCatalogService = $rankCatalogService ?? new FacultyRankCatalogService();
    }

    /**
     * Validates whether an authenticated actor has HR authority to record promotion decisions.
     */
    public function validateHRAccess(array $actor): bool
    {
        $roles = isset($actor['roles']) && is_array($actor['roles'])
            ? $actor['roles']
            : (isset($actor['role']) ? [$actor['role']] : []);

        if (in_array('hr_staff', $roles, true) || in_array('hr_admin', $roles, true)) {
            return true;
        }

        throw new RuntimeException('Access Denied (403): Only authorized HR personnel may record Plan H promotion decisions.', 403);
    }

    /**
     * Validates promotion decision vocabulary.
     */
    public function validateDecisionVocabulary(string $decision): void
    {
        if ($decision !== self::DECISION_APPROVED && $decision !== self::DECISION_NOT_APPROVED) {
            throw new InvalidArgumentException("Invalid Promotion Decision [{$decision}]. Allowed values are 'Approved' or 'Not Approved'.", 422);
        }
    }

    /**
     * Evaluates if an evaluation is ready for deliberation.
     */
    public function canDeliberate(
        array $evaluationRecord,
        array $snapshotData,
        ?array $resultRecord = null,
        ?array $areaAInputs = null,
        ?array $actor = null
    ): array {
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        $readiness = $this->readinessService->canFinalize(
            $evaluationRecord,
            $snapshotData,
            $areaAInputs,
            $actor
        );

        if (!$readiness['ready_for_finalization']) {
            return [
                'can_deliberate' => false,
                'reason_code' => self::REASON_EVALUATION_NOT_READY,
                'message' => "Evaluation is not ready for deliberation: {$readiness['reason_message']}",
                'readiness' => $readiness
            ];
        }

        $evaluationResult = $resultRecord['evaluation_result'] ?? $readiness['evaluation_result'] ?? null;
        if (empty($evaluationResult)) {
            return [
                'can_deliberate' => false,
                'reason_code' => self::REASON_EVALUATION_NOT_READY,
                'message' => 'Evaluation Result is not yet recorded or finalized.'
            ];
        }

        return [
            'can_deliberate' => true,
            'reason_code' => 'deliberation_eligible',
            'evaluation_result' => $evaluationResult,
            'readiness' => $readiness
        ];
    }

    /**
     * Resolves allowed Plan E rank transitions for deliberation selection.
     */
    public function resolveAllowedRankTransitions(array $evaluationRecord, array $context = []): array
    {
        $currentRank = $evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? null;
        $engagement = $evaluationRecord['faculty_engagement'] ?? $context['faculty_engagement'] ?? 'full_time_faculty';
        $personnelGroup = $evaluationRecord['personnel_group'] ?? $context['personnel_group'] ?? 'faculty';
        $hasVerifiedPhd = !empty($evaluationRecord['has_verified_phd']) || !empty($context['has_verified_phd']);

        if ($engagement === 'part_time_faculty') {
            return [
                'eligible' => false,
                'reason_code' => self::REASON_PART_TIME_INELIGIBLE,
                'message' => 'Part-time faculty are not eligible for Full-Time rank progression.',
                'allowed_targets' => []
            ];
        }

        if ($personnelGroup !== 'faculty') {
            return [
                'eligible' => false,
                'reason_code' => self::REASON_UNSUPPORTED_PERSONNEL_GROUP,
                'message' => 'Non-teaching personnel are outside the Faculty Academic Rank progression graph.',
                'allowed_targets' => []
            ];
        }

        $transitionsDto = $this->rankProgressionService->getAllowedTransitions(
            (string)$currentRank,
            [
                'faculty_engagement' => $engagement,
                'personnel_group' => $personnelGroup,
                'has_verified_phd' => $hasVerifiedPhd
            ]
        );

        return [
            'eligible' => true,
            'current_rank_code' => $transitionsDto['current_rank_code'] ?? null,
            'current_rank_name' => $transitionsDto['current_rank_name'] ?? $currentRank,
            'is_terminal' => $transitionsDto['is_terminal'] ?? false,
            'normal_next_rank' => $transitionsDto['normal_next_rank'] ?? null,
            'allowed_exceptions' => $transitionsDto['allowed_exception_transitions'] ?? [],
            'allowed_targets' => $transitionsDto['all_valid_target_ranks'] ?? [],
            'rule_reference' => self::PLAN_E_RULE_REFERENCE
        ];
    }

    /**
     * Records the official HR promotion decision and applies approved rank updates atomically.
     *
     * @param array $params [
     *   'evaluation_record' => array,
     *   'snapshot_data' => array,
     *   'result_record' => ?array,
     *   'decision' => string ('Approved' | 'Not Approved'),
     *   'approved_rank_code' => ?string (required if Approved),
     *   'decision_reason' => ?string,
     *   'actor' => ?array,
     *   'context' => ?array,
     *   'existing_promotion_record' => ?array
     * ]
     * @return array Standardized Promotion Decision DTO
     */
    public function recordPromotionDecision(array $params): array
    {
        $evaluationRecord = $params['evaluation_record'] ?? [];
        $snapshotData = $params['snapshot_data'] ?? [];
        $resultRecord = $params['result_record'] ?? null;
        $areaAInputs = $params['area_a_inputs'] ?? null;
        $decision = (string) ($params['decision'] ?? '');
        $approvedRankCode = $params['approved_rank_code'] ?? null;
        $decisionReason = $params['decision_reason'] ?? null;
        $actor = $params['actor'] ?? null;
        $context = $params['context'] ?? [];
        $existingPromotionRecord = $params['existing_promotion_record'] ?? null;

        // 1. HR Authorization Check
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        $this->validateDecisionVocabulary($decision);

        $evaluationId = (string) ($evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? '');
        $personnelProfileId = (string) ($evaluationRecord['personnel_profile_id'] ?? '');
        $currentRank = (string) ($evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? 'Unassigned');

        // 2. Idempotency Check: If promotion decision already recorded, return stable existing record
        if ($existingPromotionRecord !== null && !empty($existingPromotionRecord['promotion_decision'])) {
            return [
                'success' => true,
                'reason_code' => self::REASON_DECISION_ALREADY_RECORDED,
                'message' => 'Promotion decision has already been recorded and is historically locked.',
                'promotion_decision' => $existingPromotionRecord,
                'current_rank' => $evaluationRecord['current_rank'] ?? $currentRank,
                'rank_change_applied' => false
            ];
        }

        // 3. Verify Deliberation Readiness
        $deliberationCheck = $this->canDeliberate($evaluationRecord, $snapshotData, $resultRecord, $areaAInputs, $actor);
        if (!$deliberationCheck['can_deliberate']) {
            throw new RuntimeException("Cannot record promotion decision: {$deliberationCheck['message']}", 422);
        }

        $evaluationResult = $deliberationCheck['evaluation_result'];

        // 4. Retained Evaluation Boundary: Retained evaluations cannot be approved for promotion
        if ($evaluationResult === self::EVALUATION_RESULT_RETAINED && $decision === self::DECISION_APPROVED) {
            throw new RuntimeException(
                "Cannot approve promotion: Evaluation Result is 'Retained'. Only 'Passed' evaluations may be approved for promotion.",
                422
            );
        }

        $recordedAt = date('c');
        $recordedBy = $actor['profile_id'] ?? $actor['id'] ?? 'system_hr';

        // 5. Handle Not Approved Decision
        if ($decision === self::DECISION_NOT_APPROVED) {
            $decisionRecord = [
                'evaluation_id' => $evaluationId,
                'personnel_profile_id' => $personnelProfileId,
                'evaluation_result' => $evaluationResult,
                'promotion_decision' => self::DECISION_NOT_APPROVED,
                'is_promoted' => false,
                'previous_rank' => $currentRank,
                'current_rank' => $currentRank,
                'approved_rank_code' => null,
                'approved_rank_name' => null,
                'rank_change_applied' => false,
                'decision_reason' => $decisionReason ?? 'Candidate retains current rank following deliberation.',
                'decided_by' => $recordedBy,
                'decided_at' => $recordedAt,
                'plan_e_rule_reference' => self::PLAN_E_RULE_REFERENCE
            ];

            return [
                'success' => true,
                'reason_code' => self::REASON_DECISION_RECORDED,
                'message' => "Promotion decision [Not Approved] successfully recorded. Candidate retains current rank [{$currentRank}].",
                'promotion_decision' => $decisionRecord,
                'current_rank' => $currentRank,
                'rank_change_applied' => false
            ];
        }

        // 6. Handle Approved Decision (Requires Valid Plan E Transition)
        if (empty($approvedRankCode)) {
            throw new InvalidArgumentException("Approved rank code is required when Promotion Decision is 'Approved'.", 422);
        }

        // 6a. Part-Time / Non-Teaching Boundary Checks
        $engagement = $evaluationRecord['faculty_engagement'] ?? $context['faculty_engagement'] ?? 'full_time_faculty';
        if ($engagement === 'part_time_faculty') {
            throw new RuntimeException("Part-time faculty are not eligible for Full-Time rank progression.", 422);
        }

        $personnelGroup = $evaluationRecord['personnel_group'] ?? $context['personnel_group'] ?? 'faculty';
        if ($personnelGroup !== 'faculty') {
            throw new RuntimeException("Non-teaching personnel cannot participate in Faculty rank progression.", 422);
        }

        // 6b. Plan E Validation
        $hasVerifiedPhd = !empty($evaluationRecord['has_verified_phd']) || !empty($context['has_verified_phd']);
        $transitionValidation = $this->rankProgressionService->validateTransition(
            $currentRank,
            $approvedRankCode,
            [
                'faculty_engagement' => $engagement,
                'personnel_group' => $personnelGroup,
                'has_verified_phd' => $hasVerifiedPhd
            ]
        );

        if (!$transitionValidation['allowed']) {
            throw new RuntimeException(
                "Invalid rank transition from [{$currentRank}] to [{$approvedRankCode}]: {$transitionValidation['message']}",
                422
            );
        }

        $targetRank = $transitionValidation['target_rank'];
        $newRankName = $targetRank['display_label'];
        $newRankCode = $targetRank['rank_code'];

        // 7. Atomic Rank Change Record & History
        $decisionRecord = [
            'evaluation_id' => $evaluationId,
            'personnel_profile_id' => $personnelProfileId,
            'evaluation_result' => $evaluationResult,
            'promotion_decision' => self::DECISION_APPROVED,
            'is_promoted' => true,
            'previous_rank' => $currentRank,
            'current_rank' => $newRankName,
            'approved_rank_code' => $newRankCode,
            'approved_rank_name' => $newRankName,
            'rank_change_applied' => true,
            'transition_type' => $transitionValidation['transition_type'] ?? 'normal_sequential',
            'decision_reason' => $decisionReason ?? "Promotion approved to [{$newRankName}] following post-evaluation deliberation.",
            'decided_by' => $recordedBy,
            'decided_at' => $recordedAt,
            'plan_e_rule_reference' => self::PLAN_E_RULE_REFERENCE,
            'rank_history_entry' => [
                'evaluation_id' => $evaluationId,
                'personnel_profile_id' => $personnelProfileId,
                'from_rank' => $currentRank,
                'to_rank' => $newRankName,
                'to_rank_code' => $newRankCode,
                'transition_type' => $transitionValidation['transition_type'] ?? 'normal_sequential',
                'action' => 'PROMOTION_APPROVED',
                'recorded_by' => $recordedBy,
                'recorded_at' => $recordedAt
            ]
        ];

        return [
            'success' => true,
            'reason_code' => self::REASON_DECISION_RECORDED,
            'message' => "Promotion decision [Approved] successfully recorded. Rank updated from [{$currentRank}] to [{$newRankName}].",
            'promotion_decision' => $decisionRecord,
            'current_rank' => $newRankName,
            'rank_change_applied' => true
        ];
    }
}
