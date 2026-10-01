<?php

namespace Tests\Unit;

use App\Controllers\Api\CertificateController;
use App\Services\AuthenticatedActorService;
use App\Services\CertificateIssuanceService;
use App\Services\CertificatePdfRendererService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\Response;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\HTTP\URI;
use CodeIgniter\Test\CIUnitTestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class CertificatePdfEndpointTest extends CIUnitTestCase
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
        $this->tempDir = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'cert_ep_' . bin2hex(random_bytes(4));
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
        $db->query("DELETE FROM audit_logs WHERE actor_profile_id LIKE 'e9000000%' OR target_id LIKE 'e9000000%'");
        $db->query("DELETE FROM certificate_idempotency WHERE actor_profile_id LIKE 'e9000000%'");
        $db->query("DELETE FROM certificate_issuance_snapshots WHERE certificate_issuance_id IN (SELECT id FROM certificate_issuances WHERE student_id LIKE 'e9000000%') OR id LIKE 'e9000000%'");
        $db->query("DELETE FROM certificate_issuances WHERE student_id LIKE 'e9000000%' OR id LIKE 'e9000000%'");
        $db->query("DELETE FROM certificate_template_versions WHERE id LIKE 'e9000000%'");
        $db->query("DELETE FROM certificate_template_families WHERE id LIKE 'e9000000%'");
        $db->query("DELETE FROM student_portfolio_records WHERE id LIKE 'e9000000%'");
        $db->query("DELETE FROM portfolio_categories WHERE id LIKE 'e9000000%'");
        $db->query("DELETE FROM organization_moderator_assignments WHERE personnel_profile_id LIKE 'e9000000%'");
        $db->query("DELETE FROM events WHERE id LIKE 'e9000000%'");
        $db->query("DELETE FROM organizations WHERE id LIKE 'e9000000%'");
        $db->query("DELETE FROM profiles WHERE id LIKE 'e9000000%'");
    }

    private function createPngFile(string $filename): string
    {
        $path = $this->tempDir . DIRECTORY_SEPARATOR . $filename;
        file_put_contents($path, base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='));
        return $path;
    }

    private function prepareFixture(BaseConnection $db): array
    {
        $now = date('Y-m-d H:i:s');
        $studentId = 'e9000000-0000-4000-8000-000000000001';
        $otherStudentId = 'e9000000-0000-4000-8000-000000000009';
        $osadId = 'e9000000-0000-4000-8000-000000000002';
        $modId = 'e9000000-0000-4000-8000-000000000003';
        $orgId = 'e9000000-0000-4000-8000-000000000004';
        $eventId = 'e9000000-0000-4000-8000-000000000005';
        $sourceId = 'e9000000-0000-4000-8000-000000000010';
        $certId = 'e9000000-0000-4000-8000-000000000020';
        $publicId = 'e90000000000000000000000000000000000000000000020';
        $snapId = 'e9000000-0000-4000-8000-000000000030';
        $familyId = 'e9000000-0000-4000-8000-000000000040';
        $versionId = 'e9000000-0000-4000-8000-000000000050';
        $catId = 'e9000000-0000-4000-8000-000000000060';

        // Profiles
        $db->table('profiles')->insert(['id' => $studentId, 'account_type' => 'student', 'email' => 'student.e901@ndmu.edu.ph', 'full_name' => 'Alice Student Endpoint', 'institutional_id' => 'STU-EP-01', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $otherStudentId, 'account_type' => 'student', 'email' => 'student.e909@ndmu.edu.ph', 'full_name' => 'Other Student Endpoint', 'institutional_id' => 'STU-EP-09', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $osadId, 'account_type' => 'personnel', 'email' => 'osad.e902@ndmu.edu.ph', 'full_name' => 'OSAD Officer Endpoint', 'institutional_id' => 'OSAD-EP-01', 'created_at' => $now]);
        $db->table('profiles')->insert(['id' => $modId, 'account_type' => 'personnel', 'email' => 'mod.e903@ndmu.edu.ph', 'full_name' => 'Mod Personnel Endpoint', 'institutional_id' => 'MOD-EP-01', 'created_at' => $now]);

        // Org & Event
        $db->table('organizations')->insert(['id' => $orgId, 'name' => 'Robotics Club', 'code' => 'ROBOTICS_EP', 'category' => 'special_interest', 'scope' => 'university', 'status' => 'active', 'created_at' => $now]);
        $db->table('events')->insert(['id' => $eventId, 'organization_id' => $orgId, 'title' => 'Annual Robotics Workshop', 'status' => 'COMPLETED', 'created_at' => $now]);
        $db->table('organization_moderator_assignments')->insert(['id' => 'e9000000-0000-4000-8000-000000000099', 'personnel_profile_id' => $modId, 'organization_id' => $orgId, 'is_active' => 1, 'effective_from' => '2026-01-01', 'effective_until' => null, 'created_at' => $now]);

        // Category & Source Record
        $db->table('portfolio_categories')->insert(['id' => $catId, 'code' => 'ORG_LEADERSHIP_EP', 'name' => 'Leadership', 'sort_order' => 1, 'status' => 'active', 'created_at' => $now]);
        $db->table('student_portfolio_records')->insert([
            'id' => $sourceId,
            'student_profile_id' => $studentId,
            'category_id' => $catId,
            'title' => 'Annual Robotics Workshop',
            'status' => 'verified',
            'structured_metadata' => json_encode(['origin_event_id' => $eventId]),
            'created_at' => $now,
        ]);

        // Template family & version
        $db->table('certificate_template_families')->insert(['id' => $familyId, 'name' => 'Appreciation Family', 'code' => 'APPRECIATION_FAM_EP', 'certificate_purpose' => 'APPRECIATION', 'status' => 'active', 'is_default' => 1, 'created_at' => $now]);
        $db->table('certificate_template_versions')->insert([
            'id' => $versionId,
            'family_id' => $familyId,
            'version_number' => 1,
            'layout_config' => json_encode([
                'layout_schema' => ['theme_id' => 'emerald_gold', 'orientation' => 'landscape', 'page_size' => 'A4'],
                'content_schema' => [
                    'heading' => 'Certificate of Appreciation',
                    'recipient_lead_in' => 'Presented to',
                    'body' => '{{recipient_name}} for participation in {{activity_title}}.',
                    'footer_note' => 'Issued on {{issued_date}}. Certificate: {{certificate_number}}.',
                ],
            ]),
            'placeholder_contract_json' => json_encode([
                ['name' => 'recipient_name', 'requirement_type' => 'REQUIRED'],
                ['name' => 'activity_title', 'requirement_type' => 'REQUIRED'],
                ['name' => 'issued_date', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
                ['name' => 'certificate_number', 'requirement_type' => 'RESOLVED_AT_ISSUANCE'],
            ]),
            'status' => 'active',
            'created_at' => $now,
        ]);

        // Signature image
        $sigPath = $this->createPngFile('sig_ep.png');

        // Snapshot
        $snapshot = [
            'certificate_identity' => [
                'id' => $certId,
                'certificate_number' => 'AN-2026-000888',
                'public_verification_id' => $publicId,
                'verification_url' => '/verify/certificate/' . $publicId,
                'issued_at' => $now,
            ],
            'recipient' => ['name' => 'Alice Student Endpoint'],
            'source_record' => ['id' => $sourceId, 'title' => 'Annual Robotics Workshop'],
            'certificate_purpose' => 'APPRECIATION',
            'resolved_certificate_data' => [
                'recipient_name' => 'Alice Student Endpoint',
                'activity_title' => 'Annual Robotics Workshop',
                'issuer_name' => 'Notre Dame of Marbel University',
                'issued_date' => substr($now, 0, 10),
                'certificate_number' => 'AN-2026-000888',
                'verification_url' => '/verify/certificate/' . $publicId,
            ],
            'organizer_and_issuer' => ['organizer_name' => 'Robotics Club', 'issuer_name' => 'Notre Dame of Marbel University'],
            'dates' => ['issued_date' => substr($now, 0, 10)],
            'signatories' => [[
                'role_code' => 'OSAD_DIRECTOR',
                'name' => 'Director Santos',
                'title' => 'OSAD Director',
                'signature_storage_path' => $sigPath,
            ]],
        ];

        // Issuance
        $db->table('certificate_issuances')->insert([
            'id' => $certId,
            'certificate_number' => 'AN-2026-000888',
            'public_verification_id' => $publicId,
            'student_id' => $studentId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $sourceId,
            'certificate_purpose' => 'APPRECIATION',
            'template_family_id' => $familyId,
            'template_version_id' => $versionId,
            'status' => 'ISSUED',
            'issued_by' => $osadId,
            'issued_at' => $now,
            'created_at' => $now,
        ]);

        $db->table('certificate_issuance_snapshots')->insert([
            'id' => $snapId,
            'certificate_issuance_id' => $certId,
            'snapshot_json' => json_encode($snapshot),
            'created_at' => $now,
        ]);

        return [
            'student_id' => $studentId,
            'other_student_id' => $otherStudentId,
            'osad_id' => $osadId,
            'mod_id' => $modId,
            'cert_id' => $certId,
            'public_id' => $publicId,
            'source_id' => $sourceId,
            'event_id' => $eventId,
        ];
    }

    private function createController(BaseConnection $db, ?array $actor = null): CertificateController
    {
        $actorMock = $this->createMock(AuthenticatedActorService::class);
        $actorMock->method('resolveActor')->willReturn($actor);

        $pdfRenderer = new CertificatePdfRendererService(
            db: $db,
            tempDir: $this->tempDir
        );

        $controller = new CertificateController(
            actors: $actorMock,
            issuance: new CertificateIssuanceService(db: $db),
            pdfRenderer: $pdfRenderer
        );

        $request = new IncomingRequest(config('App'), new URI('http://example.com/api/v1/certificates/test/pdf'), null, new UserAgent());
        $response = new Response(config('App'));
        $controller->initController($request, $response, service('logger'));

        return $controller;
    }

    public function testRecipientStudentCanDownloadOwnPdf(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        $actor = [
            'user' => ['id' => 'u1'],
            'profile' => ['id' => $ctx['student_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf($ctx['cert_id']);

        self::assertInstanceOf(Response::class, $res);
        self::assertSame(200, $res->getStatusCode());
        self::assertSame('application/pdf', $res->getHeaderLine('Content-Type'));
        self::assertStringContainsString('AchieveNest-Certificate-AN-2026-000888.pdf', $res->getHeaderLine('Content-Disposition'));
        self::assertStringStartsWith('%PDF-', $res->getBody());
    }

    public function testOtherStudentIsForbiddenFromDownloading(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        $actor = [
            'user' => ['id' => 'u2'],
            'profile' => ['id' => $ctx['other_student_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf($ctx['cert_id']);

        self::assertSame(403, $res->getStatusCode());
        $body = json_decode($res->getBody(), true);
        self::assertSame('FORBIDDEN', $body['error']['code'] ?? null);
    }

    public function testOsadStaffCanDownloadAnyIssuedCertificate(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        $actor = [
            'user' => ['id' => 'u3'],
            'profile' => ['id' => $ctx['osad_id'], 'account_type' => 'personnel'],
            'roles' => ['osad_staff'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf($ctx['cert_id']);

        self::assertSame(200, $res->getStatusCode());
        self::assertStringStartsWith('%PDF-', $res->getBody());
    }

    public function testOrganizationModeratorCanDownloadScopedCertificate(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        $actor = [
            'user' => ['id' => 'u4'],
            'profile' => ['id' => $ctx['mod_id'], 'account_type' => 'personnel'],
            'roles' => ['organization_moderator'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf($ctx['cert_id']);

        self::assertSame(200, $res->getStatusCode());
        self::assertStringStartsWith('%PDF-', $res->getBody());
    }

    public function testRevokedCertificateDownloadReturns409(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        // Mark as revoked
        $db->table('certificate_issuances')->where('id', $ctx['cert_id'])->update([
            'status' => 'REVOKED',
            'revoked_at' => date('Y-m-d H:i:s'),
            'revocation_reason' => 'Administrative correction',
        ]);

        $actor = [
            'user' => ['id' => 'u1'],
            'profile' => ['id' => $ctx['student_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf($ctx['cert_id']);

        self::assertSame(409, $res->getStatusCode());
        $body = json_decode($res->getBody(), true);
        self::assertSame('CERTIFICATE_REVOKED', $body['error']['code'] ?? null);
    }

    public function testSupersededCertificateDownloadReturns409WithReplacementMetadata(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        $repCertId = 'e9000000-0000-4000-8000-000000000077';
        $repPublicId = 'e90000000000000000000000000000000000000000000077';

        // Mark old as superseded first to release unique constraint
        $db->table('certificate_issuances')->where('id', $ctx['cert_id'])->update([
            'status' => 'SUPERSEDED',
            'superseded_by_certificate_id' => $repCertId,
            'reissue_reason' => 'Name correction',
        ]);

        // Insert replacement
        $db->table('certificate_issuances')->insert([
            'id' => $repCertId,
            'certificate_number' => 'AN-2026-000889',
            'public_verification_id' => $repPublicId,
            'student_id' => $ctx['student_id'],
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $ctx['source_id'],
            'certificate_purpose' => 'APPRECIATION',
            'template_family_id' => 'e9000000-0000-4000-8000-000000000040',
            'template_version_id' => 'e9000000-0000-4000-8000-000000000050',
            'status' => 'ISSUED',
            'issued_by' => $ctx['osad_id'],
            'issued_at' => date('Y-m-d H:i:s'),
            'supersedes_certificate_id' => $ctx['cert_id'],
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'user' => ['id' => 'u1'],
            'profile' => ['id' => $ctx['student_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf($ctx['cert_id']);

        self::assertSame(409, $res->getStatusCode());
        $body = json_decode($res->getBody(), true);
        self::assertSame('CERTIFICATE_SUPERSEDED', $body['error']['code'] ?? null);
        self::assertTrue($body['error']['replacement_available'] ?? false);
        self::assertSame('/verify/certificate/' . $repPublicId, $body['error']['replacement_url'] ?? null);
    }

    public function testMissingCertificateReturns404(): void
    {
        $db = \Config\Database::connect('default');
        $ctx = $this->prepareFixture($db);

        $actor = [
            'user' => ['id' => 'u1'],
            'profile' => ['id' => $ctx['student_id'], 'account_type' => 'student'],
            'roles' => ['student'],
        ];

        $controller = $this->createController($db, $actor);
        $res = $controller->pdf('e9000000-0000-4000-8000-999999999999');

        self::assertSame(404, $res->getStatusCode());
        $body = json_decode($res->getBody(), true);
        self::assertSame('CERTIFICATE_NOT_FOUND', $body['error']['code'] ?? null);
    }
}
