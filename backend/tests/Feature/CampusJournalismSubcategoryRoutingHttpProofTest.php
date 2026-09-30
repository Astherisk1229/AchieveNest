<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 5b proof: for the Campus Journalism Award the record's subcategory decides the criterion and
 * component through the seeded award_evidence_mapping_rules; no publication_type detail is needed.
 * Requires the local backend at http://127.0.0.1:8080 and the local_defense database. Fixture
 * students and records are created here and removed in tearDown().
 *
 * @group http-proof
 */
final class CampusJournalismSubcategoryRoutingHttpProofTest extends CIUnitTestCase
{
    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const JOURNALISM_AWARD = '50000001-0000-0000-0000-000000000023';
    private const PUBLICATION_CRITERION = '50000002-0023-0000-0000-000000000002';
    private const LEADERSHIP_CRITERION = '50000002-0023-0000-0000-000000000003';
    private const NEWS_ITEM = '40000009-0001-0000-0000-000000000001';
    private const COLUMN = '40000009-0001-0000-0000-000000000003';
    private const MEMBER_CONTRIBUTOR = '40000009-0001-0000-0000-000000000005';
    private const OFFICER = '40000009-0001-0000-0000-000000000006';
    private const JOURNALISM_SEMINAR = '40000005-0001-0000-0000-000000000003';

    protected $db;
    private array $tokens = [];
    private array $students = [];
    private ?string $osadId = null;
    private ?string $cycleId = null;

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

    public function testThreeNewsItemsByAloneSubcategoryScoreSixPoints(): void
    {
        $token = $this->osadToken();
        $student = $this->fixtureStudent();
        $news = [];
        for ($i = 0; $i < 3; $i++) {
            $news[] = $this->record($student, self::NEWS_ITEM); // no publication_type detail at all
        }

        $score = $this->score(self::JOURNALISM_AWARD, $student, $token);
        $publication = $this->criterion($score, self::PUBLICATION_CRITERION);
        self::assertEqualsWithDelta(6.0, (float) $publication['earned_points'], 0.001, json_encode($publication));
        self::assertSame($news, $this->sorted(array_column($publication['contributions'], 'evidence_id'), $news));
        self::assertEqualsWithDelta(6.0, (float) $score['raw_portfolio_score'], 0.001);
        self::assertEqualsWithDelta(70.0, (float) $score['computable_max_score'], 0.001);
    }

    public function testSubcategoryRoutingCapsLeadershipAndIgnoresUnrelatedDetails(): void
    {
        $token = $this->osadToken();
        $student = $this->fixtureStudent();
        for ($i = 0; $i < 5; $i++) {
            $this->record($student, self::NEWS_ITEM);
        }
        // Subcategory wins over a conflicting detail; placement/event level do not change publication points.
        $conflicting = $this->record($student, self::NEWS_ITEM, ['publication_type' => 'column', 'placement' => 'champion', 'event_level' => 'national']);
        $column = $this->record($student, self::COLUMN);
        $officer = $this->record($student, self::OFFICER);
        $member = $this->record($student, self::MEMBER_CONTRIBUTOR);
        $seminar = $this->record($student, self::JOURNALISM_SEMINAR);
        $pending = $this->record($student, self::NEWS_ITEM, [], 'submitted');

        $score = $this->score(self::JOURNALISM_AWARD, $student, $token);
        $publication = $this->criterion($score, self::PUBLICATION_CRITERION);
        $leadership = $this->criterion($score, self::LEADERSHIP_CRITERION);

        // 6 news x 2 = 12 -> capped at 10; 1 column x 4 = 4.
        self::assertEqualsWithDelta(14.0, (float) $publication['earned_points'], 0.001, json_encode($publication['components']));
        $byComponent = [];
        foreach ($publication['components'] as $component) {
            $byComponent[$component['component_code']] = (float) $component['earned_points'];
        }
        self::assertEqualsWithDelta(10.0, $byComponent['COMP_JOURN_NEWS'], 0.001);
        self::assertEqualsWithDelta(4.0, $byComponent['COMP_JOURN_COLUMN'], 0.001);
        self::assertContains($conflicting, array_column($this->componentContributions($publication, 'COMP_JOURN_NEWS'), 'evidence_id'));
        self::assertContains($column, array_column($publication['contributions'], 'evidence_id'));

        // Officer 3 + Member/Contributor 2 = 5 (Leadership Involvement cap 5).
        self::assertEqualsWithDelta(5.0, (float) $leadership['earned_points'], 0.001, json_encode($leadership['components']));
        $leadIds = array_column($leadership['contributions'], 'evidence_id');
        self::assertContains($officer, $leadIds);
        self::assertContains($member, $leadIds);

        // Journalism seminars earn 0 and non-verified records are never considered.
        $all = array_merge(array_column($score['contributing_evidence'], 'evidence_id'), array_column($score['evidence_traceability'], 'record_id'));
        self::assertNotContains($seminar, $all);
        self::assertNotContains($pending, $all);
        self::assertEqualsWithDelta(19.0, (float) $score['raw_portfolio_score'], 0.001);
    }

