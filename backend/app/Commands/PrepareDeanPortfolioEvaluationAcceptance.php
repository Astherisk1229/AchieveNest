<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

/** Isolated live-MySQL fixture for authenticated Dean evaluation acceptance. */
class PrepareDeanPortfolioEvaluationAcceptance extends BaseCommand
{
    protected $group = 'Verification';
    protected $name = 'verify:dean-portfolio-evaluation-acceptance';
    protected $description = 'Prepare, inspect, or clean the isolated Dean portfolio evaluation acceptance fixture.';

    private const EVALUATION = 'a1700000-0000-4000-8000-000000000001';
    private const ITEM_APPROVE = 'a1700000-0000-4000-8000-000000000002';
    private const ITEM_REJECT = 'a1700000-0000-4000-8000-000000000003';
    private const PERSON = 'a1700000-0000-4000-8000-000000000010';
    private const SOURCE_PERSON = 'd0000000-0000-0000-0001-000000000008';
    private const AFFILIATION = 'a1700000-0000-4000-8000-000000000011';
    private const DEAN = 'd0000000-0000-0000-0001-000000000007';

    public function run(array $params)
    {
        $db = db_connect();
        if ($db->DBDriver !== 'MySQLi' || $db->getDatabase() !== 'achievenest_local') throw new RuntimeException('Restricted to achievenest_local MySQL.');
        match ($params[0] ?? 'prepare') {
            'prepare' => $this->prepare($db),
            'inspect' => $this->inspect($db),
            'clear-evaluation' => $this->clearEvaluation($db),
            'period-evaluation' => $this->setPeriodStatus($db, 'EVALUATION_ONGOING'),
            'period-open' => $this->setPeriodStatus($db, 'OPEN_FOR_SUBMISSION'),
            'period-restore' => $this->restorePeriod($db),
            'cleanup' => $this->cleanup($db),
            default => throw new RuntimeException('Mode must be prepare, inspect, or cleanup.'),
        };
    }

