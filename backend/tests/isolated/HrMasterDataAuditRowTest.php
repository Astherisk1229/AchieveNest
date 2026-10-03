<?php
namespace Tests\Isolated;

use App\Controllers\Api\TargetHRPersonnelController;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use ReflectionClass;
use ReflectionMethod;

/**
 * Regression: HR "Edit Master Data" and "Update Classification" audit inserts used a
 * non-existent `performed_by` column and omitted NOT NULL `new_status`, so the insert
 * threw and the whole save rolled back. SQLite :memory: mirrors the real column rules.
 */
final class HrMasterDataAuditRowTest extends CIUnitTestCase
{
    private function db()
    {
        $db = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $db->query('CREATE TABLE account_lifecycle_events (
            id TEXT PRIMARY KEY NOT NULL,
            profile_id TEXT NOT NULL,
            actor_profile_id TEXT NULL,
            event_type TEXT NOT NULL,
            previous_status TEXT NULL,
            new_status TEXT NOT NULL,
            reason TEXT NULL,
            metadata TEXT NULL,
            occurred_at TEXT NOT NULL
        )');
        return $db;
    }

    private function row(...$args): array
    {
        $controller = (new ReflectionClass(TargetHRPersonnelController::class))->newInstanceWithoutConstructor();
        return (new ReflectionMethod($controller, 'lifecycleAuditRow'))->invoke($controller, ...$args);
    }

    public function testMasterDataAuditRowInsertsIntoRealSchema(): void
    {
        $db = $this->db();
        $row = $this->row('P1', 'HR1', 'master_data_updated', 'active', ['new_employment_start_date' => '2020-06-01'], '2026-10-02 10:00:00');

        self::assertArrayNotHasKey('performed_by', $row);
        self::assertSame('HR1', $row['actor_profile_id']);
        self::assertSame('active', $row['new_status']);
        self::assertTrue($db->table('account_lifecycle_events')->insert($row));

        $saved = $db->table('account_lifecycle_events')->where('event_type', 'master_data_updated')->get()->getRowArray();
        self::assertSame('2020-06-01', json_decode($saved['reason'], true)['new_employment_start_date']);
        $db->close();
    }

    public function testClassificationAuditRowDefaultsMissingStatusToActive(): void
    {
        $db = $this->db();
        $row = $this->row('P2', 'HR1', 'classification_updated', null, ['new_group' => 'faculty'], '2026-10-02 10:00:00');

        self::assertSame('active', $row['previous_status']);
        self::assertSame('active', $row['new_status']);
        self::assertTrue($db->table('account_lifecycle_events')->insert($row));
        $db->close();
    }

    public function testControllerNoLongerWritesPerformedBy(): void
    {
        $source = file_get_contents((new ReflectionClass(TargetHRPersonnelController::class))->getFileName());
        self::assertStringNotContainsString("'performed_by'", $source);
    }
}
