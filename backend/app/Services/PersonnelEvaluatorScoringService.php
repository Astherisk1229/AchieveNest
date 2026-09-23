<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelEvaluatorScoringService
 *
 * Canonical Authoritative Backend Evaluator Scoring Service for Plan G — Phase G3.
 * Manages authorized evaluator entry of official accepted points, Non-Teaching Area A rating inputs,
 * scoring completion tracking, and total recalculations via Plan F rules.
 *
 * Core Governance Rules:
 * 1. Plan G controls who evaluates and records accepted points; Plan F controls caps, formulas, and totals.
 * 2. Only the assigned reviewer may submit official accepted values.
 * 3. Self-review, cross-college reviews, and Department Secretary evaluations are strictly prohibited.
 * 4. Deterministic Plan F items cannot be arbitrarily overridden.
 * 5. Judgment criteria enforce scale-specific maximums (Admin B.3: 40, B.6: 20, Non-Teaching B.5: 30).
 * 6. Null (unresolved) and 0.0 (explicitly zero) are strictly differentiated.
 * 7. Non-Teaching Area A is evaluator-only (Job Performance: 50, Personal Attitudes: 10, Efficiency: 30; Max: 90).
 */
class PersonnelEvaluatorScoringService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const SCALE_ADMINISTRATORS = 'ADMINISTRATORS_RANKING_SCALE';
    public const SCALE_NON_TEACHING = 'NON_TEACHING_PERSONNEL_RANKING_SCALE';

    public const REVIEWER_ROLE_DEAN = 'dean';
    public const REVIEWER_ROLE_HR = 'hr_staff';

    public const JUDGMENT_MAX_POINTS = [
        self::SCALE_ADMINISTRATORS => [
            'B.3' => 40.0,
            'B.6' => 20.0,
        ],
        self::SCALE_NON_TEACHING => [
            'B.5' => 30.0,
        ],
    ];

    public const AREA_A_NON_TEACHING_MAX = [
        'job_performance' => 50.0,
        'personal_attitudes' => 10.0,
        'efficiency' => 30.0,
    ];

    public const AREA_A_TOTAL_MAX = 90.0;

    protected PersonnelEvaluationScoringService $scoringService;
    protected PersonnelEvaluationResultService $resultService;

    public function __construct(
        ?PersonnelEvaluationScoringService $scoringService = null,
        ?PersonnelEvaluationResultService $resultService = null
    ) {
        $this->scoringService = $scoringService ?? new PersonnelEvaluationScoringService();
        $this->resultService = $resultService ?? new PersonnelEvaluationResultService($this->scoringService);
    }

    /**
     * Validates that the actor is authorized to score the evaluation.
     */
    public function validateEvaluatorAccess(array $reviewerActor, array $evaluationRecord): bool
    {
        $actorProfileId = (string) ($reviewerActor['profile_id'] ?? ($reviewerActor['profile']['id'] ?? ''));
        $personnelProfileId = (string) ($evaluationRecord['personnel_profile_id'] ?? '');

        // 1. Anti-Self-Review
        if (!empty($actorProfileId) && $actorProfileId === $personnelProfileId) {
            throw new RuntimeException('Access Denied (403): Candidate cannot access their own evaluation with reviewer privileges (Self-review prohibited).', 403);
        }

        $actorRoles = isset($reviewerActor['roles']) && is_array($reviewerActor['roles'])
            ? $reviewerActor['roles']
            : (isset($reviewerActor['role']) ? [$reviewerActor['role']] : []);

        // 2. Department Secretary Prohibition
        if (in_array('department_secretary', $actorRoles, true) && !in_array('dean', $actorRoles, true) && !in_array('hr_staff', $actorRoles, true) && !in_array('hr_admin', $actorRoles, true)) {
            throw new RuntimeException('Access Denied (403): Department Secretary role does not possess evaluator authority.', 403);
        }

        // 3. Evaluation Status Check
        $status = strtolower(trim((string) ($evaluationRecord['evaluation_status'] ?? $evaluationRecord['status'] ?? 'submitted')));
        $allowedReviewStates = ['in_evaluation', 'awaiting_review', 'under_evaluation', 'submitted'];
        if (!in_array($status, $allowedReviewStates, true)) {
            throw new RuntimeException("Evaluation [{$evaluationRecord['id']}] is in status [{$status}] and is not open for evaluator scoring.", 400);
        }

        $assignedRole = $evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? null;
        $targetCollegeId = $evaluationRecord['evaluator_college_id'] ?? $evaluationRecord['target_college_id'] ?? null;

        // 4. Dean Scoping
        if ($assignedRole === 'dean' || $assignedRole === self::REVIEWER_ROLE_DEAN) {
            if (!in_array('dean', $actorRoles, true)) {
                throw new RuntimeException('Access Denied (403): Evaluation is assigned to College Dean, but actor does not hold the active dean role.', 403);
            }
            $actorCollegeId = $reviewerActor['assigned_college_id'] ?? ($reviewerActor['profile']['college_id'] ?? null);
            if ($targetCollegeId && $actorCollegeId !== $targetCollegeId) {
                throw new RuntimeException("Access Denied (403): Dean of college [{$actorCollegeId}] cannot access evaluations for college [{$targetCollegeId}] (Cross-college access prohibited).", 403);
            }
            return true;
        }

        // 5. HR Scoping
        if ($assignedRole === 'hr' || $assignedRole === 'hr_staff' || $assignedRole === self::REVIEWER_ROLE_HR) {
            if (!in_array('hr_staff', $actorRoles, true) && !in_array('hr_admin', $actorRoles, true)) {
                throw new RuntimeException('Access Denied (403): Evaluation is assigned to HR Office, but actor is not an authorized HR evaluator.', 403);
            }
            return true;
        }

        throw new RuntimeException('Access Denied (403): Reviewer assignment is unresolved or actor is unauthorized.', 403);
    }

    /**
     * Submits official accepted points for a specific accomplishment item.
     */
    public function submitAcceptedPoints(
        array $evaluationRecord,
        array $reviewerActor,
        array &$snapshotData,
        string $itemId,
        ?float $acceptedPoints,
        string $reason = ''
    ): array {
        // 1. Revalidate Access
        $this->validateEvaluatorAccess($reviewerActor, $evaluationRecord);

        $scaleCode = $evaluationRecord['evaluation_scale_code'] ?? self::SCALE_ADMINISTRATORS;
        $ruleVersion = $evaluationRecord['rule_version'] ?? self::RULE_VERSION;
        if ($ruleVersion !== self::RULE_VERSION) {
            throw new RuntimeException("Invalid rule version [{$ruleVersion}]. Must be [" . self::RULE_VERSION . "].", 422);
        }

        // 2. Find Item in Snapshot
        $items = &$snapshotData['items'];
        $targetItem = null;
        $targetIndex = -1;

        if (is_array($items)) {
            foreach ($items as $idx => &$itm) {
                $id = (string) ($itm['id'] ?? $itm['accomplishment_id'] ?? $itm['item_id'] ?? '');
                if ($id === $itemId) {
                    $targetItem = &$itm;
                    $targetIndex = $idx;
                    break;
                }
            }
        }

        if (!$targetItem) {
            throw new InvalidArgumentException("Evaluation item with ID [{$itemId}] not found in snapshot.", 404);
        }

        $category = (string) ($targetItem['category'] ?? $targetItem['category_code'] ?? '');
        $isJudgment = !empty($targetItem['evaluator_judgment_required']) || !empty($targetItem['is_evaluator_judgment_required']);

        // 3. Check for Judgment vs Deterministic Item
        if (!$isJudgment) {
            // Deterministic item: cannot arbitrarily override
            $calculatedPoints = (float) ($targetItem['capped_points'] ?? $targetItem['points'] ?? $targetItem['raw_points'] ?? 0.0);
            if ($acceptedPoints !== null && abs($acceptedPoints - $calculatedPoints) > 0.001) {
                throw new RuntimeException("Arbitrary override of deterministic Plan F scoring is prohibited for criterion [{$category}].", 422);
            }
        } else {
            // Judgment item validation
            if ($acceptedPoints !== null) {
                if ($acceptedPoints < 0) {
                    throw new InvalidArgumentException("Accepted points cannot be negative for criterion [{$category}].", 422);
                }

                // Resolve criterion key (e.g. 'B.3', 'B.6', 'B.5')
                $criterionKey = $this->extractCriterionKey($category);
                $allowedMax = self::JUDGMENT_MAX_POINTS[$scaleCode][$criterionKey] ?? 100.0;

                if ($acceptedPoints > $allowedMax) {
                    throw new RuntimeException("Accepted points [{$acceptedPoints}] exceeds maximum allowed [{$allowedMax}] for criterion [{$category}].", 422);
                }
            }
        }

        // 4. Update Item Accepted Points
        $targetItem['accepted_points'] = $acceptedPoints !== null ? (float) $acceptedPoints : null;
        $targetItem['evaluator_user_id'] = $reviewerActor['profile_id'] ?? ($reviewerActor['profile']['id'] ?? 'reviewer');
        $targetItem['evaluator_role'] = $evaluationRecord['assigned_reviewer_role'] ?? 'reviewer';
        $targetItem['scoring_status'] = $acceptedPoints !== null ? 'scored' : 'awaiting_evaluator';
        $targetItem['evaluator_reason'] = $reason;
        $targetItem['evaluated_at'] = date('c');

        // 5. Recalculate Totals & Completion
        return $this->recalculateScoringState($evaluationRecord, $snapshotData);
    }

    /**
     * Submits official Non-Teaching Area A rating inputs.
     */
    public function submitNonTeachingAreaAInput(
        array $evaluationRecord,
        array $reviewerActor,
        array $areaAInputs,
        string $reason = ''
    ): array {
        $scaleCode = $evaluationRecord['evaluation_scale_code'] ?? '';
        if ($scaleCode !== self::SCALE_NON_TEACHING) {
            throw new RuntimeException('Area A evaluator ratings only apply to Non-Teaching Personnel Ranking Scale.', 422);
        }

        // 1. Revalidate Access
        $this->validateEvaluatorAccess($reviewerActor, $evaluationRecord);

        // 2. Validate Area A Components
        $jobPerf = isset($areaAInputs['job_performance']) ? (float) $areaAInputs['job_performance'] : null;
        $persAtt = isset($areaAInputs['personal_attitudes']) ? (float) $areaAInputs['personal_attitudes'] : null;
        $efficiency = isset($areaAInputs['efficiency']) ? (float) $areaAInputs['efficiency'] : null;

        if ($jobPerf !== null) {
            if ($jobPerf < 0 || $jobPerf > self::AREA_A_NON_TEACHING_MAX['job_performance']) {
                throw new RuntimeException("Job Performance points [{$jobPerf}] exceeds allowed range [0 - " . self::AREA_A_NON_TEACHING_MAX['job_performance'] . "].", 422);
            }
        }

        if ($persAtt !== null) {
            if ($persAtt < 0 || $persAtt > self::AREA_A_NON_TEACHING_MAX['personal_attitudes']) {
                throw new RuntimeException("Personal Attitudes and Qualities points [{$persAtt}] exceeds allowed range [0 - " . self::AREA_A_NON_TEACHING_MAX['personal_attitudes'] . "].", 422);
            }
        }

        if ($efficiency !== null) {
            if ($efficiency < 0 || $efficiency > self::AREA_A_NON_TEACHING_MAX['efficiency']) {
                throw new RuntimeException("Efficiency points [{$efficiency}] exceeds allowed range [0 - " . self::AREA_A_NON_TEACHING_MAX['efficiency'] . "].", 422);
            }
        }

        $areaATotal = ($jobPerf ?? 0.0) + ($persAtt ?? 0.0) + ($efficiency ?? 0.0);
        if ($areaATotal > self::AREA_A_TOTAL_MAX) {
            throw new RuntimeException("Total Area A points [{$areaATotal}] exceeds maximum allowed [" . self::AREA_A_TOTAL_MAX . "].", 422);
        }

        $isAreaAComplete = ($jobPerf !== null) && ($persAtt !== null) && ($efficiency !== null);

        return [
            'success' => true,
            'area_a_inputs' => [
                'job_performance' => $jobPerf,
                'personal_attitudes' => $persAtt,
                'efficiency' => $efficiency,
                'total_area_a' => $areaATotal,
                'is_complete' => $isAreaAComplete,
                'evaluator_user_id' => $reviewerActor['profile_id'] ?? ($reviewerActor['profile']['id'] ?? 'reviewer'),
                'evaluated_at' => date('c'),
                'evaluator_reason' => $reason,
            ],
        ];
    }

    /**
     * Recalculates full scoring state, Area totals, overall total, and scoring completeness.
     */
    public function recalculateScoringState(
        array $evaluationRecord,
        array $snapshotData,
        ?array $areaAInputs = null
    ): array {
        $scaleCode = $evaluationRecord['evaluation_scale_code'] ?? self::SCALE_ADMINISTRATORS;
        $items = $snapshotData['items'] ?? [];

        $isAdmin = $scaleCode === self::SCALE_ADMINISTRATORS;
        $maxScore = $isAdmin ? 160.0 : 150.0;
        $passingScore = $isAdmin ? 120.0 : 75.0;

        $unresolvedJudgmentCount = 0;
        $areaSums = [
            'A' => 0.0,
            'B' => 0.0,
            'C' => 0.0,
        ];

        foreach ($items as $item) {
            $cat = (string) ($item['category'] ?? $item['category_code'] ?? '');
            $area = strtoupper((string) ($item['area'] ?? $item['area_code'] ?? 'B'));
            $area = preg_replace('/^AREA_?/', '', $area);
            $isJudgment = !empty($item['evaluator_judgment_required']) || !empty($item['is_evaluator_judgment_required']);
            $accepted = $item['accepted_points'] ?? null;

            if ($isJudgment && $accepted === null) {
                $unresolvedJudgmentCount++;
            }

            $effectivePoints = ($accepted !== null)
                ? (float) $accepted
                : ($isJudgment ? 0.0 : ((float) ($item['capped_points'] ?? $item['points'] ?? $item['raw_points'] ?? 0.0)));

            if (isset($areaSums[$area])) {
                $areaSums[$area] += $effectivePoints;
            }
        }

        // Apply Area Caps
        if ($isAdmin) {
            $areaCapped = [
                'A' => min(70.0, $areaSums['A']),
                'B' => min(50.0, $areaSums['B']),
                'C' => min(40.0, $areaSums['C']),
            ];
            $overallTotal = min(160.0, $areaCapped['A'] + $areaCapped['B'] + $areaCapped['C']);
            $isScoringComplete = ($unresolvedJudgmentCount === 0);
        } else {
            // Non-Teaching Scale
            $areaATotal = isset($areaAInputs['total_area_a']) ? (float) $areaAInputs['total_area_a'] : 0.0;
            $isAreaAComplete = !empty($areaAInputs['is_complete']);

            $areaCapped = [
                'A' => min(90.0, $areaATotal),
                'B' => min(60.0, $areaSums['B']),
            ];
            $overallTotal = min(150.0, $areaCapped['A'] + $areaCapped['B']);
            $isScoringComplete = ($unresolvedJudgmentCount === 0) && $isAreaAComplete;
        }

        $planFResultStatus = $isScoringComplete ? 'result_ready' : 'pending';
        $planFFinalResult = null;
        if ($isScoringComplete) {
            $planFFinalResult = ($overallTotal >= $passingScore) ? 'Passed' : 'Retained';
        }

        return [
            'evaluation_id' => $evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? 'EVAL-001',
            'scale_code' => $scaleCode,
            'scoring_complete' => $isScoringComplete,
            'pending_judgment_count' => $unresolvedJudgmentCount,
            'area_raw_sums' => $areaSums,
            'area_capped_totals' => $areaCapped,
            'official_accepted_total' => $overallTotal,
            'maximum_score' => $maxScore,
            'passing_score' => $passingScore,
            'plan_f_result_status' => $planFResultStatus,
            'plan_f_final_result' => $planFFinalResult,
        ];
    }

    /**
     * Extracts canonical criterion code (e.g. 'B.3', 'B.6', 'B.5') from category string.
     */
    protected function extractCriterionKey(string $category): string
    {
        if (preg_match('/(B\.[0-9]+)/i', $category, $matches)) {
            return strtoupper($matches[1]);
        }
        return 'UNKNOWN';
    }
}
