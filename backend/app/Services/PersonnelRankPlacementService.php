<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;
use Throwable;

/** Phase L placement lifecycle. It never changes Present Rank. */
class PersonnelRankPlacementService
{
    public function __construct(private ?BaseConnection $db = null) { $this->db ??= db_connect(); }

    public function suggest(string $personnelId, string $actorId): array
    {
        $profile = $this->facultyProfile($personnelId);
        if (($profile['faculty_engagement'] ?? 'full_time_faculty') === 'part_time_faculty') throw new RuntimeException('PART_TIME_PLACEMENT_UNRESOLVED');

        $credentials = $this->db->table('personnel_credentials')
            ->where('personnel_profile_id', $personnelId)->where('verification_status', 'verified')->where('record_state', 'active')
            ->orderBy('verified_at', 'ASC')->get()->getResultArray();
        $candidates = [];
        $basis = [];
        foreach ($credentials as $credential) {
            $tier = null; $rule = null;
            if ($credential['credential_type'] === 'degree' && $credential['degree_level'] === 'masters') { $tier = 'masters'; $rule = "verified master's degree -> Assistant Professor family"; }
            if ($credential['credential_type'] === 'degree' && $credential['degree_level'] === 'doctorate') { $tier = 'doctoral'; $rule = 'verified doctorate -> Professor family'; }
            if ($credential['credential_type'] === 'board_licensure' && $credential['board_licensure_status'] === 'board_passer') { $tier = 'board_licensure'; $rule = 'verified board passer/licensure -> Senior Instructor probationary placement'; }
            if ($credential['credential_type'] === 'board_licensure' && $credential['board_licensure_status'] === 'non_board') { $tier = 'baccalaureate'; $rule = 'verified non-board status -> Assistant Instructor probationary placement'; }
            if ($tier !== null) { $candidates[$tier] = true; $basis[] = ['credential_id'=>$credential['id'], 'tier_code'=>$tier, 'rule'=>$rule]; }
        }
        $tiers = array_keys($candidates);
        $status = count($tiers) === 1 ? 'suggested' : (count($tiers) > 1 ? 'ambiguous' : 'unresolved');
        $group = null;
        if ($status === 'suggested') {
            $group = $this->db->table('rank_placement_groups')->where(['personnel_group'=>'FACULTY','catalog_type'=>'full_time_academic_rank','qualification_tier_code'=>$tiers[0],'configuration_status'=>'configured','is_active'=>1])->get()->getRowArray();
            if (!$group) throw new RuntimeException('PLACEMENT_GROUP_NOT_CONFIGURED');
        }
        $explanation = $status === 'suggested' ? $basis[0]['rule'] : ($status === 'ambiguous' ? 'Multiple verified active credentials resolve to different placement groups; HR policy precedence is required.' : 'No verified active credential supports an authoritative placement rule.');
        $id = $this->uuid();
        $this->db->table('personnel_rank_placement_suggestions')->insert([
            'id'=>$id, 'personnel_profile_id'=>$personnelId, 'suggested_placement_group_id'=>$group['id'] ?? null,
            'status'=>$status, 'explanation'=>$explanation, 'credential_references'=>json_encode($basis),
            'candidate_tier_codes'=>json_encode($tiers), 'generated_by_profile_id'=>$actorId,
        ]);
        return $this->db->table('personnel_rank_placement_suggestions')->where('id',$id)->get()->getRowArray();
    }

