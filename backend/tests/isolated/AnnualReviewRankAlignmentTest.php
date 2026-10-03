<?php
namespace Tests\Isolated;

use App\Database\Migrations\ReconcileAuthoritativeFacultyRankTransitions;
use App\Services\AnnualReviewRankAlignmentService;
use App\Services\FacultyRankCatalogService;
use App\Services\FacultyRankProgressionService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use ReflectionClass;

/**
 * Workbook Present Rank / Applied Status alignment against the REAL seeded catalog and transitions:
 * rows are read from the seed migrations and the K2 reconcile migration is executed. SQLite :memory:.
 */
final class AnnualReviewRankAlignmentTest extends CIUnitTestCase
{
    private $sqlite;
    private AnnualReviewRankAlignmentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE faculty_rank_catalog (id INTEGER PRIMARY KEY AUTOINCREMENT, rank_code TEXT, display_label TEXT, catalog_type TEXT, qualification_tier_code TEXT, qualification_source_label TEXT, display_order INTEGER, source_document_id TEXT, source_row_id TEXT, seed_version TEXT, is_active INTEGER)');
        $this->sqlite->query("CREATE TABLE faculty_rank_transitions (id INTEGER PRIMARY KEY AUTOINCREMENT, from_rank_code TEXT, to_rank_code TEXT, transition_type TEXT, requires_verified_phd INTEGER, rule_reference TEXT, is_active INTEGER, created_at TEXT)");

        $migrations = APPPATH . 'Database/Migrations/';
        preg_match_all("/\['([A-Z_]+)', '([^']+)', '([a-z_]+)', '[^']*', (\d+), '([A-Z0-9]+)'\]/", file_get_contents($migrations . '2026-09-08-000064_CreateFacultyRankCatalog.php'), $ranks, PREG_SET_ORDER);
        foreach ($ranks as $r) $this->sqlite->table('faculty_rank_catalog')->insert(['rank_code' => $r[1], 'display_label' => $r[2], 'catalog_type' => 'full_time_academic_rank', 'qualification_tier_code' => $r[3], 'display_order' => (int) $r[4], 'source_row_id' => $r[5], 'is_active' => 1]);
        preg_match_all("/\['([A-Z_]+)', '([A-Z_]+)', '(normal_sequential|phd_exception)', (\d), '([^']+)'\]/", file_get_contents($migrations . '2026-09-08-000065_CreateFacultyRankTransitions.php'), $edges, PREG_SET_ORDER);
        foreach ($edges as $e) $this->sqlite->table('faculty_rank_transitions')->insert(['from_rank_code' => $e[1], 'to_rank_code' => $e[2], 'transition_type' => $e[3], 'requires_verified_phd' => (int) $e[4], 'rule_reference' => $e[5], 'is_active' => 1, 'created_at' => '2026-09-08 00:00:00']);
        self::assertCount(26, $ranks);
        self::assertGreaterThan(20, count($edges));

        require_once $migrations . '2026-09-15-000005_ReconcileAuthoritativeFacultyRankTransitions.php';
        $reconcile = (new ReflectionClass(ReconcileAuthoritativeFacultyRankTransitions::class))->newInstanceWithoutConstructor();
        $this->inject($reconcile, 'db', $this->sqlite);
        $reconcile->up();

