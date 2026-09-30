<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\ApprovedAchievementScoringService;
use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Proof: potential candidates and the evaluation summary come straight from the points of approved
 * achievements (no manual OSAD evaluation), are OSAD-only, and agree with the contribution rows.
 * Requires the local backend at http://127.0.0.1:8080 and the local_defense database.
 * Side effects are limited to this test's own fixtures (removed in tearDown()).
 *
 * @group http-proof
 */
final class AwardCandidateDiscoveryHttpProofTest extends CIUnitTestCase
{
    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const SSG_SUBCATEGORY = '40000001-0001-0000-0000-000000000001';

    protected $db;
    private array $tokens = [];
    private array $recordIds = [];
    private ?string $student = null;
    private string $startedAt;

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

    public function testCandidatesAndSummaryComeFromApprovedAchievementPoints(): void
    {
        $cycle = $this->db->table('award_cycles')->whereIn('status', ['active', 'evaluating'])->orderBy('start_date', 'DESC')->get()->getRowArray();
        if ($cycle === null) {
            self::markTestSkipped('No active award cycle.');
        }
        [$this->student, $coordinator] = $this->routableStudentAndCoordinator();
        $coordinatorToken = $this->token($coordinator);
        $studentToken = $this->token($this->student);
        $osadToken = $this->token($this->osadAdmin());

        // 1. Every visible award's candidate list loads (the old list crashed with a 500).
        $awards = $this->json('GET', '/osad/awards', null, $osadToken);
        self::assertSame(200, $awards['status'], $awards['raw']);
        foreach ($awards['body']['data']['awards'] as $award) {
            if (($award['configuration_status'] ?? '') !== 'VALID') {
                continue;
            }
            $list = $this->json('GET', "/osad/awards/{$award['id']}/potential-candidates", null, $osadToken);
            self::assertSame(200, $list['status'], $award['name'] . ' ' . $list['raw']);
            foreach ($list['body']['data']['potential_candidates'] as $candidate) {
                self::assertSame('POTENTIAL_CANDIDATE', $candidate['candidate_status']);
                self::assertGreaterThanOrEqual((float) $award['candidate_threshold_percent'], (float) $candidate['portfolio_potential_score']);
            }
        }

        $evaluationRowsBefore = $this->db->table('student_award_evaluations')->countAllResults();

        // 2. Approve a qualifying record; its points appear in the summary of the award they count for.
        $recordId = $this->fixture(self::SSG_SUBCATEGORY);
        $approve = $this->json('POST', "/portfolio/{$recordId}/verify", ['remarks' => ''], $coordinatorToken);
        self::assertSame(200, $approve['status'], $approve['raw']);
        self::assertSame('SCORED', $approve['body']['data']['scoring_status'] ?? null, $approve['raw']);
        $row = $this->db->table(ApprovedAchievementScoringService::TABLE)->where('portfolio_record_id', $recordId)->where('status', 'active')->get(1)->getRowArray();
        self::assertNotNull($row, 'The approved officer record must earn points for at least one award.');
        $awardId = (string) $row['award_definition_id'];

        $summary = $this->json('GET', "/osad/awards/{$awardId}/students/{$this->student}/evaluation-summary", null, $osadToken);
        self::assertSame(200, $summary['status'], $summary['raw']);
        $data = $summary['body']['data'];
        self::assertContains($recordId, array_column($data['items'], 'record_id'));
        foreach ($data['items'] as $item) {
            self::assertGreaterThan(0, (float) $item['points']);
            self::assertNotEmpty($item['criterion_name']);
        }
        $item = $data['items'][array_search($recordId, array_column($data['items'], 'record_id'), true)];
        self::assertNotEmpty($item['evidence'], 'The summary must link the approved record\'s document.');
        self::assertStringNotContainsString('storage_path', json_encode($item['evidence']));

        // Totals equal the active contribution rows of this student, award and cycle.
        $expected = (float) $this->db->query(
            "SELECT COALESCE(SUM(c.allocated_points), 0) AS total FROM student_achievement_criterion_contributions c
             JOIN student_portfolio_records spr ON spr.id = c.portfolio_record_id AND spr.status = 'verified'
             WHERE spr.student_profile_id = ? AND c.award_definition_id = ? AND c.award_cycle_id = ? AND c.status = 'active'",
            [$this->student, $awardId, $cycle['id']]
        )->getRowArray()['total'];
        self::assertEqualsWithDelta($expected, (float) $data['raw_portfolio_score'], 0.001);
        self::assertEqualsWithDelta(array_sum(array_column($data['items'], 'points')), (float) $data['raw_portfolio_score'], 0.001);
        self::assertEqualsWithDelta(array_sum(array_column($data['criteria'], 'earned_points')), (float) $data['raw_portfolio_score'], 0.001);
        $award = $this->json('GET', "/osad/awards/{$awardId}", null, $osadToken)['body']['data'];
        self::assertEqualsWithDelta((float) $award['computable_max_score'], (float) $data['computable_max_score'], 0.001);
        $percent = round((float) $data['raw_portfolio_score'] / (float) $data['computable_max_score'] * 100, 2);
        self::assertEqualsWithDelta($percent, (float) $data['portfolio_potential_score'], 0.001);
        $qualifies = $percent >= (float) $award['candidate_threshold_percent'] && $data['student_eligible'];
        self::assertSame($qualifies ? 'POTENTIAL_CANDIDATE' : ($data['student_eligible'] ? 'BELOW_THRESHOLD' : 'NEEDS_ATTENTION'), $data['candidate_status']);

        // The candidate list agrees with the summary.
        $list = $this->json('GET', "/osad/awards/{$awardId}/potential-candidates", null, $osadToken)['body']['data'];
        self::assertSame($qualifies, in_array($this->student, array_column($list['potential_candidates'], 'student_id'), true));
        self::assertSame(count($list['potential_candidates']), $list['total_potential_candidates']);

        // 3. View-only: nothing was written by reading.
        self::assertSame($evaluationRowsBefore, $this->db->table('student_award_evaluations')->countAllResults());

        // 4. OSAD-only.
        foreach ([$coordinatorToken, $studentToken] as $token) {
            self::assertSame(403, $this->json('GET', "/osad/awards/{$awardId}/potential-candidates", null, $token)['status']);
            self::assertSame(403, $this->json('GET', "/osad/awards/{$awardId}/students/{$this->student}/evaluation-summary", null, $token)['status']);
        }
        self::assertSame(404, $this->json('GET', "/osad/awards/{$awardId}/students/00000000-0000-0000-0000-000000000000/evaluation-summary", null, $osadToken)['status']);
    }

