<?php
namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\SvgWriter;
use InvalidArgumentException;
use RuntimeException;

/** Builds one immutable official print snapshot for an exact Phase O finalization. */
class OfficialEvaluationDocumentService
{
    public function __construct(private ?BaseConnection $db=null,private ?PersonnelEvaluationSummaryService $summaries=null){$this->db??=db_connect();$this->summaries??=new PersonnelEvaluationSummaryService();}

    public function generate(array $actor,string $hrReviewId):array
    {
        $this->assertPrintAccess($actor);$existing=$this->byReview($hrReviewId,false);if($existing)return$existing;
        $review=$this->db->table('personnel_hr_final_rank_reviews')->where('id',$hrReviewId)->get()->getRowArray();
        if(!$review)throw new InvalidArgumentException('HR_FINAL_RANK_REVIEW_NOT_FOUND');
        if($review['status']!=='finalized_ready_for_printing'||!in_array($review['action_type'],['accepted','adjusted'],true))throw new RuntimeException('EVALUATION_NOT_FINALIZED_READY_FOR_PRINTING');
        $evaluation=$this->db->table('personnel_evaluations')->where('id',$review['evaluation_id'])->get()->getRowArray();
        if(!$evaluation||(int)$evaluation['version_number']!==(int)$review['evaluation_version'])throw new RuntimeException('FINALIZED_EVALUATION_VERSION_MISMATCH');
        $recommended=$this->db->table('personnel_recommended_rank_decisions')->where('id',$review['recommended_rank_decision_id'])->get()->getRowArray();
        if(!$recommended||$recommended['evaluation_id']!==$evaluation['id']||$recommended['status']!=='confirmed')throw new RuntimeException('FINAL_RECOMMENDED_RANK_DECISION_INVALID');
        $applied=$this->db->table('personnel_rank_applied_for_decisions')->where('id',$recommended['rank_applied_for_decision_id'])->get()->getRowArray();
        if(!$applied||$applied['status']!=='confirmed')throw new RuntimeException('FINAL_RANK_APPLIED_FOR_MISSING');
        $track=$this->db->table('personnel_evaluation_periods')->where('id',$review['ranking_track_id'])->get()->getRowArray();$classification=strtoupper((string)($track['personnel_group']??$evaluation['personnel_group_snapshot']??''));
        if(!in_array($classification,['FACULTY','NON_TEACHING_FACULTY'],true))throw new RuntimeException('SUMMARY_CLASSIFICATION_UNRESOLVED');
        $items=$this->db->table('personnel_evaluation_items')->where('evaluation_id',$evaluation['id'])->get()->getResultArray();$criteria=is_string($evaluation['criteria_snapshot']??null)?json_decode($evaluation['criteria_snapshot'],true):($evaluation['criteria_snapshot']??[]);
        $evaluation['personnel_group_snapshot']=$classification;$evaluation['rank_applied_for']=$this->rankLabel($applied['confirmed_rank_code']);
        $summary=$this->summaries->build($evaluation,$items,$criteria,['total_score'=>(float)$evaluation['total_score']]);
        $summary['rank_applied_for']=$this->rankLabel($applied['confirmed_rank_code']);$summary['recommended_rank']=$this->rankLabel($review['hr_final_rank_code']);$summary['effectivity']=null;$summary['approvals']=$this->blankApprovals();unset($summary['unresolved_fields']['rank_applied_for'],$summary['unresolved_fields']['recommended_rank']);
        $id=$this->uuid();$reference='AN-EVAL-'.date('Y').'-'.strtoupper(str_replace('-','',$id));$qrPayload=rtrim((string)env('app.frontendUrl','http://localhost:5173'),'/').'/verify/evaluation/'.rawurlencode($reference);$generated=date('Y-m-d H:i:s');
        $summary['system_footer']=['evaluation_version'=>(int)$review['evaluation_version'],'generated_at'=>$generated,'reference_number'=>$reference,'qr_payload'=>$qrPayload];
        $rootId=(string)($evaluation['evaluation_root_id']??$evaluation['id']);$case=['personnel_profile_id'=>$review['personnel_profile_id'],'ranking_cycle_id'=>$review['ranking_cycle_id'],'ranking_track_id'=>$review['ranking_track_id'],'evaluation_root_id'=>$rootId,'classification'=>$classification,'document_type'=>'official_evaluation_summary'];$newer=$this->db->table('personnel_official_evaluation_documents')->select('id,evaluation_version')->where($case)->where('status','current')->where('evaluation_version >',(int)$review['evaluation_version'])->orderBy('evaluation_version','DESC')->get()->getRowArray();$row=['id'=>$id,'hr_final_rank_review_id'=>$hrReviewId]+$case+['evaluation_id'=>$evaluation['id'],'evaluation_version'=>$review['evaluation_version'],'final_rank_applied_for_code'=>$applied['confirmed_rank_code'],'final_recommended_rank_code'=>$review['hr_final_rank_code'],'reference_number'=>$reference,'qr_payload'=>$qrPayload,'summary_payload'=>json_encode($summary),'status'=>$newer?'superseded':'current','superseded_by_document_id'=>$newer['id']??null,'generated_by_profile_id'=>(string)$actor['profile']['id'],'generated_at'=>$generated];
        $this->db->transStart();$older=$this->db->table('personnel_official_evaluation_documents')->select('id,evaluation_version')->where($case)->where('status','current')->where('evaluation_version <',(int)$review['evaluation_version'])->get()->getResultArray();$this->db->table('personnel_official_evaluation_documents')->insert($row);if(!$newer)foreach($older as$old)$this->db->table('personnel_official_evaluation_documents')->where('id',$old['id'])->update(['status'=>'superseded','superseded_by_document_id'=>$id]);$this->db->transComplete();if(!$this->db->transStatus())throw new RuntimeException('OFFICIAL_DOCUMENT_GENERATION_FAILED');return$this->document($id);
    }

