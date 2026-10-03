<?php

namespace App\Services\Policies;

use CodeIgniter\Database\BaseBuilder;

class PersonnelPolicy
{
    /**
     * Determines whether an actor can view a personnel profile or directory record.
     */
    public function canViewProfile(array $actor, array $targetProfile): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $targetId = (string) ($targetProfile['id'] ?? '');
        $roles = (array) ($actor['roles'] ?? []);

        // 1. Self access
        if ($actorId !== '' && $actorId === $targetId) {
            return true;
        }

        // 2. HR staff has full university-wide view
        if (in_array('hr_staff', $roles, true)) {
            return true;
        }

        // 3. Dean can view personnel affiliated with their assigned college
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        if (! empty($deanCollegeIds)) {
            $targetCollegeId = $this->getPersonnelCurrentCollegeId($targetId);
            if ($targetCollegeId !== null && in_array($targetCollegeId, $deanCollegeIds, true)) {
                return true;
            }
        }

        // 4. General personnel directory view (active personnel)
        if (($actor['profile']['account_type'] ?? '') === 'personnel') {
            return ($targetProfile['status'] ?? '') === 'active';
        }

        return false;
    }

    /**
     * Determines whether an actor can create an accomplishment record.
     */
    public function canCreateAccomplishment(array $actor): bool
    {
        return in_array($actor['profile']['account_type'] ?? '', ['personnel', 'hr_admin', 'osad_admin'], true) &&
               ($actor['profile']['status'] ?? '') === 'active';
    }

    /**
     * Determines whether an actor can edit an accomplishment record.
     */
    public function canEditAccomplishment(array $actor, array $record): bool
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $ownerId = (string) ($record['personnel_profile_id'] ?? '');
        $status = (string) ($record['status'] ?? 'draft');

        return $actorId !== '' &&
               $actorId === $ownerId &&
               in_array($status, ['draft', 'pending', 'revisions_requested'], true);
    }

    /**
     * Determines whether an actor can view or participate in HR evaluations for a personnel member.
     */
    public function canEvaluatePersonnel(array $actor, ?string $targetPersonnelId = null): bool
    {
        $roles = (array) ($actor['roles'] ?? []);

        // HR staff has full authority
        if (in_array('hr_staff', $roles, true)) {
            return true;
        }

        // Dean can evaluate/read-check for personnel in their assigned college
        if ($targetPersonnelId !== null) {
            $deanCollegeIds = $this->getDeanCollegeIds($actor);
            if (! empty($deanCollegeIds)) {
                $targetCollegeId = $this->getPersonnelCurrentCollegeId($targetPersonnelId);
                return $targetCollegeId !== null && in_array($targetCollegeId, $deanCollegeIds, true);
            }
        }

        return false;
    }

    /**
     * Scopes personnel directory query.
     */
    public function scopeDirectoryQuery(array $actor, BaseBuilder $builder): BaseBuilder
    {
        $roles = (array) ($actor['roles'] ?? []);

        // HR sees all personnel (including pending/inactive)
        if (in_array('hr_staff', $roles, true)) {
            return $builder;
        }

        // Dean sees personnel in their assigned college
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        if (! empty($deanCollegeIds)) {
            return $builder->whereIn(
                'p.id',
                static function (BaseBuilder $sub) use ($deanCollegeIds) {
                    return $sub->select('pca.personnel_profile_id')
                        ->from('personnel_college_affiliations pca')
                        ->whereIn('pca.college_id', $deanCollegeIds)
                        ->where('pca.is_active', 1);
                }
            )->where('p.status', 'active');
        }

        // Ordinary personnel see only active personnel
        return $builder->where('p.status', 'active');
    }

    /**
     * Scopes personnel accomplishments query.
     */
    public function scopeAccomplishmentQuery(array $actor, BaseBuilder $builder): BaseBuilder
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $roles = (array) ($actor['roles'] ?? []);

        // HR sees all accomplishments
        if (in_array('hr_staff', $roles, true)) {
            return $builder;
        }

        // Dean sees accomplishments for personnel in their college
        $deanCollegeIds = $this->getDeanCollegeIds($actor);
        if (! empty($deanCollegeIds)) {
            return $builder->groupStart()
                ->where('pa.personnel_profile_id', $actorId)
                ->orWhereIn(
                    'pa.personnel_profile_id',
                    static function (BaseBuilder $sub) use ($deanCollegeIds) {
                        return $sub->select('pca.personnel_profile_id')
                            ->from('personnel_college_affiliations pca')
                            ->whereIn('pca.college_id', $deanCollegeIds)
                            ->where('pca.is_active', 1);
                    }
                )
                ->groupEnd();
        }

        // Individual personnel sees only own accomplishments
        return $builder->where('pa.personnel_profile_id', $actorId);
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

    protected function getPersonnelCurrentCollegeId(string $personnelProfileId): ?string
    {
        $db = db_connect();
        $row = $db->table('personnel_college_affiliations')
            ->select('college_id')
            ->where('personnel_profile_id', $personnelProfileId)
            ->where('is_active', 1)
            ->orderBy('effective_from', 'DESC')
            ->get()
            ->getRowArray();

        return $row['college_id'] ?? null;
    }
}
