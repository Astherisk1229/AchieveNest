<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/** Central Phase M resolver. No Present Rank mutation occurs here. */
class RankAppliedForService
{
    public function __construct(private ?BaseConnection $db=null,private ?OrganizationalAuthorityResolver $authority=null){$this->db??=db_connect();$this->authority??=new OrganizationalAuthorityResolver($this->db);}

    public function suggest(array $actor,string $personnelId,string $cycleId,string $trackId):array
    {
        $context=$this->context($personnelId,$cycleId,$trackId);
        $this->authorize($actor,$personnelId,$context['track']);
        $options=[];
        $normal=$this->normalNext($context['rank']['rank_code'],$context['placement']['rank_placement_group_id']);
        if($normal)$options[]=['rank_code'=>$normal['rank_code'],'display_label'=>$normal['display_label'],'transition_type'=>'normal_sequential','rule_reference'=>$normal['rule_reference']];
        $exception=$this->phdException($context);
        if($exception)$options[]=$exception;
        if(!$options)throw new RuntimeException('NO_SYSTEM_VALID_RANK_APPLIED_FOR_OPTION');
        $suggested=$normal?$options[0]:$exception;
        $id=$this->uuid();
        $this->db->transStart();
        $this->db->table('personnel_rank_applied_for_decisions')->insert([
            'id'=>$id,'personnel_profile_id'=>$personnelId,'ranking_cycle_id'=>$cycleId,'ranking_track_id'=>$trackId,
            'present_rank_code_snapshot'=>$context['rank']['rank_code'],'present_rank_label_snapshot'=>$context['rank']['display_label'],
            'placement_id_snapshot'=>$context['placement']['id'],'placement_group_id_snapshot'=>$context['placement']['rank_placement_group_id'],
            'verified_credential_references'=>json_encode($context['credential_snapshot']),'context_hash'=>$context['hash'],
            'suggested_rank_code'=>$suggested['rank_code'],'valid_rank_options'=>json_encode($options),
            'suggestion_rule'=>$suggested['transition_type'],'suggestion_basis'=>$suggested['rule_reference'],'status'=>'suggested',
        ]);
        $this->event($id,$personnelId,'suggested',(string)$actor['profile']['id'],['suggested_rank_code'=>$suggested['rank_code'],'options'=>$options,'context_hash'=>$context['hash']]);
        $this->db->transComplete();if(!$this->db->transStatus())throw new RuntimeException('RANK_APPLIED_FOR_SUGGESTION_FAILED');
        return$this->decision($id);
    }

    public function confirm(array $actor,string $decisionId,string $rankCode,?string $justification):array
    {
        $decision=$this->decision($decisionId);
        if($decision['status']!=='suggested')throw new RuntimeException('RANK_APPLIED_FOR_DECISION_NOT_CONFIRMABLE');
        $context=$this->context($decision['personnel_profile_id'],$decision['ranking_cycle_id'],$decision['ranking_track_id']);
        $this->authorize($actor,$decision['personnel_profile_id'],$context['track']);
        if(!hash_equals($decision['context_hash'],$context['hash'])){
            $this->db->table('personnel_rank_applied_for_decisions')->where('id',$decisionId)->update(['status'=>'stale']);
            $this->event($decisionId,$decision['personnel_profile_id'],'stale_rejected',(string)$actor['profile']['id'],['current_context_hash'=>$context['hash']]);
            throw new RuntimeException('STALE_RANK_APPLIED_FOR_SUGGESTION');
        }
        $rankCode=trim($rankCode);$options=is_string($decision['valid_rank_options'])?json_decode($decision['valid_rank_options'],true):$decision['valid_rank_options'];
        $valid=array_column($options?:[],'rank_code');if($rankCode===''||!in_array($rankCode,$valid,true))throw new InvalidArgumentException('INVALID_RANK_APPLIED_FOR_OPTION');
        $deviation=$rankCode!==$decision['suggested_rank_code'];if($deviation&&trim((string)$justification)==='')throw new InvalidArgumentException('DEVIATION_JUSTIFICATION_REQUIRED');
        $now=date('Y-m-d H:i:s');$actorId=(string)$actor['profile']['id'];
        $this->db->transStart();
        $this->db->table('personnel_rank_applied_for_decisions')->where('id',$decisionId)->update(['confirmed_rank_code'=>$rankCode,'confirmed_by_profile_id'=>$actorId,'confirmed_at'=>$now,'deviation_reason'=>$deviation?trim((string)$justification):null,'status'=>'confirmed']);
        $this->event($decisionId,$decision['personnel_profile_id'],$deviation?'deviated':'confirmed',$actorId,['original_suggestion'=>$decision['suggested_rank_code'],'confirmed_rank_code'=>$rankCode,'justification'=>$deviation?trim((string)$justification):null]);
        $this->db->transComplete();if(!$this->db->transStatus())throw new RuntimeException('RANK_APPLIED_FOR_CONFIRMATION_FAILED');
        return$this->decision($decisionId);
    }

