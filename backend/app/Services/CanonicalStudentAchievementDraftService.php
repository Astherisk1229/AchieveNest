<?php

namespace App\Services;
/*
 * PARKED (2026-09-30): student_portfolio_records is the single system of record for student
 * achievements in this release. This canonical lifecycle is retained but no UI calls it.
 * See docs/IMPLEMENTATION_PROMPT_STUDENT_ACHIEVEMENT_WORKFLOW.md (section 0) before reusing it.
 */

use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

final class CanonicalStudentAchievementDraftService
{
    public function __construct(private ?BaseConnection $db = null, private ?CanonicalStudentAchievementService $contracts = null, private ?StudentAchievementRoutingService $routing = null)
    { $this->db ??= db_connect(); $this->contracts ??= new CanonicalStudentAchievementService($this->db); $this->routing ??= new StudentAchievementRoutingService($this->db); }

    public function create(string $owner): array
    {
        $record = $this->uuid(); $version = $this->uuid(); $now = date('Y-m-d H:i:s.u'); $this->db->transBegin();
        try {
            $this->db->table('achievement_records')->insert(['id'=>$record,'owner_profile_id'=>$owner,'owner_domain'=>'STUDENT','current_version_id'=>null,'canonical_status'=>'active','created_by_profile_id'=>$owner,'created_at'=>$now,'updated_at'=>$now]);
            $this->db->table('achievement_record_versions')->insert(['id'=>$version,'achievement_record_id'=>$record,'version_number'=>1,'previous_version_id'=>null,'contract_code'=>null,'submission_state'=>'draft','source_type'=>'OWNER_ENTRY','created_by_profile_id'=>$owner,'revision_token'=>1,'created_at'=>$now]);
            $this->db->table('achievement_records')->where('id',$record)->where('owner_profile_id',$owner)->where('owner_domain','STUDENT')->where('current_version_id',null)->update(['current_version_id'=>$version]); $this->commit();
        } catch (Throwable $e) { $this->db->transRollback(); throw $e; }
        return $this->read($owner, $record);
    }
    public function read(string $owner, string $record): array
    {
        $v=$this->version($owner,$record); $fields=[]; foreach($this->db->table('achievement_version_draft_fields')->where('record_version_id',$v['id'])->get()->getResultArray() as $r) $fields[$r['field_key']]=json_decode($r['field_value'],true);
        $evidence=$this->db->table('achievement_version_evidence ave')->select('e.id,e.original_filename,e.mime_type,e.detected_mime_type,e.byte_size,e.security_status,e.status')->join('achievement_evidence e','e.id=ave.evidence_id')->where('ave.record_version_id',$v['id'])->get()->getResultArray();
        return ['achievement_record_id'=>$record,'version'=>$v,'draft_fields'=>$fields,'evidence'=>$evidence];
    }
    public function save(string $owner,string $record,?string $contract,array $fields): array
    {
        $v=$this->editable($owner,$record); $contract=$contract===null?null:strtoupper(trim($contract)); if($contract==='')$contract=null;
        if($contract===null&&$fields!==[])throw new RuntimeException('STUDENT_ACHIEVEMENT_CONTRACT_REQUIRED_FOR_FIELDS');
        if($contract!==null){$this->contracts->resolveContract($contract);if(($v['contract_code']??null)!==null&&$v['contract_code']!==$contract)throw new RuntimeException('STUDENT_ACHIEVEMENT_CONTRACT_CHANGE_REQUIRES_NEW_DRAFT');$allowed=array_flip($this->contracts->allowedDetailFields($contract));foreach($fields as $key=>$value)if(!is_string($key)||!isset($allowed[$key])||(!is_scalar($value)&&$value!==null))throw new RuntimeException('STUDENT_ACHIEVEMENT_DRAFT_FIELD_NOT_ALLOWED');}
        $ownedVersion = fn () => $this->db->table('achievement_records')
            ->select('current_version_id')->where('id', $record)
            ->where('owner_profile_id', $owner)->where('owner_domain', 'STUDENT')
            ->where('canonical_status', 'active');
        $this->db->transBegin();
        try {
            if ($contract !== null) {
                $this->db->table('achievement_record_versions')
                    ->where('id', $v['id'])->where('achievement_record_id', $record)
                    ->whereIn('id', $ownedVersion())->update(['contract_code' => $contract]);
            }
            foreach ($fields as $key => $value) {
                $exists = $this->db->table('achievement_version_draft_fields')
                    ->where('record_version_id', $v['id'])->where('field_key', $key)
                    ->whereIn('record_version_id', $ownedVersion())->countAllResults();
                $data = ['field_value' => json_encode($value, JSON_THROW_ON_ERROR), 'updated_by_profile_id' => $owner];
                if ($exists) {
                    // Counts reset query-builder predicates. Always build the update afresh.
                    $this->db->table('achievement_version_draft_fields')
                        ->where('record_version_id', $v['id'])->where('field_key', $key)
                        ->whereIn('record_version_id', $ownedVersion())->update($data);
                } else {
                    $this->db->table('achievement_version_draft_fields')
                        ->insert(['record_version_id' => $v['id'], 'field_key' => $key] + $data);
                }
            }
            $this->commit();
        } catch (Throwable $e) {
            $this->db->transRollback();
            throw $e;
        }
        return $this->read($owner, $record);
    }
    public function submit(string $owner,string $record): array
    {
        $v=$this->editable($owner,$record);$contract=trim((string)$v['contract_code']);if($contract==='')throw new RuntimeException('STUDENT_ACHIEVEMENT_CONTRACT_REQUIRED');$values=[];foreach($this->db->table('achievement_version_draft_fields')->where('record_version_id',$v['id'])->get()->getResultArray() as $r)$values[$r['field_key']]=json_decode($r['field_value'],true,512,JSON_THROW_ON_ERROR);$detail=$this->contracts->normalizeDetailPayload($contract,$values);if($this->db->table('achievement_version_evidence ave')->join('achievement_evidence e','e.id=ave.evidence_id')->where('ave.record_version_id',$v['id'])->where('e.status','active')->where('e.security_status','clean')->countAllResults()<1)throw new RuntimeException('STUDENT_ACHIEVEMENT_CLEAN_EVIDENCE_REQUIRED');$table=$this->contracts->detailTableForContract($contract);$this->db->table($table)->insert(['record_version_id'=>$v['id']]+$detail);return $this->routing->routeSubmittedVersion($v['id'],$owner);
    }
    /** Returns only evidence attached to the owner's current canonical version. */
    public function evidence(string $owner, string $record, string $evidenceId): array
    {
        $version = $this->version($owner, $record);
        $evidence = $this->db->table('achievement_version_evidence ave')
            ->select('e.*')
            ->join('achievement_evidence e', 'e.id=ave.evidence_id')
            ->where('ave.record_version_id', $version['id'])
            ->where('ave.evidence_id', $evidenceId)
            ->get()
            ->getRowArray();
        if ($evidence === null) throw new RuntimeException('STUDENT_ACHIEVEMENT_EVIDENCE_NOT_FOUND');
        return ['version' => $version, 'evidence' => $evidence];
    }
    /** Detaches draft evidence without destroying the protected evidence record or file. */
    public function detachEvidence(string $owner, string $record, string $evidenceId): array
    {
        $version = $this->editable($owner, $record);
        $attached = $this->db->table('achievement_version_evidence')
            ->where('record_version_id', $version['id'])
            ->where('evidence_id', $evidenceId)
            ->countAllResults();
        if ($attached !== 1) throw new RuntimeException('STUDENT_ACHIEVEMENT_EVIDENCE_NOT_FOUND');
        $this->db->table('achievement_version_evidence')
            ->where('record_version_id', $version['id'])
            ->where('evidence_id', $evidenceId)
            ->delete();
        return $this->read($owner, $record);
    }
    private function version(string $owner,string $record):array{$r=$this->db->table('achievement_records ar')->select('arv.*')->join('achievement_record_versions arv','arv.id=ar.current_version_id')->where('ar.id',$record)->where('ar.owner_domain','STUDENT')->where('ar.owner_profile_id',$owner)->where('ar.canonical_status','active')->get()->getRowArray();if(!$r)throw new RuntimeException('STUDENT_ACHIEVEMENT_NOT_FOUND');return$r;}
    private function editable(string $owner,string $record):array{$v=$this->version($owner,$record);if(!in_array($v['submission_state'],['draft','revision_requested'],true))throw new RuntimeException('STUDENT_ACHIEVEMENT_VERSION_NOT_EDITABLE');return$v;}
    private function commit():void{if(!$this->db->transStatus())throw new RuntimeException('STUDENT_ACHIEVEMENT_TRANSACTION_FAILED');$this->db->transCommit();}
    private function uuid():string{return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',random_int(0,65535),random_int(0,65535),random_int(0,4095)|0x4000,random_int(0,16383)|0x8000,random_int(0,65535),random_int(0,65535),random_int(0,65535),random_int(0,65535));}
}
