<?php

namespace Tests\Feature;

use App\Controllers\Api\EventController;
use App\Controllers\Api\EventVenueController;
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
final class AchievementAndEventEndpointTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    use FeatureTestTrait;

    private static string $modJpiaProfileId = 'd0000000-0000-0000-0001-000000000010';
    private static string $jpiaOrgId = 'd0000000-0000-0000-0002-000000000000';

    private static string $modCssProfileId = '10000000-0000-0000-0000-000000000010';
    private static string $cssOrgId = '40000000-0000-0000-0000-000000000001';

    private static string $osadProfileId = 'd0000000-0000-0000-0001-000000000006';

    protected function tearDown(): void
    {
        parent::tearDown();
        $this->db()->table('events')->like('id', 'test-', 'after')->delete();
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

    private function makeEventController(array $actor, array $moderatedOrgIds = []): EventController
    {
        $authz = $this->createMock(AuthorizationService::class);
        $authz->method('resolveActor')->willReturn($actor);
        $authz->method('getModeratedOrganizationIds')->willReturn($moderatedOrgIds);

        return new EventController($authz, $this->db());
    }

    private function makeVenueController(array $actor): EventVenueController
    {
        $authz = $this->createMock(AuthorizationService::class);
        $authz->method('resolveActor')->willReturn($actor);

        return new EventVenueController($authz, $this->db());
    }

    // =========================================================================
    // Unauthenticated Baseline Tests (HTTP 401 via FeatureTestTrait)
    // =========================================================================

    public function testListAchievementsRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/achievements');
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    public function testCreateAchievementRouteIsRemoved(): void
    {
        // Step 3: submissions must go draft -> evidence -> /portfolio/{id}/resubmit.
        // FeatureTestTrait surfaces an unrouted request as PageNotFoundException (HTTP 404).
        $this->expectException(\CodeIgniter\Exceptions\PageNotFoundException::class);
        $this->post('/api/v1/achievements', ['title' => 'First Place Hackathon']);
    }

    public function testVerificationQueueRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/verification/queue');
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    public function testVerificationDecisionRouteIsRemoved(): void
    {
        // Step 3: decisions go through /portfolio/{id}/verify|request-revision|reject only.
        // FeatureTestTrait surfaces an unrouted request as PageNotFoundException (HTTP 404).
        $this->expectException(\CodeIgniter\Exceptions\PageNotFoundException::class);
        $this->post('/api/v1/verification/req_123/decide', ['decision' => 'approved']);
    }

    public function testListEventsRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/events');
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    public function testCreateEventRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/events', ['title' => 'Annual CSD Tech Summit']);
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    public function testUpdateEventRequiresAuthorization(): void
    {
        $result = $this->patch('/api/v1/events/event_123', ['title' => 'Updated Event Title']);
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    public function testCancelEventRequiresAuthorization(): void
    {
        $result = $this->post('/api/v1/events/event_123/cancel');
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    public function testListEventVenuesRequiresAuthorization(): void
    {
        $result = $this->get('/api/v1/event-venues');
        $result->assertStatus(401);
        $result->assertJSONFragment([
            'error' => ['code' => 'UNAUTHORIZED'],
        ]);
    }

    // =========================================================================
    // R3 Step 2C Venue Governance & Active Registry Tests
    // =========================================================================

    public function testListEventVenuesReturnsActiveVenuesInDeterministicOrder(): void
    {
        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeVenueController($actor);
        $request = $this->makeRequest('GET', '/api/v1/event-venues');
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->index();
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $venues = $body['data']['venues'] ?? [];

        $this->assertGreaterThanOrEqual(6, count($venues));
        $this->assertSame('BRC Convention Hall', $venues[0]['name']);
        $this->assertSame(1, (int) $venues[0]['sort_order']);
        $this->assertSame('BRC Dining Hall', $venues[1]['name']);
        $this->assertSame(2, (int) $venues[1]['sort_order']);
        $this->assertSame('SMC Hall', $venues[2]['name']);
        $this->assertSame(3, (int) $venues[2]['sort_order']);
        $this->assertSame('Teston Building', $venues[3]['name']);
        $this->assertSame(4, (int) $venues[3]['sort_order']);
        $this->assertSame('Reviewing Stand', $venues[4]['name']);
        $this->assertSame(5, (int) $venues[4]['sort_order']);
        $this->assertSame('NDMU Gymnasium', $venues[5]['name']);
        $this->assertSame(6, (int) $venues[5]['sort_order']);
    }

    // =========================================================================
    // R3 Step 2C Event Creation Authority & Venue Resolution Tests
    // =========================================================================

    public function testModeratorCreatesEventWithServerDerivedOrganizationAndVenue(): void
    {
        $db = $this->db();
        $gymVenue = $db->table('event_venues')->where('name', 'NDMU Gymnasium')->get()->getRowArray();
        $this->assertNotNull($gymVenue);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $payload = [
            'title'       => 'JPIA Test Accounting Seminar',
            'description' => 'Test description',
            'event_type'  => 'Seminar',
            'start_time'  => '2026-11-01 09:00:00',
            'end_time'    => '2026-11-01 12:00:00',
            'venue_id'    => $gymVenue['id'],
        ];

        $request = $this->makeRequest('POST', '/api/v1/events', $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->create();
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $eventId = $body['data']['id'] ?? null;
        $this->assertNotEmpty($eventId);

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertNotNull($row);
        $this->assertSame(self::$jpiaOrgId, $row['organization_id']);
        $this->assertSame(self::$modJpiaProfileId, $row['organizer_profile_id']);
        $this->assertSame('published', $row['status']);
        $this->assertSame($gymVenue['id'], $row['venue_id']);
        $this->assertSame('NDMU Gymnasium', $row['venue']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testCreateEventRejectsUnknownVenueId(): void
    {
        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $payload = [
            'title'      => 'Invalid Venue Event',
            'event_type' => 'Workshop',
            'start_time' => '2026-11-01 09:00:00',
            'end_time'   => '2026-11-01 12:00:00',
            'venue_id'   => 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        ];

        $request = $this->makeRequest('POST', '/api/v1/events', $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->create();
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_VENUE', $body['error']['code'] ?? null);
    }

    public function testCreateEventRejectsArbitraryVenueText(): void
    {
        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $payload = [
            'title'      => 'Arbitrary Venue Event',
            'event_type' => 'Workshop',
            'start_time' => '2026-11-01 09:00:00',
            'end_time'   => '2026-11-01 12:00:00',
            'venue'      => 'Random Coffee Shop',
        ];

        $request = $this->makeRequest('POST', '/api/v1/events', $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->create();
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('INVALID_VENUE', $body['error']['code'] ?? null);
    }

    public function testCreateEventAcceptsLegacyCanonicalVenueTextAndResolvesVenueId(): void
    {
        $db = $this->db();
        $smcVenue = $db->table('event_venues')->where('name', 'SMC Hall')->get()->getRowArray();
        $this->assertNotNull($smcVenue);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $payload = [
            'title'      => 'Legacy Venue Text Event',
            'event_type' => 'Workshop',
            'start_time' => '2026-11-01 09:00:00',
            'end_time'   => '2026-11-01 12:00:00',
            'venue'      => '  smc hall  ',
        ];

        $request = $this->makeRequest('POST', '/api/v1/events', $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->create();
        $this->assertSame(201, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $eventId = $body['data']['id'] ?? null;
        $this->assertNotEmpty($eventId);

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame($smcVenue['id'], $row['venue_id']);
        $this->assertSame('SMC Hall', $row['venue']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testCreateEventRejectsConflictingVenueIdAndVenueText(): void
    {
        $db = $this->db();
        $gymVenue = $db->table('event_venues')->where('name', 'NDMU Gymnasium')->get()->getRowArray();

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $payload = [
            'title'      => 'Conflicting Venue Event',
            'event_type' => 'Workshop',
            'start_time' => '2026-11-01 09:00:00',
            'end_time'   => '2026-11-01 12:00:00',
            'venue_id'   => $gymVenue['id'],
            'venue'      => 'BRC Convention Hall',
        ];

        $request = $this->makeRequest('POST', '/api/v1/events', $payload);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->create();
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('VENUE_CONFLICT', $body['error']['code'] ?? null);
    }

    // =========================================================================
    // R3 Step 2C PATCH Authority Tests (Status & Org Immutability)
    // =========================================================================

    public function testGenericPatchRejectsStatusMutation(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => self::$jpiaOrgId,
            'title'                => 'Status Test Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'status' => 'completed',
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('STATUS_MUTATION_FORBIDDEN', $body['error']['code'] ?? null);

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('published', $row['status']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testGenericPatchRejectsOrganizationReassignment(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => self::$jpiaOrgId,
            'title'                => 'Org Reassign Test Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'organization_id' => self::$cssOrgId,
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(422, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('ORGANIZATION_IMMUTABLE', $body['error']['code'] ?? null);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testGenericPatchUpdatesVenueAndSnapshot(): void
    {
        $db = $this->db();
        $gymVenue = $db->table('event_venues')->where('name', 'NDMU Gymnasium')->get()->getRowArray();
        $brcVenue = $db->table('event_venues')->where('name', 'BRC Convention Hall')->get()->getRowArray();

        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => self::$jpiaOrgId,
            'title'                => 'Initial Venue Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'venue'                => 'NDMU Gymnasium',
            'venue_id'             => $gymVenue['id'],
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'title'    => 'Updated Venue Event',
            'venue_id' => $brcVenue['id'],
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(200, $response->getStatusCode());

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('Updated Venue Event', $row['title']);
        $this->assertSame($brcVenue['id'], $row['venue_id']);
        $this->assertSame('BRC Convention Hall', $row['venue']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    // =========================================================================
    // R3 Step 2C Cross-Organization Boundary & Scope Security Tests
    // =========================================================================

    public function testModeratorCannotUpdateAnotherOrganizationsEvent(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modCssProfileId,
            'organization_id'      => self::$cssOrgId,
            'title'                => 'CSS Official Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        // Moderator JPIA attempts update
        $actorJpia = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actorJpia, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'title' => 'Malicious JPIA Modification',
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(403, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code'] ?? null);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testModeratorCannotCancelAnotherOrganizationsEvent(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modCssProfileId,
            'organization_id'      => self::$cssOrgId,
            'title'                => 'CSS Official Event 2',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actorJpia = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actorJpia, [self::$jpiaOrgId]);
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/cancel");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->cancel($eventId);
        $this->assertSame(403, $response->getStatusCode());
        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code'] ?? null);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testDedicatedCancelSucceedsForOwnedEvent(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => self::$jpiaOrgId,
            'title'                => 'JPIA Owned Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/cancel");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->cancel($eventId);
        $this->assertSame(200, $response->getStatusCode());

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('cancelled', $row['status']);

        // Idempotent cancel
        $response2 = $controller->cancel($eventId);
        $this->assertSame(200, $response2->getStatusCode());

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testModeratorEventListIsScopedToModeratedOrganization(): void
    {
        $db = $this->db();
        $jpiaEventId = $this->genUuid();
        $cssEventId = $this->genUuid();

        $db->table('events')->insert([
            'id'                   => $jpiaEventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => self::$jpiaOrgId,
            'title'                => 'JPIA Listed Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $db->table('events')->insert([
            'id'                   => $cssEventId,
            'organizer_profile_id' => self::$modCssProfileId,
            'organization_id'      => self::$cssOrgId,
            'title'                => 'CSS Listed Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('GET', '/api/v1/events');
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->index();
        $this->assertSame(200, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $listedIds = array_column($body['data']['events'] ?? [], 'id');

        $this->assertContains($jpiaEventId, $listedIds);
        $this->assertNotContains($cssEventId, $listedIds);

        $db->table('events')->whereIn('id', [$jpiaEventId, $cssEventId])->delete();
    }

    // =========================================================================
    // R3 Step 2C-A — Remove Legacy NULL-Organization Creator Fallback Tests
    // =========================================================================

    public function testModeratorCanUpdateEventInTheirOrganization(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => self::$jpiaOrgId,
            'title'                => 'JPIA Original Title',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'title' => 'JPIA Updated Title',
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(200, $response->getStatusCode());

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('JPIA Updated Title', $row['title']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testModeratorCannotUpdateLegacyNullOrganizationEventEvenIfCreator(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => null,
            'title'                => 'Legacy Null-Org Event',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'title' => 'Attempted Moderator Update on Null Org',
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(403, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code'] ?? null);

        // Verify DB unchanged
        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('Legacy Null-Org Event', $row['title']);
        $this->assertNull($row['organization_id']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testModeratorCannotCancelLegacyNullOrganizationEventEvenIfCreator(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => null,
            'title'                => 'Legacy Null-Org Event For Cancel',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/cancel");
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->cancel($eventId);
        $this->assertSame(403, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code'] ?? null);

        // Verify DB unchanged
        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('published', $row['status']);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testModeratorCannotAddParticipantsToLegacyNullOrganizationEventEvenIfCreator(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => null,
            'title'                => 'Legacy Null-Org Event For Participants',
            'event_type'           => 'Workshop',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actor = [
            'profile' => ['id' => self::$modJpiaProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'organization_moderator'],
        ];

        $controller = $this->makeEventController($actor, [self::$jpiaOrgId]);
        $request = $this->makeRequest('POST', "/api/v1/events/{$eventId}/participants", [
            'participants' => [
                ['student_id' => '12345678', 'role' => 'Attendee'],
            ],
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->addParticipants($eventId);
        $this->assertSame(403, $response->getStatusCode());

        $body = json_decode($response->getBody(), true);
        $this->assertSame('FORBIDDEN', $body['error']['code'] ?? null);

        $db->table('events')->where('id', $eventId)->delete();
    }

    public function testOsadStaffCanManageLegacyNullOrganizationEvent(): void
    {
        $db = $this->db();
        $eventId = $this->genUuid();
        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => self::$modJpiaProfileId,
            'organization_id'      => null,
            'title'                => 'Legacy Null-Org Event For OSAD',
            'event_type'           => 'Institutional',
            'start_time'           => '2026-11-01 09:00:00',
            'end_time'             => '2026-11-01 12:00:00',
            'status'               => 'published',
            'created_at'           => date('Y-m-d H:i:s'),
            'updated_at'           => date('Y-m-d H:i:s'),
        ]);

        $actorOsad = [
            'profile' => ['id' => self::$osadProfileId, 'status' => 'active'],
            'roles'   => ['personnel', 'osad_staff'],
        ];

        $controller = $this->makeEventController($actorOsad, []);
        $request = $this->makeRequest('PATCH', "/api/v1/events/{$eventId}", [
            'title' => 'OSAD Managed Title',
        ]);
        $controller->initController($request, service('response'), service('logger'));

        $response = $controller->update($eventId);
        $this->assertSame(200, $response->getStatusCode());

        $row = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        $this->assertSame('OSAD Managed Title', $row['title']);

        $db->table('events')->where('id', $eventId)->delete();
    }
}
