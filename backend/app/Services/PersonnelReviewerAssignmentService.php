<?php

namespace App\Services;

use RuntimeException;

/**
 * PersonnelReviewerAssignmentService
 *
 * Authoritative Backend Reviewer Assignment & Queue Service for Plan G — Phase G1.
 * Resolves reviewer routes, binds specific evaluator actors, validates scope boundaries,
 * manages the submitted -> in_evaluation transition, and enforces strict self-review protection.
 *
 * Core Architectural Rules:
 * 1. Reviewer assignment is derived from authoritative Personnel context and G0 routing registry.
 * 2. The client must never select or supply the evaluator.
 * 3. Dean assignment is strictly intra-college; missing Dean assignment does NOT fall back to HR.
 * 4. HR is assigned only to confirmed HR-routed personnel (Non-Teaching Non-Academic, Deans, VPs).
 * 5. Self-review is strictly prohibited.
 * 6. Only fully assigned evaluations may transition to 'in_evaluation'.
 */
class PersonnelReviewerAssignmentService
{
    public const RULE_VERSION = 'NDMU-REVIEWER-ROUTING-V1';

    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_IN_EVALUATION = 'in_evaluation';
    public const STATUS_READY_FOR_FINALIZATION = 'ready_for_finalization';
    public const STATUS_RETURNED_FOR_REVISION = 'returned_for_revision';
    public const STATUS_COMPLETED = 'completed';

    public const ASSIGNMENT_STATUS_ASSIGNED = 'assigned';
    public const ASSIGNMENT_STATUS_UNRESOLVED = 'unresolved';

    public const REASON_ROUTE_ASSIGNED = 'route_assigned';
    public const REASON_DEAN_ASSIGNMENT_MISSING = 'dean_assignment_missing';
    public const REASON_REVIEWER_NOT_FOUND = 'reviewer_not_found';
    public const REASON_SELF_REVIEW_PROHIBITED = 'self_review_prohibited';
    public const REASON_REVIEWER_SCOPE_VIOLATION = 'reviewer_scope_violation';
    public const REASON_REVIEWER_ROUTE_UNRESOLVED = 'reviewer_route_unresolved';
    public const REASON_DEPARTMENT_SECRETARY_EXCLUDED = 'department_secretary_excluded';

    /**
     * Resolves the canonical reviewer route from personnel evaluation context.
     */
    public function resolveReviewerRoute(array $evaluationContext): array
    {
        return PersonnelReviewerRoutingRegistry::resolveReviewerRoute($evaluationContext);
    }