    // ------------------------------------------------------------------ helpers

    /** @return array{0: string, 1: string} credentialed active student with exactly one program and its one coordinator */
    private function routableStudentAndCoordinator(): array
    {
        $rows = $this->db->query(
            "SELECT spe.student_profile_id, MIN(pca.personnel_profile_id) AS coordinator_id
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

        return [(string) $rows[0]['student_profile_id'], (string) $rows[0]['coordinator_id']];
    }

    private function osadAdmin(): string
    {
        $row = $this->db->table('profiles p')->select('p.id')
            ->join('profile_roles pr', 'pr.profile_id = p.id AND pr.is_active = 1')
            ->join('roles r', "r.id = pr.role_id AND r.role_key = 'osad_staff'")
            ->where('p.account_type', 'osad_admin')->where('p.status', 'active')->get(1)->getRowArray();
        if ($row === null) {
            self::markTestSkipped('No active OSAD administrator with osad_staff role.');
        }

        return (string) $row['id'];
    }

    /** Submitted leadership record (officer) with one clean evidence file. */
    private function fixture(string $subcategoryId): string
    {
        $category = $this->db->table('portfolio_subcategories')->select('category_id')->where('id', $subcategoryId)->get()->getRowArray();
        self::assertNotNull($category);
        $recordId = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $this->db->table('student_portfolio_records')->insert([
            'id' => $recordId, 'student_profile_id' => $this->student, 'category_id' => $category['category_id'],
            'subcategory_id' => $subcategoryId, 'title' => 'Candidate proof ' . bin2hex(random_bytes(4)),
            'organizer_or_body' => 'Student Government', 'start_date' => '2025-08-01', 'occurrence_date' => '2025-08-01',
            'structured_metadata' => json_encode(['schema_version' => '1.0', 'academic_year' => '2025-2026', 'semester' => '1st_semester', 'position_level' => 'officer']),
            'status' => 'submitted', 'submitted_at' => $now, 'created_at' => $now, 'updated_at' => $now,
        ]);
        $this->recordIds[] = $recordId;
        $sample = dirname(__DIR__, 2) . '/writable/ocr-audit/dataset/P01_clean_academic_certificate.jpg';
        self::assertFileExists($sample);
        $stored = (new LocalEvidenceStorageService())->storeFile($sample, 'student', $this->student, $recordId, 'jpg', false);
        $this->db->table('student_portfolio_evidence')->insert([
            'id' => $this->uuid(), 'portfolio_record_id' => $recordId, 'storage_path' => $stored['storage_path'],
            'original_filename' => 'proof.jpg', 'mime_type' => 'image/jpeg', 'detected_mime_type' => 'image/jpeg',
            'byte_size' => $stored['byte_size'], 'sha256' => $stored['sha256'], 'evidence_type' => 'certificate',
            'uploaded_by' => $this->student, 'uploaded_at' => $now, 'security_status' => 'clean', 'malware_scanner' => 'clamav_1_5_4', 'status' => 'active',
        ]);

        return $recordId;
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
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'candidate-http-proof')['access_token'];
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
        $headers = ['Authorization: Bearer ' . $token, 'Accept: application/json', 'Content-Type: application/json', 'Content-Length: ' . strlen($data)];
        $context = stream_context_create(['http' => ['method' => $method, 'ignore_errors' => true, 'timeout' => 120, 'header' => $headers, 'content' => $data]]);
        $raw = (string) file_get_contents(self::BASE . $path, false, $context);
        $status = (int) preg_replace('/^\S+\s(\d{3}).*$/', '$1', $http_response_header[0] ?? 'HTTP/1.1 000');

        return ['status' => $status, 'raw' => $raw, 'body' => json_decode($raw, true) ?? []];
    }

