<?php

namespace App\Services\Policies;

class AwardPolicy
{
    /**
     * Determines whether an actor can run automated student award evaluations.
     * Rule: OSAD Administrator ONLY.
     */
    public function canRunAwardEvaluation(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'osad_admin' &&
               in_array('osad_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can submit a Dean Award Nomination.
     * Approved rule: Active College Dean may nominate ANY eligible student across the university
     * (cross-College nomination allowed for this specific workflow).
     */
    public function canNominateStudent(array $actor): bool
    {
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        return ! empty($deanCollegeIds);
    }

    /**
     * Determines whether an actor can view student award evaluations.
     */
    public function canViewAwardEvaluation(array $actor, ?string $targetStudentId = null): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $roles = (array) ($actor['roles'] ?? []);

        // 1. Student can view own evaluations
        if ($targetStudentId !== null && $actorId === $targetStudentId) {
            return true;
        }

        // 2. OSAD staff has full university-wide view
        if (in_array('osad_staff', $roles, true)) {
            return true;
        }

        // 3. Active Dean can view award candidate evaluations
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        return ! empty($deanCollegeIds);
    }

    protected function getDeanCollegeIds(array $actor): array
    {
        $collegeIds = [];
        foreach ($actor['assignments'] ?? [] as $asgn) {
            if (($asgn['role_key'] ?? '') === 'dean' &&
                ($asgn['scope_type'] ?? '') === 'college' &&
                ! empty($asgn['scope_id'])) {
                $collegeIds[] = (string) $asgn['scope_id'];
            }
        }
        return array_values(array_unique($collegeIds));
    }
}
