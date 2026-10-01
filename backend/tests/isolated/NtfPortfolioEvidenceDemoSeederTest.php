<?php
namespace Tests\Isolated;

use App\Database\Seeds\NtfPortfolioEvidenceDemoSeeder;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/** Local NTF portfolio demo seeder: populates the HR studio, idempotent, removable, never touches real items. SQLite :memory:. */
final class NtfPortfolioEvidenceDemoSeederTest extends CIUnitTestCase
{
    private $sqlite;
    private string $root;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE personnel_evaluations (id TEXT PRIMARY KEY, personnel_profile_id TEXT, status TEXT, evaluation_scale_version_id TEXT)',
            'CREATE TABLE personnel_accomplishments (id TEXT PRIMARY KEY, personnel_profile_id TEXT, domain TEXT, title TEXT, organizer_or_publisher TEXT, occurrence_date TEXT, description TEXT, status TEXT, category_code TEXT, category_area TEXT, category_metadata TEXT, created_at TEXT, updated_at TEXT)',
            'CREATE TABLE personnel_accomplishment_evidence (id TEXT PRIMARY KEY, accomplishment_id TEXT, storage_path TEXT, original_filename TEXT, mime_type TEXT, detected_mime_type TEXT, byte_size INTEGER, checksum TEXT, sha256 TEXT, uploaded_by TEXT, uploaded_at TEXT, security_status TEXT, malware_scanner TEXT, status TEXT)',
            // No "domain"-less variance needed; one optional column (evidence_id) exists, another (portfolio_section) intentionally does not.
            'CREATE TABLE personnel_evaluation_items (id TEXT PRIMARY KEY, evaluation_id TEXT, accomplishment_id TEXT, evidence_id TEXT, domain TEXT, item_description TEXT, category_area TEXT, criterion_code TEXT, criterion_key TEXT, criterion_title TEXT, criterion_version_id TEXT, criterion_snapshot TEXT, configured_points_snapshot REAL, submission_order INTEGER, evidence_snapshot TEXT, evidence_title TEXT, file_name TEXT, file_url TEXT, source_type TEXT, verification_status TEXT, rating_status TEXT, scoring_payload TEXT, created_at TEXT, updated_at TEXT)',
        ] as $sql) $this->sqlite->query($sql);
        $this->sqlite->table('personnel_evaluations')->insertBatch([
            ['id' => 'd7000000-0000-0000-0002-000000000002', 'personnel_profile_id' => 'd0000000-0000-0000-0001-000000000006', 'status' => 'in_evaluation', 'evaluation_scale_version_id' => 'ver-ntp'],
            ['id' => 'd7000000-0000-0000-0002-000000000001', 'personnel_profile_id' => 'd0000000-0000-0000-0001-000000000004', 'status' => 'submitted', 'evaluation_scale_version_id' => 'ver-ntp'],
        ]);
        // A real (non-demo) item that must never be touched.
        $this->sqlite->table('personnel_evaluation_items')->insert(['id' => 'real-item-1', 'evaluation_id' => 'd7000000-0000-0000-0002-000000000002', 'criterion_code' => 'A.1', 'category_area' => 'areaA']);
        $this->root = sys_get_temp_dir() . '/ntf-demo-evidence-' . bin2hex(random_bytes(4)) . '/';
    }

    protected function tearDown(): void
    {
        putenv('NTF_DEMO_EVIDENCE');
        $this->sqlite->close();
        parent::tearDown();
    }

    private function runSeeder(): NtfPortfolioEvidenceDemoSeeder
    {
        $seeder = new NtfPortfolioEvidenceDemoSeeder(new \Config\Database(), $this->sqlite);
        (new \ReflectionProperty($seeder, 'storage'))->setValue($seeder, new LocalEvidenceStorageService($this->root));
        $seeder->run();
        return $seeder;
    }

    private function demoItems(string $evaluationId): array
    {
        return $this->sqlite->table('personnel_evaluation_items')->where('evaluation_id', $evaluationId)->like('id', 'd7100000', 'after')->orderBy('submission_order')->get()->getResultArray();
    }

    public function testSeedsEveryNtfAreaBCriterionWithEvidenceAndOfficialPoints(): void
    {
        $seeder = $this->runSeeder();
        $items = $this->demoItems('d7000000-0000-0000-0002-000000000002');
        self::assertSame(['B.1.a', 'B.1.b', 'B.1.c', 'B.1.d', 'B.2.a', 'B.2.b', 'B.2.c', 'B.4'], array_column($items, 'criterion_code'));
        self::assertSame(['areaB'], array_values(array_unique(array_column($items, 'category_area'))));
        self::assertSame(['pending'], array_values(array_unique(array_column($items, 'verification_status'))));

        // Points equal the Appendix N instrument values.
        $points = $seeder->instrumentPoints();
        self::assertEquals([$points['moderator_officer'], $points['trainer_coach'], $points['working_committee'], $points['rendered_service'], $points['church_activities'], $points['community_civic'], $points['charity_projects'], $points['B.4']], array_map('floatval', array_column($items, 'configured_points_snapshot')));
        self::assertEquals(30.0, (float) $items[0]['configured_points_snapshot']);

        // Each item has a stored, readable PDF linked through the accomplishment.
        $storage = new LocalEvidenceStorageService($this->root);
        foreach ($items as $item) {
            $evidence = $this->sqlite->table('personnel_accomplishment_evidence')->where('id', $item['evidence_id'])->get()->getRowArray();
            self::assertSame($item['accomplishment_id'], $evidence['accomplishment_id']);
            $path = $storage->resolveAbsolutePath($evidence['storage_path']);
            self::assertNotNull($path);
            self::assertStringStartsWith('%PDF-1.4', file_get_contents($path));
            $payload = json_decode($item['scoring_payload'], true);
            self::assertNotEmpty($payload['occurrence_date']);
            self::assertNotEmpty($payload['category_metadata']['details']['role']);
        }
        // Both open demo evaluations are populated.
        self::assertCount(8, $this->demoItems('d7000000-0000-0000-0002-000000000001'));
    }

    public function testRerunIsIdempotentAndRealItemsAreUntouched(): void
    {
        $this->runSeeder();
        $this->runSeeder();
        self::assertCount(8, $this->demoItems('d7000000-0000-0000-0002-000000000002'));
        self::assertSame(16, $this->sqlite->table('personnel_accomplishments')->countAllResults());
        self::assertSame(1, $this->sqlite->table('personnel_evaluation_items')->where('id', 'real-item-1')->countAllResults());
    }

    public function testRemoveModeDeletesOnlyDemoRows(): void
    {
        $this->runSeeder();
        putenv('NTF_DEMO_EVIDENCE=remove');
        $this->runSeeder();
        self::assertSame(0, $this->sqlite->table('personnel_accomplishments')->countAllResults());
        self::assertSame(0, $this->sqlite->table('personnel_accomplishment_evidence')->countAllResults());
        self::assertSame(['real-item-1'], array_column($this->sqlite->table('personnel_evaluation_items')->get()->getResultArray(), 'id'));
    }

    public function testFinalizedEvaluationsAreNotSeeded(): void
    {
        $this->sqlite->table('personnel_evaluations')->where('id', 'd7000000-0000-0000-0002-000000000001')->update(['status' => 'completed']);
        $this->runSeeder();
        self::assertCount(0, $this->demoItems('d7000000-0000-0000-0002-000000000001'));
        self::assertCount(8, $this->demoItems('d7000000-0000-0000-0002-000000000002'));
    }
}
