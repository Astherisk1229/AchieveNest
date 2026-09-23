<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;

/** Single server-side source of truth for initial evaluation and Official Annual Review authority. */
class OrganizationalAuthorityResolver
{
    public function __construct(private ?BaseConnection $db = null)
    {
        $this->db ??= db_connect();
    }

    public function resolveResponsibleAuthority(string $personnelProfileId, ?array $rankingTrack = null): array
    {
        $personnel = $this->db->table('personnel_profiles pp')
            ->select('p.id, p.full_name, p.designation_title, pp.personnel_group, pp.organizational_side, pp.personnel_classification')
            ->join('profiles p', 'p.id=pp.profile_id')
            ->where('pp.profile_id', $personnelProfileId)->where('p.status', 'active')->get()->getRowArray();
        if (! $personnel) throw new RuntimeException('AUTHORITY_PERSONNEL_NOT_FOUND: Personnel profile is missing or inactive.');

        $collegeIds = array_column($this->db->table('personnel_college_affiliations')->select('college_id')->where('personnel_profile_id', $personnelProfileId)->where('is_active', 1)->get()->getResultArray(), 'college_id');
        $departments = $this->db->table('personnel_administrative_unit_affiliations pau')
            ->select('pau.administrative_unit_id AS department_id, au.college_id')
            ->join('administrative_units au', 'au.id=pau.administrative_unit_id')
            ->where('pau.personnel_profile_id', $personnelProfileId)->where('pau.is_active', 1)->where('au.status', 'active')->get()->getResultArray();
        if (count($departments) > 1) throw new RuntimeException('AUTHORITY_AMBIGUOUS_DEPARTMENT: Personnel has multiple active Department affiliations.');

        foreach ($departments as $department) if (! empty($department['college_id'])) $collegeIds[] = $department['college_id'];
        $collegeIds = array_values(array_unique(array_filter($collegeIds)));
        if (count($collegeIds) > 1) throw new RuntimeException('AUTHORITY_AMBIGUOUS_COLLEGE: Personnel resolves to multiple active Colleges.');
        if (count($collegeIds) === 1) return $this->resolveDean($personnel, $collegeIds[0], $rankingTrack);

        if (count($departments) === 1) {
            return $this->resolveDepartmentHead($personnel, $departments[0]['department_id'], $rankingTrack);
        }

        $explicitHrRoute = PersonnelReviewerRoutingRegistry::resolveReviewerRoute($this->routingContext($personnel));
        if (($explicitHrRoute['status'] ?? '') === 'resolved' && ($explicitHrRoute['authorized_reviewer_role'] ?? '') === 'hr_staff') {
            return $this->resolveHr($personnel, $explicitHrRoute, $rankingTrack);
        }

        throw new RuntimeException('AUTHORITY_UNRESOLVED: No College, outside-College Department, or explicit HR-managed authority rule applies.');
    }

    public function actorMayAct(array $authority, string $actorProfileId): bool
    {
        return $actorProfileId !== '' && $actorProfileId !== ($authority['personnel_profile_id'] ?? '') && $actorProfileId === ($authority['authority_profile_id'] ?? '');
    }

    /** Approved explicit HR handoff, used after organizational review or by a named HR-managed rule. */
    public function resolveExplicitHrAuthority(string $personnelProfileId, string $reason, string $source): array
    {
        $personnel = $this->db->table('personnel_profiles pp')->select('p.id')->join('profiles p', 'p.id=pp.profile_id')->where('pp.profile_id', $personnelProfileId)->where('p.status', 'active')->get()->getRowArray();
        if (! $personnel) throw new RuntimeException('AUTHORITY_PERSONNEL_NOT_FOUND: Personnel profile is missing or inactive.');
        return $this->resolveHr($personnel, ['routing_reason'=>$reason, 'authoritative_source'=>$source], null);
    }

    private function resolveDean(array $personnel, string $collegeId, ?array $track): array
    {
        $rows = $this->db->table('dean_assignments da')->select('p.id, p.full_name')->join('profiles p', 'p.id=da.personnel_profile_id')->where('da.college_id', $collegeId)->where('da.is_active', 1)->where('p.status', 'active')->get()->getResultArray();
        if (count($rows) !== 1) throw new RuntimeException(count($rows) === 0 ? 'AUTHORITY_MISSING_DEAN: No active Dean is assigned to the personnel College.' : 'AUTHORITY_AMBIGUOUS_DEAN: Multiple active Deans are assigned to the personnel College.');
        if ($rows[0]['id'] === $personnel['id']) return $this->resolveExplicitHrForSelfAuthority($personnel, $track, 'Dean self-review requires the approved HR-managed route.');
        return $this->result('DEAN', $rows[0]['id'], $personnel['id'], 'college', $collegeId, 'Personnel Department or affiliation resolves to a College.', 'active dean assignment', $track);
    }

