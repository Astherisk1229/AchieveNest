<?php

namespace App\Services;

use RuntimeException;

/**
 * PersonnelEvaluatorWorkspaceService
 *
 * Authoritative Backend Evaluator Workspace & Snapshot Review Service for Plan G — Phase G2.
 * Assembles the read-only evaluation workspace read model for authorized Deans and HR evaluators,
 * presenting the submitted Plan C snapshot, evidence links, Plan F scoring metadata, and pending
 * evaluator-judgment items without permitting scoring mutation (deferred to Phase G3).
 *
 * Core Governance Rules:
 * 1. Evaluator reviews the exact submitted snapshot; live portfolio edits do not replace snapshot.
 * 2. Access requires active, authorized reviewer assignment matching scope (Dean intra-college, HR scope).
 * 3. Department Secretary and Personnel self-review are strictly blocked.
 * 4. Plan F criteria, scoring metadata, and explanations are consumed directly without duplication.
 * 5. Evaluator-judgment items (B.3, B.6, B.5) display max allowed points and pending status.
 * 6. Non-Teaching Area A renders as read-only evaluator structure.
 * 7. Missing evidence renders controlled warning ('evidence_unavailable') without crashing.
 */
class PersonnelEvaluatorWorkspaceService
{
    public const WORKSPACE_VERSION = 'NDMU-EVAL-WORKSPACE-V2';
    public const RULE_VERSION = 'NDMU-PERSONNEL-RATING-V2';

    protected PersonnelReviewerAssignmentService $assignmentService;
    protected EvaluationInstrumentRegistry $instrumentRegistry;

    public function __construct(
        ?PersonnelReviewerAssignmentService $assignmentService = null,
        ?EvaluationInstrumentRegistry $instrumentRegistry = null
    ) {
        $this->assignmentService = $assignmentService ?? new PersonnelReviewerAssignmentService();
        $this->instrumentRegistry = $instrumentRegistry ?? new EvaluationInstrumentRegistry();
    }

    /**
     * Validates whether an authenticated actor has permission to access the evaluation workspace.
     */
    public function validateReviewerAccess(array $reviewerActor, array $evaluationRecord): void
    {
        $actorProfileId = (string)($reviewerActor['profile_id'] ?? $reviewerActor['id'] ?? '');
        $personnelProfileId = (string)($evaluationRecord['personnel_profile_id'] ?? '');

        // 1. Self-Review Block
        if ($actorProfileId !== '' && $actorProfileId === $personnelProfileId) {
            throw new RuntimeException("Access Denied: Candidate cannot access their own evaluation with reviewer privileges (Self-review prohibited).", 403);
        }

        $actorRoles = $reviewerActor['roles'] ?? [$reviewerActor['role'] ?? ''];

        // 2. Department Secretary Exclusion
        if (in_array('department_secretary', $actorRoles, true) && !in_array('dean', $actorRoles, true) && !in_array('hr_staff', $actorRoles, true) && !in_array('hr_admin', $actorRoles, true)) {
            throw new RuntimeException("Access Denied: Department Secretary role does not possess evaluator authority.", 403);
        }

        $assignedRole = $evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? null;
        $targetCollegeId = $evaluationRecord['evaluator_college_id'] ?? $evaluationRecord['target_college_id'] ?? null;

        // 3. Dean Scope Enforcement
        if ($assignedRole === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN) {
            if (!in_array('dean', $actorRoles, true)) {
                throw new RuntimeException("Access Denied: Evaluation is assigned to College Dean, but actor does not hold the active dean role.", 403);
            }
            $actorCollegeId = $reviewerActor['assigned_college_id'] ?? $reviewerActor['college_id'] ?? null;
            if ($targetCollegeId !== null && $actorCollegeId !== $targetCollegeId) {
                throw new RuntimeException("Access Denied: Dean of college [{$actorCollegeId}] cannot access evaluations for college [{$targetCollegeId}] (Cross-college access prohibited).", 403);
            }
            return;
        }

        // 4. HR Scope Enforcement
        if ($assignedRole === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            if (!in_array('hr_staff', $actorRoles, true) && !in_array('hr_admin', $actorRoles, true)) {
                throw new RuntimeException("Access Denied: Evaluation is assigned to HR Office, but actor is not an authorized HR evaluator.", 403);
            }
            return;
        }

        throw new RuntimeException("Access Denied: Reviewer assignment is unresolved or actor is unauthorized.", 403);
    }

