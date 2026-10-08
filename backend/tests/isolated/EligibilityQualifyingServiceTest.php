<?php
namespace Tests\Isolated;

use App\Services\EmploymentServiceDurationService as D;
use App\Services\PersonnelEligibilityService;
use App\Services\PersonnelServiceHistoryService as H;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/**
 * Step 5: portfolio eligibility and Years of Service use the qualifying length of service
 * (full-time only, HR service history). The eligibility rule itself is unchanged. SQLite :memory:.
 */
final class EligibilityQualifyingServiceTest extends CIUnitTestCase
{
    private $sqlite;
    private const CUTOFF = '2026-10-17';

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, designation_title TEXT, status TEXT)',
            'CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY, personnel_group TEXT, personnel_classification TEXT, organizational_side TEXT, faculty_engagement TEXT, employment_status TEXT, employment_start_date TEXT, position_title TEXT, current_rank_title TEXT)',
            'CREATE TABLE personnel_college_affiliations (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE personnel_administrative_unit_affiliations (personnel_profile_id TEXT, administrative_unit_id TEXT, is_active INTEGER)',
            'CREATE TABLE administrative_units (id TEXT, college_id TEXT, status TEXT)',
            'CREATE TABLE dean_assignments (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE personnel_evaluation_periods (id TEXT PRIMARY KEY, academic_year TEXT, period_code TEXT, status TEXT, evaluation_end_at TEXT, personnel_group TEXT)',
            'CREATE TABLE personnel_annual_review_imports (id TEXT, personnel_profile_id TEXT, evaluation_period_id TEXT, two_review_status TEXT, two_review_reason TEXT, review_1_school_year TEXT, review_1_rating TEXT, review_2_school_year TEXT, review_2_rating TEXT, confirmed_at TEXT, superseded_at TEXT)',
            'CREATE TABLE personnel_accomplishments (id TEXT PRIMARY KEY, personnel_profile_id TEXT, category_code TEXT, status TEXT, date_achieved TEXT)',
            'CREATE TABLE personnel_accomplishment_evidence (id TEXT PRIMARY KEY, accomplishment_id TEXT, security_status TEXT)',
            'CREATE TABLE personnel_service_histories (id TEXT PRIMARY KEY, personnel_profile_id TEXT NOT NULL, stream_code TEXT NOT NULL, current_version_id TEXT NULL, lifecycle_state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (personnel_profile_id, stream_code))',
            'CREATE TABLE personnel_service_history_versions (id TEXT PRIMARY KEY, service_history_id TEXT NOT NULL, version_number INTEGER NOT NULL, previous_version_id TEXT NULL, resolution_status TEXT NOT NULL, countable_days INTEGER NULL, resolved_by_profile_id TEXT NULL, resolved_at TEXT NULL, policy_rule_version_reference TEXT NULL, created_at TEXT NOT NULL, UNIQUE (service_history_id, version_number))',
            'CREATE TABLE personnel_service_segments (id TEXT PRIMARY KEY, service_history_version_id TEXT NOT NULL, period_precision TEXT NOT NULL, period_start_year INTEGER, period_start_month INTEGER, period_start_day INTEGER, period_end_year INTEGER, period_end_month INTEGER, period_end_day INTEGER, is_ongoing INTEGER NOT NULL DEFAULT 0, source_period_text TEXT, source_classification TEXT NOT NULL, countability_state TEXT NOT NULL, source_remarks TEXT, hr_reason TEXT, created_at TEXT NOT NULL)',
            'CREATE TABLE account_lifecycle_events (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, actor_profile_id TEXT NULL, event_type TEXT NOT NULL, previous_status TEXT NULL, new_status TEXT NOT NULL, reason TEXT NULL, metadata TEXT NULL, occurred_at TEXT NOT NULL)',
        ] as $sql) $this->sqlite->query($sql);
        $this->sqlite->table('personnel_evaluation_periods')->insert(['id' => 'TRACK', 'academic_year' => '2027-2028', 'status' => 'OPEN_FOR_SUBMISSION', 'evaluation_end_at' => self::CUTOFF . ' 23:59:59', 'personnel_group' => 'FACULTY']);
    }

    protected function tearDown(): void { $this->sqlite->close(); parent::tearDown(); }

    private function person(string $id, array $values): void
    {
        $this->sqlite->table('profiles')->insert(['id' => $id, 'full_name' => "Fixture $id", 'status' => 'active']);
        $this->sqlite->table('personnel_profiles')->insert(['profile_id' => $id] + $values + ['personnel_group' => 'faculty', 'employment_status' => 'permanent', 'faculty_engagement' => 'full_time_faculty']);
        $this->sqlite->table('personnel_annual_review_imports')->insert(['id' => "IMP-$id", 'personnel_profile_id' => $id, 'evaluation_period_id' => 'TRACK', 'two_review_status' => 'passed', 'review_1_school_year' => '2025-2026', 'review_1_rating' => 'satisfactory', 'review_2_school_year' => '2026-2027', 'review_2_rating' => 'satisfactory', 'confirmed_at' => '2026-10-01 14:00:00']);
        $this->sqlite->table('personnel_accomplishments')->insert(['id' => "ACC-$id", 'personnel_profile_id' => $id, 'category_code' => 'B.2', 'status' => 'draft', 'date_achieved' => '2026-03-15']);
        $this->sqlite->table('personnel_accomplishment_evidence')->insert(['id' => "EV-$id", 'accomplishment_id' => "ACC-$id", 'security_status' => 'clean']);
    }

    private function history(string $id, array $segments): void
    {
        (new H($this->sqlite))->saveVersion($id, 'HR1', ['expected_version_number' => 0, 'change_reason' => 'fixture', 'segments' => $segments], '2026-10-02');
    }

    private function seg(string $start, ?string $end, string $cls = 'full_time'): array
    {
        return ['start_date' => $start, 'end_date' => $end, 'is_ongoing' => $end === null, 'classification' => $cls];
    }

    private function evaluate(string $id): array
    {
        return (new PersonnelEligibilityService($this->sqlite))->evaluateEligibility($id, 'TRACK');
    }

    public function testProbationaryPartTimeYearsNoLongerCountTowardThreeYears(): void
    {
        // Start date alone would give 5+ years; recorded history shows only ~1.4 years full-time.
        $this->person('P1', ['employment_status' => 'probationary', 'employment_start_date' => '2021-06-01']);
        $this->history('P1', [$this->seg('2021-06-01', '2025-05-31', 'part_time'), $this->seg('2025-06-01', null)]);
        $r = $this->evaluate('P1');
        self::assertSame('not_eligible', $r['eligibility_status']);
        self::assertSame(1.33, $r['service_years']);
        self::assertSame(1, $r['service_completed_years']);
        self::assertSame('service_history', $r['service_requirement']['basis']);
        self::assertTrue($r['service_requirement']['verified']);
        self::assertSame(self::CUTOFF, $r['service_requirement']['reference_date']);
    }

    public function testProbationaryWithThreeFullTimeYearsAfterPartTimePasses(): void
    {
        $this->person('P1', ['employment_status' => 'probationary', 'employment_start_date' => '2018-06-01']);
        $this->history('P1', [$this->seg('2018-06-01', '2020-05-31', 'part_time'), $this->seg('2020-06-01', null)]);
        $r = $this->evaluate('P1');
        self::assertSame('eligible', $r['eligibility_status']);
        self::assertSame(6, $r['service_completed_years']);
    }

    public function testCurrentPartTimeFacultyIsNotEligibleForRanking(): void
    {
        $this->person('P1', ['personnel_group' => 'FACULTY', 'employment_start_date' => '2015-06-01', 'faculty_engagement' => 'part_time_faculty']);
        $r = $this->evaluate('P1');
        self::assertSame('not_eligible', $r['eligibility_status']);
        self::assertStringContainsString('Part-time faculty', implode(' ', $r['eligibility_reasons']));
    }

    public function testFormerPartTimeNowFullTimeIsJudgedOnFullTimeYearsOnly(): void
    {
        $this->person('P1', ['personnel_group' => 'FACULTY', 'employment_status' => 'permanent', 'employment_start_date' => '2015-06-01']);
        $this->history('P1', [$this->seg('2015-06-01', '2024-05-31', 'part_time'), $this->seg('2024-06-01', null)]);
        self::assertSame('eligible', $this->evaluate('P1')['eligibility_status']);
    }

    public function testRecordedHistoryReplacesMissingStartDate(): void
    {
        $this->person('P1', ['employment_start_date' => null]);
        $this->history('P1', [$this->seg('2019-06-01', null)]);
        $r = $this->evaluate('P1');
        self::assertSame('eligible', $r['eligibility_status']);
        self::assertSame([], $r['missing_hr_requirements']);
    }

    public function testStartDateOnlyIsUnchangedButFlaggedUnverified(): void
    {
        $this->person('P1', ['employment_start_date' => '2019-06-03']);
        $r = $this->evaluate('P1');
        self::assertSame('eligible', $r['eligibility_status']);
        self::assertSame('legacy_start_date', $r['service_requirement']['basis']);
        self::assertFalse($r['service_requirement']['verified']);
        self::assertSame(7, $r['service_completed_years']);
    }

    public function testBatchCalculationMatchesSingleCalculation(): void
    {
        $this->person('P1', ['employment_start_date' => '2015-06-01']);
        $this->person('P2', ['employment_start_date' => '2020-01-15']);
        $this->person('P3', ['employment_start_date' => '2016-01-01', 'faculty_engagement' => 'part_time_faculty']);
        $this->person('P4', ['employment_start_date' => null]);
        $this->history('P1', [$this->seg('2015-06-01', '2019-05-31', 'part_time'), $this->seg('2019-06-01', null)]);
        $rows = $this->sqlite->table('personnel_profiles')->get()->getResultArray();

        $d = new D($this->sqlite);
        $many = $d->calculateQualifyingServiceForMany($rows, self::CUTOFF);
        foreach (['P1', 'P2', 'P3', 'P4'] as $id) {
            $single = $d->calculateQualifyingService($id, self::CUTOFF);
            self::assertSame($single['basis'], $many[$id]['basis'], $id);
            self::assertSame($single['total_months'], $many[$id]['total_months'], $id);
        }
        self::assertSame(['service_history', 'legacy_start_date', 'part_time_no_history', 'unavailable'], array_map(fn ($id) => $many[$id]['basis'], ['P1', 'P2', 'P3', 'P4']));
    }

    public function testBatchHandlesMissingServiceHistoryTables(): void
    {
        // A schema without the service-history tables falls back to the start date instead of failing.
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $db->query('CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY, faculty_engagement TEXT, employment_start_date TEXT)');
        $db->table('personnel_profiles')->insert(['profile_id' => 'X', 'faculty_engagement' => 'full_time_faculty', 'employment_start_date' => '2020-06-01']);
        $r = (new D($db))->calculateQualifyingService('X', '2023-06-01');
        self::assertSame('legacy_start_date', $r['basis']);
        self::assertSame(36, $r['total_months']);
        $db->close();
    }
}
