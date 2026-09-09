<?php

namespace App\Services;

use RuntimeException;

/**
 * PersonnelEvaluationResultService
 *
 * Authoritative Backend Evaluation Result Determination Engine (Plan F — Phase F5).
 * Consumes official accepted scoring totals from PersonnelEvaluationScoringService and
 * determines canonical 'Passed' or 'Retained' results against frozen scale thresholds.
 *
 * Core Governance Invariants:
 * 1. Plan F produces only 'Passed' or 'Retained'.
 * 2. Passed != Promoted. A Passed result does not automatically update rank or bypass Plan H deliberation.
 * 3. Unresolved evaluator judgment items (accepted_points = null) strictly block result finalization.
 * 4. Unresolved null is never silently treated as zero.
 * 5. Historical rule versions (NDMU-PERSONNEL-RATING-V2) and evaluations remain immutable.
 */
class PersonnelEvaluationResultService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const SCALE_ADMINISTRATORS = 'ADMINISTRATORS_RANKING_SCALE';
    public const SCALE_NON_TEACHING = 'NON_TEACHING_PERSONNEL_RANKING_SCALE';

    public const RESULT_PASSED = 'Passed';
    public const RESULT_RETAINED = 'Retained';

    public const STATUS_PENDING = 'pending';
    public const STATUS_FINALIZED = 'finalized';

    public const REASON_RESULT_READY = 'result_ready';
    public const REASON_PENDING_EVALUATOR_JUDGMENT = 'pending_evaluator_judgment';
    public const REASON_PENDING_NON_TEACHING_AREA_A = 'pending_non_teaching_area_a';
    public const REASON_MISSING_SCALE = 'missing_scale';
    public const REASON_MISSING_RULE_VERSION = 'missing_rule_version';
    public const REASON_SCORING_INCOMPLETE = 'scoring_incomplete';
    public const REASON_INVALID_TOTAL = 'invalid_total';
    public const REASON_RESULT_ALREADY_FINALIZED = 'result_already_finalized';

    public const SCALE_CONFIGS = [
        self::SCALE_ADMINISTRATORS => [
            'title' => 'Rating Sheet for Administrators & Academic Personnel',
            'total_max' => 160.0,
            'passing_score' => 120.0,
            'area_caps' => [
                'A' => 70.0,
                'B' => 50.0,
                'C' => 40.0,
            ],
        ],
        self::SCALE_NON_TEACHING => [
            'title' => 'Rating Sheet for Non-Teaching Personnel',
            'total_max' => 150.0,
            'passing_score' => 75.0,
            'area_caps' => [
                'A' => 90.0,
                'B' => 60.0,
            ],
        ],
    ];

    protected PersonnelEvaluationScoringService $scoringService;

    public function __construct(?PersonnelEvaluationScoringService $scoringService = null)
    {
        $this->scoringService = $scoringService ?? new PersonnelEvaluationScoringService();
    }

    /**
     * Validates that the rule version matches the frozen canonical version.
     */
    public function validateRuleVersion(?string $ruleVersion): void
    {
        if (empty($ruleVersion) || trim($ruleVersion) !== self::RULE_VERSION) {
            throw new RuntimeException("Invalid or unsupported rule version [{$ruleVersion}]. Authoritative version is [" . self::RULE_VERSION . "].", 422);
        }
    }

    /**
     * Evaluates whether an evaluation context is eligible to have its final result determined.
     *
     * @param array $context [
     *   'scale_code' => string,
     *   'rule_version' => string,
     *   'items_by_area' => array,
     *   'non_teaching_area_a_completed' => bool (optional for Non-Teaching),
     *   'scoring_payloads' => array (optional)
     * ]
     * @return array [
     *   'can_finalize' => bool,
     *   'reason_code' => string,
     *   'message' => string,
     *   'pending_items_count' => int,
     *   'unresolved_items' => array
     * ]
     */
    public function canFinalizeResult(array $context): array
    {
        $scaleCode = $context['scale_code'] ?? null;
        if (empty($scaleCode) || !isset(self::SCALE_CONFIGS[$scaleCode])) {
            return [
                'can_finalize' => false,
                'reason_code' => self::REASON_MISSING_SCALE,
                'message' => "Evaluation is missing a valid assigned evaluation scale code.",
                'pending_items_count' => 0,
                'unresolved_items' => [],
            ];
        }

        $ruleVersion = $context['rule_version'] ?? null;
        if (empty($ruleVersion) || trim($ruleVersion) !== self::RULE_VERSION) {
            return [
                'can_finalize' => false,
                'reason_code' => self::REASON_MISSING_RULE_VERSION,
                'message' => "Evaluation rule version [{$ruleVersion}] is missing or does not match canonical version [" . self::RULE_VERSION . "].",
                'pending_items_count' => 0,
                'unresolved_items' => [],
            ];
        }

        $itemsByArea = $context['items_by_area'] ?? [];
        $unresolvedItems = [];

        // Check for unresolved evaluator judgment items across all areas
        foreach ($itemsByArea as $areaCode => $items) {
            if (!is_array($items)) {
                continue;
            }
            foreach ($items as $item) {
                $isJudgmentRequired = !empty($item['evaluator_judgment_required']);
                $acceptedPoints = $item['accepted_points'] ?? null;

                if ($isJudgmentRequired && $acceptedPoints === null) {
                    $unresolvedItems[] = [
                        'area' => $areaCode,
                        'category' => $item['category_code'] ?? $item['category'] ?? 'UNKNOWN',
                        'title' => $item['title'] ?? 'Accomplishment Item',
                        'criterion_cap' => $item['criterion_cap'] ?? null,
                    ];
                }
            }
        }

        if (count($unresolvedItems) > 0) {
            return [
                'can_finalize' => false,
                'reason_code' => self::REASON_PENDING_EVALUATOR_JUDGMENT,
                'message' => "Final result cannot be determined because " . count($unresolvedItems) . " evaluator-judgment criterion/criteria remain unresolved.",
                'pending_items_count' => count($unresolvedItems),
                'unresolved_items' => $unresolvedItems,
            ];
        }

        // For Non-Teaching scale, verify official Area A evaluation-only inputs
        if ($scaleCode === self::SCALE_NON_TEACHING) {
            $areaACompleted = $context['non_teaching_area_a_completed'] ?? false;
            $areaAItems = $itemsByArea['A'] ?? [];
            if (!$areaACompleted && empty($areaAItems)) {
                return [
                    'can_finalize' => false,
                    'reason_code' => self::REASON_PENDING_NON_TEACHING_AREA_A,
                    'message' => "Non-Teaching Area A (Performance and Personal Indicators) official evaluation has not been completed.",
                    'pending_items_count' => 1,
                    'unresolved_items' => [['area' => 'A', 'category' => 'AREA_A_EVALUATION', 'title' => 'Area A Official Rating Sheet']],
                ];
            }
        }

        return [
            'can_finalize' => true,
            'reason_code' => self::REASON_RESULT_READY,
            'message' => "All scoring items are fully resolved and eligible for result determination.",
            'pending_items_count' => 0,
            'unresolved_items' => [],
        ];
    }

    /**
     * Calculates the official accepted totals across all areas using PersonnelEvaluationScoringService.
     */
    public function calculateFinalAcceptedTotal(array $context): array
    {
        $scaleCode = $context['scale_code'] ?? self::SCALE_ADMINISTRATORS;
        $itemsByArea = $context['items_by_area'] ?? [];

        return $this->scoringService->calculateEvaluationTotals($scaleCode, $itemsByArea);
    }

    /**
     * Authoritative Result Determination.
     * Evaluates final accepted points against canonical scale passing threshold.
     *
     * @param array $context
     * @return array Complete Result DTO
     */
    public function determineResult(array $context): array
    {
        $scaleCode = $context['scale_code'] ?? self::SCALE_ADMINISTRATORS;
        $ruleVersion = $context['rule_version'] ?? self::RULE_VERSION;
        $evaluationId = $context['evaluation_id'] ?? 'EVAL-' . uniqid();
        $profileId = $context['personnel_profile_id'] ?? 'PROFILE-' . uniqid();

        $scaleConfig = self::SCALE_CONFIGS[$scaleCode] ?? self::SCALE_CONFIGS[self::SCALE_ADMINISTRATORS];
        $passingScore = (float)$scaleConfig['passing_score'];
        $maxScore = (float)$scaleConfig['total_max'];
        $scaleTitle = $scaleConfig['title'];

        // 1. Check eligibility for finalization
        $finalizationCheck = $this->canFinalizeResult($context);

        if (!$finalizationCheck['can_finalize']) {
            $totals = $this->calculateFinalAcceptedTotal($context);

            return [
                'evaluation_id' => $evaluationId,
                'personnel_profile_id' => $profileId,
                'evaluation_scale_code' => $scaleCode,
                'scale_title' => $scaleTitle,
                'rule_version' => $ruleVersion,
                'final_accepted_total' => (float)$totals['capped_total_points'],
                'passing_score' => $passingScore,
                'maximum_score' => $maxScore,
                'final_result' => null, // Strictly null when pending
                'result_status' => self::STATUS_PENDING,
                'result_reason' => $finalizationCheck['reason_code'],
                'scoring_complete' => false,
                'pending_items_count' => $finalizationCheck['pending_items_count'],
                'unresolved_items' => $finalizationCheck['unresolved_items'],
                'explanation' => $finalizationCheck['message'],
                'areas' => $totals['areas'],
                'finalized_at' => null,
            ];
        }

        // 2. Authoritative calculation of fully resolved totals
        $totals = $this->calculateFinalAcceptedTotal($context);
        $finalTotal = (float)$totals['capped_total_points'];

        // 3. Exact Threshold Comparison: >= passing_score -> Passed, < passing_score -> Retained
        $finalResult = ($finalTotal >= $passingScore) ? self::RESULT_PASSED : self::RESULT_RETAINED;

        // 4. Build Explanation
        $explanation = $this->buildResultExplanation([
            'scale_title' => $scaleTitle,
            'final_accepted_total' => $finalTotal,
            'passing_score' => $passingScore,
            'final_result' => $finalResult,
        ]);

        return [
            'evaluation_id' => $evaluationId,
            'personnel_profile_id' => $profileId,
            'evaluation_scale_code' => $scaleCode,
            'scale_title' => $scaleTitle,
            'rule_version' => $ruleVersion,
            'final_accepted_total' => $finalTotal,
            'passing_score' => $passingScore,
            'maximum_score' => $maxScore,
            'final_result' => $finalResult,
            'result_status' => self::STATUS_FINALIZED,
            'result_reason' => self::REASON_RESULT_READY,
            'scoring_complete' => true,
            'pending_items_count' => 0,
            'unresolved_items' => [],
            'explanation' => $explanation,
            'areas' => $totals['areas'],
            'finalized_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ];
    }

    /**
     * Builds standard explainability string for determined results.
     */
    public function buildResultExplanation(array $params): string
    {
        $scaleTitle = $params['scale_title'] ?? 'Evaluation Scale';
        $finalTotal = number_format((float)($params['final_accepted_total'] ?? 0.0), 2, '.', '');
        $passingScore = number_format((float)($params['passing_score'] ?? 0.0), 2, '.', '');
        $finalResult = $params['final_result'] ?? self::RESULT_RETAINED;

        if ($finalResult === self::RESULT_PASSED) {
            return "Final accepted total {$finalTotal} meets or exceeds the {$scaleTitle} passing score of {$passingScore}.";
        }

        return "Final accepted total {$finalTotal} is below the {$scaleTitle} passing score of {$passingScore}.";
    }

    /**
     * Validates that client payload does not forge or tamper with authoritative result values.
     */
    public function validateResultTampering(array $clientPayload, array $canonicalDto): void
    {
        if (isset($clientPayload['passing_score']) && (float)$clientPayload['passing_score'] !== (float)$canonicalDto['passing_score']) {
            throw new RuntimeException("Tampering detected: Client-supplied passing score [" . $clientPayload['passing_score'] . "] does not match canonical threshold [" . $canonicalDto['passing_score'] . "].", 422);
        }

        if (isset($clientPayload['maximum_score']) && (float)$clientPayload['maximum_score'] !== (float)$canonicalDto['maximum_score']) {
            throw new RuntimeException("Tampering detected: Client-supplied maximum score [" . $clientPayload['maximum_score'] . "] does not match canonical maximum [" . $canonicalDto['maximum_score'] . "].", 422);
        }

        if (isset($clientPayload['final_result']) && $clientPayload['final_result'] !== $canonicalDto['final_result']) {
            throw new RuntimeException("Tampering detected: Client-supplied final result [" . $clientPayload['final_result'] . "] does not match authoritative calculated result [" . ($canonicalDto['final_result'] ?? 'null') . "].", 422);
        }
    }

    /**
     * Idempotent Result Persistence Model.
     */
    public function persistResult(array $context): array
    {
        $resultDto = $this->determineResult($context);

        if ($resultDto['result_status'] !== self::STATUS_FINALIZED) {
            throw new RuntimeException("Cannot persist evaluation result: " . $resultDto['explanation'], 409);
        }

        return [
            'success' => true,
            'evaluation_id' => $resultDto['evaluation_id'],
            'persisted_result' => $resultDto,
            'persisted_at' => $resultDto['finalized_at'],
        ];
    }
}
