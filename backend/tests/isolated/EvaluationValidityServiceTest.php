<?php
namespace Tests\Isolated;

use App\Services\EvaluationValidityService as V;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/** Ranking-cycle eligibility gate: PERIOD, QUALIFICATION, COMPUTED. SQLite :memory: where a database is needed. */
final class EvaluationValidityServiceTest extends CIUnitTestCase
{
    private const COVERAGE = ['start' => '2025-06-01', 'end' => '2027-05-31'];
    private $sqlite;

    protected function tearDown(): void { $this->sqlite?->close(); parent::tearDown(); }

    private static function single(string $code, ?string $date, array $meta = []): array
    {
        return ['id' => uniqid('', true), 'title' => $code, 'category_code' => $code, 'occurrence_date' => $date, 'category_metadata' => json_encode($meta)];
    }

    private static function range(string $code, ?string $start, ?string $end, bool $ongoing = false): array
    {
        return self::single($code, $end ?? $start, ['date_mode' => $ongoing ? 'range_optional_end' : 'range', 'start_date' => $start, 'end_date' => $end, 'ongoing' => $ongoing]);
    }

    private static function statusOf(array $record, string $group = 'FACULTY'): string
    {
        return V::evaluate($record, self::COVERAGE, $group)['status'];
    }

    public function testPeriodSingleDateBoundaries(): void
    {
        self::assertSame(V::OUTSIDE_CYCLE, self::statusOf(self::single('A.3', '2025-05-31')));
        self::assertSame(V::ELIGIBLE, self::statusOf(self::single('A.3', '2025-06-01')));
        self::assertSame(V::ELIGIBLE, self::statusOf(self::single('B.2', '2026-03-15')));
        self::assertSame(V::ELIGIBLE, self::statusOf(self::single('B.2', '2027-05-31')));
        self::assertSame(V::OUTSIDE_CYCLE, self::statusOf(self::single('B.2', '2027-06-01')));
    }

    public function testArbitraryCycleRangeIsRespected(): void
    {
        $coverage = ['start' => '2024-01-15', 'end' => '2024-03-01'];
        self::assertSame(V::ELIGIBLE, V::evaluate(self::single('B.1', '2024-02-29'), $coverage, 'FACULTY')['status']);
        self::assertSame(V::OUTSIDE_CYCLE, V::evaluate(self::single('B.1', '2024-01-14'), $coverage, 'FACULTY')['status']);
    }

    public function testPeriodDateRangeOverlap(): void
    {
        self::assertSame(V::OUTSIDE_CYCLE, self::statusOf(self::range('C.1.1', '2024-01-01', '2025-05-31')), 'entirely before');
        self::assertSame(V::OUTSIDE_CYCLE, self::statusOf(self::range('C.1.1', '2027-06-01', '2027-12-31')), 'entirely after');
        self::assertSame(V::ELIGIBLE, self::statusOf(self::range('C.2.1', '2025-01-01', '2025-12-31')), 'starts before, ends during');
        self::assertSame(V::ELIGIBLE, self::statusOf(self::range('C.2.2', '2027-01-01', '2027-12-31')), 'starts during, ends after');
        self::assertSame(V::ELIGIBLE, self::statusOf(self::range('A.2', '2020-01-01', '2030-01-01')), 'spans the whole cycle');
        self::assertSame(V::ELIGIBLE, self::statusOf(self::range('A.2', '2019-06-01', null, true)), 'ongoing, started before');
        self::assertSame(V::OUTSIDE_CYCLE, self::statusOf(self::range('A.2', '2027-07-01', null, true)), 'ongoing, starts after');
    }

    public function testQualificationRemainsValidOnceObtained(): void
    {
        self::assertSame(V::ELIGIBLE, self::statusOf(self::single('A.1', '2020-04-15', ['subcategory_code' => 'A1_MA_HOLDER'])), 'MA five years before');
        self::assertSame(V::ELIGIBLE, self::statusOf(self::single('A.1', '2026-04-15', ['subcategory_code' => 'A1_PHD_HOLDER'])), 'Ph.D. during');
        self::assertSame(V::OUTSIDE_CYCLE, self::statusOf(self::single('A.1', '2027-06-02', ['subcategory_code' => 'A.1.3'])), 'after coverage end');
    }

    public function testMissingDatesAreNeverGuessed(): void
    {
        $result = V::evaluate(self::single('B.2', null), self::COVERAGE, 'FACULTY');
        self::assertSame(V::NEEDS_INFORMATION, $result['status']);
        self::assertFalse($result['eligible']);
        self::assertNull($result['date_used']);
        self::assertSame(V::NEEDS_INFORMATION, self::statusOf(self::single('A.1', null, ['subcategory_code' => 'A1_MA_HOLDER'])));
        self::assertSame(V::NEEDS_INFORMATION, self::statusOf(self::range('C.1.1', null, '2026-01-01')));
        self::assertSame(V::NEEDS_INFORMATION, self::statusOf(self::single('', '2026-01-01')), 'criterion unknown');
        self::assertSame(V::NEEDS_INFORMATION, self::statusOf(self::single('A.1', '2026-01-01')), 'degree without subcategory');
    }