    private function componentContributions(array $criterion, string $componentCode): array
    {
        return array_values(array_filter($criterion['contributions'], static fn(array $c): bool => ($c['component_code'] ?? null) === $componentCode));
    }

    private function sorted(array $values, array $expectedOrder): array
    {
        sort($values);
        $copy = $expectedOrder;
        sort($copy);
        return $values === $copy ? $expectedOrder : $values;
    }

    private function criterion(array $score, string $criterionId): array
    {
        foreach ($score['criteria_scores'] ?? [] as $criterion) {
            if (($criterion['criterion_id'] ?? null) === $criterionId) {
                return $criterion;
            }
        }
        self::fail("Criterion {$criterionId} missing from score: " . json_encode($score));
    }

    private function score(string $awardId, string $student, string $token): array
    {
        $response = $this->http('POST', "/osad/awards/{$awardId}/students/{$student}/score", $token);
        self::assertSame(200, $response['status'], $response['raw']);
        self::assertTrue((bool) ($response['body']['data']['is_eligible'] ?? false), 'Fixture student not eligible: ' . $response['raw']);

        return $response['body']['data'];
    }

    private function osadToken(): string
    {
        $cycle = $this->db->table('award_cycles')->whereIn('status', ['active', 'evaluating'])->orderBy('start_date', 'DESC')->get()->getRowArray();
        if ($cycle === null) {
            self::markTestSkipped('No active award cycle.');
        }
        $this->cycleId = (string) $cycle['id'];
        $row = $this->db->table('profiles p')->select('p.id')
            ->join('profile_roles pr', 'pr.profile_id = p.id AND pr.is_active = 1')
            ->join('roles r', "r.id = pr.role_id AND r.role_key = 'osad_staff'")
            ->where('p.account_type', 'osad_admin')->where('p.status', 'active')
            ->get(1)->getRowArray();
        if ($row === null) {
            self::markTestSkipped('No active OSAD administrator with osad_staff role.');
        }
        $this->osadId = (string) $row['id'];
        $token = (new LocalTokenService($this->db))->issueToken($this->osadId, false, '127.0.0.1', 'step5b-http-proof')['access_token'];
        $this->tokens[] = $token;

        return $token;
    }

    /** Fixture: active, male, graduating student with an active enrollment. */
    private function fixtureStudent(): string
    {
        $id = $this->uuid();
        $suffix = substr(str_replace('-', '', $id), 0, 12);
        $this->db->table('profiles')->insert([
            'id' => $id, 'account_type' => 'student', 'status' => 'active', 'sex' => 'Male',
            'email' => "step5b-proof-{$suffix}@example.test", 'full_name' => 'Step5b Proof Student',
            'institutional_id' => "STEP5B-{$suffix}", 'created_at' => date('Y-m-d H:i:s'),
        ]);
        $this->students[] = $id;
        $program = $this->db->table('academic_programs')->select('id')->get(1)->getRowArray();
        self::assertNotNull($program, 'No academic program to enroll the fixture student.');
        $this->db->table('student_program_enrollments')->insert([
            'id' => $this->uuid(), 'student_profile_id' => $id, 'academic_program_id' => $program['id'],
            'year_level' => '4th Year', 'academic_year' => '2025-2026', 'effective_from' => '2025-08-01', 'is_active' => 1,
        ]);

        return $id;
    }