    /**
     * Resolves the specific reviewer actor (User/Profile) for the evaluation.
     *
     * @param array $evaluationContext Personnel evaluation context
     * @param array $directoryContext Lookup directory of active Deans and HR Staff
     * @return array Resolved Actor DTO
     */
    public function resolveReviewerActor(array $evaluationContext, array $directoryContext = []): array
    {
        $route = $this->resolveReviewerRoute($evaluationContext);

        if (($route['status'] ?? '') !== 'resolved') {
            return [
                'status' => self::ASSIGNMENT_STATUS_UNRESOLVED,
                'reviewer_role' => null,
                'reviewer_profile_id' => null,
                'evaluator_college_id' => null,
                'reason_code' => $route['reason_code'] ?? self::REASON_REVIEWER_ROUTE_UNRESOLVED,
                'routing_reason' => $route['routing_reason'] ?? 'Reviewer route could not be resolved.',
            ];
        }

        $personnelProfileId = (string)($evaluationContext['personnel_profile_id'] ?? '');
        $assignedRole = $route['authorized_reviewer_role'];
        $targetCollegeId = $route['target_college_id'] ?? null;

        // 1. Resolve Dean Reviewer
        if ($assignedRole === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN) {
            $deansByCollege = $directoryContext['deans_by_college'] ?? [];
            $activeDean = $deansByCollege[$targetCollegeId] ?? null;

            if ($activeDean === null) {
                // Rule: If no Dean is assigned for this college, do NOT fall back to HR.
                return [
                    'status' => self::ASSIGNMENT_STATUS_UNRESOLVED,
                    'reviewer_role' => PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN,
                    'reviewer_profile_id' => null,
                    'evaluator_college_id' => $targetCollegeId,
                    'reason_code' => self::REASON_DEAN_ASSIGNMENT_MISSING,
                    'routing_reason' => "Active Dean assignment missing for college [{$targetCollegeId}]. HR fallback is prohibited.",
                ];
            }

            $deanProfileId = (string)($activeDean['profile_id'] ?? $activeDean['id'] ?? '');

            // Self-Review Check
            if ($deanProfileId !== '' && $deanProfileId === $personnelProfileId) {
                return [
                    'status' => self::ASSIGNMENT_STATUS_UNRESOLVED,
                    'reviewer_role' => PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN,
                    'reviewer_profile_id' => null,
                    'evaluator_college_id' => $targetCollegeId,
                    'reason_code' => self::REASON_SELF_REVIEW_PROHIBITED,
                    'routing_reason' => 'Evaluated candidate is the Dean of the college. Self-review is prohibited.',
                ];
            }

            return [
                'status' => self::ASSIGNMENT_STATUS_ASSIGNED,
                'reviewer_role' => PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN,
                'reviewer_profile_id' => $deanProfileId,
                'reviewer_name' => $activeDean['full_name'] ?? $activeDean['name'] ?? 'College Dean',
                'evaluator_college_id' => $targetCollegeId,
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'routing_reason' => $route['routing_reason'],
            ];
        }

        // 2. Resolve HR Reviewer
        if ($assignedRole === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            $hrStaffList = $directoryContext['hr_staff_list'] ?? [];
            $defaultHr = $hrStaffList[0] ?? ['id' => 'HR-DEFAULT-EVALUATOR', 'full_name' => 'HR Evaluation Staff'];

            $hrProfileId = (string)($defaultHr['profile_id'] ?? $defaultHr['id'] ?? '');

            // Self-Review Check
            if ($hrProfileId !== '' && $hrProfileId === $personnelProfileId) {
                // Pick next available HR staff if evaluated candidate is an HR staff
                if (count($hrStaffList) > 1) {
                    $defaultHr = $hrStaffList[1];
                    $hrProfileId = (string)($defaultHr['profile_id'] ?? $defaultHr['id'] ?? '');
                } else {
                    return [
                        'status' => self::ASSIGNMENT_STATUS_UNRESOLVED,
                        'reviewer_role' => PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR,
                        'reviewer_profile_id' => null,
                        'evaluator_college_id' => null,
                        'reason_code' => self::REASON_SELF_REVIEW_PROHIBITED,
                        'routing_reason' => 'Candidate is the assigned HR evaluator. Alternate evaluator required to prevent self-review.',
                    ];
                }
            }

            return [
                'status' => self::ASSIGNMENT_STATUS_ASSIGNED,
                'reviewer_role' => PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR,
                'reviewer_profile_id' => $hrProfileId,
                'reviewer_name' => $defaultHr['full_name'] ?? $defaultHr['name'] ?? 'HR Office Evaluator',
                'evaluator_college_id' => null,
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'routing_reason' => $route['routing_reason'],
            ];
        }

        return [
            'status' => self::ASSIGNMENT_STATUS_UNRESOLVED,
            'reviewer_role' => null,
            'reviewer_profile_id' => null,
            'evaluator_college_id' => null,
            'reason_code' => self::REASON_REVIEWER_ROUTE_UNRESOLVED,
            'routing_reason' => 'Unrecognized reviewer role.',
        ];
    }

