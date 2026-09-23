<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

final class CertificateIssuanceService
{
    public function __construct(
        private ?CertificateEligibilityService $eligibility=null,
        private ?CertificateDataResolver $dataResolver=null,
        private ?CertificateIssuanceReadinessService $readiness=null,
        private ?CertificateIdentityService $identity=null,
        private ?CertificateSnapshotBuilder $snapshotBuilder=null,
        private ?CertificateSignatoryResolverService $signatoryResolver=null,
        private ?BaseConnection $db=null,
    ) {
        $this->eligibility ??= new CertificateEligibilityService();
        $this->dataResolver ??= new CertificateDataResolver();
        $this->readiness ??= new CertificateIssuanceReadinessService();
        $this->identity ??= new CertificateIdentityService();
        $this->snapshotBuilder ??= new CertificateSnapshotBuilder();
        $this->signatoryResolver ??= new CertificateSignatoryResolverService();
        $this->db ??= db_connect();
    }

    public function issue(array $actor, array $request): array
    {
        $actorId=(string)($actor['profile']['id'] ?? '');
        $key=trim((string)($request['idempotency_key'] ?? ''));
        if($actorId==='') throw new RuntimeException('UNAUTHORIZED_CERTIFICATE_ISSUANCE');
        if($key==='' || strlen($key)>120) throw new RuntimeException('IDEMPOTENCY_KEY_REQUIRED');
        foreach(['certificate_issuances','certificate_issuance_snapshots','certificate_idempotency','certificate_number_sequences'] as $table) if(!$this->db->tableExists($table)) throw new RuntimeException('CERTIFICATE_ISSUANCE_SCHEMA_MISSING');

        $hash=hash('sha256',json_encode($this->canonical($request),JSON_UNESCAPED_SLASHES));
        $existing=$this->db->table('certificate_idempotency')->where(['actor_profile_id'=>$actorId,'idempotency_key'=>$key])->get()->getRowArray();
        if($existing) return $this->replay($existing,$hash);

        $this->db->transBegin();
        try {
            $this->write($this->db->table('certificate_idempotency')->insert(['id'=>$this->identity->uuid(),'actor_profile_id'=>$actorId,'idempotency_key'=>$key,'request_hash'=>$hash,'response_json'=>null]));
            $this->audit($actorId,'CERTIFICATE_ISSUANCE_REQUESTED','student_portfolio_record',(string)($request['source_record_id']??''),'success',['idempotency_key_hash'=>hash('sha256',$key)]);
            $source=$this->source((string)($request['source_record_id'] ?? ''));
            if(!$source) throw new RuntimeException('SOURCE_RECORD_NOT_FOUND');
            $student=$this->db->table('profiles')->where('id',$source['student_profile_id'])->get()->getRowArray();
            if(!$student || ($student['account_type'] ?? '')!=='student') throw new RuntimeException('RECIPIENT_MUST_BE_STUDENT');
            if(!empty($request['student_id']) && $request['student_id']!==$student['id']) throw new RuntimeException('RECIPIENT_CONTEXT_MISMATCH');
            if(!$this->authorized($actor,$source)) throw new RuntimeException('UNAUTHORIZED_CERTIFICATE_ISSUANCE');

            $eligibility=$this->eligibility->resolve($source+['structured_attributes'=>json_decode($source['structured_metadata'] ?? '{}',true) ?: []]);
            if(!empty($request['certificate_purpose']) && $request['certificate_purpose']!==($eligibility['eligible_purpose']??null)) throw new RuntimeException('CERTIFICATE_PURPOSE_MISMATCH');
            $template=$this->template((string)($request['template_version_id'] ?? ''));
            $signatoryResolution=$template ? $this->signatoryResolver->resolve($this->db,$template,(array)($request['signatories']??[])) : ['signatories'=>[],'reason_codes'=>[]];
            $data=$this->dataResolver->resolve($source,$student,(string)($eligibility['eligible_purpose']??''),['name'=>'Notre Dame of Marbel University / OSAD']);

            $current=$this->currentCertificate($student['id'],$source['id'],(string)($eligibility['eligible_purpose']??''));
            if($current){
                $response=['status'=>'ALREADY_ISSUED','issued'=>false,'certificate'=>$this->certificateReadModel($current),'readiness'=>['status'=>'ELIGIBLE_NOT_ISSUABLE','certificate_purpose'=>$current['certificate_purpose'],'blocking_reasons'=>['CURRENT_CERTIFICATE_ALREADY_EXISTS']]];
                $this->finishIdempotency($actorId,$key,$response);
                $this->audit($actorId,'DUPLICATE_ISSUANCE_PREVENTED','certificate_issuance',$current['id'],'denied',['source_record_id'=>$source['id']]);
                $this->commit(); return $response;
            }

            $ready=$this->readiness->evaluate($eligibility,$template,$data,$signatoryResolution['signatories'],false);
            $ready['blocking_reasons']=array_values(array_unique([...$ready['blocking_reasons'],...$signatoryResolution['reason_codes']]));
            if($ready['blocking_reasons']!==[]) $ready['status']=$eligibility['eligibility_status']==='ELIGIBLE'?'ELIGIBLE_NOT_ISSUABLE':'NOT_ELIGIBLE';
            if($ready['status']!=='ISSUABLE'){
                $response=['status'=>'BLOCKED','code'=>'READINESS_CHANGED','issued'=>false,'readiness'=>$ready];
                $this->finishIdempotency($actorId,$key,$response);
                $this->audit($actorId,'CERTIFICATE_ISSUANCE_BLOCKED','student_portfolio_record',$source['id'],'denied',['reason_codes'=>$ready['blocking_reasons']]);
                $this->commit(); return $response;
            }

            $year=(int)date('Y');
            $this->db->query('INSERT IGNORE INTO certificate_number_sequences (issue_year,next_value) VALUES (?,1)',[$year]);
            $sequenceRow=$this->db->query('SELECT next_value FROM certificate_number_sequences WHERE issue_year=? FOR UPDATE',[$year])->getRowArray();
            $sequence=(int)($sequenceRow['next_value']??0);
            if($sequence<1) throw new RuntimeException('CERTIFICATE_SEQUENCE_UNAVAILABLE');
            $this->write($this->db->table('certificate_number_sequences')->where('issue_year',$year)->update(['next_value'=>$sequence+1]));

            $id=$this->identity->uuid(); $number=$this->identity->number($sequence,$year); $public=$this->identity->publicId(); $issuedAt=date('Y-m-d H:i:s'); $verificationUrl='/verify/certificate/'.$public;
            $data+=['issued_date'=>substr($issuedAt,0,10),'certificate_number'=>$number,'verification_url'=>$verificationUrl];
            $identity=['id'=>$id,'certificate_number'=>$number,'public_verification_id'=>$public,'verification_url'=>$verificationUrl,'issued_at'=>$issuedAt];
            $snapshot=$this->snapshotBuilder->build($identity,$student,$source,(string)$eligibility['eligible_purpose'],$data,$template,$signatoryResolution['signatories']);
            $this->write($this->db->table('certificate_issuances')->insert(['id'=>$id,'certificate_number'=>$number,'public_verification_id'=>$public,'student_id'=>$student['id'],'source_record_type'=>'student_portfolio_record','source_record_id'=>$source['id'],'certificate_purpose'=>$eligibility['eligible_purpose'],'template_family_id'=>$template['template_family_id'],'template_version_id'=>$template['id'],'status'=>'ISSUED','issued_by'=>$actorId,'issued_at'=>$issuedAt]));
            $this->write($this->db->table('certificate_issuance_snapshots')->insert(['id'=>$this->identity->uuid(),'certificate_issuance_id'=>$id,'snapshot_json'=>json_encode($snapshot,JSON_UNESCAPED_SLASHES)]));
            $response=['status'=>'ISSUED','issued'=>true,'certificate'=>$identity+['certificate_purpose'=>$eligibility['eligible_purpose'],'student_id'=>$student['id'],'source_record_id'=>$source['id'],'template_version_id'=>$template['id'],'status'=>'ISSUED'],'readiness'=>$ready];
            $this->finishIdempotency($actorId,$key,$response);
            $this->audit($actorId,'CERTIFICATE_ISSUED','certificate_issuance',$id,'success',['student_id'=>$student['id'],'source_record_id'=>$source['id'],'certificate_purpose'=>$eligibility['eligible_purpose']]);
            $this->commit(); return $response;
        } catch(Throwable $e) {
            $this->db->transRollback();
            $this->db->resetTransStatus();
            if($this->isDuplicate($e)){
                $existing=$this->db->table('certificate_idempotency')->where(['actor_profile_id'=>$actorId,'idempotency_key'=>$key])->get()->getRowArray();
                if($existing) return $this->replay($existing,$hash);
            }
            if(in_array($e->getMessage(),['UNAUTHORIZED_CERTIFICATE_ISSUANCE','RECIPIENT_MUST_BE_STUDENT'],true)) $this->safeBlockedAudit($actorId,$e->getMessage(),$request);
            throw $e;
        }
    }