    private function sportsSubcategory(): string
    {
        $row = $this->db->table('portfolio_subcategories s')->select('s.id')
            ->join('portfolio_categories c', "c.id = s.category_id AND c.code = 'SPORTS'")->get(1)->getRowArray();
        self::assertNotNull($row, 'No SPORTS subcategory.');

        return (string) $row['id'];
    }

    private function record(string $student, string $subcategoryId, array $metadata = [], string $status = 'verified'): string
    {
        $category = $this->db->table('portfolio_subcategories')->select('category_id AS id')->where('id', $subcategoryId)->get()->getRowArray();
        self::assertNotNull($category, $subcategoryId);
        $categoryCode = $subcategoryId;
        $id = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $this->db->table('student_portfolio_records')->insert([
            'id' => $id, 'student_profile_id' => $student, 'category_id' => $category['id'], 'subcategory_id' => $subcategoryId,
            'title' => 'Step5b proof ' . $categoryCode . ' ' . bin2hex(random_bytes(3)), 'organizer_or_body' => 'Step5b Proof',
            'start_date' => '2025-09-01', 'occurrence_date' => '2025-09-01',
            'structured_metadata' => json_encode(['schema_version' => '1.0'] + $metadata),
            'status' => $status, 'submitted_at' => $now, 'verified_at' => $status === 'verified' ? $now : null,
            'created_at' => $now, 'updated_at' => $now,
        ]);

        return $id;
    }

    private function http(string $method, string $path, string $token, ?array $json = null): array
    {
        $headers = ['Authorization: Bearer ' . $token, 'Accept: application/json', 'Content-Type: application/json'];
        $context = stream_context_create(['http' => ['method' => $method, 'ignore_errors' => true, 'timeout' => 120,
            'header' => $headers, 'content' => $json === null ? '' : json_encode($json)]]);
        $raw = (string) file_get_contents(self::BASE . $path, false, $context);
        $status = (int) preg_replace('/^\S+\s(\d{3}).*$/', '$1', $http_response_header[0] ?? 'HTTP/1.1 000');

        return ['status' => $status, 'raw' => $raw, 'body' => json_decode($raw, true)];
    }

    private function uuid(): string
    {
        $d = random_bytes(16);
        $d[6] = chr((ord($d[6]) & 0x0f) | 0x40);
        $d[8] = chr((ord($d[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($d), 4));
    }

    /** Removes only the fixtures this test created. */
    private function cleanup(): void
    {
        foreach ($this->tokens as $token) {
            $this->db->table('local_auth_sessions')->where('token_hash', hash('sha256', $token))->delete();
        }
        foreach ($this->students as $student) {
            $this->db->table('award_interview_eligibilities')->where('student_profile_id', $student)->delete();
            $evaluationIds = array_column($this->db->table('student_award_evaluations')->select('id')->where('student_profile_id', $student)->get()->getResultArray(), 'id');
            if ($evaluationIds !== []) {
                $scoreIds = array_column($this->db->table('student_award_criterion_scores')->select('id')->whereIn('evaluation_id', $evaluationIds)->get()->getResultArray(), 'id');
                if ($scoreIds !== []) {
                    $this->db->table('student_award_score_evidence')->whereIn('criterion_score_id', $scoreIds)->delete();
                    $this->db->table('student_award_criterion_scores')->whereIn('id', $scoreIds)->delete();
                }
                $this->db->table('student_award_evaluations')->whereIn('id', $evaluationIds)->delete();
            }
            $this->db->table('student_portfolio_records')->where('student_profile_id', $student)->delete();
            $this->db->table('student_program_enrollments')->where('student_profile_id', $student)->delete();
            $this->db->table('profiles')->where('id', $student)->delete();
        }
    }
}