    public function confirm(string $suggestionId, string $hrActorId, string $effectiveDate): array
    {
        $effectiveDate=$this->date($effectiveDate);
        $suggestion = $this->suggestion($suggestionId);
        if ($suggestion['status'] !== 'suggested' || empty($suggestion['suggested_placement_group_id'])) throw new RuntimeException('PLACEMENT_SUGGESTION_NOT_CONFIRMABLE');
        $personnelId = $suggestion['personnel_profile_id'];
        $current = $this->current($personnelId);
        $status = $effectiveDate > date('Y-m-d') ? 'pending_future' : 'current';
        if ($status === 'current' && $current && $effectiveDate <= $current['effective_from']) throw new RuntimeException('PLACEMENT_EFFECTIVE_PERIOD_OVERLAP');
        $id = $this->uuid();
        $this->db->transStart();
        if ($status === 'current' && $current) {
            $this->db->table('personnel_rank_placements')->where('id',$current['id'])->update(['status'=>'historical','effective_to'=>date('Y-m-d',strtotime($effectiveDate.' -1 day'))]);
        }
        $this->db->table('personnel_rank_placements')->insert([
            'id'=>$id,'personnel_profile_id'=>$personnelId,'rank_placement_group_id'=>$suggestion['suggested_placement_group_id'],
            'previous_placement_id'=>$current['id'] ?? null,'effective_from'=>$effectiveDate,'status'=>$status,
            'hr_confirmed_at'=>date('Y-m-d H:i:s'),'confirmed_by_profile_id'=>$hrActorId,
            'supporting_credential_references'=>$suggestion['credential_references'],
        ]);
        $this->db->table('personnel_rank_placement_suggestions')->where('id',$suggestionId)->update(['status'=>'confirmed','confirmed_placement_id'=>$id]);
        $this->event($id,$personnelId,'confirmed',$hrActorId,['suggestion_id'=>$suggestionId,'effective_from'=>$effectiveDate]);
        if ($status === 'current') $this->event($id,$personnelId,'activated',$hrActorId,['activation_mode'=>'confirmation']);
        $this->db->transComplete();
        if (!$this->db->transStatus()) throw new RuntimeException('PLACEMENT_CONFIRMATION_FAILED');
        return $this->placement($id);
    }

    public function activateDue(?string $placementId = null, ?string $actorId = null): array
    {
        $query = $this->db->table('personnel_rank_placements')->whereIn('status',['pending_future','activation_failed'])->where('effective_from <=',date('Y-m-d'));
        if ($placementId !== null) $query->where('id',$placementId);
        $rows=$query->get()->getResultArray(); $results=[];
        foreach($rows as $row) {
            try { $results[]=$this->activate($row,$actorId); }
            catch(Throwable $e) {
                $this->db->table('personnel_rank_placements')->where('id',$row['id'])->update(['status'=>'activation_failed','activation_failed_at'=>date('Y-m-d H:i:s'),'activation_failure_reason'=>$e->getMessage()]);
                $this->event($row['id'],$row['personnel_profile_id'],'activation_failed',$actorId,['reason'=>$e->getMessage()]);
                $results[]=['id'=>$row['id'],'status'=>'activation_failed','reason'=>$e->getMessage()];
            }
        }
        return $results;
    }

    private function activate(array $pending, ?string $actorId): array
    {
        $current=$this->current($pending['personnel_profile_id']);
        if ($current && $pending['effective_from'] <= $current['effective_from']) throw new RuntimeException('PLACEMENT_EFFECTIVE_PERIOD_OVERLAP');
        $this->db->transStart();
        if($current)$this->db->table('personnel_rank_placements')->where('id',$current['id'])->update(['status'=>'historical','effective_to'=>date('Y-m-d',strtotime($pending['effective_from'].' -1 day'))]);
        $this->db->table('personnel_rank_placements')->where('id',$pending['id'])->update(['status'=>'current','activation_failed_at'=>null,'activation_failure_reason'=>null]);
        $this->event($pending['id'],$pending['personnel_profile_id'],$pending['status']==='activation_failed'?'activation_retried':'activated',$actorId,['previous_placement_id'=>$current['id']??null]);
        $this->db->transComplete();
        if(!$this->db->transStatus())throw new RuntimeException('PLACEMENT_ACTIVATION_TRANSACTION_FAILED');
        return $this->placement($pending['id']);
    }

    public function cancel(string $placementId,string $hrActorId,string $reason): array
    {
        if(trim($reason)==='')throw new InvalidArgumentException('CANCELLATION_REASON_REQUIRED');
        $row=$this->placement($placementId);
        if(!in_array($row['status'],['pending_future','activation_failed'],true))throw new RuntimeException('PLACEMENT_NOT_CANCELLABLE');
        $this->db->table('personnel_rank_placements')->where('id',$placementId)->update(['status'=>'cancelled','cancelled_at'=>date('Y-m-d H:i:s'),'cancelled_by_profile_id'=>$hrActorId,'cancellation_reason'=>trim($reason)]);
        $this->event($placementId,$row['personnel_profile_id'],'cancelled',$hrActorId,['reason'=>trim($reason)]);
        return $this->placement($placementId);
    }

