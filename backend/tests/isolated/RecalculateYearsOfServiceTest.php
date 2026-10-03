<?php
namespace Tests\Isolated;

use App\Commands\RecalculateYearsOfService as C;
use App\Services\PersonnelServiceHistoryService as H;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/** Recalculating stored Years of Service on non-finalized evaluations. SQLite :memory:. */
final class RecalculateYearsOfServiceTest extends CIUnitTestCase
{
    private $sqlite;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, status TEXT)',
            'CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY, faculty_engagement TEXT, employment_start_date TEXT)',
            'CREATE TABLE personnel_evaluation_periods (id TEXT PRIMARY KEY, evaluation_end_at TEXT)',
            'CREATE TABLE personnel_evaluations (id TEXT PRIMARY KEY, personnel_profile_id TEXT, tenure_years INTEGER, evaluation_period_id TEXT, status TEXT, finalized_at TEXT)',
            'CREATE TABLE personnel_service_histories (id TEXT PRIMARY KEY, personnel_profile_id TEXT NOT NULL, stream_code TEXT NOT NULL, current_version_id TEXT NULL, lifecycle_state TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE (personnel_profile_id, stream_code))',
            'CREATE TABLE personnel_service_history_versions (id TEXT PRIMARY KEY, service_history_id TEXT NOT NULL, version_number INTEGER NOT NULL, previous_version_id TEXT NULL, resolution_status TEXT NOT NULL, countable_days INTEGER NULL, resolved_by_profile_id TEXT NULL, resolved_at TEXT NULL, policy_rule_version_reference TEXT NULL, created_at TEXT NOT NULL, UNIQUE (service_history_id, version_number))',
            'CREATE TABLE personnel_service_segments (id TEXT PRIMARY KEY, service_history_version_id TEXT NOT NULL, period_precision TEXT NOT NULL, period_start_year INTEGER, period_start_month INTEGER, period_start_day INTEGER, period_end_year INTEGER, period_end_month INTEGER, period_end_day INTEGER, is_ongoing INTEGER NOT NULL DEFAULT 0, source_period_text TEXT, source_classification TEXT NOT NULL, countability_state TEXT NOT NULL, source_remarks TEXT, hr_reason TEXT, created_at TEXT NOT NULL)',
            'CREATE TABLE account_lifecycle_events (id TEXT PRIMARY KEY, profile_id TEXT NOT NULL, actor_profile_id TEXT NULL, event_type TEXT NOT NULL, previous_status TEXT NULL, new_status TEXT NOT NULL, reason TEXT NULL, metadata TEXT NULL, occurred_at TEXT NOT NULL)',
        ] as $sql) $this->sqlite->query($sql);
        $this->sqlite->table('personnel_evaluation_periods')->insert(['id' => 'T', 'evaluation_end_at' => '2026-10-17 23:59:59']);
        foreach ([['A', '2015-06-01'], ['B', '2020-06-01'], ['C', '2010-06-01']] as [$id, $start]) {
            $this->sqlite->table('profiles')->insert(['id' => $id, 'full_name' => "Person $id", 'status' => 'active']);
            $this->sqlite->table('personnel_profiles')->insert(['profile_id' => $id, 'faculty_engagement' => 'full_time_faculty', 'employment_start_date' => $start]);
        }
        // A: part-time until 2019 → 7 full-time years; stored 6 (old browser default).
        (new H($this->sqlite))->saveVersion('A', 'HR1', ['expected_version_number' => 0, 'change_reason' => 'fixture', 'segments' => [
            ['start_date' => '2015-06-01', 'end_date' => '2019-05-31', 'classification' => 'part_time'],
            ['start_date' => '2019-06-01', 'is_ongoing' => true, 'classification' => 'full_time'],
        ]], '2026-10-02');
        $this->sqlite->table('personnel_evaluations')->insertBatch([
            ['id' => 'E-A', 'personnel_profile_id' => 'A', 'tenure_years' => 6, 'evaluation_period_id' => 'T', 'status' => 'submitted', 'finalized_at' => null],
            ['id' => 'E-B', 'personnel_profile_id' => 'B', 'tenure_years' => 6, 'evaluation_period_id' => 'T', 'status' => 'submitted', 'finalized_at' => null], // already correct
            ['id' => 'E-C', 'personnel_profile_id' => 'C', 'tenure_years' => 6, 'evaluation_period_id' => 'T', 'status' => 'finalized', 'finalized_at' => '2026-09-01 00:00:00'],
            ['id' => 'E-X', 'personnel_profile_id' => 'B', 'tenure_years' => 0, 'evaluation_period_id' => null, 'status' => 'draft', 'finalized_at' => null],
        ]);
    }

    protected function tearDown(): void { $this->sqlite->close(); parent::tearDown(); }

    public function testPlanSkipsFinalizedAndReportsChanges(): void
    {
        $plan = C::plan($this->sqlite);
        $byId = array_column($plan['rows'], null, 'evaluation_id');
        self::assertArrayNotHasKey('E-C', $byId, 'finalized evaluations are never considered');
        self::assertSame([6, 7, true, 'service_history'], [$byId['E-A']['old_tenure_years'], $byId['E-A']['new_tenure_years'], $byId['E-A']['changed'], $byId['E-A']['basis']]);
        self::assertFalse($byId['E-B']['changed']);
        self::assertSame('E-X', $plan['skipped'][0]['evaluation_id']);
        // Planning writes nothing.
        self::assertSame(6, (int) $this->sqlite->table('personnel_evaluations')->where('id', 'E-A')->get()->getRow()->tenure_years);
    }

    public function testApplyUpdatesOnlyChangedNonFinalizedRows(): void
    {
        $changes = array_values(array_filter(C::plan($this->sqlite)['rows'], fn ($r) => $r['changed']));
        self::assertSame(1, C::apply($this->sqlite, $changes));
        $years = array_column($this->sqlite->table('personnel_evaluations')->select('id, tenure_years')->get()->getResultArray(), 'tenure_years', 'id');
        self::assertSame(['E-A' => 7, 'E-B' => 6, 'E-C' => 6, 'E-X' => 0], array_map('intval', $years));
        // Running again changes nothing.
        self::assertSame([], array_values(array_filter(C::plan($this->sqlite)['rows'], fn ($r) => $r['changed'])));
    }
}
