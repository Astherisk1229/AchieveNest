<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

final class EventSourceRecordBridgeService
{
    public function __construct(private ?BaseConnection $db=null, private ?StudentCategoryMapperRegistry $mappers=null)
    { $this->db ??= db_connect(); $this->mappers ??= new StudentCategoryMapperRegistry(); }

    public function resolve(string $eventId, array $studentIds, string $actorId): array
    {
        $this->assertSchema();
        $event=$this->db->table('events')->where('id',$eventId)->get()->getRowArray();
        if (!$event) return [['bridge_status'=>'BLOCKED','reason_codes'=>['EVENT_NOT_FOUND']]];
        $builder=$this->facts($eventId);
        if ($studentIds) $builder->whereIn('es.student_profile_id',array_values(array_unique($studentIds)));
        $facts=$builder->get()->getResultArray();
        if (!$facts) return [['bridge_status'=>'BLOCKED','reason_codes'=>['EVENT_PARTICIPATION_NOT_FOUND']]];
        return array_map(fn($fact)=>$this->resolveFact($event,$fact,$actorId),$facts);
    }

    public function recordFacts(string $eventId,array $participants,string $actorId): array
    {
        $this->assertSchema();
        $event=$this->db->table('events')->where('id',$eventId)->get()->getRowArray();
        if (!$event) throw new RuntimeException('EVENT_NOT_FOUND');
        $results=[];
        foreach($participants as $input) {
            $studentId=trim((string)($input['student_id']??''));
            $categoryCode=strtoupper(trim((string)($input['category_code']??'')));
            $subcategoryCode=strtoupper(trim((string)($input['subcategory_code']??'')));
            $student=$this->db->table('profiles')->where(['id'=>$studentId,'account_type'=>'student'])->get()->getRowArray();
            if(!$student){$results[]=['student_id'=>$studentId,'bridge_status'=>'BLOCKED','reason_codes'=>['STUDENT_NOT_FOUND']];continue;}
            $category=$this->db->table('portfolio_categories')->where(['code'=>$categoryCode,'status'=>'active'])->get()->getRowArray();
            if(!$category){$results[]=['student_id'=>$studentId,'bridge_status'=>'BLOCKED','reason_codes'=>['CATEGORY_MAPPING_UNRESOLVED']];continue;}
            $subcategory=$this->db->table('portfolio_subcategories')->where(['category_id'=>$category['id'],'code'=>$subcategoryCode,'status'=>'active'])->get()->getRowArray();
            if(!$subcategory){$results[]=['student_id'=>$studentId,'bridge_status'=>'BLOCKED','reason_codes'=>['SUBCATEGORY_MAPPING_UNRESOLVED']];continue;}
            $attributes=is_array($input['structured_attributes']??null)?$input['structured_attributes']:[];
            $fact=['category_code'=>$categoryCode,'subcategory_id'=>$subcategory['id'],'participation_role'=>$input['participation_role']??null,'verified_engagement_outcome'=>$input['verified_engagement_outcome']??null,'placement'=>$input['placement']??null];
            $mappingReasons=$this->mappers->validate($fact);
            $fingerprint=hash('sha256',json_encode([$studentId,$eventId,$category['id'],$subcategory['id'],$this->normalized($fact),$attributes],JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));
            $existing=$this->db->table('event_student_source_records')->where(['event_id'=>$eventId,'student_profile_id'=>$studentId,'fact_fingerprint'=>$fingerprint])->get()->getRowArray();
            if($existing){$results[]=['student_id'=>$studentId,'event_participation_id'=>$existing['id'],'bridge_status'=>$existing['bridge_status'],'reason_codes'=>json_decode($existing['reason_codes']??'[]',true)?:[]];continue;}
            $id=$this->uuid();$reasons=$mappingReasons;$status=$reasons?'BLOCKED':'READY_TO_CREATE';
            $this->db->table('event_student_source_records')->insert(['id'=>$id,'event_id'=>$eventId,'student_profile_id'=>$studentId,'category_id'=>$category['id'],'subcategory_id'=>$subcategory['id'],'participation_role'=>$fact['participation_role'],'verified_engagement_outcome'=>$fact['verified_engagement_outcome'],'placement'=>$fact['placement'],'structured_attributes'=>json_encode($attributes),'attendance_verified'=>(int)!empty($input['attendance_verified']),'facts_finalized'=>(int)!empty($input['facts_finalized']),'verification_status'=>in_array($input['verification_status']??'pending',['pending','verified','rejected','archived'],true)?$input['verification_status']:'pending','fact_fingerprint'=>$fingerprint,'bridge_status'=>$status,'reason_codes'=>json_encode($reasons),'created_by'=>$actorId]);
            $results[]=['student_id'=>$studentId,'event_participation_id'=>$id,'bridge_status'=>$status,'reason_codes'=>$reasons];
        }
        return $results;
    }

