<?php

namespace App\Commands;

use App\Services\PersonnelEligibilityService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

/** Transactional live-MySQL matrix; all controlled mutations are rolled back. */
class VerifyDeanAnnualReviewEligibilityLive extends BaseCommand
{
    protected $group='Verification';
    protected $name='verify:dean-annual-review-eligibility-live';
    protected $description='Verify Dean annual-rating and service eligibility rules against live MySQL without retaining fixture mutations.';

    public function run(array $params)
    {
        $db=db_connect(); if($db->DBDriver!=='MySQLi'||$db->getDatabase()!=='achievenest_local') throw new RuntimeException('Live eligibility verification is restricted to achievenest_local MySQL.');
        $personId='d0000000-0000-0000-0001-000000000009';
        $period=$db->table('personnel_evaluation_periods')->whereIn('status',['OPEN_FOR_SUBMISSION','SUBMISSION_CLOSED','EVALUATION_ONGOING'])->orderBy('evaluation_end_at','DESC')->get()->getRowArray();
        $affiliation=$db->table('personnel_college_affiliations')->where('personnel_profile_id',$personId)->where('is_active',1)->get()->getRowArray();
        $dean=$db->table('dean_assignments')->where('college_id',$affiliation['college_id'])->where('is_active',1)->get()->getRowArray();
        if(!$period||!$affiliation||!$dean) throw new RuntimeException('Required existing demo scope is unavailable.');
        $service=new PersonnelEligibilityService($db); $cutoff=substr($period['evaluation_end_at'],0,10); $now=date('Y-m-d H:i:s');
        $db->transBegin();
        try {
            $db->table('personnel_annual_reviews')->where('personnel_profile_id',$personId)->where('evaluation_period_id',$period['id'])->delete();
            $db->table('personnel_profiles')->where('profile_id',$personId)->update(['employment_status'=>'permanent','employment_start_date'=>date('Y-m-d',strtotime($cutoff.' -5 years'))]);
            foreach(['outstanding'=>'eligible','very_satisfactory'=>'eligible','satisfactory'=>'eligible','fair'=>'not_eligible','poor'=>'not_eligible'] as $rating=>$expected){
                $db->table('personnel_annual_reviews')->where('id','accept-live-rating')->delete();
                $db->table('personnel_annual_reviews')->insert(['id'=>'accept-live-rating','personnel_profile_id'=>$personId,'evaluation_cycle_id'=>$period['academic_year'],'evaluation_period_id'=>$period['id'],'college_id'=>$affiliation['college_id'],'review_period_label'=>'Transactional live acceptance','decision'=>null,'annual_rating'=>$rating,'review_status'=>'finalized','finalized_at'=>$now,'recorded_by_dean_id'=>$dean['personnel_profile_id'],'recorded_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
                $actual=$service->evaluateEligibility($personId,$period['id'])['eligibility_status']; $this->assertCase("permanent_{$rating}",$expected,$actual);
            }
            $db->table('personnel_annual_reviews')->where('id','accept-live-rating')->update(['annual_rating'=>'satisfactory','updated_at'=>$now]);
            $db->table('personnel_profiles')->where('profile_id',$personId)->update(['employment_status'=>'probationary','employment_start_date'=>date('Y-m-d',strtotime($cutoff.' -2 years -11 months'))]);
            $this->assertCase('probationary_under_3','not_eligible',$service->evaluateEligibility($personId,$period['id'])['eligibility_status']);
            $db->table('personnel_profiles')->where('profile_id',$personId)->update(['employment_start_date'=>date('Y-m-d',strtotime($cutoff.' -3 years'))]);
            $this->assertCase('probationary_exactly_3','eligible',$service->evaluateEligibility($personId,$period['id'])['eligibility_status']);
            $db->table('personnel_profiles')->where('profile_id',$personId)->update(['employment_start_date'=>null]);
            $this->assertCase('missing_start_date','pending',$service->evaluateEligibility($personId,$period['id'])['eligibility_status']);
            $db->table('personnel_profiles')->where('profile_id',$personId)->update(['employment_status'=>'permanent','employment_start_date'=>date('Y-m-d',strtotime($cutoff.' -5 years'))]);
            $db->table('personnel_annual_reviews')->where('id','accept-live-rating')->delete();
            $this->assertCase('missing_finalized_review','pending',$service->evaluateEligibility($personId,$period['id'])['eligibility_status']);
        } finally { $db->transRollback(); }
        CLI::write('LIVE_ELIGIBILITY_MATRIX=PASS fixtures_rolled_back=YES','green');
    }
    private function assertCase(string $case,string $expected,string $actual): void { if($actual!==$expected) throw new RuntimeException("{$case}: expected {$expected}, got {$actual}"); CLI::write("{$case}=PASS ({$actual})",'green'); }
}