    private function context(string $personnelId,string $cycleId,string $trackId):array
    {
        $track=$this->db->table('personnel_evaluation_periods')->where(['id'=>$trackId,'ranking_cycle_id'=>$cycleId,'personnel_group'=>'FACULTY'])->get()->getRowArray();if(!$track)throw new InvalidArgumentException('RANKING_TRACK_CONTEXT_INVALID');
        $cycle=$this->db->table('ranking_cycles')->where('id',$cycleId)->get()->getRowArray();if(!$cycle)throw new InvalidArgumentException('RANKING_CYCLE_NOT_FOUND');
        $person=$this->db->table('personnel_profiles')->where('profile_id',$personnelId)->get()->getRowArray();if(!$person)throw new InvalidArgumentException('PERSONNEL_NOT_FOUND');if(strtoupper((string)($person['personnel_group']??''))!=='FACULTY')throw new RuntimeException('NON_TEACHING_RANK_CATALOG_UNRESOLVED');if(($person['faculty_engagement']??'full_time_faculty')==='part_time_faculty')throw new RuntimeException('PART_TIME_RANKING_UNRESOLVED');
        $rankText=trim((string)($person['current_rank_title']??''));$rank=$this->db->table('faculty_rank_catalog')->where('is_active',1)->groupStart()->where('rank_code',$rankText)->orWhere('display_label',$rankText)->groupEnd()->get()->getRowArray();if(!$rank)throw new RuntimeException('PRESENT_RANK_UNRESOLVED');
        $placement=$this->db->table('personnel_rank_placements')->where(['personnel_profile_id'=>$personnelId,'status'=>'current'])->where('effective_from <=',date('Y-m-d'))->get()->getRowArray();
        if(!$placement){$latest=$this->db->table('personnel_rank_placements')->where('personnel_profile_id',$personnelId)->orderBy('created_at','DESC')->get()->getRowArray();$latestSuggestion=$this->db->table('personnel_rank_placement_suggestions')->where('personnel_profile_id',$personnelId)->orderBy('created_at','DESC')->get()->getRowArray();if(($latestSuggestion['status']??'')==='ambiguous')throw new RuntimeException('PLACEMENT_AMBIGUOUS');$code=['pending_future'=>'PLACEMENT_NOT_YET_EFFECTIVE','activation_failed'=>'PLACEMENT_ACTIVATION_FAILED','cancelled'=>'PLACEMENT_CANCELLED','corrected'=>'PLACEMENT_CORRECTED'][$latest['status']??'']??'CURRENT_PLACEMENT_MISSING';throw new RuntimeException($code);}
        $credentials=$this->db->table('personnel_credentials')->select('id,credential_type,degree_level,board_licensure_status,verified_at,updated_at')->where(['personnel_profile_id'=>$personnelId,'verification_status'=>'verified','record_state'=>'active'])->orderBy('id')->get()->getResultArray();
        $hasPhd=count(array_filter($credentials,fn($c)=>$c['credential_type']==='degree'&&$c['degree_level']==='doctorate'))>0;
        $allowed=$this->db->table('rank_placement_group_ranks m')->join('faculty_rank_catalog r','r.id=m.faculty_rank_catalog_id')->where(['m.rank_placement_group_id'=>$placement['rank_placement_group_id'],'r.rank_code'=>$rank['rank_code'],'m.mapping_status'=>'configured','r.is_active'=>1])->countAllResults()>0;
        $exceptionCompatibility=$rank['rank_code']==='ASSISTANT_PROFESSOR_I'&&$hasPhd&&$this->activeExceptionExists();if(!$allowed&&!$exceptionCompatibility)throw new RuntimeException('PRESENT_RANK_INCOMPATIBLE_WITH_PLACEMENT');
        $snapshot=array_map(fn($c)=>['id'=>$c['id'],'verified_at'=>$c['verified_at'],'updated_at'=>$c['updated_at']],$credentials);
        $hash=hash('sha256',json_encode(['rank'=>$rank['rank_code'],'rank_updated'=>$person['updated_at']??null,'placement'=>$placement['id'],'placement_updated'=>$placement['updated_at']??null,'credentials'=>$snapshot,'cycle'=>$cycleId,'cycle_updated'=>$cycle['updated_at']??null,'track'=>$trackId,'track_version'=>$track['version']??null,'track_updated'=>$track['updated_at']??null]));
        return compact('cycle','track','person','rank','placement','credentials','hasPhd')+['credential_snapshot'=>$snapshot,'hash'=>$hash];
    }

