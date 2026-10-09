<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalTokenService;
use App\Services\PersonnelEvaluationCriteriaRecalculationService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use Config\Database;

/** Exercises the real routed criteria API using only an in-memory SQLite database. */
final class EvaluationCriteriaApiHttpProofTest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected $db;
    private bool $transactionOpen = false;

    protected function setUp(): void
    {
        parent::setUp();
        $config = new Database();
        $config->default = $config->tests;
        $config->default['DBPrefix'] = '';
        $config->tests['DBPrefix'] = '';
        $config->defaultGroup = 'tests';
        Database::enableTestIsolation();
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
        $this->db = Database::connect('tests');
        $instances = new \ReflectionProperty(Database::class, 'instances');
        $instances->setAccessible(true);
        $connections = $instances->getValue();
        $connections['default'] = $this->db;
        $connections['tests'] = $this->db;
        $instances->setValue(null, $connections);
        $this->createSchema();
        $this->seedFixture();
        $this->db->transBegin();
        $this->transactionOpen = true;
    }

    protected function tearDown(): void
    {
        if ($this->transactionOpen) {
            $this->db->transRollback();
            $this->transactionOpen = false;
        }
        parent::tearDown();
    }

    public function testHrApiLifecycleAuthorizationArchiveRestoreAndRollback(): void
    {
        $tokenService = new LocalTokenService($this->db);
        $hrToken = $tokenService->issueToken('hr-fixture', false, '127.0.0.1', 'criteria-api-test')['access_token'];
        $otherToken = $tokenService->issueToken('personnel-fixture', false, '127.0.0.1', 'criteria-api-test')['access_token'];

        $this->db->table('personnel_evaluation_periods')->insert(['id'=>'period-activation','evaluation_scale_version_id'=>'source-v1','personnel_group'=>'FACULTY','status'=>'EVALUATION_ONGOING']);
        $this->db->table('personnel_evaluations')->insert(['id'=>'eval-activation','personnel_profile_id'=>'personnel-fixture','evaluation_period_id'=>'period-activation','evaluation_scale_version_id'=>'source-v1','personnel_group_snapshot'=>'FACULTY','status'=>'in_evaluation','version_number'=>1,'finalized_at'=>null,'final_snapshot'=>null]);

        self::assertSame(401, $this->request('GET', 'api/v1/admin/evaluation-scales')->response()->getStatusCode());
        self::assertSame(403, $this->request('POST', 'api/v1/admin/evaluation-scales/versions/source-v1/clone', [
            'version_number' => 'DENIED', 'change_reason' => 'Non HR role denial proof',
        ], $otherToken)->response()->getStatusCode());

        $list = $this->request('GET', 'api/v1/admin/evaluation-scales', null, $hrToken);
        self::assertSame(200, $list->response()->getStatusCode(), $list->getBody());
        self::assertCount(1, $this->body($list)['data'] ?? [], $list->getBody());

        $hierarchy = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/source-v1', null, $hrToken);
        self::assertSame(200, $hierarchy->response()->getStatusCode(), $hierarchy->getBody());
        self::assertSame('AREA', $this->body($hierarchy)['data']['areas'][0]['area_code']);

        $sourceHistoryCount = $this->db->table('evaluation_scale_change_events')->where('scale_version_id', 'source-v1')->countAllResults();
        $clone = $this->request('POST', 'api/v1/admin/evaluation-scales/versions/source-v1/clone', [
            'version_number' => 'API-' . bin2hex(random_bytes(3)),
            'effective_start_date' => '2026-10-09',
            'change_reason' => 'Authenticated criteria API lifecycle proof',
            'change_summary' => 'Disposable API test draft.',
        ], $hrToken);
        self::assertSame(201, $clone->response()->getStatusCode(), $clone->getBody());
        $draftId = $this->body($clone)['data']['version_id'];

        $draftResponse = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/' . $draftId, null, $hrToken);
        self::assertSame(200, $draftResponse->response()->getStatusCode(), $draftResponse->getBody());
        $areas = $this->body($draftResponse)['data']['areas'];
        $areas[0]['is_active'] = 0;
        $archive = $this->request('PUT', 'api/v1/admin/evaluation-scales/versions/' . $draftId, [
            'areas' => $areas, 'change_reason' => 'Archive Area for API proof',
        ], $hrToken);
        self::assertSame(200, $archive->response()->getStatusCode(), $archive->getBody());
        $archived = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/' . $draftId, null, $hrToken);
        self::assertSame(0, (int) $this->body($archived)['data']['areas'][0]['is_active']);

        $areas = $this->body($archived)['data']['areas'];
        $areas[0]['is_active'] = 1;
        $restore = $this->request('PUT', 'api/v1/admin/evaluation-scales/versions/' . $draftId, [
            'areas' => $areas, 'change_reason' => 'Restore Area for API proof',
        ], $hrToken);
        self::assertSame(200, $restore->response()->getStatusCode(), $restore->getBody());
        $restored = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/' . $draftId, null, $hrToken);
        self::assertSame(1, (int) $this->body($restored)['data']['areas'][0]['is_active']);

        $validation = $this->request('POST', 'api/v1/admin/evaluation-scales/versions/' . $draftId . '/validate', [], $hrToken);
        self::assertSame(200, $validation->response()->getStatusCode(), $validation->getBody());
        self::assertSame('READY_TO_PUBLISH', $this->body($validation)['data']['status']);

        $publish = $this->request('POST', 'api/v1/admin/evaluation-scales/' . $draftId . '/approve', [
            'reason' => 'Authenticated API publish proof',
        ], $hrToken);
        self::assertSame(200, $publish->response()->getStatusCode(), $publish->getBody());
        self::assertSame('approved', $this->body($publish)['data']['status']);
        self::assertSame(1, $this->body($publish)['data']['activation_work']['queued_evaluation_count']);
        self::assertSame($draftId, $this->db->table('personnel_evaluation_periods')->select('evaluation_scale_version_id')->where('id','period-activation')->get()->getRowArray()['evaluation_scale_version_id']);
        self::assertSame($draftId, $this->db->table('personnel_evaluations')->select('evaluation_scale_version_id')->where('id','eval-activation')->get()->getRowArray()['evaluation_scale_version_id']);
        self::assertSame('pending', $this->db->table('evaluation_criteria_recalculation_jobs')->select('status')->where('evaluation_id','eval-activation')->get()->getRowArray()['status']);
        $jobId = $this->db->table('evaluation_criteria_recalculation_jobs')->select('id')->where('evaluation_id','eval-activation')->get()->getRowArray()['id'];
        $workerResult = (new PersonnelEvaluationCriteriaRecalculationService($this->db))->processJob($jobId);
        self::assertSame('completed', $workerResult['status']);
        self::assertSame('completed', $this->db->table('evaluation_criteria_recalculation_jobs')->select('status')->where('id',$jobId)->get()->getRowArray()['status']);
        self::assertNotEmpty($this->db->table('personnel_evaluations')->select('criteria_snapshot')->where('id','eval-activation')->get()->getRowArray()['criteria_snapshot']);
        $jobStatus = $this->request('GET','api/v1/admin/evaluation-criteria/recalculations/evaluations/eval-activation',null,$hrToken);
        self::assertSame(200,$jobStatus->response()->getStatusCode(),$jobStatus->getBody());
        self::assertTrue($this->body($jobStatus)['data']['scores_current']);

        $history = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/' . $draftId . '/history', null, $hrToken);
        self::assertSame(200, $history->response()->getStatusCode(), $history->getBody());
        self::assertNotEmpty($this->body($history)['data']);
        self::assertSame('approved', $this->db->table('evaluation_scale_versions')->select('status')->where('id', $draftId)->get()->getRowArray()['status']);

        $this->db->transRollback();
        $this->transactionOpen = false;
        self::assertSame(0, $this->db->table('evaluation_scale_versions')->where('id', $draftId)->countAllResults());
        self::assertSame('approved', $this->db->table('evaluation_scale_versions')->select('status')->where('id', 'source-v1')->get()->getRowArray()['status']);
        self::assertSame($sourceHistoryCount, $this->db->table('evaluation_scale_change_events')->where('scale_version_id', 'source-v1')->countAllResults());
        self::assertSame(0, $this->db->table('evaluation_scale_change_events')->where('scale_version_id', $draftId)->countAllResults());
        self::assertSame(0, $this->db->table('evaluation_criteria_recalculation_jobs')->countAllResults());
    }

    public function testImpactPreviewCountsOnlyMatchingNonfinalizedEvaluationsAndBlocksPublish(): void
    {
        $tokenService = new LocalTokenService($this->db);
        $hrToken = $tokenService->issueToken('hr-fixture', false, '127.0.0.1', 'criteria-impact-test')['access_token'];
        $otherToken = $tokenService->issueToken('personnel-fixture', false, '127.0.0.1', 'criteria-impact-test')['access_token'];

        self::assertSame(401, $this->request('GET', 'api/v1/admin/evaluation-scales/versions/draft-impact/impact-preview')->response()->getStatusCode());
        self::assertSame(403, $this->request('GET', 'api/v1/admin/evaluation-scales/versions/draft-impact/impact-preview', null, $otherToken)->response()->getStatusCode());

        $this->db->table('evaluation_scale_versions')->insert(['id'=>'draft-impact','scale_id'=>'scale-1','version_number'=>'2','evaluation_cycle_id'=>'2026-2027','status'=>'draft','total_max_points'=>100,'passing_score'=>70,'effective_start_date'=>'2026-10-09','change_reason'=>'Impact preview criteria change verification','change_summary'=>'A meaningful change for the impact preview test.','created_at'=>'2026-10-09 00:00:00','updated_at'=>'2026-10-09 00:00:00']);
        $this->db->table('evaluation_scale_areas')->insert(['id'=>'area-impact','scale_version_id'=>'draft-impact','area_code'=>'AREA','name'=>'Changed Area','display_order'=>1,'max_points'=>100,'entry_policy'=>'personnel_entry_allowed','created_at'=>'2026-10-09 00:00:00','updated_at'=>'2026-10-09 00:00:00','is_active'=>1]);
        $this->db->table('evaluation_scale_categories')->insert(['id'=>'category-impact','scale_area_id'=>'area-impact','category_code'=>'CAT','name'=>'Test Category','display_order'=>1,'max_points'=>100,'scoring_mode'=>'FIXED','requires_manual_hr_rule'=>0,'intake_active'=>0,'intake_mode'=>'FORM','created_at'=>'2026-10-09 00:00:00','updated_at'=>'2026-10-09 00:00:00','is_active'=>1]);
        $this->db->table('evaluation_scale_subcategories')->insert(['id'=>'sub-impact','scale_category_id'=>'category-impact','subcategory_code'=>'SUB','name'=>'Test Subcategory','display_order'=>1,'default_points'=>10,'intake_active'=>0,'intake_mode'=>'FORM','created_at'=>'2026-10-09 00:00:00','updated_at'=>'2026-10-09 00:00:00','is_active'=>1]);
        $this->db->table('evaluation_scale_criteria')->insert(['id'=>'criterion-impact','scale_category_id'=>'category-impact','criterion_code'=>'CRIT','name'=>'Test Criterion','max_points_per_entry'=>10,'max_occurrences'=>1,'created_at'=>'2026-10-09 00:00:00','updated_at'=>'2026-10-09 00:00:00','is_active'=>1]);
        $this->db->table('personnel_evaluation_periods')->insert(['id'=>'period-impact','evaluation_scale_version_id'=>'source-v1','personnel_group'=>'FACULTY','status'=>'EVALUATION_ONGOING']);
        $this->db->table('personnel_evaluations')->insertBatch([
            ['id'=>'eval-impact','evaluation_period_id'=>'period-impact','evaluation_scale_version_id'=>'source-v1','personnel_group_snapshot'=>'FACULTY','status'=>'ready_for_finalization','finalized_at'=>null,'final_snapshot'=>null],
            ['id'=>'eval-final','evaluation_period_id'=>'period-impact','evaluation_scale_version_id'=>'source-v1','personnel_group_snapshot'=>'FACULTY','status'=>'completed','finalized_at'=>'2026-10-08 00:00:00','final_snapshot'=>'{}'],
            ['id'=>'eval-other-scope','evaluation_period_id'=>'period-impact','evaluation_scale_version_id'=>'source-v1','personnel_group_snapshot'=>'NON_TEACHING_FACULTY','status'=>'in_evaluation','finalized_at'=>null,'final_snapshot'=>null],
        ]);

        $preview = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/draft-impact/impact-preview', null, $hrToken);
        self::assertSame(200, $preview->response()->getStatusCode(), $preview->getBody());
        $impact = $this->body($preview)['data'];
        self::assertSame(1, $impact['affected_nonfinalized_evaluation_count']);
        self::assertSame(1, $impact['affected_endorsed_evaluation_count']);
        self::assertSame(1, $impact['operational_ranking_period_count']);
        self::assertSame(1, $impact['unresolved_evaluation_count']);
        self::assertFalse($impact['activation_allowed']);
        self::assertSame('ready_for_finalization', array_key_first($impact['evaluations_by_status']));

        $this->db->table('evaluation_scale_areas')->where('id', 'area-impact')->update(['name'=>'Changed Area Again']);
        $stalePublish = $this->request('POST', 'api/v1/admin/evaluation-scales/draft-impact/approve', [
            'reason'=>'Impact guard verification', 'impact_preview_token'=>$impact['preview_token'],
        ], $hrToken);
        self::assertSame(409, $stalePublish->response()->getStatusCode(), $stalePublish->getBody());

        $freshPreview = $this->request('GET', 'api/v1/admin/evaluation-scales/versions/draft-impact/impact-preview', null, $hrToken);
        $freshImpact = $this->body($freshPreview)['data'];

        $publish = $this->request('POST', 'api/v1/admin/evaluation-scales/draft-impact/approve', [
            'reason'=>'Impact guard verification', 'impact_preview_token'=>$freshImpact['preview_token'],
        ], $hrToken);
        self::assertSame(409, $publish->response()->getStatusCode(), $publish->getBody());
        self::assertSame('draft', $this->db->table('evaluation_scale_versions')->select('status')->where('id', 'draft-impact')->get()->getRowArray()['status']);
        self::assertSame('approved', $this->db->table('evaluation_scale_versions')->select('status')->where('id', 'source-v1')->get()->getRowArray()['status']);
        self::assertSame('ready_for_finalization', $this->db->table('personnel_evaluations')->select('status')->where('id', 'eval-impact')->get()->getRowArray()['status']);
        self::assertSame('completed', $this->db->table('personnel_evaluations')->select('status')->where('id', 'eval-final')->get()->getRowArray()['status']);
    }

    public function testReconfirmationClearsFinalizationBlockAndReturnCreatesNewEvaluationRevision(): void
    {
        $this->db->table('personnel_evaluations')->insert([
            'id'=>'eval-reconfirm','personnel_profile_id'=>'personnel-fixture','evaluation_period_id'=>null,
            'evaluation_scale_version_id'=>'target-v2','personnel_group_snapshot'=>'FACULTY','status'=>'ready_for_finalization',
            'version_number'=>1,'finalized_at'=>null,'final_snapshot'=>null,
        ]);
        $this->db->table('evaluation_criteria_recalculation_jobs')->insert([
            'id'=>'job-reconfirm','evaluation_id'=>'eval-reconfirm','source_version_id'=>'source-v1','target_version_id'=>'target-v2',
            'status'=>'completed','reconfirmation_status'=>'pending','required_reviewer_profile_id'=>'hr-fixture','attempt_count'=>1,
            'created_at'=>'2026-10-09 00:00:00','updated_at'=>'2026-10-09 00:00:00','completed_at'=>'2026-10-09 00:00:00',
        ]);
        $service = new PersonnelEvaluationCriteriaRecalculationService($this->db);
        self::assertSame('CRITERIA_RECONFIRMATION_REQUIRED', $service->finalizationBlocker($this->db->table('personnel_evaluations')->where('id','eval-reconfirm')->get()->getRowArray())['code']);
        $result = $service->decideReconfirmation('eval-reconfirm','hr-fixture','reconfirm');
        self::assertSame('reconfirmed', $result['status']);
        self::assertNull($service->finalizationBlocker($this->db->table('personnel_evaluations')->where('id','eval-reconfirm')->get()->getRowArray()));

        $this->db->table('personnel_evaluations')->insert([
            'id'=>'eval-return','personnel_profile_id'=>'personnel-fixture','evaluation_period_id'=>null,
            'evaluation_scale_version_id'=>'target-v2','personnel_group_snapshot'=>'FACULTY','status'=>'ready_for_finalization',
            'version_number'=>4,'finalized_at'=>null,'final_snapshot'=>null,
        ]);
        $this->db->table('evaluation_criteria_recalculation_jobs')->insert([
            'id'=>'job-return','evaluation_id'=>'eval-return','source_version_id'=>'source-v1','target_version_id'=>'target-v2',
            'status'=>'completed','reconfirmation_status'=>'pending','required_reviewer_profile_id'=>'hr-fixture','attempt_count'=>1,
            'created_at'=>'2026-10-09 00:00:01','updated_at'=>'2026-10-09 00:00:01','completed_at'=>'2026-10-09 00:00:01',
        ]);
        $returned = $service->decideReconfirmation('eval-return','hr-fixture','return','Please review the recalculated evidence.');
        self::assertSame(5, (int)$this->db->table('personnel_evaluations')->select('version_number')->where('id',$returned['evaluation_id'])->get()->getRowArray()['version_number']);
        self::assertSame('in_evaluation', $this->db->table('personnel_evaluations')->select('status')->where('id',$returned['evaluation_id'])->get()->getRowArray()['status']);
        self::assertSame('returned', $this->db->table('evaluation_criteria_recalculation_jobs')->select('reconfirmation_status')->where('id','job-return')->get()->getRowArray()['reconfirmation_status']);
    }

    private function request(string $method, string $path, ?array $payload = null, ?string $token = null)
    {
        $headers = ['Accept' => 'application/json'];
        if ($token !== null) $headers['Authorization'] = 'Bearer ' . $token;
        $this->withHeaders($headers);
        if ($payload !== null) $this->withBodyFormat('json');
        return $this->call($method, $path, $payload);
    }

    private function body($response): array
    {
        return json_decode($response->response()->getBody(), true) ?? [];
    }

    private function seedFixture(): void
    {
        $now = '2026-10-09 00:00:00';
        $this->db->table('profiles')->insertBatch([
            ['id'=>'hr-fixture','full_name'=>'Fixture HR','status'=>'active','account_type'=>'hr_admin'],
            ['id'=>'personnel-fixture','full_name'=>'Fixture Personnel','status'=>'active','account_type'=>'personnel'],
        ]);
        $this->db->table('roles')->insertBatch([
            ['id'=>'role-hr','role_key'=>'hr_admin','display_name'=>'HR Administrator'],
            ['id'=>'role-personnel','role_key'=>'personnel','display_name'=>'Personnel'],
        ]);
        $this->db->table('profile_roles')->insertBatch([
            ['id'=>'pr-hr','profile_id'=>'hr-fixture','role_id'=>'role-hr','is_active'=>1],
            ['id'=>'pr-personnel','profile_id'=>'personnel-fixture','role_id'=>'role-personnel','is_active'=>1],
        ]);
        $this->db->table('local_auth_credentials')->insertBatch([
            ['profile_id'=>'hr-fixture','must_change_password'=>0],
            ['profile_id'=>'personnel-fixture','must_change_password'=>0],
        ]);
        $this->db->table('evaluation_scales')->insert(['id'=>'scale-1','scale_code'=>'TEST','title'=>'Test Criteria','description'=>'API fixture','personnel_group'=>'FACULTY','total_points'=>100,'passing_score'=>70,'created_at'=>$now]);
        $this->db->table('evaluation_scale_versions')->insert(['id'=>'source-v1','scale_id'=>'scale-1','version_number'=>'1','evaluation_cycle_id'=>'2026-2027','status'=>'approved','total_max_points'=>100,'passing_score'=>70,'effective_start_date'=>'2026-01-01','created_at'=>$now,'updated_at'=>$now]);
        $this->db->table('evaluation_scale_areas')->insert(['id'=>'area-1','scale_version_id'=>'source-v1','area_code'=>'AREA','name'=>'Test Area','display_order'=>1,'max_points'=>100,'entry_policy'=>'personnel_entry_allowed','created_at'=>$now,'updated_at'=>$now,'is_active'=>1]);
        $this->db->table('evaluation_scale_categories')->insert(['id'=>'category-1','scale_area_id'=>'area-1','category_code'=>'CAT','name'=>'Test Category','display_order'=>1,'max_points'=>100,'scoring_mode'=>'FIXED','requires_manual_hr_rule'=>0,'intake_active'=>0,'intake_mode'=>'FORM','created_at'=>$now,'updated_at'=>$now,'is_active'=>1]);
        $this->db->table('evaluation_scale_subcategories')->insert(['id'=>'sub-1','scale_category_id'=>'category-1','subcategory_code'=>'SUB','name'=>'Test Subcategory','display_order'=>1,'default_points'=>10,'intake_active'=>0,'intake_mode'=>'FORM','created_at'=>$now,'updated_at'=>$now,'is_active'=>1]);
        $this->db->table('evaluation_scale_criteria')->insert(['id'=>'criterion-1','scale_category_id'=>'category-1','criterion_code'=>'CRIT','name'=>'Test Criterion','max_points_per_entry'=>10,'max_occurrences'=>1,'created_at'=>$now,'updated_at'=>$now,'is_active'=>1]);
    }

    private function createSchema(): void
    {
        foreach ([
            'personnel_evaluations', 'personnel_evaluation_items', 'personnel_evaluation_periods', 'evaluation_criteria_recalculation_events', 'evaluation_criteria_recalculation_jobs', 'evaluation_scale_change_events',
            'evaluation_scale_criterion_options', 'evaluation_scale_criteria', 'evaluation_scale_subcategories',
            'evaluation_scale_categories', 'evaluation_scale_areas', 'evaluation_scale_versions', 'evaluation_scales',
            'local_auth_credentials', 'local_auth_sessions', 'profile_roles', 'roles', 'dean_assignments',
            'colleges', 'program_coordinator_assignments', 'academic_programs', 'organization_moderator_assignments',
            'organizations', 'profiles',
        ] as $table) $this->db->query('DROP TABLE IF EXISTS ' . $table);
        $sql = [
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, status TEXT, account_type TEXT)',
            'CREATE TABLE roles (id TEXT PRIMARY KEY, role_key TEXT, display_name TEXT)',
            'CREATE TABLE profile_roles (id TEXT PRIMARY KEY, profile_id TEXT, role_id TEXT, is_active INTEGER)',
            'CREATE TABLE local_auth_sessions (id TEXT PRIMARY KEY, profile_id TEXT, token_hash TEXT, issued_at TEXT, expires_at TEXT, last_seen_at TEXT, revoked_at TEXT, revocation_reason TEXT, created_ip TEXT, user_agent_hash TEXT)',
            'CREATE TABLE local_auth_credentials (profile_id TEXT PRIMARY KEY, must_change_password INTEGER)',
            'CREATE TABLE dean_assignments (id TEXT, personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE colleges (id TEXT, code TEXT, name TEXT)',
            'CREATE TABLE program_coordinator_assignments (id TEXT, personnel_profile_id TEXT, academic_program_id TEXT, is_active INTEGER)',
            'CREATE TABLE academic_programs (id TEXT, code TEXT, name TEXT)',
            'CREATE TABLE organization_moderator_assignments (id TEXT, personnel_profile_id TEXT, organization_id TEXT, is_active INTEGER)',
            'CREATE TABLE organizations (id TEXT, code TEXT, name TEXT)',
            'CREATE TABLE evaluation_scales (id TEXT PRIMARY KEY, scale_code TEXT, title TEXT, description TEXT, personnel_group TEXT, total_points REAL, passing_score REAL, created_at TEXT)',
            'CREATE TABLE evaluation_scale_versions (id TEXT PRIMARY KEY, scale_id TEXT, version_number TEXT, evaluation_cycle_id TEXT, status TEXT, total_max_points REAL, passing_score REAL, effective_start_date TEXT, effective_end_date TEXT, source_document_ref TEXT, approved_by_user_id TEXT, approved_at TEXT, created_at TEXT, updated_at TEXT, change_reason TEXT, change_summary TEXT, source_type TEXT, source_title TEXT, source_reference TEXT, imported_at TEXT, created_by_user_id TEXT)',
            'CREATE TABLE evaluation_scale_areas (id TEXT PRIMARY KEY, scale_version_id TEXT, area_code TEXT, name TEXT, description TEXT, display_order INTEGER, max_points REAL, entry_policy TEXT, source_ref TEXT, created_at TEXT, updated_at TEXT, is_active INTEGER)',
            'CREATE TABLE evaluation_scale_categories (id TEXT PRIMARY KEY, scale_area_id TEXT, category_code TEXT, name TEXT, display_order INTEGER, max_points REAL, description TEXT, scoring_mode TEXT, requires_manual_hr_rule INTEGER, intake_active INTEGER, intake_mode TEXT, field_schema TEXT, evidence_rules TEXT, scoring_rule_reference TEXT, source_ref TEXT, created_at TEXT, updated_at TEXT, is_active INTEGER)',
            'CREATE TABLE evaluation_scale_subcategories (id TEXT PRIMARY KEY, scale_category_id TEXT, subcategory_code TEXT, name TEXT, display_order INTEGER, default_points REAL, description TEXT, intake_active INTEGER, intake_mode TEXT, field_schema TEXT, evidence_rules TEXT, scoring_rule_reference TEXT, created_at TEXT, updated_at TEXT, is_active INTEGER)',
            'CREATE TABLE evaluation_scale_criteria (id TEXT PRIMARY KEY, scale_category_id TEXT, scale_subcategory_id TEXT, criterion_code TEXT, name TEXT, max_points_per_entry REAL, max_occurrences INTEGER, description TEXT, field_schema TEXT, evidence_rules TEXT, formula_key TEXT, formula_params TEXT, created_at TEXT, updated_at TEXT, is_active INTEGER)',
            'CREATE TABLE evaluation_scale_criterion_options (id TEXT PRIMARY KEY, scale_category_id TEXT, scale_subcategory_id TEXT, option_group_code TEXT, option_code TEXT, label TEXT, points REAL, display_order INTEGER, is_active INTEGER, created_at TEXT, updated_at TEXT)',
            'CREATE TABLE evaluation_scale_change_events (id TEXT PRIMARY KEY, scale_version_id TEXT, action TEXT, actor_user_id TEXT, reason TEXT, before_state TEXT, after_state TEXT, created_at TEXT)',
            'CREATE TABLE personnel_evaluation_periods (id TEXT PRIMARY KEY, evaluation_scale_version_id TEXT, personnel_group TEXT, status TEXT)',
            'CREATE TABLE personnel_evaluations (id TEXT PRIMARY KEY, personnel_profile_id TEXT, evaluation_period_id TEXT, evaluation_scale_version_id TEXT, personnel_group_snapshot TEXT, status TEXT, version_number INTEGER, previous_version_id TEXT, finalized_at TEXT, final_snapshot TEXT, criteria_snapshot TEXT, total_score REAL, area_a_score REAL, area_b_score REAL, area_c_score REAL, updated_at TEXT, created_at TEXT, submitted_at TEXT)',
            'CREATE TABLE personnel_evaluation_items (id TEXT PRIMARY KEY, evaluation_id TEXT, created_at TEXT, updated_at TEXT)',
            'CREATE TABLE evaluation_criteria_recalculation_jobs (id TEXT PRIMARY KEY, evaluation_id TEXT, source_version_id TEXT, target_version_id TEXT, status TEXT, reconfirmation_status TEXT, required_reviewer_profile_id TEXT, reconfirmed_by_profile_id TEXT, reconfirmed_at TEXT, attempt_count INTEGER, last_error_code TEXT, last_error_message TEXT, previous_result_snapshot TEXT, result_snapshot TEXT, created_at TEXT, updated_at TEXT, started_at TEXT, completed_at TEXT, UNIQUE(evaluation_id,target_version_id))',
            'CREATE TABLE evaluation_criteria_recalculation_events (id TEXT PRIMARY KEY, job_id TEXT, evaluation_id TEXT, event_type TEXT, actor_profile_id TEXT, details TEXT, created_at TEXT)',
        ];
        foreach ($sql as $statement) $this->db->query($statement);
    }
}
