<?php
namespace Tests\Isolated;

use App\Services\EmploymentServiceDurationService as D;
use App\Services\PersonnelServiceHistoryService as H;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/**
 * Qualifying length of service excluding part-time periods, HR-excluded periods and gaps
 * (policy LOS-2026-10-v1). Pure computation plus DB-backed fallback rules. SQLite :memory:.
 */
final class QualifyingLengthOfServiceTest extends CIUnitTestCase
{
    private const REF = '2026-06-01';

    private function seg(string $start, ?string $end, string $cls = 'full_time', ?string $countability = null): array
    {
        return ['start_date' => $start, 'end_date' => $end, 'is_ongoing' => $end === null, 'classification' => $cls,
            'countability' => $countability ?? ($cls === 'part_time' ? 'excluded' : 'countable'), 'hr_reason' => $countability === 'excluded' ? 'Leave without pay' : null];
    }

    public function testPartTimeThenFullTimeCountsOnlyFullTime(): void
    {
        // Part-time 2015-06-01..2019-05-31, full-time since 2019-06-01. Reference 2026-06-01 → 7 years full-time.
        $r = (new D())->computeFromSegments([$this->seg('2015-06-01', '2019-05-31', 'part_time'), $this->seg('2019-06-01', null)], self::REF);
        self::assertSame(7, $r['years']);
        self::assertSame(0, $r['months']);
        self::assertSame(84, $r['total_months']);
        self::assertSame(7.0, $r['service_years_decimal']);
        self::assertSame('7 years', $r['display']);
        self::assertCount(1, $r['included_segments']);
        self::assertCount(1, $r['excluded_segments']);
        self::assertSame(48, $r['part_time']['total_months']);
        self::assertSame([], $r['gaps']);
    }

    public function testBreakInServiceIsNotCounted(): void
    {
        // Full-time 2010-06-01..2014-05-31 (4y), gap until 2018-05-31, full-time since 2018-06-01 (8y to ref) → 12 years.
        $r = (new D())->computeFromSegments([$this->seg('2010-06-01', '2014-05-31'), $this->seg('2018-06-01', null)], self::REF);
        self::assertSame(12, $r['years']);
        self::assertSame(144, $r['total_months']);
        self::assertCount(1, $r['gaps']);
        self::assertSame(['2014-06-01', '2018-05-31'], [$r['gaps'][0]['start_date'], $r['gaps'][0]['end_date']]);
    }

    public function testHrExcludedFullTimePeriodIsNotCounted(): void
    {
        $r = (new D())->computeFromSegments([
            $this->seg('2016-06-01', '2020-05-31'),
            $this->seg('2020-06-01', '2021-05-31', 'full_time', 'excluded'),
            $this->seg('2021-06-01', null),
        ], self::REF);
        self::assertSame(9 * 12, $r['total_months']); // 4 + 5 years; the excluded year is skipped
        self::assertSame('Leave without pay', $r['excluded_segments'][0]['hr_reason']);
        self::assertSame(0, $r['part_time']['total_months']);
    }

    public function testLeftoverDaysCarryAtThirtyDaysPerMonth(): void
    {
        // 2024-01-01..2024-01-20 = 20 days; 2024-03-01..2024-03-15 = 15 days → 35 days = 1 month 5 days.
        $r = (new D())->computeFromSegments([$this->seg('2024-01-01', '2024-01-20'), $this->seg('2024-03-01', '2024-03-15')], self::REF);
        self::assertSame(1, $r['total_months']);
        self::assertSame(5, $r['days']);
        self::assertSame(35, $r['qualifying_days']);
    }

    public function testReferenceDateCutsOffAndIgnoresLaterPeriods(): void
    {
        $r = (new D())->computeFromSegments([$this->seg('2020-06-01', '2030-01-01'), $this->seg('2027-01-01', null)], '2023-06-01');
        self::assertSame(36, $r['total_months']);
        self::assertCount(1, $r['included_segments']);
        self::assertSame('2023-05-31', $r['included_segments'][0]['end_date']);
    }

    public function testOngoingMatchesLegacyStartDateArithmetic(): void
    {
        $d = new D();
        $legacy = $d->calculate('2020-06-15', '2026-06-01');
        $new = $d->computeFromSegments([$this->seg('2020-06-15', null)], '2026-06-01');
        self::assertSame($legacy['total_months'], $new['total_months']);
        self::assertSame($legacy['days'], $new['days']);
    }

