<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 1 proof: student submission through the single system of record (student_portfolio_records).
 * Requires the local WAMP backend at http://127.0.0.1:8080, the local_defense database, ClamAV, and
 * the OCR sample dataset. Every row and file this test creates is removed in tearDown().
 *
 * @group http-proof
 */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentPortfolioSubmissionHttpProofTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

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

    public function testStudentSubmissionReturnAndResubmitUseOneLegacyRecord(): void
    {
        [$student, $coordinator] = $this->routableStudentAndCoordinator();
        $other = $this->activeCredentialedProfile('student', [$student]);
        $studentToken = $this->token($student);
        $otherToken = $this->token($other);
        $coordinatorToken = $this->token($coordinator);
        $category = $this->db->table('portfolio_subcategories')->select('category_id')->where('id', self::SSG_SUBCATEGORY)->get()->getRowArray();
        self::assertNotNull($category, 'SSG subcategory reference row is missing.');

        // 1. Lazy draft: category only, no title yet (evidence-first entry).
        $created = $this->json('POST', '/portfolio', ['category_id' => $category['category_id'], 'submit_now' => false], $studentToken);
        self::assertSame(201, $created['status'], json_encode($created));
        $this->recordId = $created['body']['data']['id'];
        self::assertSame('draft', $this->record()['status']);

        // 2. Upload policy rejects non PDF/JPEG/PNG.
        $bad = $this->upload($this->recordId, 'not evidence', 'notes.txt', 'text/plain', $studentToken);
        self::assertContains($bad['status'], [415, 422], json_encode($bad));

        // 3. Real evidence upload is persisted as pending.
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $upload = $this->upload($this->recordId, (string) file_get_contents($sample), 'proof.jpg', 'image/jpeg', $studentToken);
        self::assertSame(201, $upload['status'], json_encode($upload));
        $evidenceId = $upload['body']['data']['evidence']['id'];
        self::assertSame('pending', $this->evidence($evidenceId)['security_status']);

        // 4. Complete the details; protected fields are refused.
        $title = 'Step1 proof SSG Secretary ' . bin2hex(random_bytes(4));
        $details = [
            'title' => $title,
            'organizer_or_body' => 'Supreme Student Government',
            'start_date' => '2025-08-01',
            'occurrence_date' => '2025-08-01',
            'category_id' => $category['category_id'],
            'subcategory_id' => self::SSG_SUBCATEGORY,
            'structured_metadata' => [
                'schema_version' => '1.0', 'academic_year' => '2025-2026', 'semester' => '1st_semester',
                'organization_name' => 'Supreme Student Government', 'position_level' => 'officer', 'position_title' => 'Secretary',
            ],
        ];
        foreach (['status' => 'verified', 'points' => 999, 'verified_by' => $coordinator, 'student_profile_id' => $other] as $field => $value) {
            $attempt = $this->json('PUT', '/portfolio/' . $this->recordId, $details + [$field => $value], $studentToken);
            self::assertSame(422, $attempt['status'], $field . ' ' . json_encode($attempt));
            self::assertSame('PROTECTED_FIELDS_NOT_EDITABLE', $attempt['body']['error']['code']);
        }
        $saved = $this->json('PUT', '/portfolio/' . $this->recordId, $details, $studentToken);
        self::assertSame(200, $saved['status'], json_encode($saved));
        $row = $this->record();
        self::assertSame($title, $row['title']);
        self::assertSame('Supreme Student Government', $row['organizer_or_body']);
        self::assertSame('2025-08-01', substr((string) $row['start_date'], 0, 10));

        // 5. Pending evidence cannot be submitted.
        $early = $this->json('POST', '/portfolio/' . $this->recordId . '/resubmit', [], $studentToken);
        self::assertSame(422, $early['status'], json_encode($early));
        self::assertSame('CLEAN_EVIDENCE_REQUIRED', $early['body']['error']['code']);

        // 6. Owner-only scan marks the evidence clean.
        self::assertSame(403, $this->json('POST', "/portfolio/{$this->recordId}/evidence/{$evidenceId}/scan", [], $otherToken)['status']);
        $scan = $this->json('POST', "/portfolio/{$this->recordId}/evidence/{$evidenceId}/scan", [], $studentToken);
        self::assertSame(200, $scan['status'], json_encode($scan));
        if (($scan['body']['data']['scan']['status'] ?? '') !== 'clean') {
            self::markTestIncomplete('ClamAV did not return clean: ' . json_encode($scan['body']['data']['scan'] ?? null));
        }
        self::assertSame('clean', $this->evidence($evidenceId)['security_status']);

        // 6b. Advisory OCR is a separate owner-only request and never blocks entry.
        self::assertSame(403, $this->json('POST', "/portfolio/{$this->recordId}/evidence/{$evidenceId}/ocr", [], $otherToken)['status']);
        $ocr = $this->json('POST', "/portfolio/{$this->recordId}/evidence/{$evidenceId}/ocr", [], $studentToken);
        self::assertSame(200, $ocr['status'], json_encode($ocr));
        self::assertTrue(array_key_exists('ocr', $ocr['body']['data'] ?? []), json_encode($ocr));

        // 7. Soft removal of an extra draft attachment keeps the file.
        $extra = $this->upload($this->recordId, (string) file_get_contents($sample), 'extra.jpg', 'image/jpeg', $studentToken);
        self::assertSame(201, $extra['status'], json_encode($extra));
        $extraId = $extra['body']['data']['evidence']['id'];
        self::assertSame(403, $this->json('DELETE', "/portfolio/{$this->recordId}/evidence/{$extraId}", [], $otherToken)['status']);
        $removed = $this->json('DELETE', "/portfolio/{$this->recordId}/evidence/{$extraId}", [], $studentToken);
        self::assertSame(200, $removed['status'], json_encode($removed));
        $extraRow = $this->evidence($extraId);
        self::assertSame('deleted', $extraRow['status']);
        self::assertFileExists((string) (new LocalEvidenceStorageService())->resolveAbsolutePath($extraRow['storage_path']));

        // 8. Submit: one record, status submitted, one 'submitted' event, file bytes on disk.
        $submit = $this->json('POST', '/portfolio/' . $this->recordId . '/resubmit', [], $studentToken);
        self::assertSame(200, $submit['status'], json_encode($submit));
        $row = $this->record();
        self::assertSame('submitted', $row['status']);
        self::assertNotEmpty($row['submitted_at']);
        self::assertSame(1, $this->db->table('student_portfolio_records')->where('student_profile_id', $student)->where('title', $title)->countAllResults());
        self::assertSame(['submitted'], array_column($this->events(), 'action'));
        self::assertFileExists((string) (new LocalEvidenceStorageService())->resolveAbsolutePath($this->evidence($evidenceId)['storage_path']));

        // 9. Other students cannot read the record or its evidence.
        self::assertSame(403, $this->json('GET', '/portfolio/' . $this->recordId, null, $otherToken)['status']);
        self::assertSame(403, $this->raw('GET', '/evidence/student/' . $evidenceId . '/download', $otherToken)['status']);
        // Submitted records are no longer editable by the owner.
        self::assertSame(403, $this->json('DELETE', "/portfolio/{$this->recordId}/evidence/{$evidenceId}", [], $studentToken)['status']);

        // 10. Coordinator returns it; student edits and resubmits the same record.
        $returned = $this->json('POST', '/portfolio/' . $this->recordId . '/request-revision', ['remarks' => 'Please attach the signed appointment letter.'], $coordinatorToken);
        self::assertSame(200, $returned['status'], json_encode($returned));
        $edited = $this->json('PUT', '/portfolio/' . $this->recordId, ['description' => 'Signed appointment attached.'], $studentToken);
        self::assertSame(200, $edited['status'], json_encode($edited));
        $again = $this->json('POST', '/portfolio/' . $this->recordId . '/resubmit', [], $studentToken);
        self::assertSame(200, $again['status'], json_encode($again));
        self::assertSame($this->recordId, $again['body']['data']['id']);
        self::assertSame('submitted', $this->record()['status']);
        // Event timestamps have one-second resolution, so compare the multiset of actions.
        $actions = array_count_values(array_column($this->events(), 'action'));
        ksort($actions);
        self::assertSame(['resubmitted' => 1, 'revision_requested' => 1, 'submitted' => 1], $actions);
    }

    /** @return array{0: string, 1: string} student profile id and their single active coordinator */
    private function routableStudentAndCoordinator(): array
    {
        $rows = $this->db->query(
            "SELECT spe.student_profile_id, MIN(pca.personnel_profile_id) AS coordinator_id
             FROM student_program_enrollments spe
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
            self::markTestSkipped('No credentialed student with exactly one program and one credentialed active coordinator.');
        }

        return [(string) $rows[0]['student_profile_id'], (string) $rows[0]['coordinator_id']];
    }

    private function activeCredentialedProfile(string $accountType, array $exclude): string
    {
        $row = $this->db->table('profiles p')->select('p.id')
            ->join('local_auth_credentials c', "c.profile_id = p.id AND c.status = 'active' AND c.must_change_password = 0")
            ->where('p.account_type', $accountType)->where('p.status', 'active')->whereNotIn('p.id', $exclude)
            ->get(1)->getRowArray();
        if ($row === null) {
            self::markTestSkipped("No second credentialed {$accountType} account.");
        }

        return (string) $row['id'];
    }

    private function token(string $profileId): string
    {
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'step1-http-proof')['access_token'];
        $this->tokens[] = $token;

        return $token;
    }

    private function record(): array
    {
        return (array) $this->db->table('student_portfolio_records')->where('id', $this->recordId)->get()->getRowArray();
    }

    private function evidence(string $id): array
    {
        return (array) $this->db->table('student_portfolio_evidence')->where('id', $id)->get()->getRowArray();
    }

    private function events(): array
    {
        return $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $this->recordId)
            ->orderBy('occurred_at', 'ASC')->get()->getResultArray();
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

    private function upload(string $record, string $bytes, string $name, string $mime, string $token): array
    {
        $boundary = '----AchieveNest' . bin2hex(random_bytes(8));
        $body = "--{$boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{$name}\"\r\nContent-Type: {$mime}\r\n\r\n{$bytes}\r\n--{$boundary}--\r\n";
        $result = $this->raw('POST', "/portfolio/{$record}/evidence", $token, [
            'Authorization: Bearer ' . $token, 'Accept: application/json',
            'Content-Type: multipart/form-data; boundary=' . $boundary, 'Content-Length: ' . strlen($body),
        ], $body);
        $result['body'] = json_decode($result['raw'], true) ?? [];

        return $result;
    }

    private function raw(string $method, string $path, string $token, ?array $headers = null, string $content = ''): array
    {
        $context = stream_context_create(['http' => [
            'method' => $method, 'ignore_errors' => true, 'timeout' => 150,
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
