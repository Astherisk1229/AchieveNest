<?php
namespace Tests\Isolated;

use App\Services\CollegeInUseException;
use App\Services\CollegeService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use InvalidArgumentException;
use RuntimeException;

/** OSAD College edit and safe delete. SQLite :memory:, temporary logo storage. */
final class CollegeEditDeleteTest extends CIUnitTestCase
{
    private $sqlite;
    private string $storage;
    private CollegeService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE colleges (id TEXT PRIMARY KEY, code TEXT, name TEXT, description TEXT, status TEXT, acronym_badge_color TEXT, logo_storage_key TEXT, logo_original_name TEXT, logo_mime_type TEXT, logo_updated_at TEXT, created_at TEXT, updated_at TEXT)',
            'CREATE TABLE academic_programs (id TEXT PRIMARY KEY, college_id TEXT, code TEXT, name TEXT, degree_level TEXT, status TEXT)',
            'CREATE TABLE dean_assignments (id TEXT, personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE personnel_college_affiliations (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE administrative_units (id TEXT, college_id TEXT, status TEXT)',
            // Not in the label map: proves the live schema scan finds tables added by later migrations.
            'CREATE TABLE future_college_reports (id TEXT, target_college_id TEXT)',
        ] as $sql) $this->sqlite->query($sql);
        $this->sqlite->table('colleges')->insertBatch([
            ['id' => 'CET', 'code' => 'CET', 'name' => 'College of Engineering and Technology', 'status' => 'active'],
            ['id' => 'CEAC', 'code' => 'CEAC', 'name' => 'College of Engineering, Architecture and Computing', 'status' => 'inactive'],
        ]);
        $this->storage = sys_get_temp_dir() . '/college-logos-' . bin2hex(random_bytes(4));
        $this->service = $this->getMockBuilder(CollegeService::class)->setConstructorArgs([$this->sqlite, $this->storage])->onlyMethods(['getCollege'])->getMock();
        $this->service->method('getCollege')->willReturnCallback(fn ($id) => $this->sqlite->table('colleges')->where('id', $id)->get()->getRowArray());
    }

    protected function tearDown(): void
    {
        $this->sqlite->close();
        parent::tearDown();
    }

    public function testOsadCanEditCollegeInformation(): void
    {
        $updated = $this->service->updateCollege('CET', ['name' => 'College of Engineering & Technology', 'code' => 'cet', 'description' => 'Engineering disciplines', 'acronym_badge_color' => '#1b4d3e']);
        self::assertSame('College of Engineering & Technology', $updated['name']);
        self::assertSame('CET', $updated['code']);
        self::assertSame('Engineering disciplines', $updated['description']);
        self::assertSame('#1B4D3E', $updated['acronym_badge_color']);
        self::assertSame('active', $updated['status']); // lifecycle untouched
    }

    public function testEditRejectsDuplicateCodeAndBadColor(): void
    {
        try { $this->service->updateCollege('CET', ['code' => 'CEAC']); self::fail('duplicate code accepted'); }
        catch (InvalidArgumentException $e) { self::assertStringContainsString("'CEAC' already exists", $e->getMessage()); }
        $this->expectException(InvalidArgumentException::class);
        $this->service->updateCollege('CET', ['acronym_badge_color' => 'green']);
    }

    public function testActiveCollegeMustBeArchivedBeforeDelete(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('COLLEGE_NOT_ARCHIVED');
        $this->service->deleteCollege('CET');
    }

    public function testLinkedCollegeIsNotDeletedAndBlockersAreListed(): void
    {
        $this->sqlite->table('dean_assignments')->insert(['id' => 'D1', 'personnel_profile_id' => 'P1', 'college_id' => 'CEAC', 'is_active' => 0]);
        $this->sqlite->table('future_college_reports')->insert(['id' => 'R1', 'target_college_id' => 'CEAC']);
        try {
            $this->service->deleteCollege('CEAC');
            self::fail('linked College was deleted');
        } catch (CollegeInUseException $e) {
            $tables = array_column($e->references(), 'table');
            self::assertContains('dean_assignments', $tables);
            self::assertContains('future_college_reports', $tables);
        }
        self::assertSame(1, $this->sqlite->table('colleges')->where('id', 'CEAC')->countAllResults());
    }

    public function testUnlinkedArchivedCollegeIsDeleted(): void
    {
        $deleted = $this->service->deleteCollege('CEAC');
        self::assertSame('CEAC', $deleted['code']);
        self::assertSame(0, $this->sqlite->table('colleges')->where('id', 'CEAC')->countAllResults());
        self::assertSame(1, $this->sqlite->table('colleges')->where('id', 'CET')->countAllResults());
    }
}
