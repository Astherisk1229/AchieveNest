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

}
