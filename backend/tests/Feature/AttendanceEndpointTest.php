<?php

namespace Tests\Feature;

use App\Controllers\Api\AttendanceController;
use App\Models\AttendanceRecordModel;
use App\Models\AttendanceSessionModel;
use App\Services\AttendanceService;
use App\Services\AuthorizationService;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use Config\App;
use Config\Database;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class AttendanceEndpointTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    use FeatureTestTrait;

    private static string $modJpiaProfileId = 'd0000000-0000-0000-0001-000000000010';
    private static string $jpiaOrgId        = 'd0000000-0000-0000-0002-000000000000';

    private static string $modCssProfileId  = '10000000-0000-0000-0000-000000000010';
    private static string $cssOrgId         = '40000000-0000-0000-0000-000000000001';

    private static string $osadProfileId    = 'd0000000-0000-0000-0001-000000000006';

    protected function tearDown(): void
    {
        parent::tearDown();
        $db = $this->db();
        $db->table('attendance_records')->like('id', 'test-', 'after')->delete();
        $db->table('attendance_sessions')->like('id', 'test-', 'after')->delete();
        $db->table('events')->like('id', 'test-', 'after')->delete();
        $db->table('profiles')->like('id', 'test-', 'after')->delete();
    }

    private function db(): BaseConnection
    {
        return Database::connect('default');
    }

    private function genUuid(string $prefix = 'test-'): string
    {
        return $prefix . bin2hex(random_bytes(8));
    }

    private function makeRequest(string $method, string $path, array $body = []): IncomingRequest
    {
        $config = new App();
        $uri = new URI('http://localhost' . $path);
        $userAgent = new UserAgent();

        $request = new IncomingRequest($config, $uri, null, $userAgent);
        $request->setMethod($method);
        $request->setHeader('Content-Type', 'application/json');
        $request->setHeader('Accept', 'application/json');

        if ($body !== []) {
            $request->setBody(json_encode($body));
        }

        return $request;
    }

    private function makeController(array $actor, array $moderatedOrgIds = [], ?callable $clock = null): AttendanceController
    {
        $authz = $this->createMock(AuthorizationService::class);
        $authz->method('resolveActor')->willReturn($actor);
        $authz->method('getModeratedOrganizationIds')->willReturn($moderatedOrgIds);

        $service = new AttendanceService(
            $this->db(),
            $authz,
            new AttendanceSessionModel($this->db()),
            new AttendanceRecordModel($this->db()),
            $clock
        );

        return new AttendanceController($authz, $service);
    }

    private function insertTestEvent(string $orgId, string $status = 'published', string $organizerProfileId = 'd0000000-0000-0000-0001-000000000010'): string
    {
        $eventId = $this->genUuid('test-ev-');
        $now = date('Y-m-d H:i:s');
        $this->db()->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => $organizerProfileId,
            'organization_id'      => $orgId,
            'title'                => 'Test Event ' . substr($eventId, -6),
            'description'          => 'Test Event Description',
            'event_type'           => 'general',
            'start_time'           => '2026-10-01 08:00:00',
            'end_time'             => '2026-10-01 17:00:00',
            'status'               => $status,
            'created_at'           => $now,
            'updated_at'           => $now,
        ]);
        return $eventId;
    }

    private function insertTestSession(
        string $eventId,
        string $status = 'scheduled',
        string $start = '2026-10-01 08:00:00',
        string $end = '2026-10-01 17:00:00'
    ): string {
        $sessionId = $this->genUuid('test-se-');
        $now = date('Y-m-d H:i:s');
        $this->db()->table('attendance_sessions')->insert([
            'id'             => $sessionId,
            'event_id'       => $eventId,
            'session_name'   => 'Morning Session',
            'session_type'   => 'morning',
            'check_in_start' => $start,
            'check_in_end'   => $end,
            'status'         => $status,
            'created_at'     => $now,
            'updated_at'     => $now,
        ]);
        return $sessionId;
    }

    private function insertTestStudent(
        string $institutionalId = 'TEST-2026-0001',
        string $accountType = 'student',
        string $status = 'active'
    ): string {
        $profileId = $this->genUuid('test-pr-');
        $now = date('Y-m-d H:i:s');
        $this->db()->table('profiles')->insert([
            'id'                => $profileId,
            'institutional_id'  => $institutionalId,
            'full_name'         => 'Test Student ' . substr($profileId, -4),
            'email'             => 'student.' . substr($profileId, -4) . '@example.com',
            'account_type'      => $accountType,
            'status'            => $status,
            'created_at'        => $now,
            'updated_at'        => $now,
        ]);
        return $profileId;
    }

    // =========================================================================
    // Phase 9 — Auth & Read Feature Tests
    // =========================================================================

    public function testUnauthenticatedRequestsRejected(): void
    {
        $res1 = $this->get('/api/v1/events/some-event-id/attendance-sessions');
        $res1->assertStatus(401);
        $res1->assertJSONFragment(['error' => ['code' => 'UNAUTHORIZED']]);

        $res2 = $this->post('/api/v1/events/some-event-id/attendance-sessions', ['session_name' => 'Session 1']);
        $res2->assertStatus(401);
        $res2->assertJSONFragment(['error' => ['code' => 'UNAUTHORIZED']]);

        $res3 = $this->get('/api/v1/attendance-sessions/some-session-id');
        $res3->assertStatus(401);
        $res3->assertJSONFragment(['error' => ['code' => 'UNAUTHORIZED']]);

        $res4 = $this->patch('/api/v1/attendance-sessions/some-session-id/status', ['status' => 'open']);
        $res4->assertStatus(401);
        $res4->assertJSONFragment(['error' => ['code' => 'UNAUTHORIZED']]);

        $res5 = $this->get('/api/v1/attendance-sessions/some-session-id/records');
        $res5->assertStatus(401);
        $res5->assertJSONFragment(['error' => ['code' => 'UNAUTHORIZED']]);

        $res6 = $this->post('/api/v1/attendance-sessions/some-session-id/check-in', ['identifier' => 'TEST-001']);
        $res6->assertStatus(401);
        $res6->assertJSONFragment(['error' => ['code' => 'UNAUTHORIZED']]);
    }

    public function testOrganizationModeratorListsOwnEventSessions(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/events/{$eventId}/attendance-sessions");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionsForEvent($eventId);
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertArrayHasKey('data', $body);
        $this->assertArrayHasKey('sessions', $body['data']);
        $this->assertCount(1, $body['data']['sessions']);
        $this->assertSame($sessionId, $body['data']['sessions'][0]['id']);
    }

    public function testOrganizationModeratorCrossOrgListRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$cssOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/events/{$eventId}/attendance-sessions");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionsForEvent($eventId);
        $this->assertSame(403, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code']);
    }

    public function testOsadListsSessionsGlobally(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $this->insertTestSession($eventId);

        $actor = [
            'profile' => ['id' => self::$osadProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'osad_staff'],
        ];

        $controller = $this->makeController($actor, []);
        $request = $this->makeRequest('GET', "/api/v1/events/{$eventId}/attendance-sessions");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionsForEvent($eventId);
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertCount(1, $body['data']['sessions']);
    }

    public function testGetOwnSessionSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->getSession($sessionId);
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame($sessionId, $body['data']['session']['id']);
        $this->assertArrayHasKey('record_count', $body['data']['session']);
        $this->assertSame(0, $body['data']['session']['record_count']);
    }

    public function testCrossOrgGetSessionRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$cssOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->getSession($sessionId);
        $this->assertSame(403, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code']);
    }

    // =========================================================================
    // Phase 10 — Create Session Feature Tests
    // =========================================================================

    public function testDraftEventCreateSessionSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'draft');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Plenary Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('Plenary Session', $body['data']['session']['session_name']);
        $this->assertSame('scheduled', $body['data']['session']['status']);
    }

    public function testPublishedEventCreateSessionSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Keynote Address',
            'session_type'   => 'morning',
            'check_in_start' => '2026-10-01 09:00:00',
            'check_in_end'   => '2026-10-01 11:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(201, $response->getStatusCode());
    }

    public function testOngoingEventCreateSessionSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'ongoing');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Afternoon Breakout',
            'session_type'   => 'breakout',
            'check_in_start' => '2026-10-01 13:00:00',
            'check_in_end'   => '2026-10-01 15:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(201, $response->getStatusCode());
    }

    public function testCompletedEventCreateSessionRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'completed');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Post Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('EVENT_COMPLETED', $body['error']['code']);
    }

    public function testCancelledEventCreateSessionRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'cancelled');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Cancelled Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('EVENT_CANCELLED', $body['error']['code']);
    }

    public function testClientCannotOverrideStatusOnCreate(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Status Override Attempt',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
            'status'         => 'open',
            'id'             => 'client-injected-id',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $sessionId = $body['data']['session']['id'];
        $this->assertNotSame('client-injected-id', $sessionId);
        $this->assertSame('scheduled', $body['data']['session']['status']);

        // Check DB row directly
        $row = $this->db()->table('attendance_sessions')->where('id', $sessionId)->get()->getRowArray();
        $this->assertSame('scheduled', $row['status']);
    }

    public function testInvalidSessionTypeRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Invalid Type Session',
            'session_type'   => 'unsupported_type',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_SESSION_TYPE', $body['error']['code']);
    }

    public function testInvalidTimeWindowRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Reversed Window Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 10:00:00',
            'check_in_end'   => '2026-10-01 08:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_CHECKIN_WINDOW', $body['error']['code']);
    }

    public function testCrossOrgCreateSessionRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$cssOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $payload = [
            'session_name'   => 'Cross Org Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(403, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code']);
    }

    public function testOsadCreateSessionSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');

        $actor = [
            'profile' => ['id' => self::$osadProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'osad_staff'],
        ];

        $controller = $this->makeController($actor, []);
        $payload = [
            'session_name'   => 'OSAD Created Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ];
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/attendance-sessions", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->createSession($eventId);
        $this->assertSame(201, $response->getStatusCode());
    }

    // =========================================================================
    // Phase 11 — Status Feature Tests
    // =========================================================================

    public function testScheduledToOpenSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'scheduled');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'open']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('open', $body['data']['session']['status']);
    }

    public function testOpenToClosedSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'closed']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(200, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('closed', $body['data']['session']['status']);
    }

    public function testDraftEventCannotOpenSession(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'draft');
        $sessionId = $this->insertTestSession($eventId, 'scheduled');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'open']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('CANNOT_OPEN_SESSION_FOR_INACTIVE_EVENT', $body['error']['code']);
    }

    public function testScheduledToClosedRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'scheduled');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'closed']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_STATUS_TRANSITION', $body['error']['code']);
    }

    public function testOpenToScheduledRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'scheduled']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_STATUS_TRANSITION', $body['error']['code']);
    }

    public function testClosedToOpenRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'closed');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'open']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('CLOSED_SESSION_IS_TERMINAL', $body['error']['code']);
    }

    public function testMalformedTargetStatusRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'scheduled');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/attendance-sessions/{$sessionId}/status", ['status' => 'arbitrary_status']);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->transitionSessionStatus($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_STATUS_TRANSITION', $body['error']['code']);
    }

    // =========================================================================
    // Phase 12 — Check-In Feature Tests
    // =========================================================================

    public function testQrScanValidCheckIn(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $studentId = $this->insertTestStudent('STU-2026-101');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = [
            'identifier'          => 'STU-2026-101',
            'verification_method' => 'qr_scan',
        ];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('STU-2026-101', $body['data']['record']['student_id']);
        $this->assertSame('qr_scan', $body['data']['record']['verification_method']);
        $this->assertSame(self::$modJpiaProfileId, $body['data']['record']['scanned_by']);
        $this->assertSame('2026-10-01 09:30:00', $body['data']['record']['checked_in_at']);
    }

    public function testManualValidCheckIn(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $studentId = $this->insertTestStudent('STU-2026-102');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = [
            'identifier'          => 'STU-2026-102',
            'verification_method' => 'manual',
        ];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('manual', $body['data']['record']['verification_method']);
    }

    public function testScannedByComesFromAuthenticatedActorAndCannotBeOverridden(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-103');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = [
            'identifier'          => 'STU-2026-103',
            'scanned_by'          => 'fraudulent-profile-id',
            'attendee_profile_id' => 'fraudulent-attendee-id',
            'checked_in_at'       => '1990-01-01 00:00:00',
            'id'                  => 'client-injected-record-id',
        ];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $recordId = $body['data']['record']['id'];
        $this->assertNotSame('client-injected-record-id', $recordId);
        $this->assertSame(self::$modJpiaProfileId, $body['data']['record']['scanned_by']);
        $this->assertSame('2026-10-01 09:30:00', $body['data']['record']['checked_in_at']);

        // Check DB row directly
        $row = $this->db()->table('attendance_records')->where('id', $recordId)->get()->getRowArray();
        $this->assertSame(self::$modJpiaProfileId, $row['scanned_by']);
        $this->assertStringStartsWith('2026-10-01 09:30:00', $row['checked_in_at']);
    }

    public function testScheduledSessionCheckInRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'scheduled', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-104');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'STU-2026-104'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('SESSION_NOT_OPEN', $body['error']['code']);
    }

    public function testClosedSessionCheckInRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'closed', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-105');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'STU-2026-105'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('SESSION_NOT_OPEN', $body['error']['code']);
    }

    public function testCompletedEventCheckInRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'completed');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-106');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'STU-2026-106'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('EVENT_NOT_ACTIVE', $body['error']['code']);
    }

    public function testCancelledEventCheckInRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'cancelled');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-107');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'STU-2026-107'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('EVENT_NOT_ACTIVE', $body['error']['code']);
    }

    public function testOutsideCheckInWindowRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-108');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        // Before start window
        $earlyClock = fn() => '2026-10-01 07:45:00';
        $controllerEarly = $this->makeController($actor, [self::$jpiaOrgId], $earlyClock);

        $payload = ['identifier' => 'STU-2026-108'];
        $requestEarly = $this->makeRequest('POST', "/api/v1/attendance-sessions/{{$sessionId}}/check-in", $payload);
        $controllerEarly->initController($requestEarly, service('response'), service('logger'));

        $respEarly = $controllerEarly->checkIn($sessionId);
        $this->assertSame(422, $respEarly->getStatusCode());
        $bodyEarly = json_decode($respEarly->getBody(), true);
        $this->assertSame('CHECKIN_WINDOW_NOT_STARTED', $bodyEarly['error']['code']);

        // After end window
        $lateClock = fn() => '2026-10-01 12:15:00';
        $controllerLate = $this->makeController($actor, [self::$jpiaOrgId], $lateClock);

        $requestLate = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controllerLate->initController($requestLate, service('response'), service('logger'));

        $respLate = $controllerLate->checkIn($sessionId);
        $this->assertSame(422, $respLate->getStatusCode());
        $bodyLate = json_decode($respLate->getBody(), true);
        $this->assertSame('CHECKIN_WINDOW_EXPIRED', $bodyLate['error']['code']);
    }

    public function testInactiveStudentCheckInRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-109', 'student', 'suspended');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'STU-2026-109'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('ATTENDEE_NOT_ELIGIBLE', $body['error']['code']);
    }

    public function testNonStudentCheckInRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('FAC-2026-110', 'personnel', 'active');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'FAC-2026-110'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('ATTENDEE_NOT_ELIGIBLE', $body['error']['code']);
    }

    public function testUnknownIdentifierCheckInReturns404(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'NON-EXISTENT-ID'];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(404, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('ATTENDEE_NOT_FOUND', $body['error']['code']);
    }

    public function testUnsupportedVerificationMethodRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $this->insertTestStudent('STU-2026-111');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = [
            'identifier'          => 'STU-2026-111',
            'verification_method' => 'self_checkin',
        ];
        $request = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->checkIn($sessionId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_VERIFICATION_METHOD', $body['error']['code']);
    }

    public function testDuplicateCheckInRejectedWith409AndCreatesNoSecondRecord(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open', '2026-10-01 08:00:00', '2026-10-01 12:00:00');
        $studentId = $this->insertTestStudent('STU-2026-112');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $clock = fn() => '2026-10-01 09:30:00';
        $controller = $this->makeController($actor, [self::$jpiaOrgId], $clock);

        $payload = ['identifier' => 'STU-2026-112', 'verification_method' => 'qr_scan'];

        // First check-in: 201
        $req1 = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($req1, service('response'), service('logger'));
        $resp1 = $controller->checkIn($sessionId);
        $this->assertSame(201, $resp1->getStatusCode());

        // Second check-in: 409
        $req2 = $this->makeRequest('POST', "/api/v1/attendance-sessions/{$sessionId}/check-in", $payload);
        $controller->initController($req2, service('response'), service('logger'));
        $resp2 = $controller->checkIn($sessionId);
        $this->assertSame(409, $resp2->getStatusCode());
        $body2 = json_decode($resp2->getBody(), true);
        $this->assertSame('ATTENDEE_ALREADY_CHECKED_IN', $body2['error']['code']);

        // Assert record count in database is strictly 1
        $count = $this->db()->table('attendance_records')
            ->where('session_id', $sessionId)
            ->where('attendee_profile_id', $studentId)
            ->countAllResults();
        $this->assertSame(1, $count);
    }

    // =========================================================================
    // Phase 13 — Record List Tests
    // =========================================================================

    public function testOwnOrgRecordsReadSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open');
        $studentId = $this->insertTestStudent('STU-2026-113');

        $recordId = $this->genUuid('test-rc-');
        $now = date('Y-m-d H:i:s');
        $this->db()->table('attendance_records')->insert([
            'id'                  => $recordId,
            'session_id'          => $sessionId,
            'attendee_profile_id' => $studentId,
            'scanned_by'          => self::$modJpiaProfileId,
            'checked_in_at'       => $now,
            'verification_method' => 'qr_scan',
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}/records");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionRecords($sessionId);
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertCount(1, $body['data']['records']);
        $this->assertSame($recordId, $body['data']['records'][0]['id']);
        $this->assertSame('STU-2026-113', $body['data']['records'][0]['institutional_id']);
    }

    public function testCrossOrgRecordsReadRejected(): void
    {
        $eventId = $this->insertTestEvent(self::$cssOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}/records");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionRecords($sessionId);
        $this->assertSame(403, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code']);
    }

    public function testOsadRecordsReadSucceeds(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open');

        $actor = [
            'profile' => ['id' => self::$osadProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'osad_staff'],
        ];

        $controller = $this->makeController($actor, []);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}/records");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionRecords($sessionId);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function testCompletedEventHistoricalRecordsReadable(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'completed');
        $sessionId = $this->insertTestSession($eventId, 'closed');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}/records");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionRecords($sessionId);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function testCancelledEventHistoricalRecordsReadable(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'cancelled');
        $sessionId = $this->insertTestSession($eventId, 'closed');

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}/records");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionRecords($sessionId);
        $this->assertSame(200, $response->getStatusCode());
    }

    public function testObviousSensitiveProfileAuthFieldsAreAbsent(): void
    {
        $eventId = $this->insertTestEvent(self::$jpiaOrgId, 'published');
        $sessionId = $this->insertTestSession($eventId, 'open');
        $studentId = $this->insertTestStudent('STU-2026-114');

        $recordId = $this->genUuid('test-rc-');
        $now = date('Y-m-d H:i:s');
        $this->db()->table('attendance_records')->insert([
            'id'                  => $recordId,
            'session_id'          => $sessionId,
            'attendee_profile_id' => $studentId,
            'scanned_by'          => self::$modJpiaProfileId,
            'checked_in_at'       => $now,
            'verification_method' => 'qr_scan',
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', "/api/v1/attendance-sessions/{$sessionId}/records");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->listSessionRecords($sessionId);
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $record = $body['data']['records'][0];

        $this->assertArrayNotHasKey('password_hash', $record);
        $this->assertArrayNotHasKey('salt', $record);
        $this->assertArrayNotHasKey('reset_hash', $record);
        $this->assertArrayNotHasKey('temporary_password', $record);
    }
}
