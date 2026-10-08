<?php
namespace Tests\Isolated;

use App\Controllers\Api\HREvaluationController;
use App\Services\EvaluationValidityService as V;
use App\Services\FacultyEvaluationSummaryStrategy;
use App\Services\GraduateUnitScoringService as G;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use ReflectionClass;

/**
 * A.1.2 / A.1.4 graduate units: one record per semester, each validated on its own completion
 * date, units summed per level after validity, official table applied once.
 */
final class GraduateUnitScoringTest extends CIUnitTestCase
{
    private $sqlite;

    protected function tearDown(): void { $this->sqlite?->close(); parent::tearDown(); }

    /** Portfolio record for one semester (as saved by the faculty form). */
    private static function semester(string $level, int $units, ?string $completed, string $semester = 'First Semester', string $year = '2025-2026'): array
    {
        return ['id' => uniqid('rec-', true), 'title' => "{$level} units {$semester} {$year}", 'category_code' => 'A.1', 'occurrence_date' => $completed,
            'category_metadata' => json_encode(['subcategory_code' => $level === 'PHD' ? 'A1_PHD_UNITS' : 'A1_MA_UNITS', 'date_mode' => 'range',
                'start_date' => $completed ? date('Y-m-d', strtotime($completed . ' -4 months')) : null, 'end_date' => $completed,
                'details' => ['units_completed' => (string) $units, 'program' => 'MA Education', 'institution' => 'NDMU', 'semester' => $semester, 'academic_year' => $year]])];
    }

    /** The evaluation item the submission snapshot creates from a record, rated by the evaluator. */
    private static function item(array $record): array
    {
        $metadata = json_decode($record['category_metadata'], true);
        $reference = $metadata['subcategory_code'] === 'A1_PHD_UNITS' ? 'A.1.2' : 'A.1.4';
        return ['id' => 'item-' . $record['id'], 'accomplishment_id' => $record['id'], 'category_area' => 'areaA', 'criterion_code' => 'A.1', 'criterion_key' => $reference,
            'criterion_snapshot' => json_encode(['criterion_reference' => $reference, 'criterion_cap' => 40, 'category' => ['category_code' => 'A.1', 'area_code' => 'A', 'max_points' => 40, 'area_max_points' => 90]]),
            'scoring_payload' => json_encode(['occurrence_date' => $record['occurrence_date'], 'category_metadata' => $metadata]),
            'verification_status' => 'verified', 'rating_status' => 'rated', 'awarded_points' => 0.0];
    }

    private static function totals(array $items): array
    {
        $controller = (new ReflectionClass(HREvaluationController::class))->newInstanceWithoutConstructor();
        $method = new \ReflectionMethod($controller, 'snapshotTotals');
        return $method->invoke($controller, $items);
    }

    private static function level(array $aggregate, string $level): array
    {
        return $aggregate[$level] ?? ['units' => 0, 'points' => 0.0, 'item_ids' => []];
    }

    public function testOfficialTablesAreUnchanged(): void
    {
        foreach ([3 => 2, 6 => 4, 9 => 6, 12 => 8, 15 => 10, 18 => 10, 2 => 0] as $units => $points) self::assertSame((float) $points, G::pointsFor(G::PHD, $units), "Ph.D. {$units}");
        foreach ([3 => 1, 6 => 2, 9 => 3, 12 => 4, 15 => 5, 18 => 6, 21 => 7, 24 => 8, 27 => 9, 30 => 10, 36 => 10, 14 => 4] as $units => $points) self::assertSame((float) $points, G::pointsFor(G::MA, $units), "MA {$units}");
    }

    /** TEST 1 */
    public function testTwoMaSemestersStaySeparateAndScoreOnTheirTotal(): void
    {
        $first = self::semester('MA', 6, '2025-10-15', 'First Semester');
        $second = self::semester('MA', 9, '2026-03-20', 'Second Semester');
        $items = [self::item($first), self::item($second)];
        self::assertCount(2, $items, 'two separate records, two separate evaluation items');
        $ma = self::level(G::aggregate($items), G::MA);
        self::assertSame(15, $ma['units']);
        self::assertSame(5.0, $ma['points']);
        self::assertSame(['item-' . $first['id'], 'item-' . $second['id']], $ma['item_ids']);
        self::assertSame(5.0, self::totals($items)['category_scores']['A.1']);
    }

