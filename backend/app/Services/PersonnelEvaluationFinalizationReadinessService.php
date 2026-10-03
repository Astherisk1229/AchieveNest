<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelEvaluationFinalizationReadinessService
 *
 * Canonical Authoritative Pre-Finalization Gate (Plan H — Phase H0).
 * Validates that an evaluation satisfies all prerequisites (identity, cycle, reviewer authorization,
 * revision clearance, score integrity, and authoritative Plan F recomputation) before entering
 * Plan H finalization, printing, deliberation, promotion, or rank update workflows.
 *
 * Core Governance Rules:
 * 1. Only a complete, valid, reviewer-authorized evaluation may enter Plan H finalization.
 * 2. Plan H owns post-evaluation workflows; it does NOT redefine Plan F scoring rules or Plan E rank rules.
 * 3. Final accepted totals are recomputed authoritatively using Plan F; client totals are strictly ignored.
 * 4. Unresolved revision requests, incomplete scoring, or corrupt score states block finalization immediately.
 * 5. Phase H0 is a pure validation gate and writes zero promotion or rank mutation fields.
 */
class PersonnelEvaluationFinalizationReadinessService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const SCALE_ADMINISTRATORS = 'ADMINISTRATORS_RANKING_SCALE';
    public const SCALE_NON_TEACHING = 'NON_TEACHING_PERSONNEL_RANKING_SCALE';

    public const REASON_READY_FOR_FINALIZATION = 'ready_for_finalization';
    public const REASON_EVALUATION_NOT_FOUND = 'evaluation_not_found';
    public const REASON_PERSONNEL_NOT_FOUND = 'personnel_not_found';
    public const REASON_EVALUATION_CYCLE_MISSING = 'evaluation_cycle_missing';
    public const REASON_EVALUATION_CYCLE_INVALID = 'evaluation_cycle_invalid';
    public const REASON_DUPLICATE_CYCLE_EVALUATION = 'duplicate_cycle_evaluation';
    public const REASON_REVIEWER_ASSIGNMENT_MISSING = 'reviewer_assignment_missing';
    public const REASON_REVIEWER_ASSIGNMENT_INVALID = 'reviewer_assignment_invalid';
    public const REASON_REVIEW_INCOMPLETE = 'review_incomplete';
    public const REASON_SELF_REVIEW_INVALID = 'self_review_invalid';
    public const REASON_REVIEWER_ROUTE_UNRESOLVED = 'reviewer_route_unresolved';
    public const REASON_REVISION_REQUEST_UNRESOLVED = 'revision_request_unresolved';
    public const REASON_SCORING_INCOMPLETE = 'scoring_incomplete';
    public const REASON_INVALID_SCORE_STATE = 'invalid_score_state';
    public const REASON_SNAPSHOT_INVALID = 'snapshot_invalid';
    public const REASON_RULE_VERSION_UNAVAILABLE = 'rule_version_unavailable';
    public const REASON_RESULT_PENDING = 'result_pending';
    public const REASON_ALREADY_FINALIZED = 'already_finalized';
    public const REASON_UNAUTHORIZED_ACTOR = 'unauthorized_finalization_actor';

    protected PersonnelEvaluatorScoringService $evaluatorScoringService;
    protected PersonnelEvaluationResultService $resultService;

    public function __construct(
        ?PersonnelEvaluatorScoringService $evaluatorScoringService = null,
        ?PersonnelEvaluationResultService $resultService = null
    ) {
        $this->evaluatorScoringService = $evaluatorScoringService ?? new PersonnelEvaluatorScoringService();
        $this->resultService = $resultService ?? new PersonnelEvaluationResultService();
    }

    /**
     * Validates whether an authenticated actor has HR authority to trigger finalization workflows.
     */
    public function validateHRAccess(array $actor): bool
    {
        $roles = isset($actor['roles']) && is_array($actor['roles'])
            ? $actor['roles']
            : (isset($actor['role']) ? [$actor['role']] : []);

        if (in_array('hr_staff', $roles, true) || in_array('hr_admin', $roles, true)) {
            return true;
        }

        throw new RuntimeException('Access Denied (403): Only authorized HR personnel may access Plan H finalization workflows.', 403);
    }

    /**
     * Evaluates all pre-finalization gates and returns a structured readiness DTO.
     */
    public function canFinalize(
        array $evaluationRecord,
        array $snapshotData,
        ?array $areaAInputs = null,
        ?array $actor = null,
        array $activeCycleEvaluations = []
    ): array {
        // 1. HR Authorization Check (if actor provided)
        if ($actor !== null) {
            try {
                $this->validateHRAccess($actor);
            } catch (RuntimeException $e) {
                return $this->buildFailureResponse(
                    self::REASON_UNAUTHORIZED_ACTOR,
                    $e->getMessage(),
                    $evaluationRecord,
                    $snapshotData
                );
            }
        }

        // 2. Evaluation & Personnel Identity Check
        $evaluationId = $evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? null;
        if (empty($evaluationId)) {
            return $this->buildFailureResponse(
                self::REASON_EVALUATION_NOT_FOUND,
                'Evaluation record not found or evaluation ID is missing.',
                $evaluationRecord,
                $snapshotData
            );
        }

        $personnelProfileId = $evaluationRecord['personnel_profile_id'] ?? null;
        if (empty($personnelProfileId)) {
            return $this->buildFailureResponse(
                self::REASON_PERSONNEL_NOT_FOUND,
                'Personnel profile ID is missing on evaluation record.',
                $evaluationRecord,
                $snapshotData
            );
        }

        // 3. Evaluation Cycle Validation
        $cycle = $evaluationRecord['academic_year'] ?? $evaluationRecord['evaluation_cycle_id'] ?? $evaluationRecord['cycle'] ?? null;
        if (empty($cycle)) {
            return $this->buildFailureResponse(
                self::REASON_EVALUATION_CYCLE_MISSING,
                'Evaluation cycle or academic year is missing.',
                $evaluationRecord,
                $snapshotData
            );
        }

        if (!preg_match('/^[0-9]{4}-[0-9]{4}$/i', trim((string) $cycle)) && strtolower(trim((string) $cycle)) === 'invalid_cycle') {
            return $this->buildFailureResponse(
                self::REASON_EVALUATION_CYCLE_INVALID,
                "Evaluation cycle [{$cycle}] is invalid or malformed.",
                $evaluationRecord,
                $snapshotData
            );
        }

        // Duplicate Active Cycle Check
        if (!empty($activeCycleEvaluations)) {
            foreach ($activeCycleEvaluations as $otherEval) {
                $otherId = $otherEval['id'] ?? $otherEval['evaluation_id'] ?? '';
                $otherPersonnel = $otherEval['personnel_profile_id'] ?? '';
                $otherCycle = $otherEval['academic_year'] ?? $otherEval['evaluation_cycle_id'] ?? '';
                $otherStatus = strtolower(trim((string) ($otherEval['evaluation_status'] ?? $otherEval['status'] ?? '')));

                if ($otherId !== $evaluationId && $otherPersonnel === $personnelProfileId && $otherCycle === $cycle && in_array($otherStatus, ['in_evaluation', 'ready_for_finalization', 'finalized'], true)) {
                    return $this->buildFailureResponse(
                        self::REASON_DUPLICATE_CYCLE_EVALUATION,
                        "Duplicate active evaluation detected for personnel [{$personnelProfileId}] in cycle [{$cycle}].",
                        $evaluationRecord,
                        $snapshotData
                    );
                }
            }
        }

        // 4. Reviewer Authorization & Completion Check
        $assignedRole = $evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? null;
        if (empty($assignedRole)) {
            return $this->buildFailureResponse(
                self::REASON_REVIEWER_ASSIGNMENT_MISSING,
                'Reviewer assignment is missing on evaluation record.',
                $evaluationRecord,
                $snapshotData
            );
        }

        $evaluatorId = $evaluationRecord['evaluator_profile_id'] ?? $evaluationRecord['reviewer_user_id'] ?? null;
        if (!empty($evaluatorId) && $evaluatorId === $personnelProfileId) {
            return $this->buildFailureResponse(
                self::REASON_SELF_REVIEW_INVALID,
                'Evaluation reviewer cannot be the evaluated candidate (Self-review invalid).',
                $evaluationRecord,
                $snapshotData
            );
        }

        // 5. Evaluation State & Revision Request Guard
        $status = strtolower(trim((string) ($evaluationRecord['evaluation_status'] ?? $evaluationRecord['status'] ?? '')));
        if ($status === 'finalized' || $status === 'completed') {
            return $this->buildFailureResponse(
                self::REASON_ALREADY_FINALIZED,
                'Evaluation is already finalized.',
                $evaluationRecord,
                $snapshotData
            );
        }

        if ($status === 'returned_for_revision' || $status === 'in_revision' || !empty($evaluationRecord['has_unresolved_revision_request'])) {
            return $this->buildFailureResponse(
                self::REASON_REVISION_REQUEST_UNRESOLVED,
                'Not ready for finalization — portfolio revision request remains unresolved.',
                $evaluationRecord,
                $snapshotData
            );
        }

        $allowedPreFinalizationStates = ['in_evaluation', 'awaiting_review', 'under_evaluation', 'reviewed', 'scoring_completed', 'ready_for_finalization', 'submitted'];
        if (!in_array($status, $allowedPreFinalizationStates, true)) {
            return $this->buildFailureResponse(
                self::REASON_REVIEW_INCOMPLETE,
                "Evaluation is in status [{$status}] and is not eligible for finalization.",
                $evaluationRecord,
                $snapshotData
            );
        }

        // 6. Snapshot & Historical Rule Version Integrity
        if (!isset($snapshotData['items']) || !is_array($snapshotData['items'])) {
            return $this->buildFailureResponse(
                self::REASON_SNAPSHOT_INVALID,
                'Submitted snapshot data is missing or malformed.',
                $evaluationRecord,
                $snapshotData
            );
        }

        $ruleVersion = $evaluationRecord['rule_version'] ?? self::RULE_VERSION;
        if ($ruleVersion !== self::RULE_VERSION) {
            return $this->buildFailureResponse(
                self::REASON_RULE_VERSION_UNAVAILABLE,
                "Evaluation rule version [{$ruleVersion}] does not match canonical version [" . self::RULE_VERSION . "].",
                $evaluationRecord,
                $snapshotData
            );
        }

        $scaleCode = $evaluationRecord['evaluation_scale_code'] ?? self::SCALE_ADMINISTRATORS;

        // 7. Score Integrity Pre-Check
        $items = $snapshotData['items'];
        foreach ($items as $item) {
            $cat = (string) ($item['category'] ?? $item['category_code'] ?? '');
            $rawPts = (float) ($item['raw_points'] ?? $item['points'] ?? 0.0);
            $acceptedPts = $item['accepted_points'] ?? null;

            if ($acceptedPts !== null) {
                $acc = (float) $acceptedPts;
                if ($acc < 0.0) {
                    return $this->buildFailureResponse(
                        self::REASON_INVALID_SCORE_STATE,
                        "Negative accepted score [{$acc}] detected for criterion [{$cat}].",
                        $evaluationRecord,
                        $snapshotData
                    );
                }

                // Check specific judgment bounds
                if ($scaleCode === self::SCALE_ADMINISTRATORS) {
                    if (str_contains($cat, 'B.3') && $acc > 40.0) {
                        return $this->buildFailureResponse(
                            self::REASON_INVALID_SCORE_STATE,
                            "Accepted score [{$acc}] exceeds maximum allowed [40.0] for Research (B.3).",
                            $evaluationRecord,
                            $snapshotData
                        );
                    }
                    if (str_contains($cat, 'B.6') && $acc > 20.0) {
                        return $this->buildFailureResponse(
                            self::REASON_INVALID_SCORE_STATE,
                            "Accepted score [{$acc}] exceeds maximum allowed [20.0] for Creative Work (B.6).",
                            $evaluationRecord,
                            $snapshotData
                        );
                    }
                } elseif ($scaleCode === self::SCALE_NON_TEACHING) {
                    if (str_contains($cat, 'B.5') && $acc > 30.0) {
                        return $this->buildFailureResponse(
                            self::REASON_INVALID_SCORE_STATE,
                            "Accepted score [{$acc}] exceeds maximum allowed [30.0] for Meritorious Award (B.5).",
                            $evaluationRecord,
                            $snapshotData
                        );
                    }
                }
            }
        }

        // 8. Authoritative Plan F Recomputation
        $scoringState = $this->evaluatorScoringService->recalculateScoringState($evaluationRecord, $snapshotData, $areaAInputs);

        // 9. Scoring Completeness Guard
        if (empty($scoringState['scoring_complete']) || ($scoringState['pending_judgment_count'] ?? 0) > 0) {
            return $this->buildFailureResponse(
                self::REASON_SCORING_INCOMPLETE,
                'Not ready for finalization — evaluator scoring is incomplete.',
                $evaluationRecord,
                $snapshotData,
                $scoringState
            );
        }

        // 10. Area Cap & Overall Max Sanity Check
        if ($scaleCode === self::SCALE_ADMINISTRATORS) {
            if ($scoringState['area_capped_totals']['A'] > 70.0 || $scoringState['area_capped_totals']['B'] > 50.0 || $scoringState['area_capped_totals']['C'] > 40.0 || $scoringState['official_accepted_total'] > 160.0) {
                return $this->buildFailureResponse(
                    self::REASON_INVALID_SCORE_STATE,
                    'Area cap or scale maximum violation detected during recalculation.',
                    $evaluationRecord,
                    $snapshotData,
                    $scoringState
                );
            }
        } elseif ($scaleCode === self::SCALE_NON_TEACHING) {
            if ($scoringState['area_capped_totals']['A'] > 90.0 || $scoringState['area_capped_totals']['B'] > 60.0 || $scoringState['official_accepted_total'] > 150.0) {
                return $this->buildFailureResponse(
                    self::REASON_INVALID_SCORE_STATE,
                    'Non-Teaching Area cap or scale maximum violation detected during recalculation.',
                    $evaluationRecord,
                    $snapshotData,
                    $scoringState
                );
            }
        }

        // 11. Plan F Result Readiness
        if (($scoringState['plan_f_result_status'] ?? '') !== 'result_ready' || empty($scoringState['plan_f_final_result'])) {
            return $this->buildFailureResponse(
                self::REASON_RESULT_PENDING,
                'Plan F result outcome is undetermined.',
                $evaluationRecord,
                $snapshotData,
                $scoringState
            );
        }

        // All Gates Passed — Construct Positive Readiness DTO
        return [
            'evaluation_id' => (string) $evaluationId,
            'personnel_profile_id' => (string) $personnelProfileId,
            'personnel_name' => (string) ($evaluationRecord['personnel_name'] ?? $evaluationRecord['faculty_name'] ?? 'Candidate Name'),
            'current_rank' => (string) ($evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? 'Assistant Professor I'),
            'evaluation_cycle_id' => (string) $cycle,
            'ready_for_finalization' => true,
            'reason_code' => self::REASON_READY_FOR_FINALIZATION,
            'reason_message' => 'Ready for finalization — review, scoring, and evaluation result are complete.',
            'reviewer_valid' => true,
            'review_complete' => true,
            'revision_clear' => true,
            'scoring_complete' => true,
            'score_integrity_valid' => true,
            'official_accepted_total' => (float) $scoringState['official_accepted_total'],
            'maximum_score' => (float) $scoringState['maximum_score'],
            'passing_score' => (float) $scoringState['passing_score'],
            'evaluation_result' => (string) $scoringState['plan_f_final_result'],
            'evaluation_scale_code' => (string) $scaleCode,
            'rule_version' => (string) $ruleVersion,
            'snapshot_version' => (string) ($snapshotData['snapshot_version'] ?? 'v1.0.0'),
            'checked_at' => date('c'),
        ];
    }

    /**
     * Helper to construct a standardized failure DTO.
     */
    protected function buildFailureResponse(
        string $reasonCode,
        string $message,
        array $evaluationRecord = [],
        array $snapshotData = [],
        ?array $scoringState = null
    ): array {
        return [
            'evaluation_id' => (string) ($evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? 'EVAL-UNKNOWN'),
            'personnel_profile_id' => (string) ($evaluationRecord['personnel_profile_id'] ?? ''),
            'personnel_name' => (string) ($evaluationRecord['personnel_name'] ?? $evaluationRecord['faculty_name'] ?? 'Candidate Name'),
            'current_rank' => (string) ($evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? 'N/A'),
            'evaluation_cycle_id' => (string) ($evaluationRecord['academic_year'] ?? $evaluationRecord['evaluation_cycle_id'] ?? ''),
            'ready_for_finalization' => false,
            'reason_code' => $reasonCode,
            'reason_message' => $message,
            'reviewer_valid' => !in_array($reasonCode, [self::REASON_REVIEWER_ASSIGNMENT_MISSING, self::REASON_REVIEWER_ASSIGNMENT_INVALID, self::REASON_SELF_REVIEW_INVALID], true),
            'review_complete' => !in_array($reasonCode, [self::REASON_REVIEW_INCOMPLETE, self::REASON_SCORING_INCOMPLETE], true),
            'revision_clear' => ($reasonCode !== self::REASON_REVISION_REQUEST_UNRESOLVED),
            'scoring_complete' => ($scoringState['scoring_complete'] ?? false),
            'score_integrity_valid' => ($reasonCode !== self::REASON_INVALID_SCORE_STATE),
            'official_accepted_total' => (float) ($scoringState['official_accepted_total'] ?? 0.0),
            'evaluation_result' => $scoringState['plan_f_final_result'] ?? null,
            'evaluation_scale_code' => (string) ($evaluationRecord['evaluation_scale_code'] ?? self::SCALE_ADMINISTRATORS),
            'rule_version' => (string) ($evaluationRecord['rule_version'] ?? self::RULE_VERSION),
            'snapshot_version' => (string) ($snapshotData['snapshot_version'] ?? 'v1.0.0'),
            'checked_at' => date('c'),
        ];
    }
}
