<?php
namespace App\Services;
use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/** Central Phase N resolver; evaluation score selects pass/retain only, never jump distance. */
class RecommendedRankService
{
 public function __construct(private ?BaseConnection $db=null,private ?OrganizationalAuthorityResolver $authority=null){$this->db??=db_connect();$this->authority??=new OrganizationalAuthorityResolver($this->db);}
 public function suggest(array $actor,string $evaluationId):array
 {
  $c=$this->context($evaluationId);$this->authorize($actor,$c);
  $passed=$c['total'] >= $c['threshold'];$present=$this->rank($c['present_rank']);$applied=$this->rank($c['applied']['confirmed_rank_code']);
  $suggested=$passed?$applied:$present;$outcome=$passed?'rank_applied_for':'retained_present_rank';
  $options=[['rank_code'=>$suggested['rank_code'],'display_label'=>$suggested['display_label'],'option_type'=>$outcome]];
  if($passed&&$applied['rank_code']!==$present['rank_code'])$options[]=['rank_code'=>$present['rank_code'],'display_label'=>$present['display_label'],'option_type'=>'retained_present_rank'];
  if($passed&&$present['rank_code']==='ASSISTANT_PROFESSOR_I'&&$c['has_phd']&&$this->exceptionActive()&&!in_array('PROFESSOR_I',array_column($options,'rank_code'),true))$options[]=['rank_code'=>'PROFESSOR_I','display_label'=>'Professor I','option_type'=>'authoritative_exception'];
  $id=$this->uuid();$actorId=(string)$actor['profile']['id'];$basis=$passed?'Evaluation meets locked threshold; recommend confirmed Rank Applied For.':'Evaluation is below locked threshold; retain Present Rank.';
  $this->db->transStart();$this->db->table('personnel_recommended_rank_decisions')->insert([
   'id'=>$id,'personnel_profile_id'=>$c['evaluation']['personnel_profile_id'],'ranking_cycle_id'=>$c['track']['ranking_cycle_id'],'ranking_track_id'=>$c['track']['id'],
   'evaluation_id'=>$c['evaluation']['id'],'evaluation_version'=>$c['evaluation']['version_number'],'present_rank_code_snapshot'=>$present['rank_code'],
   'placement_id_snapshot'=>$c['placement']['id'],'placement_group_id_snapshot'=>$c['placement']['rank_placement_group_id'],'rank_applied_for_decision_id'=>$c['applied']['id'],
   'rank_applied_for_code_snapshot'=>$applied['rank_code'],'evaluation_total_snapshot'=>$c['total'],'passing_threshold_snapshot'=>$c['threshold'],'evaluation_passed'=>$passed?1:0,
   'criteria_snapshot_hash'=>$c['criteria_hash'],'verified_credential_references'=>json_encode($c['credential_snapshot']),'context_hash'=>$c['hash'],
   'suggested_rank_code'=>$suggested['rank_code'],'valid_rank_options'=>json_encode($options),'outcome_type'=>$outcome,'suggestion_rule'=>$passed?'passing_rank_applied_for':'failing_retain_present','suggestion_basis'=>$basis
  ]);$this->event($id,$c['evaluation']['personnel_profile_id'],'suggested',$actorId,['suggested_rank_code'=>$suggested['rank_code'],'passed'=>$passed,'total'=>$c['total'],'threshold'=>$c['threshold'],'options'=>$options]);$this->db->transComplete();if(!$this->db->transStatus())throw new RuntimeException('RECOMMENDED_RANK_SUGGESTION_FAILED');return$this->decision($id);
 }
 public function confirm(array $actor,string $id,string $rankCode,?string $reason):array
 {
  $d=$this->decision($id);if($d['status']!=='suggested')throw new RuntimeException('RECOMMENDED_RANK_NOT_CONFIRMABLE');$c=$this->context($d['evaluation_id']);$this->authorize($actor,$c);
  if(!hash_equals($d['context_hash'],$c['hash'])){$this->db->table('personnel_recommended_rank_decisions')->where('id',$id)->update(['status'=>'stale']);$this->event($id,$d['personnel_profile_id'],'stale_rejected',(string)$actor['profile']['id'],['current_context_hash'=>$c['hash']]);throw new RuntimeException('STALE_RECOMMENDED_RANK_SUGGESTION');}
  $rankCode=trim($rankCode);$valid=array_column($d['valid_rank_options'],'rank_code');if($rankCode===''||!in_array($rankCode,$valid,true))throw new InvalidArgumentException('INVALID_RECOMMENDED_RANK_OPTION');
  $deviation=$rankCode!==$d['suggested_rank_code'];if($deviation&&trim((string)$reason)==='')throw new InvalidArgumentException('DEVIATION_JUSTIFICATION_REQUIRED');
  $actorId=(string)$actor['profile']['id'];$this->db->transStart();$this->db->table('personnel_recommended_rank_decisions')->where('id',$id)->update(['confirmed_rank_code'=>$rankCode,'confirmed_by_profile_id'=>$actorId,'confirmed_at'=>date('Y-m-d H:i:s'),'deviation_reason'=>$deviation?trim((string)$reason):null,'status'=>'confirmed']);$this->event($id,$d['personnel_profile_id'],$deviation?'deviated':'confirmed',$actorId,['original_suggestion'=>$d['suggested_rank_code'],'confirmed_rank_code'=>$rankCode,'justification'=>$deviation?trim((string)$reason):null]);$this->db->transComplete();if(!$this->db->transStatus())throw new RuntimeException('RECOMMENDED_RANK_CONFIRMATION_FAILED');return$this->decision($id);
 }
 public function assertFreshConfirmedDecision(string $id):array
 {
  $d=$this->decision($id);if($d['status']!=='confirmed')throw new RuntimeException('CONFIRMED_RECOMMENDED_RANK_REQUIRED');$c=$this->context($d['evaluation_id']);if(!hash_equals($d['context_hash'],$c['hash']))throw new RuntimeException('STALE_RECOMMENDED_RANK_DECISION');return['decision'=>$d,'context'=>$c];
 }
 private function context(string $evaluationId):array
 {
  $e=$this->db->table('personnel_evaluations')->where('id',$evaluationId)->get()->getRowArray();if(!$e)throw new InvalidArgumentException('EVALUATION_NOT_FOUND');$track=$this->db->table('personnel_evaluation_periods')->where('id',$e['evaluation_period_id'])->get()->getRowArray();if(!$track||$track['personnel_group']!=='FACULTY')throw new RuntimeException('FACULTY_TRACK_REQUIRED');
  if(!in_array($e['status'],['in_evaluation','ready_for_finalization'],true))throw new RuntimeException('EVALUATION_NOT_READY_FOR_RECOMMENDATION');
  $latest=$this->db->table('personnel_evaluations')->where(['personnel_profile_id'=>$e['personnel_profile_id'],'evaluation_period_id'=>$track['id']])->orderBy('version_number','DESC')->get()->getRowArray();if(!$latest||$latest['id']!==$e['id'])throw new RuntimeException('STALE_EVALUATION_VERSION');
  $applied=$this->db->table('personnel_rank_applied_for_decisions')->where(['personnel_profile_id'=>$e['personnel_profile_id'],'ranking_cycle_id'=>$track['ranking_cycle_id'],'ranking_track_id'=>$track['id'],'status'=>'confirmed'])->orderBy('confirmed_at','DESC')->get()->getRowArray();if(!$applied)throw new RuntimeException('CONFIRMED_RANK_APPLIED_FOR_MISSING');
  $person=$this->db->table('personnel_profiles')->where('profile_id',$e['personnel_profile_id'])->get()->getRowArray();$present=trim((string)($person['current_rank_title']??''));$this->rank($present);
  $placement=$this->db->table('personnel_rank_placements')->where(['personnel_profile_id'=>$e['personnel_profile_id'],'status'=>'current'])->where('effective_from <=',date('Y-m-d'))->get()->getRowArray();if(!$placement)throw new RuntimeException('CURRENT_PLACEMENT_MISSING');
  $criteria=is_string($e['criteria_snapshot']??null)?json_decode($e['criteria_snapshot'],true):($e['criteria_snapshot']??[]);$values=array_values(array_filter([$criteria['version']['passing_score']??null,$criteria['sheet']['passing_score']??null,$criteria['passing_score']??null],fn($v)=>is_numeric($v)));$values=array_values(array_unique(array_map('floatval',$values)));if(count($values)!==1||$values[0]<=0)throw new RuntimeException('PASSING_THRESHOLD_MISSING_OR_AMBIGUOUS');$threshold=$values[0];$total=(float)$e['total_score'];$criteriaHash=hash('sha256',json_encode($criteria));
  $credentials=$this->db->table('personnel_credentials')->select('id,credential_type,degree_level,verified_at,updated_at')->where(['personnel_profile_id'=>$e['personnel_profile_id'],'verification_status'=>'verified','record_state'=>'active'])->orderBy('id')->get()->getResultArray();$hasPhd=count(array_filter($credentials,fn($r)=>$r['credential_type']==='degree'&&$r['degree_level']==='doctorate'))>0;$credentialSnapshot=array_map(fn($r)=>['id'=>$r['id'],'verified_at'=>$r['verified_at'],'updated_at'=>$r['updated_at']],$credentials);
  $appliedCredentials=is_string($applied['verified_credential_references']??null)?json_decode($applied['verified_credential_references'],true):($applied['verified_credential_references']??[]);if($applied['present_rank_code_snapshot']!==$this->rank($present)['rank_code']||$applied['placement_id_snapshot']!==$placement['id']||$appliedCredentials!==$credentialSnapshot)throw new RuntimeException('CONFIRMED_RANK_APPLIED_FOR_STALE');
  $cycle=$this->db->table('ranking_cycles')->where('id',$track['ranking_cycle_id'])->get()->getRowArray();$hash=hash('sha256',json_encode(['present'=>$this->rank($present)['rank_code'],'person_updated'=>$person['updated_at']??null,'placement'=>$placement['id'],'placement_updated'=>$placement['updated_at']??null,'credentials'=>$credentialSnapshot,'applied_id'=>$applied['id'],'applied_rank'=>$applied['confirmed_rank_code'],'applied_at'=>$applied['confirmed_at'],'evaluation'=>$e['id'],'version'=>$e['version_number'],'total'=>$total,'evaluation_updated'=>$e['updated_at']??null,'criteria'=>$criteriaHash,'threshold'=>$threshold,'cycle'=>$track['ranking_cycle_id'],'cycle_updated'=>$cycle['updated_at']??null,'track'=>$track['id'],'track_updated'=>$track['updated_at']??null]));
  return['evaluation'=>$e,'track'=>$track,'applied'=>$applied,'placement'=>$placement,'present_rank'=>$present,'total'=>$total,'threshold'=>$threshold,'criteria_hash'=>$criteriaHash,'credential_snapshot'=>$credentialSnapshot,'has_phd'=>$hasPhd,'hash'=>$hash];
 }
 private function rank(string $id):array{$r=$this->db->table('faculty_rank_catalog')->where('is_active',1)->groupStart()->where('rank_code',$id)->orWhere('display_label',$id)->groupEnd()->get()->getRowArray();if(!$r)throw new RuntimeException('RANK_NOT_ACTIVE_OR_UNKNOWN');return$r;}
 private function exceptionActive():bool{return$this->db->table('faculty_rank_transitions')->where(['from_rank_code'=>'ASSISTANT_PROFESSOR_I','to_rank_code'=>'PROFESSOR_I','transition_type'=>'phd_exception','requires_verified_phd'=>1,'is_active'=>1])->countAllResults()===1;}
 private function authorize(array $actor,array $c):void{$a=$this->authority->resolveResponsibleAuthority($c['evaluation']['personnel_profile_id'],$c['track']);if(!$this->authority->actorMayAct($a,(string)($actor['profile']['id']??'')))throw new RuntimeException('EVALUATOR_OUTSIDE_AUTHORIZED_SCOPE');}
 private function decision(string $id):array{$r=$this->db->table('personnel_recommended_rank_decisions')->where('id',$id)->get()->getRowArray();if(!$r)throw new InvalidArgumentException('RECOMMENDED_RANK_DECISION_NOT_FOUND');foreach(['valid_rank_options','verified_credential_references']as$k)if(is_string($r[$k]??null))$r[$k]=json_decode($r[$k],true)?:[];return$r;}
 private function event(string $id,string $p,string $type,string $actor,array $payload):void{$this->db->table('personnel_recommended_rank_events')->insert(['id'=>$this->uuid(),'decision_id'=>$id,'personnel_profile_id'=>$p,'event_type'=>$type,'performed_by_profile_id'=>$actor,'event_payload'=>json_encode($payload)]);}
 private function uuid():string{$d=random_bytes(16);$d[6]=chr((ord($d[6])&15)|64);$d[8]=chr((ord($d[8])&63)|128);return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($d),4));}
}
