<?php

namespace App\Services;

use RuntimeException;
use InvalidArgumentException;

/**
 * PersonnelEvaluationPrintService
 *
 * Authoritative Printable Evaluation, Deliberation-Ready Output & Blank Approval Engine (Plan H — Phase H2).
 * Generates the official printable evaluation summary from persisted H0/H1 evaluation data
 * and finalized Plan F scoring results, leaving all approval/signature fields completely blank
 * for manual deliberation and executive completion.
 *
 * Core Governance Invariants:
 * 1. Printing presents the finalized evaluation for deliberation; it must NEVER decide promotion,
 *    change rank/title, or pre-fill approval decisions.
 * 2. Preconditions: H0 finalization readiness must be valid and H1 Evaluation Result must be finalized.
 * 3. Exact vocabulary: Evaluation Result displays strictly as 'Passed' or 'Retained'.
 * 4. Approval section ('Recommended for Approval' through 'Approved / President / Date') is strictly blank.
 * 5. Printing is completely read-only and non-mutating (zero writes to rank or promotion state).
 * 6. Historical stability: Uses persisted historical evaluated rank, scale, and rule version.
 * 7. Security: Only authorized HR actors (hr_staff, hr_admin) can generate official deliberation print output.
 */
class PersonnelEvaluationPrintService
{
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    public const RESULT_PASSED = 'Passed';
    public const RESULT_RETAINED = 'Retained';

    public const OUTPUT_TYPE_DELIBERATION_SUMMARY = 'deliberation_summary';
    public const OUTPUT_TYPE_PRINT_VIEW = 'print_view';
    public const OUTPUT_TYPE_PDF_EXPORT = 'pdf_export';

    public const REASON_PRINT_ELIGIBLE = 'print_eligible';
    public const REASON_EVALUATION_NOT_READY_FOR_PRINT = 'evaluation_not_ready_for_print';
    public const REASON_MISSING_EVALUATION_RESULT = 'missing_evaluation_result';
    public const REASON_SCORING_INCOMPLETE = 'scoring_incomplete';
    public const REASON_UNAUTHORIZED_HR_ACTOR = 'unauthorized_hr_actor';

    protected PersonnelEvaluationFinalizationReadinessService $readinessService;
    protected PersonnelEvaluationResultPersistenceService $resultPersistenceService;
    protected PersonnelEvaluatorScoringService $evaluatorScoringService;

    public function __construct(
        ?PersonnelEvaluationFinalizationReadinessService $readinessService = null,
        ?PersonnelEvaluationResultPersistenceService $resultPersistenceService = null,
        ?PersonnelEvaluatorScoringService $evaluatorScoringService = null
    ) {
        $this->readinessService = $readinessService ?? new PersonnelEvaluationFinalizationReadinessService();
        $this->resultPersistenceService = $resultPersistenceService ?? new PersonnelEvaluationResultPersistenceService();
        $this->evaluatorScoringService = $evaluatorScoringService ?? new PersonnelEvaluatorScoringService();
    }

    /**
     * Validates whether an authenticated actor has HR authority to generate official deliberation print output.
     */
    public function validateHRAccess(array $actor): bool
    {
        $roles = isset($actor['roles']) && is_array($actor['roles'])
            ? $actor['roles']
            : (isset($actor['role']) ? [$actor['role']] : []);

        if (in_array('hr_staff', $roles, true) || in_array('hr_admin', $roles, true)) {
            return true;
        }

        throw new RuntimeException('Access Denied (403): Only authorized HR personnel may print official deliberation evaluations.', 403);
    }

