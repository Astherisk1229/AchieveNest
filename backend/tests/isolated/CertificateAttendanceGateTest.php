<?php
namespace Tests\Isolated;

use App\Services\EventSourceRecordBridgeService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/** ST-3: a certificate for an event-based record is issued only after the student attended. SQLite :memory:. */
final class CertificateAttendanceGateTest extends CIUnitTestCase
{
    private $sqlite;
    private EventSourceRecordBridgeService $bridge;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $this->sqlite->query('CREATE TABLE attendance_sessions (id TEXT PRIMARY KEY, event_id TEXT, status TEXT)');
        $this->sqlite->query('CREATE TABLE attendance_records (id TEXT PRIMARY KEY, session_id TEXT, attendee_profile_id TEXT)');
        $this->sqlite->table('attendance_sessions')->insertBatch([
            ['id' => 'S-CLOSED', 'event_id' => 'EV1', 'status' => 'closed'],
            ['id' => 'S-OPEN', 'event_id' => 'EV2', 'status' => 'open'],
        ]);
        $this->sqlite->table('attendance_records')->insertBatch([
            ['id' => 'A1', 'session_id' => 'S-CLOSED', 'attendee_profile_id' => 'ATTENDED'],
            ['id' => 'A2', 'session_id' => 'S-OPEN', 'attendee_profile_id' => 'ATTENDED'],
        ]);
        $this->bridge = new EventSourceRecordBridgeService($this->sqlite, new \App\Services\StudentCategoryMapperRegistry());
    }

    protected function tearDown(): void { $this->sqlite?->close(); parent::tearDown(); }

    private function source(string $student, ?string $eventId): array
    {
        return ['student_profile_id' => $student, 'structured_metadata' => json_encode($eventId ? ['origin_event_id' => $eventId] : [])];
    }

    public function testAttendedStudentIsNotBlocked(): void
    {
        self::assertSame([], $this->bridge->certificateAttendanceReasons($this->source('ATTENDED', 'EV1')));
    }

    public function testAbsentStudentIsBlocked(): void
    {
        self::assertSame(['ATTENDANCE_NOT_VERIFIED'], $this->bridge->certificateAttendanceReasons($this->source('ABSENT', 'EV1')));
    }

    public function testAttendanceInAnOpenSessionDoesNotCountYet(): void
    {
        self::assertSame(['ATTENDANCE_NOT_VERIFIED'], $this->bridge->certificateAttendanceReasons($this->source('ATTENDED', 'EV2')));
    }

    public function testRecordsNotFromAnEventAreUnaffected(): void
    {
        self::assertSame([], $this->bridge->certificateAttendanceReasons($this->source('ABSENT', null)));
    }

    public function testIssuanceAndReadinessBothApplyTheGate(): void
    {
        foreach (['app/Services/CertificateIssuanceService.php', 'app/Controllers/Api/CertificateController.php'] as $file) {
            self::assertStringContainsString('certificateAttendanceReasons($source)', file_get_contents(ROOTPATH . $file));
        }
    }
}
