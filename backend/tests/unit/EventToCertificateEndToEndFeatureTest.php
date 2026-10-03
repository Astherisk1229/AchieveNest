<?php

namespace Tests\Unit;

use App\Controllers\Api\CertificateController;
use App\Services\AuthenticatedActorService;
use App\Services\CertificateEligibilityService;
use App\Services\CertificateIssuanceService;
use App\Services\CertificatePdfRendererService;
use App\Services\EventSourceRecordBridgeService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\Response;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\Test\CIUnitTestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class EventToCertificateEndToEndFeatureTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private string $tempDir;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'e2e_cert_' . bin2hex(random_bytes(4));
        @mkdir($this->tempDir, 0755, true);

        $db = \Config\Database::connect('default');
        $this->cleanFixture($db);
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect('default');
        $this->cleanFixture($db);
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
        $prefix = 'eb000000';
        $db->query("DELETE FROM audit_logs WHERE actor_profile_id LIKE '{$prefix}%' OR target_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_idempotency WHERE actor_profile_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_issuance_snapshots WHERE certificate_issuance_id IN (SELECT id FROM certificate_issuances WHERE student_id LIKE '{$prefix}%') OR id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_issuances WHERE student_id LIKE '{$prefix}%' OR id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_signature_assets WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_signatory_authorizations WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_template_versions WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM certificate_template_families WHERE id LIKE '{$prefix}%'");
        $db->query("DELETE FROM event_student_source_records WHERE event_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM attendance_records WHERE session_id IN (SELECT id FROM attendance_sessions WHERE event_id LIKE '{$prefix}%')");
        $db->query("DELETE FROM attendance_sessions WHERE event_id LIKE '{$prefix}%'");
        $db->query("DELETE FROM student_portfolio_records WHERE id LIKE '{$prefix}%'");
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

    private function setupCompleteE2eFixture(BaseConnection $db): array
    {
        $prefix = 'eb000000';
        $studentAId = "{$prefix}-0000-4000-8000-000000000001";
        $studentBId = "{$prefix}-0000-4000-8000-000000000002";
        $studentCId = "{$prefix}-0000-4000-8000-000000000003"; // Other unrelated student
        $osadId = "{$prefix}-0000-4000-8000-000000000004";
        $modId = "{$prefix}-0000-4000-8000-000000000005";
        $orgId = "{$prefix}-0000-4000-8000-000000000006";
        $eventId = "{$prefix}-0000-4000-8000-000000000007";
        $sessionId = "{$prefix}-0000-4000-8000-000000000008";
        $catId = "{$prefix}-0000-4000-8000-000000000060";
        $subcatId = "{$prefix}-0000-4000-8000-000000000061";
        $famId = "{$prefix}-0000-4000-8000-000000000040";
        $verId = "{$prefix}-0000-4000-8000-000000000050";
        $sigAssetId = "{$prefix}-0000-4000-8000-000000000080";
        $sigAuthId = "{$prefix}-0000-4000-8000-000000000081";

        $now = date('Y-m-d H:i:s');
        $today = date('Y-m-d');

        // 1. Profiles
        $db->table('profiles')->insert(['id' => $studentAId, 'account_type' => 'student', 'email' => 'student.a@ndmu.edu.ph', 'full_name' => 'Student A Attended', 'institutional_id' => 'STU-A-01', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $studentBId, 'account_type' => 'student', 'email' => 'student.b@ndmu.edu.ph', 'full_name' => 'Student B Absent', 'institutional_id' => 'STU-B-02', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $studentCId, 'account_type' => 'student', 'email' => 'student.c@ndmu.edu.ph', 'full_name' => 'Student C Unrelated', 'institutional_id' => 'STU-C-03', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $osadId, 'account_type' => 'personnel', 'email' => 'osad.director@ndmu.edu.ph', 'full_name' => 'Dr. OSAD Director', 'designation_title' => 'Director of Student Affairs', 'institutional_id' => 'OSAD-DIR-01', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $modId, 'account_type' => 'personnel', 'email' => 'moderator@ndmu.edu.ph', 'full_name' => 'Prof. Org Moderator', 'designation_title' => 'Faculty Moderator', 'institutional_id' => 'MOD-01', 'created_at' => $now]);

        // 2. Organization & Event
        $db->table('organizations')->insert(['id' => $orgId, 'name' => 'Computer Society', 'code' => 'COMPSOC_EB', 'category' => 'academic_college', 'scope' => 'college', 'status' => 'active', 'created_at' => $now]);
        $db->table('events')->insert([
            'id' => $eventId,
            'organizer_profile_id' => $modId,
            'organization_id' => $orgId,
            'title' => 'NDMU Tech Summit 2026',
            'venue' => 'Main Auditorium',
            'event_type' => 'general',
            'status' => 'completed',
            'start_time' => $now,
            'end_time' => $now,
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $db->table('organization_moderator_assignments')->insert(['id' => "{$prefix}-0000-4000-8000-000000000099", 'personnel_profile_id' => $modId, 'organization_id' => $orgId, 'is_active' => 1, 'effective_from' => '2026-01-01', 'effective_until' => null, 'created_at' => $now]);

        // 3. Attendance Session (closed)
        $db->table('attendance_sessions')->insert([
            'id' => $sessionId,
            'event_id' => $eventId,
            'session_name' => 'Morning General Session',
            'session_type' => 'morning',
            'status' => 'closed',
            'check_in_start' => '2026-09-25 08:00:00',
            'check_in_end' => '2026-09-25 12:00:00',
            'created_at' => $now,
            'updated_at' => $now,
        ]);

        // 4. Attendance Record: Student A attended, Student B did not
        $db->table('attendance_records')->insert([
            'id' => "{$prefix}-0000-4000-8000-000000000011",
            'session_id' => $sessionId,
            'attendee_profile_id' => $studentAId,
            'scanned_by' => $modId,
            'checked_in_at' => '2026-09-25 08:30:00',
            'verification_method' => 'qr_scan',
        ]);

        // 5. Portfolio Category & Subcategory
        $cat = $db->table('portfolio_categories')->where('code', 'SEMINAR_TRAINING')->get()->getRowArray();
        if (!$cat) {
            $db->table('portfolio_categories')->insert(['id' => $catId, 'code' => 'SEMINAR_TRAINING', 'name' => 'Seminar Training', 'sort_order' => 1, 'status' => 'active', 'created_at' => $now]);
        } else {
            $catId = $cat['id'];
        }

        $subcat = $db->table('portfolio_subcategories')->where('category_id', $catId)->get()->getRowArray();
        if (!$subcat) {
            $db->table('portfolio_subcategories')->insert(['id' => $subcatId, 'category_id' => $catId, 'code' => 'TECH_SUMMIT_SUB', 'name' => 'Tech Summit Track', 'sort_order' => 1, 'status' => 'active', 'created_at' => $now]);
            $subcatCode = 'TECH_SUMMIT_SUB';
        } else {
            $subcatId = $subcat['id'];
            $subcatCode = $subcat['code'];
        }

        // 6. Template Family & Version
        $db->table('certificate_template_families')->insert(['id' => $famId, 'name' => 'Participation Family', 'code' => 'PARTICIPATION_EB', 'certificate_purpose' => 'PARTICIPATION', 'status' => 'active', 'is_default' => 1, 'created_at' => $now]);
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

        // 7. Signatory signature asset and active authorization
        $sigPath = $this->createPngFile('director_e2e_sig.png');
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
            'student_a_id' => $studentAId,
            'student_b_id' => $studentBId,
            'student_c_id' => $studentCId,
            'osad_id' => $osadId,
            'mod_id' => $modId,
            'org_id' => $orgId,
            'event_id' => $eventId,
            'session_id' => $sessionId,
            'cat_id' => $catId,
            'subcat_id' => $subcatId,
            'subcat_code' => $subcatCode,
            'fam_id' => $famId,
            'ver_id' => $verId,
            'sig_asset_id' => $sigAssetId,
        ];
    }

    private function createActorService(?array $actor): AuthenticatedActorService
    {
        $mock = $this->createMock(AuthenticatedActorService::class);
        $mock->method('resolveActor')->willReturn($actor);
        return $mock;
    }

    public function testCompleteCertificateFeatureEndToEndPipeline(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->setupCompleteE2eFixture($db);

        $osadActor = [
            'user' => ['id' => 'u-osad'],
            'profile' => ['id' => $ctx['osad_id'], 'account_type' => 'personnel'],
            'roles' => ['osad_staff'],
        ];
        $modActor = [
            'user' => ['id' => 'u-mod'],
            'profile' => ['id' => $ctx['mod_id'], 'account_type' => 'personnel'],
            'roles' => ['organization_moderator'],
        ];
        $studentAActor = [
            'user' => ['id' => 'u-stu-a'],
            'profile' => ['id' => $ctx['student_a_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];
        $studentCActor = [
            'user' => ['id' => 'u-stu-c'],
            'profile' => ['id' => $ctx['student_c_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        // -------------------------------------------------------------
        // Step 1: Record Bridge Participation Facts & Check Attendance Evidence (Phase 5, 6, 7)
        // -------------------------------------------------------------
        $bridgeService = new EventSourceRecordBridgeService(db: $db);

        $recordResults = $bridgeService->recordFacts($ctx['event_id'], [
            [
                'student_id' => $ctx['student_a_id'],
                'category_code' => 'SEMINAR_TRAINING',
                'subcategory_code' => $ctx['subcat_code'],
                'verified_engagement_outcome' => 'participated',
                'facts_finalized' => 1,
                'verification_status' => 'verified',
            ],
            [
                'student_id' => $ctx['student_b_id'],
                'category_code' => 'SEMINAR_TRAINING',
                'subcategory_code' => $ctx['subcat_code'],
                'verified_engagement_outcome' => 'participated',
                'facts_finalized' => 1,
                'verification_status' => 'verified',
            ],
        ], $ctx['mod_id']);

        self::assertCount(2, $recordResults);

        // Verify Student A has attendance evidence, Student B does not
        self::assertTrue($bridgeService->hasCanonicalAttendanceEvidence($ctx['event_id'], $ctx['student_a_id']));
        self::assertFalse($bridgeService->hasCanonicalAttendanceEvidence($ctx['event_id'], $ctx['student_b_id']));

        // -------------------------------------------------------------
        // Step 2: Source Record Resolution (Phase 8 & 9)
        // -------------------------------------------------------------
        $resolveRes = $bridgeService->resolve($ctx['event_id'], [$ctx['student_a_id'], $ctx['student_b_id']], $ctx['mod_id']);
        self::assertCount(2, $resolveRes);

        $resA = null;
        $resB = null;
        foreach ($resolveRes as $r) {
            if ($r['student_id'] === $ctx['student_a_id']) $resA = $r;
            if ($r['student_id'] === $ctx['student_b_id']) $resB = $r;
        }

        // Student A with attendance is resolved successfully
        self::assertNotNull($resA);
        self::assertSame('CREATED', $resA['bridge_status']);
        $sourceRecordId = $resA['source_record_id'];
        self::assertNotEmpty($sourceRecordId);

        // Student B without attendance is BLOCKED
        self::assertNotNull($resB);
        self::assertSame('BLOCKED', $resB['bridge_status']);
        self::assertContains('ATTENDANCE_NOT_VERIFIED', $resB['reason_codes']);

        // -------------------------------------------------------------
        // Step 3: Certificate Readiness Check (Phase 10)
        // -------------------------------------------------------------
        $issuanceService = new CertificateIssuanceService(db: $db);
        $pdfRenderer = new CertificatePdfRendererService(db: $db, tempDir: $this->tempDir);

        $sourceRow = $db->table('student_portfolio_records spr')->select('spr.*,pc.code category_code,pc.name category_name')->join('portfolio_categories pc','pc.id=spr.category_id')->where('spr.id', $sourceRecordId)->get()->getRowArray();
        $eligibility = (new CertificateEligibilityService())->resolve($sourceRow + ['structured_attributes' => json_decode($sourceRow['structured_metadata'] ?? '{}', true) ?: []]);
        self::assertSame('ELIGIBLE', $eligibility['eligibility_status']);
        self::assertSame('PARTICIPATION', $eligibility['eligible_purpose']);

        // -------------------------------------------------------------
        // Step 4: Issue Certificate (Phase 12, 13, 14, 15)
        // -------------------------------------------------------------
        $idempotencyKey = 'e2e-issue-key-001';
        $issueResult = $issuanceService->issue($modActor, [
            'idempotency_key' => $idempotencyKey,
            'source_record_id' => $sourceRecordId,
            'student_id' => $ctx['student_a_id'],
            'template_version_id' => $ctx['ver_id'],
            'certificate_purpose' => 'PARTICIPATION',
            'signatories' => ['OSAD_DIRECTOR' => $ctx['osad_id']],
        ]);

        self::assertTrue($issueResult['issued']);
        self::assertSame('ISSUED', $issueResult['status']);
        $certId = $issueResult['certificate']['id'];
        $certNumber = $issueResult['certificate']['certificate_number'];
        $publicId = $issueResult['certificate']['public_verification_id'];
        self::assertStringStartsWith('AN-2026-', $certNumber);
        self::assertNotEmpty($publicId);

        // Idempotency replay check
        $replayResult = $issuanceService->issue($modActor, [
            'idempotency_key' => $idempotencyKey,
            'source_record_id' => $sourceRecordId,
            'student_id' => $ctx['student_a_id'],
            'template_version_id' => $ctx['ver_id'],
            'certificate_purpose' => 'PARTICIPATION',
            'signatories' => ['OSAD_DIRECTOR' => $ctx['osad_id']],
        ]);
        self::assertSame($certId, $replayResult['certificate']['id']);

        // Duplicate guard with different idempotency key
        $dupResult = $issuanceService->issue($modActor, [
            'idempotency_key' => 'different-key-for-same-issuance',
            'source_record_id' => $sourceRecordId,
            'student_id' => $ctx['student_a_id'],
            'template_version_id' => $ctx['ver_id'],
            'certificate_purpose' => 'PARTICIPATION',
            'signatories' => ['OSAD_DIRECTOR' => $ctx['osad_id']],
        ]);
        self::assertFalse($dupResult['issued']);
        self::assertSame('ALREADY_ISSUED', $dupResult['status']);
        self::assertSame($certId, $dupResult['certificate']['id']);

        // -------------------------------------------------------------
        // Step 5: Public Verification (Phase 16)
        // -------------------------------------------------------------
        $verifyData = $issuanceService->verify($publicId);
        self::assertNotNull($verifyData);
        self::assertSame('ISSUED', $verifyData['status']);
        self::assertSame($certNumber, $verifyData['certificate_number']);
        self::assertSame('Student A Attended', $verifyData['recipient_name']);
        self::assertSame('NDMU Tech Summit 2026', $verifyData['title']);

        // -------------------------------------------------------------
        // Step 6: PDF Download & RBAC (Phase 17, 18, 26)
        // -------------------------------------------------------------
        // Student A (owner) can download
        $ctrlStuA = new CertificateController(actors: $this->createActorService($studentAActor), issuance: $issuanceService, pdfRenderer: $pdfRenderer, db: $db);
        $ctrlStuA->initController(new IncomingRequest(config('App'), new URI('http://localhost/api/v1/certificates/' . $certId . '/pdf'), null, new UserAgent()), new Response(config('App')), service('logger'));
        $pdfRes = $ctrlStuA->pdf($certId);
        self::assertSame(200, $pdfRes->getStatusCode());
        self::assertSame('application/pdf', $pdfRes->getHeaderLine('Content-Type'));
        self::assertStringStartsWith('%PDF-', $pdfRes->getBody());
        self::assertGreaterThan(2000, strlen($pdfRes->getBody()));

        // Student C (unrelated) is blocked
        $ctrlStuC = new CertificateController(actors: $this->createActorService($studentCActor), issuance: $issuanceService, pdfRenderer: $pdfRenderer, db: $db);
        $ctrlStuC->initController(new IncomingRequest(config('App'), new URI('http://localhost/api/v1/certificates/' . $certId . '/pdf'), null, new UserAgent()), new Response(config('App')), service('logger'));
        $pdfForbidden = $ctrlStuC->pdf($certId);
        self::assertSame(403, $pdfForbidden->getStatusCode());

        // OSAD Staff can download
        $ctrlOsad = new CertificateController(actors: $this->createActorService($osadActor), issuance: $issuanceService, pdfRenderer: $pdfRenderer, db: $db);
        $ctrlOsad->initController(new IncomingRequest(config('App'), new URI('http://localhost/api/v1/certificates/' . $certId . '/pdf'), null, new UserAgent()), new Response(config('App')), service('logger'));
        $pdfOsad = $ctrlOsad->pdf($certId);
        self::assertSame(200, $pdfOsad->getStatusCode());

        // -------------------------------------------------------------
        // Step 7: Snapshot Immutability Proof (Phase 19)
        // -------------------------------------------------------------
        // Mutate student profile name after issuance
        $db->table('profiles')->where('id', $ctx['student_a_id'])->update(['full_name' => 'MUTATED Name After Issuance']);
        $postMutationPdf = $pdfRenderer->render($certId);
        self::assertStringStartsWith('%PDF-', $postMutationPdf);

        // Verification still returns original snapshot name
        $postVerify = $issuanceService->verify($publicId);
        self::assertSame('Student A Attended', $postVerify['recipient_name']);

        // -------------------------------------------------------------
        // Step 8: Reissue E2E (Phase 22, 23, 24, 25)
        // -------------------------------------------------------------
        $reissueRes = $issuanceService->reissue($osadActor, $certId, [
            'idempotency_key' => 'e2e-reissue-key-001',
            'reissue_reason' => 'Spelling correction',
            'signatories' => ['OSAD_DIRECTOR' => $ctx['osad_id']],
        ]);
        self::assertTrue($reissueRes['reissued']);
        self::assertSame('ISSUED', $reissueRes['status']);
        $newCertId = $reissueRes['certificate']['id'];
        $newCertNumber = $reissueRes['certificate']['certificate_number'];
        $newPublicId = $reissueRes['certificate']['public_verification_id'];

        self::assertNotSame($certId, $newCertId);
        self::assertNotSame($certNumber, $newCertNumber);
        self::assertNotSame($publicId, $newPublicId);

        // Old Certificate is now SUPERSEDED
        $oldCertRow = $db->table('certificate_issuances')->where('id', $certId)->get()->getRowArray();
        self::assertSame('SUPERSEDED', $oldCertRow['status']);
        self::assertSame($newCertId, $oldCertRow['superseded_by_certificate_id']);

        // Old PDF download is blocked with 409
        $ctrlStuAOld = new CertificateController(actors: $this->createActorService($studentAActor), issuance: $issuanceService, pdfRenderer: $pdfRenderer, db: $db);
        $ctrlStuAOld->initController(new IncomingRequest(config('App'), new URI('http://localhost/api/v1/certificates/' . $certId . '/pdf'), null, new UserAgent()), new Response(config('App')), service('logger'));
        $oldBlockedPdf = $ctrlStuAOld->pdf($certId);
        self::assertSame(409, $oldBlockedPdf->getStatusCode());
        $oldBody = json_decode($oldBlockedPdf->getBody(), true);
        self::assertSame('CERTIFICATE_SUPERSEDED', $oldBody['error']['code']);
        self::assertSame('/verify/certificate/' . $newPublicId, $oldBody['error']['replacement_url']);

        // New Certificate PDF download succeeds
        $ctrlStuANew = new CertificateController(actors: $this->createActorService($studentAActor), issuance: $issuanceService, pdfRenderer: $pdfRenderer, db: $db);
        $ctrlStuANew->initController(new IncomingRequest(config('App'), new URI('http://localhost/api/v1/certificates/' . $newCertId . '/pdf'), null, new UserAgent()), new Response(config('App')), service('logger'));
        $newPdf = $ctrlStuANew->pdf($newCertId);
        self::assertSame(200, $newPdf->getStatusCode());
        self::assertStringStartsWith('%PDF-', $newPdf->getBody());

        // -------------------------------------------------------------
        // Step 9: Revocation E2E (Phase 20 & 21)
        // -------------------------------------------------------------
        $revokeRes = $issuanceService->revoke($osadActor, $newCertId, [
            'idempotency_key' => 'e2e-revoke-key-001',
            'reason' => 'Administrative cancellation for testing',
        ]);
        self::assertTrue($revokeRes['revoked']);
        self::assertSame('REVOKED', $revokeRes['status']);

        // Public verify reflects REVOKED
        $revokedVerify = $issuanceService->verify($newPublicId);
        self::assertSame('REVOKED', $revokedVerify['status']);

        // PDF download is blocked with 409
        $ctrlStuARevoked = new CertificateController(actors: $this->createActorService($studentAActor), issuance: $issuanceService, pdfRenderer: $pdfRenderer, db: $db);
        $ctrlStuARevoked->initController(new IncomingRequest(config('App'), new URI('http://localhost/api/v1/certificates/' . $newCertId . '/pdf'), null, new UserAgent()), new Response(config('App')), service('logger'));
        $revokedPdf = $ctrlStuARevoked->pdf($newCertId);
        self::assertSame(409, $revokedPdf->getStatusCode());
        $revBody = json_decode($revokedPdf->getBody(), true);
        self::assertSame('CERTIFICATE_REVOKED', $revBody['error']['code']);
    }
}