    public function testMappingUsesCanonicalCodesPerGroup(): void
    {
        self::assertSame(V::PERIOD, V::validityTypeFor('FACULTY', 'B.3'), 'faculty B.3 is research');
        self::assertSame(V::COMPUTED, V::validityTypeFor('NON_TEACHING_FACULTY', 'B.3'), 'NTF B.3 is years at NDMU');
        self::assertSame(V::COMPUTED, V::validityTypeFor('FACULTY', 'C.3'));
        self::assertSame(V::PERIOD, V::validityTypeFor('NON_TEACHING_FACULTY', 'B.1.1'));
        self::assertSame(V::QUALIFICATION, V::validityTypeFor('FACULTY', 'A.1', 'A1_PHD_HOLDER'));
        self::assertSame(V::PERIOD, V::validityTypeFor('FACULTY', 'A.1', 'A1_MA_UNITS'), 'graduate units: one record per semester');
        self::assertFalse(V::evaluate(self::single('C.3', '2026-01-01'), self::COVERAGE, 'FACULTY')['eligible'], 'computed entries are not copied');
        self::assertSame(V::OUTSIDE_CYCLE, V::evaluate(self::single('A.1', '2010-01-01', ['subcategory_code' => 'A1_PHD_UNITS']), self::COVERAGE, 'FACULTY')['status'], 'units completed before the cycle do not count');
    }

    public function testExpectedPortfolioExample(): void
    {
        $db = $this->database('2025-06-01', '2027-05-31');
        $records = [
            'MA Degree 2020' => self::single('A.1', '2020-03-20', ['subcategory_code' => 'A1_MA_HOLDER', 'date_mode' => 'single']),
            'Seminar 2023' => self::single('A.3', '2023-08-10', ['date_mode' => 'range', 'start_date' => '2023-08-10', 'end_date' => '2023-08-10']),
            'Research Feb 2026' => self::single('B.3', '2026-02-14'),
            'Community Service 2025' => self::range('C.2.2', '2025-01-01', '2025-12-31'),
            'Publication without date' => self::single('B.2', null),
        ];
        foreach ($records as $title => &$record) $record['title'] = $title;
        unset($record);
        $result = (new V($db))->partition(array_values($records), ['ranking_cycle_id' => 'RC1', 'personnel_group' => 'FACULTY']);
        self::assertTrue($result['applied']);
        self::assertSame(['MA Degree 2020', 'Research Feb 2026', 'Community Service 2025'], array_column($result['eligible'], 'title'));
        self::assertSame(['Seminar 2023' => V::OUTSIDE_CYCLE, 'Publication without date' => V::NEEDS_INFORMATION], array_column($result['excluded'], 'status', 'title'));
        self::assertCount(5, $records, 'the permanent portfolio still holds all five records');
    }

    public function testCycleWithoutCoverageKeepsPreviousBehaviour(): void
    {
        $db = $this->database(null, null);
        $result = (new V($db))->partition([self::single('A.3', '2001-01-01'), self::single('B.2', null)], ['ranking_cycle_id' => 'RC1', 'personnel_group' => 'FACULTY', 'evaluation_end_at' => '2026-12-31 23:59:59']);
        self::assertFalse($result['applied']);
        self::assertCount(2, $result['eligible']);
        self::assertSame('2026-12-31', (new V($db))->serviceCutoff(['ranking_cycle_id' => 'RC1', 'evaluation_end_at' => '2026-12-31 23:59:59']));
    }

    public function testYearsOfServiceIsMeasuredToCoverageEnd(): void
    {
        $db = $this->database('2025-06-01', '2027-05-31');
        self::assertSame('2027-05-31', (new V($db))->serviceCutoff(['ranking_cycle_id' => 'RC1', 'evaluation_end_at' => '2027-09-30 23:59:59']));
    }

