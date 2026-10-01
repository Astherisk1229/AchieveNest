<?php
namespace Tests\Isolated;

use App\Controllers\Api\EventController;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use ReflectionMethod;

/** OM-1: event text limits and no duplicate event for the same organization, title and day. SQLite :memory:. */
final class EventInputRulesTest extends CIUnitTestCase
{
    private $sqlite;
    private EventController $controller;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE events (id TEXT PRIMARY KEY, organization_id TEXT NULL, organizer_profile_id TEXT, title TEXT, start_time TEXT, status TEXT)');
        $this->sqlite->table('events')->insertBatch([
            ['id' => 'E1', 'organization_id' => 'ORG', 'organizer_profile_id' => 'M1', 'title' => 'Leadership Summit', 'start_time' => '2026-11-05 09:00:00', 'status' => 'published'],
            ['id' => 'E2', 'organization_id' => 'ORG', 'organizer_profile_id' => 'M1', 'title' => 'Cancelled Fair', 'start_time' => '2026-11-06 09:00:00', 'status' => 'cancelled'],
        ]);
        $db = $this->sqlite;
        $this->controller = new class ($db) extends EventController {
            public function __construct(private BaseConnection $testDb) {}
            protected function getDb(): BaseConnection { return $this->testDb; }
        };
    }

    protected function tearDown(): void { $this->sqlite->close(); parent::tearDown(); }

    private function call(string $method, ...$args)
    {
        return (new ReflectionMethod($this->controller, $method))->invoke($this->controller, ...$args);
    }

    public function testFieldLimits(): void
    {
        self::assertNull($this->call('eventFieldError', 'Leadership Summit', '', 'seminar'));
        self::assertSame('INVALID_EVENT_TITLE', $this->call('eventFieldError', 'ab', '', 'seminar')['code']);
        self::assertSame('INVALID_EVENT_TITLE', $this->call('eventFieldError', str_repeat('x', 151), '', 'seminar')['code']);
        self::assertSame('INVALID_EVENT_DESCRIPTION', $this->call('eventFieldError', 'Leadership Summit', str_repeat('x', 2001), 'seminar')['code']);
    }

    public function testDuplicateEventSameOrganizationTitleAndDay(): void
    {
        self::assertSame('E1', $this->call('findDuplicateEvent', 'ORG', 'M1', '  leadership   SUMMIT ', '2026-11-05')['id']);
        self::assertNull($this->call('findDuplicateEvent', 'ORG', 'M1', 'Leadership Summit', '2026-11-06'), 'different day');
        self::assertNull($this->call('findDuplicateEvent', 'OTHER', 'M2', 'Leadership Summit', '2026-11-05'), 'different organization');
        self::assertNull($this->call('findDuplicateEvent', 'ORG', 'M1', 'Leadership Summit', '2026-11-05', 'E1'), 'editing the event itself');
        self::assertNull($this->call('findDuplicateEvent', 'ORG', 'M1', 'Cancelled Fair', '2026-11-06'), 'cancelled events do not block');
    }
}