    private function prepare($db): void
    {
        $this->cleanup($db, false);
        $profile = $db->table('profiles')->where('id', self::SOURCE_PERSON)->get()->getRowArray();
        $personnel = $db->table('personnel_profiles')->where('profile_id', self::SOURCE_PERSON)->get()->getRowArray();
        $affiliation = $db->table('personnel_college_affiliations')->where('personnel_profile_id', self::SOURCE_PERSON)->where('is_active', 1)->get()->getRowArray();
        if (!$profile || !$personnel || !$affiliation) throw new RuntimeException('Controlled faculty profile source is unavailable.');
        $profile['id'] = self::PERSON;
        $profile['full_name'] = 'Acceptance Faculty Portfolio 2026';
        $profile['institutional_id'] = 'ACCEPT-FAC-2026';
        $profile['email'] = 'acceptance.faculty.portfolio.2026@ndmu.edu.ph';
        $profile['password_hash'] = password_hash((string) env('ACHIEVENEST_DEMO_PASSWORD'), PASSWORD_DEFAULT);
        unset($profile['active_hr_guard']);
        $db->table('profiles')->insert($profile);
        $db->table('local_auth_credentials')->insert(['profile_id'=>self::PERSON,'password_hash'=>password_hash((string) env('ACHIEVENEST_DEMO_PASSWORD'), PASSWORD_DEFAULT),'must_change_password'=>0,'status'=>'active','created_at'=>date('Y-m-d H:i:s'),'updated_at'=>date('Y-m-d H:i:s')]);
        foreach ($db->table('profile_roles')->where('profile_id', self::SOURCE_PERSON)->where('is_active', 1)->get()->getResultArray() as $index => $role) {
            $role['id'] = sprintf('a1700000-0000-4000-8000-%012d', 20 + $index);
            $role['profile_id'] = self::PERSON;
            $db->table('profile_roles')->insert($role);
        }
        $personnel['profile_id'] = self::PERSON;
        $personnel['employment_status'] = 'permanent';
        $personnel['employment_start_date'] = '2020-06-01';
        $db->table('personnel_profiles')->insert($personnel);
        $affiliation['id'] = self::AFFILIATION;
        $affiliation['personnel_profile_id'] = self::PERSON;
        unset($affiliation['active_personnel_guard']);
        $db->table('personnel_college_affiliations')->insert($affiliation);
        $sources = $db->table('personnel_accomplishments pa')->select('pa.*')->join('personnel_accomplishment_evidence pae','pae.accomplishment_id=pa.id AND pae.status="active"')->where('pa.category_code !=', '')->orderBy('pa.created_at','DESC')->limit(2)->get()->getResultArray();
        if (count($sources) < 2) throw new RuntimeException('Two mapped accomplishments with evidence are required.');
        foreach ($sources as $index => $sourceAccomplishment) {
            $sourceId = $sourceAccomplishment['id'];
            $sourceEvidence = $db->table('personnel_accomplishment_evidence')->where('accomplishment_id',$sourceId)->where('status','active')->get()->getRowArray();
            $sourceAccomplishment['id'] = sprintf('a1700000-0000-4000-8000-%012d', 30 + $index);
            $sourceAccomplishment['personnel_profile_id'] = self::PERSON;
            $sourceAccomplishment['title'] = $index === 0 ? 'Controlled faculty scholarship achievement' : 'Controlled faculty service achievement';
            $db->table('personnel_accomplishments')->insert($sourceAccomplishment);
            $sourceEvidence['id'] = sprintf('a1700000-0000-4000-8000-%012d', 40 + $index);
            $sourceEvidence['accomplishment_id'] = $sourceAccomplishment['id'];
            $sourceEvidence['uploaded_by'] = self::PERSON;
            $db->table('personnel_accomplishment_evidence')->insert($sourceEvidence);
        }
        $period = $db->table('personnel_evaluation_periods')->where('status','OPEN_FOR_SUBMISSION')->orderBy('created_at','DESC')->get()->getRowArray();
        $sourceImport = $period ? $db->table('personnel_annual_review_imports')->orderBy('created_at','DESC')->get()->getRowArray() : null;
        if ($sourceImport) {
            $sourceImport['id'] = 'a1700000-0000-4000-8000-000000000050';
            $sourceImport['personnel_profile_id'] = self::PERSON;
            $sourceImport['evaluation_period_id'] = $period['id'];
            $sourceImport['review_1_rating'] = 'Outstanding';
            $sourceImport['review_2_rating'] = 'Outstanding';
            $sourceImport['two_review_status'] = 'passed';
            $sourceImport['two_review_reason'] = null;
            $sourceImport['confirmed_at'] = date('Y-m-d H:i:s');
            $sourceImport['superseded_at'] = null;
            $sourceImport['file_hash'] = hash('sha256', self::PERSON.$period['id']);
            $db->table('personnel_annual_review_imports')->insert($sourceImport);
        }
        $source = $db->table('personnel_evaluations')->where('id', '718c431f-c78c-4777-8222-e4acdf73afdd')->get()->getRowArray();
        $sourceItem = $db->table('personnel_evaluation_items')->where('evaluation_id', $source['id'] ?? '')->get()->getRowArray();
        $accomplishments = $db->table('personnel_accomplishments')->select('id')->orderBy('created_at', 'DESC')->limit(2)->get()->getResultArray();
        if (!$source || !$sourceItem || count($accomplishments) < 2) throw new RuntimeException('Canonical source shape is unavailable.');
        $now = date('Y-m-d H:i:s');
        $criteria = ['version'=>['id'=>$source['evaluation_scale_version_id'],'version_label'=>'Acceptance locked criteria','passing_score'=>10], 'categories'=>[]];
        $evaluation = $source;
        foreach (['finalized_at','returned_at','return_reason','final_snapshot'] as $field) if (array_key_exists($field, $evaluation)) $evaluation[$field] = null;
        $evaluation = array_merge($evaluation, ['id'=>self::EVALUATION,'personnel_profile_id'=>self::PERSON,'evaluator_profile_id'=>self::DEAN,'originating_evaluator_profile_id'=>self::DEAN,'evaluation_period_id'=>null,'academic_year'=>'','status'=>'submitted','version_number'=>1,'previous_version_id'=>null,'criteria_snapshot'=>json_encode($criteria),'eligibility_snapshot'=>json_encode(['eligibility_status'=>'eligible','eligibility_reasons'=>[]]),'submitted_at'=>$now,'evaluation_started_at'=>null,'total_score'=>0,'area_a_score'=>0,'area_b_score'=>0,'area_c_score'=>0,'created_at'=>$now,'updated_at'=>$now]);
        $db->table('personnel_evaluations')->insert($evaluation);
        foreach ([[self::ITEM_APPROVE,'Acceptance scholarship evidence',10,1],[self::ITEM_REJECT,'Acceptance service evidence',5,2]] as [$id,$description,$points,$order]) {
            $item = $sourceItem;
            foreach (['evaluated_by','evaluated_at','rejection_reason','evaluator_remarks'] as $field) if (array_key_exists($field, $item)) $item[$field] = null;
            $item = array_merge($item,['id'=>$id,'evaluation_id'=>self::EVALUATION,'accomplishment_id'=>$accomplishments[$order-1]['id'],'item_description'=>$description,'criterion_code'=>'A.1','criterion_key'=>'A.1-acceptance-'.$order,'criterion_title'=>'Acceptance locked criterion','criterion_version_id'=>$source['evaluation_scale_version_id'],'criterion_snapshot'=>json_encode(['category'=>['code'=>'A.1','area'=>'A','max_points'=>20,'area_max_points'=>70],'criterion_cap'=>20]),'configured_points_snapshot'=>$points,'portfolio_section'=>'academic_development','submission_order'=>$order,'verification_status'=>'pending','rating_status'=>'unrated','awarded_points'=>0,'created_at'=>$now,'updated_at'=>$now]);
            $db->table('personnel_evaluation_items')->insert($item);
        }
        CLI::write('DEAN_EVALUATION_ACCEPTANCE_READY id='.self::EVALUATION, 'green');
    }

