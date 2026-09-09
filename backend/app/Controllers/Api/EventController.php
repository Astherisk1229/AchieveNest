<?php

namespace App\Controllers\Api;

use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class EventController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;

    public function __construct(?AuthorizationService $authz = null)
    {
        $this->authz = $authz ?? new AuthorizationService();
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
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

        $db = db_connect();

        $events = $db->query(
            'SELECT e.*, p.full_name AS organizer_name
             FROM events e
             LEFT JOIN profiles p ON p.id = e.organizer_profile_id
             ORDER BY e.start_time DESC'
        )->getResultArray();

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

        $allowedOrganizerRoles = ['organization_moderator', 'program_coordinator', 'dean', 'osad_staff', 'hr_staff'];
        $hasRole = count(array_intersect($allowedOrganizerRoles, $actor['roles'] ?? [])) > 0;

        if (! $hasRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized organizer role required to create official events.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $title = trim((string) ($json['title'] ?? ''));
        $description = trim((string) ($json['description'] ?? ''));
        $eventType = trim((string) ($json['event_type'] ?? $json['category'] ?? 'institutional'));
        $startTime = ! empty($json['start_time']) ? trim((string) $json['start_time']) : (! empty($json['event_date']) ? trim((string) $json['event_date']) . ' 08:00:00' : date('Y-m-d H:i:s'));
        $endTime = ! empty($json['end_time']) ? trim((string) $json['end_time']) : (! empty($json['event_date']) ? trim((string) $json['event_date']) . ' 17:00:00' : date('Y-m-d H:i:s', time() + 3600 * 4));
        $venue = trim((string) ($json['venue'] ?? 'NDMU Campus'));

        if ($title === '') {
            return $this->respond(['error' => ['code' => 'MISSING_TITLE', 'message' => 'Event title is required.']], 422);
        }

        $db = db_connect();
        $eventId = $this->genUuid();
        $now = date('Y-m-d H:i:s');

        $db->table('events')->insert([
            'id'                   => $eventId,
            'organizer_profile_id' => $actor['profile']['id'],
            'title'                => $title,
            'description'          => $description !== '' ? $description : null,
            'event_type'           => $eventType,
            'start_time'           => $startTime,
            'end_time'             => $endTime,
            'venue'                => $venue,
            'status'               => 'published',
            'created_at'           => $now,
            'updated_at'           => $now,
        ]);

        return $this->respondCreated([
            'data' => [
                'message'    => 'Official event created successfully.',
                'id'         => $eventId,
                'title'      => $title,
                'start_time' => $startTime,
            ],
        ]);
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

        $allowedOrganizerRoles = ['organization_moderator', 'program_coordinator', 'dean', 'osad_staff', 'hr_staff'];
        $hasRole = count(array_intersect($allowedOrganizerRoles, $actor['roles'] ?? [])) > 0;

        if (! $hasRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized organizer role required.']], 403);
        }

        $db = db_connect();
        $event = $db->table('events')->where('id', $eventId)->get()->getRowArray();
        if ($event === null) {
            return $this->respond(['error' => ['code' => 'EVENT_NOT_FOUND', 'message' => 'Event not found.']], 404);
        }

        $json = $this->request->getJSON(true) ?? [];
        $participants = (array) ($json['participants'] ?? []);

        if (empty($participants)) {
            return $this->respond(['error' => ['code' => 'EMPTY_PARTICIPANTS', 'message' => 'At least one participant required.']], 422);
        }

        $category = $db->table('portfolio_categories')
            ->where('status', 'active')
            ->orderBy('sort_order', 'ASC')
            ->get()->getRowArray();
        $catId = $category['id'] ?? '11111111-1111-1111-1111-111111111111';

        $createdCount = 0;
        $now = date('Y-m-d H:i:s');
        $db->transStart();
        try {
            foreach ($participants as $p) {
                $studentId = $p['student_id'] ?? null;
                $award = $p['award'] ?? 'Certificate of Participation';

                if (! $studentId) continue;

                $recordId = $this->genUuid();
                $db->table('student_portfolio_records')->insert([
                    'id'                  => $recordId,
                    'student_profile_id'  => $studentId,
                    'category_id'         => $catId,
                    'title'               => sprintf('%s — %s', $event['title'], $award),
                    'organizer_or_body'   => $event['venue'] ?? 'NDMU Campus',
                    'occurrence_date'     => substr($event['start_time'], 0, 10),
                    'description'         => sprintf('Awarded %s in %s held on %s.', $award, $event['title'], substr($event['start_time'], 0, 10)),
                    'status'              => 'verified',
                    'verified_at'         => $now,
                    'created_at'          => $now,
                    'updated_at'          => $now,
                ]);

                $createdCount++;
            }

            $db->transComplete();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'BATCH_FAILED', 'message' => 'Failed to record participants: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'            => sprintf('Successfully added %d participants and generated verified portfolio records.', $createdCount),
                'event_id'           => $eventId,
                'participants_count' => $createdCount,
            ],
        ]);
    }
}
