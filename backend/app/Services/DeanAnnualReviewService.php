<?php

namespace App\Services;

use CodeIgniter\Database\BaseConnection;
use InvalidArgumentException;
use RuntimeException;

/** Manual Dean annual-rating workflow; legacy binary decisions remain read-only. */
class DeanAnnualReviewService
{
    public function __construct(protected ?BaseConnection $db=null, protected ?PersonnelEligibilityService $eligibilityService=null, protected ?OrganizationalAuthorityResolver $authorityResolver=null)
    {
        $this->db ??= db_connect();
        $this->eligibilityService ??= new PersonnelEligibilityService($this->db);
        $this->authorityResolver ??= new OrganizationalAuthorityResolver($this->db);
    }

    private function uuid(): string { return sprintf('%04x%04x-%04x-4%03x-%04x-%04x%04x%04x',random_int(0,65535),random_int(0,65535),random_int(0,65535),random_int(0,4095),random_int(32768,49151),random_int(0,65535),random_int(0,65535),random_int(0,65535)); }

    public function getDeanAssignedCollege(string $deanId): ?string
    {
        $row=$this->db->table('dean_assignments')->select('college_id')->where('personnel_profile_id',$deanId)->where('is_active',1)->get()->getRowArray();
        return $row['college_id']??null;
    }

    public function validateDeanAuthorization(string $deanId,string $personId): array
    {
        $authority=$this->authorityResolver->resolveResponsibleAuthority($personId);
        if(($authority['authority_type']??'')!=='DEAN'||!$this->authorityResolver->actorMayAct($authority,$deanId)) throw new RuntimeException('FORBIDDEN: Caller is not the responsible organizational authority for this personnel member.');
        $collegeId=$authority['scope_id'];
        $person=$this->db->table('personnel_profiles pp')->select('p.id,p.full_name,p.institutional_id,p.email AS institutional_email,p.avatar_url,pp.personnel_group,pp.organizational_side,pp.faculty_engagement,pp.employment_status,pp.employment_start_date,pp.position_title,pp.current_rank_title,COALESCE(pca.college_id,au.college_id) AS college_id,c.name AS college_name,c.code AS college_code')
            ->join('profiles p','p.id=pp.profile_id')->join('personnel_college_affiliations pca','pca.personnel_profile_id=pp.profile_id AND pca.is_active=1','left')->join('personnel_administrative_unit_affiliations pau','pau.personnel_profile_id=pp.profile_id AND pau.is_active=1','left')->join('administrative_units au','au.id=pau.administrative_unit_id AND au.status=\'active\'','left')
            ->join('colleges c','c.id=COALESCE(pca.college_id,au.college_id)','left')->where('pp.profile_id',$personId)->where('p.status','active')->groupStart()->where('pca.college_id',$collegeId)->orWhere('au.college_id',$collegeId)->groupEnd()->get()->getRowArray();
        if(!$person) throw new RuntimeException('FORBIDDEN: Personnel member is outside the Dean assigned college.');
        return ['dean_college_id'=>$collegeId,'personnel'=>$person];
    }

    private function period(array $payload): array
    {
        $ref=trim((string)($payload['evaluation_period_id']??$payload['evaluation_cycle_id']??''));
        if($ref!=='') {
            $p=$this->db->table('personnel_evaluation_periods')->groupStart()->where('id',$ref)->orWhere('academic_year',$ref)->orWhere('period_code',$ref)->groupEnd()->orderBy('evaluation_end_at','DESC')->get()->getRowArray();
        } else {
            $p=$this->db->table('personnel_evaluation_periods')->whereIn('status',['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'])->orderBy('evaluation_end_at','DESC')->get()->getRowArray();
            $p ??= $this->db->table('personnel_evaluation_periods')->whereIn('status',['CLOSED','ARCHIVED'])->orderBy('evaluation_end_at','DESC')->get()->getRowArray();
        }
        if(!$p) throw new InvalidArgumentException('VALIDATION_ERROR: Evaluation period was not found.');
        return $p;
    }

    private function assertOpen(array $period): void
    {
        if(in_array($period['status']??'', ['CLOSED','ARCHIVED'],true)) throw new RuntimeException('EVALUATION_PERIOD_LOCKED: This evaluation period is closed and remains read-only.');
    }

    private function rating(array $payload,bool $required=false): ?string
    {
        $rating=strtolower(trim((string)($payload['annual_rating']??'')));
        if($rating===''&&!$required) return null;
        if(!in_array($rating,PersonnelEligibilityService::RATINGS,true)) throw new InvalidArgumentException('INVALID_ANNUAL_RATING: Select a valid annual rating.');
        return $rating;
    }