    private function db(array $person)
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, status TEXT)',
            'CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY, faculty_engagement TEXT, employment_start_date TEXT)',
            'CREATE TABLE personnel_service_histories (id TEXT PRIMARY KEY, personnel_profile_id TEXT NOT NULL, stream_code TEXT NOT NULL, current_version_id TEXT NULL, lifecycle_state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (personnel_profile_id, stream_code))',
            'CREATE TABLE personnel_service_history_versions (id TEXT PRIMARY KEY, service_history_id TEXT NOT NULL, version_number INTEGER NOT NULL, previous_version_id TEXT NULL, resolution_status TEXT NOT NULL, countable_days INTEGER NULL, resolved_by_profile_id TEXT NULL, resolved_at TEXT NULL, policy_rule_version_reference TEXT NULL, created_at TEXT NOT NULL, UNIQUE (service_history_id, version_number))',
            'CREATE TABLE personnel_service_segments (id TEXT PRIMARY KEY, service_history_version_id TEXT NOT NULL, period_precision TEXT NOT NULL, period_start_year INTEGER, period_start_month INTEGER, period_start_day INTEGER, period_end_year INTEGER, period_end_month INTEGER, period_end_day INTEGER, is_ongoing INTEGER NOT NULL DEFAULT 0, source_period_text TEXT, source_classification TEXT NOT NULL, countability_state TEXT NOT NULL, source_remarks TEXT, hr_reason TEXT, created_at TEXT NOT NULL)',
            'CREATE TABLE account_lifecycle_events (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, actor_profile_id TEXT NULL, event_type TEXT NOT NULL, previous_status TEXT NULL, new_status TEXT NOT NULL, reason TEXT NULL, metadata TEXT NULL, occurred_at TEXT NOT NULL)',
        ] as $sql) $db->query($sql);
        $db->table('profiles')->insert(['id' => 'P1', 'status' => 'active']);
        $db->table('personnel_profiles')->insert(['profile_id' => 'P1'] + $person);
        return $db;
    }

    public function testRecordedHistoryIsAuthoritativeOverStartDate(): void
    {
        $db = $this->db(['faculty_engagement' => 'full_time_faculty', 'employment_start_date' => '2015-06-01']);
        (new H($db))->saveVersion('P1', 'HR1', ['expected_version_number' => 0, 'change_reason' => '201 file', 'segments' => [$this->seg('2015-06-01', '2019-05-31', 'part_time'), $this->seg('2019-06-01', null)]], '2026-10-02');
        $r = (new D($db))->calculateQualifyingService('P1', self::REF);
        self::assertSame('service_history', $r['basis']);
        self::assertTrue($r['verified']);
        self::assertSame(7, $r['years']);
        self::assertSame(1, $r['service_history_version_number']);
        $db->close();
    }

    public function testFallbackUsesStartDateAndIsFlaggedUnverified(): void
    {
        $db = $this->db(['faculty_engagement' => 'full_time_faculty', 'employment_start_date' => '2020-06-01']);
        $r = (new D($db))->calculateQualifyingService('P1', '2023-06-01');
        self::assertSame('legacy_start_date', $r['basis']);
        self::assertFalse($r['verified']);
        self::assertSame(3.0, $r['service_years_decimal']);
        $db->close();
    }

    public function testNonTeachingWithNoEngagementFallsBackAsFullTime(): void
    {
        $db = $this->db(['faculty_engagement' => null, 'employment_start_date' => '2020-06-01']);
        self::assertSame(36, (new D($db))->calculateQualifyingService('P1', '2023-06-01')['total_months']);
        $db->close();
    }

    public function testCurrentlyPartTimeWithoutHistoryIsZero(): void
    {
        $db = $this->db(['faculty_engagement' => 'part_time_faculty', 'employment_start_date' => '2015-06-01']);
        $r = (new D($db))->calculateQualifyingService('P1', self::REF);
        self::assertSame('part_time_no_history', $r['basis']);
        self::assertSame(0, $r['total_months']);
        $db->close();
    }

    public function testNoStartDateAndNoHistoryIsUnavailable(): void
    {
        $db = $this->db(['faculty_engagement' => 'full_time_faculty', 'employment_start_date' => null]);
        $r = (new D($db))->calculateQualifyingService('P1', self::REF);
        self::assertSame('unavailable', $r['basis']);
        self::assertNull($r['total_months']);
        $db->close();
    }
}