    /**
     * Authoritative Reviewer Assignment Execution.
     * Binds reviewer assignment to an evaluation record idempotently.
     */
    public function assignReviewer(array $evaluationRecord, array $directoryContext = []): array
    {
        $actorResolution = $this->resolveReviewerActor($evaluationRecord, $directoryContext);

        $evaluationId = $evaluationRecord['evaluation_id'] ?? $evaluationRecord['id'] ?? 'EVAL-' . uniqid();
        $currentStatus = $evaluationRecord['status'] ?? self::STATUS_SUBMITTED;

        if ($actorResolution['status'] === self::ASSIGNMENT_STATUS_ASSIGNED) {
            return [
                'evaluation_id' => $evaluationId,
                'personnel_profile_id' => $evaluationRecord['personnel_profile_id'] ?? null,
                'assigned_reviewer_role' => $actorResolution['reviewer_role'],
                'evaluator_profile_id' => $actorResolution['reviewer_profile_id'],
                'evaluator_name' => $actorResolution['reviewer_name'] ?? null,
                'evaluator_college_id' => $actorResolution['evaluator_college_id'],
                'assignment_status' => self::ASSIGNMENT_STATUS_ASSIGNED,
                'reason_code' => $actorResolution['reason_code'],
                'routing_reason' => $actorResolution['routing_reason'],
                'assigned_at' => $evaluationRecord['assigned_at'] ?? gmdate('Y-m-d\TH:i:s\Z'),
                'evaluation_status' => $currentStatus,
                'rule_version' => self::RULE_VERSION,
            ];
        }

        return [
            'evaluation_id' => $evaluationId,
            'personnel_profile_id' => $evaluationRecord['personnel_profile_id'] ?? null,
            'assigned_reviewer_role' => null,
            'evaluator_profile_id' => null,
            'evaluator_name' => null,
            'evaluator_college_id' => $actorResolution['evaluator_college_id'] ?? null,
            'assignment_status' => self::ASSIGNMENT_STATUS_UNRESOLVED,
            'reason_code' => $actorResolution['reason_code'],
            'routing_reason' => $actorResolution['routing_reason'],
            'assigned_at' => null,
            'evaluation_status' => $currentStatus,
            'rule_version' => self::RULE_VERSION,
        ];
    }

    /**
     * Transitions an assigned evaluation from 'submitted' to 'in_evaluation'.
     */
    public function transitionToInEvaluation(array $assignmentDto): array
    {
        if (($assignmentDto['assignment_status'] ?? '') !== self::ASSIGNMENT_STATUS_ASSIGNED) {
            throw new RuntimeException("Cannot transition evaluation to [in_evaluation]: Reviewer assignment is unresolved (" . ($assignmentDto['routing_reason'] ?? 'Unresolved') . ").", 409);
        }

        $currentStatus = $assignmentDto['evaluation_status'] ?? self::STATUS_SUBMITTED;
        if ($currentStatus !== self::STATUS_SUBMITTED && $currentStatus !== self::STATUS_IN_EVALUATION) {
            throw new RuntimeException("Cannot transition evaluation from [{$currentStatus}] to [in_evaluation].", 409);
        }

        $updated = $assignmentDto;
        $updated['evaluation_status'] = self::STATUS_IN_EVALUATION;
        $updated['in_evaluation_started_at'] = $assignmentDto['in_evaluation_started_at'] ?? gmdate('Y-m-d\TH:i:s\Z');

        return $updated;
    }

    /**
     * Validates whether a specific actor is authorized to access and review an evaluation.
     */
    public function canReviewerAccessEvaluation(array $reviewerActor, array $evaluationRecord): bool
    {
        $actorProfileId = (string)($reviewerActor['profile_id'] ?? $reviewerActor['id'] ?? '');
        $personnelProfileId = (string)($evaluationRecord['personnel_profile_id'] ?? '');

        // 1. Self-Review Block
        if ($actorProfileId !== '' && $actorProfileId === $personnelProfileId) {
            return false;
        }

        $actorRoles = $reviewerActor['roles'] ?? [$reviewerActor['role'] ?? ''];

        // 2. Department Secretary Exclusion
        if (in_array('department_secretary', $actorRoles, true) && !in_array('dean', $actorRoles, true) && !in_array('hr_staff', $actorRoles, true) && !in_array('hr_admin', $actorRoles, true)) {
            return false;
        }

        $assignedRole = $evaluationRecord['assigned_reviewer_role'] ?? $evaluationRecord['evaluator_role'] ?? null;
        $targetCollegeId = $evaluationRecord['evaluator_college_id'] ?? $evaluationRecord['target_college_id'] ?? null;

        // 3. Dean Scope Enforcement
        if ($assignedRole === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_DEAN) {
            if (!in_array('dean', $actorRoles, true)) {
                return false;
            }
            $actorCollegeId = $reviewerActor['assigned_college_id'] ?? $reviewerActor['college_id'] ?? null;
            if ($targetCollegeId !== null && $actorCollegeId !== $targetCollegeId) {
                return false; // Cross-college access blocked
            }
            return true;
        }

        // 4. HR Scope Enforcement
        if ($assignedRole === PersonnelReviewerRoutingRegistry::REVIEWER_ROLE_HR) {
            return in_array('hr_staff', $actorRoles, true) || in_array('hr_admin', $actorRoles, true);
        }

        return false;
    }

