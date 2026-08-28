<?php

namespace App\Services;

use RuntimeException;

/**
 * ReviewerResolverService
 *
 * Final target-schema reviewer routing:
 * - Academic Personnel with no elevated role/designation -> active Dean of their College.
 * - Non-Academic Personnel, Deans, Directors, Coordinators, Heads, Chairs,
 *   Presidents/Vice Presidents -> active HR Admin.
 *
 * The frontend MUST NOT select the evaluator. This service resolves it server-side.
 */
class ReviewerResolverService
{
    public function resolve(string $personnelProfileId): array
    {
        $db = db_connect();

        $personnel = $db->query(
            "SELECT p.*, pp.personnel_classification
             FROM profiles p
             JOIN personnel_profiles pp ON pp.profile_id = p.id
             WHERE p.id = ?
               AND p.account_type IN ('personnel', 'hr_admin', 'osad_admin')
               AND p.status = 'active'",
            [$personnelProfileId]
        )->getRowArray();

        if ($personnel === null) {
            throw new RuntimeException('Personnel profile not found or inactive: ' . $personnelProfileId);
        }

        if (($personnel['personnel_classification'] ?? '') !== 'academic') {
            return $this->resolveHrReviewer($db, $personnelProfileId);
        }

        if ($this->requiresHrDirectReview($db, $personnel)) {
            return $this->resolveHrReviewer($db, $personnelProfileId);
        }

        return $this->resolveDeanReviewer($db, $personnelProfileId);
    }

    private function requiresHrDirectReview(\CodeIgniter\Database\BaseConnection $db, array $personnel): bool
    {
        $designation = strtolower(trim((string) ($personnel['designation_title'] ?? $personnel['designation'] ?? '')));
        $hrDesignations = ['director', 'coordinator', 'dean', 'head', 'chair', 'president', 'vice president'];

        foreach ($hrDesignations as $designationKeyword) {
            if (str_contains($designation, $designationKeyword)) {
                return true;
            }
        }

        $isDean = $db->table('dean_assignments')
            ->where('personnel_profile_id', $personnel['id'])
            ->where('is_active', 1)
            ->countAllResults() > 0;

        if ($isDean) {
            return true;
        }

        $isProgramCoordinator = $db->table('program_coordinator_assignments')
            ->where('personnel_profile_id', $personnel['id'])
            ->where('is_active', 1)
            ->countAllResults() > 0;

        return $isProgramCoordinator;
    }

    private function resolveHrReviewer(\CodeIgniter\Database\BaseConnection $db, string $personnelProfileId): array
    {
        $hrAdmin = $db->query(
            "SELECT p.id, p.full_name
             FROM profiles p
             JOIN profile_roles pr ON pr.profile_id = p.id
             JOIN roles r ON r.id = pr.role_id
             WHERE p.account_type = 'hr_admin'
               AND p.status = 'active'
               AND r.role_key = 'hr_staff'
               AND pr.is_active = 1
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

    private function resolveDeanReviewer(\CodeIgniter\Database\BaseConnection $db, string $personnelProfileId): array
    {
        $affiliation = $db->query(
            "SELECT pca.college_id
             FROM personnel_college_affiliations pca
             WHERE pca.personnel_profile_id = ?
               AND pca.is_active = 1
             LIMIT 1",
            [$personnelProfileId]
        )->getRowArray();

        if ($affiliation === null || empty($affiliation['college_id'])) {
            return $this->resolveHrReviewer($db, $personnelProfileId);
        }

        $collegeId = $affiliation['college_id'];
        $dean = $db->query(
            "SELECT p.id, p.full_name, da.college_id
             FROM dean_assignments da
             JOIN profiles p ON p.id = da.personnel_profile_id
             WHERE da.college_id = ?
               AND da.is_active = 1
               AND p.status = 'active'
             LIMIT 1",
            [$collegeId]
        )->getRowArray();

        if ($dean === null) {
            return $this->resolveHrReviewer($db, $personnelProfileId);
        }

        return [
            'evaluator_profile_id' => $dean['id'],
            'evaluator_role'       => 'dean',
            'evaluator_college_id' => $collegeId,
        ];
    }

    public function isValidEvaluatorActor(array $actor, array $resolvedReviewer): bool
    {
        return ($actor['profile']['id'] ?? '') === ($resolvedReviewer['evaluator_profile_id'] ?? '');
    }
}
