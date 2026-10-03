<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Controllers\Api\CertificateController;
use App\Controllers\Api\StudentPortfolioController;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\CertificateEligibilityService;
use App\Services\CertificateIssuanceService;
use App\Services\CertificatePdfRendererService;
use App\Services\CertificateVerificationQrService;
use App\Services\EventSourceRecordBridgeService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Test\CIUnitTestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class EventAttendanceCertificatePortfolioIntegrationTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private string $tempDir;
    protected $db;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'r6_e2e_' . bin2hex(random_bytes(4));
        @mkdir($this->tempDir, 0755, true);

        $this->db = \Config\Database::connect('default');
        if (! $this->db->tableExists('certificate_issuances')) {
            $this->markTestSkipped('certificate_issuances table is not present in the current database schema.');
        }
        $this->cleanFixture($this->db);
    }

    protected function tearDown(): void
    {
        if (isset($this->db)) {
            $this->cleanFixture($this->db);
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

    private function cleanFixture(BaseConnection $db): void
    {
        $prefix = 'e6000000';
        if ($db->tableExists('certificate_idempotency')) {
            $db->query("DELETE FROM certificate_idempotency WHERE actor_profile_id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('issued_certificates')) {
            $db->query("DELETE FROM issued_certificates WHERE recipient_profile_id LIKE '{$prefix}%' OR id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('certificate_issuance_snapshots')) {
            $db->query("DELETE FROM certificate_issuance_snapshots WHERE certificate_issuance_id IN (SELECT id FROM certificate_issuances WHERE student_id LIKE '{$prefix}%' OR id LIKE '{$prefix}%')");
        }
        if ($db->tableExists('certificate_issuances')) {
            $db->query("DELETE FROM certificate_issuances WHERE student_id LIKE '{$prefix}%' OR id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('certificate_signature_assets')) {
            $db->query("DELETE FROM certificate_signature_assets WHERE id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('certificate_signatory_authorizations')) {
            $db->query("DELETE FROM certificate_signatory_authorizations WHERE id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('certificate_template_versions')) {
            $db->query("DELETE FROM certificate_template_versions WHERE id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('certificate_template_families')) {
            $db->query("DELETE FROM certificate_template_families WHERE id LIKE '{$prefix}%'");
        }
        if ($db->tableExists('event_student_source_records')) {
            $db->query("DELETE FROM event_student_source_records WHERE event_id LIKE '{$prefix}%'");
        }
        $db->query("DELETE FROM attendance_records WHERE session_id IN (SELECT id FROM attendance_sessions WHERE event_id LIKE '{$prefix}%')");
        $db->query("DELETE FROM attendance_sessions WHERE event_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM student_portfolio_records WHERE student_profile_id LIKE '{$prefix}%' OR id LIKE '{$prefix}%'");
        $db->query("DELETE FROM portfolio_subcategories WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM portfolio_categories WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM organization_moderator_assignments WHERE personnel_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM events WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM organizations WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM profiles WHERE id LIKE '{$prefix}%'");
    }

    private function createPngFile(string $filename): string
    {
        $path = $this->tempDir . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));
        return $path;
    }

    private function setupFixture(): array
    {
        $db = $this->db;
        $now = date('Y-m-d H:i:s');
        $prefix = 'e6000000';

        $studentAId = "{$prefix}-0000-4000-8000-000000000001";
        $studentBId = "{$prefix}-0000-4000-8000-000000000002";
        $modId      = "{$prefix}-0000-4000-8000-000000000005";
        $osadId     = "{$prefix}-0000-4000-8000-000000000004";
        $orgId      = "{$prefix}-0000-4000-8000-000000000006";
        $eventId    = "{$prefix}-0000-4000-8000-000000000007";
        $sessionId  = "{$prefix}-0000-4000-8000-000000000008";
        $catId      = "{$prefix}-0000-4000-8000-000000000060";
        $subcatId   = "{$prefix}-0000-4000-8000-000000000061";
        $famId      = "{$prefix}-0000-4000-8000-000000000040";
        $verId      = "{$prefix}-0000-4000-8000-000000000050";
        $sigAssetId = "{$prefix}-0000-4000-8000-000000000070";
        $sigAuthId  = "{$prefix}-0000-4000-8000-000000000080";

        // Profiles
        $db->table('profiles')->insert([
            'id' => $studentAId,
            'institutional_id' => '2026-E6-001',
            'full_name' => 'Student A (R6 E2E Attendee)',
            'email' => 'student.a.e6@ndmu.edu.ph',
            'account_type' => 'student',
            'created_at' => $now,
        ]);

        $db->table('profiles')->insert([
            'id' => $studentBId,
            'institutional_id' => '2026-E6-002',
            'full_name' => 'Student B (R6 E2E Non-Attendee)',
            'email' => 'student.b.e6@ndmu.edu.ph',
            'account_type' => 'student',
            'created_at' => $now,
        ]);

        $db->table('profiles')->insert([
            'id' => $modId,
            'institutional_id' => '2026-E6-MOD',
            'full_name' => 'Org Moderator (R6 E2E)',
            'email' => 'moderator.e6@ndmu.edu.ph',
            'account_type' => 'personnel',
            'created_at' => $now,
        ]);

        $db->table('profiles')->insert([
            'id' => $osadId,
            'institutional_id' => '2026-E6-OSAD',
            'full_name' => 'OSAD Administrator (R6 E2E)',
            'email' => 'osad.admin.e6@ndmu.edu.ph',
            'account_type' => 'personnel',
            'created_at' => $now,
        ]);

        // Organization & Moderator Assignment
        $db->table('organizations')->insert([
            'id' => $orgId,
            'name' => 'R6 E2E Junior Philippine Institute of Accountants',
            'code' => 'R6_JPIA',
            'category' => 'academic_college',
            'scope' => 'college',
            'status' => 'active',
            'created_at' => $now,
        ]);

        $db->table('organization_moderator_assignments')->insert([
            'id' => "{$prefix}-0000-4000-8000-000000000010",
            'organization_id' => $orgId,
            'personnel_profile_id' => $modId,
            'is_active' => 1,
            'effective_from' => '2026-01-01',
            'effective_until' => null,
            'created_at' => $now,
        ]);

        // Portfolio Categories
        $cat = $db->table('portfolio_categories')->where('code', 'SEMINAR_TRAINING')->get()->getRowArray();
        if (!$cat) {
            $db->table('portfolio_categories')->insert([
                'id' => $catId,
                'code' => 'SEMINAR_TRAINING',
                'name' => 'Seminars & Trainings',
                'sort_order' => 1,
                'status' => 'active',
            ]);
        } else {
            $catId = $cat['id'];
        }

        $subcat = $db->table('portfolio_subcategories')->where('category_id', $catId)->where('code', 'LEADERSHIP_CONFERENCE')->get()->getRowArray();
        if (!$subcat) {
            $db->table('portfolio_subcategories')->insert([
                'id' => $subcatId,
                'category_id' => $catId,
                'code' => 'LEADERSHIP_CONFERENCE',
                'name' => 'Executive Leadership Summit',
                'sort_order' => 1,
                'status' => 'active',
            ]);
            $subcatCode = 'LEADERSHIP_CONFERENCE';
        } else {
            $subcatId = $subcat['id'];
            $subcatCode = $subcat['code'];
        }

        // Event
        $db->table('events')->insert([
            'id' => $eventId,
            'organizer_profile_id' => $modId,
            'organization_id' => $orgId,
            'title' => 'R6 Canonical Leadership & Accountancy Conference 2026',
            'venue' => 'Main Auditorium',
            'event_type' => 'general',
            'status' => 'completed',
            'start_time' => $now,
            'end_time' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Attendance Session
        $db->table('attendance_sessions')->insert([
            'id' => $sessionId,
            'event_id' => $eventId,
            'session_name' => 'Morning Plenary Check-In',
            'session_type' => 'morning',
            'status' => 'closed',
            'check_in_start' => '2026-09-25 08:00:00',
            'check_in_end' => '2026-09-25 10:00:00',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // Attendance Record for Student A
        $db->table('attendance_records')->insert([
            'id' => "{$prefix}-0000-4000-8000-000000000020",
            'session_id' => $sessionId,
            'attendee_profile_id' => $studentAId,
            'scanned_by' => $modId,
            'checked_in_at' => '2026-09-25 08:15:00',
            'verification_method' => 'qr_scan',
        ]);

        // Template family & version
        $sigPath = $this->createPngFile('sig.png');

        $db->table('certificate_template_families')->insert([
            'id' => $famId,
            'name' => 'R6 Leadership Certificate Template',
            'code' => 'R6_E2E_LEADERSHIP',
            'certificate_purpose' => 'PARTICIPATION',
            'status' => 'active',
            'is_default' => 1,
            'created_at' => $now,
        ]);

        $db->table('certificate_template_versions')->insert([
            'id' => $verId,
            'family_id' => $famId,
            'version_number' => 1,
            'layout_config' => json_encode([
                'layout_schema' => ['theme_id' => 'royal_navy', 'orientation' => 'landscape', 'page_size' => 'A4'],
                'content_schema' => [
                    'heading' => 'Certificate of Participation',
                    'recipient_lead_in' => 'Presented to',
                    'body' => '{{recipient_name}} for active participation in {{activity_title}}.',
                    'footer_note' => 'Issued on {{issued_date}}. Certificate: {{certificate_number}}.',
                ],
            ]),
            'placeholder_contract_json' => json_encode([
                ['name' => 'recipient_name', 'requirement_type' => 'REQUIRED'],
                ['name' => 'activity_title', 'requirement_type' => 'REQUIRED'],
                ['name' => 'issued_date', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
                ['name' => 'certificate_number', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
            ]),
            'signatory_slots_json' => json_encode([
                ['role_code' => 'OSAD_DIRECTOR', 'display_label' => 'OSAD Director', 'requirement_type' => 'REQUIRED', 'signature_required' => true, 'display_order' => 1],
            ]),
            'status' => 'active',
            'created_at' => $now,
        ]);

        // Signatory asset & authorization
        $db->table('certificate_signature_assets')->insert([
            'id' => $sigAssetId,
            'person_id' => $osadId,
            'storage_path' => $sigPath,
            'status' => 'APPROVED',
            'valid_from' => '2026-01-01',
            'valid_until' => null,
            'approved_by' => $osadId,
            'approved_at' => $now,
            'created_at' => $now,
        ]);

        $db->table('certificate_signatory_authorizations')->insert([
            'id' => $sigAuthId,
            'person_id' => $osadId,
            'role_code' => 'OSAD_DIRECTOR',
            'status' => 'ACTIVE',
            'valid_from' => '2026-01-01',
            'valid_until' => null,
            'created_by' => $osadId,
            'created_at' => $now,
        ]);

        return [
            'studentAId' => $studentAId,
            'studentBId' => $studentBId,
            'modId' => $modId,
            'osadId' => $osadId,
            'orgId' => $orgId,
            'eventId' => $eventId,
            'sessionId' => $sessionId,
            'famId' => $famId,
            'verId' => $verId,
            'catId' => $catId,
            'subcatId' => $subcatId,
            'subcatCode' => $subcatCode,
        ];
    }

    private function createPortfolioController(array $actor): StudentPortfolioController
    {
        $actorServiceMock = $this->createMock(AuthenticatedActorService::class);
        $actorServiceMock->method('resolveActor')->willReturn($actor);

        $authz = new AuthorizationService(actorService: $actorServiceMock);

        $controller = new StudentPortfolioController(authz: $authz, db: $this->db);
        $request = new \CodeIgniter\HTTP\IncomingRequest(config('App'), new \CodeIgniter\HTTP\URI(), null, new \CodeIgniter\HTTP\UserAgent());
        $response = new \CodeIgniter\HTTP\Response(config('App'));
        $logger = \Config\Services::logger();
        $controller->initController($request, $response, $logger);

        return $controller;
    }

    private function createCertificateController(array $actor, ?CertificateIssuanceService $issuance = null, ?CertificatePdfRendererService $pdfRenderer = null): CertificateController
    {
        $actorServiceMock = $this->createMock(AuthenticatedActorService::class);
        $actorServiceMock->method('resolveActor')->willReturn($actor);

        $controller = new CertificateController(actors: $actorServiceMock, issuance: $issuance, pdfRenderer: $pdfRenderer, db: $this->db);
        $request = new \CodeIgniter\HTTP\IncomingRequest(config('App'), new \CodeIgniter\HTTP\URI(), null, new \CodeIgniter\HTTP\UserAgent());
        $response = new \CodeIgniter\HTTP\Response(config('App'));
        $logger = \Config\Services::logger();
        $controller->initController($request, $response, $logger);

        return $controller;
    }

    public function testCompleteR6EventAttendanceCertificatePortfolioLifecycle(): void
    {
        $fixture = $this->setupFixture();
        $db = $this->db;

        $modActor = [
            'user' => ['id' => 'u-mod'],
            'profile' => ['id' => $fixture['modId'], 'account_type' => 'personnel'],
            'roles' => ['organization_moderator'],
        ];

        $osadActor = [
            'user' => ['id' => 'u-osad'],
            'profile' => ['id' => $fixture['osadId'], 'account_type' => 'personnel'],
            'roles' => ['osad_staff'],
        ];

        $studentAActor = [
            'user' => ['id' => 'u-stu-a'],
            'profile' => ['id' => $fixture['studentAId'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        $studentBActor = [
            'user' => ['id' => 'u-stu-b'],
            'profile' => ['id' => $fixture['studentBId'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        // 1. Record Participant Facts (Student A attended, Student B attended fact recorded)
        $bridgeService = new EventSourceRecordBridgeService(db: $db);
        $facts = $bridgeService->recordFacts($fixture['eventId'], [
            [
                'student_id' => $fixture['studentAId'],
                'category_code' => 'SEMINAR_TRAINING',
                'subcategory_code' => $fixture['subcatCode'],
                'verified_engagement_outcome' => 'participated',
                'facts_finalized' => 1,
                'verification_status' => 'verified',
            ],
            [
                'student_id' => $fixture['studentBId'],
                'category_code' => 'SEMINAR_TRAINING',
                'subcategory_code' => $fixture['subcatCode'],
                'verified_engagement_outcome' => 'participated',
                'facts_finalized' => 1,
                'verification_status' => 'verified',
            ],
        ], $fixture['modId']);
        $this->assertCount(2, $facts);

        // 2. Attendance Server Authority Verification: Student A verified=true, Student B=false
        $this->assertTrue($bridgeService->hasCanonicalAttendanceEvidence($fixture['eventId'], $fixture['studentAId']));
        $this->assertFalse($bridgeService->hasCanonicalAttendanceEvidence($fixture['eventId'], $fixture['studentBId']));

        // 3. Source Record Resolution: Student A created, Student B blocked
        $resolveRes = $bridgeService->resolve($fixture['eventId'], [$fixture['studentAId'], $fixture['studentBId']], $fixture['modId']);
        $this->assertCount(2, $resolveRes);

        $resA = null;
        $resB = null;
        foreach ($resolveRes as $r) {
            if ($r['student_id'] === $fixture['studentAId']) $resA = $r;
            if ($r['student_id'] === $fixture['studentBId']) $resB = $r;
        }

        $this->assertSame('CREATED', $resA['bridge_status']);
        $this->assertSame('BLOCKED', $resB['bridge_status']);
        $sourceRecordId = $resA['source_record_id'];
        $this->assertNotEmpty($sourceRecordId);

        // 4. Pre-Issuance Portfolio Read: Verified achievement exists, certificate is null
        $controllerA = $this->createPortfolioController($studentAActor);
        $respPre = $controllerA->index();
        $this->assertSame(200, $respPre->getStatusCode());
        $bodyPre = json_decode($respPre->getBody(), true);
        $recordsPre = $bodyPre['data']['records'] ?? [];
        $this->assertNotEmpty($recordsPre);
        $matchedPre = null;
        foreach ($recordsPre as $r) {
            if ($r['id'] === $sourceRecordId) {
                $matchedPre = $r;
                break;
            }
        }
        $this->assertNotNull($matchedPre);
        $this->assertSame('verified', $matchedPre['status']);
        $this->assertNull($matchedPre['certificate']);

        // 5. Cross-Student Isolation: Student B cannot see Student A's achievement
        $controllerB = $this->createPortfolioController($studentBActor);
        $respB = $controllerB->index();
        $this->assertSame(200, $respB->getStatusCode());
        $bodyB = json_decode($respB->getBody(), true);
        $recordsB = $bodyB['data']['records'] ?? [];
        $bRecordIds = array_column($recordsB, 'id');
        $this->assertNotContains($sourceRecordId, $bRecordIds);

        // 6. Certificate Readiness Evaluation
        $sourceRow = $db->table('student_portfolio_records spr')
            ->select('spr.*,pc.code category_code,pc.name category_name')
            ->join('portfolio_categories pc', 'pc.id=spr.category_id')
            ->where('spr.id', $sourceRecordId)->get()->getRowArray();
        $eligibility = (new CertificateEligibilityService())->resolve($sourceRow + ['structured_attributes' => json_decode($sourceRow['structured_metadata'] ?? '{}', true) ?: []]);
        $this->assertSame('ELIGIBLE', $eligibility['eligibility_status']);

        // 7. Certificate Issuance
        $issuanceService = new CertificateIssuanceService(db: $db);
        $idempotencyKey = 'r6_feature_key_' . bin2hex(random_bytes(4));
        $issueResult = $issuanceService->issue($modActor, [
            'idempotency_key' => $idempotencyKey,
            'source_record_id' => $sourceRecordId,
            'student_id' => $fixture['studentAId'],
            'template_version_id' => $fixture['verId'],
            'certificate_purpose' => 'PARTICIPATION',
            'signatories' => ['OSAD_DIRECTOR' => $fixture['osadId']],
        ]);

        $this->assertTrue($issueResult['issued']);
        $this->assertSame('ISSUED', $issueResult['status']);
        $certId = $issueResult['certificate']['id'];
        $certNumber = $issueResult['certificate']['certificate_number'];
        $publicId = $issueResult['certificate']['public_verification_id'];
        $this->assertNotEmpty($certId);
        $this->assertNotEmpty($publicId);

        // 8. Issuance Idempotency
        $replayResult = $issuanceService->issue($modActor, [
            'idempotency_key' => $idempotencyKey,
            'source_record_id' => $sourceRecordId,
            'student_id' => $fixture['studentAId'],
            'template_version_id' => $fixture['verId'],
            'certificate_purpose' => 'PARTICIPATION',
            'signatories' => ['OSAD_DIRECTOR' => $fixture['osadId']],
        ]);
        $this->assertSame($certId, $replayResult['certificate']['id']);

        // 9. Post-Issuance Portfolio Projection (Index and Show Parity)
        $controllerA = $this->createPortfolioController($studentAActor);
        $respPost = $controllerA->index();
        $this->assertSame(200, $respPost->getStatusCode());
        $bodyPost = json_decode($respPost->getBody(), true);
        $recordsPost = $bodyPost['data']['records'] ?? [];
        $matchedPost = null;
        foreach ($recordsPost as $r) {
            if ($r['id'] === $sourceRecordId) {
                $matchedPost = $r;
                break;
            }
        }
        $this->assertNotNull($matchedPost['certificate']);
        $this->assertSame('ISSUED', $matchedPost['certificate']['status']);
        $this->assertTrue($matchedPost['certificate']['downloadable']);
        $this->assertSame("/api/v1/certificates/{$certId}/pdf", $matchedPost['certificate']['pdf_url']);
        $this->assertSame("/verify/certificate/{$publicId}", $matchedPost['certificate']['verification_url']);

        // Single Record Parity
        $respSingle = $controllerA->get($sourceRecordId);
        $this->assertSame(200, $respSingle->getStatusCode());
        $bodySingle = json_decode($respSingle->getBody(), true);
        $this->assertEquals($matchedPost['certificate'], $bodySingle['data']['record']['certificate']);

        // 10. PDF Rendering & QR Loop
        $pdfRenderer = new CertificatePdfRendererService(db: $db, tempDir: $this->tempDir);
        $pdfContent = $pdfRenderer->render($certId);
        $this->assertStringStartsWith('%PDF-', $pdfContent);
        $this->assertGreaterThan(1000, strlen($pdfContent));

        // QR verification payload check
        $qrService = new CertificateVerificationQrService();
        $qrDataUri = $qrService->generateDataUri('https://achievenest.ndmu.edu.ph/verify/certificate/' . $publicId);
        $this->assertStringStartsWith('data:image/png;base64,', $qrDataUri);

        // Authenticated PDF download via CertificateController
        $certControllerA = $this->createCertificateController($studentAActor, $issuanceService, $pdfRenderer);
        $respPdf = $certControllerA->pdf($certId);
        $this->assertSame(200, $respPdf->getStatusCode());
        $this->assertSame('application/pdf', $respPdf->getHeaderLine('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $respPdf->getBody());

        // 11. Revocation Flow (as OSAD)
        $revokeResult = $issuanceService->revoke($osadActor, $certId, [
            'idempotency_key' => 'r6_revoke_key_' . bin2hex(random_bytes(4)),
            'reason' => 'Administrative testing revocation',
        ]);
        $this->assertTrue($revokeResult['revoked']);
        $this->assertSame('REVOKED', $revokeResult['status']);

        // 12. Portfolio Revocation Sync
        $controllerA = $this->createPortfolioController($studentAActor);
        $respRevoked = $controllerA->index();
        $this->assertSame(200, $respRevoked->getStatusCode());
        $bodyRevoked = json_decode($respRevoked->getBody(), true);
        $recordsRevoked = $bodyRevoked['data']['records'] ?? [];
        $matchedRevoked = null;
        foreach ($recordsRevoked as $r) {
            if ($r['id'] === $sourceRecordId) {
                $matchedRevoked = $r;
                break;
            }
        }
        $this->assertSame('REVOKED', $matchedRevoked['certificate']['status']);
        $this->assertFalse($matchedRevoked['certificate']['downloadable']);
        $this->assertNull($matchedRevoked['certificate']['pdf_url']);
        $this->assertNotNull($matchedRevoked['certificate']['verification_url']);

        // Blocked PDF download for revoked certificate (HTTP 409)
        $respRevokedPdf = $certControllerA->pdf($certId);
        $this->assertSame(409, $respRevokedPdf->getStatusCode());
        $bodyRevokedPdf = json_decode($respRevokedPdf->getBody(), true);
        $this->assertSame('CERTIFICATE_REVOKED', $bodyRevokedPdf['error']['code']);

        // 13. Reissue Flow (as OSAD on a new issued cert)
        // Issue a second certificate for reissue testing
        $idempotencyKey2 = 'r6_feature_key_reissue_' . bin2hex(random_bytes(4));
        $issueResult2 = $issuanceService->issue($modActor, [
            'idempotency_key' => $idempotencyKey2,
            'source_record_id' => $sourceRecordId,
            'student_id' => $fixture['studentAId'],
            'template_version_id' => $fixture['verId'],
            'certificate_purpose' => 'PARTICIPATION',
            'signatories' => ['OSAD_DIRECTOR' => $fixture['osadId']],
        ]);
        $certId2 = $issueResult2['certificate']['id'];

        $reissueResult = $issuanceService->reissue($osadActor, $certId2, [
            'reissue_reason' => 'Replacement issued with verified title correction',
            'idempotency_key' => 'r6_reissue_key_' . bin2hex(random_bytes(4)),
            'signatories' => ['OSAD_DIRECTOR' => $fixture['osadId']],
        ]);
        $this->assertTrue($reissueResult['reissued']);
        $newCertId = $reissueResult['certificate']['id'];
        $newPublicId = $reissueResult['certificate']['public_verification_id'];
        $this->assertSame('ISSUED', $reissueResult['status']);

        // Verify old certificate is now SUPERSEDED in DB
        $oldCertDb = $db->table('certificate_issuances')->where('id', $certId2)->get()->getRowArray();
        $this->assertSame('SUPERSEDED', $oldCertDb['status']);
        $this->assertSame($newCertId, $oldCertDb['superseded_by_certificate_id']);

        // 14. Portfolio Reissue Sync: Replacement is primary active certificate
        $controllerA = $this->createPortfolioController($studentAActor);
        $respReissued = $controllerA->index();
        $this->assertSame(200, $respReissued->getStatusCode());
        $bodyReissued = json_decode($respReissued->getBody(), true);
        $recordsReissued = $bodyReissued['data']['records'] ?? [];
        $matchedReissued = null;
        foreach ($recordsReissued as $r) {
            if ($r['id'] === $sourceRecordId) {
                $matchedReissued = $r;
                break;
            }
        }
        $this->assertSame('ISSUED', $matchedReissued['certificate']['status']);
        $this->assertTrue($matchedReissued['certificate']['downloadable']);
        $this->assertSame("/api/v1/certificates/{$newCertId}/pdf", $matchedReissued['certificate']['pdf_url']);
        $this->assertSame($newCertId, $matchedReissued['certificate']['id']);
        $this->assertNotNull($matchedReissued['certificate']['previous_certificate']);
        $this->assertSame($certId2, $matchedReissued['certificate']['previous_certificate']['id']);
        $this->assertSame('SUPERSEDED', $matchedReissued['certificate']['previous_certificate']['status']);

        // 15. PDF & QR Contract for Replacement
        // Old superseded PDF blocked (HTTP 409)
        $certControllerOld = $this->createCertificateController($studentAActor, $issuanceService, $pdfRenderer);
        $respOldPdf = $certControllerOld->pdf($certId2);
        $this->assertSame(409, $respOldPdf->getStatusCode());
        $bodyOldPdf = json_decode($respOldPdf->getBody(), true);
        $this->assertSame('CERTIFICATE_SUPERSEDED', $bodyOldPdf['error']['code']);

        // New replacement PDF allowed (HTTP 200)
        $certControllerNew = $this->createCertificateController($studentAActor, $issuanceService, $pdfRenderer);
        $respNewPdf = $certControllerNew->pdf($newCertId);
        $this->assertSame(200, $respNewPdf->getStatusCode());
        $this->assertSame('application/pdf', $respNewPdf->getHeaderLine('Content-Type'));
        $this->assertStringStartsWith('%PDF-', $respNewPdf->getBody());
    }
}
