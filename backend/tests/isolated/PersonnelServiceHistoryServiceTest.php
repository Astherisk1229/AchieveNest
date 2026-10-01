<?php
namespace Tests\Isolated;

use App\Services\PersonnelServiceHistoryService as S;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use InvalidArgumentException;
use RuntimeException;

/** HR employment service history: append-only versions, segment rules, conflicts, audit. SQLite :memory:. */
final class PersonnelServiceHistoryServiceTest extends CIUnitTestCase
{
    private $sqlite;
    private S $svc;
    private const TODAY = '2026-10-02';

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, status TEXT)',
            'CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY)',
            'CREATE TABLE personnel_service_histories (id TEXT PRIMARY KEY, personnel_profile_id TEXT NOT NULL, stream_code TEXT NOT NULL, current_version_id TEXT NULL, lifecycle_state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (personnel_profile_id, stream_code))',
            'CREATE TABLE personnel_service_history_versions (id TEXT PRIMARY KEY, service_history_id TEXT NOT NULL, version_number INTEGER NOT NULL, previous_version_id TEXT NULL, resolution_status TEXT NOT NULL, countable_days INTEGER NULL, resolved_by_profile_id TEXT NULL, resolved_at TEXT NULL, policy_rule_version_reference TEXT NULL, created_at TEXT NOT NULL, UNIQUE (service_history_id, version_number))',
            'CREATE TABLE personnel_service_segments (id TEXT PRIMARY KEY, service_history_version_id TEXT NOT NULL, period_precision TEXT NOT NULL, period_start_year INTEGER, period_start_month INTEGER, period_start_day INTEGER, period_end_year INTEGER, period_end_month INTEGER, period_end_day INTEGER, is_ongoing INTEGER NOT NULL DEFAULT 0, source_period_text TEXT, source_classification TEXT NOT NULL, countability_state TEXT NOT NULL, source_remarks TEXT, hr_reason TEXT, created_at TEXT NOT NULL)',
            'CREATE TABLE account_lifecycle_events (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, actor_profile_id TEXT NULL, event_type TEXT NOT NULL, previous_status TEXT NULL, new_status TEXT NOT NULL, reason TEXT NULL, metadata TEXT NULL, occurred_at TEXT NOT NULL)',
        ] as $sql) $this->sqlite->query($sql);
        $this->sqlite->table('profiles')->insert(['id' => 'P1', 'status' => 'active']);
        $this->sqlite->table('personnel_profiles')->insert(['profile_id' => 'P1']);
        $this->svc = new S($this->sqlite);
    }

    protected function tearDown(): void { $this->sqlite->close(); parent::tearDown(); }

    private function save(array $segments, int $expected = 0, string $reason = 'Initial HR record from 201 file'): array
    {
        return $this->svc->saveVersion('P1', 'HR1', ['expected_version_number' => $expected, 'change_reason' => $reason, 'segments' => $segments], self::TODAY);
    }

    private function seg(string $start, ?string $end, string $cls = 'full_time', array $extra = []): array
    {
        return array_merge(['start_date' => $start, 'end_date' => $end, 'is_ongoing' => $end === null, 'classification' => $cls], $extra);
    }

    private function assertRejected(string $code, callable $fn): void
    {
        try { $fn(); self::fail("Expected $code"); } catch (InvalidArgumentException $e) { self::assertSame($code, $e->getMessage()); }
    }

    public function testEmptyHistoryShape(): void
    {
        $h = $this->svc->getHistory('P1');
        self::assertNull($h['current_version']);
        self::assertSame([], $h['versions']);
        self::assertSame([], $this->svc->currentSegments('P1'));
    }

    public function testPartTimeThenFullTimeIsStoredWithDefaultCountability(): void
    {
        // Entered out of order on purpose: output is sorted by start date.
        $h = $this->save([$this->seg('2019-06-01', null), $this->seg('2015-06-01', '2019-05-31', 'part_time')]);
        $v = $h['current_version'];
        self::assertSame(1, $v['version_number']);
        self::assertSame('hr_confirmed', $v['resolution_status']);
        self::assertSame('HR1', $v['resolved_by_profile_id']);
        self::assertSame(S::POLICY_RULE_VERSION, $v['policy_rule_version_reference']);
        self::assertCount(2, $v['segments']);
        self::assertSame(['2015-06-01', '2019-05-31', 'part_time', 'excluded'], [$v['segments'][0]['start_date'], $v['segments'][0]['end_date'], $v['segments'][0]['classification'], $v['segments'][0]['countability']]);
        self::assertSame(['2019-06-01', null, true, 'full_time', 'countable'], [$v['segments'][1]['start_date'], $v['segments'][1]['end_date'], $v['segments'][1]['is_ongoing'], $v['segments'][1]['classification'], $v['segments'][1]['countability']]);
        self::assertSame('RANGE', $v['segments'][1]['period_precision']);
    }

    public function testNewVersionIsAppendOnlyAndChainsToPrevious(): void
    {
        $v1 = $this->save([$this->seg('2010-06-01', null)])['current_version'];
        $h2 = $this->save([$this->seg('2010-06-01', '2014-05-31'), $this->seg('2018-06-01', null)], 1, 'Corrected: 2014-2018 break in service');
        $v2 = $h2['current_version'];

        self::assertSame(2, $v2['version_number']);
        self::assertSame($v1['id'], $v2['previous_version_id']);
        self::assertCount(2, $h2['versions']);
        // Version 1's segments are untouched.
        self::assertSame(1, $this->sqlite->table('personnel_service_segments')->where('service_history_version_id', $v1['id'])->countAllResults());
        self::assertSame(1, $this->sqlite->table('personnel_service_histories')->countAllResults());
    }

    public function testStaleExpectedVersionIsAConflict(): void
    {
        $this->save([$this->seg('2010-06-01', null)]);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('SERVICE_HISTORY_VERSION_CONFLICT');
        $this->save([$this->seg('2011-06-01', null)], 0);
    }

    public function testAuditEventMatchesLifecycleSchema(): void
    {
        $this->save([$this->seg('2010-06-01', null)]);
        $event = $this->sqlite->table('account_lifecycle_events')->get()->getRowArray();
        self::assertSame('service_history_updated', $event['event_type']);
        self::assertSame('HR1', $event['actor_profile_id']);
        self::assertSame('active', $event['new_status']);
        self::assertSame('Initial HR record from 201 file', json_decode($event['reason'], true)['justification']);
    }

    public function testValidationRules(): void
    {
        $this->assertRejected('CHANGE_REASON_REQUIRED', fn () => $this->save([$this->seg('2010-06-01', null)], 0, '  '));
        $this->assertRejected('SEGMENTS_REQUIRED', fn () => $this->save([]));
        $this->assertRejected('SEGMENT_1_PART_TIME_NOT_COUNTABLE', fn () => $this->save([$this->seg('2010-06-01', null, 'part_time', ['countability' => 'countable'])]));
        $this->assertRejected('SEGMENT_1_EXCLUSION_REASON_REQUIRED', fn () => $this->save([$this->seg('2010-06-01', null, 'full_time', ['countability' => 'excluded'])]));
        $this->assertRejected('SEGMENT_1_INVALID_CLASSIFICATION', fn () => $this->save([$this->seg('2010-06-01', null, 'contractual')]));
        $this->assertRejected('SEGMENT_1_INVALID_START_DATE', fn () => $this->save([$this->seg('2010-02-30', null)]));
        $this->assertRejected('SEGMENT_1_START_IN_FUTURE', fn () => $this->save([$this->seg('2027-01-01', null)]));
        $this->assertRejected('SEGMENT_1_END_IN_FUTURE', fn () => $this->save([$this->seg('2020-01-01', '2027-01-01')]));
        $this->assertRejected('SEGMENT_1_END_BEFORE_START', fn () => $this->save([$this->seg('2020-01-01', '2019-01-01')]));
        $this->assertRejected('SEGMENT_1_END_DATE_REQUIRED', fn () => $this->save([['start_date' => '2020-01-01', 'classification' => 'full_time']]));
        $this->assertRejected('SEGMENTS_OVERLAP', fn () => $this->save([$this->seg('2010-06-01', '2015-06-01'), $this->seg('2015-06-01', null)]));
        $this->assertRejected('ONLY_ONE_ONGOING_SEGMENT_ALLOWED', fn () => $this->save([$this->seg('2010-06-01', null), $this->seg('2015-06-01', null)]));
        $this->assertRejected('ONGOING_SEGMENT_MUST_BE_LATEST', fn () => $this->save([$this->seg('2005-06-01', null), $this->seg('2010-06-01', '2012-05-31')]));
        $this->assertRejected('EXPECTED_VERSION_NUMBER_REQUIRED', fn () => $this->svc->saveVersion('P1', 'HR1', ['change_reason' => 'x', 'segments' => [$this->seg('2010-06-01', null)]], self::TODAY));
        $this->assertRejected('PERSONNEL_NOT_FOUND', fn () => $this->svc->getHistory('NOPE'));
        // Nothing was written by any rejected save.
        self::assertSame(0, $this->sqlite->table('personnel_service_history_versions')->countAllResults());
    }

    public function testFullTimeExcludedWithReasonIsAccepted(): void
    {
        $v = $this->save([
            $this->seg('2010-06-01', '2012-05-31'),
            $this->seg('2012-06-01', '2013-05-31', 'full_time', ['countability' => 'excluded', 'hr_reason' => 'Leave without pay']),
            $this->seg('2013-06-01', null),
        ])['current_version'];
        self::assertSame('excluded', $v['segments'][1]['countability']);
        self::assertSame('Leave without pay', $v['segments'][1]['hr_reason']);
    }
    public function testOnboardingDefaultsToOneOngoingPeriodOfTheCurrentEngagement(): void
    {
        $full = $this->svc->buildOnboardingSegments('2024-06-01', 'full_time_faculty', null, self::TODAY);
        self::assertCount(1, $full);
        self::assertSame(['2024-06-01', true, 'full_time', 'countable'], [$full[0]['start_date'], $full[0]['is_ongoing'], $full[0]['classification'], $full[0]['countability']]);

        $part = $this->svc->buildOnboardingSegments('2024-06-01', 'part_time_faculty', [], self::TODAY);
        self::assertSame(['part_time', 'excluded'], [$part[0]['classification'], $part[0]['countability']]);

        // Non-teaching personnel have no faculty engagement: counted as full-time.
        self::assertSame('full_time', $this->svc->buildOnboardingSegments('2024-06-01', null, null, self::TODAY)[0]['classification']);
    }

    public function testOnboardingWithEarlierPeriods(): void
    {
        $segments = $this->svc->buildOnboardingSegments('2015-06-01', 'full_time_faculty', [
            $this->seg('2015-06-01', '2019-05-31', 'part_time'),
            $this->seg('2019-06-01', null),
        ], self::TODAY);
        self::assertSame(['part_time', 'full_time'], array_column($segments, 'classification'));

        $this->assertRejected('ONBOARDING_FIRST_PERIOD_START_MISMATCH', fn () => $this->svc->buildOnboardingSegments('2014-01-01', 'full_time_faculty', [$this->seg('2015-06-01', '2019-05-31', 'part_time'), $this->seg('2019-06-01', null)], self::TODAY));
        $this->assertRejected('ONBOARDING_CURRENT_PERIOD_MUST_BE_ONGOING', fn () => $this->svc->buildOnboardingSegments('2015-06-01', 'full_time_faculty', [$this->seg('2015-06-01', '2019-05-31')], self::TODAY));
        $this->assertRejected('ONBOARDING_CURRENT_PERIOD_TYPE_MISMATCH', fn () => $this->svc->buildOnboardingSegments('2015-06-01', 'part_time_faculty', [$this->seg('2015-06-01', '2019-05-31', 'part_time'), $this->seg('2019-06-01', null)], self::TODAY));
        $this->assertRejected('SEGMENTS_OVERLAP', fn () => $this->svc->buildOnboardingSegments('2015-06-01', 'full_time_faculty', [$this->seg('2015-06-01', '2019-06-01', 'part_time'), $this->seg('2019-06-01', null)], self::TODAY));
    }

    public function testOnboardingSegmentsSaveAsVersionOne(): void
    {
        $segments = $this->svc->buildOnboardingSegments('2024-06-01', 'full_time_faculty', null, self::TODAY);
        $h = $this->svc->saveVersion('P1', 'HR1', ['expected_version_number' => 0, 'change_reason' => 'Recorded at account onboarding', 'segments' => $segments], self::TODAY);
        self::assertSame(1, $h['current_version']['version_number']);
        self::assertSame('Recorded at account onboarding', $h['current_version']['segments'][0]['source_remarks']);
    }

    public function testErrorMessagesAndIndexes(): void
    {
        self::assertSame('Employment period 2 ends before it starts.', S::messageFor('SEGMENT_2_END_BEFORE_START'));
        self::assertSame(1, S::segmentIndexFor('SEGMENT_2_END_BEFORE_START'));
        self::assertNull(S::segmentIndexFor('SEGMENTS_OVERLAP'));
        self::assertStringContainsString('Faculty Engagement', S::messageFor('ONBOARDING_CURRENT_PERIOD_TYPE_MISMATCH'));
    }
}
