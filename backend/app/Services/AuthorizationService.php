<?php

namespace App\Services;

use App\Services\Policies\AwardPolicy;
use App\Services\Policies\EvidencePolicy;
use App\Services\Policies\GovernancePolicy;
use App\Services\Policies\PersonnelPolicy;
use App\Services\Policies\StudentPortfolioPolicy;

class AuthorizationService
{
    protected AuthenticatedActorService $actorService;
    protected StudentPortfolioPolicy $portfolioPolicy;
    protected PersonnelPolicy $personnelPolicy;
    protected GovernancePolicy $governancePolicy;
    protected EvidencePolicy $evidencePolicy;
    protected AwardPolicy $awardPolicy;

    public function __construct(
        ?AuthenticatedActorService $actorService = null,
        ?StudentPortfolioPolicy $portfolioPolicy = null,
        ?PersonnelPolicy $personnelPolicy = null,
        ?GovernancePolicy $governancePolicy = null,
        ?EvidencePolicy $evidencePolicy = null,
        ?AwardPolicy $awardPolicy = null
    ) {
        $this->actorService = $actorService ?? new AuthenticatedActorService();
        $this->portfolioPolicy = $portfolioPolicy ?? new StudentPortfolioPolicy();
        $this->personnelPolicy = $personnelPolicy ?? new PersonnelPolicy();
        $this->governancePolicy = $governancePolicy ?? new GovernancePolicy();
        $this->evidencePolicy = $evidencePolicy ?? new EvidencePolicy();
        $this->awardPolicy = $awardPolicy ?? new AwardPolicy();
    }

    /**
     * Resolves and validates the authenticated actor.
     */
    public function resolveActor(?string $authorizationHeader = null): ?array
    {
        return $this->actorService->resolveActor($authorizationHeader);
    }

    /**
     * Checks if actor has a specific role key in their active assignments.
     */
    public function hasRole(array $actor, string $roleKey): bool
    {
        return in_array($roleKey, $actor['roles'] ?? [], true);
    }

    /**
     * Checks if actor has any of the specified role keys.
     */
    public function hasAnyRole(array $actor, array $roleKeys): bool
    {
        return count(array_intersect($roleKeys, $actor['roles'] ?? [])) > 0;
    }

    /**
     * Checks if the actor is the owner of a student profile ID.
     */
    public function isStudentOwner(array $actor, string $studentProfileId): bool
    {
        return ($actor['profile']['id'] ?? '') === $studentProfileId &&
               ($actor['profile']['account_type'] ?? '') === 'student';
    }

    /**
     * Checks if the actor is the owner of a personnel profile ID.
     */
    public function isPersonnelOwner(array $actor, string $personnelProfileId): bool
    {
        return ($actor['profile']['id'] ?? '') === $personnelProfileId;
    }

    /**
     * Returns all assigned program IDs for an active Program Coordinator.
     */
    public function getCoordinatorProgramIds(array $actor): array
    {
        $ids = [];
        foreach ($actor['assignments'] ?? [] as $asgn) {
            if (($asgn['role_key'] ?? '') === 'program_coordinator' &&
                ($asgn['scope_type'] ?? '') === 'academic_program' &&
                ! empty($asgn['scope_id'])) {
                $ids[] = (string) $asgn['scope_id'];
            }
        }
        return array_values(array_unique($ids));
    }

    /**
     * Returns all assigned college IDs for an active College Dean.
     */
    public function getDeanCollegeIds(array $actor): array
    {
        $ids = [];
        foreach ($actor['assignments'] ?? [] as $asgn) {
            if (($asgn['role_key'] ?? '') === 'dean' &&
                ($asgn['scope_type'] ?? '') === 'college' &&
                ! empty($asgn['scope_id'])) {
                $ids[] = (string) $asgn['scope_id'];
            }
        }
        return array_values(array_unique($ids));
    }

    /**
     * Returns all assigned organization IDs for an active Organization Moderator.
     */
    public function getModeratedOrganizationIds(array $actor): array
    {
        $ids = [];
        foreach ($actor['assignments'] ?? [] as $asgn) {
            if (($asgn['role_key'] ?? '') === 'organization_moderator' &&
                ($asgn['scope_type'] ?? '') === 'organization' &&
                ! empty($asgn['scope_id'])) {
                $ids[] = (string) $asgn['scope_id'];
            }
        }
        return array_values(array_unique($ids));
    }

    public function portfolio(): StudentPortfolioPolicy
    {
        return $this->portfolioPolicy;
    }

    public function personnel(): PersonnelPolicy
    {
        return $this->personnelPolicy;
    }

    public function governance(): GovernancePolicy
    {
        return $this->governancePolicy;
    }

    public function evidence(): EvidencePolicy
    {
        return $this->evidencePolicy;
    }

    public function award(): AwardPolicy
    {
        return $this->awardPolicy;
    }
}