    /**
     * Assembles the complete evaluator workspace read model.
     *
     * @param array $evaluationRecord Raw evaluation record
     * @param array $reviewerActor Authenticated reviewer context
     * @param array $snapshotData Submitted snapshot payload from Plan C
     * @return array Consolidated Evaluator Workspace DTO
     */
    public function getEvaluationWorkspace(array $evaluationRecord, array $reviewerActor, array $snapshotData = []): array
    {
        // 1. Authorize Reviewer
        $this->validateReviewerAccess($reviewerActor, $evaluationRecord);

        $evaluationId = $evaluationRecord['evaluation_id'] ?? $evaluationRecord['id'] ?? 'EVAL-UNKNOWN';
        $scaleCode = $evaluationRecord['evaluation_scale_code'] ?? EvaluationInstrumentRegistry::SCALE_ADMINISTRATORS;
        $ruleVersion = $evaluationRecord['rule_version'] ?? self::RULE_VERSION;

        $isAdminScale = ($scaleCode === EvaluationInstrumentRegistry::SCALE_ADMINISTRATORS);
        $scaleTitle = $isAdminScale
            ? 'Rating Sheet for Administrators & Academic Personnel'
            : 'Non-Teaching Personnel Rating Sheet for Ranking (Appendix N)';
        $scaleMax = $isAdminScale ? 160.0 : 150.0;
        $passingScore = $isAdminScale ? 120.0 : 75.0;

        // 2. Assemble Personnel Header Context
        $personnelHeader = [
            'personnel_profile_id' => $evaluationRecord['personnel_profile_id'] ?? '',
            'full_name' => $evaluationRecord['personnel_name'] ?? $evaluationRecord['faculty_name'] ?? 'Candidate Name',
            'employee_id' => $evaluationRecord['employee_id'] ?? $evaluationRecord['institutional_id'] ?? 'N/A',
            'email' => $evaluationRecord['email'] ?? 'candidate@ndmu.edu.ph',
            'personnel_group' => $evaluationRecord['personnel_group'] ?? 'faculty',
            'organizational_side' => $evaluationRecord['organizational_side'] ?? 'academic',
            'college_code' => $evaluationRecord['college_code'] ?? $evaluationRecord['evaluator_college_id'] ?? 'N/A',
            'college_name' => $evaluationRecord['college_name'] ?? $evaluationRecord['college'] ?? 'Academic College',
            'department_unit' => $evaluationRecord['department_unit'] ?? $evaluationRecord['department'] ?? 'Academic Department',
            'designation_title' => $evaluationRecord['designation_title'] ?? $evaluationRecord['designation'] ?? 'Faculty Member',
            'faculty_workload_status' => $evaluationRecord['faculty_workload_status'] ?? 'Full-Time',
            'current_rank' => $evaluationRecord['current_rank'] ?? $evaluationRecord['academic_rank'] ?? 'Assistant Professor I',
            'employment_status' => $evaluationRecord['employment_status'] ?? 'Permanent',
            'evaluation_status' => $evaluationRecord['evaluation_status'] ?? $evaluationRecord['status'] ?? 'submitted',
            'submission_date' => $evaluationRecord['submitted_at'] ?? $evaluationRecord['submittedDate'] ?? gmdate('Y-m-d\TH:i:s\Z'),
            'assigned_reviewer_role' => $evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? 'dean',
            'evaluator_name' => $evaluationRecord['evaluator_name'] ?? 'Assigned Reviewer',
        ];

        // 3. Assemble Areas & Items Read Model
        $itemsByArea = $this->buildWorkspaceItemsByArea($scaleCode, $snapshotData, $evaluationRecord);

        // Count pending evaluator-judgment items
        $pendingJudgmentCount = 0;
        foreach ($itemsByArea as $areaKey => $area) {
            foreach ($area['items'] as $item) {
                if (!empty($item['is_evaluator_judgment_required']) && ($item['accepted_points'] === null)) {
                    $pendingJudgmentCount++;
                }
            }
        }

        // 4. Assemble Scale Context Header
        $scaleHeader = [
            'evaluation_scale_code' => $scaleCode,
            'scale_title' => $scaleTitle,
            'rule_version' => $ruleVersion,
            'maximum_score' => $scaleMax,
            'passing_score' => $passingScore,
            'is_non_teaching' => !$isAdminScale,
            'pending_judgment_count' => $pendingJudgmentCount,
            'scoring_completeness' => ($pendingJudgmentCount === 0) ? 'scoring_complete' : 'pending_evaluator_judgment',
        ];

        return [
            'workspace_version' => self::WORKSPACE_VERSION,
            'evaluation_id' => $evaluationId,
            'is_read_only_snapshot' => true,
            'personnel_context' => $personnelHeader,
            'scale_context' => $scaleHeader,
            'areas' => $itemsByArea,
            'loaded_at' => gmdate('Y-m-d\TH:i:s\Z'),
        ];
    }