    public function recordReview(string $deanId,array $payload): array
    {
        $personId=(string)($payload['personnel_profile_id']??'');
        if($personId==='') throw new InvalidArgumentException('VALIDATION_ERROR: personnel_profile_id is required.');
        $period=$this->period($payload); $this->assertOpen($period);
        $auth=$this->validateDeanAuthorization($deanId,$personId);
        $status=strtolower((string)($payload['review_status']??'draft'));
        if(!in_array($status,['draft','finalized'],true)) throw new InvalidArgumentException('INVALID_REVIEW_STATUS: review_status must be draft or finalized.');
        $rating=$this->rating($payload,$status==='finalized');
        $existing=$this->db->table('personnel_annual_reviews')->where('personnel_profile_id',$personId)->where('evaluation_period_id',$period['id'])->where('superseded_at',null)->orderBy('created_at','DESC')->get()->getRowArray();
        if($existing&&empty($existing['annual_rating'])) throw new RuntimeException('LEGACY_REVIEW_READ_ONLY: Legacy binary annual-review records are historical and cannot be changed.');
        if($existing&&($existing['review_status']??null)==='finalized') throw new RuntimeException('ANNUAL_REVIEW_ALREADY_FINALIZED: Use supersession to correct a finalized annual review.');
        $now=date('Y-m-d H:i:s');
        $values=['annual_rating'=>$rating,'review_status'=>$status,'finalized_at'=>$status==='finalized'?$now:null,'updated_at'=>$now];
        if($existing){ $this->db->table('personnel_annual_reviews')->where('id',$existing['id'])->update($values); $id=$existing['id']; $event=$status==='finalized'?'annual_review_finalized':'annual_review_draft_updated'; }
        else { $id=$this->uuid(); $this->db->table('personnel_annual_reviews')->insert($values+[
            'id'=>$id,'personnel_profile_id'=>$personId,'evaluation_period_id'=>$period['id'],'evaluation_cycle_id'=>$period['academic_year'],'college_id'=>$auth['dean_college_id'],
            'review_period_label'=>$period['period_name'],'decision'=>null,'decision_reason'=>null,'recorded_by_dean_id'=>$deanId,'recorded_at'=>$now,'created_at'=>$now
        ]); $event=$status==='finalized'?'annual_review_finalized':'annual_review_draft_created'; }
        $this->audit($event,$deanId,['review_id'=>$id,'personnel_profile_id'=>$personId,'evaluation_period_id'=>$period['id'],'annual_rating'=>$rating]);
        return $this->getReviewById($id);
    }

    public function supersedeReview(string $reviewId,string $deanId,array $payload): array
    {
        $old=$this->getReviewById($reviewId);
        if(!empty($old['superseded_at'])) throw new RuntimeException('INVALID_REVIEW_TRANSITION: This review was already superseded.');
        if(empty($old['annual_rating'])) throw new RuntimeException('LEGACY_REVIEW_READ_ONLY: Legacy binary annual-review records cannot be superseded into ratings.');
        if(($old['review_status']??'')!=='finalized') throw new RuntimeException('INVALID_REVIEW_TRANSITION: Only finalized reviews use supersession.');
        $period=$this->period(['evaluation_period_id'=>$old['evaluation_period_id']]); $this->assertOpen($period);
        $auth=$this->validateDeanAuthorization($deanId,$old['personnel_profile_id']);
        $reason=trim((string)($payload['correction_reason']??''));
        if($reason==='') throw new InvalidArgumentException('CORRECTION_REASON_REQUIRED: Explain why this finalized review must be corrected.');
        $submission=$this->db->table('personnel_evaluations')->select('id')->where('personnel_profile_id',$old['personnel_profile_id'])->where('evaluation_period_id',$period['id'])->where('submitted_at !=',null)->get()->getRowArray();
        if($submission) throw new RuntimeException('HR_REOPENING_REQUIRED: The portfolio was already submitted. HR-authorized reopening is required before correction.');
        $rating=$this->rating($payload,true); $now=date('Y-m-d H:i:s'); $newId=$this->uuid();
        $this->db->transStart();
        $this->db->table('personnel_annual_reviews')->where('id',$reviewId)->update(['review_status'=>'superseded','superseded_at'=>$now,'superseded_by_dean_id'=>$deanId,'updated_at'=>$now]);
        $this->db->table('personnel_annual_reviews')->insert(['id'=>$newId,'personnel_profile_id'=>$old['personnel_profile_id'],'evaluation_period_id'=>$period['id'],'evaluation_cycle_id'=>$period['academic_year'],'college_id'=>$auth['dean_college_id'],'review_period_label'=>$period['period_name'],'decision'=>null,'decision_reason'=>null,'annual_rating'=>$rating,'review_status'=>'finalized','finalized_at'=>$now,'correction_reason'=>$reason,'recorded_by_dean_id'=>$deanId,'recorded_at'=>$now,'supersedes_review_id'=>$reviewId,'created_at'=>$now,'updated_at'=>$now]);
        $this->db->transComplete();
        if(!$this->db->transStatus()) throw new RuntimeException('DATABASE_ERROR: Annual review supersession failed.');
        $this->audit('annual_review_superseded',$deanId,['prior_review_id'=>$reviewId,'new_review_id'=>$newId,'personnel_profile_id'=>$old['personnel_profile_id'],'evaluation_period_id'=>$period['id'],'correction_reason'=>$reason]);
        return $this->getReviewById($newId);
    }

