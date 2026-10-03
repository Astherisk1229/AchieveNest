<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 4 proof: no student-reachable response contains a point/score key, and the award rubric
 * endpoints are OSAD-only. Requires the local WAMP backend at http://127.0.0.1:8080 and the
 * local_defense database. The verified fixture record and its file are removed in tearDown().
 *
 * @group http-proof
 */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentPointPrivacyHttpProofTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const SSG_SUBCATEGORY = '40000001-0001-0000-0000-000000000001';
    private const FORBIDDEN_KEY = '/(points|score|total_points|awarded_points|raw_score|potential_score|max_points|weight)/i';

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

    public function testStudentReachableResponsesContainNoPointOrScoreKeys(): void
    {
        $student = $this->credentialedStudent();
        $token = $this->token($student);
        [$this->recordId, $evidenceId] = $this->verifiedRecordWithEvidence($student);

        $calls = [
            '/portfolio',
            '/portfolio?status=verified',
            '/portfolio/' . $this->recordId,
            '/portfolio/categories',
            '/notifications',
            '/student/profile',
            '/evidence/student/' . $evidenceId,
            '/achievements',
        ];
        foreach ($calls as $path) {
            $response = $this->httpGet($path, $token);
            self::assertSame(200, $response['status'], $path . ' ' . $response['raw']);
            self::assertIsArray($response['body'], $path . ' did not return JSON.');
            $leaks = $this->forbiddenKeys($response['body']);
            self::assertSame([], $leaks, $path . ' exposes: ' . implode(', ', $leaks));
        }

        // The award rubric (criteria, max points, rule points) is OSAD-only.
        foreach (['/osad/awards', '/osad/awards/' . $this->anyAwardId()] as $path) {
            $response = $this->httpGet($path, $token);
            self::assertSame(403, $response['status'], $path . ' ' . $response['raw']);
            self::assertSame([], $this->forbiddenKeys($response['body']), $path . ' leaked keys on refusal.');
        }
    }

    /** @return list<string> dotted paths of keys matching the forbidden pattern */
    private function forbiddenKeys(mixed $value, string $path = ''): array
    {
        if (! is_array($value)) {
            return [];
        }
        $found = [];
        foreach ($value as $key => $child) {
            $here = $path === '' ? (string) $key : $path . '.' . $key;
            if (is_string($key) && preg_match(self::FORBIDDEN_KEY, $key)) {
                $found[] = $here;
            }
            array_push($found, ...$this->forbiddenKeys($child, $here));
        }

        return $found;
    }

    private function credentialedStudent(): string
    {
        $row = $this->db->table('profiles p')->select('p.id')
            ->join('local_auth_credentials c', "c.profile_id = p.id AND c.status = 'active' AND c.must_change_password = 0")
            ->where('p.account_type', 'student')->where('p.status', 'active')
            ->get(1)->getRowArray();
        if ($row === null) {
            self::markTestSkipped('No credentialed active student.');
        }

        return (string) $row['id'];
    }

    private function anyAwardId(): string
    {
        return (string) ($this->db->table('award_definitions')->select('id')->get(1)->getRowArray()['id'] ?? '00000000-0000-0000-0000-000000000000');
    }

    /** Test fixture: a verified record with one stored clean evidence file. */
    private function verifiedRecordWithEvidence(string $student): array
    {
        $category = $this->db->table('portfolio_subcategories')->select('category_id')->where('id', self::SSG_SUBCATEGORY)->get()->getRowArray();
        self::assertNotNull($category);
        $recordId = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $this->db->table('student_portfolio_records')->insert([
            'id' => $recordId, 'student_profile_id' => $student, 'category_id' => $category['category_id'],
            'subcategory_id' => self::SSG_SUBCATEGORY, 'title' => 'Step4 privacy proof ' . bin2hex(random_bytes(4)),
            'organizer_or_body' => 'Supreme Student Government', 'start_date' => '2025-08-01', 'occurrence_date' => '2025-08-01',
            'structured_metadata' => json_encode(['schema_version' => '1.0', 'academic_year' => '2025-2026', 'semester' => '1st_semester']),
            'status' => 'verified', 'submitted_at' => $now, 'verified_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $stored = (new LocalEvidenceStorageService())->storeFile($sample, 'student', $student, $recordId, 'jpg', false);
        $evidenceId = $this->uuid();
        $this->db->table('student_portfolio_evidence')->insert([
            'id' => $evidenceId, 'portfolio_record_id' => $recordId, 'storage_path' => $stored['storage_path'],
            'original_filename' => 'proof.jpg', 'mime_type' => 'image/jpeg', 'detected_mime_type' => 'image/jpeg',
            'byte_size' => $stored['byte_size'], 'sha256' => $stored['sha256'], 'evidence_type' => 'certificate',
            'uploaded_by' => $student, 'uploaded_at' => $now, 'security_status' => 'clean', 'malware_scanner' => 'clamav_1_5_4', 'status' => 'active',
        ]);

        return [$recordId, $evidenceId];
    }

    private function token(string $profileId): string
    {
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'step4-http-proof')['access_token'];
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

    private function httpGet(string $path, string $token): array
    {
        $context = stream_context_create(['http' => ['method' => 'GET', 'ignore_errors' => true, 'timeout' => 60,
            'header' => ['Authorization: Bearer ' . $token, 'Accept: application/json']]]);
        $raw = (string) file_get_contents(self::BASE . $path, false, $context);
        $status = (int) preg_replace('/^\S+\s(\d{3}).*$/', '$1', $http_response_header[0] ?? 'HTTP/1.1 000');

        return ['status' => $status, 'raw' => $raw, 'body' => json_decode($raw, true)];
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
        $this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $this->recordId)->delete();
        $this->db->table('student_portfolio_records')->where('id', $this->recordId)->delete();
    }
}
