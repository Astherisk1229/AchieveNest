<?php

namespace App\Services;

use RuntimeException;

/**
 * PersonnelReviewerRoutingRegistry
 *
 * Authoritative Reviewer Routing & Authority Registry for Personnel Evaluation Track
 * (Plan G Phases G0–G1, Plan K5 Final Closure, and CHU-01 Phase 2 Reconciliation).
 * Freezes canonical routing rules, evaluator authority, scope boundaries,
 * and unresolved routing handling.
 *
 * Authoritative Provenance of Canonical Routing Rules:
 * 1. Faculty + Academic -> Dean [Plan G (G0/G1) & Plan K5 Final Routing Matrix; COLLEGE_ACADEMIC_SCOPE, requires college match].
 * 2. Faculty + Non-Academic -> HR [CHU-01 Phase 2 Sections 2.5, 9.2, 14.1; UNIVERSITY_HR_SCOPE].
 * 3. Non-Teaching Faculty + Academic -> HR [CHU-01 Phase 2 Sections 2.5, 9.2, 14.1; UNIVERSITY_HR_SCOPE].
 * 4. Non-Teaching Faculty + Non-Academic -> HR [Plan G (G0/G1) & Plan K5 Final Routing Matrix; UNIVERSITY_HR_SCOPE].
 * 5. Dean (Self/Peer) -> HR [Plan G (G0/G1) & Plan K5 Final Routing Matrix; UNIVERSITY_HR_SCOPE].
 * 6. VP for Academics -> HR [Plan G (G0/G1) & Plan K5 Final Routing Matrix; UNIVERSITY_HR_SCOPE].
 * 7. VP for Administration -> HR [Plan G (G0/G1) & Plan K5 Final Routing Matrix; UNIVERSITY_HR_SCOPE].
 * 8. Department Secretary is strictly NOT an authorized evaluator [Plan G0].
 * 9. Personnel cannot self-evaluate or self-route [Plan G0].
 * 10. Scale code alone does not determine reviewer identity [Plan G0].
 * 11. Unresolved inputs strictly return status='unresolved' with zero silent fallback [CHU-01 Phase 2 & Plan G0].
 */
class PersonnelReviewerRoutingRegistry
{
    public const RULE_VERSION = 'NDMU-REVIEWER-ROUTING-V1';

    public const REVIEWER_ROLE_DEAN = 'dean';
    public const REVIEWER_ROLE_HR = 'hr_staff';

    public const REASON_ROUTE_ASSIGNED = 'route_assigned';
    public const REASON_REVIEWER_ROUTE_UNRESOLVED = 'reviewer_route_unresolved';
    public const REASON_UNAUTHORIZED_EVALUATOR = 'unauthorized_evaluator';
    public const REASON_DEPARTMENT_SECRETARY_EXCLUDED = 'department_secretary_excluded';
    public const REASON_SELF_EVALUATION_PROHIBITED = 'self_evaluation_prohibited';

    /**
     * Canonical Reviewer Routing Rules Table
     */
    public const ROUTING_RULES = [
        'FACULTY_ACADEMIC' => [
            'personnel_group' => 'faculty',
            'organizational_side' => 'academic',
            'position_keyword' => null,
            'authorized_reviewer_role' => self::REVIEWER_ROLE_DEAN,
            'scope_type' => 'COLLEGE_ACADEMIC_SCOPE',
            'requires_college_match' => true,
            'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
        ],
        'FACULTY_NON_ACADEMIC' => [
            'personnel_group' => 'faculty',
            'organizational_side' => 'non_academic',
            'position_keyword' => null,
            'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
            'scope_type' => 'UNIVERSITY_HR_SCOPE',
            'requires_college_match' => false,
            'authoritative_source' => 'CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1)',
        ],
        'NON_TEACHING_FACULTY_ACADEMIC' => [
            'personnel_group' => 'non_teaching_faculty',
            'organizational_side' => 'academic',
            'position_keyword' => null,
            'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
            'scope_type' => 'UNIVERSITY_HR_SCOPE',
            'requires_college_match' => false,
            'authoritative_source' => 'CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1)',
        ],
        'NON_TEACHING_FACULTY_NON_ACADEMIC' => [
            'personnel_group' => 'non_teaching_faculty',
            'organizational_side' => 'non_academic',
            'position_keyword' => null,
            'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
            'scope_type' => 'UNIVERSITY_HR_SCOPE',
            'requires_college_match' => false,
            'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
        ],
        'DEAN_EVALUATION' => [
            'personnel_group' => 'faculty',
            'organizational_side' => 'academic',
            'designation_type' => 'dean',
            'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
            'scope_type' => 'UNIVERSITY_HR_SCOPE',
            'requires_college_match' => false,
            'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
        ],
        'VP_ACADEMICS_EVALUATION' => [
            'personnel_group' => 'faculty',
            'organizational_side' => 'academic',
            'designation_type' => 'vp_academics',
            'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
            'scope_type' => 'UNIVERSITY_HR_SCOPE',
            'requires_college_match' => false,
            'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
        ],
        'VP_ADMINISTRATION_EVALUATION' => [
            'personnel_group' => 'non_teaching_faculty',
            'organizational_side' => 'non_academic',
            'designation_type' => 'vp_administration',
            'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
            'scope_type' => 'UNIVERSITY_HR_SCOPE',
            'requires_college_match' => false,
            'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
        ],
    ];