    private function resolveDepartmentHead(array $personnel, string $departmentId, ?array $track): array
    {
        $rows = $this->db->table('department_head_assignments dha')->select('p.id, p.full_name')->join('profiles p', 'p.id=dha.personnel_profile_id')->where('dha.department_id', $departmentId)->where('dha.is_active', 1)->where('p.status', 'active')->get()->getResultArray();
        if (count($rows) !== 1) throw new RuntimeException(count($rows) === 0 ? 'AUTHORITY_MISSING_DEPARTMENT_HEAD: No active Department Head is assigned to the outside-College Department.' : 'AUTHORITY_AMBIGUOUS_DEPARTMENT_HEAD: Multiple active Department Heads are assigned to the outside-College Department.');
        if ($rows[0]['id'] === $personnel['id']) throw new RuntimeException('AUTHORITY_SELF_REVIEW_BLOCKED: Department Head self-review has no approved fallback.');
        return $this->result('DEPARTMENT_HEAD', $rows[0]['id'], $personnel['id'], 'department', $departmentId, 'Personnel belongs to a Department outside any College.', 'active department head assignment', $track);
    }

    private function resolveExplicitHrForSelfAuthority(array $personnel, ?array $track, string $reason): array
    {
        $route = PersonnelReviewerRoutingRegistry::resolveReviewerRoute($this->routingContext($personnel) + ['is_dean'=>true]);
        if (($route['authorized_reviewer_role'] ?? '') !== 'hr_staff') throw new RuntimeException('AUTHORITY_SELF_REVIEW_BLOCKED: Self-review is prohibited and no approved HR-managed rule applies.');
        return $this->resolveHr($personnel, $route + ['routing_reason'=>$reason], $track);
    }

    private function resolveHr(array $personnel, array $route, ?array $track): array
    {
        $rows = $this->db->table('profiles p')->select('p.id')->join('profile_roles pr', 'pr.profile_id=p.id')->join('roles r', 'r.id=pr.role_id')->where('p.status', 'active')->where('r.role_key', 'hr_staff')->where('pr.is_active', 1)->get()->getResultArray();
        $ids = array_values(array_unique(array_column($rows, 'id')));
        if (count($ids) !== 1) throw new RuntimeException(count($ids) === 0 ? 'AUTHORITY_MISSING_HR: Explicit HR-managed routing applies, but no active HR authority exists.' : 'AUTHORITY_AMBIGUOUS_HR: Explicit HR-managed routing applies, but multiple active HR authorities exist.');
        return $this->result('HR', $ids[0], $personnel['id'], 'institution', null, $route['routing_reason'] ?? 'Explicit approved HR-managed rule.', $route['authoritative_source'] ?? PersonnelReviewerRoutingRegistry::RULE_VERSION, $track);
    }

    private function routingContext(array $personnel): array
    {
        $designation = strtolower((string) ($personnel['designation_title'] ?? ''));
        return ['personnel_profile_id'=>$personnel['id'], 'personnel_group'=>$personnel['personnel_group'] ?? '', 'organizational_side'=>$personnel['organizational_side'] ?? '', 'designation_title'=>$designation, 'is_dean'=>false, 'is_vp_academics'=>str_contains($designation, 'vice president for academics'), 'is_vp_administration'=>str_contains($designation, 'vice president for administration'), 'college_id'=>null];
    }

    private function result(string $type, string $authorityId, string $personnelId, string $scopeType, ?string $scopeId, string $reason, string $source, ?array $track): array
    {
        $evaluatorRole = ['DEAN'=>'dean', 'DEPARTMENT_HEAD'=>'department_head', 'HR'=>'hr_staff'][$type] ?? strtolower($type);
        return ['authority_type'=>$type, 'authority_profile_id'=>$authorityId, 'authority_personnel_id'=>$authorityId, 'personnel_profile_id'=>$personnelId, 'scope_type'=>$scopeType, 'scope_id'=>$scopeId, 'reason'=>$reason, 'source'=>$source, 'ranking_track_id'=>$track['id'] ?? null,
            'evaluator_profile_id'=>$authorityId, 'evaluator_role'=>$evaluatorRole, 'evaluator_college_id'=>$scopeType === 'college' ? $scopeId : null];
    }
}
