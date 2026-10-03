<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Commands\BackfillVerifiedScoring;
use App\Services\ApprovedAchievementScoringService;
use App\Services\AwardEligibilityService;
use App\Services\AwardEvidenceMappingService;
use App\Services\AwardScoringService;
use App\Services\LocalEvidenceStorageService;
use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 6 proof: approval triggers automatic criterion matching; failures defer without undoing
 * the approval; rescore and backfill are idempotent; contributions stay OSAD-only.
 * Requires the local backend at http://127.0.0.1:8080 and the local_defense database.
 *
 * Side effects are limited to this test: fixture records, their events and every contribution or
 * scoring event created during the run for the fixture student are removed in tearDown(), and the
 * active award cycle status is restored if the failure simulation changed it.
 *
 * @group http-proof
 */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class ApprovedAchievementScoringHttpProofTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const SSG_SUBCATEGORY = '40000001-0001-0000-0000-000000000001';
    private const COLLEGE_COUNCIL_SUBCATEGORY = '40000001-0001-0000-0000-000000000002';
    private const FORBIDDEN_KEY = '/(points|score|total_points|awarded_points|raw_score|potential_score|max_points|weight|contribution)/i';

    protected $db;
    private array $tokens = [];
    private array $recordIds = [];
    private ?string $student = null;
    private ?array $closedCycle = null;
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
        $this->restoreCycle();
        $this->cleanup();
        parent::tearDown();
    }

    public function testApprovalScoresAndEveryFailureAndRetryPathIsIdempotent(): void
    {
        $cycle = $this->db->table('award_cycles')->whereIn('status', ['active', 'evaluating'])->orderBy('start_date', 'DESC')->get()->getRowArray();
        if ($cycle === null) {
            self::markTestSkipped('No active award cycle.');
        }
        [$this->student, $coordinator] = $this->routableStudentAndCoordinator();
        $coordinatorToken = $this->token($coordinator);
        $studentToken = $this->token($this->student);
        $osadToken = $this->token($this->osadAdmin());

        // 1. Approve a qualifying record: verified + contributions equal to the engine's post-cap allocation.
        $a = $this->fixture(self::SSG_SUBCATEGORY);
        $approve = $this->json('POST', "/portfolio/{$a}/verify", ['remarks' => ''], $coordinatorToken);
        self::assertSame(200, $approve['status'], $approve['raw']);
        self::assertSame('SCORED', $approve['body']['data']['scoring_status'] ?? null, $approve['raw']);
        self::assertSame('verified', $this->recordStatus($a));
        self::assertSame(1, $this->eventCount($a, 'scoring_requested'));
        self::assertSame(1, $this->eventCount($a, 'criteria_scored'));
        $rowsA = $this->activeRows($a);
        self::assertNotEmpty($rowsA, 'A verified SSG officer record must match at least one criterion.');
        self::assertSame($this->engineAllocation($a, (string) $cycle['id']), $this->rowAllocation($rowsA));
        $criteriaRemarks = (string) $this->db->table('student_portfolio_verification_events')->select('remarks')
            ->where('portfolio_record_id', $a)->where('action', 'criteria_scored')->get()->getRowArray()['remarks'];
        self::assertStringNotContainsStringIgnoringCase('point', $criteriaRemarks);

        // 2. Approve again: 409 and no new rows.
        $total = $this->contributionCount();
        $again = $this->json('POST', "/portfolio/{$a}/verify", ['remarks' => ''], $coordinatorToken);
        self::assertSame(409, $again['status'], $again['raw']);
        self::assertSame($total, $this->contributionCount());

        // 3. Return and reject never score.
        $b = $this->fixture(self::SSG_SUBCATEGORY);
        $c = $this->fixture(self::SSG_SUBCATEGORY);
        self::assertSame(200, $this->json('POST', "/portfolio/{$b}/request-revision", ['remarks' => 'Add the signed certificate.'], $coordinatorToken)['status']);
        self::assertSame(200, $this->json('POST', "/portfolio/{$c}/reject", ['remarks' => 'Not a qualifying activity.'], $coordinatorToken)['status']);
        self::assertSame(0, $this->recordContributionCount($b));
        self::assertSame(0, $this->recordContributionCount($c));
        self::assertSame(0, $this->eventCount($b, 'scoring_requested') + $this->eventCount($c, 'scoring_requested'));

        // 4. Scoring throws (no active cycle): approval stands, scoring_failed carries only the code.
        $d = $this->fixture(self::COLLEGE_COUNCIL_SUBCATEGORY);
        $this->closeCycle($cycle);
        $deferred = $this->json('POST', "/portfolio/{$d}/verify", ['remarks' => ''], $coordinatorToken);
        $this->restoreCycle();
        self::assertSame(200, $deferred['status'], $deferred['raw']);
        self::assertSame('DEFERRED', $deferred['body']['data']['scoring_status'] ?? null);
        self::assertSame('verified', $this->recordStatus($d));
        $failed = $this->db->table('student_portfolio_verification_events')->where('portfolio_record_id', $d)->where('action', 'scoring_failed')->get()->getResultArray();
        self::assertCount(1, $failed);
        self::assertSame('error_code=NO_ACTIVE_CYCLE', $failed[0]['remarks']);
        self::assertSame(0, $this->recordContributionCount($d));

        // Rescore is OSAD-only, creates the rows, and is idempotent.
        self::assertSame(403, $this->json('POST', "/osad/scoring/records/{$d}/rescore", null, $coordinatorToken)['status']);
        self::assertSame(403, $this->json('POST', "/osad/scoring/records/{$d}/rescore", null, $studentToken)['status']);
        $rescore = $this->json('POST', "/osad/scoring/records/{$d}/rescore", null, $osadToken);
        self::assertSame(200, $rescore['status'], $rescore['raw']);
        self::assertSame('SCORED', $rescore['body']['data']['scoring_status']);
        self::assertGreaterThan(0, $this->recordContributionCount($d), 'Rescore must create the deferred contributions.');
        self::assertSame($this->engineAllocation($d, (string) $cycle['id']), $this->rowAllocation($this->activeRows($d)));
        $snapshot = $this->contributionSnapshot();
        $second = $this->json('POST', "/osad/scoring/records/{$d}/rescore", null, $osadToken);
        self::assertSame(200, $second['status'], $second['raw']);
        self::assertSame(0, $second['body']['data']['inserted'] + $second['body']['data']['updated'] + $second['body']['data']['superseded'] + $second['body']['data']['reactivated']);
        self::assertSame($snapshot, $this->contributionSnapshot());
        // A still matches the engine after D shared its caps.
        self::assertSame($this->engineAllocation($a, (string) $cycle['id']), $this->rowAllocation($this->activeRows($a)));

        // 5. Backfill run twice: same row count.
        $service = new ApprovedAchievementScoringService($this->db);
        BackfillVerifiedScoring::backfill($service, $this->student);
        $afterFirst = $this->contributionSnapshot();
        $secondRun = BackfillVerifiedScoring::backfill($service, $this->student);
        self::assertSame(0, $secondRun['inserted'] + $secondRun['updated'] + $secondRun['reactivated'] + $secondRun['superseded']);
        self::assertSame($afterFirst, $this->contributionSnapshot());

        // 6. Contributions are OSAD-only; the student never sees points or scoring activity.
        self::assertSame(200, $this->json('GET', "/osad/scoring/records/{$a}/contributions", null, $osadToken)['status']);
        self::assertSame(403, $this->json('GET', "/osad/scoring/records/{$a}/contributions", null, $coordinatorToken)['status']);
        self::assertSame(403, $this->json('GET', "/osad/scoring/records/{$a}/contributions", null, $studentToken)['status']);
        foreach (["/portfolio/{$a}", '/portfolio', '/portfolio?status=verified'] as $path) {
            $response = $this->json('GET', $path, null, $studentToken);
            self::assertSame(200, $response['status'], $path . ' ' . $response['raw']);
            self::assertSame([], $this->forbiddenKeys($response['body']), $path);
        }
        $studentEvents = array_column($this->json('GET', "/portfolio/{$a}", null, $studentToken)['body']['data']['events'] ?? [], 'action');
        self::assertContains('verified', $studentEvents);
        self::assertSame([], array_values(array_intersect($studentEvents, ApprovedAchievementScoringService::SCORING_ACTIONS)));
        $coordinatorEvents = array_column($this->json('GET', "/portfolio/{$a}", null, $coordinatorToken)['body']['data']['events'] ?? [], 'action');
        self::assertContains('criteria_scored', $coordinatorEvents);
    }

    // ------------------------------------------------------------------ helpers

    /** Engine post-cap allocation for one record across all active awards: key => points. */
    private function engineAllocation(string $recordId, string $cycleId): array
    {
        $eligibility = new AwardEligibilityService($this->db);
        $scoring = new AwardScoringService($this->db, $eligibility, new AwardEvidenceMappingService($this->db, $eligibility));
        $student = $this->db->table('profiles')->where('id', $this->student)->get()->getRowArray();
        $expected = [];
        foreach ($this->db->table('award_definitions')->where('status', 'active')->get()->getResultArray() as $award) {
            if (! ($eligibility->evaluateStudentEligibility($award, $student)['eligible'] ?? false)) {
                continue;
            }
            $result = $scoring->scoreStudentForAward($award, $student);
            foreach ($result['contributing_evidence'] ?? [] as $row) {
                if (($row['evidence_id'] ?? null) !== $recordId || (float) $row['allocated_points'] <= 0.0) {
                    continue;
                }
                $component = $row['component_id'] ?? null;
                $key = $award['id'] . '|' . $row['criterion_id'] . '|' . ($component ?? 'code:' . $row['component_code']);
                $expected[$key] = round(($expected[$key] ?? 0.0) + (float) $row['allocated_points'], 2);
            }
        }
        ksort($expected);

        return $expected;
    }

    private function rowAllocation(array $rows): array
    {
        $actual = [];
        foreach ($rows as $row) {
            $actual[$row['award_definition_id'] . '|' . $row['criterion_id'] . '|' . $row['criterion_component_key']] = round((float) $row['allocated_points'], 2);
        }
        ksort($actual);

        return $actual;
    }

    private function activeRows(string $recordId): array
    {
        return $this->db->table(ApprovedAchievementScoringService::TABLE)->where('portfolio_record_id', $recordId)->where('status', 'active')->get()->getResultArray();
    }

    private function recordContributionCount(string $recordId): int
    {
        return $this->db->table(ApprovedAchievementScoringService::TABLE)->where('portfolio_record_id', $recordId)->countAllResults();
    }

    private function contributionCount(): int
    {
        return $this->db->table(ApprovedAchievementScoringService::TABLE)->countAllResults();
    }

    /** Student's contribution rows (id, status, points) for exact before/after comparison. */
    private function contributionSnapshot(): array
    {
        return $this->db->table(ApprovedAchievementScoringService::TABLE . ' c')->select('c.id, c.status, c.allocated_points, c.scoring_version')
            ->join('student_portfolio_records spr', 'spr.id = c.portfolio_record_id')
            ->where('spr.student_profile_id', $this->student)->orderBy('c.id', 'ASC')->get()->getResultArray();
    }

    private function closeCycle(array $cycle): void
    {
        $this->closedCycle = ['id' => $cycle['id'], 'status' => $cycle['status']];
        $this->db->table('award_cycles')->where('id', $cycle['id'])->update(['status' => 'evaluation_closed']);
    }

    private function restoreCycle(): void
    {
        if ($this->closedCycle !== null) {
            $this->db->table('award_cycles')->where('id', $this->closedCycle['id'])->update(['status' => $this->closedCycle['status']]);
            $this->closedCycle = null;
        }
    }

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
            'subcategory_id' => $subcategoryId, 'title' => 'Step6 proof ' . bin2hex(random_bytes(4)),
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
        $token = (new LocalTokenService($this->db))->issueToken($profileId, false, '127.0.0.1', 'step6-http-proof')['access_token'];
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