    public function correct(string $placementId,string $hrActorId,string $reason,string $effectiveDate): array
    {
        if(trim($reason)==='')throw new InvalidArgumentException('CORRECTION_REASON_REQUIRED');
        $effectiveDate=$this->date($effectiveDate);
        $old=$this->placement($placementId);
        if(!in_array($old['status'],['pending_future','activation_failed'],true))throw new RuntimeException('PLACEMENT_NOT_CORRECTABLE');
        $this->db->transStart();
        $this->db->table('personnel_rank_placements')->where('id',$placementId)->update(['status'=>'corrected','correction_reason'=>trim($reason)]);
        $id=$this->uuid();
        $this->db->table('personnel_rank_placements')->insert([
            'id'=>$id,'personnel_profile_id'=>$old['personnel_profile_id'],'rank_placement_group_id'=>$old['rank_placement_group_id'],
            'previous_placement_id'=>$old['previous_placement_id'],'effective_from'=>$effectiveDate,'status'=>'pending_future',
            'hr_confirmed_at'=>date('Y-m-d H:i:s'),'confirmed_by_profile_id'=>$hrActorId,'supporting_credential_references'=>$old['supporting_credential_references'],
            'correction_of_placement_id'=>$placementId,'correction_type'=>'data','correction_reason'=>trim($reason),
        ]);
        $this->event($placementId,$old['personnel_profile_id'],'corrected',$hrActorId,['corrected_by_placement_id'=>$id,'reason'=>trim($reason)]);
        $this->db->transComplete();
        if(!$this->db->transStatus())throw new RuntimeException('PLACEMENT_CORRECTION_FAILED');
        if($effectiveDate<=date('Y-m-d')){$result=$this->activateDue($id,$hrActorId);return$result[0];}
        return $this->placement($id);
    }

    public function history(string $personnelId,bool $limited=false): array
    {
        $query=$this->db->table('personnel_rank_placements p')->select('p.*,g.catalog_type,g.qualification_tier_code,g.qualification_source_label')->join('rank_placement_groups g','g.id=p.rank_placement_group_id')->where('p.personnel_profile_id',$personnelId);
        if($limited)$query->whereIn('p.status',['current','pending_future']);
        $rows=$query->orderBy('p.effective_from','DESC')->orderBy('p.created_at','DESC')->get()->getResultArray();
        if(!$limited)return$rows;
        return array_map(static fn(array$row):array=>[
            'placement_id'=>$row['id'],
            'rank_placement_group_id'=>$row['rank_placement_group_id'],
            'catalog_type'=>$row['catalog_type'],
            'qualification_tier_code'=>$row['qualification_tier_code'],
            'qualification_source_label'=>$row['qualification_source_label'],
            'effective_from'=>$row['effective_from'],
            'status'=>$row['status'],
        ],$rows);
    }

    private function facultyProfile(string $id): array { $row=$this->db->table('personnel_profiles')->where('profile_id',$id)->get()->getRowArray(); if(!$row)throw new InvalidArgumentException('PERSONNEL_NOT_FOUND'); if(strtoupper((string)($row['personnel_group']??''))!=='FACULTY')throw new RuntimeException('NON_TEACHING_RANK_CATALOG_UNRESOLVED'); return$row; }
    private function suggestion(string $id): array { $row=$this->db->table('personnel_rank_placement_suggestions')->where('id',$id)->get()->getRowArray(); if(!$row)throw new InvalidArgumentException('PLACEMENT_SUGGESTION_NOT_FOUND'); return$row; }
    private function placement(string $id): array { $row=$this->db->table('personnel_rank_placements')->where('id',$id)->get()->getRowArray(); if(!$row)throw new InvalidArgumentException('PLACEMENT_NOT_FOUND'); return$row; }
    private function current(string $personnelId): ?array { return $this->db->table('personnel_rank_placements')->where(['personnel_profile_id'=>$personnelId,'status'=>'current'])->get()->getRowArray()?:null; }
    private function event(string $placementId,string $personnelId,string $type,?string $actorId,array $payload):void{$this->db->table('personnel_rank_placement_events')->insert(['id'=>$this->uuid(),'placement_id'=>$placementId,'personnel_profile_id'=>$personnelId,'event_type'=>$type,'performed_by_profile_id'=>$actorId,'event_payload'=>json_encode($payload)]);}
    private function date(string $value):string{$d=\DateTimeImmutable::createFromFormat('!Y-m-d',trim($value));if(!$d||$d->format('Y-m-d')!==trim($value))throw new InvalidArgumentException('INVALID_EFFECTIVE_DATE');return$d->format('Y-m-d');}
    private function uuid():string{$d=random_bytes(16);$d[6]=chr((ord($d[6])&15)|64);$d[8]=chr((ord($d[8])&63)|128);return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($d),4));}
}