    /**
     * Builds structured Area sections with items, evidence links, and Plan F scoring metadata.
     */
    protected function buildWorkspaceItemsByArea(string $scaleCode, array $snapshotData, array $evaluationRecord): array
    {
        $rawItems = $snapshotData['items'] ?? $evaluationRecord['items'] ?? [];

        if ($scaleCode === EvaluationInstrumentRegistry::SCALE_NON_TEACHING) {
            return [
                'AREA_A' => [
                    'area_code' => 'A',
                    'name' => 'Area A: Performance and Personal Indicators',
                    'max_points' => 90.0,
                    'is_evaluator_only' => true,
                    'entry_policy' => 'evaluator_only',
                    'rating_structure' => [
                        ['indicator' => 'Job Performance', 'weight' => 50.0, 'status' => 'pending_hr_evaluation'],
                        ['indicator' => 'Personal Attitudes and Qualities', 'weight' => 10.0, 'status' => 'pending_hr_evaluation'],
                        ['indicator' => 'Efficiency', 'weight' => 30.0, 'status' => 'pending_hr_evaluation'],
                    ],
                    'items' => [],
                    'area_raw_sum' => 0.0,
                    'area_capped_total' => 0.0,
                ],
                'AREA_B' => [
                    'area_code' => 'B',
                    'name' => 'Area B: Service and Leadership',
                    'max_points' => 60.0,
                    'is_evaluator_only' => false,
                    'items' => $this->formatSubmittedItems($rawItems, 'B', $scaleCode),
                    'area_raw_sum' => $this->sumItemsPoints($rawItems, 'B'),
                    'area_capped_total' => min(60.0, $this->sumItemsPoints($rawItems, 'B')),
                ],
            ];
        }

        // Administrators Scale (Areas A, B, C)
        return [
            'AREA_A' => [
                'area_code' => 'A',
                'name' => 'Area A: Professional Development',
                'max_points' => 70.0,
                'is_evaluator_only' => false,
                'items' => $this->formatSubmittedItems($rawItems, 'A', $scaleCode),
                'area_raw_sum' => $this->sumItemsPoints($rawItems, 'A'),
                'area_capped_total' => min(70.0, $this->sumItemsPoints($rawItems, 'A')),
            ],
            'AREA_B' => [
                'area_code' => 'B',
                'name' => 'Area B: Productivity and Creative Work',
                'max_points' => 50.0,
                'is_evaluator_only' => false,
                'items' => $this->formatSubmittedItems($rawItems, 'B', $scaleCode),
                'area_raw_sum' => $this->sumItemsPoints($rawItems, 'B'),
                'area_capped_total' => min(50.0, $this->sumItemsPoints($rawItems, 'B')),
            ],
            'AREA_C' => [
                'area_code' => 'C',
                'name' => 'Area C: Service to the Institution and Community',
                'max_points' => 40.0,
                'is_evaluator_only' => false,
                'items' => $this->formatSubmittedItems($rawItems, 'C', $scaleCode),
                'area_raw_sum' => $this->sumItemsPoints($rawItems, 'C'),
                'area_capped_total' => min(40.0, $this->sumItemsPoints($rawItems, 'C')),
            ],
        ];
    }