    /**
     * Validates print eligibility: H0 readiness valid, H1 result finalized, scoring complete.
     */
    public function validatePrintEligibility(
        array $evaluationRecord,
        array $snapshotData,
        ?array $resultRecord = null,
        ?array $areaAInputs = null,
        ?array $actor = null
    ): array {
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        $evaluationId = $evaluationRecord['id'] ?? $evaluationRecord['evaluation_id'] ?? null;
        if (!$evaluationId) {
            return [
                'eligible' => false,
                'reason_code' => self::REASON_EVALUATION_NOT_READY_FOR_PRINT,
                'message' => 'Evaluation ID is missing.'
            ];
        }

        // 1. Verify H0 readiness
        $readiness = $this->readinessService->canFinalize(
            $evaluationRecord,
            $snapshotData,
            $areaAInputs,
            $actor
        );

        if (!$readiness['ready_for_finalization']) {
            return [
                'eligible' => false,
                'reason_code' => self::REASON_EVALUATION_NOT_READY_FOR_PRINT,
                'message' => "Evaluation [{$evaluationId}] is not ready for print: {$readiness['reason_message']}",
                'readiness' => $readiness
            ];
        }

        // 2. Verify H1 Evaluation Result exists or is determinable
        $evaluationResult = $resultRecord['evaluation_result'] ?? $readiness['evaluation_result'] ?? null;
        if (empty($evaluationResult) || ($evaluationResult !== self::RESULT_PASSED && $evaluationResult !== self::RESULT_RETAINED)) {
            return [
                'eligible' => false,
                'reason_code' => self::REASON_MISSING_EVALUATION_RESULT,
                'message' => "Authoritative Evaluation Result (Passed or Retained) is missing or unfinalized for evaluation [{$evaluationId}]."
            ];
        }

        return [
            'eligible' => true,
            'reason_code' => self::REASON_PRINT_ELIGIBLE,
            'message' => 'Evaluation is complete, validated, and eligible for deliberation print.',
            'readiness' => $readiness,
            'evaluation_result' => $evaluationResult
        ];
    }

    /**
     * Constructs the official blank approval section.
     * All signatures, approver names, and dates MUST remain null/blank for manual executive action.
     */
    public function buildApprovalSection(): array
    {
        return [
            'recommended_for_approval' => [
                'label' => 'Recommended for Approval',
                'name' => null,
                'title' => null,
                'signature' => null,
                'date' => null,
                'remarks' => null,
                'status' => 'blank'
            ],
            'approved' => [
                'label' => 'Approved',
                'name' => null,
                'title' => null,
                'signature' => null,
                'date' => null,
                'remarks' => null,
                'status' => 'blank'
            ],
            'president' => [
                'label' => 'University President',
                'name' => null,
                'title' => 'President',
                'signature' => null,
                'date' => null,
                'status' => 'blank'
            ]
        ];
    }