    public function testGateGuardsBothSubmissionPathsAndStoresTheDecision(): void
    {
        $source = file_get_contents(ROOTPATH . 'app/Controllers/Api/PersonnelPortfolioSubmissionController.php');
        self::assertStringContainsString('->partitionForPersonnel($accomplishments, $period, $personnelProfileId)', $source, 'first submission');
        self::assertStringContainsString('->partitionForPersonnel($accomplishments, $periodSnapshot, $personnelProfileId)', $source, 'resubmission');
        $submitStart = strpos($source, 'public function submit(): mixed');
        $resubmitStart = strpos($source, 'public function resubmit(): mixed');
        $historyStart = strpos($source, 'public function getHistory(): mixed');
        $submitFlow = substr($source, $submitStart, $resubmitStart - $submitStart);
        $resubmitFlow = substr($source, $resubmitStart, $historyStart - $resubmitStart);
        self::assertLessThan(strpos($submitFlow, '// Guard: Verify all items have proof attachments'), strpos($submitFlow, 'partitionForPersonnel('), 'initial submission filters to eligible records before proof validation');
        self::assertLessThan(strpos($resubmitFlow, '// Guard: Verify all items have proof attachments'), strpos($resubmitFlow, 'partitionForPersonnel('), 'resubmission filters to eligible records before proof validation');
        self::assertSame(2, substr_count($source, "\$accomplishments = \$cycleValidity['eligible'];"));
        self::assertSame(2, substr_count($source, "'cycle_validity'   => \$cycleValidity['decisions']"));
        self::assertStringNotContainsString("->table('personnel_achievement_usage')->ignore(true)->insert", $source, 'a submission must not consume its accomplishments');
        self::assertStringNotContainsString("->table('personnel_accomplishments')->whereIn('id', \$cycleValidity", $source, 'excluded records are never deleted');
        self::assertStringContainsString('assertAchievementCoverage($row)', file_get_contents(ROOTPATH . 'app/Services/PersonnelEvaluationPeriodService.php'));
        self::assertStringContainsString('serviceCutoff($period)', file_get_contents(ROOTPATH . 'app/Services/PersonnelEligibilityService.php'));
    }

    public function testOnlyFinalizedNonEducationUsageConsumesAnAccomplishment(): void
    {
        $db = $this->database('2025-06-01', '2027-05-31');
        $db->query('CREATE TABLE personnel_evaluations (id TEXT PRIMARY KEY, personnel_profile_id TEXT, status TEXT, academic_year TEXT)');
        $db->query('CREATE TABLE personnel_evaluation_items (id TEXT PRIMARY KEY, evaluation_id TEXT, accomplishment_id TEXT)');
        $db->table('personnel_evaluations')->insertBatch([
            ['id' => 'done-owner', 'personnel_profile_id' => 'P1', 'status' => 'completed', 'academic_year' => '2023-2025'],
            ['id' => 'returned-owner', 'personnel_profile_id' => 'P1', 'status' => 'returned_for_revision', 'academic_year' => '2025-2027'],
            ['id' => 'done-other', 'personnel_profile_id' => 'P2', 'status' => 'completed', 'academic_year' => '2023-2025'],
        ]);
        $db->table('personnel_evaluation_items')->insertBatch([
            ['id' => 'item-used', 'evaluation_id' => 'done-owner', 'accomplishment_id' => 'used-publication'],
            ['id' => 'item-returned', 'evaluation_id' => 'returned-owner', 'accomplishment_id' => 'returned-training'],
            ['id' => 'item-other', 'evaluation_id' => 'done-other', 'accomplishment_id' => 'other-person-record'],
            ['id' => 'item-education', 'evaluation_id' => 'done-owner', 'accomplishment_id' => 'old-degree'],
        ]);
        $records = [
            array_merge(self::single('B.2', '2026-02-01'), ['id' => 'used-publication', 'title' => 'Used publication']),
            array_merge(self::single('B.2', '2026-02-01'), ['id' => 'returned-training', 'title' => 'Returned training']),
            array_merge(self::single('A.1', '2018-02-01', ['subcategory_code' => 'A1_MA_HOLDER']), ['id' => 'old-degree', 'title' => 'Old degree']),
            array_merge(self::single('B.2', '2026-02-01'), ['id' => 'other-person-record', 'title' => 'Other person record']),
        ];

        $result = (new V($db))->partitionForPersonnel($records, ['ranking_cycle_id' => 'RC1', 'personnel_group' => 'FACULTY'], 'P1');

        self::assertSame(['returned-training', 'old-degree', 'other-person-record'], array_column($result['eligible'], 'id'));
        self::assertSame(V::PREVIOUSLY_FINALIZED, $result['decisions']['used-publication']['status']);
        self::assertSame('2023-2025', $result['decisions']['used-publication']['previous_finalized_academic_year']);
        self::assertTrue($result['decisions']['old-degree']['eligible'], 'old Faculty education remains reusable');
    }

    private function database(?string $start, ?string $end)
    {
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE ranking_cycles (id TEXT PRIMARY KEY, academic_year TEXT, coverage_start TEXT, coverage_end TEXT)');
        $this->sqlite->table('ranking_cycles')->insert(['id' => 'RC1', 'academic_year' => '2025-2026', 'coverage_start' => $start, 'coverage_end' => $end]);
        return $this->sqlite;
    }
}