    /**
     * Filters a list of evaluation records to generate a reviewer-specific queue.
     *
     * @param array $evaluationsList Master list of evaluations
     * @param array $reviewerActor Authenticated reviewer actor context
     * @param array $filters Optional operational filters (status, college, search)
     * @return array Reviewer-specific filtered queue
     */
    public function filterReviewerQueue(array $evaluationsList, array $reviewerActor, array $filters = []): array
    {
        $actorRoles = $reviewerActor['roles'] ?? [$reviewerActor['role'] ?? ''];
        $isDean = in_array('dean', $actorRoles, true);
        $isHr = in_array('hr_staff', $actorRoles, true) || in_array('hr_admin', $actorRoles, true);

        if (!$isDean && !$isHr) {
            return []; // Unauthorized roles get an empty queue
        }

        $actorCollegeId = $reviewerActor['assigned_college_id'] ?? $reviewerActor['college_id'] ?? null;

        return array_values(array_filter($evaluationsList, function ($eval) use ($reviewerActor, $isDean, $isHr, $actorCollegeId, $filters) {
            // Check baseline access authorization
            if (!$this->canReviewerAccessEvaluation($reviewerActor, $eval)) {
                return false;
            }

            // Status filter
            if (!empty($filters['status']) && $filters['status'] !== 'ALL') {
                $evalStatus = $eval['evaluation_status'] ?? $eval['status'] ?? '';
                if ($evalStatus !== $filters['status']) {
                    return false;
                }
            }

            // Search filter
            if (!empty($filters['search'])) {
                $search = strtolower(trim((string)$filters['search']));
                $name = strtolower((string)($eval['personnel_name'] ?? $eval['faculty_name'] ?? ''));
                $empId = strtolower((string)($eval['employee_id'] ?? $eval['personnel_id'] ?? ''));
                if (!str_contains($name, $search) && !str_contains($empId, $search)) {
                    return false;
                }
            }

            return true;
        }));
    }

    /**
     * Validates that client payload does not attempt to tamper with assigned reviewer attributes.
     */
    public function validateClientTampering(array $clientPayload, array $canonicalAssignment): void
    {
        if (isset($clientPayload['assigned_reviewer_role']) && $clientPayload['assigned_reviewer_role'] !== $canonicalAssignment['assigned_reviewer_role']) {
            throw new RuntimeException("Tampering detected: Client-supplied reviewer role [" . $clientPayload['assigned_reviewer_role'] . "] does not match authoritative assignment [" . ($canonicalAssignment['assigned_reviewer_role'] ?? 'null') . "].", 422);
        }

        if (isset($clientPayload['evaluator_profile_id']) && $clientPayload['evaluator_profile_id'] !== $canonicalAssignment['evaluator_profile_id']) {
            throw new RuntimeException("Tampering detected: Client-supplied evaluator ID [" . $clientPayload['evaluator_profile_id'] . "] does not match authoritative evaluator [" . ($canonicalAssignment['evaluator_profile_id'] ?? 'null') . "].", 422);
        }

        if (isset($clientPayload['evaluator_college_id']) && $clientPayload['evaluator_college_id'] !== $canonicalAssignment['evaluator_college_id']) {
            throw new RuntimeException("Tampering detected: Client-supplied evaluator college [" . $clientPayload['evaluator_college_id'] . "] does not match authoritative college scope [" . ($canonicalAssignment['evaluator_college_id'] ?? 'null') . "].", 422);
        }
    }
}
