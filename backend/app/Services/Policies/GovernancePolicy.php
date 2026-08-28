<?php

namespace App\Services\Policies;

class GovernancePolicy
{
    /**
     * Determines whether an actor can assign a Dean.
     * Rule: HR Administrator ONLY.
     */
    public function canAssignDean(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'hr_admin' &&
               in_array('hr_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can assign a Program Coordinator.
     * Rule: OSAD Administrator ONLY.
     */
    public function canAssignCoordinator(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'osad_admin' &&
               in_array('osad_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can assign an Organization Moderator.
     * Rule: OSAD Administrator ONLY.
     */
    public function canAssignModerator(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'osad_admin' &&
               in_array('osad_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can provision a new Student account.
     * Rule: OSAD Administrator ONLY.
     */
    public function canProvisionStudent(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'osad_admin' &&
               in_array('osad_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can provision a new Personnel account.
     * Rule: HR Administrator ONLY.
     */
    public function canProvisionPersonnel(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'hr_admin' &&
               in_array('hr_staff', $actor['roles'] ?? [], true);
    }

    /**
     * Determines whether an actor can process password reset for a target account type.
     * Rule: OSAD for students; HR for personnel.
     */
    public function canManagePasswordReset(array $actor, string $targetAccountType): bool
    {
        $accountType = $actor['profile']['account_type'] ?? '';
        $roles = $actor['roles'] ?? [];

        if ($targetAccountType === 'student') {
            return $accountType === 'osad_admin' && in_array('osad_staff', $roles, true);
        }

        if ($targetAccountType === 'personnel') {
            return $accountType === 'hr_admin' && in_array('hr_staff', $roles, true);
        }

        return false;
    }

    /**
     * Determines whether an actor can manage lifecycle status (suspend, archive, restore).
     * Rule: OSAD for students; HR for personnel.
     */
    public function canManageLifecycle(array $actor, string $targetAccountType): bool
    {
        return $this->canManagePasswordReset($actor, $targetAccountType);
    }

    /**
     * Determines whether an actor can finalize HR evaluation rankings.
     * Rule: HR Administrator ONLY.
     */
    public function canManageHREvaluation(array $actor): bool
    {
        return ($actor['profile']['account_type'] ?? '') === 'hr_admin' &&
               in_array('hr_staff', $actor['roles'] ?? [], true);
    }
}
