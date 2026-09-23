<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

/** Creates one explicit closed-period fixture required for Dean lock acceptance. */
class PrepareDeanAnnualReviewAcceptanceFixture extends BaseCommand
{
    protected $group='Verification';
    protected $name='verify:prepare-dean-annual-review-closed-period';
    protected $description='Create the single closed evaluation-period fixture used by live Dean annual-review acceptance.';

    public function run(array $params)
    {
        $db=db_connect();
        if($db->DBDriver!=='MySQLi'||$db->getDatabase()!=='achievenest_local') throw new RuntimeException('Acceptance fixture is restricted to achievenest_local MySQL.');
        $id='acceptance-closed-period-2026-09';
        $periodExists=$db->table('personnel_evaluation_periods')->where('id',$id)->countAllResults()>0;
        $source=$db->table('personnel_evaluation_periods')->orderBy('created_at','DESC')->get()->getRowArray();
        if(!$source) throw new RuntimeException('An existing evaluation period is required as the safe scale/actor reference.');
        if(!$periodExists) $db->table('personnel_evaluation_periods')->insert([
            'id'=>$id,'period_code'=>'ACCEPT-CLOSED-2026-09','period_name'=>'Acceptance Fixture — Closed Annual Review','evaluation_type'=>'TENURE_EVALUATION','personnel_group'=>$source['personnel_group']??'FACULTY','academic_year'=>'2024-2025','semester'=>'FULL_ACADEMIC_YEAR','coverage_label'=>'Acceptance-only closed-period lock fixture',
            'submission_open_at'=>'2024-06-01 00:00:00','submission_close_at'=>'2025-03-31 23:59:59','evaluation_start_at'=>'2025-04-01 00:00:00','evaluation_end_at'=>'2025-05-31 23:59:59','status'=>'CLOSED','version'=>1,
            'evaluation_scale_version_id'=>$source['evaluation_scale_version_id'],'created_by'=>$source['created_by'],'created_at'=>date('Y-m-d H:i:s'),'closed_by'=>$source['created_by'],'closed_at'=>date('Y-m-d H:i:s')
        ]);
        CLI::write(($periodExists?'CLOSED_PERIOD_FIXTURE_ALREADY_PRESENT':'CLOSED_PERIOD_FIXTURE_CREATED').' id='.$id,$periodExists?'yellow':'green');
        $personId='d0000000-0000-0000-0001-000000000009'; $reviewId='acceptance-closed-review-2026-09';
        if(!$db->table('personnel_annual_reviews')->where('id',$reviewId)->countAllResults()){
            $affiliation=$db->table('personnel_college_affiliations')->where('personnel_profile_id',$personId)->where('is_active',1)->get()->getRowArray();
            $dean=$db->table('dean_assignments')->where('college_id',$affiliation['college_id'])->where('is_active',1)->get()->getRowArray(); $now=date('Y-m-d H:i:s');
            $db->table('personnel_annual_reviews')->insert(['id'=>$reviewId,'personnel_profile_id'=>$personId,'evaluation_cycle_id'=>'2024-2025','evaluation_period_id'=>$id,'college_id'=>$affiliation['college_id'],'review_period_label'=>'Acceptance Fixture — Closed Annual Review','decision'=>null,'annual_rating'=>'satisfactory','review_status'=>'finalized','finalized_at'=>$now,'recorded_by_dean_id'=>$dean['personnel_profile_id'],'recorded_at'=>$now,'created_at'=>$now,'updated_at'=>$now]);
            CLI::write('CLOSED_REVIEW_FIXTURE_CREATED id='.$reviewId,'green');
        }
        $submittedDemoId='d0000000-0000-0000-0001-000000000003';
        $submittedDemo=$db->table('personnel_profiles')->select('employment_start_date')->where('profile_id',$submittedDemoId)->get()->getRowArray();
        if($submittedDemo && empty($submittedDemo['employment_start_date'])) {
            $db->table('personnel_profiles')->where('profile_id',$submittedDemoId)->update(['employment_start_date'=>'2020-06-01']);
            CLI::write('SUBMITTED_DEMO_SERVICE_FIXTURE_UPDATED profile_id='.$submittedDemoId,'green');
        }
    }
}
