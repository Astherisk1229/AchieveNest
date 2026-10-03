<?php

namespace Tests\Unit;

use App\Services\CertificateIdentityService;
use App\Services\CertificateIssuanceService;
use CodeIgniter\Test\CIUnitTestCase;
use RuntimeException;
use Throwable;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class CertificateLifecycleRevocationReissueTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    protected function setUp(): void
    {
        parent::setUp();
        $db = \Config\Database::connect('default');
        $this->cleanFixture($db);
    }

    protected function tearDown(): void
    {
        $db = \Config\Database::connect('default');
        $this->cleanFixture($db);
        parent::tearDown();
    }

    private function cleanFixture(\CodeIgniter\Database\BaseConnection $db): void
    {
        $db->query("DELETE FROM audit_logs WHERE actor_profile_id LIKE 'e8000000%' OR target_id LIKE 'e8000000%'");
        $db->query("DELETE FROM certificate_idempotency WHERE actor_profile_id LIKE 'e8000000%'");
        $db->query("DELETE FROM certificate_issuance_snapshots WHERE certificate_issuance_id IN (SELECT id FROM certificate_issuances WHERE student_id LIKE 'e8000000%') OR id LIKE 'e8000000%'");
        $db->query("DELETE FROM certificate_issuances WHERE student_id LIKE 'e8000000%' OR id LIKE 'e8000000%'");
        $db->query("DELETE FROM certificate_template_versions WHERE id LIKE 'e8000000%'");
        $db->query("DELETE FROM certificate_template_families WHERE id LIKE 'e8000000%'");
        $db->query("DELETE FROM student_portfolio_records WHERE id LIKE 'e8000000%'");
        $db->query("DELETE FROM portfolio_categories WHERE id LIKE 'e8000000%'");
        $db->query("DELETE FROM profiles WHERE id LIKE 'e8000000%'");
    }

    private function prepareFixture(\CodeIgniter\Database\BaseConnection $db): array
    {
        $now = date('Y-m-d H:i:s');
        $studentId = 'e8000000-0000-4000-8000-000000000001';
        $osadId = 'e8000000-0000-4000-8000-000000000002';
        $modId = 'e8000000-0000-4000-8000-000000000003';
        $sourceId = 'e8000000-0000-4000-8000-000000000010';
        $certId = 'e8000000-0000-4000-8000-000000000020';
        $publicId = 'e80000000000000000000000000000000000000000000020';
        $snapId = 'e8000000-0000-4000-8000-000000000030';
        $familyId = 'e8000000-0000-4000-8000-000000000040';
        $versionId = 'e8000000-0000-4000-8000-000000000050';
        $catId = 'e8000000-0000-4000-8000-000000000060';

        // Profiles
        if (!$db->table('profiles')->where('id', $studentId)->get()->getRowArray()) {
            $db->table('profiles')->insert(['id' => $studentId, 'account_type' => 'student', 'email' => 'student.e801@ndmu.edu.ph', 'full_name' => 'Test Student Candidate', 'institutional_id' => 'STU-LC-01', 'created_at' => $now]);
        }
        if (!$db->table('profiles')->where('id', $osadId)->get()->getRowArray()) {
            $db->table('profiles')->insert(['id' => $osadId, 'account_type' => 'personnel', 'email' => 'osad.e802@ndmu.edu.ph', 'full_name' => 'OSAD Officer', 'institutional_id' => 'OSAD-01', 'created_at' => $now]);
        }
        if (!$db->table('profiles')->where('id', $modId)->get()->getRowArray()) {
            $db->table('profiles')->insert(['id' => $modId, 'account_type' => 'personnel', 'email' => 'mod.e803@ndmu.edu.ph', 'full_name' => 'Org Moderator', 'institutional_id' => 'MOD-01', 'created_at' => $now]);
        }

        // Category
        $cat = $db->table('portfolio_categories')->where('code', 'COMMUNITY_SERVICE_VOLUNTEERISM')->get()->getRowArray();
        if ($cat) {
            $catId = $cat['id'];
        } else {
            $db->table('portfolio_categories')->insert(['id' => $catId, 'code' => 'COMMUNITY_SERVICE_VOLUNTEERISM', 'name' => 'Community Service', 'created_at' => $now]);
        }

        // Source Record
        if (!$db->table('student_portfolio_records')->where('id', $sourceId)->get()->getRowArray()) {
            $db->table('student_portfolio_records')->insert([
                'id' => $sourceId,
                'student_profile_id' => $studentId,
                'category_id' => $catId,
                'title' => 'Tree Planting Outreach Activity',
                'description' => 'Outreach description',
                'status' => 'verified',
                'structured_metadata' => json_encode(['role' => 'volunteer']),
                'created_at' => $now,
            ]);
        }

        // Template family & version
        if (!$db->table('certificate_template_families')->where('id', $familyId)->get()->getRowArray()) {
            $db->table('certificate_template_families')->insert([
                'id' => $familyId,
                'code' => 'APPRECIATION_DEFAULT_E8',
                'name' => 'Appreciation Default Family',
                'certificate_purpose' => 'APPRECIATION',
                'status' => 'active',
                'is_default' => 1,
                'created_at' => $now,
            ]);
        }
        if (!$db->table('certificate_template_versions')->where('id', $versionId)->get()->getRowArray()) {
            $db->table('certificate_template_versions')->insert([
                'id' => $versionId,
                'family_id' => $familyId,
                'version_number' => 1,
                'status' => 'active',
                'layout_config' => json_encode(['orientation' => 'landscape']),
                'signatories_config' => json_encode([]),
                'placeholder_contract_json' => json_encode([]),
                'signatory_slots_json' => json_encode([]),
                'created_at' => $now,
            ]);
        }

        // Active ISSUED Certificate
        if (!$db->table('certificate_issuances')->where('id', $certId)->get()->getRowArray()) {
            $db->table('certificate_issuances')->insert([
                'id' => $certId,
                'certificate_number' => 'AN-2026-990001',
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
            ]);
        }

        if (!$db->table('certificate_issuance_snapshots')->where('certificate_issuance_id', $certId)->get()->getRowArray()) {
            $snapshotData = [
                'certificate_identity' => ['id' => $certId, 'certificate_number' => 'AN-2026-990001', 'public_verification_id' => $publicId],
                'recipient' => ['name' => 'Test Student Candidate'],
                'source_record' => ['id' => $sourceId, 'title' => 'Tree Planting Outreach Activity'],
                'certificate_purpose' => 'APPRECIATION',
                'organizer_and_issuer' => ['issuer_name' => 'Notre Dame of Marbel University / OSAD'],
            ];
            $db->table('certificate_issuance_snapshots')->insert([
                'id' => $snapId,
                'certificate_issuance_id' => $certId,
                'snapshot_json' => json_encode($snapshotData),
                'created_at' => $now,
            ]);
        }

        return compact('studentId', 'osadId', 'modId', 'sourceId', 'certId', 'publicId', 'snapId', 'familyId', 'versionId', 'catId');
    }

    public function testRevocationLifecycle(): void
    {
        $db = \Config\Database::connect('default');
        $f = $this->prepareFixture($db);
        $service = new CertificateIssuanceService(db: $db);

        $osadActor = ['profile' => ['id' => $f['osadId']], 'roles' => ['osad_staff']];
        $modActor = ['profile' => ['id' => $f['modId']], 'roles' => ['organization_moderator']];
        $studentActor = ['profile' => ['id' => $f['studentId']], 'roles' => ['student']];

        // 1. Unauthorized moderator rejected
        $unauthFailed = false;
        try {
            $service->revoke($modActor, $f['certId'], ['reason' => 'Administrative error', 'idempotency_key' => 'mod-revoke-1']);
        } catch (RuntimeException $e) {
            $unauthFailed = ($e->getMessage() === 'UNAUTHORIZED_REVOCATION');
        }
        $this->assertTrue($unauthFailed, 'Moderator must be rejected with UNAUTHORIZED_REVOCATION');

        // 2. Student rejected
        $studentFailed = false;
        try {
            $service->revoke($studentActor, $f['certId'], ['reason' => 'Administrative error', 'idempotency_key' => 'stu-revoke-1']);
        } catch (RuntimeException $e) {
            $studentFailed = ($e->getMessage() === 'UNAUTHORIZED_REVOCATION');
        }
        $this->assertTrue($studentFailed, 'Student must be rejected with UNAUTHORIZED_REVOCATION');

        // 3. Missing reason rejected
        $missingReasonFailed = false;
        try {
            $service->revoke($osadActor, $f['certId'], ['reason' => '   ', 'idempotency_key' => 'osad-revoke-empty']);
        } catch (RuntimeException $e) {
            $missingReasonFailed = ($e->getMessage() === 'REVOCATION_REASON_REQUIRED');
        }
        $this->assertTrue($missingReasonFailed, 'Empty reason must throw REVOCATION_REASON_REQUIRED');

        // 4. Nonexistent certificate -> 404
        $nonexistentFailed = false;
        try {
            $service->revoke($osadActor, 'e8000000-0000-4000-8000-999999999999', ['reason' => 'Valid reason', 'idempotency_key' => 'osad-revoke-404']);
        } catch (RuntimeException $e) {
            $nonexistentFailed = ($e->getMessage() === 'CERTIFICATE_NOT_FOUND');
        }
        $this->assertTrue($nonexistentFailed, 'Nonexistent cert must throw CERTIFICATE_NOT_FOUND');

        // 5. Authorized OSAD revokes ISSUED certificate
        $res = $service->revoke($osadActor, $f['certId'], [
            'reason' => 'Student registration revoked by committee',
            'reason_details' => 'Disciplinary board resolution 2026-09',
            'idempotency_key' => 'osad-revoke-key-1',
        ]);

        $this->assertSame('REVOKED', $res['status']);
        $this->assertTrue($res['revoked']);
        $this->assertSame('REVOKED', $res['certificate']['status']);

        // 6. DB Verification
        $row = $db->table('certificate_issuances')->where('id', $f['certId'])->get()->getRowArray();
        $this->assertSame('REVOKED', $row['status']);
        $this->assertSame($f['osadId'], $row['revoked_by']);
        $this->assertNotEmpty($row['revoked_at']);
        $this->assertStringContainsString('Student registration revoked by committee', $row['revocation_reason']);
        $this->assertNull($row['current_identity']);

        // 7. Original snapshot unchanged
        $snap = $db->table('certificate_issuance_snapshots')->where('certificate_issuance_id', $f['certId'])->get()->getRowArray();
        $this->assertNotNull($snap);
        $decodedSnap = json_decode($snap['snapshot_json'], true);
        $this->assertSame('AN-2026-990001', $decodedSnap['certificate_identity']['certificate_number']);

        // 8. Public verification reports REVOKED
        $verifyRes = $service->verify($f['publicId']);
        $this->assertNotNull($verifyRes);
        $this->assertSame('REVOKED', $verifyRes['status']);
        $this->assertSame('AN-2026-990001', $verifyRes['certificate_number']);
        $this->assertSame('Test Student Candidate', $verifyRes['recipient_name']);
        $this->assertFalse($verifyRes['replacement_available']);

        // 9. Already revoked certificate cannot be revoked again with new key
        $alreadyRevokedFailed = false;
        try {
            $service->revoke($osadActor, $f['certId'], ['reason' => 'Second attempt', 'idempotency_key' => 'osad-revoke-key-2']);
        } catch (RuntimeException $e) {
            $alreadyRevokedFailed = ($e->getMessage() === 'CERTIFICATE_ALREADY_REVOKED');
        }
        $this->assertTrue($alreadyRevokedFailed, 'Second revoke with different key must throw CERTIFICATE_ALREADY_REVOKED');

        // 10. Same idempotency replay returns same response
        $replayRes = $service->revoke($osadActor, $f['certId'], [
            'reason' => 'Student registration revoked by committee',
            'reason_details' => 'Disciplinary board resolution 2026-09',
            'idempotency_key' => 'osad-revoke-key-1',
        ]);
        $this->assertSame('REVOKED', $replayRes['status']);
        $this->assertSame($res['certificate']['public_verification_id'], $replayRes['certificate']['public_verification_id']);

        // 11. Idempotency key reuse with different payload is rejected
        $diffPayloadFailed = false;
        try {
            $service->revoke($osadActor, $f['certId'], [
                'reason' => 'Different reason entirely',
                'idempotency_key' => 'osad-revoke-key-1',
            ]);
        } catch (RuntimeException $e) {
            $diffPayloadFailed = ($e->getMessage() === 'IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST');
        }
        $this->assertTrue($diffPayloadFailed, 'Reused key with different payload must throw IDEMPOTENCY_KEY_REUSED_WITH_DIFFERENT_REQUEST');

        // 12. Audit log created
        $audit = $db->table('audit_logs')->where(['target_type' => 'certificate_issuance', 'target_id' => $f['certId'], 'event_code' => 'CERTIFICATE_REVOKED'])->get()->getResultArray();
        $this->assertCount(1, $audit, 'Exactly 1 CERTIFICATE_REVOKED audit log entry should exist');
        $this->assertSame($f['osadId'], $audit[0]['actor_profile_id']);
    }

    public function testReissueLifecycle(): void
    {
        $db = \Config\Database::connect('default');
        $f = $this->prepareFixture($db);
        $service = new CertificateIssuanceService(db: $db);

        $osadActor = ['profile' => ['id' => $f['osadId']], 'roles' => ['osad_staff']];
        $modActor = ['profile' => ['id' => $f['modId']], 'roles' => ['organization_moderator']];
        $studentActor = ['profile' => ['id' => $f['studentId']], 'roles' => ['student']];

        // 1. Moderator rejected
        $unauthFailed = false;
        try {
            $service->reissue($modActor, $f['certId'], ['reissue_reason' => 'Name spelling correction', 'idempotency_key' => 'mod-reissue-1']);
        } catch (RuntimeException $e) {
            $unauthFailed = ($e->getMessage() === 'UNAUTHORIZED_REISSUE');
        }
        $this->assertTrue($unauthFailed, 'Moderator must be rejected for reissue');

        // 2. Student rejected
        $studentFailed = false;
        try {
            $service->reissue($studentActor, $f['certId'], ['reissue_reason' => 'Name spelling correction', 'idempotency_key' => 'stu-reissue-1']);
        } catch (RuntimeException $e) {
            $studentFailed = ($e->getMessage() === 'UNAUTHORIZED_REISSUE');
        }
        $this->assertTrue($studentFailed, 'Student must be rejected for reissue');

        // 3. Missing reason rejected
        $missingReasonFailed = false;
        try {
            $service->reissue($osadActor, $f['certId'], ['reissue_reason' => '', 'idempotency_key' => 'osad-reissue-empty']);
        } catch (RuntimeException $e) {
            $missingReasonFailed = ($e->getMessage() === 'REISSUE_REASON_REQUIRED');
        }
        $this->assertTrue($missingReasonFailed, 'Empty reissue reason must throw REISSUE_REASON_REQUIRED');

        // 4. Authorized OSAD reissues ISSUED Certificate
        $reissueRes = $service->reissue($osadActor, $f['certId'], [
            'reissue_reason' => 'Corrected recipient name spelling',
            'reissue_reason_details' => 'Administrative correction approved by OSAD',
            'idempotency_key' => 'osad-reissue-key-1',
        ]);

        $this->assertSame('ISSUED', $reissueRes['status']);
        $this->assertTrue($reissueRes['reissued']);
        $this->assertSame($f['certId'], $reissueRes['old_certificate_id']);

        $newCert = $reissueRes['certificate'];
        $newCertId = $newCert['id'];
        $newCertNumber = $newCert['certificate_number'];
        $newPublicId = $newCert['public_verification_id'];

        // Assert new identity != old identity
        $this->assertNotSame($f['certId'], $newCertId);
        $this->assertNotSame('AN-2026-990001', $newCertNumber);
        $this->assertNotSame($f['publicId'], $newPublicId);
        $this->assertSame($f['certId'], $newCert['supersedes_certificate_id']);

        // 5. DB Verification of Old Certificate
        $oldRow = $db->table('certificate_issuances')->where('id', $f['certId'])->get()->getRowArray();
        $this->assertSame('SUPERSEDED', $oldRow['status']);
        $this->assertSame($newCertId, $oldRow['superseded_by_certificate_id']);
        $this->assertSame('Corrected recipient name spelling', $oldRow['reissue_reason']);
        $this->assertNull($oldRow['current_identity']); // Current identity is null for superseded!

        // 6. DB Verification of New Certificate
        $newRow = $db->table('certificate_issuances')->where('id', $newCertId)->get()->getRowArray();
        $this->assertSame('ISSUED', $newRow['status']);
        $this->assertSame($f['certId'], $newRow['supersedes_certificate_id']);
        $this->assertNull($newRow['superseded_by_certificate_id']);
        $this->assertNotNull($newRow['current_identity']); // Current identity is non-null for active issued!

        // 7. Uniqueness Invariant: Exactly 1 current ISSUED certificate exists for this student + source record + purpose
        $currentCount = $db->table('certificate_issuances')
            ->where('student_id', $f['studentId'])
            ->where('source_record_id', $f['sourceId'])
            ->where('certificate_purpose', 'APPRECIATION')
            ->where('status', 'ISSUED')
            ->countAllResults();
        $this->assertSame(1, $currentCount);

        // 8. New snapshot exists and old snapshot is unmodified
        $oldSnap = $db->table('certificate_issuance_snapshots')->where('certificate_issuance_id', $f['certId'])->get()->getRowArray();
        $this->assertNotNull($oldSnap);
        $oldSnapData = json_decode($oldSnap['snapshot_json'], true);
        $this->assertSame('AN-2026-990001', $oldSnapData['certificate_identity']['certificate_number']);

        $newSnap = $db->table('certificate_issuance_snapshots')->where('certificate_issuance_id', $newCertId)->get()->getRowArray();
        $this->assertNotNull($newSnap);
        $newSnapData = json_decode($newSnap['snapshot_json'], true);
        $this->assertSame($newCertNumber, $newSnapData['certificate_identity']['certificate_number']);

        // 9. Public Verification
        // Old verification shows SUPERSEDED and replacement available
        $oldVerify = $service->verify($f['publicId']);
        $this->assertNotNull($oldVerify);
        $this->assertSame('SUPERSEDED', $oldVerify['status']);
        $this->assertTrue($oldVerify['replacement_available']);
        $this->assertSame($newPublicId, $oldVerify['replacement_public_verification_id']);
        $this->assertSame('/verify/certificate/' . $newPublicId, $oldVerify['replacement_url']);

        // New verification shows ISSUED
        $newVerify = $service->verify($newPublicId);
        $this->assertNotNull($newVerify);
        $this->assertSame('ISSUED', $newVerify['status']);
        $this->assertFalse($newVerify['replacement_available']);
        $this->assertSame($newCertNumber, $newVerify['certificate_number']);

        // 10. Already superseded certificate cannot be reissued again with a new key
        $alreadySupersededFailed = false;
        try {
            $service->reissue($osadActor, $f['certId'], ['reissue_reason' => 'Another reissue', 'idempotency_key' => 'osad-reissue-key-2']);
        } catch (RuntimeException $e) {
            $alreadySupersededFailed = ($e->getMessage() === 'CERTIFICATE_ALREADY_SUPERSEDED');
        }
        $this->assertTrue($alreadySupersededFailed, 'Superseded certificate cannot be reissued again');

        // 11. Idempotency replay with same key returns same replacement certificate
        $replayRes = $service->reissue($osadActor, $f['certId'], [
            'reissue_reason' => 'Corrected recipient name spelling',
            'reissue_reason_details' => 'Administrative correction approved by OSAD',
            'idempotency_key' => 'osad-reissue-key-1',
        ]);
        $this->assertSame('ISSUED', $replayRes['status']);
        $this->assertSame($newCertId, $replayRes['certificate']['id']);
        $this->assertSame($newCertNumber, $replayRes['certificate']['certificate_number']);

        // 12. Audit log entries
        $auditReissue = $db->table('audit_logs')->where(['target_type' => 'certificate_issuance', 'target_id' => $newCertId, 'event_code' => 'CERTIFICATE_REISSUED'])->countAllResults();
        $this->assertSame(1, $auditReissue, 'Exactly 1 CERTIFICATE_REISSUED audit entry');

        $auditSuperseded = $db->table('audit_logs')->where(['target_type' => 'certificate_issuance', 'target_id' => $f['certId'], 'event_code' => 'CERTIFICATE_SUPERSEDED'])->countAllResults();
        $this->assertSame(1, $auditSuperseded, 'Exactly 1 CERTIFICATE_SUPERSEDED audit entry');
    }

    public function testRevokedCertificateCannotBeReissued(): void
    {
        $db = \Config\Database::connect('default');
        $f = $this->prepareFixture($db);
        $service = new CertificateIssuanceService(db: $db);
        $osadActor = ['profile' => ['id' => $f['osadId']], 'roles' => ['osad_staff']];

        // Revoke first
        $service->revoke($osadActor, $f['certId'], ['reason' => 'Initial revocation', 'idempotency_key' => 'rev-before-reissue']);

        // Attempt reissue on revoked certificate
        $reissueRevokedFailed = false;
        try {
            $service->reissue($osadActor, $f['certId'], ['reissue_reason' => 'Attempt to reissue revoked', 'idempotency_key' => 'reissue-revoked-attempt']);
        } catch (RuntimeException $e) {
            $reissueRevokedFailed = ($e->getMessage() === 'CERTIFICATE_REVOKED');
        }
        $this->assertTrue($reissueRevokedFailed, 'Reissue on REVOKED certificate must fail with CERTIFICATE_REVOKED');
    }

    public function testReissueRollbackOnFailure(): void
    {
        $db = \Config\Database::connect('default');
        $f = $this->prepareFixture($db);
        $service = new CertificateIssuanceService(db: $db);
        $osadActor = ['profile' => ['id' => $f['osadId']], 'roles' => ['osad_staff']];

        // Deactivate template version so template resolution fails and throws MISSING_PUBLISHED_TEMPLATE
        $db->table('certificate_template_versions')->where('id', $f['versionId'])->update(['status' => 'draft']);

        $exceptionThrown = false;
        try {
            $service->reissue($osadActor, $f['certId'], ['reissue_reason' => 'Attempt reissue with draft template', 'idempotency_key' => 'reissue-rollback-key']);
        } catch (RuntimeException $e) {
            $exceptionThrown = ($e->getMessage() === 'MISSING_PUBLISHED_TEMPLATE');
        }
        $this->assertTrue($exceptionThrown, 'Must throw MISSING_PUBLISHED_TEMPLATE');

        // Verify transaction rolled back: old certificate remains in ISSUED status and no partial supersession persisted
        $oldCert = $db->table('certificate_issuances')->where('id', $f['certId'])->get()->getRowArray();
        $this->assertSame('ISSUED', $oldCert['status']);
        $this->assertNull($oldCert['superseded_by_certificate_id']);
        $this->assertNotNull($oldCert['current_identity']);
    }
}
