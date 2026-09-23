<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/** Read-only Phase K1 resolver for configured placement groups and exact Faculty mappings. */
class RankPlacementCatalogService
{
    public function __construct(private ?BaseConnection $db=null) { $this->db??=db_connect(); }

    public function groups(string $personnelGroup='FACULTY'): array
    {
        return $this->db->table('rank_placement_groups')->where('personnel_group',strtoupper($personnelGroup))->where('is_active',1)->orderBy('catalog_type')->orderBy('qualification_tier_code')->get()->getResultArray();
    }

    public function validRanks(int $placementGroupId): array
    {
        $group=$this->group($placementGroupId);
        if(($group['configuration_status']??'unresolved')!=='configured')throw new RuntimeException('RANK_PLACEMENT_UNRESOLVED: '.$group['unresolved_reason']);
        if($group['personnel_group']!=='FACULTY')throw new RuntimeException('RANK_PLACEMENT_UNRESOLVED: Non-Teaching Faculty rank policy is not configured.');
        return $this->db->table('rank_placement_group_ranks m')->select('r.rank_code,r.display_label,r.catalog_type,r.qualification_tier_code,m.ladder_order,r.source_document_id')->join('faculty_rank_catalog r','r.id=m.faculty_rank_catalog_id')->where('m.rank_placement_group_id',$placementGroupId)->where('m.mapping_status','configured')->where('r.is_active',1)->orderBy('m.ladder_order','DESC')->get()->getResultArray();
    }

    public function assertRankAllowed(int $placementGroupId,string $rankCode): array
    {
        foreach($this->validRanks($placementGroupId) as $rank)if($rank['rank_code']===$rankCode)return$rank;
        throw new InvalidArgumentException('RANK_OUTSIDE_PLACEMENT: Rank is not valid for the confirmed placement group.');
    }

    public function nextRank(int $placementGroupId,string $currentRankCode): ?array
    {
        $this->assertRankAllowed($placementGroupId,$currentRankCode);
        $row=$this->db->table('faculty_rank_transitions t')->select('t.to_rank_code')->join('faculty_rank_catalog target','target.rank_code=t.to_rank_code AND target.is_active=1')->join('rank_placement_group_ranks m','m.faculty_rank_catalog_id=target.id')->where('m.rank_placement_group_id',$placementGroupId)->where('t.from_rank_code',$currentRankCode)->where('t.transition_type','normal_sequential')->where('t.is_active',1)->get()->getRowArray();
        return $row?$this->assertRankAllowed($placementGroupId,$row['to_rank_code']):null;
    }

    private function group(int $id): array
    {
        $row=$this->db->table('rank_placement_groups')->where('id',$id)->where('is_active',1)->get()->getRowArray();
        if(!$row)throw new InvalidArgumentException('RANK_PLACEMENT_NOT_FOUND: Rank placement group was not found.');
        return$row;
    }
}
