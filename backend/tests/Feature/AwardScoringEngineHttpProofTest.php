<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\LocalTokenService;
use CodeIgniter\Test\CIUnitTestCase;

/**
 * Step 5 proof: one rubric engine (AwardScoringService) scores verified records, and
 * /evaluate persists exactly what /score computes. Requires the local backend at
 * http://127.0.0.1:8080 and the local_defense database. Every fixture (students, enrollments,
 * records, evaluations) is created here and removed in tearDown().
 *
 * NOTE: the sports fixtures use the rubric vocabulary (INDIVIDUAL/TEAM, PRISAA REGIONAL, GOLD).
 * The current student form validator cannot produce these values; a record using the form
 * vocabulary is asserted to score 0 so the conflict stays visible.
 *
 * @group http-proof
 */
#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class AwardScoringEngineHttpProofTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private const BASE = 'http://127.0.0.1:8080/api/v1';
    private const LEADERSHIP_AWARD = '50000001-0000-0000-0000-000000000022';
    private const LEAD_CAMPUS_CRITERION = '50000002-0022-0000-0000-000000000002';
    private const SPORTS_MALE_AWARD = '50000001-0000-0000-0000-000000000025';
    private const SPORTS_M_ACADEMIC = '50000002-0025-0000-0000-000000000001';
    private const SPORTS_M_SKILLS = '50000002-0025-0000-0000-000000000002';
    private const SPORTS_M_PARTICIPATION = '50000002-0025-0000-0000-000000000003';
    private const SPORTS_M_AWARDS = '50000002-0025-0000-0000-000000000004';
    private const SSG_SUBCATEGORY = '40000001-0001-0000-0000-000000000001';

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

    public function testVerifiedLeadershipRecordScoresOnLeadershipCriterion(): void
    {
        $token = $this->osadToken();
        $student = $this->fixtureStudent();
        $record = $this->record($student, 'LEADERSHIP_POSITION', self::SSG_SUBCATEGORY, ['position_level' => 'officer'], 'verified');

        $score = $this->score(self::LEADERSHIP_AWARD, $student, $token);
        $criterion = $this->criterion($score, self::LEAD_CAMPUS_CRITERION);
        self::assertGreaterThan(0.0, (float) $criterion['earned_points'], json_encode($criterion));
        self::assertContains($record, array_column($criterion['contributions'], 'evidence_id'));
        self::assertEqualsWithDelta(10.0, (float) $score['raw_portfolio_score'], 0.001);
    }

    public function testSportsRecordMatchesThreeCriteriaAndNonVerifiedRecordsAreExcluded(): void
    {
        $token = $this->osadToken();
        $student = $this->fixtureStudent();
        $sports = $this->sportsSubcategory();
        $rubric = ['competition_type' => 'INDIVIDUAL', 'event_level' => 'PRISAA REGIONAL', 'placement' => 'GOLD'];
        $record = $this->record($student, 'SPORTS', $sports, $rubric, 'verified');
        $formVocabulary = $this->record($student, 'SPORTS', $sports, ['competition_type' => 'tournament', 'event_level' => 'regional', 'placement' => 'champion'], 'verified');
        $excluded = [];
        foreach (['submitted', 'revision_requested', 'rejected'] as $status) {
            $excluded[] = $this->record($student, 'SPORTS', $sports, ['competition_type' => 'TEAM', 'event_level' => 'PRISAA NATIONAL', 'placement' => 'GOLD'], $status);
        }

        $score = $this->score(self::SPORTS_MALE_AWARD, $student, $token);
        $expected = [self::SPORTS_M_SKILLS => 10.0, self::SPORTS_M_PARTICIPATION => 5.0, self::SPORTS_M_AWARDS => 5.0];
        foreach ($expected as $criterionId => $points) {
            $criterion = $this->criterion($score, $criterionId);
            self::assertEqualsWithDelta($points, (float) $criterion['earned_points'], 0.001, $criterionId);
            self::assertSame([$record], array_values(array_unique(array_column($criterion['contributions'], 'evidence_id'))), $criterionId);
        }
        $contributions = array_values(array_filter($score['contributing_evidence'], static fn(array $c): bool => $c['evidence_id'] === $record));
        self::assertCount(3, $contributions);
        self::assertEqualsWithDelta(20.0, (float) $score['raw_portfolio_score'], 0.001);

        // Form-vocabulary sports metadata cannot score (open vocabulary conflict).
        self::assertNotContains($formVocabulary, array_column($score['contributing_evidence'], 'evidence_id'));
        // Non-verified records never reach the engine.
        $traced = array_merge(array_column($score['contributing_evidence'], 'evidence_id'), array_column($score['evidence_traceability'], 'record_id'));
        foreach ($excluded as $id) {
            self::assertNotContains($id, $traced);
        }
    }

    public function testRecordMatchingTwoCriteriaLeavesTheThirdAtZero(): void
    {
        $token = $this->osadToken();
        $student = $this->fixtureStudent();
        $record = $this->record($student, 'SPORTS', $this->sportsSubcategory(), ['competition_type' => 'TEAM', 'event_level' => 'NDEA'], 'verified');

        $score = $this->score(self::SPORTS_MALE_AWARD, $student, $token);
        self::assertEqualsWithDelta(10.0, (float) $this->criterion($score, self::SPORTS_M_SKILLS)['earned_points'], 0.001);
        self::assertEqualsWithDelta(4.0, (float) $this->criterion($score, self::SPORTS_M_PARTICIPATION)['earned_points'], 0.001);
        $awards = $this->criterion($score, self::SPORTS_M_AWARDS);
        self::assertEqualsWithDelta(0.0, (float) $awards['earned_points'], 0.001);
        self::assertSame([], $awards['contributions']);
        self::assertContains($record, array_column($this->criterion($score, self::SPORTS_M_SKILLS)['contributions'], 'evidence_id'));
    }

    public function testEvaluateIsIdempotentMatchesScoreAndKeepsManualScores(): void
    {
        $token = $this->osadToken();
        $student = $this->fixtureStudent();
        $record = $this->record($student, 'SPORTS', $this->sportsSubcategory(), ['competition_type' => 'INDIVIDUAL', 'event_level' => 'PRISAA REGIONAL', 'placement' => 'GOLD'], 'verified');

        self::assertNotNull($this->db->query(
            "SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'student_award_evaluations' AND index_name = 'uq_student_award_evaluation_scope' LIMIT 1"
        )->getRowArray(), 'Unique key uq_student_award_evaluation_scope is missing (run the Step 5 migration).');

        $first = $this->evaluate(self::SPORTS_MALE_AWARD, $student, $token);
        $evaluation = $this->evaluationRows($student);
        self::assertCount(1, $evaluation);
        $evaluationId = $evaluation[0]['id'];
        self::assertSame($first['evaluation_id'], $evaluationId);
        self::assertSame($this->osadId, $evaluation[0]['evaluator_profile_id']);
        self::assertSame('1.0', $evaluation[0]['scoring_version']);
        self::assertNotEmpty($evaluation[0]['scoring_model_version_id']);

        // A manual panel score on a non-computable criterion must survive recalculation.
        $manualId = $this->uuid();
        $this->db->table('student_award_criterion_scores')->insert([
            'id' => $manualId, 'evaluation_id' => $evaluationId, 'criterion_id' => self::SPORTS_M_ACADEMIC,
            'awarded_points' => 12, 'max_points' => 15, 'scoring_snapshot' => json_encode(['rule_type' => 'MANUAL_PANEL_REVIEW']),
        ]);

        $second = $this->evaluate(self::SPORTS_MALE_AWARD, $student, $token);
        self::assertCount(1, $this->evaluationRows($student));
        self::assertSame($evaluationId, $second['evaluation_id']);
        foreach (['raw_score', 'max_computable_score', 'potential_percent', 'qualifies_portfolio_based'] as $key) {
            self::assertEquals($first[$key], $second[$key], $key);
        }
        self::assertSame(
            array_column($first['criteria'], 'earned_points', 'criterion_id'),
            array_column($second['criteria'], 'earned_points', 'criterion_id')
        );
        self::assertNotNull($this->db->table('student_award_criterion_scores')->where('id', $manualId)->get()->getRowArray(), 'Manual score was deleted.');

        $computed = $this->db->table('student_award_criterion_scores')->where('evaluation_id', $evaluationId)
            ->whereIn('criterion_id', [self::SPORTS_M_SKILLS, self::SPORTS_M_PARTICIPATION, self::SPORTS_M_AWARDS])->get()->getResultArray();
        self::assertCount(3, $computed);
        $evidence = $this->db->table('student_award_score_evidence')->whereIn('criterion_score_id', array_column($computed, 'id'))->get()->getResultArray();
        self::assertCount(3, $evidence);
        self::assertSame([$record], array_values(array_unique(array_column($evidence, 'portfolio_record_id'))));
        self::assertEqualsWithDelta(20.0, array_sum(array_map('floatval', array_column($evidence, 'points_effect'))), 0.001);

        $score = $this->score(self::SPORTS_MALE_AWARD, $student, $token);
        self::assertEqualsWithDelta((float) $score['raw_portfolio_score'], (float) $second['raw_score'], 0.001);
        self::assertEqualsWithDelta((float) $score['computable_max_score'], (float) $second['max_computable_score'], 0.001);
        self::assertEqualsWithDelta((float) $score['portfolio_potential_score'], (float) $second['potential_percent'], 0.001);
    }

    // ------------------------------------------------------------------ helpers

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

    private function evaluate(string $awardId, string $student, string $token): array
    {
        $response = $this->http('POST', "/osad/awards/{$awardId}/evaluate", $token, ['student_profile_id' => $student, 'cycle_id' => $this->cycleId]);
        self::assertSame(200, $response['status'], $response['raw']);

        return $response['body']['data'];
    }

    private function evaluationRows(string $student): array
    {
        return $this->db->table('student_award_evaluations')->where('cycle_id', $this->cycleId)
            ->where('award_definition_id', self::SPORTS_MALE_AWARD)->where('student_profile_id', $student)->get()->getResultArray();
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
        $token = (new LocalTokenService($this->db))->issueToken($this->osadId, false, '127.0.0.1', 'step5-http-proof')['access_token'];
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
            'email' => "step5-proof-{$suffix}@example.test", 'full_name' => 'Step5 Proof Student',
            'institutional_id' => "STEP5-{$suffix}", 'created_at' => date('Y-m-d H:i:s'),
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

    private function record(string $student, string $categoryCode, string $subcategoryId, array $metadata, string $status): string
    {
        $category = $this->db->table('portfolio_categories')->select('id')->where('code', $categoryCode)->get()->getRowArray();
        self::assertNotNull($category, $categoryCode);
        $id = $this->uuid();
        $now = date('Y-m-d H:i:s');
        $this->db->table('student_portfolio_records')->insert([
            'id' => $id, 'student_profile_id' => $student, 'category_id' => $category['id'], 'subcategory_id' => $subcategoryId,
            'title' => 'Step5 proof ' . $categoryCode . ' ' . bin2hex(random_bytes(3)), 'organizer_or_body' => 'Step5 Proof',
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