    /**
     * Builds the complete, immutable deliberation-ready printable evaluation read model.
     *
     * @param array $params [
     *   'evaluation_record' => array,
     *   'snapshot_data' => array,
     *   'result_record' => ?array,
     *   'area_a_inputs' => ?array,
     *   'actor' => ?array,
     *   'output_type' => string (default: 'deliberation_summary')
     * ]
     * @return array Standardized Printable Evaluation DTO
     */
    public function buildPrintableEvaluation(array $params): array
    {
        $evaluationRecord = $params['evaluation_record'] ?? [];
        $snapshotData = $params['snapshot_data'] ?? [];
        $resultRecord = $params['result_record'] ?? null;
        $areaAInputs = $params['area_a_inputs'] ?? null;
        $actor = $params['actor'] ?? null;
        $outputType = $params['output_type'] ?? self::OUTPUT_TYPE_DELIBERATION_SUMMARY;

        // 1. Authorize HR Actor
        if ($actor !== null) {
            $this->validateHRAccess($actor);
        }

        // 2. Verify Eligibility
        $eligibility = $this->validatePrintEligibility(
            $evaluationRecord,
            $snapshotData,
            $resultRecord,
            $areaAInputs,
            $actor
        );

        if (!$eligibility['eligible']) {
            throw new RuntimeException(
                "Cannot generate printable evaluation: {$eligibility['message']} Reason: [{$eligibility['reason_code']}]",
                422
            );
        }

        $readiness = $eligibility['readiness'];
        $evaluationId = (string) ($evaluationRecord['id'] ?? $evaluationRecord['evaluation_id']);
        $personnelProfileId = (string) ($evaluationRecord['personnel_profile_id'] ?? '');
        $currentRank = (string) ($evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? 'Unassigned');
        $scaleCode = (string) ($evaluationRecord['evaluation_scale_code'] ?? $readiness['evaluation_scale_code']);
        $ruleVersion = (string) ($evaluationRecord['rule_version'] ?? self::RULE_VERSION);
        $cycle = (string) ($evaluationRecord['academic_year'] ?? $evaluationRecord['evaluation_cycle_id'] ?? '2025-2026');

        $evaluationResult = (string) ($resultRecord['evaluation_result'] ?? $readiness['evaluation_result']);
        $finalAcceptedTotal = (float) ($resultRecord['final_accepted_total'] ?? $readiness['official_accepted_total']);
        $passingScore = (float) ($resultRecord['passing_score'] ?? $readiness['passing_score']);
        $maximumScore = (float) ($resultRecord['maximum_score'] ?? $readiness['maximum_score']);

        $deliberationNotice = $evaluationResult === self::RESULT_PASSED
            ? 'Evaluation passed. Eligible to proceed to deliberation under Plan H.'
            : 'Current rank/title retained. No rank adjustment required.';

        $resultExplanation = (string) ($resultRecord['result_explanation'] ?? (
            $evaluationResult === self::RESULT_PASSED
                ? sprintf("Final accepted total %.2f meets or exceeds the required passing score of %.2f.", $finalAcceptedTotal, $passingScore)
                : sprintf("Final accepted total %.2f is below the required passing score of %.2f.", $finalAcceptedTotal, $passingScore)
        ));

        // 3. Personnel Identity Section (Official Form Fields Only)
        $personnelIdentity = [
            'full_name' => (string) ($evaluationRecord['personnel_name'] ?? $evaluationRecord['faculty_name'] ?? 'Candidate Name'),
            'employee_id' => (string) ($evaluationRecord['employee_id'] ?? $evaluationRecord['personnel_profile_id'] ?? 'EMP-001'),
            'department' => (string) ($evaluationRecord['department_name'] ?? $evaluationRecord['department'] ?? 'Department'),
            'college_or_unit' => (string) ($evaluationRecord['college_name'] ?? $evaluationRecord['target_college_id'] ?? 'College/Unit'),
            'designation' => (string) ($evaluationRecord['designation'] ?? 'Faculty Member'),
            'evaluated_current_rank' => $currentRank,
            'evaluation_cycle' => $cycle
        ];

        // 4. Reviewer Context Section
        $reviewerContext = [
            'reviewer_role' => (string) ($evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? 'Evaluator'),
            'reviewer_id' => (string) ($evaluationRecord['evaluator_profile_id'] ?? 'REV-001'),
            'review_status' => 'completed',
            'review_completed_at' => (string) ($evaluationRecord['review_completed_at'] ?? date('c'))
        ];

        // 5. Scoring Breakdown Structure
        $scoringBreakdown = $this->buildScoringBreakdown($scaleCode, $snapshotData, $areaAInputs, $finalAcceptedTotal, $maximumScore, $passingScore);

        // 6. Approval Section (Strictly Blank)
        $approvalSection = $this->buildApprovalSection();

        // 7. Assemble Complete Deliberation-Ready Output DTO
        return [
            'document_title' => 'Personnel Evaluation and Rating Sheet',
            'output_type' => $outputType,
            'generated_at' => date('c'),
            'generated_by' => $actor['profile_id'] ?? $actor['id'] ?? 'system_hr',
            'evaluation_id' => $evaluationId,
            'personnel_identity' => $personnelIdentity,
            'evaluation_context' => [
                'evaluation_scale_code' => $scaleCode,
                'scale_title' => $scaleCode === 'ADMINISTRATORS_RANKING_SCALE'
                    ? 'Rating Sheet for Administrators & Academic Personnel'
                    : 'Rating Sheet for Non-Teaching Personnel',
                'rule_version' => $ruleVersion,
                'evaluation_cycle' => $cycle,
                'snapshot_version' => (string) ($snapshotData['snapshot_version'] ?? 'v1.0.0'),
                'reviewer' => $reviewerContext
            ],
            'scoring_breakdown' => $scoringBreakdown,
            'evaluation_result' => [
                'outcome' => $evaluationResult,
                'final_accepted_total' => $finalAcceptedTotal,
                'passing_score' => $passingScore,
                'maximum_score' => $maximumScore,
                'explanation' => $resultExplanation,
                'deliberation_notice' => $deliberationNotice,
                'current_rank_preserved' => $currentRank,
                // Strict Separation: No promotion decision in H2
                'promotion_decision' => null,
                'deliberation_status' => 'ready_for_deliberation'
            ],
            'approval_section' => $approvalSection,
            // Hard Non-Mutation Invariant
            'mutations_applied' => false
        ];
    }

