<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use App\Services\EventSourceRecordBridgeService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use CodeIgniter\Database\BaseConnection;
use Throwable;

class EventController extends Controller
{
    use ResponseTrait;

    private const ORGANIZER_ROLES = [
        'organization_moderator',
        'program_coordinator',
        'dean',
        'osad_staff',
        'hr_staff',
    ];

    protected AuthorizationService $authz;
    protected ?BaseConnection $db;

    public function __construct(?AuthorizationService $authz = null, ?BaseConnection $db = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
        $this->db = $db;
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function getDb(): BaseConnection
    {
        return $this->db ?? db_connect('default');
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    private function hasOrganizerRole(array $actor): bool
    {
        return count(
            array_intersect(
                self::ORGANIZER_ROLES,
                $actor['roles'] ?? []
            )
        ) > 0;
    }

    /**
     * Determines whether the authenticated actor has authority to manage the given event.
     */
    private function canManageEvent(array $actor, array $event): bool
    {
        $roles = $actor['roles'] ?? [];

        // OSAD staff have global authority over institutional and organization events
        if (in_array('osad_staff', $roles, true)) {
            return true;
        }

        // Organization Moderator authority is bound to their moderated organizations
        if (in_array('organization_moderator', $roles, true)) {
            if (empty($event['organization_id'])) {
                return false;
            }
            $modOrgIds = $this->authz->getModeratedOrganizationIds($actor);
            return in_array((string) $event['organization_id'], $modOrgIds, true);
        }

        // Other organizer roles (dean, program_coordinator, hr_staff): check creator profile
        return ($event['organizer_profile_id'] ?? '') === ($actor['profile']['id'] ?? '');
    }

    /**
     * Resolves venue selection against active canonical event_venues registry.
     */
    private function resolveVenueSelection(?string $venueId, ?string $venueText, ?array $currentEvent = null): array
    {
        $venueId = ($venueId !== null && trim($venueId) !== '') ? trim($venueId) : null;
        $venueText = ($venueText !== null && trim($venueText) !== '') ? trim($venueText) : null;

        // If both omitted on update, preserve current values
        if ($venueId === null && $venueText === null) {
            if ($currentEvent !== null) {
                return [
                    'success'  => true,
                    'venue_id' => $currentEvent['venue_id'] ?? null,
                    'venue'    => $currentEvent['venue'] ?? null,
                ];
            }
            return [
                'success'  => true,
                'venue_id' => null,
                'venue'    => null,
            ];
        }

        $db = $this->getDb();

        // Case 1: Both venue_id and venueText provided
        if ($venueId !== null && $venueText !== null) {
            $byId = $db->table('event_venues')->where('id', $venueId)->get()->getRowArray();
            if ($byId === null) {
                return [
                    'success' => false,
                    'code'    => 'INVALID_VENUE',
                    'message' => 'The selected venue was not found.',
                ];
            }

            $byName = $db->table('event_venues')->where('LOWER(TRIM(name))', strtolower($venueText))->get()->getRowArray();
            if ($byName === null || $byName['id'] !== $byId['id']) {
                return [
                    'success' => false,
                    'code'    => 'VENUE_CONFLICT',
                    'message' => 'Supplied venue ID and venue name do not match.',
                ];
            }

            if ((int) $byId['is_active'] !== 1 && ($currentEvent === null || ($currentEvent['venue_id'] ?? '') !== $byId['id'])) {
                return [
                    'success' => false,
                    'code'    => 'INACTIVE_VENUE',
                    'message' => 'Selected venue is currently inactive.',
                ];
            }

            return [
                'success'  => true,
                'venue_id' => $byId['id'],
                'venue'    => $byId['name'],
            ];
        }

        // Case 2: Only venue_id provided
        if ($venueId !== null) {
            $byId = $db->table('event_venues')->where('id', $venueId)->get()->getRowArray();
            if ($byId === null) {
                return [
                    'success' => false,
                    'code'    => 'INVALID_VENUE',
                    'message' => 'The selected venue was not found.',
                ];
            }

            if ((int) $byId['is_active'] !== 1 && ($currentEvent === null || ($currentEvent['venue_id'] ?? '') !== $byId['id'])) {
                return [
                    'success' => false,
                    'code'    => 'INACTIVE_VENUE',
                    'message' => 'Selected venue is currently inactive.',
                ];
            }

            return [
                'success'  => true,
                'venue_id' => $byId['id'],
                'venue'    => $byId['name'],
            ];
        }

        // Case 3: Only venueText provided (transitional legacy compatibility)
        $byName = $db->table('event_venues')->where('LOWER(TRIM(name))', strtolower($venueText))->get()->getRowArray();
        if ($byName === null) {
            return [
                'success' => false,
                'code'    => 'INVALID_VENUE',
                'message' => 'Venue not recognized. Please select a valid official venue.',
            ];
        }

        if ((int) $byName['is_active'] !== 1 && ($currentEvent === null || ($currentEvent['venue_id'] ?? '') !== $byName['id'])) {
            return [
                'success' => false,
                'code'    => 'INACTIVE_VENUE',
                'message' => 'Selected venue is currently inactive.',
            ];
        }

        return [
            'success'  => true,
            'venue_id' => $byName['id'],
            'venue'    => $byName['name'],
        ];
    }

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    /**
     * GET /api/v1/events
     */
    public function index()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $db = $this->getDb();
        $roles = $actor['roles'] ?? [];

        $eventSelect = 'e.*, p.full_name AS organizer_name, o.name AS organization_name, o.code AS organization_code,
            (SELECT COUNT(DISTINCT ar.attendee_profile_id)
             FROM attendance_records ar
             INNER JOIN attendance_sessions ats ON ats.id = ar.session_id
             WHERE ats.event_id = e.id) AS participants_count';

        // Organization Moderator without OSAD/global admin role is scoped to their moderated organizations
        if (in_array('organization_moderator', $roles, true) && ! in_array('osad_staff', $roles, true)) {
            $modOrgIds = $this->authz->getModeratedOrganizationIds($actor);
            $builder = $db->table('events e')
                ->select($eventSelect, false)
                ->join('profiles p', 'p.id = e.organizer_profile_id', 'left')
                ->join('organizations o', 'o.id = e.organization_id', 'left');

            if (! empty($modOrgIds)) {
                $builder->whereIn('e.organization_id', $modOrgIds);
            } else {
                $builder->where('1 = 0', null, false);
            }

            $events = $builder->orderBy('e.start_time', 'DESC')->get()->getResultArray();
        } else {
            // Unscoped listing for global roles (OSAD, etc.)
            $events = $db->table('events e')
                ->select($eventSelect, false)
                ->join('profiles p', 'p.id = e.organizer_profile_id', 'left')
                ->join('organizations o', 'o.id = e.organization_id', 'left')
                ->orderBy('e.start_time', 'DESC')
                ->get()
                ->getResultArray();
        }

        return $this->respond([
            'data' => [
                'events' => $events,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/events
     */
    public function create()
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (! $this->hasOrganizerRole($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized organizer role required to create official events.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $title = trim((string) ($json['title'] ?? ''));
        $description = trim((string) ($json['description'] ?? ''));
        $eventType = trim((string) ($json['event_type'] ?? $json['category'] ?? 'institutional'));
        $osadTemplateId = isset($json['osad_template_id']) && trim((string) $json['osad_template_id']) !== ''
            ? substr(trim((string) $json['osad_template_id']), 0, 32)
            : null;
        $startTime = ! empty($json['start_time']) ? trim((string) $json['start_time']) : (! empty($json['event_date']) ? trim((string) $json['event_date']) . ' 08:00:00' : date('Y-m-d H:i:s'));
        $endTime = ! empty($json['end_time']) ? trim((string) $json['end_time']) : (! empty($json['event_date']) ? trim((string) $json['event_date']) . ' 17:00:00' : date('Y-m-d H:i:s', time() + 3600 * 4));

        if ($title === '') {
            return $this->respond(['error' => ['code' => 'MISSING_TITLE', 'message' => 'Event title is required.']], 422);
        }
        if (empty($json['start_time']) && empty($json['event_date'])) {
            return $this->respond(['error' => ['code' => 'MISSING_EVENT_SCHEDULE', 'message' => 'Enter the event start and end date and time.']], 422);
        }
        if ($fieldError = $this->eventFieldError($title, $description, $eventType)) {
            return $this->respond(['error' => $fieldError], 422);
        }

        $startTimestamp = strtotime($startTime);
        $endTimestamp = strtotime($endTime);

        if (
            $startTimestamp === false
            || $endTimestamp === false
            || $endTimestamp <= $startTimestamp
        ) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_EVENT_WINDOW',
                    'message' => 'Event end time must be later than its start time.',
                ],
            ], 422);
        }

        if ($startTimestamp <= time()) {
            return $this->respond([
                'error' => [
                    'code'    => 'EVENT_START_IN_PAST',
                    'message' => 'Event start date and time must be in the future.',
                ],
            ], 422);
        }

        // Derive organization ownership
        $organizationId = null;
        $roles = $actor['roles'] ?? [];

        if (in_array('organization_moderator', $roles, true)) {
            $modOrgIds = $this->authz->getModeratedOrganizationIds($actor);
            if (empty($modOrgIds)) {
                return $this->respond([
                    'error' => [
                        'code'    => 'FORBIDDEN',
                        'message' => 'No active moderated organization assigned to this account.',
                    ],
                ], 403);
            }

            if (! empty($json['organization_id'])) {
                if (! in_array((string) $json['organization_id'], $modOrgIds, true)) {
                    return $this->respond([
                        'error' => [
                            'code'    => 'FORBIDDEN',
                            'message' => 'You do not have permission to create events for the requested organization.',
                        ],
                    ], 403);
                }
                $organizationId = (string) $json['organization_id'];
            } else {
                $organizationId = $modOrgIds[0];
            }
        } elseif (in_array('osad_staff', $roles, true)) {
            if (! empty($json['organization_id'])) {
                $organizationId = (string) $json['organization_id'];
            }
        }

        if ($this->findDuplicateEvent($organizationId, (string) $actor['profile']['id'], $title, date('Y-m-d', $startTimestamp)) !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_EVENT', 'message' => 'An event with this title already exists on that date. Edit the existing event instead.']], 409);
        }

        // Resolve venue against canonical event_venues registry
        $venueRes = $this->resolveVenueSelection($json['venue_id'] ?? null, $json['venue'] ?? null);
        if (! $venueRes['success']) {
            return $this->respond([
                'error' => [
                    'code'    => $venueRes['code'],
                    'message' => $venueRes['message'],
                ],
            ], 422);
        }

        $db = $this->getDb();
        $eventId = $this->genUuid();
        $now = date('Y-m-d H:i:s');

        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => $actor['profile']['id'],
            'organization_id'      => $organizationId,
            'title'                => $title,
            'description'          => $description !== '' ? $description : null,
            'event_type'           => $eventType,
            'osad_template_id'     => $osadTemplateId,
            'start_time'           => $startTime,
            'end_time'             => $endTime,
            'venue'                => $venueRes['venue'],
            'venue_id'             => $venueRes['venue_id'],
            'status'               => 'published',
            'created_at'           => $now,
            'updated_at'           => $now,
        ]);

        return $this->respondCreated([
            'data' => [
                'message'         => 'Official event created successfully.',
                'id'              => $eventId,
                'title'           => $title,
                'start_time'      => $startTime,
                'venue'           => $venueRes['venue'],
                'venue_id'        => $venueRes['venue_id'],
                'organization_id' => $organizationId,
                'status'          => 'published',
                'osad_template_id' => $osadTemplateId,
            ],
        ]);
    }

