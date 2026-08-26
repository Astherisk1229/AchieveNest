<?php

namespace App\Services;

use RuntimeException;

/**
 * ReviewerResolverService
 *
 * Determines the authoritative reviewer (evaluator) for a given Personnel
 * based on confirmed HR business rules:
 *
 *   Faculty (designation includes 'Faculty' or no elevated designation)
 *     → Dean whose active college scope matches the Faculty's department's college
 *
 *   Director / Coordinator / Dean (anyone with elevated designation or dean role)
 *     → Active HR Admin with hr_staff role
 *
 * The frontend MUST NOT supply the evaluator. This service resolves it server-side.
 */
class ReviewerResolverService
{
    /**
     * Resolve the evaluator for the given Personnel profile.
     *
     * @param string $personnelProfileId UUID of the personnel's profile
     * @return array{
     *   evaluator_profile_id: string,
     *   evaluator_role: string,
     *   evaluator_college_id: string|null
     * }
     * @throws RuntimeException if no valid reviewer is found
     */
    public function resolve(string $personnelProfileId): array
    {
        $db = db_connect();

        // Load the Personnel profile
        $personnel = $db->table('public.profiles')
            ->where('id', $personnelProfileId)
            ->where('account_type', 'personnel')
            ->where('status', 'active')
            ->get()
            ->getRowArray();

        if ($personnel === null) {
            throw new RuntimeException('Personnel profile not found or inactive: ' . $personnelProfileId);
        }

        // Determine reviewer path based on designation and active roles
        if ($this->requiresHrDirectReview($db, $personnel)) {
            return $this->resolveHrReviewer($db, $personnelProfileId);
        }

        // Faculty path: Dean of the same college
        return $this->resolveDeanReviewer($db, $personnel);
    }

    /**
     * Checks whether this Personnel's evaluation must be reviewed directly by HR.
     * Applies to: Directors, Coordinators, existing Deans, and anyone with no Faculty designation.
     */
    private function requiresHrDirectReview(\CodeIgniter\Database\BaseConnection $db, array $personnel): bool
    {
        $designation = strtolower(trim((string) ($personnel['designation'] ?? '')));

        // Explicit elevated designations that HR reviews
        $hrDesignations = ['director', 'coordinator', 'dean', 'head', 'chair', 'president', 'vice president'];
        foreach ($hrDesignations as $d) {
            if (str_contains($designation, $d)) {
                return true;
            }
        }

        // If the Personnel currently has an active Dean role, HR reviews them
        $isDean = $db->query(
            "SELECT 1 FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND r.role_key = 'dean' AND pr.is_active = true
             LIMIT 1",
            [$personnel['id']]
        )->getRowArray();

        if ($isDean !== null) {
            return true;
        }

        // Default: Faculty path unless designation clearly indicates otherwise
        // If no designation or designation includes 'faculty' or 'instructor' or 'professor' → Dean path
        return false;
    }

    /**
     * Resolves the active HR Admin as evaluator (for Directors, Coordinators, Deans).
     */
    private function resolveHrReviewer(\CodeIgniter\Database\BaseConnection $db, string $personnelProfileId): array
    {
        $hrAdmin = $db->query(
            "SELECT p.id, p.full_name
             FROM public.profiles p
             JOIN public.profile_roles pr ON pr.profile_id = p.id
             JOIN public.roles r ON r.id = pr.role_id
             WHERE p.account_type = 'hr_admin'
               AND p.status = 'active'
               AND r.role_key = 'hr_staff'
               AND pr.is_active = true
             LIMIT 1"
        )->getRowArray();

        if ($hrAdmin === null) {
            throw new RuntimeException(
                'No active HR Admin with hr_staff role found. Cannot assign evaluator for Personnel: ' . $personnelProfileId
            );
        }

        return [
            'evaluator_profile_id' => $hrAdmin['id'],
            'evaluator_role'       => 'hr_staff',
            'evaluator_college_id' => null,
        ];
    }

    /**
     * Resolves the Dean whose active college scope matches the Personnel's college.
     * The Dean must be active and in the same college as the Personnel's department.
     */
    private function resolveDeanReviewer(\CodeIgniter\Database\BaseConnection $db, array $personnel): array
    {
        $deptId = $personnel['department_id'] ?? null;

        if ($deptId === null) {
            // No department — fall through to HR review
            return $this->resolveHrReviewer($db, $personnel['id']);
        }

        // Find the college for this department
        $department = $db->table('public.departments')
            ->where('id', $deptId)
            ->get()
            ->getRowArray();

        if ($department === null || empty($department['college_id'])) {
            // Department has no college mapping — HR reviews instead
            return $this->resolveHrReviewer($db, $personnel['id']);
        }

        $collegeId = $department['college_id'];

        // Find an active Dean whose scope_id = this college
        $dean = $db->query(
            "SELECT p.id, p.full_name, pr.scope_id AS college_id
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             JOIN public.profiles p ON p.id = pr.profile_id
             WHERE r.role_key = 'dean'
               AND pr.is_active = true
               AND pr.scope_type = 'college'
               AND pr.scope_id = ?
               AND p.status = 'active'
             LIMIT 1",
            [$collegeId]
        )->getRowArray();

        if ($dean === null) {
            // No active Dean for this college — HR takes over
            return $this->resolveHrReviewer($db, $personnel['id']);
        }

        return [
            'evaluator_profile_id' => $dean['id'],
            'evaluator_role'       => 'dean',
            'evaluator_college_id' => $collegeId,
        ];
    }

    /**
     * Validates that the given actor is authorized to be the resolved evaluator.
     * Returns true if the actor's profile ID matches the resolved evaluator.
     */
    public function isValidEvaluatorActor(array $actor, array $resolvedReviewer): bool
    {
        return $actor['profile']['id'] === $resolvedReviewer['evaluator_profile_id'];
    }
}