    private function inspect($db): void
    {
        $evaluations = $db->table('personnel_evaluations')->where('personnel_profile_id', self::PERSON)->orderBy('version_number')->get()->getResultArray();
        $result = [];
        foreach ($evaluations as $evaluation) {
            $items = $db->table('personnel_evaluation_items')->where('evaluation_id', $evaluation['id'])->orderBy('submission_order')->get()->getResultArray();
            $events = $db->table('personnel_evaluation_events')->where('evaluation_id', $evaluation['id'])->countAllResults();
            $report = $db->table('personnel_evaluation_reports')->where('evaluation_id', $evaluation['id'])->get()->getRowArray();
            $result[] = [
                'id'=>$evaluation['id'], 'version'=>(int) $evaluation['version_number'], 'previous_version_id'=>$evaluation['previous_version_id']??null,
                'status'=>$evaluation['status'], 'criteria_snapshot'=>!empty($evaluation['criteria_snapshot']), 'criteria_version_id'=>$evaluation['evaluation_scale_version_id']??null,
                'items'=>array_map(fn($i)=>['order'=>(int)($i['submission_order']??0),'criterion_key'=>$i['criterion_key']??null,'criterion_version_id'=>$i['criterion_version_id']??null,'configured_points'=>(float)($i['configured_points_snapshot']??0),'evidence_count'=>count(json_decode((string)($i['evidence_snapshot']??'[]'),true)?:[]),'status'=>$i['verification_status'],'rating'=>$i['rating_status'],'points'=>(float)$i['awarded_points'],'reason'=>$i['rejection_reason']],$items),
                'events'=>$events, 'report'=>isset($report['report_payload']) ? json_decode($report['report_payload'],true) : null,
            ];
        }
        CLI::write(json_encode($result, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT));
    }