    /**
     * Formats submitted accomplishment items with evidence links and Plan F scoring explanations.
     */
    protected function formatSubmittedItems(array $items, string $areaCode, string $scaleCode): array
    {
        $targetArea = strtoupper(trim($areaCode));
        $areaItems = array_filter($items, function ($item) use ($targetArea) {
            $rawArea = strtoupper(trim((string)($item['categoryArea'] ?? $item['area_code'] ?? $item['area'] ?? '')));
            $normalizedArea = preg_replace('/^AREA_?/', '', $rawArea);
            return $normalizedArea === $targetArea || $rawArea === $targetArea;
        });

        $formatted = [];
        foreach ($areaItems as $item) {
            $criterionCode = $item['criterionCode'] ?? $item['criterion_code'] ?? $item['category_code'] ?? 'GENERAL';
            $isJudgment = !empty($item['evaluator_judgment_required'])
                || ($scaleCode === EvaluationInstrumentRegistry::SCALE_ADMINISTRATORS && in_array($criterionCode, ['B.3', 'B.6'], true))
                || ($scaleCode === EvaluationInstrumentRegistry::SCALE_NON_TEACHING && in_array($criterionCode, ['B.5'], true));

            $maxAllowed = 40.0;
            if ($criterionCode === 'B.6') {
                $maxAllowed = 20.0;
            } elseif ($criterionCode === 'B.5') {
                $maxAllowed = 30.0;
            }

            // Evidence Status & Link
            $fileName = $item['fileName'] ?? $item['proof_file_name'] ?? $item['proof'] ?? null;
            $evidenceId = $item['evidence_id'] ?? $item['evidenceId'] ?? null;
            $hasEvidence = !empty($evidenceId || $fileName);
            $evidenceStatus = $hasEvidence ? 'preview_ready' : 'evidence_unavailable';
            $previewUrl = $evidenceId 
                ? "/api/v1/evidence/personnel/{$evidenceId}/preview" 
                : ($fileName ? "/api/v1/evidence/preview/{$fileName}" : null);

            $formatted[] = [
                'id' => $item['id'] ?? 'ITEM-' . uniqid(),
                'criterion_code' => $criterionCode,
                'criterion_title' => $item['criterionTitle'] ?? $item['title'] ?? 'Criterion Item',
                'achievement_title' => $item['evidenceTitle'] ?? $item['title'] ?? 'Submitted Title',
                'submitted_metadata' => $item['scoringPayload'] ?? $item['metadata'] ?? [],
                'evidence_reference' => [
                    'evidence_id' => $evidenceId,
                    'file_name' => $fileName,
                    'status' => $evidenceStatus,
                    'preview_url' => $previewUrl,
                    'warning_message' => $hasEvidence ? null : "Required evidence attachment is missing or unavailable for [{$criterionCode}].",
                ],
                'raw_points' => (float)($item['raw_points'] ?? $item['awardedPoints'] ?? 0.0),
                'criterion_capped_points' => (float)($item['criterion_capped_points'] ?? $item['awardedPoints'] ?? 0.0),
                'accepted_points' => $isJudgment ? ($item['accepted_points'] ?? null) : (float)($item['criterion_capped_points'] ?? $item['awardedPoints'] ?? 0.0),
                'is_evaluator_judgment_required' => $isJudgment,
                'max_allowed_points' => $isJudgment ? $maxAllowed : null,
                'evaluator_judgment_status' => $isJudgment ? ($item['accepted_points'] !== null ? 'scored' : 'awaiting_evaluator') : 'not_applicable',
                'scoring_explanation' => $item['evaluatorRemarks'] ?? $item['explanation'] ?? "Scored under canonical Plan F rules.",
                'is_read_only' => true,
            ];
        }

        return array_values($formatted);
    }

    /**
     * Calculates sum of points for an area.
     */
    protected function sumItemsPoints(array $items, string $areaCode): float
    {
        $targetArea = strtoupper(trim($areaCode));
        $sum = 0.0;
        foreach ($items as $item) {
            $rawArea = strtoupper(trim((string)($item['categoryArea'] ?? $item['area_code'] ?? $item['area'] ?? '')));
            $normalizedArea = preg_replace('/^AREA_?/', '', $rawArea);
            if ($normalizedArea === $targetArea || $rawArea === $targetArea) {
                $sum += (float)($item['awardedPoints'] ?? $item['criterion_capped_points'] ?? $item['raw_points'] ?? 0.0);
            }
        }
        return $sum;
    }
}