        $catalog = (new ReflectionClass(FacultyRankCatalogService::class))->newInstanceWithoutConstructor();
        $this->inject($catalog, 'db', $this->sqlite);
        $progression = (new ReflectionClass(FacultyRankProgressionService::class))->newInstanceWithoutConstructor();
        $this->inject($progression, 'db', $this->sqlite);
        $this->inject($progression, 'catalogService', $catalog);
        $this->service = new AnnualReviewRankAlignmentService($catalog, $progression);
    }

    protected function tearDown(): void
    {
        $this->sqlite->close();
        parent::tearDown();
    }

    private function inject(object $object, string $property, $value): void
    {
        $ref = new \ReflectionProperty($object, $property);
        $ref->setValue($object, $value);
    }

    public function testWorkbookNumeralsMatchCatalogRomanNumerals(): void
    {
        self::assertSame('INSTRUCTOR_I', $this->service->match('Instructor 1')['rank_code']);
        self::assertSame('ASSOCIATE_PROFESSOR_I', $this->service->match('associate  professor 1')['rank_code']);
        self::assertSame('ASSISTANT_INSTRUCTOR', $this->service->match('Assistant Instructor')['rank_code']);
        self::assertNull($this->service->match('Dean'));
    }

    private function person(?string $rank, string $engagement = 'full_time_faculty'): array
    {
        return ['current_rank_title' => $rank, 'personnel_group' => 'faculty', 'faculty_engagement' => $engagement];
    }

    public function testUploadedWorkbookIsConsistentWhenSystemAgrees(): void
    {
        // Real uploaded workbook: Present Rank = Assistant Instructor, Applied Status = Instructor 1.
        $result = $this->service->evaluate('Assistant Instructor', 'Instructor 1', $this->person('Assistant Instructor'));
        self::assertSame('match', $result['present_rank_check']['status']);
        self::assertSame('system', $result['basis']);
        self::assertSame('aligned', $result['status']);
    }

    public function testSystemPresentRankIsAuthoritativeOverWorkbook(): void
    {
        // Workbook claims Assistant Instructor, but AchieveNest records Assistant Professor I.
        $result = $this->service->evaluate('Assistant Instructor', 'Instructor 1', $this->person('Assistant Professor I'));
        self::assertSame('mismatch', $result['present_rank_check']['status']);
        self::assertStringContainsString('AchieveNest records Assistant Professor I', $result['present_rank_check']['message']);
        self::assertSame('misaligned', $result['status']);
        self::assertSame('ASSISTANT_PROFESSOR_II', $result['recommended_rank']['rank_code']);
    }

    public function testSystemRankAcceptsCatalogCodeAsStoredValue(): void
    {
        $result = $this->service->evaluate('Assistant Instructor', 'Instructor 1', $this->person('ASSISTANT_INSTRUCTOR'));
        self::assertSame('match', $result['present_rank_check']['status']);
        self::assertSame('aligned', $result['status']);
    }

    public function testMissingSystemRankFallsBackToWorkbookAndSaysSo(): void
    {
        $result = $this->service->evaluate('Assistant Instructor', 'Assistant Professor 1', $this->person(null));
        self::assertSame('system_missing', $result['present_rank_check']['status']);
        self::assertSame('workbook', $result['basis']);
        self::assertSame('misaligned', $result['status']);
        self::assertSame('Instructor I', $result['recommended_rank']['display_label']);
        self::assertStringContainsString('no system rank on record', $result['message']);
    }

    public function testReconciledAuthoritativeTransitionIsUsed(): void
    {
        // K2 reconcile: Assistant Professor IV -> Associate Professor (not Associate Professor I).
        $result = $this->service->evaluate('Assistant Professor 4', 'Associate Professor 1', $this->person('Assistant Professor IV'));
        self::assertSame('misaligned', $result['status']);
        self::assertSame('ASSOCIATE_PROFESSOR', $result['recommended_rank']['rank_code']);
    }

    public function testPhdExceptionUsesVerifiedCredentialState(): void
    {
        $person = $this->person('Assistant Professor I');
        self::assertSame('aligned_requires_phd', $this->service->evaluate('Assistant Professor I', 'Professor I', $person, false)['status']);
        self::assertSame('aligned_requires_phd', $this->service->evaluate('Assistant Professor I', 'Professor I', $person, null)['status']);
        self::assertSame('aligned', $this->service->evaluate('Assistant Professor I', 'Professor I', $person, true)['status']);
    }

    public function testUnrecognizedAndMissingValues(): void
    {
        $person = $this->person('Assistant Instructor');
        self::assertSame('workbook_unrecognized', $this->service->evaluate('Lecturer', 'Instructor 1', $person)['present_rank_check']['status']);
        self::assertSame('workbook_missing', $this->service->evaluate('', 'Instructor 1', $person)['present_rank_check']['status']);
        $applied = $this->service->evaluate('Assistant Instructor', 'Instructor One', $person);
        self::assertSame('applied_rank_unrecognized', $applied['status']);
        self::assertSame('Instructor I', $applied['recommended_rank']['display_label']);
        self::assertSame('applied_rank_missing', $this->service->evaluate('Assistant Instructor', null, $person)['status']);
        self::assertSame('present_rank_unresolved', $this->service->evaluate('Lecturer', 'Instructor 1', $this->person(null))['status']);
    }

    public function testPartTimeFacultyGetsNoRecommendation(): void
    {
        $result = $this->service->evaluate('Assistant Instructor', 'Instructor 1', $this->person('Assistant Instructor', 'part_time_faculty'));
        self::assertSame('not_applicable', $result['status']);
        self::assertNull($result['recommended_rank']);
    }
}