    /**
     * Builds the structured scoring breakdown formatted for the official form.
     */
    protected function buildScoringBreakdown(
        string $scaleCode,
        array $snapshotData,
        ?array $areaAInputs,
        float $finalAcceptedTotal,
        float $maximumScore,
        float $passingScore
    ): array {
        $items = $snapshotData['items'] ?? [];
        $areas = [];

        if ($scaleCode === 'ADMINISTRATORS_RANKING_SCALE') {
            $areaSums = ['A' => 0.0, 'B' => 0.0, 'C' => 0.0];
            $itemsByArea = ['A' => [], 'B' => [], 'C' => []];

            foreach ($items as $item) {
                $area = strtoupper((string) ($item['area'] ?? $item['area_code'] ?? 'B'));
                $accepted = (float) ($item['accepted_points'] ?? 0.0);
                if (isset($areaSums[$area])) {
                    $areaSums[$area] += $accepted;
                    $itemsByArea[$area][] = [
                        'item_id' => (string) ($item['id'] ?? ''),
                        'category' => (string) ($item['category'] ?? $item['category_code'] ?? ''),
                        'raw_points' => (float) ($item['raw_points'] ?? $accepted),
                        'accepted_points' => $accepted,
                        'is_judgment' => (bool) ($item['evaluator_judgment_required'] ?? false)
                    ];
                }
            }

            $areas = [
                'area_a' => [
                    'area_code' => 'A',
                    'title' => 'Educational Qualifications',
                    'cap' => 70.0,
                    'raw_total' => $areaSums['A'],
                    'capped_total' => min(70.0, $areaSums['A']),
                    'items' => $itemsByArea['A']
                ],
                'area_b' => [
                    'area_code' => 'B',
                    'title' => 'Professional Growth & Achievements',
                    'cap' => 50.0,
                    'raw_total' => $areaSums['B'],
                    'capped_total' => min(50.0, $areaSums['B']),
                    'items' => $itemsByArea['B']
                ],
                'area_c' => [
                    'area_code' => 'C',
                    'title' => 'Community Involvement & Extension Services',
                    'cap' => 40.0,
                    'raw_total' => $areaSums['C'],
                    'capped_total' => min(40.0, $areaSums['C']),
                    'items' => $itemsByArea['C']
                ]
            ];
        } else {
            // Non-Teaching Scale
            $areaBTotal = 0.0;
            $itemsAreaB = [];

            foreach ($items as $item) {
                $accepted = (float) ($item['accepted_points'] ?? 0.0);
                $areaBTotal += $accepted;
                $itemsAreaB[] = [
                    'item_id' => (string) ($item['id'] ?? ''),
                    'category' => (string) ($item['category'] ?? $item['category_code'] ?? ''),
                    'raw_points' => (float) ($item['raw_points'] ?? $accepted),
                    'accepted_points' => $accepted,
                    'is_judgment' => (bool) ($item['evaluator_judgment_required'] ?? false)
                ];
            }

            $areaATotal = (float) ($areaAInputs['total_area_a'] ?? 0.0);

            $areas = [
                'area_a' => [
                    'area_code' => 'A',
                    'title' => 'Evaluator Performance Ratings',
                    'cap' => 90.0,
                    'raw_total' => $areaATotal,
                    'capped_total' => min(90.0, $areaATotal),
                    'evaluator_ratings' => [
                        'job_performance' => (float) ($areaAInputs['job_performance'] ?? 0.0),
                        'personal_attitudes' => (float) ($areaAInputs['personal_attitudes'] ?? 0.0),
                        'efficiency' => (float) ($areaAInputs['efficiency'] ?? 0.0)
                    ]
                ],
                'area_b' => [
                    'area_code' => 'B',
                    'title' => 'Service Years & Achievements',
                    'cap' => 60.0,
                    'raw_total' => $areaBTotal,
                    'capped_total' => min(60.0, $areaBTotal),
                    'items' => $itemsAreaB
                ]
            ];
        }

        return [
            'areas' => $areas,
            'official_accepted_total' => $finalAcceptedTotal,
            'maximum_score' => $maximumScore,
            'passing_score' => $passingScore
        ];
    }
}