    /** TEST 2 */
    public function testPhdUnitsAreSummedBeforeTheTableNotAddedPerSemester(): void
    {
        $items = [self::item(self::semester('PHD', 12, '2025-10-15')), self::item(self::semester('PHD', 6, '2026-03-20', 'Second Semester'))];
        $phd = self::level(G::aggregate($items), G::PHD);
        self::assertSame(18, $phd['units']);
        self::assertSame(10.0, $phd['points']);
        self::assertNotSame(12.0, self::totals($items)['category_scores']['A.1'], '8 + 4 per semester must never happen');
        self::assertSame(10.0, self::totals($items)['category_scores']['A.1']);
    }

    /** TEST 3, 6, 7 and 5: each semester validated on its own completion date; boundaries inclusive. */
    public function testEachSemesterPassesTheCycleGateOnItsOwn(): void
    {
        $coverage = ['start' => '2025-01-01', 'end' => '2026-12-31'];
        $outside = self::semester('MA', 6, '2024-10-15', 'First Semester', '2024-2025');
        $inside = self::semester('MA', 9, '2025-10-15');
        self::assertSame(V::OUTSIDE_CYCLE, V::evaluate($outside, $coverage, 'FACULTY')['status']);
        self::assertSame(V::ELIGIBLE, V::evaluate($inside, $coverage, 'FACULTY')['status']);
        self::assertSame(V::ELIGIBLE, V::evaluate(self::semester('MA', 3, '2025-01-01'), $coverage, 'FACULTY')['status'], 'TEST 6: on coverage_start');
        self::assertSame(V::ELIGIBLE, V::evaluate(self::semester('MA', 3, '2026-12-31'), $coverage, 'FACULTY')['status'], 'TEST 7: on coverage_end');
        $missing = V::evaluate(self::semester('MA', 6, null), $coverage, 'FACULTY');
        self::assertSame(V::NEEDS_INFORMATION, $missing['status'], 'TEST 5');
        self::assertNull($missing['date_used'], 'no date is substituted');
    }

    /** TEST 3 end to end: only the inside semester reaches the evaluation, so only its units count. */
    public function testOutsideCycleUnitsNeverReachTheTotal(): void
    {
        $db = $this->cycle('2025-01-01', '2026-12-31');
        $outside = self::semester('MA', 6, '2024-10-15', 'First Semester', '2024-2025');
        $inside = self::semester('MA', 9, '2025-10-15');
        $gate = (new V($db))->partition([$outside, $inside], ['ranking_cycle_id' => 'RC', 'personnel_group' => 'FACULTY']);
        self::assertSame([$inside['id']], array_column($gate['eligible'], 'id'));
        $ma = self::level(G::aggregate(array_map([self::class, 'item'], $gate['eligible'])), G::MA);
        self::assertSame(9, $ma['units']);
        self::assertSame(3.0, $ma['points']);
    }

    /** TEST 4 */
    public function testMaAndPhdUnitsAreNeverCombined(): void
    {
        $aggregate = G::aggregate([self::item(self::semester('MA', 6, '2025-10-15')), self::item(self::semester('PHD', 9, '2025-10-15'))]);
        self::assertSame(6, self::level($aggregate, G::MA)['units']);
        self::assertSame(9, self::level($aggregate, G::PHD)['units']);
        self::assertSame(2.0, self::level($aggregate, G::MA)['points']);
        self::assertSame(6.0, self::level($aggregate, G::PHD)['points']);
        self::assertNotContains(15, array_column($aggregate, 'units'));
    }

    /** Section 8 example: 2024 outside; 6 + 9 + 3 = 18 MA units = 6 points; three separate items. */
    public function testCompleteExample(): void
    {
        $db = $this->cycle('2025-01-01', '2026-12-31');
        $records = [
            self::semester('MA', 6, '2024-10-15', 'First Semester', '2024-2025'),
            self::semester('MA', 6, '2025-10-15', 'First Semester', '2025-2026'),
            self::semester('MA', 9, '2026-03-20', 'Second Semester', '2025-2026'),
            self::semester('MA', 3, '2026-10-15', 'First Semester', '2026-2027'),
        ];
        $gate = (new V($db))->partition($records, ['ranking_cycle_id' => 'RC', 'personnel_group' => 'FACULTY']);
        self::assertCount(3, $gate['eligible']);
        self::assertSame(V::OUTSIDE_CYCLE, $gate['excluded'][0]['status']);
        $items = array_map([self::class, 'item'], $gate['eligible']);
        self::assertCount(3, $items, 'three separate semester items, no synthetic 18-unit record');
        self::assertSame(['units' => 18, 'points' => 6.0], array_intersect_key(self::level(G::aggregate($items), G::MA), ['units' => 1, 'points' => 1]));
        self::assertSame(6.0, self::totals($items)['category_scores']['A.1']);
        self::assertCount(4, $records, 'the permanent portfolio keeps all four records');
    }

