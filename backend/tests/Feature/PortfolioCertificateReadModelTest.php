<?php

namespace Tests\Feature;

use App\Controllers\Api\StudentPortfolioController;
use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use CodeIgniter\Test\CIUnitTestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class PortfolioCertificateReadModelTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private array $cleanupIds = [
        'certificate_issuance_snapshots' => [],
        'certificate_issuances' => [],
        'certificate_template_versions' => [],
        'certificate_template_families' => [],
        'student_portfolio_records' => [],
        'profiles' => [],
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $db = \Config\Database::connect('default');
        if (! $db->tableExists('certificate_issuances')) {
            $this->markTestSkipped('certificate_issuances table is not present in the current database schema.');
        }
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect('default');
        if ($db->tableExists('certificate_issuance_snapshots')) {
            foreach ($this->cleanupIds['certificate_issuance_snapshots'] as $id) {
                $db->table('certificate_issuance_snapshots')->where('id', $id)->delete();
            }
        }
        if ($db->tableExists('certificate_issuances')) {
            foreach ($this->cleanupIds['certificate_issuances'] as $id) {
                $db->table('certificate_issuances')->where('id', $id)->delete();
            }
        }
        foreach ($this->cleanupIds['certificate_template_versions'] as $id) {
            $db->table('certificate_template_versions')->where('id', $id)->delete();
        }
        foreach ($this->cleanupIds['certificate_template_families'] as $id) {
            $db->table('certificate_template_families')->where('id', $id)->delete();
        }
        foreach ($this->cleanupIds['student_portfolio_records'] as $id) {
            $db->table('student_portfolio_records')->where('id', $id)->delete();
        }
        foreach ($this->cleanupIds['profiles'] as $id) {
            $db->table('profiles')->where('id', $id)->delete();
        }
        parent::tearDown();
    }

    private function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    private function fixtureSuffix(string $id): string
    {
        return substr(str_replace('-', '', $id), 0, 12);
    }

    private function createController(array $actor, ?\CodeIgniter\Database\BaseConnection $db = null): StudentPortfolioController
    {
        $db ??= \Config\Database::connect('default');
        $actorServiceMock = $this->createMock(AuthenticatedActorService::class);
        $actorServiceMock->method('resolveActor')->willReturn($actor);

        $authz = new AuthorizationService(actorService: $actorServiceMock);

        $controller = new StudentPortfolioController(authz: $authz, db: $db);
        $request = \Config\Services::request();
        $response = \Config\Services::response();
        $logger = \Config\Services::logger();
        $controller->initController($request, $response, $logger);

        return $controller;
    }

    public function testPortfolioCertificateEnrichmentEndToEnd(): void
    {
        $db = \Config\Database::connect('default');
        $now = date('Y-m-d H:i:s');

        // 1. Setup Student A and Student B
        $profileAId = $this->uuid(); $this->cleanupIds['profiles'][] = $profileAId;
        $profileASuffix = $this->fixtureSuffix($profileAId);
        $db->table('profiles')->insert(['id' => $profileAId, 'account_type' => 'student', 'email' => "test-r6-portfolio-a-{$profileASuffix}@example.test", 'full_name' => 'Student Alice', 'institutional_id' => "TEST-R6-PORT-A-{$profileASuffix}", 'created_at' => $now]);

        $profileBId = $this->uuid(); $this->cleanupIds['profiles'][] = $profileBId;
        $profileBSuffix = $this->fixtureSuffix($profileBId);
        $db->table('profiles')->insert(['id' => $profileBId, 'account_type' => 'student', 'email' => "test-r6-portfolio-b-{$profileBSuffix}@example.test", 'full_name' => 'Student Bob', 'institutional_id' => "TEST-R6-PORT-B-{$profileBSuffix}", 'created_at' => $now]);

        // Category
        $cat = $db->table('portfolio_categories')->where('code', 'SEMINAR_TRAINING')->get()->getRowArray();
        $catId = $cat['id'] ?? null;
        if (!$catId) {
            $catId = $this->uuid();
            $db->table('portfolio_categories')->insert(['id' => $catId, 'code' => 'SEMINAR_TRAINING', 'name' => 'Seminar Training', 'sort_order' => 1, 'status' => 'active', 'created_at' => $now]);
        }

        // Template family & version
        $famId = $this->uuid(); $this->cleanupIds['certificate_template_families'][] = $famId;
        $verId = $this->uuid(); $this->cleanupIds['certificate_template_versions'][] = $verId;
        $db->table('certificate_template_families')->insert(['id' => $famId, 'name' => 'Participation Family', 'code' => 'PARTICIPATION_EB_' . substr($famId, 0, 8), 'category' => 'PARTICIPATION', 'status' => 'active', 'created_at' => $now]);
        $db->table('certificate_template_versions')->insert([
            'id' => $verId,
            'family_id' => $famId,
            'version_number' => 1,
            'layout_config' => '{}',
            'signatories_config' => '[]',
            'status' => 'active',
            'created_at' => $now,
        ]);

        // 2. Create Portfolio Record 1 for Student A (with active ISSUED certificate)
        $recA1Id = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recA1Id;
        $db->table('student_portfolio_records')->insert([
            'id' => $recA1Id, 'student_profile_id' => $profileAId, 'category_id' => $catId,
            'title' => 'Tech Summit 2026 Participation', 'status' => 'verified',
            'occurrence_date' => '2026-09-25', 'start_date' => '2026-09-25', 'end_date' => '2026-09-25',
            'created_at' => $now, 'updated_at' => $now
        ]);

        $cert1Id = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $cert1Id;
        $publicId1 = 'pub-' . substr(hash('sha256', $cert1Id), 0, 32);
        $db->table('certificate_issuances')->insert([
            'id' => $cert1Id,
            'certificate_number' => 'CERT-2026-000001',
            'public_verification_id' => $publicId1,
            'student_id' => $profileAId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recA1Id,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'ISSUED',
            'issued_by' => $profileAId,
            'issued_at' => $now,
            'created_at' => $now,
        ]);

        // 3. Create Portfolio Record 2 for Student A (with NO certificate)
        $recA2Id = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recA2Id;
        $db->table('student_portfolio_records')->insert([
            'id' => $recA2Id, 'student_profile_id' => $profileAId, 'category_id' => $catId,
            'title' => 'Leadership Workshop', 'status' => 'verified',
            'occurrence_date' => '2026-09-26', 'start_date' => '2026-09-26', 'end_date' => '2026-09-26',
            'created_at' => $now, 'updated_at' => $now
        ]);

        // 4. Create Portfolio Record 3 for Student A (with REVOKED only certificate)
        $recA3Id = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recA3Id;
        $db->table('student_portfolio_records')->insert([
            'id' => $recA3Id, 'student_profile_id' => $profileAId, 'category_id' => $catId,
            'title' => 'Revoked Achievement', 'status' => 'verified',
            'occurrence_date' => '2026-09-27', 'start_date' => '2026-09-27', 'end_date' => '2026-09-27',
            'created_at' => $now, 'updated_at' => $now
        ]);
        $certRevokedId = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $certRevokedId;
        $db->table('certificate_issuances')->insert([
            'id' => $certRevokedId,
            'certificate_number' => 'CERT-2026-REVOKED',
            'public_verification_id' => 'pub-revoked-' . substr(hash('sha256', $certRevokedId), 0, 20),
            'student_id' => $profileAId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recA3Id,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'REVOKED',
            'issued_by' => $profileAId,
            'issued_at' => $now,
            'revoked_at' => $now,
            'revoked_by' => $profileAId,
            'revocation_reason' => 'Administrative revocation test',
            'created_at' => $now,
        ]);

        // 5. Create Portfolio Record 4 for Student A (with SUPERSEDED old + ISSUED replacement)
        $recA4Id = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recA4Id;
        $db->table('student_portfolio_records')->insert([
            'id' => $recA4Id, 'student_profile_id' => $profileAId, 'category_id' => $catId,
            'title' => 'Reissued Achievement', 'status' => 'verified',
            'occurrence_date' => '2026-09-28', 'start_date' => '2026-09-28', 'end_date' => '2026-09-28',
            'created_at' => $now, 'updated_at' => $now
        ]);
        $certOldId = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $certOldId;
        $certNewId = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $certNewId;
        $publicIdNew = 'pub-new-' . substr(hash('sha256', $certNewId), 0, 24);
        $db->table('certificate_issuances')->insert([
            'id' => $certOldId,
            'certificate_number' => 'CERT-2026-OLD',
            'public_verification_id' => 'pub-old-' . substr(hash('sha256', $certOldId), 0, 24),
            'student_id' => $profileAId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recA4Id,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'SUPERSEDED',
            'issued_by' => $profileAId,
            'issued_at' => $now,
            'superseded_by_certificate_id' => $certNewId,
            'created_at' => $now,
        ]);
        $db->table('certificate_issuances')->insert([
            'id' => $certNewId,
            'certificate_number' => 'CERT-2026-REPLACEMENT',
            'public_verification_id' => $publicIdNew,
            'student_id' => $profileAId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recA4Id,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'ISSUED',
            'issued_by' => $profileAId,
            'issued_at' => $now,
            'supersedes_certificate_id' => $certOldId,
            'created_at' => $now,
        ]);

        // 6. Create Portfolio Record for Student B
        $recBId = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recBId;
        $db->table('student_portfolio_records')->insert([
            'id' => $recBId, 'student_profile_id' => $profileBId, 'category_id' => $catId,
            'title' => 'Bob Private Achievement', 'status' => 'verified',
            'occurrence_date' => '2026-09-25', 'start_date' => '2026-09-25', 'end_date' => '2026-09-25',
            'created_at' => $now, 'updated_at' => $now
        ]);

        // Test as Student A Actor
        $studentAActor = [
            'user' => ['id' => 'u-stu-a'],
            'profile' => ['id' => $profileAId, 'account_type' => 'student'],
            'roles' => ['student'],
        ];
        $controllerA = $this->createController($studentAActor);

        // Call index()
        $response = $controllerA->index();
        self::assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $records = $body['data']['records'] ?? [];

        // Assert record count for Student A (4 records, no B record)
        $aRecordIds = array_column($records, 'id');
        self::assertContains($recA1Id, $aRecordIds);
        self::assertContains($recA2Id, $aRecordIds);
        self::assertContains($recA3Id, $aRecordIds);
        self::assertContains($recA4Id, $aRecordIds);
        self::assertNotContains($recBId, $aRecordIds);

        // Verify Record 1: active ISSUED certificate attached
        $recA1 = current(array_filter($records, fn($r) => $r['id'] === $recA1Id));
        self::assertNotNull($recA1['certificate']);
        self::assertSame($cert1Id, $recA1['certificate']['id']);
        self::assertSame('CERT-2026-000001', $recA1['certificate']['certificate_number']);
        self::assertSame($publicId1, $recA1['certificate']['public_verification_id']);
        self::assertSame('ISSUED', $recA1['certificate']['status']);
        self::assertSame('/verify/certificate/' . $publicId1, $recA1['certificate']['verification_url']);
        self::assertSame('/api/v1/certificates/' . $cert1Id . '/pdf', $recA1['certificate']['pdf_url']);
        self::assertTrue($recA1['certificate']['downloadable']);
        self::assertNull($recA1['certificate']['replacement']);
        self::assertNull($recA1['certificate']['previous_certificate']);
        // Verify no sensitive internals
        self::assertArrayNotHasKey('snapshot_json', $recA1['certificate']);
        self::assertArrayNotHasKey('idempotency_key', $recA1['certificate']);
        self::assertArrayNotHasKey('revoked_by', $recA1['certificate']);
        self::assertArrayNotHasKey('revocation_reason', $recA1['certificate']);

        // Verify Record 2: no certificate -> null
        $recA2 = current(array_filter($records, fn($r) => $r['id'] === $recA2Id));
        self::assertNull($recA2['certificate']);

        // Verify Record 3: REVOKED certificate -> visible, not downloadable, pdf_url null, verification_url present
        $recA3 = current(array_filter($records, fn($r) => $r['id'] === $recA3Id));
        self::assertNotNull($recA3['certificate']);
        self::assertSame($certRevokedId, $recA3['certificate']['id']);
        self::assertSame('CERT-2026-REVOKED', $recA3['certificate']['certificate_number']);
        self::assertSame('REVOKED', $recA3['certificate']['status']);
        self::assertFalse($recA3['certificate']['downloadable']);
        self::assertNull($recA3['certificate']['pdf_url']);
        self::assertStringStartsWith('/verify/certificate/', $recA3['certificate']['verification_url']);
        self::assertNull($recA3['certificate']['replacement']);
        self::assertNull($recA3['certificate']['previous_certificate']);
        self::assertArrayNotHasKey('revoked_by', $recA3['certificate']);
        self::assertArrayNotHasKey('revocation_reason', $recA3['certificate']);

        // Verify Record 4: SUPERSEDED old + ISSUED replacement -> replacement is primary, previous_certificate has predecessor
        $recA4 = current(array_filter($records, fn($r) => $r['id'] === $recA4Id));
        self::assertNotNull($recA4['certificate']);
        self::assertSame($certNewId, $recA4['certificate']['id']);
        self::assertSame('CERT-2026-REPLACEMENT', $recA4['certificate']['certificate_number']);
        self::assertSame($publicIdNew, $recA4['certificate']['public_verification_id']);
        self::assertSame('ISSUED', $recA4['certificate']['status']);
        self::assertTrue($recA4['certificate']['downloadable']);
        self::assertSame('/verify/certificate/' . $publicIdNew, $recA4['certificate']['verification_url']);
        self::assertSame('/api/v1/certificates/' . $certNewId . '/pdf', $recA4['certificate']['pdf_url']);
        self::assertNull($recA4['certificate']['replacement']);
        self::assertNotNull($recA4['certificate']['previous_certificate']);
        self::assertSame($certOldId, $recA4['certificate']['previous_certificate']['id']);
        self::assertSame('CERT-2026-OLD', $recA4['certificate']['previous_certificate']['certificate_number']);
        self::assertSame('SUPERSEDED', $recA4['certificate']['previous_certificate']['status']);
        self::assertSame('/verify/certificate/pub-old-' . substr(hash('sha256', $certOldId), 0, 24), $recA4['certificate']['previous_certificate']['verification_url']);

        // Test Single Record get($recA1Id)
        $singleResponse = $controllerA->get($recA1Id);
        self::assertSame(200, $singleResponse->getStatusCode());
        $singleBody = json_decode($singleResponse->getBody(), true);
        $singleRecord = $singleBody['data']['record'] ?? null;
        self::assertNotNull($singleRecord);
        self::assertSame($recA1['certificate'], $singleRecord['certificate']);

        // Test Single Record get($recA2Id) (no certificate)
        $singleResponse2 = $controllerA->get($recA2Id);
        self::assertSame(200, $singleResponse2->getStatusCode());
        $singleBody2 = json_decode($singleResponse2->getBody(), true);
        self::assertNull($singleBody2['data']['record']['certificate']);

        // Test Single Record get($recA3Id) (REVOKED)
        $singleResponse3 = $controllerA->get($recA3Id);
        self::assertSame(200, $singleResponse3->getStatusCode());
        $singleBody3 = json_decode($singleResponse3->getBody(), true);
        self::assertSame($recA3['certificate'], $singleBody3['data']['record']['certificate']);

        // Test Single Record get($recA4Id) (SUPERSEDED + REPLACEMENT)
        $singleResponse4 = $controllerA->get($recA4Id);
        self::assertSame(200, $singleResponse4->getStatusCode());
        $singleBody4 = json_decode($singleResponse4->getBody(), true);
        self::assertSame($recA4['certificate'], $singleBody4['data']['record']['certificate']);

        // Test Cross-Student Access: Student B cannot view Student A's single record
        $studentBActor = [
            'user' => ['id' => 'u-stu-b'],
            'profile' => ['id' => $profileBId, 'account_type' => 'student'],
            'roles' => ['student'],
        ];
        $controllerB = $this->createController($studentBActor);
        $forbiddenResponse = $controllerB->get($recA1Id);
        self::assertSame(403, $forbiddenResponse->getStatusCode());
    }

    public function testOrphanSupersededCertificateReadModel(): void
    {
        $db = \Config\Database::connect('default');
        $now = date('Y-m-d H:i:s');

        $profileId = $this->uuid(); $this->cleanupIds['profiles'][] = $profileId;
        $profileSuffix = $this->fixtureSuffix($profileId);
        $db->table('profiles')->insert(['id' => $profileId, 'account_type' => 'student', 'email' => "test-r6-orphan-{$profileSuffix}@example.test", 'full_name' => 'Student Orphan', 'institutional_id' => "TEST-R6-ORPHAN-{$profileSuffix}", 'created_at' => $now]);

        $cat = $db->table('portfolio_categories')->where('code', 'SEMINAR_TRAINING')->get()->getRowArray();
        $catId = $cat['id'] ?? null;
        if (!$catId) {
            $catId = $this->uuid();
            $db->table('portfolio_categories')->insert(['id' => $catId, 'code' => 'SEMINAR_TRAINING', 'name' => 'Seminar Training', 'sort_order' => 1, 'status' => 'active', 'created_at' => $now]);
        }

        $famId = $this->uuid(); $this->cleanupIds['certificate_template_families'][] = $famId;
        $verId = $this->uuid(); $this->cleanupIds['certificate_template_versions'][] = $verId;
        $db->table('certificate_template_families')->insert(['id' => $famId, 'name' => 'Participation Family Orphan', 'code' => 'PARTICIPATION_ORPH_' . substr($famId, 0, 8), 'category' => 'PARTICIPATION', 'status' => 'active', 'created_at' => $now]);
        $db->table('certificate_template_versions')->insert([
            'id' => $verId,
            'family_id' => $famId,
            'version_number' => 1,
            'layout_config' => '{}',
            'signatories_config' => '[]',
            'status' => 'active',
            'created_at' => $now,
        ]);

        $recId = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recId;
        $db->table('student_portfolio_records')->insert([
            'id' => $recId, 'student_profile_id' => $profileId, 'category_id' => $catId,
            'title' => 'Orphan Superseded Achievement', 'status' => 'verified',
            'occurrence_date' => '2026-09-25', 'start_date' => '2026-09-25', 'end_date' => '2026-09-25',
            'created_at' => $now, 'updated_at' => $now
        ]);

        $certId = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $certId;
        $publicId = 'pub-orphan-' . substr(hash('sha256', $certId), 0, 24);
        $db->table('certificate_issuances')->insert([
            'id' => $certId,
            'certificate_number' => 'CERT-2026-ORPHAN',
            'public_verification_id' => $publicId,
            'student_id' => $profileId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recId,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'SUPERSEDED',
            'issued_by' => $profileId,
            'issued_at' => $now,
            'superseded_by_certificate_id' => null,
            'created_at' => $now,
        ]);

        $actor = [
            'user' => ['id' => 'u-stu-orphan'],
            'profile' => ['id' => $profileId, 'account_type' => 'student'],
            'roles' => ['student'],
        ];
        $controller = $this->createController($actor);
        $res = $controller->get($recId);
        self::assertSame(200, $res->getStatusCode());
        $body = json_decode($res->getBody(), true);
        $cert = $body['data']['record']['certificate'] ?? null;

        self::assertNotNull($cert);
        self::assertSame($certId, $cert['id']);
        self::assertSame('CERT-2026-ORPHAN', $cert['certificate_number']);
        self::assertSame('SUPERSEDED', $cert['status']);
        self::assertFalse($cert['downloadable']);
        self::assertNull($cert['pdf_url']);
        self::assertNull($cert['replacement']);
        self::assertNull($cert['previous_certificate']);
        self::assertSame('/verify/certificate/' . $publicId, $cert['verification_url']);
    }

    public function testDynamicTransitionsWithoutPortfolioRowMutation(): void
    {
        $db = \Config\Database::connect('default');
        $now = date('Y-m-d H:i:s');

        $profileId = $this->uuid(); $this->cleanupIds['profiles'][] = $profileId;
        $profileSuffix = $this->fixtureSuffix($profileId);
        $db->table('profiles')->insert(['id' => $profileId, 'account_type' => 'student', 'email' => "test-r6-transition-{$profileSuffix}@example.test", 'full_name' => 'Student Transition', 'institutional_id' => "TEST-R6-TRANS-{$profileSuffix}", 'created_at' => $now]);

        $cat = $db->table('portfolio_categories')->where('code', 'SEMINAR_TRAINING')->get()->getRowArray();
        $catId = $cat['id'] ?? null;
        if (!$catId) {
            $catId = $this->uuid();
            $db->table('portfolio_categories')->insert(['id' => $catId, 'code' => 'SEMINAR_TRAINING', 'name' => 'Seminar Training', 'sort_order' => 1, 'status' => 'active', 'created_at' => $now]);
        }

        $famId = $this->uuid(); $this->cleanupIds['certificate_template_families'][] = $famId;
        $verId = $this->uuid(); $this->cleanupIds['certificate_template_versions'][] = $verId;
        $db->table('certificate_template_families')->insert(['id' => $famId, 'name' => 'Participation Family Trans', 'code' => 'PARTICIPATION_TR_' . substr($famId, 0, 8), 'category' => 'PARTICIPATION', 'status' => 'active', 'created_at' => $now]);
        $db->table('certificate_template_versions')->insert([
            'id' => $verId,
            'family_id' => $famId,
            'version_number' => 1,
            'layout_config' => '{}',
            'signatories_config' => '[]',
            'status' => 'active',
            'created_at' => $now,
        ]);

        $recId = $this->uuid(); $this->cleanupIds['student_portfolio_records'][] = $recId;
        $db->table('student_portfolio_records')->insert([
            'id' => $recId, 'student_profile_id' => $profileId, 'category_id' => $catId,
            'title' => 'Transition Test Achievement', 'status' => 'verified',
            'occurrence_date' => '2026-09-25', 'start_date' => '2026-09-25', 'end_date' => '2026-09-25',
            'created_at' => $now, 'updated_at' => $now
        ]);

        // 1. Initial state: ISSUED
        $cert1Id = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $cert1Id;
        $publicId1 = 'pub-trans1-' . substr(hash('sha256', $cert1Id), 0, 20);
        $db->table('certificate_issuances')->insert([
            'id' => $cert1Id,
            'certificate_number' => 'CERT-TRANS-001',
            'public_verification_id' => $publicId1,
            'student_id' => $profileId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recId,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'ISSUED',
            'issued_by' => $profileId,
            'issued_at' => $now,
            'created_at' => $now,
        ]);

        $actor = [
            'user' => ['id' => 'u-stu-trans'],
            'profile' => ['id' => $profileId, 'account_type' => 'student'],
            'roles' => ['student'],
        ];
        $controller = $this->createController($actor);

        // Initial check: ISSUED, downloadable=true
        $res1 = $controller->get($recId);
        $body1 = json_decode($res1->getBody(), true);
        $cert1 = $body1['data']['record']['certificate'];
        self::assertSame('ISSUED', $cert1['status']);
        self::assertTrue($cert1['downloadable']);
        self::assertSame('/api/v1/certificates/' . $cert1Id . '/pdf', $cert1['pdf_url']);

        // 2. Transition: Revoke certificate (without touching student_portfolio_records)
        $db->table('certificate_issuances')->where('id', $cert1Id)->update([
            'status' => 'REVOKED',
            'revoked_at' => $now,
            'revoked_by' => $profileId,
            'revocation_reason' => 'Testing revocation projection',
        ]);

        $res2 = $controller->get($recId);
        $body2 = json_decode($res2->getBody(), true);
        $cert2 = $body2['data']['record']['certificate'];
        self::assertSame('REVOKED', $cert2['status']);
        self::assertFalse($cert2['downloadable']);
        self::assertNull($cert2['pdf_url']);
        self::assertSame('/verify/certificate/' . $publicId1, $cert2['verification_url']);

        // 3. Transition: Reissue (mark old as SUPERSEDED and create new ISSUED replacement)
        $cert2Id = $this->uuid(); $this->cleanupIds['certificate_issuances'][] = $cert2Id;
        $publicId2 = 'pub-trans2-' . substr(hash('sha256', $cert2Id), 0, 20);

        $db->table('certificate_issuances')->where('id', $cert1Id)->update([
            'status' => 'SUPERSEDED',
            'superseded_by_certificate_id' => $cert2Id,
        ]);

        $db->table('certificate_issuances')->insert([
            'id' => $cert2Id,
            'certificate_number' => 'CERT-TRANS-002-REPLACEMENT',
            'public_verification_id' => $publicId2,
            'student_id' => $profileId,
            'source_record_type' => 'student_portfolio_record',
            'source_record_id' => $recId,
            'certificate_purpose' => 'PARTICIPATION',
            'template_family_id' => $famId,
            'template_version_id' => $verId,
            'status' => 'ISSUED',
            'issued_by' => $profileId,
            'issued_at' => $now,
            'supersedes_certificate_id' => $cert1Id,
            'created_at' => date('Y-m-d H:i:s', time() + 1),
        ]);

        $res3 = $controller->get($recId);
        $body3 = json_decode($res3->getBody(), true);
        $cert3 = $body3['data']['record']['certificate'];
        self::assertSame('ISSUED', $cert3['status']);
        self::assertSame($cert2Id, $cert3['id']);
        self::assertTrue($cert3['downloadable']);
        self::assertSame('/api/v1/certificates/' . $cert2Id . '/pdf', $cert3['pdf_url']);
        self::assertNotNull($cert3['previous_certificate']);
        self::assertSame($cert1Id, $cert3['previous_certificate']['id']);
        self::assertSame('SUPERSEDED', $cert3['previous_certificate']['status']);
    }
}