    /**
     * PATCH /api/v1/events/{id}
     */
    public function update(string $eventId)
    {
        $actor = $this->resolveActor();

        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid active authenticated session required.',
                ],
            ], 401);
        }

        if (! $this->hasOrganizerRole($actor)) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Authorized organizer role required to update official events.',
                ],
            ], 403);
        }

        $db = $this->getDb();

        $event = $db->table('events')
            ->where('id', $eventId)
            ->get()
            ->getRowArray();

        if ($event === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'EVENT_NOT_FOUND',
                    'message' => 'Event not found.',
                ],
            ], 404);
        }

        if (! $this->canManageEvent($actor, $event)) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'You do not have permission to manage this event.',
                ],
            ], 403);
        }

        $json = $this->request->getJSON(true) ?? [];

        // Reject status modification through generic PATCH
        if (array_key_exists('status', $json)) {
            return $this->respond([
                'error' => [
                    'code'    => 'STATUS_MUTATION_FORBIDDEN',
                    'message' => 'Event lifecycle status cannot be modified via generic update. Use dedicated lifecycle endpoints such as /events/{id}/cancel.',
                ],
            ], 422);
        }

        // Reject organization reassignment through generic PATCH
        if (array_key_exists('organization_id', $json) && (string) $json['organization_id'] !== (string) ($event['organization_id'] ?? '')) {
            return $this->respond([
                'error' => [
                    'code'    => 'ORGANIZATION_IMMUTABLE',
                    'message' => 'Event organization ownership cannot be modified through generic update.',
                ],
            ], 422);
        }

        // Reject organizer profile reassignment through generic PATCH
        if (array_key_exists('organizer_profile_id', $json) && (string) $json['organizer_profile_id'] !== (string) ($event['organizer_profile_id'] ?? '')) {
            return $this->respond([
                'error' => [
                    'code'    => 'ORGANIZER_IMMUTABLE',
                    'message' => 'Event organizer profile cannot be modified through generic update.',
                ],
            ], 422);
        }

        $allowedFields = [
            'title',
            'description',
            'event_type',
            'osad_template_id',
            'start_time',
            'end_time',
        ];

        $updates = [];

        foreach ($allowedFields as $field) {
            if (array_key_exists($field, $json)) {
                $updates[$field] = is_string($json[$field])
                    ? trim($json[$field])
                    : $json[$field];
            }
        }

        // Handle venue modification
        if (array_key_exists('venue_id', $json) || array_key_exists('venue', $json)) {
            $venueRes = $this->resolveVenueSelection($json['venue_id'] ?? null, $json['venue'] ?? null, $event);
            if (! $venueRes['success']) {
                return $this->respond([
                    'error' => [
                        'code'    => $venueRes['code'],
                        'message' => $venueRes['message'],
                    ],
                ], 422);
            }
            $updates['venue_id'] = $venueRes['venue_id'];
            $updates['venue'] = $venueRes['venue'];
        }

        if ($updates === []) {
            return $this->respond([
                'error' => [
                    'code'    => 'NO_EVENT_CHANGES',
                    'message' => 'No supported Event fields were supplied.',
                ],
            ], 422);
        }

        if (
            array_key_exists('title', $updates)
            && $updates['title'] === ''
        ) {
            return $this->respond([
                'error' => [
                    'code'    => 'MISSING_TITLE',
                    'message' => 'Event title cannot be empty.',
                ],
            ], 422);
        }

        if ($fieldError = $this->eventFieldError((string) ($updates['title'] ?? $event['title'] ?? ''), (string) ($updates['description'] ?? ''), (string) ($updates['event_type'] ?? $event['event_type'] ?? ''))) {
            return $this->respond(['error' => $fieldError], 422);
        }

        $finalStart = (string) (
            $updates['start_time'] ?? $event['start_time']
        );

        $finalEnd = (string) (
            $updates['end_time'] ?? $event['end_time']
        );

        $startTimestamp = strtotime($finalStart);
        $endTimestamp = strtotime($finalEnd);

        if (
            $startTimestamp === false
            || $endTimestamp === false
            || $endTimestamp <= $startTimestamp
        ) {
            return $this->respond([
                'error' => [
                    'code'    => 'INVALID_EVENT_WINDOW',
                    'message' => 'Event end time must be later than its start time.',
                ],
            ], 422);
        }

        if ((array_key_exists('title', $updates) || array_key_exists('start_time', $updates))
            && $this->findDuplicateEvent($event['organization_id'] ?? null, (string) ($event['organizer_profile_id'] ?? ''), (string) ($updates['title'] ?? $event['title']), date('Y-m-d', $startTimestamp), $eventId) !== null) {
            return $this->respond(['error' => ['code' => 'DUPLICATE_EVENT', 'message' => 'An event with this title already exists on that date. Edit the existing event instead.']], 409);
        }

        if (
            array_key_exists('description', $updates)
            && $updates['description'] === ''
        ) {
            $updates['description'] = null;
        }

        $updates['updated_at'] = date('Y-m-d H:i:s');

        $db->table('events')
            ->where('id', $eventId)
            ->update($updates);

        $updatedEvent = $db->table('events')
            ->where('id', $eventId)
            ->get()
            ->getRowArray();

        return $this->respond([
            'data' => [
                'message' => 'Official event updated successfully.',
                'event'   => $updatedEvent,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/events/{id}/cancel
     */
    public function cancel(string $eventId)
    {
        $actor = $this->resolveActor();

        if ($actor === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'UNAUTHORIZED',
                    'message' => 'Valid active authenticated session required.',
                ],
            ], 401);
        }

        if (! $this->hasOrganizerRole($actor)) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'Authorized organizer role required to cancel official events.',
                ],
            ], 403);
        }

        $db = $this->getDb();

        $event = $db->table('events')
            ->where('id', $eventId)
            ->get()
            ->getRowArray();

        if ($event === null) {
            return $this->respond([
                'error' => [
                    'code'    => 'EVENT_NOT_FOUND',
                    'message' => 'Event not found.',
                ],
            ], 404);
        }

        if (! $this->canManageEvent($actor, $event)) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'You do not have permission to cancel this event.',
                ],
            ], 403);
        }

        if (($event['status'] ?? null) === 'cancelled') {
            return $this->respond([
                'data' => [
                    'message' => 'Official event is already cancelled.',
                    'event'   => $event,
                ],
            ], 200);
        }

        $db->table('events')
            ->where('id', $eventId)
            ->update([
                'status'     => 'cancelled',
                'updated_at' => date('Y-m-d H:i:s'),
            ]);

        $cancelledEvent = $db->table('events')
            ->where('id', $eventId)
            ->get()
            ->getRowArray();

        return $this->respond([
            'data' => [
                'message' => 'Official event cancelled successfully.',
                'event'   => $cancelledEvent,
            ],
        ], 200);
    }

    /**
     * POST /api/v1/events/{id}/participants
     */
    public function addParticipants(string $eventId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        if (! $this->hasOrganizerRole($actor)) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized organizer role required.']], 403);
        }

        $db = $this->getDb();
        $event = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        if ($event === null) {
            return $this->respond(['error' => ['code' => 'EVENT_NOT_FOUND', 'message' => 'Event not found.']], 404);
        }

        if (! $this->canManageEvent($actor, $event)) {
            return $this->respond([
                'error' => [
                    'code'    => 'FORBIDDEN',
                    'message' => 'You do not have permission to record participant facts for this event.',
                ],
            ], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $participants = (array) ($json['participants'] ?? []);

        if (empty($participants)) {
            return $this->respond(['error' => ['code' => 'EMPTY_PARTICIPANTS', 'message' => 'At least one participant required.']], 422);
        }

        try {
            $results = (new EventSourceRecordBridgeService($db))->recordFacts($eventId, $participants, $actor['profile']['id']);
        } catch (Throwable $e) {
            $code = $e->getMessage() === 'EVENT_SOURCE_RECORD_BRIDGE_SCHEMA_MISSING' ? $e->getMessage() : 'BATCH_FAILED';
            return $this->respond(['error' => ['code' => $code, 'message' => 'Failed to record finalized participant facts.']], $code === 'BATCH_FAILED' ? 500 : 503);
        }

        return $this->respondCreated([
            'data' => [
                'message'            => 'Student-specific event facts recorded. Canonical source records require explicit bridge resolution.',
                'event_id'           => $eventId,
                'participants_count' => count($results),
                'results'            => $results,
            ],
        ]);
    }

    /** Event text fields fit the system's limits (pre-final defense OM-1). Null when valid. */
    private function eventFieldError(string $title, string $description, string $eventType): ?array
    {
        $title = trim($title);
        if (mb_strlen($title) < 3 || mb_strlen($title) > 150) return ['code' => 'INVALID_EVENT_TITLE', 'message' => 'Event title must be 3 to 150 characters.'];
        if (preg_match('/[\x00-\x1F\x7F]/u', $title) === 1) return ['code' => 'INVALID_EVENT_TITLE', 'message' => 'Event title contains invalid characters.'];
        if (mb_strlen(trim($description)) > 2000) return ['code' => 'INVALID_EVENT_DESCRIPTION', 'message' => 'Event description must not exceed 2,000 characters.'];
        if (mb_strlen(trim($eventType)) > 50) return ['code' => 'INVALID_EVENT_TYPE', 'message' => 'Event type is too long.'];
        return null;
    }

    /**
     * Same event created twice: same organization (or the same organizer when there is none), same title
     * ignoring case and spacing, same start date, not cancelled.
     */
    private function findDuplicateEvent(?string $organizationId, string $organizerProfileId, string $title, string $startDate, ?string $excludeId = null): ?array
    {
        $normalized = preg_replace('/\s+/u', ' ', mb_strtolower(trim($title)));
        $builder = $this->getDb()->table('events')->select('id, title, start_time, status');
        if ($organizationId !== null && $organizationId !== '') $builder->where('organization_id', $organizationId);
        else $builder->where('organization_id', null)->where('organizer_profile_id', $organizerProfileId);
        $builder->where('start_time >=', $startDate . ' 00:00:00')->where('start_time <=', $startDate . ' 23:59:59');
        if ($excludeId !== null) $builder->where('id !=', $excludeId);
        foreach ($builder->get()->getResultArray() as $row) {
            if (strtolower((string) ($row['status'] ?? '')) === 'cancelled') continue;
            if (preg_replace('/\s+/u', ' ', mb_strtolower(trim((string) $row['title']))) === $normalized) return $row;
        }
        return null;
    }
}
