<?php
namespace Tests\Isolated;

use App\Services\PersonnelAccomplishmentDuplicateGuard as G;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/** Personnel duplicate accomplishments are refused even when the database is behind. SQLite :memory:. */
final class PersonnelAccomplishmentDuplicateGuardTest extends CIUnitTestCase
{
    private $sqlite;

    private function connect(bool $withHashColumn)
    {
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE personnel_accomplishments (id TEXT PRIMARY KEY, personnel_profile_id TEXT, title TEXT, occurrence_date TEXT, category_code TEXT, category_metadata TEXT' . ($withHashColumn ? ', duplicate_hash TEXT' : '') . ')');
        return $this->sqlite;
    }

    protected function tearDown(): void { $this->sqlite?->close(); parent::tearDown(); }

    private function seminar(): array
    {
        return ['subcategory_code' => 'A.3.1', 'start_date' => '2025-03-10', 'end_date' => '2025-03-12', 'details' => ['title' => 'Research Ethics Seminar', 'organizer' => 'CHED']];
    }

    public function testSameDetailsWithSpacingAndCaseDifferencesAreTheSameAccomplishment(): void
    {
        $a = G::identityHash('A.3', '2025-03-10', $this->seminar());
        $b = G::identityHash('A.3', '2025-03-10', ['subcategory_code' => 'A.3.1', 'start_date' => '2025-03-10', 'end_date' => '2025-03-12', 'details' => ['organizer' => ' ched ', 'title' => 'research  ethics seminar']]);
        self::assertSame($a, $b);
        self::assertNotSame($a, G::identityHash('A.3', '2025-03-11', $this->seminar()));
    }

    public function testEntriesWithoutSubcategoryUseTheTitle(): void
    {
        self::assertNotNull(G::identityHash('B.2', '2025-05-01', [], 'Coastal Clean-up Drive'));
        self::assertSame(G::identityHash('B.2', '2025-05-01', [], 'Coastal Clean-up Drive'), G::identityHash('B.2', '2025-05-01', [], ' coastal  clean-up drive '));
        self::assertNull(G::identityHash('B.2', '2025-05-01', [], ''));
    }

    public function testFindsByStoredHash(): void
    {
        $db = $this->connect(true);
        $hash = G::identityHash('A.3', '2025-03-10', $this->seminar());
        $db->table('personnel_accomplishments')->insert(['id' => 'R1', 'personnel_profile_id' => 'P1', 'title' => 'Seminar', 'occurrence_date' => '2025-03-10', 'category_code' => 'A.3', 'category_metadata' => json_encode($this->seminar()), 'duplicate_hash' => $hash]);
        $guard = new G($db);
        self::assertSame('R1', $guard->findDuplicate('P1', $hash)['id']);
        self::assertNull($guard->findDuplicate('P1', $hash, 'R1'), 'the record itself is not its own duplicate');
        self::assertNull($guard->findDuplicate('P2', $hash), 'other people may have the same accomplishment');
    }

    public function testFindsOlderRecordsSavedWithoutAHash(): void
    {
        $db = $this->connect(true);
        $db->table('personnel_accomplishments')->insert(['id' => 'OLD', 'personnel_profile_id' => 'P1', 'title' => 'Seminar', 'occurrence_date' => '2025-03-10', 'category_code' => 'A.3', 'category_metadata' => json_encode($this->seminar()), 'duplicate_hash' => null]);
        self::assertSame('OLD', (new G($db))->findDuplicate('P1', G::identityHash('A.3', '2025-03-10', $this->seminar()))['id']);
    }

    public function testWorksWhenTheHashColumnIsMissing(): void
    {
        $db = $this->connect(false);
        $db->table('personnel_accomplishments')->insert(['id' => 'NTF', 'personnel_profile_id' => 'P1', 'title' => 'Coastal Clean-up Drive', 'occurrence_date' => '2025-05-01', 'category_code' => 'B.2', 'category_metadata' => null]);
        $guard = new G($db);
        self::assertSame('NTF', $guard->findDuplicate('P1', G::identityHash('B.2', '2025-05-01', [], 'COASTAL clean-up drive'))['id']);
        self::assertNull($guard->findDuplicate('P1', G::identityHash('B.2', '2025-06-01', [], 'Coastal Clean-up Drive')));
    }
}