    public function testHolderScoringAndCategoryCapAreUnchanged(): void
    {
        $holder = ['id' => 'holder', 'category_area' => 'areaA', 'criterion_code' => 'A.1', 'criterion_key' => 'A.1.3', 'verification_status' => 'verified', 'rating_status' => 'rated', 'awarded_points' => 20.0,
            'criterion_snapshot' => json_encode(['criterion_reference' => 'A.1.3', 'criterion_cap' => 40, 'category' => ['category_code' => 'A.1', 'area_code' => 'A', 'max_points' => 40, 'area_max_points' => 90]])];
        $items = [$holder, self::item(self::semester('MA', 15, '2025-10-15'))];
        self::assertSame(25.0, self::totals($items)['category_scores']['A.1'], 'MA Holder 20 + MA Units total 5');
        $phdHolder = ['awarded_points' => 40.0, 'criterion_key' => 'A.1.1'] + $holder;
        self::assertSame(40.0, self::totals([$phdHolder, self::item(self::semester('PHD', 18, '2025-10-15'))])['areaA_score'], 'existing A.1 cap of 40 still applies');
    }

    public function testUnratedOrUnverifiedSemestersDoNotCount(): void
    {
        $rated = self::item(self::semester('MA', 6, '2025-10-15'));
        $pending = ['rating_status' => 'unrated'] + self::item(self::semester('MA', 9, '2026-03-20'));
        self::assertSame(6, self::level(G::aggregate([$rated, $pending]), G::MA)['units']);
    }

    public function testSummaryKeepsSemesterRowsAndAddsOneTotalRow(): void
    {
        $items = [self::item(self::semester('MA', 6, '2025-10-15')), self::item(self::semester('MA', 9, '2026-03-20', 'Second Semester'))];
        $summary = (new FacultyEvaluationSummaryStrategy())->render(['personnel_profile_id' => 'P'], $items, [], ['total_score' => 5]);
        $rows = $summary['sections'][0]['items'];
        self::assertCount(3, $rows);
        self::assertSame([0.0, 0.0], [$rows[0]['points_earned'], $rows[1]['points_earned']], 'semester rows carry no points of their own');
        self::assertSame('MA Units total', $rows[0]['counted_in']);
        self::assertTrue($rows[2]['aggregate']);
        self::assertSame(15, $rows[2]['units']);
        self::assertSame(5.0, $rows[2]['points_earned']);
        self::assertSame(5.0, $summary['sections'][0]['points_earned']);
    }

    /** TEST 8: both paths use the same gate and the same snapshot; scoring reads only the snapshot. */
    public function testSubmissionAndResubmissionBehaveTheSame(): void
    {
        $db = $this->cycle('2025-01-01', '2026-12-31');
        $records = [self::semester('PHD', 12, '2025-10-15'), self::semester('PHD', 6, '2026-03-20', 'Second Semester'), self::semester('PHD', 9, '2024-10-15', 'First Semester', '2024-2025')];
        $service = new V($db);
        $first = $service->partition($records, ['ranking_cycle_id' => 'RC', 'personnel_group' => 'FACULTY']);
        $again = $service->partition($records, ['ranking_cycle_id' => 'RC', 'personnel_group' => 'FACULTY']);
        self::assertSame(array_column($first['eligible'], 'id'), array_column($again['eligible'], 'id'));
        self::assertSame(10.0, self::totals(array_map([self::class, 'item'], $again['eligible']))['category_scores']['A.1']);
        $source = file_get_contents(ROOTPATH . 'app/Controllers/Api/PersonnelPortfolioSubmissionController.php');
        self::assertStringContainsString('->partitionForPersonnel($accomplishments, $period, $personnelProfileId)', $source);
        self::assertStringContainsString('->partitionForPersonnel($accomplishments, $periodSnapshot, $personnelProfileId)', $source);
        $hr = file_get_contents(ROOTPATH . 'app/Controllers/Api/HREvaluationController.php');
        self::assertStringContainsString('GraduateUnitScoringService::aggregate($items)', $hr);
        self::assertStringContainsString('GraduateUnitScoringService::isUnitItem($item)) $awardedPoints = 0.0', $hr);
    }

    private function cycle(string $start, string $end)
    {
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE ranking_cycles (id TEXT PRIMARY KEY, coverage_start TEXT, coverage_end TEXT)');
        $this->sqlite->table('ranking_cycles')->insert(['id' => 'RC', 'coverage_start' => $start, 'coverage_end' => $end]);
        return $this->sqlite;
    }
}
