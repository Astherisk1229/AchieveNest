<?php
namespace App\Services;
use CodeIgniter\Database\BaseConnection;

/** Public projection: deliberately excludes document payloads and all internal identifiers. */
class PublicOfficialEvaluationVerificationService
{
    public function __construct(private ?BaseConnection $db=null){$this->db??=db_connect();}
    public function verify(string $reference):?array
    {
        $reference=trim($reference);if($reference===''||!preg_match('/^AN-EVAL-\d{4}-[A-F0-9]{32}$/',$reference))return null;
        $row=$this->db->table('personnel_official_evaluation_documents d')->select('d.reference_number,d.document_type,d.generated_at,d.status,d.evaluation_version,p.full_name,c.cycle_name')->join('profiles p','p.id=d.personnel_profile_id')->join('ranking_cycles c','c.id=d.ranking_cycle_id')->where('d.reference_number',$reference)->get()->getRowArray();
        if(!$row)return null;
        return['system_reference_number'=>$row['reference_number'],'personnel_name'=>$row['full_name'],'ranking_cycle'=>$row['cycle_name'],'document_type'=>$row['document_type'],'generated_at'=>$row['generated_at'],'verification_status'=>$row['status']==='current'?'Current / Valid':'Superseded','evaluation_version'=>(int)$row['evaluation_version']];
    }
}