    public function listForDean(string $deanId,array $filters=[]): array
    {
        $college=$this->getDeanAssignedCollege($deanId); if(!$college) throw new RuntimeException('FORBIDDEN: Caller is not an active assigned College Dean.');
        $period=$this->period($filters);
        $rows=$this->db->table('personnel_profiles pp')->distinct()->select('p.id,p.full_name,p.institutional_id,p.email AS institutional_email,p.avatar_url,pp.personnel_group,pp.organizational_side,pp.faculty_engagement,pp.employment_status,pp.employment_start_date,pp.position_title,pp.current_rank_title,c.name AS college_name,c.code AS college_code')
            ->join('profiles p','p.id=pp.profile_id')->join('personnel_college_affiliations pca','pca.personnel_profile_id=pp.profile_id AND pca.is_active=1','left')->join('personnel_administrative_unit_affiliations pau','pau.personnel_profile_id=pp.profile_id AND pau.is_active=1','left')->join('administrative_units au','au.id=pau.administrative_unit_id AND au.status=\'active\'','left')->join('colleges c','c.id=COALESCE(pca.college_id,au.college_id)','left')
            ->groupStart()->where('pca.college_id',$college)->orWhere('au.college_id',$college)->groupEnd()->where('p.status','active')->where('p.id !=',$deanId)->orderBy('p.full_name')->get()->getResultArray();
        $items=[];
        foreach($rows as $person){
            try { $authority=$this->authorityResolver->resolveResponsibleAuthority($person['id'],$period); }
            catch (RuntimeException) { continue; }
            if(($authority['authority_type']??'')!=='DEAN'||($authority['authority_profile_id']??'')!==$deanId) continue;
            $review=$this->db->table('personnel_annual_reviews')->where('personnel_profile_id',$person['id'])->where('evaluation_period_id',$period['id'])->where('superseded_at',null)->orderBy('created_at','DESC')->get()->getRowArray();
            $count=$this->db->table('personnel_annual_reviews')->where('personnel_profile_id',$person['id'])->where('evaluation_period_id',$period['id'])->where('superseded_at !=',null)->countAllResults();
            $items[]=['personnel'=>$person,'evaluation_period_id'=>$period['id'],'annual_review'=>$review,'superseded_count'=>$count,'eligibility'=>$this->eligibilityService->evaluateEligibility($person['id'],$period['id'])];
        }
        return ['evaluation_period_id'=>$period['id'],'evaluation_cycle_id'=>$period['academic_year'],'evaluation_period'=>['id'=>$period['id'],'name'=>$period['period_name'],'status'=>$period['status'],'evaluation_end_at'=>$period['evaluation_end_at'],'is_locked'=>in_array($period['status'],['CLOSED','ARCHIVED'],true)],'college_id'=>$college,'total_personnel'=>count($items),'personnel'=>$items];
    }

    public function getReviewById(string $id): array
    {
        $row=$this->db->table('personnel_annual_reviews')->where('id',$id)->get()->getRowArray();
        if(!$row) throw new RuntimeException('NOT_FOUND: Annual review record not found.');
        return $row;
    }

    private function audit(string $type,string $actor,array $meta): void
    {
        try{$this->db->table('account_lifecycle_events')->insert(['id'=>$this->uuid(),'account_id'=>$meta['personnel_profile_id']??$actor,'event_type'=>$type,'performed_by'=>$actor,'reason'=>json_encode($meta),'occurred_at'=>date('Y-m-d H:i:s'),'created_at'=>date('Y-m-d H:i:s')]);}catch(\Throwable $e){}
    }
}