    public function candidates(string $eventId): array
    {
        $this->assertSchema();
        return $this->db->table('event_student_source_records es')
            ->select('es.id event_participation_id,es.event_id,es.student_profile_id student_id,p.full_name student_name,p.institutional_id student_number,es.source_record_id,spr.title source_title,pc.code source_category,pc.name category_name,ps.code source_subcategory,ps.name subcategory_name,es.verification_status')
            ->join('profiles p','p.id=es.student_profile_id')->join('student_portfolio_records spr','spr.id=es.source_record_id')->join('portfolio_categories pc','pc.id=es.category_id')->join('portfolio_subcategories ps','ps.id=es.subcategory_id','left')
            ->where('es.event_id',$eventId)->whereIn('es.bridge_status',['CREATED','LINKED_EXISTING','UPDATED'])->where('es.source_record_id IS NOT NULL',null,false)
            ->orderBy('p.full_name')->get()->getResultArray();
    }

    private function resolveFact(array $event,array $fact,string $actorId): array
    {
        $reasons=[];
        if (($event['status']??'')!=='completed') $reasons[]='EVENT_NOT_FINALIZED';
        if (($fact['account_type']??'')!=='student') $reasons[]='INVALID_STUDENT_RECIPIENT';
        if (!(bool)$fact['attendance_verified']) $reasons[]='ATTENDANCE_NOT_VERIFIED';
        if (!(bool)$fact['facts_finalized']) $reasons[]='ROLE_NOT_FINALIZED';
        if (($fact['verification_status']??'')!=='verified') $reasons[]='SOURCE_RECORD_NOT_VERIFIED';
        $reasons=array_values(array_unique([...$reasons,...$this->mappers->validate($fact)]));
        if ($reasons) return $this->blocked($fact,$reasons,$actorId);

        $metadata=json_decode((string)($fact['structured_attributes']??'{}'),true) ?: [];
        $metadata=array_filter($metadata+['role'=>$fact['participation_role'],'verified_engagement_outcome'=>$fact['verified_engagement_outcome'],'placement'=>$fact['placement'],'origin_type'=>'event','origin_event_id'=>$fact['event_id'],'origin_event_participation_id'=>$fact['id'],'origin_created_by'=>$actorId,'origin_created_at'=>date('c')],fn($v)=>$v!==null&&$v!=='');
        $matches=$this->db->table('student_portfolio_records')->where('student_profile_id',$fact['student_profile_id'])->where("JSON_UNQUOTE(JSON_EXTRACT(structured_metadata, '$.origin_event_participation_id')) = ".$this->db->escape($fact['id']),null,false)->get()->getResultArray();
        if(!empty($fact['source_record_id'])) {
            $linked=$this->db->table('student_portfolio_records')->where('id',$fact['source_record_id'])->get()->getRowArray();
            if(!$linked || $linked['student_profile_id']!==$fact['student_profile_id'] || $linked['category_id']!==$fact['category_id'] || count($matches)!==1 || $matches[0]['id']!==$linked['id']) return $this->blocked($fact,['SOURCE_RECORD_CONFLICT'],$actorId);
            return $this->result($fact,'LINKED_EXISTING',$linked['id'],[]);
        }
        if (count($matches)>1) return $this->blocked($fact,['SOURCE_RECORD_CONFLICT'],$actorId);

        $this->db->transBegin();
        try {
            if (count($matches)===1) { $source=$matches[0]; $status='LINKED_EXISTING'; }
            else {
                $id=$this->uuid(); $now=date('Y-m-d H:i:s');
                $this->db->table('student_portfolio_records')->insert(['id'=>$id,'student_profile_id'=>$fact['student_profile_id'],'category_id'=>$fact['category_id'],'subcategory_id'=>$fact['subcategory_id'],'title'=>$event['title'],'organizer_or_body'=>$event['venue'],'occurrence_date'=>substr($event['start_time'],0,10),'start_date'=>substr($event['start_time'],0,10),'end_date'=>substr($event['end_time'],0,10),'description'=>'Verified event-derived student participation fact.','structured_metadata'=>json_encode($metadata),'status'=>'verified','submitted_at'=>$now,'verified_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
                $source=['id'=>$id]; $status='CREATED';
            }
            $this->db->table('event_student_source_records')->where('id',$fact['id'])->update(['source_record_id'=>$source['id'],'bridge_status'=>$status,'reason_codes'=>json_encode([])]);
            $this->audit($actorId,$status==='CREATED'?'SOURCE_RECORD_CREATED_FROM_EVENT':'SOURCE_RECORD_LINKED_EXISTING',$fact['id'],'success',['source_record_id'=>$source['id'],'event_id'=>$fact['event_id']]);
            $this->db->transCommit();
            return $this->result($fact,$status,$source['id'],[]);
        } catch(Throwable $e) { $this->db->transRollback(); throw $e; }
    }

    private function blocked(array $fact,array $reasons,string $actorId): array
    { $this->db->table('event_student_source_records')->where('id',$fact['id'])->update(['bridge_status'=>'BLOCKED','reason_codes'=>json_encode($reasons)]); $this->audit($actorId,'SOURCE_RECORD_BRIDGE_BLOCKED',$fact['id'],'failure',['reason_codes'=>$reasons]); return $this->result($fact,'BLOCKED',null,$reasons); }
    private function result(array $f,string $status,?string $source,array $reasons): array { return ['student_id'=>$f['student_profile_id'],'event_participation_id'=>$f['id'],'bridge_status'=>$status,'source_record_id'=>$source,'source_record_type'=>'student_achievement','source_category'=>$f['category_code'],'source_subcategory'=>$f['subcategory_code']??null,'verification_status'=>$f['verification_status'],'reason_codes'=>$reasons]; }
    private function facts(string $eventId) { return $this->db->table('event_student_source_records es')->select('es.*,p.account_type,pc.code category_code,ps.code subcategory_code')->join('profiles p','p.id=es.student_profile_id')->join('portfolio_categories pc','pc.id=es.category_id')->join('portfolio_subcategories ps','ps.id=es.subcategory_id','left')->where('es.event_id',$eventId); }
    private function audit(string $actor,string $code,string $target,string $outcome,array $context): void { $this->db->table('audit_logs')->insert(['id'=>$this->uuid(),'actor_profile_id'=>$actor,'event_code'=>$code,'category'=>'event_source_bridge','target_type'=>'event_participation','target_id'=>$target,'outcome'=>$outcome,'details'=>$code,'safe_context'=>json_encode($context),'created_at'=>date('Y-m-d H:i:s')]); }
    private function assertSchema(): void { if (!$this->db->tableExists('event_student_source_records')) throw new RuntimeException('EVENT_SOURCE_RECORD_BRIDGE_SCHEMA_MISSING'); }
    private function normalized(array $fact): array { return array_map(fn($v)=>strtolower(trim((string)$v)),['role'=>$fact['participation_role'],'outcome'=>$fact['verified_engagement_outcome'],'placement'=>$fact['placement']]); }
    private function uuid(): string { return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',random_int(0,0xffff),random_int(0,0xffff),random_int(0,0xffff),random_int(0,0x0fff)|0x4000,random_int(0,0x3fff)|0x8000,random_int(0,0xffff),random_int(0,0xffff),random_int(0,0xffff)); }
}