    public function get(array $actor,string $id):array{$this->assertPrintAccess($actor);return$this->document($id);}
    public function printableHtml(array $actor,string $id):string{$document=$this->get($actor,$id);$qr=(new SvgWriter())->write(new QrCode(data:$document['qr_payload'],size:110,margin:2))->getDataUri();return(new OfficialEvaluationSummaryHtmlRenderer())->render($document,$qr);}
    private function blankApprovals():array{return['effectivity'=>null,'chair'=>['name'=>null,'signature'=>null,'date'=>null],'members'=>[['name'=>null,'signature'=>null,'date'=>null]],'president'=>['name'=>null,'signature'=>null,'date'=>null],'approved'=>null];}
    private function rankLabel(string $code):string{$r=$this->db->table('faculty_rank_catalog')->select('display_label')->where('rank_code',$code)->get()->getRowArray();return(string)($r['display_label']??$code);}
    private function assertPrintAccess(array $actor):void{$roles=$actor['roles']??[$actor['role']??''];if(!array_intersect(['hr_staff','hr_admin'],$roles))throw new RuntimeException('OFFICIAL_PRINT_ACCESS_DENIED');}
    private function byReview(string $id,bool $throw=true):?array{$r=$this->db->table('personnel_official_evaluation_documents')->where('hr_final_rank_review_id',$id)->get()->getRowArray();if(!$r&&$throw)throw new InvalidArgumentException('OFFICIAL_EVALUATION_DOCUMENT_NOT_FOUND');return$r?$this->decode($r):null;}
    private function document(string $id):array{$r=$this->db->table('personnel_official_evaluation_documents')->where('id',$id)->get()->getRowArray();if(!$r)throw new InvalidArgumentException('OFFICIAL_EVALUATION_DOCUMENT_NOT_FOUND');return$this->decode($r);}
    private function decode(array $r):array{$r['summary_payload']=is_string($r['summary_payload'])?(json_decode($r['summary_payload'],true)?:[]):$r['summary_payload'];return$r;}
    private function uuid():string{$d=random_bytes(16);$d[6]=chr((ord($d[6])&15)|64);$d[8]=chr((ord($d[8])&63)|128);return vsprintf('%s%s-%s-%s-%s-%s%s%s',str_split(bin2hex($d),4));}
}