    /** Test-fixture cleanup only; production code never deletes contributions or verification history. */
    private function cleanup(): void
    {
        foreach ($this->tokens as $token) {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }
        if ($this->student !== null) {
            $studentRecords = array_column($this->db->table('student_portfolio_records')->select('id')->where('student_profile_id', $this->student)->get()->getResultArray(), 'id');
            if ($studentRecords !== []) {
                $this->db->table(ApprovedAchievementScoringService::TABLE)->whereIn('portfolio_record_id', $studentRecords)->where('created_at >=', $this->startedAt)->delete();
                $this->db->table('student_portfolio_verification_events')->whereIn('portfolio_record_id', $studentRecords)
                    ->whereIn('action', ApprovedAchievementScoringService::SCORING_ACTIONS)->where('occurred_at >=', $this->startedAt)->delete();
            }
        }
        $storage = new LocalEvidenceStorageService();
        foreach ($this->recordIds as $recordId) {
            foreach ($this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $recordId)->get()->getResultArray() as $row) {
                $storage->deletePhysicalFile((string) $row['storage_path']);
            }
            $this->db->table(ApprovedAchievementScoringService::TABLE)->where('portfolio_record_id', $recordId)->delete();
            $this->db->table('notifications')->where('reference_id', $recordId)->delete();
            $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $recordId)->delete();
            $this->db->table('student_portfolio_evidence')->where('portfolio_record_id', $recordId)->delete();
            $this->db->table('student_portfolio_records')->where('id', $recordId)->delete();
        }
    }
}