    /**
     * Resolves the canonical reviewer route from authoritative personnel context.
     *
     * @param array $personnelContext [
     *   'personnel_profile_id' => string,
     *   'personnel_group' => string,
     *   'organizational_side' => string,
     *   'designation_title' => ?string,
     *   'is_dean' => bool,
     *   'is_vp_academics' => bool,
     *   'is_vp_administration' => bool,
     *   'college_id' => ?string
     * ]
     * @return array Reviewer Route DTO
     */
    public static function resolveReviewerRoute(array $personnelContext): array
    {
        $group = strtolower(trim((string)($personnelContext['personnel_group'] ?? '')));
        $side = strtolower(trim((string)($personnelContext['organizational_side'] ?? '')));
        $isDean = !empty($personnelContext['is_dean']);
        $isVpAcademics = !empty($personnelContext['is_vp_academics']);
        $isVpAdmin = !empty($personnelContext['is_vp_administration']);
        $collegeId = $personnelContext['college_id'] ?? null;

        // 1. High-level administrative positions route to HR (Plan G & Plan K5)
        if ($isDean) {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
                'scope_type' => 'UNIVERSITY_HR_SCOPE',
                'target_college_id' => null,
                'routing_reason' => 'Dean evaluation routes authoritatively to HR.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
            ];
        }

        if ($isVpAcademics) {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
                'scope_type' => 'UNIVERSITY_HR_SCOPE',
                'target_college_id' => null,
                'routing_reason' => 'VP for Academics evaluation routes authoritatively to HR.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
            ];
        }

        if ($isVpAdmin) {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
                'scope_type' => 'UNIVERSITY_HR_SCOPE',
                'target_college_id' => null,
                'routing_reason' => 'VP for Administration evaluation routes authoritatively to HR.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
            ];
        }

        // 2. Canonical group + side routing
        if ($group === 'faculty' && $side === 'academic') {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_DEAN,
                'scope_type' => 'COLLEGE_ACADEMIC_SCOPE',
                'target_college_id' => $collegeId,
                'routing_reason' => 'Faculty + Academic personnel route to active Dean of assigned college.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
            ];
        }

        if ($group === 'faculty' && $side === 'non_academic') {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
                'scope_type' => 'UNIVERSITY_HR_SCOPE',
                'target_college_id' => null,
                'routing_reason' => 'Faculty + Non-Academic personnel route to HR Office.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1)',
            ];
        }

        if ($group === 'non_teaching_faculty' && $side === 'academic') {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
                'scope_type' => 'UNIVERSITY_HR_SCOPE',
                'target_college_id' => null,
                'routing_reason' => 'Non-Teaching Faculty + Academic personnel route to HR Office.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'CHU-01 Phase 2 (Sections 2.5, 9.2, 14.1)',
            ];
        }

        if ($group === 'non_teaching_faculty' && $side === 'non_academic') {
            return [
                'authorized_reviewer_role' => self::REVIEWER_ROLE_HR,
                'scope_type' => 'UNIVERSITY_HR_SCOPE',
                'target_college_id' => null,
                'routing_reason' => 'Non-Teaching Faculty + Non-Academic personnel route to HR Office.',
                'status' => 'resolved',
                'reason_code' => self::REASON_ROUTE_ASSIGNED,
                'authoritative_source' => 'Plan G (G0/G1) & Plan K5 Final Routing Matrix',
            ];
        }

        // 3. Unresolved cases remain strictly unresolved (zero silent fallback)
        return [
            'authorized_reviewer_role' => null,
            'scope_type' => null,
            'target_college_id' => null,
            'routing_reason' => "No authoritative reviewer route is defined for classification [{$group} + {$side}].",
            'status' => 'unresolved',
            'reason_code' => self::REASON_REVIEWER_ROUTE_UNRESOLVED,
            'inputs' => [
                'personnel_group' => $group,
                'organizational_side' => $side,
            ],
        ];
    }

    /**
     * Validates whether an actor is authorized to review and score an evaluation.
     *
     * @param array $actor [ 'profile_id' => string, 'roles' => array, 'assigned_college_id' => ?string ]
     * @param array $evaluation [ 'personnel_profile_id' => string, 'assigned_reviewer_role' => string, 'target_college_id' => ?string ]
     * @return bool
     */
    public static function isAuthorizedReviewer(array $actor, array $evaluation): bool
    {
        $actorProfileId = $actor['profile_id'] ?? '';
        $personnelProfileId = $evaluation['personnel_profile_id'] ?? '';

        // Rule: Personnel cannot self-evaluate
        if ($actorProfileId !== '' && $actorProfileId === $personnelProfileId) {
            return false;
        }

        $actorRoles = $actor['roles'] ?? [];

        // Rule: Department Secretary is strictly excluded
        if (in_array('department_secretary', $actorRoles, true) && !in_array('dean', $actorRoles, true) && !in_array('hr_staff', $actorRoles, true)) {
            return false;
        }

        $assignedRole = $evaluation['assigned_reviewer_role'] ?? null;
        $targetCollegeId = $evaluation['target_college_id'] ?? null;

        if ($assignedRole === self::REVIEWER_ROLE_DEAN) {
            if (!in_array('dean', $actorRoles, true)) {
                return false;
            }
            // Dean must match the assigned college
            $actorCollegeId = $actor['assigned_college_id'] ?? null;
            if ($targetCollegeId !== null && $actorCollegeId !== $targetCollegeId) {
                return false; // Cross-college evaluation prohibited
            }
            return true;
        }

        if ($assignedRole === self::REVIEWER_ROLE_HR) {
            return in_array('hr_staff', $actorRoles, true) || in_array('hr_admin', $actorRoles, true);
        }

        return false;
    }
}
