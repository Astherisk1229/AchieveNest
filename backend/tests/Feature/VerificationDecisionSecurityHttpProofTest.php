<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 3 proof: decisions are race-safe, require clean evidence, stay program-scoped, and the
 * removed bypass routes (/verification/{id}/decide, POST /achievements) are gone.
 * Requires the local WAMP backend at http://127.0.0.1:8080 and the local_defense database.
 *
 * @group http-proof
 */
final class VerificationDecisionSecurityHttpProofTest extends CIUnitTestCase
{
    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const SSG_SUBCATEGORY = '40000001-0001-0000-0000-000000000001';

    protected $db;
    private array $tokens = [];
    private array $recordIds = [];
    private ?string $student = null;
    private string $startedAt = '';

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $config = new \Config\Database();
        $config->default = $config->local_defense;
        $config->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
        $this->startedAt = date('Y-m-d H:i:s', time() - 1);
    }

    protected function tearDown(): void
    {
        $this->cleanup();
        parent::tearDown();
    }

    public function testDecisionsAreRaceSafeCleanEvidenceGatedAndScoped(): void
    {
        [$student, $coordinator, $programId] = $this->routableStudentAndCoordinator();
        $this->student = $student;
        $outsider = $this->coordinatorOutside($programId);
        $coordinatorToken = $this->token($coordinator);
        $outsiderToken = $this->token($outsider);
        $studentToken = $this->token($student);

        // 1. Approve twice sequentially: second call 409, still exactly one 'verified' event.
        $a = $this->fixture($student, 'clean');
        $first = $this->json('POST', "/portfolio/{$a}/verify", ['remarks' => ''], $coordinatorToken);
        self::assertSame(200, $first['status'], $first['raw']);
        $second = $this->json('POST', "/portfolio/{$a}/verify", ['remarks' => ''], $coordinatorToken);
        self::assertSame(409, $second['status'], $second['raw']);
        self::assertSame('DECISION_ALREADY_RECORDED', $second['body']['error']['code']);
        self::assertSame(1, $this->eventCount($a, 'verified'));

        // 2. Another program's coordinator is refused with 403 even on an already-decided record.
        $outside = $this->json('POST', "/portfolio/{$a}/verify", ['remarks' => ''], $outsiderToken);
        self::assertSame(403, $outside['status'], $outside['raw']);

        // 3. Two concurrent approvals: exactly one succeeds, exactly one event.
        $b = $this->fixture($student, 'clean');
        $statuses = $this->concurrentPosts("/portfolio/{$b}/verify", $coordinatorToken, 2);
        sort($statuses);
        self::assertSame([200, 409], $statuses, 'Concurrent approvals must produce one 200 and one 409.');
        self::assertSame(1, $this->eventCount($b, 'verified'));
        self::assertSame('verified', $this->recordStatus($b));

        // 4. Evidence that has not passed the scan cannot be approved.
        $c = $this->fixture($student, 'pending');
        $dirty = $this->json('POST', "/portfolio/{$c}/verify", ['remarks' => ''], $coordinatorToken);
        self::assertSame(422, $dirty['status'], $dirty['raw']);
        self::assertSame('CLEAN_EVIDENCE_REQUIRED', $dirty['body']['error']['code']);
        self::assertSame('submitted', $this->recordStatus($c));
        self::assertSame(403, $this->json('POST', "/portfolio/{$c}/reject", ['remarks' => 'Not yours.'], $outsiderToken)['status']);

        // 5. Removed bypass routes.
        self::assertSame(404, $this->json('POST', "/verification/{$c}/decide", ['decision' => 'approved'], $coordinatorToken)['status']);
        self::assertSame('submitted', $this->recordStatus($c));
        $before = $this->db->table('student_portfolio_records')->where('student_profile_id', $student)->countAllResults();
        $bypass = $this->json('POST', '/achievements', ['title' => 'Bypass attempt', 'category' => 'SPORTS'], $studentToken);
        self::assertSame(404, $bypass['status'], $bypass['raw']);
        self::assertSame($before, $this->db->table('student_portfolio_records')->where('student_profile_id', $student)->countAllResults());
    }

    /** @return array{0: string, 1: string, 2: string} credentialed student, their coordinator, program */
    private function routableStudentAndCoordinator(): array
    {
        $rows = $this->db->query(
            "SELECT spe.student_profile_id, MIN(pca.personnel_profile_id) AS coordinator_id, MIN(spe.academic_program_id) AS program_id
             FROM student_program_enrollments spe
             JOIN academic_programs ap ON ap.id = spe.academic_program_id AND ap.status = 'active'
             JOIN profiles sp ON sp.id = spe.student_profile_id AND sp.status = 'active' AND sp.account_type = 'student'
             JOIN local_auth_credentials sc ON sc.profile_id = sp.id AND sc.status = 'active' AND sc.must_change_password = 0
             JOIN program_coordinator_assignments pca ON pca.academic_program_id = spe.academic_program_id AND pca.is_active = 1
             JOIN profiles cp ON cp.id = pca.personnel_profile_id AND cp.status = 'active'
             JOIN local_auth_credentials cc ON cc.profile_id = cp.id AND cc.status = 'active' AND cc.must_change_password = 0
             WHERE spe.is_active = 1
             GROUP BY spe.student_profile_id
             HAVING COUNT(DISTINCT spe.academic_program_id) = 1 AND COUNT(DISTINCT pca.personnel_profile_id) = 1
             LIMIT 1"
        )->getResultArray();
        if ($rows === []) {
            self::markTestSkipped('No credentialed student with one program and one credentialed active coordinator.');
        }

        return [(string) $rows[0]['student_profile_id'], (string) $rows[0]['coordinator_id'], (string) $rows[0]['program_id']];
    }

    private function coordinatorOutside(string $programId): string
    {
        $row = $this->db->query(
            "SELECT pca.personnel_profile_id AS id
             FROM program_coordinator_assignments pca
             JOIN profiles p ON p.id = pca.personnel_profile_id AND p.status = 'active'
             JOIN local_auth_credentials c ON c.profile_id = p.id AND c.status = 'active' AND c.must_change_password = 0
             WHERE pca.is_active = 1
               AND pca.personnel_profile_id NOT IN (
                   SELECT personnel_profile_id FROM program_coordinator_assignments WHERE academic_program_id = ? AND is_active = 1)
             LIMIT 1",
            [$programId]
        )->getRowArray();
        if ($row === null) {
            self::markTestSkipped('No credentialed coordinator assigned to a different program.');
        }

        return (string) $row['id'];
    }

    /** Test fixture: a submitted record with one stored evidence file in the given security state. */
    private function fixture(string $student, string $securityStatus): string
    {
        $category = $this->db->table('portfolio_subcategories')->select('category_id')->where('id', self::SSG_SUBCATEGORY)->get()->getRowArray();
        self::assertNotNull($category);
        $recordId = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $this->db->table('student_portfolio_records')->insert([
            'id' => $recordId, 'student_profile_id' => $student, 'category_id' => $category['category_id'],
            'subcategory_id' => self::SSG_SUBCATEGORY, 'title' => 'Step3 proof ' . bin2hex(random_bytes(4)),
            'organizer_or_body' => 'Supreme Student Government', 'start_date' => '2025-08-01', 'occurrence_date' => '2025-08-01',
            'structured_metadata' => json_encode(['schema_version' => '1.0', 'academic_year' => '2025-2026', 'semester' => '1st_semester']),
            'status' => 'submitted', 'submitted_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->recordIds[] = $recordId;
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $stored = (new LocalEvidenceStorageService())->storeFile($sample, 'student', $student, $recordId, 'jpg', false);
        $this->db->table('student_portfolio_evidence')->insert([
            'id' => $this->uuid(), 'portfolio_record_id' => $recordId, 'storage_path' => $stored['storage_path'],
            'original_filename' => 'proof.jpg', 'mime_type' => 'image/jpeg', 'detected_mime_type' => 'image/jpeg',
            'byte_size' => $stored['byte_size'], 'sha256' => $stored['sha256'], 'evidence_type' => 'certificate',
            'uploaded_by' => $student, 'uploaded_at' => $now, 'security_status' => $securityStatus,
            'malware_scanner' => $securityStatus === 'clean' ? 'clamav_1_5_4' : 'clamav_pending', 'status' => 'active',
        ]);

        return $recordId;
    }

    /** Fires identical POSTs at the same time with curl_multi; returns their HTTP statuses. */
    private function concurrentPosts(string $path, string $token, int $count): array
    {
        if (! function_exists('curl_multi_init')) {
            self::markTestIncomplete('The PHP curl extension is required for the concurrency check.');
        }
        $multi = curl_multi_init();
        $handles = [];
        for ($i = 0; $i < $count; $i++) {
            $handle = curl_init(self::BASE . $path);
            curl_setopt_array($handle, [
                CURLOPT_POST => true, CURLOPT_POSTFIELDS => '{"remarks":""}', CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60,
                CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Content-Type: application/json', 'Accept: application/json'],
            ]);
            curl_multi_add_handle($multi, $handle);
            $handles[] = $handle;
        }
        do {
            $status = curl_multi_exec($multi, $running);
            if ($running) {
                curl_multi_select($multi, 1.0);
            }
        } while ($running && $status === CURLM_OK);
        $codes = [];
        foreach ($handles as $handle) {
            $codes[] = (int) curl_getinfo($handle, CURLINFO_RESPONSE_CODE);
            curl_multi_remove_handle($multi, $handle);
        }
        curl_multi_close($multi);

        return $codes;
    }

    private function eventCount(string $recordId, string $action): int
    {
        return $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $recordId)->where('action', $action)->countAllResults();
    }

    private function recordStatus(string $recordId): string
    {
        return (string) ($this->db->table('student_portfolio_records')->select('status')->where('id', $recordId)->get()->getRowArray()['status'] ?? '');
    }

    private function token(string $profileId): string
    {
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'step3-http-proof')['access_token'];
        $this->tokens[] = $token;

        return $token;
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }

    private function json(string $method, string $path, ?array $payload, string $token): array
    {
        $data = $payload === null ? '' : json_encode($payload);
        $headers = ['Authorization: Bearer ' . $token, 'Accept: application/json'];
        if ($payload !== null) {
            $headers[] = 'Content-Type: application/json';
            $headers[] = 'Content-Length: ' . strlen($data);
        }
        $context = stream_context_create(['http' => ['method' => $method, 'ignore_errors' => true, 'timeout' => 60, 'header' => $headers, 'content' => $data]]);
        $raw = (string) file_get_contents(self::BASE . $path, false, $context);
        $status = (int) preg_replace('/^\S+\s(\d{3}).*$/', '$1', $http_response_header[0] ?? 'HTTP/1.1 000');

        return ['status' => $status, 'raw' => $raw, 'body' => json_decode($raw, true) ?? []];
    }

    private function cleanup(): void
    {
        foreach ($this->tokens as $token) {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }
        // Step 6: approvals now score automatically. Remove the contributions and scoring events this run created.
        if ($this->student !== null && $this->db->tableExists('student_achievement_criterion_contributions')) {
            $studentRecords = array_column($this->db->table('student_portfolio_records')->select('id')->where('student_profile_id', $this->student)->get()->getResultArray(), 'id');
            if ($studentRecords !== []) {
                $this->db->table('student_achievement_criterion_contributions')->whereIn('portfolio_record_id', $studentRecords)->where('created_at >=', $this->startedAt)->delete();
                $this->db->table('student_portfolio_verification_events')->whereIn('portfolio_record_id', $studentRecords)
                    ->whereIn('action', ['scoring_requested', 'criteria_scored', 'scoring_failed'])->where('occurred_at >=', $this->startedAt)->delete();
            }
            $this->db->table('student_achievement_criterion_contributions')->whereIn('portfolio_record_id', $this->recordIds ?: ['-'])->delete();
        }
        $storage = new LocalEvidenceStorageService();
        foreach ($this->recordIds as $recordId) {
            foreach ($this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $recordId)->get()->getResultArray() as $row) {
                $storage->deletePhysicalFile((string) $row['storage_path']);
            }
            // Test-fixture cleanup only; production code never deletes verification history.
            $this->db->table('notifications')->where('reference_id', $recordId)->delete();
            $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $recordId)->delete();
            $this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $recordId)->delete();
            $this->db->table('student_portfolio_records')->where('id', $recordId)->delete();
        }
    }
}
