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
               ($actor['profile']['status'] ?? '') === 'active' &&
               in_array('osad_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can submit a Dean Award Nomination.
     * Rule: Active College Dean may nominate eligible students enrolled in their assigned College.
     */
    public function canNominateStudent(array $actor): bool
    {
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        return ! empty($deanCollegeIds);
    }

    /**
     * Determines whether an actor can access sensitive OSAD award-evaluation data.
     *
     * Candidate records, evidence, scoring bases, review workspaces, and results
     * are administrative OSAD data. Student self-access and Dean access belong to
     * separate, purpose-built workflows and must not implicitly authorize these
     * OSAD endpoints.
     */
    public function canViewAwardEvaluation(array $actor, ?string $targetStudentId = null): bool
    {
        return $this->canRunAwardEvaluation($actor);
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
