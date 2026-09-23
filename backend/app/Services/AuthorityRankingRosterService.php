<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/** Cycle/track roster whose scope is always derived from the authenticated actor. */
class AuthorityRankingRosterService
{
    public function __construct(
        private ?BaseConnection $db = null,
        private ?OrganizationalAuthorityResolver $authorityResolver = null,
        private ?PersonnelEligibilityService $eligibilityService = null
    ) {
        $this->db ??= db_connect();
        $this->authorityResolver ??= new OrganizationalAuthorityResolver($this->db);
        $this->eligibilityService ??= new PersonnelEligibilityService($this->db);
    }

    public function list(array $actor, string $cycleId, string $trackKey): array
    {
        $cycle = $this->db->table('ranking_cycles')->where('id', $cycleId)->get()->getRowArray();
        if (! $cycle) throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND: Ranking cycle was not found.');

        $group = $this->trackGroup($trackKey);
        $track = $this->db->table('personnel_evaluation_periods')->where('ranking_cycle_id', $cycleId)->where('personnel_group', $group)->get()->getRowArray();
        if (! $track) throw new InvalidArgumentException('RANKING_TRACK_NOT_FOUND: Requested classification track is not configured for this cycle.');

        [$authorityType, $scopeType, $scopeId] = $this->actorScope($actor);
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $builder = $this->db->table('personnel_profiles pp')->distinct()->select(
            'p.id,p.full_name,p.institutional_id,p.email AS institutional_email,p.avatar_url,pp.personnel_group,pp.personnel_classification,pp.organizational_side,pp.organizational_side AS placement,pp.faculty_engagement,pp.employment_status,pp.employment_start_date,pp.position_title,pp.current_rank_title,au.id AS department_id,au.name AS department_name,COALESCE(pca.college_id,au.college_id) AS college_id,c.name AS college_name,c.code AS college_code'
        )->join('profiles p', 'p.id=pp.profile_id')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id=pp.profile_id AND pca.is_active=1', 'left')
            ->join('personnel_administrative_unit_affiliations pau', 'pau.personnel_profile_id=pp.profile_id AND pau.is_active=1', 'left')
            ->join('administrative_units au', "au.id=pau.administrative_unit_id AND au.status='active'", 'left')
            ->join('colleges c', 'c.id=COALESCE(pca.college_id,au.college_id)', 'left')
            ->where('p.status', 'active')->where('pp.personnel_group', $group)->where('p.id !=', $actorId);
        if ($scopeType === 'college') $builder->groupStart()->where('pca.college_id', $scopeId)->orWhere('au.college_id', $scopeId)->groupEnd();
        if ($scopeType === 'department') $builder->where('au.id', $scopeId)->where('au.college_id', null);
        $rows = $builder->orderBy('p.full_name')->get()->getResultArray();

        $items = [];
        foreach ($rows as $person) {
            try {
                $authority = $this->authorityResolver->resolveResponsibleAuthority($person['id'], $track);
            } catch (RuntimeException $error) {
                if (str_contains($error->getMessage(), 'AMBIGUOUS')) throw $error;
                continue;
            }
            if (($authority['authority_type'] ?? '') !== $authorityType || ! $this->authorityResolver->actorMayAct($authority, $actorId)) continue;
            $review = $this->db->table('personnel_annual_reviews')->where('personnel_profile_id', $person['id'])->where('evaluation_period_id', $track['id'])->where('superseded_at', null)->orderBy('created_at', 'DESC')->get()->getRowArray();
            $superseded = $this->db->table('personnel_annual_reviews')->where('personnel_profile_id', $person['id'])->where('evaluation_period_id', $track['id'])->where('superseded_at !=', null)->countAllResults();
            $items[] = ['personnel'=>$person, 'evaluation_period_id'=>$track['id'], 'annual_review'=>$review, 'superseded_count'=>$superseded, 'eligibility'=>$this->eligibilityService->evaluateEligibility($person['id'], $track['id'])];
        }

        return ['ranking_cycle_id'=>$cycleId, 'ranking_track_id'=>$track['id'], 'evaluation_period_id'=>$track['id'], 'evaluation_cycle_id'=>$track['academic_year'], 'authority_type'=>$authorityType, 'scope_type'=>$scopeType, 'scope_id'=>$scopeId, 'evaluation_period'=>['id'=>$track['id'], 'name'=>$track['period_name'], 'status'=>$track['status'], 'evaluation_end_at'=>$track['evaluation_end_at'], 'is_locked'=>in_array($track['status'], ['CLOSED','ARCHIVED'], true)], 'total_personnel'=>count($items), 'personnel'=>$items];
    }

    private function trackGroup(string $key): string
    {
        $normalized = strtoupper(str_replace('-', '_', trim($key)));
        $map = ['FACULTY'=>'FACULTY', 'NON_TEACHING_FACULTY'=>'NON_TEACHING_FACULTY'];
        if (! isset($map[$normalized])) throw new InvalidArgumentException('RANKING_TRACK_INVALID: trackKey must identify Faculty or Non-Teaching Faculty.');
        return $map[$normalized];
    }

    private function actorScope(array $actor): array
    {
        $actorId = (string) ($actor['profile']['id'] ?? '');
        $roles = $actor['roles'] ?? [];
        if ($actorId === '') throw new RuntimeException('FORBIDDEN: Authenticated authority profile is missing.');
        if (array_intersect(['hr_admin','hr_staff'], $roles)) return ['HR', 'institution', null];
        if (in_array('dean', $roles, true)) return ['DEAN', 'college', $this->singleAssignment('dean_assignments', 'college_id', $actorId, 'DEAN')];
        if (in_array('department_head', $roles, true)) {
            $departmentId = $this->singleAssignment('department_head_assignments', 'department_id', $actorId, 'DEPARTMENT_HEAD');
            $department = $this->db->table('administrative_units')->select('college_id')->where('id', $departmentId)->where('status', 'active')->get()->getRowArray();
            if (! $department || ! empty($department['college_id'])) throw new RuntimeException('FORBIDDEN: Department Head roster authority applies only to an active outside-College Department.');
            return ['DEPARTMENT_HEAD', 'department', $departmentId];
        }
        throw new RuntimeException('FORBIDDEN: Dean, Department Head, or HR authority role required.');
    }

    private function singleAssignment(string $table, string $scopeColumn, string $actorId, string $label): string
    {
        $rows = $this->db->table($table)->select($scopeColumn)->where('personnel_profile_id', $actorId)->where('is_active', 1)->get()->getResultArray();
        if (count($rows) === 0) throw new RuntimeException("AUTHORITY_MISSING_{$label}: No active authority assignment exists.");
        if (count($rows) > 1) throw new RuntimeException("AUTHORITY_AMBIGUOUS_{$label}: Multiple active authority assignments exist.");
        return (string) $rows[0][$scopeColumn];
    }
}