    private function cleanup($db, bool $announce = true): void
    {
        $this->clearEvaluation($db, false);
        $db->table('personnel_annual_review_imports')->where('personnel_profile_id', self::PERSON)->delete();
        $accomplishmentIds = array_column($db->table('personnel_accomplishments')->select('id')->where('personnel_profile_id',self::PERSON)->get()->getResultArray(),'id');
        if ($accomplishmentIds) $db->table('personnel_accomplishment_evidence')->whereIn('accomplishment_id',$accomplishmentIds)->delete();
        $db->table('personnel_accomplishments')->where('personnel_profile_id',self::PERSON)->delete();
        $db->table('personnel_college_affiliations')->where('id', self::AFFILIATION)->delete();
        $db->table('personnel_profiles')->where('profile_id', self::PERSON)->delete();
        $db->table('profile_roles')->where('profile_id', self::PERSON)->delete();
        $db->table('local_auth_credentials')->where('profile_id', self::PERSON)->delete();
        $db->table('profiles')->where('id', self::PERSON)->delete();
        $backupPath = WRITEPATH . 'dean-portfolio-acceptance-period.json';
        if (is_file($backupPath)) $this->restorePeriod($db);
        if ($announce) CLI::write('DEAN_EVALUATION_ACCEPTANCE_CLEANED', 'green');
    }

    private function clearEvaluation($db, bool $announce = true): void
    {
        $ids = array_column($db->table('personnel_evaluations')->select('id')->where('personnel_profile_id',self::PERSON)->get()->getResultArray(),'id');
        foreach ($ids as $id) foreach (['personnel_evaluation_reports','personnel_evaluation_events','personnel_evaluation_items'] as $table) $db->table($table)->where('evaluation_id',$id)->delete();
        if ($db->tableExists('personnel_evaluation_idempotency')) $db->table('personnel_evaluation_idempotency')->where('actor_profile_id',self::PERSON)->delete();
        $db->table('personnel_evaluations')->where('personnel_profile_id',self::PERSON)->delete();
        if ($db->tableExists('personnel_evaluation_roots')) $db->table('personnel_evaluation_roots')->where('personnel_profile_id',self::PERSON)->delete();
        if ($announce) CLI::write('DEAN_EVALUATION_ACCEPTANCE_HEADER_CLEARED', 'green');
    }

    private function setPeriodStatus($db, string $status): void
    {
        $id = 'd198ba23-1571-4c5d-98e2-f57d50eee79d';
        $period = $db->table('personnel_evaluation_periods')->where('id', $id)->get()->getRowArray();
        if (! $period) throw new RuntimeException('Acceptance evaluation period is unavailable.');
        $backupPath = WRITEPATH . 'dean-portfolio-acceptance-period.json';
        if (! is_file($backupPath)) {
            file_put_contents($backupPath, json_encode([
                'status' => $period['status'],
                'submission_open_at' => $period['submission_open_at'],
                'submission_close_at' => $period['submission_close_at'],
                'evaluation_start_at' => $period['evaluation_start_at'],
                'evaluation_end_at' => $period['evaluation_end_at'],
            ], JSON_THROW_ON_ERROR));
        }
        $update = ['status'=>$status,'updated_at'=>date('Y-m-d H:i:s')];
        if ($status === 'OPEN_FOR_SUBMISSION') {
            $update += ['submission_open_at'=>date('Y-m-d H:i:s', time()-3600),'submission_close_at'=>date('Y-m-d H:i:s', time()+86400),'evaluation_start_at'=>date('Y-m-d H:i:s', time()+86400),'evaluation_end_at'=>date('Y-m-d H:i:s', time()+172800)];
        }
        $db->table('personnel_evaluation_periods')->where('id',$id)->update($update);
        CLI::write("DEAN_EVALUATION_ACCEPTANCE_PERIOD={$status}", 'green');
    }

    private function restorePeriod($db): void
    {
        $id = 'd198ba23-1571-4c5d-98e2-f57d50eee79d';
        $backupPath = WRITEPATH . 'dean-portfolio-acceptance-period.json';
        if (! is_file($backupPath)) throw new RuntimeException('Acceptance period backup is unavailable.');
        $backup = json_decode((string) file_get_contents($backupPath), true, 512, JSON_THROW_ON_ERROR);
        $backup['updated_at'] = date('Y-m-d H:i:s');
        $db->table('personnel_evaluation_periods')->where('id', $id)->update($backup);
        unlink($backupPath);
        CLI::write('DEAN_EVALUATION_ACCEPTANCE_PERIOD_RESTORED', 'green');
    }
}
