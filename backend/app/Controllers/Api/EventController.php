<?php

namespace App\Controllers\Api;

use App\Services\SupabaseAuthService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class EventController extends Controller
{
    use ResponseTrait;

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        $authorization = $this->request->getHeaderLine('Authorization');
        if ($authorization === '' || ! preg_match('/^Bearer\s+(.+)$/i', $authorization, $matches)) {
            return null;
        }

        $token = trim($matches[1]);

        try {
            $claims = (new SupabaseAuthService())->verifyAccessToken($token);
        } catch (Throwable) {
            return null;
        }

        $authUserId = (string) ($claims->sub ?? '');
        if ($authUserId === '') {
            return null;
        }

        $db = db_connect();
        $profile = $db->table('public.profiles')
            ->where('id', $authUserId)
            ->get()
            ->getRowArray();

        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return null;
        }

        $roles = $db->query(
            'SELECT r.role_key
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ? AND pr.is_active = true',
            [$authUserId]
        )->getResultArray();

        return [
            'profile' => $profile,
            'roles'   => array_column($roles, 'role_key'),
        ];
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
             FROM public.events e
             JOIN public.profiles p ON p.id = e.organizer_id
             ORDER BY e.event_date DESC'
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

        $allowedOrganizerRoles = ['organization_moderator', 'program_coordinator', 'dean', 'osad_staff'];
        $hasRole = count(array_intersect($allowedOrganizerRoles, $actor['roles'])) > 0;

        if (! $hasRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized organizer role required to create official events.']], 403);
        }

        $json = $this->request->getJSON(true) ?? [];
        $title = trim((string) ($json['title'] ?? ''));
        $description = trim((string) ($json['description'] ?? ''));
        $category = trim((string) ($json['category'] ?? 'Institutional'));
        $eventDate = ! empty($json['event_date']) ? trim((string) $json['event_date']) : date('Y-m-d');
        $venue = trim((string) ($json['venue'] ?? 'NDMU Campus'));

        if ($title === '') {
            return $this->respond(['error' => ['code' => 'MISSING_TITLE', 'message' => 'Event title is required.']], 422);
        }

        $db = db_connect();
        $eventId = (string) service('uuid')->uuid4();

        $db->table('public.events')->insert([
            'id'           => $eventId,
            'title'        => $title,
            'description'  => $description,
            'category'     => $category,
            'event_date'   => $eventDate,
            'venue'        => $venue,
            'organizer_id' => $actor['profile']['id'],
            'status'       => 'published',
            'created_at'   => date('Y-m-d H:i:s'),
        ]);

        return $this->respondCreated([
            'data' => [
                'message'    => 'Official event created successfully.',
                'id'         => $eventId,
                'title'      => $title,
                'event_date' => $eventDate,
            ],
        ]);
    }

    /**
     * POST /api/v1/events/{id}/participants
     * Records event participants and generates verified achievements & certificates.
     */
    public function addParticipants(string $eventId)
    {
        $actor = $this->resolveActor();
        if ($actor === null) {
            return $this->respond(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Valid active authenticated session required.']], 401);
        }

        $allowedOrganizerRoles = ['organization_moderator', 'program_coordinator', 'dean', 'osad_staff'];
        $hasRole = count(array_intersect($allowedOrganizerRoles, $actor['roles'])) > 0;

        if (! $hasRole) {
            return $this->respond(['error' => ['code' => 'FORBIDDEN', 'message' => 'Authorized organizer role required.']], 403);
        }

        $db = db_connect();
        $event = $db->table('public.events')->where('id', $eventId)->get()->getRowArray();
        if ($event === null) {
            return $this->respond(['error' => ['code' => 'EVENT_NOT_FOUND', 'message' => 'Event not found.']], 404);
        }

        $json = $this->request->getJSON(true) ?? [];
        $participants = (array) ($json['participants'] ?? []);

        if (empty($participants)) {
            return $this->respond(['error' => ['code' => 'EMPTY_PARTICIPANTS', 'message' => 'At least one participant required.']], 422);
        }

        $createdCount = 0;
        $db->transBegin();
        try {
            foreach ($participants as $p) {
                $studentId = $p['student_id'] ?? null;
                $award = $p['award'] ?? 'Certificate of Participation';
                $role = $p['role'] ?? 'Participant';

                if (! $studentId) continue;

                // Create participant record
                $db->table('public.event_participants')->insert([
                    'id'               => (string) service('uuid')->uuid4(),
                    'event_id'         => $eventId,
                    'student_id'       => $studentId,
                    'role'             => $role,
                    'result_award'     => $award,
                    'is_verified'      => true,
                    'created_at'       => date('Y-m-d H:i:s'),
                ]);

                // Automatically generate verified achievement attached to student's portfolio
                $db->table('public.achievements')->insert([
                    'id'                => (string) service('uuid')->uuid4(),
                    'student_id'        => $studentId,
                    'official_event_id' => $eventId,
                    'title'             => sprintf('%s — %s', $event['title'], $award),
                    'category'          => $event['category'] ?? 'Institutional Event',
                    'description'       => sprintf('Awarded %s in %s held on %s.', $award, $event['title'], $event['event_date']),
                    'date_awarded'      => $event['event_date'],
                    'venue'             => $event['venue'] ?? 'NDMU Campus',
                    'status'            => 'verified',
                    'created_at'        => date('Y-m-d H:i:s'),
                    'updated_at'        => date('Y-m-d H:i:s'),
                ]);

                $createdCount++;
            }

            $db->transCommit();
        } catch (Throwable $e) {
            $db->transRollback();
            return $this->respond(['error' => ['code' => 'BATCH_FAILED', 'message' => 'Failed to record participants: ' . $e->getMessage()]], 500);
        }

        return $this->respondCreated([
            'data' => [
                'message'            => sprintf('Successfully added %d participants and generated verified portfolio achievements.', $createdCount),
                'event_id'           => $eventId,
                'participants_count' => $createdCount,
            ],
        ]);
    }
}