    private function normalNext(string $from,int $groupId):?array{$row=$this->db->table('faculty_rank_transitions t')->select('r.rank_code,r.display_label,t.transition_type,t.rule_reference')->join('faculty_rank_catalog r','r.rank_code=t.to_rank_code AND r.is_active=1')->join('rank_placement_group_ranks m','m.faculty_rank_catalog_id=r.id')->where(['t.from_rank_code'=>$from,'t.transition_type'=>'normal_sequential','t.is_active'=>1,'m.rank_placement_group_id'=>$groupId,'m.mapping_status'=>'configured'])->get()->getRowArray();return$row?:null;}
    private function phdException(array $c):?array{if($c['rank']['rank_code']!=='ASSISTANT_PROFESSOR_I'||!$c['hasPhd'])return null;$row=$this->db->table('faculty_rank_transitions t')->select('r.rank_code,r.display_label,t.transition_type,t.rule_reference')->join('faculty_rank_catalog r','r.rank_code=t.to_rank_code AND r.is_active=1')->where(['t.from_rank_code'=>'ASSISTANT_PROFESSOR_I','t.to_rank_code'=>'PROFESSOR_I','t.transition_type'=>'phd_exception','t.requires_verified_phd'=>1,'t.is_active'=>1])->get()->getRowArray();return$row?:null;}
    private function activeExceptionExists():bool{return$this->db->table('faculty_rank_transitions')->where(['from_rank_code'=>'ASSISTANT_PROFESSOR_I','to_rank_code'=>'PROFESSOR_I','transition_type'=>'phd_exception','requires_verified_phd'=>1,'is_active'=>1])->countAllResults()===1;}
    private function authorize(array $actor,string $personnelId,array $track):void{$authority=$this->authority->resolveResponsibleAuthority($personnelId,$track);if(!$this->authority->actorMayAct($authority,(string)($actor['profile']['id']??'')))throw new RuntimeException('REVIEWER_OUTSIDE_AUTHORIZED_SCOPE');}
    private function decision(string $id):array{$r=$this->db->table('personnel_rank_applied_for_decisions')->where('id',$id)->get()->getRowArray();if(!$r)throw new InvalidArgumentException('RANK_APPLIED_FOR_DECISION_NOT_FOUND');foreach(['verified_credential_references','valid_rank_options'] as $key)if(is_string($r[$key]??null))$r[$key]=json_decode($r[$key],true)?:[];return$r;}
    private function event(string $id,string $personnel,string $type,string $actor,array $payload):void{$this->db->table('personnel_rank_applied_for_events')->insert(['id'=>$this->uuid(),'decision_id'=>$id,'personnel_profile_id'=>$personnel,'event_type'=>$type,'performed_by_profile_id'=>$actor,'event_payload'=>json_encode($payload)]);}
    private function uuid():string{$d=random_bytes(16);$d[6]=chr((ord($d[6])&15)|64);$d[8]=chr((ord($d[8])&63)|128);return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($d),4));}
}
