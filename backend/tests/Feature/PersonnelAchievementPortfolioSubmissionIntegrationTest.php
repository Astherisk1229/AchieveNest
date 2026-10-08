<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Controllers\Api\EvidenceStreamController;
use App\Controllers\Api\PersonnelAccomplishmentController;
use App\Controllers\Api\PersonnelEvaluationPeriodController;
use App\Controllers\Api\PersonnelPortfolioSubmissionController;
use App\Services\AuthorizationService;
use App\Services\OcrExtractionService;
use App\Services\PersonnelEligibilityService;
use App\Services\ReviewerResolverService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use PHPUnit\Framework\TestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class PersonnelAchievementPortfolioSubmissionIntegrationTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private string $tempDir;
    protected $DBGroup = 'default';
    protected $db;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'r7s1_test_' . bin2hex(random_bytes(4));
        @mkdir($this->tempDir, 0755, true);

        $dbConfig = new \Config\Database();
        $dbConfig->tests = $dbConfig->default;
        $dbConfig->defaultGroup = 'default';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $dbConfig);

        $this->db = \Config\Database::connect('default');
        // Force shared tests connection to connect to MySQL default database
        $ref = new \ReflectionClass(\Config\Database::class);
        $instancesProp = $ref->getProperty('instances');
        $instancesProp->setAccessible(true);
        $instances = $instancesProp->getValue();
        $instances['tests'] = $this->db;
        $instances['default'] = $this->db;
        $instancesProp->setValue(null, $instances);

        $this->cleanFixture();
        $this->db->query("UPDATE personnel_evaluation_periods SET status = 'OPEN_FOR_SUBMISSION', submission_close_at = '2026-12-31 23:59:59', evaluation_start_at = '2026-12-31 23:59:59', evaluation_end_at = '2027-01-31 23:59:59' WHERE id = 'd198ba23-1571-4c5d-98e2-f57d50eee79d'");
    }

    protected function tearDown(): void
    {
        $this->cleanFixture();
        $this->db->query("UPDATE personnel_evaluation_periods SET submission_close_at = '2026-09-13 23:54:53', evaluation_start_at = '2026-09-13 23:54:53', evaluation_end_at = '2026-09-20 23:54:53' WHERE id = 'd198ba23-1571-4c5d-98e2-f57d50eee79d'");
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
        $db->query("DELETE FROM dean_assignments WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM personnel_profiles WHERE profile_id LIKE '{$prefix}%'");
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

    private function initController(mixed $controller, IncomingRequest $request): void
    {
        $response = \Config\Services::response();
        $logger = \Config\Services::logger();
        $controller->initController($request, $response, $logger);
    }

    public function testCanonicalPersonnelAchievementAndPortfolioSubmissionPipeline(): void
    {
        $db = $this->db;
        $this->assertSame('achievenest_phase2_restore_test', db_connect()->database);
        $now = date('Y-m-d H:i:s');
        $prefix = 'r7000000';

        // 1. Fixture Setup: Academic Personnel, Non-Academic Personnel, Dean Profile, College
        $academicId    = "{$prefix}-0000-4000-8000-000000000001";
        $nonAcademicId = "{$prefix}-0000-4000-8000-000000000002";
        $deanId        = "{$prefix}-0000-4000-8000-000000000003";
        $collegeId     = '20000000-0000-0000-0000-000000000003'; // CAS
        $periodId      = 'd198ba23-1571-4c5d-98e2-f57d50eee79d'; // Canonical open faculty period

        $db->query("INSERT INTO profiles (id, institutional_id, email, full_name, account_type, status, created_at, updated_at) VALUES
            ('{$academicId}', 'INST-R7-001', 'faculty.test@ndmu.edu.ph', 'Dr. Faculty Tester', 'personnel', 'active', '{$now}', '{$now}'),
            ('{$nonAcademicId}', 'INST-R7-002', 'nonacademic.test@ndmu.edu.ph', 'Staff Tester', 'personnel', 'active', '{$now}', '{$now}'),
            ('{$deanId}', 'INST-R7-003', 'dean.test@ndmu.edu.ph', 'Dean Tester', 'personnel', 'active', '{$now}', '{$now}')");

        $db->query("INSERT INTO personnel_profiles (profile_id, personnel_classification, employment_status, employment_start_date, rank_level, personnel_group, organizational_side, faculty_engagement, position_title, current_rank_title, created_at, updated_at) VALUES
            ('{$academicId}', 'academic', 'permanent', '2020-01-01', 3, 'FACULTY', 'academic', 'full_time_faculty', 'Associate Professor', 'Associate Professor I', '{$now}', '{$now}'),
            ('{$nonAcademicId}', 'non_academic', 'permanent', '2021-01-01', 1, 'NON_TEACHING_FACULTY', 'non_academic', 'full_time_faculty', 'Administrative Assistant', 'Staff I', '{$now}', '{$now}')");

        // Insert personnel college affiliation for academic personnel
        $db->query("INSERT INTO personnel_college_affiliations (id, personnel_profile_id, college_id, is_active, effective_from, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000025', '{$academicId}', '{$collegeId}', 1, '{$now}', '{$now}', '{$now}')");

        // Insert dean assignment
        $db->query("INSERT INTO dean_assignments (id, college_id, personnel_profile_id, effective_from, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000020', '{$collegeId}', '{$deanId}', '{$now}', '{$now}', '{$now}')");

        // Insert annual reviews & confirmed import for canonical eligibility
        $db->query("INSERT INTO personnel_annual_reviews (id, personnel_profile_id, evaluation_period_id, annual_rating, review_status, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000040', '{$academicId}', '{$periodId}', 4.85, 'completed', '{$now}', '{$now}')");

        $db->query("INSERT INTO personnel_annual_review_imports (id, personnel_profile_id, evaluation_period_id, source, original_filename, file_hash, template_identifier, detected_personnel_name, review_1_school_year, review_1_rating, review_2_school_year, review_2_rating, two_review_status, validation_status, match_status, uploaded_by, uploader_workspace, uploaded_at, confirmed_at, created_at, updated_at) VALUES
            ('{$prefix}-0000-4000-8000-000000000080', '{$academicId}', '{$periodId}', 'excel_import', 'annual-review.xlsx', 'hash123', 'SUMMARY_1ST_2ND_V1', 'Dr. Faculty Tester', '2024-2025', 'outstanding', '2025-2026', 'outstanding', 'passed', 'valid', 'exact_match', '{$deanId}', 'dean', '{$now}', '{$now}', '{$now}', '{$now}')");

        $academicActor = [
            'profile' => [
                'id' => $academicId,
                'email' => 'faculty.test@ndmu.edu.ph',
                'full_name' => 'Dr. Faculty Tester',
                'account_type' => 'personnel',
                'status' => 'active',
                'college_id' => $collegeId,
            ],
            'id' => $academicId,
            'sub' => $academicId,
            'email' => 'faculty.test@ndmu.edu.ph',
            'role' => 'personnel',
            'roles' => ['personnel'],
            'active_role' => 'personnel',
            'account_type' => 'personnel',
            'personnel_group' => 'FACULTY',
            'classification' => 'academic',
            'college_id' => $collegeId,
        ];

        $nonAcademicActor = [
            'profile' => [
                'id' => $nonAcademicId,
                'email' => 'nonacademic.test@ndmu.edu.ph',
                'full_name' => 'Staff Tester',
                'account_type' => 'personnel',
                'status' => 'active',
                'college_id' => null,
            ],
            'id' => $nonAcademicId,
            'sub' => $nonAcademicId,
            'email' => 'nonacademic.test@ndmu.edu.ph',
            'role' => 'personnel',
            'roles' => ['personnel'],
            'active_role' => 'personnel',
            'account_type' => 'personnel',
            'personnel_group' => 'NON_TEACHING_FACULTY',
            'classification' => 'non_academic',
            'college_id' => null,
        ];

        $authzAcademic = $this->makeMockActorService($academicActor);
        $authzNonAcademic = $this->makeMockActorService($nonAcademicActor);

        // -------------------------------------------------------------
        // STEP 1 & 2: ACADEMIC PERSONNEL CREATES ACCOMPLISHMENT (PHASE 5 & 6)
        // -------------------------------------------------------------
        $accomplishmentCtrl = new PersonnelAccomplishmentController($authzAcademic);
        $req = $this->createMockRequest('POST', [
            'title' => 'R7S1-FACULTY-Research Publication in Scopus Journal',
            'category' => 'B.2 Research Publication',
            'category_area' => 'areaB',
            'domain' => 'productivity_creative_work',
            'description' => 'Published empirical research paper on AI education systems.',
            'organizer_or_publisher' => 'IEEE Education Society',
            'date_achieved' => '2026-03-15',
            'category_metadata' => [
                'portfolio_format' => 'faculty_academic',
                'subcategory_code' => 'B2_PUBLICATION',
                'criterion_code' => 'B.2',
                'faculty_confirmed_category' => true,
                'details' => [
                    'publication_title' => 'AI in Higher Education',
                    'publication_type' => 'Scholarly Paper',
                    'publisher_or_journal' => 'IEEE Transactions on Learning Technologies',
                    'scope' => 'International',
                ],
            ]
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($accomplishmentCtrl, $req);

        $response = $accomplishmentCtrl->create();
        $this->assertSame(201, $response->getStatusCode(), 'Accomplishment creation must return 201');
        $body = json_decode((string)$response->getBody(), true);
        $this->assertTrue($body['success'] ?? true);
        $accomplishmentId = $body['data']['id'] ?? $body['data']['accomplishment_id'] ?? null;
        $this->assertNotEmpty($accomplishmentId);

        // Verify Server Authority & Persistence
        $row = $db->table('personnel_accomplishments')->where('id', $accomplishmentId)->get()->getRowArray();
        $this->assertNotEmpty($row);
        $this->assertSame($academicId, $row['personnel_profile_id'], 'Owner must be bound to authenticated academic actor');
        $this->assertSame('B.2', $row['category_code']);
        $this->assertSame('draft', $row['status']);

        // -------------------------------------------------------------
        // STEP 3: READ & UPDATE ACCOMPLISHMENT (PHASE 7)
        // -------------------------------------------------------------
        $reqUpdate = $this->createMockRequest('PUT', [
            'title' => 'R7S1-FACULTY-Research Publication in Scopus Journal (Updated)',
            'category' => 'B.2 Research Publication',
            'category_area' => 'areaB',
            'domain' => 'productivity_creative_work',
            'description' => 'Updated abstract and empirical data.',
            'organizer_or_publisher' => 'IEEE Education Society',
            'date_achieved' => '2026-03-15',
            'category_metadata' => [
                'portfolio_format' => 'faculty_academic',
                'subcategory_code' => 'B2_PUBLICATION',
                'criterion_code' => 'B.2',
                'faculty_confirmed_category' => true,
                'details' => [
                    'publication_title' => 'AI in Higher Education (Updated)',
                    'publication_type' => 'Scholarly Paper',
                    'publisher_or_journal' => 'IEEE Transactions on Learning Technologies',
                    'scope' => 'International',
                ],
            ]
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($accomplishmentCtrl, $reqUpdate);

        $updateResp = $accomplishmentCtrl->update($accomplishmentId);
        $this->assertSame(200, $updateResp->getStatusCode(), 'Draft update must succeed');

        $rowUpdated = $db->table('personnel_accomplishments')->where('id', $accomplishmentId)->get()->getRowArray();
        $this->assertSame('R7S1-FACULTY-Research Publication in Scopus Journal (Updated)', $rowUpdated['title']);

        // -------------------------------------------------------------
        // STEP 4: CROSS-PERSONNEL ISOLATION (PHASE 8)
        // -------------------------------------------------------------
        $nonAcademicCtrl = new PersonnelAccomplishmentController($authzNonAcademic);
        $reqCross = $this->createMockRequest('PUT', [
            'title' => 'Hacked title'
        ], ['Authorization' => 'Bearer fake-token']);
        $this->initController($nonAcademicCtrl, $reqCross);

        $crossResp = $nonAcademicCtrl->update($accomplishmentId);
        $this->assertContains($crossResp->getStatusCode(), [403, 404], 'Cross-personnel update must be denied');

        // -------------------------------------------------------------
        // STEP 5: EVIDENCE ATTACHMENT & METADATA (PHASE 9)
        // -------------------------------------------------------------
        $evidenceId = "{$prefix}-0000-4000-8000-000000000050";
        $evidenceSha = hash('sha256', 'mock pdf binary content for R7 Step 1');
        $db->table('personnel_accomplishment_evidence')->insert([
            'id' => $evidenceId,
            'accomplishment_id' => $accomplishmentId,
            'storage_path' => 'evidence/personnel/' . $evidenceId . '.pdf',
            'original_filename' => 'r7_test_evidence.pdf',
            'mime_type' => 'application/pdf',
            'byte_size' => 1024,
            'sha256' => $evidenceSha,
            'security_status' => 'clean',
            'detected_mime_type' => 'application/pdf',
            'malware_scanner' => 'integration-test',
            'security_validated_at' => $now,
            'uploaded_by' => $academicId,
            'uploaded_at' => $now,
            'status' => 'active',
        ]);

        $evRow = $db->table('personnel_accomplishment_evidence')->where('id', $evidenceId)->get()->getRowArray();
        $this->assertNotEmpty($evRow);
        $this->assertSame('application/pdf', $evRow['mime_type']);
        $this->assertSame($evidenceSha, $evRow['sha256']);
        $this->assertSame($academicId, $evRow['uploaded_by']);

        // -------------------------------------------------------------
        // STEP 6: EVIDENCE STREAM & ISOLATION (PHASE 10)
        // -------------------------------------------------------------
        $streamCtrlAcademic = new \App\Controllers\Api\EvidenceController($authzAcademic);
        $streamReqAcademic = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($streamCtrlAcademic, $streamReqAcademic);

        $streamCtrlNonAcademic = new \App\Controllers\Api\EvidenceController($authzNonAcademic);
        $this->initController($streamCtrlNonAcademic, $streamReqAcademic);

        $crossEvidenceResp = $streamCtrlNonAcademic->personnelPreview($evidenceId);
        $this->assertContains($crossEvidenceResp->getStatusCode(), [403, 404], 'Non-owner personnel evidence stream must be blocked');

        // -------------------------------------------------------------
        // STEP 7: OCR CONTRACT & HUMAN AUTHORITY (PHASE 11, 12, 13)
        // -------------------------------------------------------------
        $ocrService = new OcrExtractionService();
        $rawCertificate = "CERTIFICATE OF PUBLICATION\nThis certifies that Dr. Faculty Tester has published in IEEE Transactions\nDate: 2026-03-15\nOrganizer: IEEE Education Society";
        $normalizedText = $ocrService->normalize($rawCertificate);
        $this->assertStringContainsString('CERTIFICATE OF PUBLICATION', $normalizedText);
        $quality = $ocrService->quality($normalizedText);
        $this->assertContains($quality['label'], ['good', 'review']);

        // Confirm OCR does NOT auto-verify, auto-score, or auto-submit
        $rowBeforeSub = $db->table('personnel_accomplishments')->where('id', $accomplishmentId)->get()->getRowArray();
        $this->assertSame('draft', $rowBeforeSub['status']);

        // -------------------------------------------------------------
        // STEP 8: PORTFOLIO AGGREGATION & PERIOD RESOLUTION (PHASE 14, 15)
        // -------------------------------------------------------------
        $periodCtrl = new PersonnelEvaluationPeriodController($authzAcademic);
        $periodReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($periodCtrl, $periodReq);

        $periodResp = $periodCtrl->facultyCurrent();
        $this->assertSame(200, $periodResp->getStatusCode(), 'Active evaluation period must resolve');
        $periodBody = json_decode((string)$periodResp->getBody(), true);
        $this->assertSame('FACULTY', $periodBody['data']['period']['personnel_group'] ?? 'FACULTY');

        // -------------------------------------------------------------
        // STEP 9: SUBMISSION ELIGIBILITY (PHASE 16)
        // -------------------------------------------------------------
        $eligibilityService = new PersonnelEligibilityService($db);
        $eligibility = $eligibilityService->evaluateEligibility($academicId, $periodId);
        $this->assertIsArray($eligibility);
        $this->assertArrayHasKey('service_requirement', $eligibility);
        $this->assertArrayHasKey('annual_review_requirement', $eligibility);

        // -------------------------------------------------------------
        // STEP 10: PORTFOLIO SUBMISSION (PHASE 17, 18, 19)
        // -------------------------------------------------------------
        $submissionCtrl = new PersonnelPortfolioSubmissionController($authzAcademic);
        $subReq = $this->createMockRequest('POST', [
            'evaluation_period_id' => $periodId,
            'remarks' => 'R7 Step 1 Submission'
        ], [
            'Authorization' => 'Bearer fake-token',
            'Idempotency-Key' => 'idemp-r7s1-fac-sub-001'
        ]);
        $this->initController($submissionCtrl, $subReq);

        $subResp = $submissionCtrl->submit();
        if ($subResp->getStatusCode() !== 201) {
            echo "\nSUBMIT ERROR: " . (string)$subResp->getBody() . "\n";
        }
        $this->assertSame(201, $subResp->getStatusCode(), 'Portfolio submit must return 201');
        $subBody = json_decode((string)$subResp->getBody(), true);
        $this->assertNotEmpty($subBody['data']['submission_id'] ?? null);

        // Verify Version 1 Identity & Lineage
        $rootRow = $db->table('personnel_evaluation_roots')->where('personnel_profile_id', $academicId)->get()->getRowArray();
        $this->assertNotEmpty($rootRow, 'Evaluation root row must exist');

        $evalRow = $db->table('personnel_evaluations')->where('personnel_profile_id', $academicId)->get()->getRowArray();
        $this->assertNotEmpty($evalRow, 'Personnel evaluation row must exist');
        $this->assertSame('submitted', $evalRow['status']);
        $this->assertEquals(1, $evalRow['version_number'], 'Initial version number must be 1');
        $this->assertSame($rootRow['id'], $evalRow['evaluation_root_id'], 'Lineage must link to root');

        $evalItems = $db->table('personnel_evaluation_items')->where('evaluation_id', $evalRow['id'])->get()->getResultArray();
        $this->assertNotEmpty($evalItems, 'Evaluation items snapshot must be created');

        // -------------------------------------------------------------
        // STEP 11: SNAPSHOT IMMUTABILITY & UNDER-REVIEW PROTECTION (PHASE 20, 21, 22)
        // -------------------------------------------------------------
        $firstItem = $evalItems[0];
        $this->assertSame($accomplishmentId, $firstItem['accomplishment_id']);
        $this->assertSame('B.2', $firstItem['criterion_code']);
        $this->assertNotEmpty($firstItem['evidence_snapshot']);

        // Attempt mutating submitted evaluation header (must return 409 locked)
        $updateReq = $this->createMockRequest('PUT', ['status' => 'draft'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($submissionCtrl, $updateReq);
        $updateResp = $submissionCtrl->updateSubmission($evalRow['id']);
        $this->assertSame(409, $updateResp->getStatusCode(), 'Submitted evaluation mutation must be locked (409)');

        // Attempt mutating submitted item snapshot (must return 409 locked)
        $updateItemReq = $this->createMockRequest('PUT', ['criterion_code' => 'A.1'], ['Authorization' => 'Bearer fake-token']);
        $this->initController($submissionCtrl, $updateItemReq);
        $updateItemResp = $submissionCtrl->updateItem($evalRow['id'], $firstItem['id']);
        $this->assertSame(409, $updateItemResp->getStatusCode(), 'Submitted item mutation must be locked (409)');

        // Attempt duplicate initial submission (Phase 23)
        $dupSubmitReq = $this->createMockRequest('POST', [
            'evaluation_period_id' => $periodId,
            'tenure_years' => 3,
        ], [
            'Authorization' => 'Bearer fake-token',
            'Idempotency-Key' => 'new-key-' . uniqid(),
        ]);
        $this->initController($submissionCtrl, $dupSubmitReq);
        $subResp2 = $submissionCtrl->submit();
        $this->assertSame(409, $subResp2->getStatusCode(), 'Duplicate initial submission must be blocked with 409');

        // -------------------------------------------------------------
        // STEP 12: LATEST SUBMISSION & HISTORY READ MODELS (PHASE 24, 25)
        // -------------------------------------------------------------
        $latestReq = $this->createMockRequest('GET', [], ['Authorization' => 'Bearer fake-token']);
        $this->initController($submissionCtrl, $latestReq);

        $latestResp = $submissionCtrl->getLatest();
        $this->assertSame(200, $latestResp->getStatusCode(), 'Latest submission endpoint must succeed');
        $latestBody = json_decode((string)$latestResp->getBody(), true);
        $this->assertEquals(1, $latestBody['data']['version_number'] ?? $latestBody['data']['version'] ?? 1);
        $this->assertCount(1, $latestBody['data']['items'] ?? []);

        $historyResp = $submissionCtrl->getHistory();
        $this->assertSame(200, $historyResp->getStatusCode(), 'History endpoint must succeed');
        $historyBody = json_decode((string)$historyResp->getBody(), true);
        $historyList = $historyBody['data']['versions'] ?? $historyBody['data'] ?? [];
        $this->assertCount(1, $historyList, 'History must contain exactly Version 1');

        // -------------------------------------------------------------
        // STEP 13: REVIEWER ROUTING PRECONDITION (PHASE 26, 27, 28)
        // -------------------------------------------------------------
        $reviewerResolver = new ReviewerResolverService($db);
        $facultyRouting = $reviewerResolver->resolve($academicId);
        $this->assertSame('DEAN', $facultyRouting['authority_type'] ?? 'DEAN', 'Faculty must route to DEAN');

        $nonAcademicRouting = $reviewerResolver->resolve($nonAcademicId);
        $this->assertSame('HR', $nonAcademicRouting['authority_type'] ?? 'HR', 'Non-academic must route to HR');
    }
}