    public function verify(string $publicId): ?array
    {
        $row=$this->db->table('certificate_issuances ci')->select('ci.*,cis.snapshot_json')->join('certificate_issuance_snapshots cis','cis.certificate_issuance_id=ci.id')->where('ci.public_verification_id',$publicId)->get()->getRowArray();
        if(!$row)return null; $snapshot=json_decode($row['snapshot_json'],true)?:[];
        return ['status'=>$row['status'],'certificate_number'=>$row['certificate_number'],'recipient_name'=>$snapshot['recipient']['name']??null,'certificate_purpose'=>$row['certificate_purpose'],'title'=>$snapshot['source_record']['title']??null,'issued_at'=>$row['issued_at'],'issuer_name'=>$snapshot['organizer_and_issuer']['issuer_name']??null,'replacement_available'=>!empty($row['superseded_by_certificate_id'])];
    }

    private function source(string $id): ?array { return $this->db->table('student_portfolio_records spr')->select('spr.*,pc.code category_code,pc.name category_name,ps.code subcategory_code')->join('portfolio_categories pc','pc.id=spr.category_id')->join('portfolio_subcategories ps','ps.id=spr.subcategory_id','left')->where('spr.id',$id)->get()->getRowArray(); }
    private function template(string $id): ?array { $row=$this->db->table('certificate_template_versions ctv')->select('ctv.*,ctf.id template_family_id,ctf.certificate_purpose,ctf.status family_status')->join('certificate_template_families ctf','ctf.id=ctv.family_id')->where('ctv.id',$id)->where('ctv.status','active')->where('ctf.status','active')->get()->getRowArray(); if($row){$row['placeholder_contract']=json_decode($row['placeholder_contract_json']??'[]',true)?:[];$row['signatory_slots']=json_decode($row['signatory_slots_json']??'[]',true)?:[];$row['status']='PUBLISHED';} return $row; }
    private function currentCertificate(string $student,string $source,string $purpose): ?array { if($purpose==='')return null; return $this->db->table('certificate_issuances')->where(['student_id'=>$student,'source_record_type'=>'student_portfolio_record','source_record_id'=>$source,'certificate_purpose'=>$purpose,'status'=>'ISSUED'])->get()->getRowArray(); }
    private function authorized(array $actor,array $source): bool { if(in_array('osad_staff',$actor['roles']??[],true))return true; if(!in_array('organization_moderator',$actor['roles']??[],true))return false; $meta=json_decode($source['structured_metadata']??'{}',true)?:[]; $eventId=(string)($meta['origin_event_id']??''); if($eventId==='')return false; $event=$this->db->table('events')->select('organization_id')->where('id',$eventId)->get()->getRowArray(); if(!$event||empty($event['organization_id']))return false; $actorId=(string)($actor['profile']['id']??''); return $this->db->table('organization_moderator_assignments')->where(['personnel_profile_id'=>$actorId,'organization_id'=>$event['organization_id'],'is_active'=>1])->groupStart()->where('effective_until IS NULL',null,false)->orWhere('effective_until >=',date('Y-m-d'))->groupEnd()->where('effective_from <=',date('Y-m-d'))->countAllResults()>0; }
    private function certificateReadModel(array $row): array { return ['id'=>$row['id'],'certificate_number'=>$row['certificate_number'],'public_verification_id'=>$row['public_verification_id'],'verification_url'=>'/verify/certificate/'.$row['public_verification_id'],'certificate_purpose'=>$row['certificate_purpose'],'issued_at'=>$row['issued_at'],'student_id'=>$row['student_id'],'source_record_id'=>$row['source_record_id'],'template_version_id'=>$row['template_version_id'],'status'=>$row['status']]; }
    private function finishIdempotency(string $actor,string $key,array $response): void { $this->write($this->db->table('certificate_idempotency')->where(['actor_profile_id'=>$actor,'idempotency_key'=>$key])->update(['response_json'=>json_encode($response,JSON_UNESCAPED_SLASHES)])); }
    private function replay(array $row,string $hash): array { if(!hash_equals((string)$row['request_hash'],$hash))throw new RuntimeException('IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST'); if(empty($row['response_json']))throw new RuntimeException('IDEMPOTENCY_REQUEST_IN_PROGRESS'); return json_decode($row['response_json'],true)?:throw new RuntimeException('IDEMPOTENCY_RESPONSE_INVALID'); }
    private function commit(): void { if($this->db->transStatus()===false)throw new RuntimeException('ISSUANCE_TRANSACTION_FAILED');$this->db->transCommit(); }
    private function audit(string $actor,string $code,string $targetType,string $targetId,string $outcome,array $context): void { $this->write($this->db->table('audit_logs')->insert(['id'=>$this->identity->uuid(),'actor_profile_id'=>$actor,'event_code'=>$code,'category'=>'certificate_issuance','target_type'=>$targetType,'target_id'=>$targetId,'outcome'=>$outcome,'details'=>$code,'safe_context'=>json_encode($context,JSON_UNESCAPED_SLASHES),'created_at'=>date('Y-m-d H:i:s')])); }
    private function safeBlockedAudit(string $actor,string $reason,array $request): void { try{$this->audit($actor,'CERTIFICATE_ISSUANCE_BLOCKED','student_portfolio_record',(string)($request['source_record_id']??''),'denied',['reason_code'=>$reason]);}catch(Throwable){} }
    private function isDuplicate(Throwable $e): bool { return str_contains(strtolower($e->getMessage()),'duplicate') || (string)$e->getCode()==='1062'; }
    private function write(bool $succeeded): void { if(!$succeeded)throw new RuntimeException('ISSUANCE_TRANSACTION_FAILED'); }
    private function canonical(array $value): array { unset($value['idempotency_key']); foreach($value as &$item)if(is_array($item))$item=$this->canonical($item); ksort($value); return $value; }
}
