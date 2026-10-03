<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;

/** Backward-compatible adapter to the central organizational authority resolver. */
class ReviewerResolverService
{
    private OrganizationalAuthorityResolver $authority;

    public function __construct(?BaseConnection $db = null, ?OrganizationalAuthorityResolver $authority = null)
    {
        $this->authority = $authority ?? new OrganizationalAuthorityResolver($db);
    }

    public function resolve(string $personnelProfileId, ?array $rankingTrack = null): array
    {
        return $this->authority->resolveResponsibleAuthority($personnelProfileId, $rankingTrack);
    }

    /** Faculty group is the only classification input for Dean evaluation eligibility. */
    public function isDeanEvaluable(array $personnel): bool
    {
        return strtolower((string) ($personnel['personnel_group'] ?? '')) === 'faculty';
    }

    /** Explicit post-endorsement HR handoff remains separate from initial authority resolution. */
    public function resolveHrReviewerForPersonnel(string $personnelProfileId): array
    {
        return $this->authority->resolveExplicitHrAuthority(
            $personnelProfileId,
            'Explicit HR handoff after organizational endorsement.',
            'existing post-endorsement HR workflow'
        );
    }

    public function isValidEvaluatorActor(array $actor, array $resolvedReviewer): bool
    {
        return $this->authority->actorMayAct($resolvedReviewer, $actor['profile']['id'] ?? '');
    }
}
