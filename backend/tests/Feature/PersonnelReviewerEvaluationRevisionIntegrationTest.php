<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Controllers\Api\EvidenceController;
use App\Controllers\Api\HREvaluationController;
use App\Controllers\Api\PersonnelAccomplishmentController;
use App\Controllers\Api\PersonnelPortfolioSubmissionController;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\ReviewerResolverService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use PHPUnit\Framework\TestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class PersonnelReviewerEvaluationRevisionIntegrationTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private string $tempDir;
    private array $preservedActivePeriods = [];
    protected $DBGroup = 'default';
    protected $db;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'r7s2_test_' . bin2hex(random_bytes(4));
        @mkdir($this->tempDir, 0755, true);

        $dbConfig = new \Config\Database();
        $dbConfig->tests = $dbConfig->default;
        $dbConfig->defaultGroup = 'default';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $dbConfig);

        $this->db = \Config\Database::connect('default');
        $ref = new \ReflectionClass(\Config\Database::class);
        $instancesProp = $ref->getProperty('instances');
        $instancesProp->setAccessible(true);
        $instances = $instancesProp->getValue();
        $instances['tests'] = $this->db;
        $instances['default'] = $this->db;
        $instancesProp->setValue(null, $instances);

        $this->cleanFixture();
        // The controlled browser-acceptance run can legitimately own the one
        // active period allowed per evaluation type/personnel group. Preserve
        // those rows exactly while this isolated fixture exercises the same
        // uniqueness rule, then restore them in tearDown().
        $this->preservedActivePeriods = $this->db->table('personnel_evaluation_periods')
            ->select('id, status, submission_close_at, evaluation_start_at, evaluation_end_at')
            ->whereIn('status', ['OPEN_FOR_SUBMISSION', 'SUBMISSION_CLOSED', 'EVALUATION_ONGOING'])
            ->get()->getResultArray();
        foreach ($this->preservedActivePeriods as $period) {
            $this->db->table('personnel_evaluation_periods')->where('id', $period['id'])->update(['status' => 'CLOSED']);
        }
        // Ensure canonical evaluation period is in OPEN_FOR_SUBMISSION status with open submission window
        $this->db->query("UPDATE personnel_evaluation_periods SET status = 'OPEN_FOR_SUBMISSION', submission_close_at = '2026-12-31 23:59:59', evaluation_start_at = '2026-12-31 23:59:59', evaluation_end_at = '2027-01-31 23:59:59' WHERE id = 'd198ba23-1571-4c5d-98e2-f57d50eee79d'");
    }

    protected function tearDown(): void
    {
        $this->cleanFixture();
        foreach ($this->preservedActivePeriods as $period) {
            $id = $period['id'];
            unset($period['id']);
            $this->db->table('personnel_evaluation_periods')->where('id', $id)->update($period);
        }
        $this->recursiveDelete($this->tempDir);
        parent::tearDown();
    }

    private function recursiveDelete(string $dir): void
    {
        if (!is_dir($dir)) return;
        $files = scandir($dir) ?: [];
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            $path = $dir . DIRECTORY_SEPARATOR . $file;
            if (is_dir($path)) {
                $this->recursiveDelete($path);
            } else {
                @unlink($path);
            }
        }
        @rmdir($dir);
    }

    private function cleanFixture(): void
    {
        $prefix = 'r7000000';
        $db = $this->db;
        $db->query("DELETE FROM audit_logs WHERE actor_profile_id LIKE '{$prefix}%' OR target_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_evaluation_events WHERE actor_profile_id LIKE '{$prefix}%' OR evaluation_id IN (SELECT id FROM personnel_evaluations WHERE personnel_profile_id LIKE '{$prefix}%')");
        $db->query("DELETE FROM personnel_evaluation_deficiency_requests WHERE requested_by LIKE '{$prefix}%' OR evaluation_id IN (SELECT id FROM personnel_evaluations WHERE personnel_profile_id LIKE '{$prefix}%')");
        $db->query("DELETE FROM personnel_evaluation_reports WHERE evaluation_id IN (SELECT id FROM personnel_evaluations WHERE personnel_profile_id LIKE '{$prefix}%')");
        $db->query("DELETE FROM personnel_evaluation_items WHERE evaluation_id IN (SELECT id FROM personnel_evaluations WHERE personnel_profile_id LIKE '{$prefix}%')");
        if ($db->tableExists('personnel_portfolio_submission_items')) {
            $db->query("DELETE FROM personnel_portfolio_submission_items WHERE submission_version_id IN (SELECT id FROM personnel_portfolio_submission_versions WHERE submission_id IN (SELECT id FROM personnel_portfolio_submissions WHERE personnel_profile_id LIKE '{$prefix}%'))");
        }
        if ($db->tableExists('personnel_portfolio_submission_versions')) {
            $db->query("DELETE FROM personnel_portfolio_submission_versions WHERE submission_id IN (SELECT id FROM personnel_portfolio_submissions WHERE personnel_profile_id LIKE '{$prefix}%')");
        }
        if ($db->tableExists('personnel_portfolio_submissions')) {
            $db->query("DELETE FROM personnel_portfolio_submissions WHERE personnel_profile_id LIKE '{$prefix}%'");
        }
        $db->query("DELETE FROM personnel_evaluations WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_accomplishment_evidence WHERE uploaded_by LIKE '{$prefix}%' OR accomplishment_id IN (SELECT id FROM personnel_accomplishments WHERE personnel_profile_id LIKE '{$prefix}%')");
        $db->query("DELETE FROM personnel_accomplishments WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_annual_review_imports WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_annual_reviews WHERE personnel_profile_id LIKE '{$prefix}%' OR id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_evaluation_idempotency WHERE actor_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_evaluation_roots WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_college_affiliations WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_administrative_unit_affiliations WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM dean_assignments WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM profile_roles WHERE profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_profiles WHERE profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_evaluation_periods WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM profiles WHERE id LIKE '{$prefix}%'");
    }

    private function createMockRequest(
        string $method = 'GET',
        array $body = [],
        array $headers = [],
        string $uriString = 'http://localhost/api/v1/'
    ): IncomingRequest {
        $config = new \Config\App();
        $uri = new URI($uriString);
        $userAgent = new UserAgent();
        $request = new IncomingRequest($config, $uri, null, $userAgent);
        $request->setMethod($method);

        if (!empty($body)) {
            $json = json_encode($body);
            $request->setBody($json);
            $request->setHeader('Content-Type', 'application/json');
        }

        foreach ($headers as $k => $v) {
            $request->setHeader($k, $v);
        }

        return $request;
    }

    private function makeMockActorService(array $actor): AuthorizationService
    {
        return new class($actor) extends AuthorizationService {
            private array $actorData;
            public function __construct(array $actorData) {
                parent::__construct();
                $this->actorData = $actorData;
            }
            public function resolveActor(?string $authorizationHeader = null): ?array {
                return $this->actorData;
            }
            public function assertScope(mixed $actor, array $allowedScopes): void {
                $role = $this->actorData['active_role'] ?? $this->actorData['role'] ?? '';
                if (!in_array($role, $allowedScopes, true) && !in_array('any', $allowedScopes, true)) {
                    throw new \RuntimeException('Forbidden', 403);
                }
            }
        };
    }

    private function makeMockAuthActorService(array $actor): AuthenticatedActorService
    {
        return new class($actor) extends AuthenticatedActorService {
            private array $actorData;
            public function __construct(array $actorData) {
                parent::__construct();
                $this->actorData = $actorData;
            }
            public function resolveActor(?string $authorizationHeader = null): ?array {
                return $this->actorData;
            }
        };
    }

    private function initController(mixed $controller, IncomingRequest $request): void
    {
        $response = \Config\Services::response();
        $logger = \Config\Services::logger();
        $controller->initController($request, $response, $logger);
    }

    public function testCanonicalReviewerEvaluationScoringDeficiencyReturnAndResubmissionPipeline(): void
    {
        $db = $this->db;
        $this->assertSame('achievenest_phase2_restore_test', db_connect()->database);
        $now = date('Y-m-d H:i:s');
        $prefix = 'r7000000';

        // ---------------------------------------------------------------------
        // 1. FIXTURE SETUP
        // ---------------------------------------------------------------------
        $academicId       = "{$prefix}-0000-4000-8000-000000000001";
        $nonAcademicId    = "{$prefix}-0000-4000-8000-000000000002";
        $deanId           = "{$prefix}-0000-4000-8000-000000000003";
        $otherDeanId      = "{$prefix}-0000-4000-8000-000000000004";
        $hrAdminId        = "{$prefix}-0000-4000-8000-000000000005";

        $collegeCasId     = '20000000-0000-0000-0000-000000000003'; // CAS
        $collegeCedId     = '20000000-0000-0000-0000-000000000004'; // CED
        $periodId         = 'd198ba23-1571-4c5d-98e2-f57d50eee79d'; // Canonical open faculty period
        $hrUnitId         = $db->table('administrative_units')->select('id')->where('code', 'HR')->where('status', 'active')->get()->getRowArray()['id'];

        $db->query("INSERT INTO profiles (id, institutional_id, email, full_name, account_type, status, created_at, updated_at) VALUES
            ('{$academicId}', 'INST-R7-001', 'faculty.r7s2@ndmu.edu.ph', 'Dr. Faculty Reviewee', 'personnel', 'active', '{$now}', '{$now}'),
            ('{$nonAcademicId}', 'INST-R7-002', 'nonacademic.r7s2@ndmu.edu.ph', 'Staff Reviewee', 'personnel', 'active', '{$now}', '{$now}'),
            ('{$deanId}', 'INST-R7-003', 'dean.cas@ndmu.edu.ph', 'Dean of CAS', 'personnel', 'active', '{$now}', '{$now}'),
            ('{$otherDeanId}', 'INST-R7-004', 'dean.ced@ndmu.edu.ph', 'Dean of CED', 'personnel', 'active', '{$now}', '{$now}'),
            ('{$hrAdminId}', 'INST-R7-005', 'hr.admin.r7s2@ndmu.edu.ph', 'HR Reviewer Admin', 'hr_admin', 'active', '{$now}', '{$now}')");

        $db->query("INSERT INTO personnel_profiles (profile_id, personnel_classification, employment_status, employment_start_date, rank_level, personnel_group, organizational_side, faculty_engagement, position_title, current_rank_title, created_at, updated_at) VALUES
            ('{$academicId}', 'academic', 'permanent', '2020-01-01', 3, 'FACULTY', 'academic', 'full_time_faculty', 'Associate Professor', 'Associate Professor I', '{$now}', '{$now}'),
            ('{$nonAcademicId}', 'non_academic', 'permanent', '2021-01-01', 1, 'NON_TEACHING_FACULTY', 'non_academic', 'full_time_faculty', 'Administrative Officer', 'Staff I', '{$now}', '{$now}'),
            ('{$deanId}', 'academic', 'permanent', '2015-01-01', 4, 'FACULTY', 'academic', 'full_time_faculty', 'Dean of CAS', 'Professor I', '{$now}', '{$now}'),
            ('{$otherDeanId}', 'academic', 'permanent', '2016-01-01', 4, 'FACULTY', 'academic', 'full_time_faculty', 'Dean of CED', 'Professor I', '{$now}', '{$now}')");

        // Role assignments for HR admin and Deans
        $hrRoleId = $db->table('roles')->where('role_key', 'hr_staff')->get()->getRowArray()['id'] ?? null;
        if ($hrRoleId) {
            $db->query("INSERT INTO profile_roles (id, profile_id, role_id, is_active, assigned_at) VALUES
                ('{$prefix}-0000-4000-8000-000000000091', '{$hrAdminId}', '{$hrRoleId}', 1, '{$now}')");
        }

        // College affiliations & Dean assignments
        $db->query("INSERT INTO personnel_college_affiliations (id, personnel_profile_id, college_id, is_active, effective_from, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000021', '{$academicId}', '{$collegeCasId}', 1, '{$now}', '{$now}', '{$now}')");

        // Match the real canonical Non-Academic account shape: active assignment
        // to an outside-college administrative unit with no Department Head.
        $db->query("INSERT INTO personnel_administrative_unit_affiliations (id, personnel_profile_id, administrative_unit_id, is_active, effective_from, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000024', '{$nonAcademicId}', '{$hrUnitId}', 1, '{$now}', '{$now}', '{$now}')");

        $db->query("INSERT INTO dean_assignments (id, college_id, personnel_profile_id, is_active, effective_from, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000022', '{$collegeCasId}', '{$deanId}', 1, '{$now}', '{$now}', '{$now}'),
            ('{$prefix}-0000-4000-8000-000000000023', '{$collegeCedId}', '{$otherDeanId}', 1, '{$now}', '{$now}', '{$now}')");

        // Annual review & confirmed import for academic personnel
        $db->query("INSERT INTO personnel_annual_reviews (id, personnel_profile_id, evaluation_period_id, annual_rating, review_status, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000041', '{$academicId}', '{$periodId}', 4.90, 'completed', '{$now}', '{$now}')");

        $db->query("INSERT INTO personnel_annual_review_imports (id, personnel_profile_id, evaluation_period_id, source, original_filename, file_hash, template_identifier, detected_personnel_name, review_1_school_year, review_1_rating, review_2_school_year, review_2_rating, two_review_status, validation_status, match_status, uploaded_by, uploader_workspace, uploaded_at, confirmed_at, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000081', '{$academicId}', '{$periodId}', 'excel_import', 'annual-review.xlsx', 'hash123', 'SUMMARY_1ST_2ND_V1', 'Dr. Faculty Reviewee', '2024-2025', 'outstanding', '2025-2026', 'outstanding', 'passed', 'valid', 'exact_match', '{$deanId}', 'dean', '{$now}', '{$now}', '{$now}', '{$now}')");

        // Actor structures
        $academicActor = [
            'profile' => ['id' => $academicId, 'email' => 'faculty.r7s2@ndmu.edu.ph', 'full_name' => 'Dr. Faculty Reviewee', 'account_type' => 'personnel', 'status' => 'active', 'college_id' => $collegeCasId],
            'id' => $academicId, 'sub' => $academicId, 'email' => 'faculty.r7s2@ndmu.edu.ph', 'role' => 'personnel', 'roles' => ['personnel'], 'active_role' => 'personnel', 'account_type' => 'personnel', 'personnel_group' => 'FACULTY', 'classification' => 'academic', 'college_id' => $collegeCasId,
        ];
        $deanCasActor = [
            'profile' => ['id' => $deanId, 'email' => 'dean.cas@ndmu.edu.ph', 'full_name' => 'Dean of CAS', 'account_type' => 'personnel', 'status' => 'active', 'college_id' => $collegeCasId],
            'id' => $deanId, 'sub' => $deanId, 'email' => 'dean.cas@ndmu.edu.ph', 'role' => 'dean', 'roles' => ['dean', 'personnel'], 'active_role' => 'dean', 'account_type' => 'personnel', 'college_id' => $collegeCasId,
        ];
        $deanCedActor = [
            'profile' => ['id' => $otherDeanId, 'email' => 'dean.ced@ndmu.edu.ph', 'full_name' => 'Dean of CED', 'account_type' => 'personnel', 'status' => 'active', 'college_id' => $collegeCedId],
            'id' => $otherDeanId, 'sub' => $otherDeanId, 'email' => 'dean.ced@ndmu.edu.ph', 'role' => 'dean', 'roles' => ['dean', 'personnel'], 'active_role' => 'dean', 'account_type' => 'personnel', 'college_id' => $collegeCedId,
        ];
        $hrAdminActor = [
            'profile' => ['id' => $hrAdminId, 'email' => 'hr.admin.r7s2@ndmu.edu.ph', 'full_name' => 'HR Reviewer Admin', 'account_type' => 'hr_admin', 'status' => 'active', 'college_id' => null],
            'id' => $hrAdminId, 'sub' => $hrAdminId, 'email' => 'hr.admin.r7s2@ndmu.edu.ph', 'role' => 'hr_admin', 'roles' => ['hr_admin', 'hr_staff'], 'active_role' => 'hr_admin', 'account_type' => 'hr_admin', 'college_id' => null,
        ];
        $nonAcademicActor = [
            'profile' => ['id' => $nonAcademicId, 'email' => 'nonacademic.r7s2@ndmu.edu.ph', 'full_name' => 'Staff Reviewee', 'account_type' => 'personnel', 'status' => 'active', 'college_id' => null],
            'id' => $nonAcademicId, 'sub' => $nonAcademicId, 'email' => 'nonacademic.r7s2@ndmu.edu.ph', 'role' => 'personnel', 'roles' => ['personnel'], 'active_role' => 'personnel', 'account_type' => 'personnel', 'personnel_group' => 'NON_TEACHING_FACULTY', 'classification' => 'non_academic', 'college_id' => null,
        ];

        $authzAcademic = $this->makeMockActorService($academicActor);
        $authzDeanCas = $this->makeMockActorService($deanCasActor);
        $authzDeanCed = $this->makeMockActorService($deanCedActor);
        $authzHrAdmin = $this->makeMockActorService($hrAdminActor);

        $authActorDeanCas = $this->makeMockAuthActorService($deanCasActor);
        $authActorDeanCed = $this->makeMockAuthActorService($deanCedActor);
        $authActorHrAdmin = $this->makeMockAuthActorService($hrAdminActor);
        $authActorAcademic = $this->makeMockAuthActorService($academicActor);
        $authActorNonAcademic = $this->makeMockAuthActorService($nonAcademicActor);

        // ---------------------------------------------------------------------
        // STEP 1: ACADEMIC PERSONNEL CREATES ACCOMPLISHMENT & SUBMITS V1
        // ---------------------------------------------------------------------
        $accomplishmentCtrl = new PersonnelAccomplishmentController($authzAcademic);
        $reqAcc = $this->createMockRequest('POST', [
            'title' => 'R7S2-FACULTY-Scopus Q1 Journal Publication',
            'category' => 'B.2 Research Publication',
            'category_area' => 'areaB',
            'domain' => 'productivity_creative_work',
            'description' => 'Original research on neural architecture synthesis.',
            'organizer_or_publisher' => 'Elsevier BV',
            'date_achieved' => '2026-03-20',
            'category_metadata' => [
                'portfolio_format' => 'faculty_academic',
                'subcategory_code' => 'B2_PUBLICATION',
                'criterion_code' => 'B.2',
                'faculty_confirmed_category' => true,
                'details' => [
                    'publication_title' => 'Neural Architecture Synthesis',
                    'publication_type' => 'Scholarly Paper',
                    'publisher_or_journal' => 'Elsevier',
                    'scope' => 'International',
                ],
            ]
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($accomplishmentCtrl, $reqAcc);
        $accResp = $accomplishmentCtrl->create();
        $this->assertSame(201, $accResp->getStatusCode());
        $accBody = json_decode((string)$accResp->getBody(), true);
        $accomplishmentId = $accBody['data']['id'] ?? $accBody['data']['accomplishment_id'];

        // Add evidence
        $evidenceId = "{$prefix}-0000-4000-8000-000000000051";
        $evidenceSha = hash('sha256', 'mock pdf binary content for R7 Step 2');
        $db->table('personnel_accomplishment_evidence')->insert([
            'id' => $evidenceId,
            'accomplishment_id' => $accomplishmentId,
            'storage_path' => 'evidence/personnel/' . $evidenceId . '.pdf',
            'original_filename' => 'r7s2_scopus_cert.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 2048,
            'sha256' => $evidenceSha,
            'uploaded_by' => $academicId,
            'uploaded_at' => $now,
            'status' => 'active',
        ]);

        // Submit Version 1
        $submissionCtrl = new PersonnelPortfolioSubmissionController($authzAcademic);
        $subReq = $this->createMockRequest('POST', [
            'evaluation_period_id' => $periodId,
            'remarks' => 'R7 Step 2 Faculty Submission V1'
        ], [
            'Authorization' => 'Bearer fake-token',
            'Idempotency-Key' => 'idemp-r7s2-v1-fac'
        ]);
        $this->initController($submissionCtrl, $subReq);
        $subResp = $submissionCtrl->submit();
        $this->assertSame(201, $subResp->getStatusCode());
        $subBody = json_decode((string)$subResp->getBody(), true);
        $submissionIdV1 = $subBody['data']['submission_id'];

        // ---------------------------------------------------------------------
        // STEP 2: VERIFY ROUTING TO DEAN (PHASE 4 & 5)
        // ---------------------------------------------------------------------
        $reviewerResolver = new ReviewerResolverService($db);
        $resolvedReviewer = $reviewerResolver->resolve($academicId);
        $this->assertSame('DEAN', $resolvedReviewer['authority_type']);
        $this->assertSame($deanId, $resolvedReviewer['authority_profile_id']);

        // Verify Dean CAS Queue visibility
        $hrCtrlDeanCas = new HREvaluationController($authActorDeanCas, $reviewerResolver);
        $listReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $listReq);
        $listResp = $hrCtrlDeanCas->list();
        $this->assertSame(200, $listResp->getStatusCode());
        $listBody = json_decode((string)$listResp->getBody(), true);
        $evals = $listBody['data']['evaluations'] ?? [];
        $foundV1 = array_filter($evals, fn($e) => $e['id'] === $submissionIdV1);
        $this->assertNotEmpty($foundV1, 'Assigned Dean must see submitted faculty portfolio in queue');

        // ---------------------------------------------------------------------
        // STEP 3: DEAN COLLEGE ISOLATION (PHASE 6)
        // ---------------------------------------------------------------------
        // HR transitions period to EVALUATION_ONGOING so review can begin
        $db->query("UPDATE personnel_evaluation_periods SET status = 'EVALUATION_ONGOING' WHERE id = '{$periodId}'");

        $hrCtrlDeanCed = new HREvaluationController($authActorDeanCed, $reviewerResolver);
        $startReqCed = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCed, $startReqCed);
        $crossStartResp = $hrCtrlDeanCed->start($submissionIdV1);
        $this->assertSame(403, $crossStartResp->getStatusCode(), 'Cross-college Dean must be denied evaluation start with 403');

        // ---------------------------------------------------------------------
        // STEP 4: START FACULTY EVALUATION (PHASE 7)
        // ---------------------------------------------------------------------
        $startReqCas = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $startReqCas);
        $startResp = $hrCtrlDeanCas->start($submissionIdV1);
        $this->assertSame(200, $startResp->getStatusCode());

        $evalRowV1 = $db->table('personnel_evaluations')->where('id', $submissionIdV1)->get()->getRowArray();
        $this->assertSame('in_evaluation', $evalRowV1['status']);
        $this->assertSame($deanId, $evalRowV1['evaluator_profile_id']);
        $this->assertNotEmpty($evalRowV1['evaluation_started_at']);

        // Check evaluation_started audit event
        $startEvent = $db->table('personnel_evaluation_events')
            ->where('evaluation_id', $submissionIdV1)
            ->where('action', 'evaluation_started')
            ->get()->getRowArray();
        $this->assertNotEmpty($startEvent, 'Audit event for evaluation_started must be recorded');
        $this->assertSame($deanId, $startEvent['actor_profile_id']);

        // ---------------------------------------------------------------------
        // STEP 5: EVALUATION SNAPSHOT AUTHORITY & EVIDENCE REVIEW (PHASE 8, 9, 10)
        // ---------------------------------------------------------------------
        $evalItemsV1 = $db->table('personnel_evaluation_items')->where('evaluation_id', $submissionIdV1)->get()->getResultArray();
        $this->assertCount(1, $evalItemsV1);
        $itemV1 = $evalItemsV1[0];
        $this->assertSame($accomplishmentId, $itemV1['accomplishment_id']);
        $this->assertSame('B.2', $itemV1['criterion_code']);
        $this->assertNotEmpty($itemV1['criterion_snapshot']);
        $this->assertNotEmpty($itemV1['evidence_snapshot']);

        // Evidence stream check: assigned Dean authorized
        $evidenceCtrl = new EvidenceController($authzDeanCas);
        $evReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($evidenceCtrl, $evReq);
        $evRespDean = $evidenceCtrl->personnelPreview($evidenceId);
        $this->assertNotSame(403, $evRespDean->getStatusCode(), 'Assigned Dean must have access to evidence stream');

        // Unassigned Dean blocked from evidence
        $evidenceCtrlCed = new EvidenceController($authzDeanCed);
        $this->initController($evidenceCtrlCed, $evReq);
        $evRespCed = $evidenceCtrlCed->personnelPreview($evidenceId);
        $this->assertContains($evRespCed->getStatusCode(), [403, 404], 'Unassigned reviewer must be blocked from evidence stream');

        // ---------------------------------------------------------------------
        // STEP 6: SERVER-SIDE SCORING & CAPS (PHASE 11, 12, 13)
        // ---------------------------------------------------------------------
        // Negative test: Rating before verifying must return 422
        $rateReqBeforeVerify = $this->createMockRequest('PATCH', ['evaluator_remarks' => 'Scoring early'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $rateReqBeforeVerify);
        $earlyRateResp = $hrCtrlDeanCas->rateItem($submissionIdV1, $itemV1['id']);
        $this->assertSame(422, $earlyRateResp->getStatusCode(), 'Rating unverified item must fail with 422');

        // Negative test: Invalid verification status
        $verifyInvalidReq = $this->createMockRequest('PATCH', ['verification_status' => 'bogus_status'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $verifyInvalidReq);
        $invalidStatusResp = $hrCtrlDeanCas->verifyItem($submissionIdV1, $itemV1['id']);
        $this->assertSame(422, $invalidStatusResp->getStatusCode(), 'Invalid verification_status must return 422');

        // Verify item legitimately
        $verifyReq = $this->createMockRequest('PATCH', ['verification_status' => 'verified', 'evaluator_remarks' => 'Valid Scopus evidence verified'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $verifyReq);
        $verifyResp = $hrCtrlDeanCas->verifyItem($submissionIdV1, $itemV1['id']);
        $this->assertSame(200, $verifyResp->getStatusCode());

        // Negative test: Cross-reviewer cannot rate
        $rateReqCed = $this->createMockRequest('PATCH', ['evaluator_remarks' => 'Illegal rating'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCed, $rateReqCed);
        $crossRateResp = $hrCtrlDeanCed->rateItem($submissionIdV1, $itemV1['id']);
        $this->assertSame(403, $crossRateResp->getStatusCode(), 'Unauthorized reviewer rating must be blocked with 403');

        // Rate item as assigned Dean
        $rateReq = $this->createMockRequest('PATCH', ['evaluator_remarks' => 'Full points awarded per rubric'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $rateReq);
        $rateResp = $hrCtrlDeanCas->rateItem($submissionIdV1, $itemV1['id']);
        $this->assertSame(200, $rateResp->getStatusCode());
        $rateBody = json_decode((string)$rateResp->getBody(), true);
        $awardedPoints = $rateBody['data']['awarded_points'] ?? 0;
        $this->assertGreaterThan(0, $awardedPoints, 'Server must calculate points from locked criterion snapshot');

        // No standalone deficiency yet: the personnel return-feedback projection is empty.
        $personnelReadReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($submissionCtrl, $personnelReadReq);
        $beforeDeficiencyResp = $submissionCtrl->getLatest();
        $this->assertSame(200, $beforeDeficiencyResp->getStatusCode());
        $beforeDeficiencyBody = json_decode((string) $beforeDeficiencyResp->getBody(), true);
        $this->assertNull($beforeDeficiencyBody['data']['return_feedback'] ?? null);

        // A different Personnel actor cannot read this subject's feedback through getLatest().
        $otherPersonnelController = new PersonnelPortfolioSubmissionController($authzDeanCed);
        $this->initController($otherPersonnelController, $personnelReadReq);
        $otherPersonnelResp = $otherPersonnelController->getLatest();
        $this->assertSame(200, $otherPersonnelResp->getStatusCode());
        $otherPersonnelBody = json_decode((string) $otherPersonnelResp->getBody(), true);
        $this->assertNull($otherPersonnelBody['data']['submission'] ?? null);

        // Verify item_rated audit event
        $rateEvent = $db->table('personnel_evaluation_events')
            ->where('evaluation_id', $submissionIdV1)
            ->where('action', 'item_rated')
            ->get()->getRowArray();
        $this->assertNotEmpty($rateEvent);

        // ---------------------------------------------------------------------
        // STEP 7: DEFICIENCY REQUEST (PHASE 14, 15)
        // ---------------------------------------------------------------------
        $deficiencyReq = $this->createMockRequest('POST', [
            'evaluation_item_id' => $itemV1['id'],
            'reason' => 'Please provide the complete DOI link and citation index page.',
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $deficiencyReq);
        $defResp = $hrCtrlDeanCas->createDeficiency($submissionIdV1);
        $this->assertSame(201, $defResp->getStatusCode(), 'Deficiency creation must return 201');

        $defRow = $db->table('personnel_evaluation_deficiency_requests')
            ->where('evaluation_id', $submissionIdV1)
            ->get()->getRowArray();
        $this->assertNotEmpty($defRow);
        $this->assertSame('pending', $defRow['status']);
        $this->assertSame($deanId, $defRow['requested_by']);
        $this->assertSame('Please provide the complete DOI link and citation index page.', $defRow['deficiency_description']);

        // Verify V1 snapshot has not been mutated
        $itemV1AfterDef = $db->table('personnel_evaluation_items')->where('id', $itemV1['id'])->get()->getRowArray();
        $this->assertSame($itemV1['item_description'], $itemV1AfterDef['item_description']);
        $this->assertSame($itemV1['evidence_snapshot'], $itemV1AfterDef['evidence_snapshot']);

        // ---------------------------------------------------------------------
        // STEP 8: WHOLE-PORTFOLIO RETURN FOR REVISION (PHASE 16)
        // ---------------------------------------------------------------------
        $returnReq = $this->createMockRequest('POST', [
            'reason' => 'Deficiencies noted. Please attach the DOI index page and resubmit portfolio Version 2.',
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $returnReq);
        $returnResp = $hrCtrlDeanCas->returnEvaluation($submissionIdV1);
        $this->assertSame(200, $returnResp->getStatusCode());

        $evalRowV1Returned = $db->table('personnel_evaluations')->where('id', $submissionIdV1)->get()->getRowArray();
        $this->assertSame('returned_for_revision', $evalRowV1Returned['status']);
        $this->assertSame('Deficiencies noted. Please attach the DOI index page and resubmit portfolio Version 2.', $evalRowV1Returned['return_reason']);
        $this->assertNotEmpty($evalRowV1Returned['returned_at']);

        // The authoritative Personnel read model merges the standalone request into
        // return_feedback for this exact evaluation/version without score leakage.
        $this->initController($submissionCtrl, $personnelReadReq);
        $returnedLatestResp = $submissionCtrl->getLatest();
        $this->assertSame(200, $returnedLatestResp->getStatusCode());
        $returnedLatestJson = (string) $returnedLatestResp->getBody();
        $returnedLatestBody = json_decode($returnedLatestJson, true);
        $visibleDeficiencies = $returnedLatestBody['data']['return_feedback']['item_deficiencies'] ?? [];
        $this->assertCount(1, $visibleDeficiencies);
        $this->assertSame($defRow['id'], $visibleDeficiencies[0]['id']);
        $this->assertSame($itemV1['id'], $visibleDeficiencies[0]['evaluation_item_id']);
        $this->assertSame('pending', $visibleDeficiencies[0]['status']);
        $this->assertSame('Please provide the complete DOI link and citation index page.', $visibleDeficiencies[0]['comment']);
        $this->assertSame($itemV1['criterion_code'], $visibleDeficiencies[0]['criterion_code']);
        $this->assertStringNotContainsString('awarded_points', $returnedLatestJson);
        $this->assertStringNotContainsString('total_score', $returnedLatestJson);

        // Resolved requests are historical, not actionable return-feedback notices.
        $db->table('personnel_evaluation_deficiency_requests')->where('id', $defRow['id'])->update(['status' => 'resolved']);
        $resolvedLatestResp = $submissionCtrl->getLatest();
        $resolvedLatestBody = json_decode((string) $resolvedLatestResp->getBody(), true);
        $this->assertSame([], $resolvedLatestBody['data']['return_feedback']['item_deficiencies'] ?? null);
        $db->table('personnel_evaluation_deficiency_requests')->where('id', $defRow['id'])->update(['status' => 'pending']);

        // Verify returned_for_revision event
        $returnEvent = $db->table('personnel_evaluation_events')
            ->where('evaluation_id', $submissionIdV1)
            ->where('action', 'returned_for_revision')
            ->get()->getRowArray();
        $this->assertNotEmpty($returnEvent);

        // ---------------------------------------------------------------------
        // STEP 9: WORKING PORTFOLIO UNLOCK & CORRECTION (PHASE 17, 18)
        // ---------------------------------------------------------------------
        // Personnel edits the working accomplishment (now unlocked)
        $reqCorrection = $this->createMockRequest('PUT', [
            'title' => 'R7S2-FACULTY-Scopus Q1 Journal Publication (Corrected with DOI)',
            'category' => 'B.2 Research Publication',
            'category_area' => 'areaB',
            'domain' => 'productivity_creative_work',
            'description' => 'Original research on neural architecture synthesis with verified DOI https://doi.org/10.1016/j.neucom.2026.01.001.',
            'organizer_or_publisher' => 'Elsevier BV',
            'date_achieved' => '2026-03-20',
            'category_metadata' => [
                'portfolio_format' => 'faculty_academic',
                'subcategory_code' => 'B2_PUBLICATION',
                'criterion_code' => 'B.2',
                'faculty_confirmed_category' => true,
                'details' => [
                    'publication_title' => 'Neural Architecture Synthesis (Indexed)',
                    'publication_type' => 'Scholarly Paper',
                    'publisher_or_journal' => 'Elsevier',
                    'scope' => 'International',
                    'doi' => '10.1016/j.neucom.2026.01.001',
                ],
            ]
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($accomplishmentCtrl, $reqCorrection);
        $correctResp = $accomplishmentCtrl->update($accomplishmentId);
        $this->assertSame(200, $correctResp->getStatusCode(), 'Working portfolio must be editable after return');

        // Verify working accomplishment changed, but V1 snapshot remained unchanged
        $accRowAfterEdit = $db->table('personnel_accomplishments')->where('id', $accomplishmentId)->get()->getRowArray();
        $this->assertSame('R7S2-FACULTY-Scopus Q1 Journal Publication (Corrected with DOI)', $accRowAfterEdit['title']);

        $itemV1StillImmutable = $db->table('personnel_evaluation_items')->where('id', $itemV1['id'])->get()->getRowArray();
        $this->assertStringContainsString('R7S2-FACULTY-Scopus Q1 Journal Publication', $itemV1StillImmutable['item_description']);
        $this->assertStringNotContainsString('(Corrected with DOI)', $itemV1StillImmutable['item_description']);

        // ---------------------------------------------------------------------
        // STEP 10: RESUBMISSION & VERSION 2 CREATION (PHASE 19, 20, 21, 22, 23, 24, 25)
        // ---------------------------------------------------------------------
        $resubmitReq = $this->createMockRequest('POST', [
            'evaluation_period_id' => $periodId,
            'remarks' => 'Resubmitting Version 2 with requested DOI citation page.'
        ], [
            'Authorization' => 'Bearer fake-token',
            'Idempotency-Key' => 'idemp-r7s2-v2-fac'
        ]);
        $this->initController($submissionCtrl, $resubmitReq);
        $resubResp = $submissionCtrl->resubmit();
        $this->assertContains($resubResp->getStatusCode(), [200, 201], 'Resubmission must succeed with 200 or 201');
        $resubBody = json_decode((string)$resubResp->getBody(), true);
        $submissionIdV2 = $resubBody['data']['submission_id'] ?? $resubBody['data']['id'];
        $this->assertNotEmpty($submissionIdV2);
        $this->assertNotSame($submissionIdV1, $submissionIdV2, 'Version 2 must have its own distinct evaluation row ID');

        // Check Version 2 lineage and common root
        $evalRowV2 = $db->table('personnel_evaluations')->where('id', $submissionIdV2)->get()->getRowArray();
        $this->assertSame('submitted', $evalRowV2['status']);
        $this->assertEquals(2, $evalRowV2['version_number'], 'Resubmission version number must be 2');
        $this->assertSame($evalRowV1['evaluation_root_id'], $evalRowV2['evaluation_root_id'], 'V1 and V2 must share the same evaluation_root_id');
        $this->assertSame($submissionIdV1, $evalRowV2['previous_version_id'], 'Version 2 must point directly to Version 1');
        $this->assertSame($deanId, $evalRowV2['evaluator_profile_id'], 'Version 2 must route to the same currently authorized Dean');
        $this->assertSame($deanId, $evalRowV2['originating_evaluator_profile_id']);

        // Check V2 snapshot contains corrected text
        $evalItemsV2 = $db->table('personnel_evaluation_items')->where('evaluation_id', $submissionIdV2)->get()->getResultArray();
        $this->assertCount(1, $evalItemsV2);
        $itemV2 = $evalItemsV2[0];
        $this->assertStringContainsString('Corrected with DOI', $itemV2['item_description']);
        $this->assertSame('unrated', $itemV2['rating_status'], 'V2 items must be unrated initially (Score Version Isolation)');
        $this->assertSame('pending', $itemV2['verification_status']);
        $this->assertNull($itemV2['awarded_points'], 'Version 1 score must not be inherited by Version 2');
        $this->assertSame($evidenceId, $itemV2['evidence_id'], 'Version 2 must reuse the existing active evidence');

        $v1AfterResubmit = $db->table('personnel_evaluations')->where('id', $submissionIdV1)->get()->getRowArray();
        $v1ItemAfterResubmit = $db->table('personnel_evaluation_items')->where('id', $itemV1['id'])->get()->getRowArray();
        $v1DeficiencyAfterResubmit = $db->table('personnel_evaluation_deficiency_requests')->where('id', $defRow['id'])->get()->getRowArray();
        $this->assertSame($evalRowV1Returned['total_score'], $v1AfterResubmit['total_score'], 'Version 1 score must remain historical and unchanged');
        $this->assertSame($itemV1['item_description'], $v1ItemAfterResubmit['item_description']);
        $this->assertSame($itemV1['evidence_snapshot'], $v1ItemAfterResubmit['evidence_snapshot']);
        $this->assertSame('pending', $v1DeficiencyAfterResubmit['status'], 'Original deficiency remains historical to Version 1');
        $this->assertSame($submissionIdV1, $v1DeficiencyAfterResubmit['evaluation_id']);
        $this->assertSame(0, $db->table('personnel_evaluation_deficiency_requests')->where('evaluation_id', $submissionIdV2)->countAllResults(), 'Version 2 must not receive a duplicate deficiency');

        // Check Latest & History Endpoints
        $latestReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($submissionCtrl, $latestReq);
        $latestResp = $submissionCtrl->getLatest();
        $this->assertSame(200, $latestResp->getStatusCode());
        $latestBody = json_decode((string)$latestResp->getBody(), true);
        $this->assertEquals(2, $latestBody['data']['version_number'] ?? $latestBody['data']['version']);
        $this->assertNull($latestBody['data']['return_feedback'] ?? null, 'A Version 1 deficiency must not leak into Version 2 latest feedback');

        $historyResp = $submissionCtrl->getHistory();
        $this->assertSame(200, $historyResp->getStatusCode());
        $historyBody = json_decode((string)$historyResp->getBody(), true);
        $versions = $historyBody['data']['versions'] ?? $historyBody['data'] ?? [];
        $this->assertCount(2, $versions, 'History endpoint must return both Version 1 and Version 2');
        $this->assertCount(1, $versions[0]['return_feedback']['item_deficiencies'] ?? [], 'Version 1 history must retain its deficiency');
        $this->assertNull($versions[1]['return_feedback'] ?? null, 'Version 2 must not inherit Version 1 deficiency feedback');

        // ---------------------------------------------------------------------
        // STEP 11: NON-ACADEMIC HR REVIEWER LIFECYCLE (PHASE 26, 27, 28, 29, 30, 31)
        // ---------------------------------------------------------------------
        // Insert non-academic open evaluation period & annual review eligibility
        $nonAcPeriodId = "{$prefix}-0000-4000-8000-000000000077";
        $cycleRow = $db->table('ranking_cycles')->get()->getRowArray();
        $validCycleId = $cycleRow['id'] ?? 'cycle-2025-2026';
        $db->query("INSERT INTO personnel_evaluation_periods (id, ranking_cycle_id, period_name, evaluation_type, personnel_group, academic_year, semester, coverage_label, status, submission_open_at, submission_close_at, evaluation_start_at, evaluation_end_at, evaluation_scale_version_id, created_by, created_at, updated_at) VALUES
            ('{$nonAcPeriodId}', '{$validCycleId}', 'Non-Academic Ranking Period', 'RANKING_PROMOTION', 'NON_TEACHING_FACULTY', '2025-2026', 'FULL_ACADEMIC_YEAR', 'AY 2025-2026', 'OPEN_FOR_SUBMISSION', '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-12-31 23:59:59', '2027-01-31 23:59:59', 'ver-admin-2025-001', '{$hrAdminId}', '{$now}', '{$now}')");

        $db->query("INSERT INTO personnel_annual_reviews (id, personnel_profile_id, evaluation_period_id, annual_rating, review_status, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000042', '{$nonAcademicId}', '{$nonAcPeriodId}', 4.80, 'completed', '{$now}', '{$now}')");

        $db->query("INSERT INTO personnel_annual_review_imports (id, personnel_profile_id, evaluation_period_id, source, original_filename, file_hash, template_identifier, detected_personnel_name, review_1_school_year, review_1_rating, review_2_school_year, review_2_rating, two_review_status, validation_status, match_status, uploaded_by, uploader_workspace, uploaded_at, confirmed_at, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000082', '{$nonAcademicId}', '{$nonAcPeriodId}', 'excel_import', 'annual-review-staff.xlsx', 'hash456', 'SUMMARY_1ST_2ND_V1', 'Staff Reviewee', '2024-2025', 'outstanding', '2025-2026', 'outstanding', 'passed', 'valid', 'exact_match', '{$hrAdminId}', 'hr', '{$now}', '{$now}', '{$now}', '{$now}')");

        // Non-academic creates accomplishment & submits V1
        $accomplishmentCtrlNonAc = new PersonnelAccomplishmentController($this->makeMockActorService($nonAcademicActor));
        $reqAccNonAc = $this->createMockRequest('POST', [
            'title' => 'R7S2-NONACAD-Process Automation Milestone',
            'category' => 'A.3 Attendance at Professional Seminars',
            'category_area' => 'areaA',
            'domain' => 'professional_development',
            'description' => 'Automated cross-department transcript processing workflow.',
            'organizer_or_publisher' => 'NDMU Administration',
            'date_achieved' => '2026-02-10',
            'category_metadata' => [
                'portfolio_format' => 'non_academic',
                'subcategory_code' => 'A3_ATTENDANCE',
                'criterion_code' => 'A.3',
                'faculty_confirmed_category' => true,
                'details' => [
                    'title' => 'Transcript Automation Workshop',
                    'organizer' => 'NDMU Administration',
                    'scope' => 'In-House',
                ],
            ]
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($accomplishmentCtrlNonAc, $reqAccNonAc);
        $accNonAcResp = $accomplishmentCtrlNonAc->create();
        $this->assertSame(201, $accNonAcResp->getStatusCode());
        $nonAcAccId = json_decode((string)$accNonAcResp->getBody(), true)['data']['id'];

        // Evidence for non-academic
        $evidenceIdNonAc = "{$prefix}-0000-4000-8000-000000000052";
        $db->table('personnel_accomplishment_evidence')->insert([
            'id' => $evidenceIdNonAc,
            'accomplishment_id' => $nonAcAccId,
            'storage_path' => 'evidence/personnel/' . $evidenceIdNonAc . '.pdf',
            'original_filename' => 'r7s2_staff_proof.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 1024,
            'sha256' => hash('sha256', 'mock staff pdf'),
            'uploaded_by' => $nonAcademicId,
            'uploaded_at' => $now,
            'status' => 'active',
        ]);

        // Submit non-academic portfolio
        $submissionCtrlNonAc = new PersonnelPortfolioSubmissionController($this->makeMockActorService($nonAcademicActor));
        $subReqNonAc = $this->createMockRequest('POST', [
            'evaluation_period_id' => $nonAcPeriodId,
            'remarks' => 'R7 Step 2 Staff Submission V1'
        ], [
            'Authorization' => 'Bearer fake-token',
            'Idempotency-Key' => 'idemp-r7s2-v1-nonacad'
        ]);
        $this->initController($submissionCtrlNonAc, $subReqNonAc);
        $subNonAcResp = $submissionCtrlNonAc->submit();
        $this->assertSame(201, $subNonAcResp->getStatusCode());
        $subNonAcId = json_decode((string)$subNonAcResp->getBody(), true)['data']['submission_id'];

        // Verify routing: Non-academic routes to HR
        $nonAcRouting = $reviewerResolver->resolve($nonAcademicId);
        $this->assertSame(1, $db->table('personnel_administrative_unit_affiliations')->where('personnel_profile_id', $nonAcademicId)->where('is_active', 1)->countAllResults(), 'Realistic Non-Academic fixture must retain its outside-college administrative-unit affiliation');
        $this->assertSame('HR', $nonAcRouting['authority_type'], 'Non-academic portfolio must route to HR');
        $this->assertSame('hr_staff', $nonAcRouting['evaluator_role'], 'Administrative-unit affiliation must not redirect Non-Teaching / Non-Academic evaluation to Department Head');

        // Transition non-academic period to EVALUATION_ONGOING before HR review starts
        $db->query("UPDATE personnel_evaluation_periods SET status = 'EVALUATION_ONGOING' WHERE id = '{$nonAcPeriodId}'");

        // Submitted detail remains readable by assigned HR, while an unrelated Dean
        // cannot use the HR/reviewer detail endpoint for this non-academic case.
        $hrCtrlAdmin = new HREvaluationController($authActorHrAdmin, $reviewerResolver);
        $ntfOwnerCtrl = new HREvaluationController($authActorNonAcademic, $reviewerResolver);
        $submittedDetailReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $submittedDetailReq);
        $submittedDetailResp = $hrCtrlAdmin->get($subNonAcId);
        $this->assertSame(200, $submittedDetailResp->getStatusCode(), 'Assigned HR must be able to read submitted non-academic evaluation detail');
        $submittedDetail = json_decode((string) $submittedDetailResp->getBody(), true)['data'];
        $this->assertSame('submitted', $submittedDetail['evaluation']['status']);
        $this->assertCount(1, $submittedDetail['items']);

        $deanDetailReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $deanDetailReq);
        $deanDetailResp = $hrCtrlDeanCas->get($subNonAcId);
        $this->assertSame(403, $deanDetailResp->getStatusCode(), 'An unrelated Dean must not read HR-assigned non-academic evaluation detail');

        $submittedFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $submittedFinalizeReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'submitted NTF cannot complete');
        $submittedOwnerResultReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $submittedOwnerResultReq);
        $this->assertSame(409, $ntfOwnerCtrl->getResult($subNonAcId)->getStatusCode(), 'submitted result must be concealed from owner');
        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['status' => 'returned_for_revision']);
        $returnedFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $returnedFinalizeReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'returned NTF cannot complete');
        $returnedOwnerResultReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $returnedOwnerResultReq);
        $this->assertSame(409, $ntfOwnerCtrl->getResult($subNonAcId)->getStatusCode(), 'returned result must be concealed from owner');
        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['status' => 'submitted']);

        // Negative test: Dean cannot start evaluation for non-academic
        $startReqDeanOnNonAc = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $startReqDeanOnNonAc);
        $deanOnNonAcResp = $hrCtrlDeanCas->start($subNonAcId);
        $this->assertSame(403, $deanOnNonAcResp->getStatusCode(), 'Dean must be blocked from starting non-academic evaluation (403)');

        // HR starts non-academic evaluation
        $startReqHr = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $startReqHr);
        $hrStartResp = $hrCtrlAdmin->start($subNonAcId);
        $this->assertSame(200, $hrStartResp->getStatusCode(), 'HR Admin must be authorized to start non-academic evaluation');

        $inEvaluationDetailReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $inEvaluationDetailReq);
        $inEvaluationDetailResp = $hrCtrlAdmin->get($subNonAcId);
        $this->assertSame(200, $inEvaluationDetailResp->getStatusCode(), 'Assigned HR must retain detail access while evaluation is in progress');
        $this->assertSame('in_evaluation', json_decode((string) $inEvaluationDetailResp->getBody(), true)['data']['evaluation']['status']);
        $inEvaluationOwnerResultReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $inEvaluationOwnerResultReq);
        $this->assertSame(409, $ntfOwnerCtrl->getResult($subNonAcId)->getStatusCode(), 'in-evaluation result must be concealed from owner');

        // HR verifies item
        $nonAcItems = $db->table('personnel_evaluation_items')->where('evaluation_id', $subNonAcId)->get()->getResultArray();
        $this->assertNotEmpty($nonAcItems);
        $nonAcItem = $nonAcItems[0];

        $verifyNonAcReq = $this->createMockRequest('PATCH', ['verification_status' => 'verified', 'evaluator_remarks' => 'HR verified automation workflow'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $verifyNonAcReq);
        $verifyNonAcResp = $hrCtrlAdmin->verifyItem($subNonAcId, $nonAcItem['id']);
        $this->assertSame(200, $verifyNonAcResp->getStatusCode());

        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['status' => 'ready_for_finalization']);
        $unratedFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $unratedFinalizeReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'unrated NTF item cannot complete');
        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['status' => 'in_evaluation']);

        // Phase 8B: NTF terminal completion is rank-free but retains all shared gates.
        $prematureFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $prematureFinalizeReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'in_evaluation cannot terminally complete');

        $rateNonAcReq = $this->createMockRequest('PATCH', ['evaluator_remarks' => 'Locked server score'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $rateNonAcReq);
        $rateNonAcResp = $hrCtrlAdmin->rateItem($subNonAcId, $nonAcItem['id']);
        $this->assertSame(200, $rateNonAcResp->getStatusCode());

        $defReq = $this->createMockRequest('POST', ['reason' => 'Resolve before terminal completion.', 'evaluation_item_id' => $nonAcItem['id']], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $defReq);
        $defResp = $hrCtrlAdmin->createDeficiency($subNonAcId);
        $this->assertSame(201, $defResp->getStatusCode());
        $defId = json_decode((string) $defResp->getBody(), true)['data']['id'];

        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['status' => 'ready_for_finalization']);
        $deficiencyFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $deficiencyFinalizeReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'unresolved deficiency cannot complete');
        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['status' => 'in_evaluation']);

        $blockedReadyReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $blockedReadyReq);
        $this->assertSame(422, $hrCtrlAdmin->markReady($subNonAcId)->getStatusCode(), 'pending deficiency must block ready state');

        $resolveReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $resolveReq);
        $this->assertSame(200, $hrCtrlAdmin->resolveDeficiency($subNonAcId, $defId)->getStatusCode());

        $readyReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $readyReq);
        $this->assertSame(200, $hrCtrlAdmin->markReady($subNonAcId)->getStatusCode());

        // Phase 8C release boundary: the persisted reviewer report exists at
        // handoff, but its scores are not released to the Personnel owner.
        $ownerReadyResultReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $ownerReadyResultReq);
        $ownerReadyResult = $ntfOwnerCtrl->getResult($subNonAcId);
        $this->assertSame(409, $ownerReadyResult->getStatusCode());
        $this->assertSame('RESULT_NOT_RELEASED', json_decode((string) $ownerReadyResult->getBody(), true)['error']['code']);

        $supersedingId = 'r7000000-0000-4000-8000-0000000000f2';
        $superseding = $db->table('personnel_evaluations')->where('id', $subNonAcId)->get()->getRowArray();
        $superseding['id'] = $supersedingId;
        $superseding['version_number'] = 2;
        $superseding['previous_version_id'] = $subNonAcId;
        $superseding['status'] = 'submitted';
        $superseding['final_snapshot'] = null;
        $superseding['finalized_at'] = null;
        $db->table('personnel_evaluations')->insert($superseding);
        $supersededReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $supersededReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'superseded evaluation version cannot complete');
        $db->table('personnel_evaluations')->where('id', $supersedingId)->delete();

        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['personnel_group_snapshot' => 'UNKNOWN']);
        $unknownGroupReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $unknownGroupReq);
        $this->assertSame(422, $hrCtrlAdmin->finalizeEvaluation($subNonAcId)->getStatusCode(), 'unknown personnel group must fail closed');
        $db->table('personnel_evaluations')->where('id', $subNonAcId)->update(['personnel_group_snapshot' => 'NON_TEACHING_FACULTY']);

        // Faculty is always bound to Phase O, even when its row is ready.
        $db->table('personnel_evaluations')->where('id', $submissionIdV2)->update(['status' => 'ready_for_finalization']);
        $facultyFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $facultyFinalizeReq);
        $facultyFinalizeResp = $hrCtrlAdmin->finalizeEvaluation($submissionIdV2);
        $this->assertSame(409, $facultyFinalizeResp->getStatusCode());
        $this->assertSame('HR_FINAL_RANK_REVIEW_REQUIRED', json_decode((string) $facultyFinalizeResp->getBody(), true)['error']['code']);
        $db->table('personnel_evaluations')->where('id', $submissionIdV2)->update(['status' => 'submitted']);

        // An unrelated Dean cannot use the rank-free NTF completion boundary.
        $unauthorizedFinalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCas, $unauthorizedFinalizeReq);
        $this->assertSame(403, $hrCtrlDeanCas->finalizeEvaluation($subNonAcId)->getStatusCode());

        $rankTables = ['personnel_rank_applied_for_decisions', 'personnel_recommended_rank_decisions', 'personnel_hr_final_rank_reviews', 'personnel_rank_placements', 'personnel_approved_rank_records', 'personnel_rank_history'];
        $rankCountsBefore = [];
        foreach ($rankTables as $table) $rankCountsBefore[$table] = $db->table($table)->where('personnel_profile_id', $nonAcademicId)->countAllResults();

        $finalizeReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $finalizeReq);
        $finalizeResp = $hrCtrlAdmin->finalizeEvaluation($subNonAcId);
        $this->assertSame(200, $finalizeResp->getStatusCode());
        $finalizeBody = json_decode((string) $finalizeResp->getBody(), true)['data'];
        $this->assertFalse($finalizeBody['idempotent']);
        $this->assertSame('NON_TEACHING_FACULTY', $finalizeBody['final_snapshot']['personnel_group']);
        $this->assertArrayHasKey('criteria_snapshot', $finalizeBody['final_snapshot']);
        $this->assertNotEmpty($finalizeBody['final_snapshot']['items'][0]['evidence_snapshot']);
        $this->assertArrayNotHasKey('rank_recommendation', $finalizeBody['final_snapshot']);

        $evalNonAcRow = $db->table('personnel_evaluations')->where('id', $subNonAcId)->get()->getRowArray();
        $this->assertSame('completed', $evalNonAcRow['status']);
        $this->assertNotEmpty($evalNonAcRow['finalized_at']);
        $this->assertNotEmpty($evalNonAcRow['final_snapshot']);
        $this->assertSame(1, $db->table('personnel_evaluation_events')->where(['evaluation_id' => $subNonAcId, 'action' => 'finalized'])->countAllResults());
        foreach ($rankCountsBefore as $table => $count) $this->assertSame($count, $db->table($table)->where('personnel_profile_id', $nonAcademicId)->countAllResults(), "NTF completion must not mutate {$table}");

        // Phase 8C completed-result contract: exact version, immutable report,
        // classification-correct content, owner release, and cross-user denial.
        $ownerCompletedReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $ownerCompletedReq);
        $ownerCompletedResp = $ntfOwnerCtrl->getResult($subNonAcId);
        $this->assertSame(200, $ownerCompletedResp->getStatusCode());
        $completedResult = json_decode((string) $ownerCompletedResp->getBody(), true)['data']['result'];
        $this->assertSame('NON_TEACHING_FACULTY', $completedResult['personnel']['group']);
        $this->assertSame($subNonAcId, $completedResult['evaluation']['version_id']);
        $this->assertSame(1, $completedResult['evaluation']['version_number']);
        $this->assertTrue($completedResult['evaluation']['is_current']);
        $this->assertTrue($completedResult['result_snapshot']['immutable']);
        $this->assertNotEmpty($completedResult['criteria_snapshot']);
        $this->assertNotEmpty($completedResult['items'][0]['criterion_snapshot']);
        $this->assertNotEmpty($completedResult['items'][0]['evidence_snapshot']);
        $persistedReport = $db->table('personnel_evaluation_reports')->where('evaluation_id', $subNonAcId)->orderBy('generated_at', 'DESC')->get()->getRowArray();
        $this->assertEquals((float) $persistedReport['summary_score'], $completedResult['scores']['total'], 'completed result score must come from the immutable report');
        $this->assertSame('NON_TEACHING_FACULTY_EVALUATION_RESULT', $completedResult['summary']['format_key']);
        foreach (['present_rank', 'rank_applied_for', 'recommended_rank', 'effectivity', 'approvals'] as $forbidden) {
            $this->assertArrayNotHasKey($forbidden, $completedResult['summary']);
        }

        $firstResultJson = json_encode($completedResult);
        $reportCount = $db->table('personnel_evaluation_reports')->where('evaluation_id', $subNonAcId)->countAllResults();
        $repeatReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $repeatReq);
        $repeatResult = json_decode((string) $ntfOwnerCtrl->getResult($subNonAcId)->getBody(), true)['data']['result'];
        $this->assertSame($firstResultJson, json_encode($repeatResult));
        $this->assertSame($reportCount, $db->table('personnel_evaluation_reports')->where('evaluation_id', $subNonAcId)->countAllResults());

        $defensivePayload = json_decode((string) $persistedReport['report_payload'], true);
        $defensivePayload['items'][] = [
            'id' => 'pending-evidence-item', 'verification_status' => 'pending',
            'criterion_snapshot' => ['code' => 'A.TEST'],
            'evidence_snapshot' => [['id' => 'pending-evidence', 'original_filename' => 'must-not-contribute.pdf']],
        ];
        $db->table('personnel_evaluation_reports')->where('id', $persistedReport['id'])->update(['report_payload' => json_encode($defensivePayload)]);
        $defensiveReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $defensiveReq);
        $defensiveResult = json_decode((string) $ntfOwnerCtrl->getResult($subNonAcId)->getBody(), true)['data']['result'];
        $lastItem = $defensiveResult['items'][array_key_last($defensiveResult['items'])];
        $this->assertSame([], $lastItem['evidence_snapshot'], 'unverified evidence must not appear as contributing evidence');
        $db->table('personnel_evaluation_reports')->where('id', $persistedReport['id'])->update(['report_payload' => $persistedReport['report_payload']]);

        $crossUserReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlDeanCed, $crossUserReq);
        $this->assertSame(403, $hrCtrlDeanCed->getResult($subNonAcId)->getStatusCode());

        $printReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $printReq);
        $printResp = $ntfOwnerCtrl->printableResult($subNonAcId);
        $this->assertSame(200, $printResp->getStatusCode());
        $this->assertStringContainsString('Non-Teaching Faculty Evaluation Result', (string) $printResp->getBody());
        $this->assertStringNotContainsString('Rank Applied For', (string) $printResp->getBody());

        // Completion is idempotent and every ordinary reviewer mutation is locked.
        $retryReq = $this->createMockRequest('POST', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($hrCtrlAdmin, $retryReq);
        $retryResp = $hrCtrlAdmin->finalizeEvaluation($subNonAcId);
        $this->assertSame(200, $retryResp->getStatusCode());
        $this->assertTrue(json_decode((string) $retryResp->getBody(), true)['data']['idempotent']);
        $this->assertSame(1, $db->table('personnel_evaluation_events')->where(['evaluation_id' => $subNonAcId, 'action' => 'finalized'])->countAllResults());

        foreach ([
            ['verifyItem', 'PATCH', ['verification_status' => 'pending'], [$subNonAcId, $nonAcItem['id']], 409],
            ['rateItem', 'PATCH', [], [$subNonAcId, $nonAcItem['id']], 409],
            ['createDeficiency', 'POST', ['reason' => 'must be locked'], [$subNonAcId], 409],
            ['returnEvaluation', 'POST', ['reason' => 'must be locked'], [$subNonAcId], 422],
            ['markReady', 'POST', [], [$subNonAcId], 422],
        ] as [$method, $httpMethod, $body, $args, $expected]) {
            $lockedReq = $this->createMockRequest($httpMethod, $body, ['Authorization' => 'Bearer fake-token']);
            $this->initController($hrCtrlAdmin, $lockedReq);
            $this->assertSame($expected, $hrCtrlAdmin->{$method}(...$args)->getStatusCode(), "{$method} must reject completed NTF evaluation");
        }

        // A later lineage version makes V1 historical without rewriting or
        // deleting its immutable completed result.
        $historyV2Id = 'r7000000-0000-4000-8000-0000000000f3';
        $historyV2 = $evalNonAcRow;
        $historyV2['id'] = $historyV2Id;
        $historyV2['version_number'] = 2;
        $historyV2['previous_version_id'] = $subNonAcId;
        $historyV2['status'] = 'submitted';
        $historyV2['final_snapshot'] = null;
        $historyV2['finalized_at'] = null;
        $db->table('personnel_evaluations')->insert($historyV2);
        $historicalReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($ntfOwnerCtrl, $historicalReq);
        $historicalResult = json_decode((string) $ntfOwnerCtrl->getResult($subNonAcId)->getBody(), true)['data']['result'];
        $this->assertFalse($historicalResult['evaluation']['is_current']);
        $this->assertSame($historyV2Id, $historicalResult['evaluation']['superseded_by_version_id']);
        $this->assertSame($firstResultJson, json_encode(array_replace_recursive($historicalResult, [
            'evaluation' => ['is_current' => true, 'superseded_by_version_id' => null],
        ])));
        $db->table('personnel_evaluations')->where('id', $historyV2Id)->delete();

        // ---------------------------------------------------------------------
        // STEP 12: GUARDRAILS — DO NOT FINALIZE (PHASE 32 & 33)
        // ---------------------------------------------------------------------
        $this->assertNotSame('completed', $evalRowV1['status']);
        $this->assertNotSame('completed', $evalRowV2['status']);
        $this->assertSame('completed', $evalNonAcRow['status']);

        // Check no final rank placements or promotions were executed
        $rankPlacements = $db->table('personnel_rank_placements')->where('personnel_profile_id', $academicId)->countAllResults();
        $this->assertSame(0, $rankPlacements, 'Final rank placements must not be touched during Step 2');
    }
}
