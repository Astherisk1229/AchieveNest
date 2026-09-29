<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 2 proof: Program Coordinator review through /program-coordinator/verification-queue,
 * /evidence/student/{id}/download and /portfolio/{id}/reject. Requires the local WAMP backend at
 * http://127.0.0.1:8080 and the local_defense database. Fixture rows/files are removed in tearDown().
 *
 * @group http-proof
 */
final class CoordinatorReviewHttpProofTest extends CIUnitTestCase
{
    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const SSG_SUBCATEGORY = '40000001-0001-0000-0000-000000000001';

    protected $db;
    private array $tokens = [];
    private ?string $recordId = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $config = new \Config\Database();
        $config->default = $config->local_defense;
        $config->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $config);
    }

    protected function tearDown(): void
    {
        $this->cleanup();
        parent::tearDown();
    }

    public function testCoordinatorSeesSafeEvidenceAndRejectsWithRequiredRemarks(): void
    {
        [$student, $coordinator, $programId] = $this->routableStudentAndCoordinator();
        $outsider = $this->coordinatorOutside($programId);
        $coordinatorToken = $this->token($coordinator);
        $outsiderToken = $this->token($outsider);

        [$this->recordId, $evidenceId, $bytes] = $this->submittedRecordWithCleanEvidence($student);

        // 1. Default queue contains the record with reviewer-safe evidence only.
        $queue = $this->json('GET', '/program-coordinator/verification-queue', null, $coordinatorToken);
        self::assertSame(200, $queue['status'], $queue['raw']);
        self::assertStringNotContainsString('storage_path', $queue['raw']);
        $item = $this->find($queue['body']['data']['queue'] ?? [], $this->recordId);
        self::assertNotNull($item, 'Submitted record missing from the coordinator queue.');
        self::assertCount(1, $item['evidence']);
        self::assertSame($evidenceId, $item['evidence'][0]['id']);
        self::assertArrayNotHasKey('sha256', $item['evidence'][0]);
        self::assertArrayNotHasKey('storage_path', $item['evidence'][0]);

        // 2. The coordinator can open the real file; another program's coordinator cannot.
        $download = $this->raw('GET', '/evidence/student/' . $evidenceId . '/download', $coordinatorToken);
        self::assertSame(200, $download['status']);
        self::assertSame(strlen($bytes), strlen($download['raw']));
        self::assertSame(403, $this->raw('GET', '/evidence/student/' . $evidenceId . '/download', $outsiderToken)['status']);

        // 3. Record detail includes evidence without hashes and the event timeline.
        $detail = $this->json('GET', '/portfolio/' . $this->recordId, null, $coordinatorToken);
        self::assertSame(200, $detail['status'], $detail['raw']);
        self::assertArrayNotHasKey('sha256', $detail['body']['data']['evidence'][0]);
        self::assertContains('submitted', array_column($detail['body']['data']['events'], 'action'));

        // 4. Reject requires remarks; outsiders are forbidden.
        $empty = $this->json('POST', '/portfolio/' . $this->recordId . '/reject', ['remarks' => '   '], $coordinatorToken);
        self::assertSame(422, $empty['status'], $empty['raw']);
        self::assertSame('REMARKS_REQUIRED', $empty['body']['error']['code']);
        self::assertSame(403, $this->json('POST', '/portfolio/' . $this->recordId . '/reject', ['remarks' => 'Not yours.'], $outsiderToken)['status']);
        self::assertSame('submitted', $this->record()['status']);

        // 5. Reject with remarks: status, event with remarks, student notification, leaves the queue.
        $remarks = 'The certificate is not issued by a recognized body.';
        $reject = $this->json('POST', '/portfolio/' . $this->recordId . '/reject', ['remarks' => $remarks], $coordinatorToken);
        self::assertSame(200, $reject['status'], $reject['raw']);
        self::assertSame('rejected', $this->record()['status']);
        $event = $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $this->recordId)->where('action', 'rejected')->get()->getRowArray();
        self::assertNotNull($event);
        self::assertSame($remarks, $event['remarks']);
        self::assertSame($coordinator, $event['actor_profile_id']);
        self::assertSame(1, $this->db->table('notifications')->where('recipient_profile_id', $student)->where('reference_id', $this->recordId)->countAllResults());

        $after = $this->json('GET', '/program-coordinator/verification-queue', null, $coordinatorToken);
        self::assertNull($this->find($after['body']['data']['queue'] ?? [], $this->recordId), 'Rejected record should leave the default queue.');
        $history = $this->json('GET', '/program-coordinator/verification-queue?status=rejected', null, $coordinatorToken);
        self::assertNotNull($this->find($history['body']['data']['queue'] ?? [], $this->recordId));
        self::assertSame(422, $this->json('GET', '/program-coordinator/verification-queue?status=bogus', null, $coordinatorToken)['status']);
    }

    /** @return array{0: string, 1: string, 2: string} student, their single active coordinator, program */
    private function routableStudentAndCoordinator(): array
    {
        $rows = $this->db->query(
            "SELECT spe.student_profile_id, MIN(pca.personnel_profile_id) AS coordinator_id, MIN(spe.academic_program_id) AS program_id
             FROM student_program_enrollments spe
             JOIN profiles sp ON sp.id = spe.student_profile_id AND sp.status = 'active' AND sp.account_type = 'student'
             JOIN program_coordinator_assignments pca ON pca.academic_program_id = spe.academic_program_id AND pca.is_active = 1
             JOIN profiles cp ON cp.id = pca.personnel_profile_id AND cp.status = 'active'
             JOIN local_auth_credentials cc ON cc.profile_id = cp.id AND cc.status = 'active' AND cc.must_change_password = 0
             WHERE spe.is_active = 1
             GROUP BY spe.student_profile_id
             HAVING COUNT(DISTINCT spe.academic_program_id) = 1 AND COUNT(DISTINCT pca.personnel_profile_id) = 1
             LIMIT 1"
        )->getResultArray();
        if ($rows === []) {
            self::markTestSkipped('No student with exactly one program and one credentialed active coordinator.');
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

    /** Test fixture: a submitted record with one clean, stored evidence file. */
    private function submittedRecordWithCleanEvidence(string $student): array
    {
        $category = $this->db->table('portfolio_subcategories')->select('category_id')->where('id', self::SSG_SUBCATEGORY)->get()->getRowArray();
        self::assertNotNull($category);
        $recordId = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $this->db->table('student_portfolio_records')->insert([
            'id' => $recordId, 'student_profile_id' => $student, 'category_id' => $category['category_id'],
            'subcategory_id' => self::SSG_SUBCATEGORY, 'title' => 'Step2 proof ' . bin2hex(random_bytes(4)),
            'organizer_or_body' => 'Supreme Student Government', 'start_date' => '2025-08-01', 'occurrence_date' => '2025-08-01',
            'structured_metadata' => json_encode(['schema_version' => '1.0', 'academic_year' => '2025-2026', 'semester' => '1st_semester']),
            'status' => 'submitted', 'submitted_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->db->table('student_portfolio_verification_events')->insert([
            'id' => $this->uuid(), 'portfolio_record_id' => $recordId, 'actor_profile_id' => $student,
            'action' => 'submitted', 'previous_status' => 'draft', 'new_status' => 'submitted', 'occurred_at' => $now,
        ]);
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $stored = (new LocalEvidenceStorageService())->storeFile($sample, 'student', $student, $recordId, 'jpg', false);
        $evidenceId = $this->uuid();
        $this->db->table('student_portfolio_evidence')->insert([
            'id' => $evidenceId, 'portfolio_record_id' => $recordId, 'storage_path' => $stored['storage_path'],
            'original_filename' => 'proof.jpg', 'mime_type' => 'image/jpeg', 'detected_mime_type' => 'image/jpeg',
            'byte_size' => $stored['byte_size'], 'sha256' => $stored['sha256'], 'evidence_type' => 'certificate',
            'uploaded_by' => $student, 'uploaded_at' => $now, 'security_status' => 'clean', 'malware_scanner' => 'clamav_1_5_4',
            'status' => 'active',
        ]);

        return [$recordId, $evidenceId, (string) file_get_contents($sample)];
    }

    private function find(array $queue, ?string $id): ?array
    {
        foreach ($queue as $row) {
            if (($row['id'] ?? null) === $id) {
                return $row;
            }
        }

        return null;
    }

    private function record(): array
    {
        return (array) $this->db->table('student_portfolio_records')->where('id', $this->recordId)->get()->getRowArray();
    }

    private function token(string $profileId): string
    {
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'step2-http-proof')['access_token'];
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
        $result = $this->raw($method, $path, $token, $headers, $data);
        $result['body'] = json_decode($result['raw'], true) ?? [];

        return $result;
    }

    private function raw(string $method, string $path, string $token, ?array $headers = null, string $content = ''): array
    {
        $context = stream_context_create(['http' => [
            'method' => $method, 'ignore_errors' => true, 'timeout' => 60,
            'header' => $headers ?? ['Authorization: Bearer ' . $token],
            'content' => $content,
        ]]);
        $raw = file_get_contents(self::BASE . $path, false, $context);
        $status = (int) preg_replace('/^\S+\s(\d{3}).*$/', '$1', $http_response_header[0] ?? 'HTTP/1.1 000');

        return ['status' => $status, 'raw' => (string) $raw];
    }

    private function cleanup(): void
    {
        foreach ($this->tokens as $token) {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }
        if ($this->recordId === null) {
            return;
        }
        $storage = new LocalEvidenceStorageService();
        foreach ($this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $this->recordId)->get()->getResultArray() as $row) {
            $storage->deletePhysicalFile((string) $row['storage_path']);
        }
        // Test-fixture cleanup only; production code never deletes verification history.
        $this->db->table('notifications')->where('reference_id', $this->recordId)->delete();
        $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $this->recordId)->delete();
        $this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $this->recordId)->delete();
        $this->db->table('student_portfolio_records')->where('id', $this->recordId)->delete();
    }
}
