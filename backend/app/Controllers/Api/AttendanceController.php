<?php

namespace App\Controllers\Api;

use App\Services\AttendanceService;
use App\Services\AuthorizationService;
use CodeIgniter\API\ResponseTrait;
use CodeIgniter\Controller;
use Throwable;

class AttendanceController extends Controller
{
    use ResponseTrait;

    protected AuthorizationService $authz;
    protected AttendanceService $attendanceService;

    public function __construct(
        ?AuthorizationService $authz = null,
        ?AttendanceService $attendanceService = null
    ) {
        $this->authz = $authz ?? new AuthorizationService();
        $this->attendanceService = $attendanceService ?? new AttendanceService();
    }

    public function options()
    {
        return $this->respond(null, 204);
    }

    protected function resolveActor(): ?array
    {
        return $this->authz->resolveActor($this->request->getHeaderLine('Authorization'));
    }

    /**
     * Map domain error codes emitted by AttendanceService to standardized HTTP responses.
     */
    protected function handleDomainException(Throwable $e)
    {
        $code = $e->getMessage();

        $map = [
            // 404 Not Found
            'EVENT_NOT_FOUND'                        => [404, 'Event not found.'],
            'SESSION_NOT_FOUND'                      => [404, 'Attendance session not found.'],
            'ATTENDEE_NOT_FOUND'                     => [404, 'Attendee profile not found.'],

            // 403 Forbidden
            'FORBIDDEN'                              => [403, 'You do not have permission to manage attendance for this event.'],

            // 409 Conflict
            'ATTENDEE_ALREADY_CHECKED_IN'            => [409, 'Attendee has already checked in to this session.'],

            // 422 Unprocessable Entity
            'EVENT_CANCELLED'                        => [422, 'Cannot perform action on a cancelled event.'],
            'EVENT_COMPLETED'                        => [422, 'Cannot create or open sessions for a completed event.'],
            'EVENT_NOT_ACTIVE'                       => [422, 'Check-in is only allowed for published or ongoing events.'],
            'MISSING_SESSION_NAME'                   => [422, 'Session name is required.'],
            'INVALID_SESSION_TYPE'                   => [422, 'Invalid session type specified.'],
            'INVALID_CHECKIN_WINDOW'                 => [422, 'Check-in end time must be after check-in start time.'],
            'CLOSED_SESSION_IS_TERMINAL'             => [422, 'Closed attendance sessions cannot be modified or re-opened.'],
            'CANNOT_OPEN_SESSION_FOR_INACTIVE_EVENT' => [422, 'Cannot open attendance session for an inactive event.'],
            'INVALID_STATUS_TRANSITION'              => [422, 'Invalid session status transition requested.'],
            'SESSION_NOT_OPEN'                       => [422, 'Attendance session is not currently open for check-in.'],
            'CHECKIN_WINDOW_NOT_STARTED'             => [422, 'Attendance check-in window has not started yet.'],
            'CHECKIN_WINDOW_EXPIRED'                 => [422, 'Attendance check-in window has expired.'],
            'MISSING_IDENTIFIER'                     => [422, 'Attendee identifier is required.'],
            'ATTENDEE_NOT_ELIGIBLE'                  => [422, 'Attendee must be an active student.'],
            'INVALID_VERIFICATION_METHOD'            => [422, 'Invalid verification method specified.'],
        ];

        if (isset($map[$code])) {
            [$status, $message] = $map[$code];
            return $this->respond([
                'error' => [
                    'code'    => $code,
                    'message' => $message,
                ],
            ], $status);
        }

        return $this->respond([
            'error' => [
                'code'    => 'INTERNAL_SERVER_ERROR',
                'message' => 'An unexpected error occurred while processing attendance.',
            ],
        ], 500);
    }

    /**
     * 1. GET /api/v1/events/{eventId}/attendance-sessions
     */
    public function listSessionsForEvent(string $eventId)
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

        try {
            $sessions = $this->attendanceService->listSessionsForEvent($eventId, $actor);
            return $this->respond([
                'data' => [
                    'sessions' => $sessions,
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->handleDomainException($e);
        }
    }

    /**
     * 2. POST /api/v1/events/{eventId}/attendance-sessions
     */
    public function createSession(string $eventId)
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

        $json = $this->request->getJSON(true) ?? [];

        // Whitelist accepted client fields only; do not allow client authority over server-owned fields
        $payload = [
            'session_name'   => $json['session_name'] ?? null,
            'session_type'   => $json['session_type'] ?? null,
            'check_in_start' => $json['check_in_start'] ?? null,
            'check_in_end'   => $json['check_in_end'] ?? null,
        ];

        try {
            $session = $this->attendanceService->createSession($eventId, $payload, $actor);
            return $this->respond([
                'data' => [
                    'session' => $session,
                ],
            ], 201);
        } catch (Throwable $e) {
            return $this->handleDomainException($e);
        }
    }

    /**
     * 3. GET /api/v1/attendance-sessions/{sessionId}
     */
    public function getSession(string $sessionId)
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

        try {
            $session = $this->attendanceService->getSession($sessionId, $actor);
            return $this->respond([
                'data' => [
                    'session' => $session,
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->handleDomainException($e);
        }
    }

    /**
     * 4. PATCH /api/v1/attendance-sessions/{sessionId}/status
     */
    public function transitionSessionStatus(string $sessionId)
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

        $json = $this->request->getJSON(true) ?? [];
        $newStatus = trim((string) ($json['status'] ?? ''));

        try {
            $session = $this->attendanceService->transitionSessionStatus($sessionId, $newStatus, $actor);
            return $this->respond([
                'data' => [
                    'session' => $session,
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->handleDomainException($e);
        }
    }

    /**
     * 5. GET /api/v1/attendance-sessions/{sessionId}/records
     */
    public function listSessionRecords(string $sessionId)
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

        try {
            $records = $this->attendanceService->listSessionRecords($sessionId, $actor);
            return $this->respond([
                'data' => [
                    'records' => $records,
                ],
            ], 200);
        } catch (Throwable $e) {
            return $this->handleDomainException($e);
        }
    }

    /**
     * 6. POST /api/v1/attendance-sessions/{sessionId}/check-in
     */
    public function checkIn(string $sessionId)
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

        $json = $this->request->getJSON(true) ?? [];

        // Whitelist accepted client fields only; scanned_by, checked_in_at, attendee_profile_id are server-resolved
        $payload = [
            'identifier'          => $json['identifier'] ?? null,
            'verification_method' => $json['verification_method'] ?? 'qr_scan',
        ];

        try {
            $record = $this->attendanceService->checkIn($sessionId, $payload, $actor);
            return $this->respond([
                'data' => [
                    'record' => $record,
                ],
            ], 201);
        } catch (Throwable $e) {
            return $this->handleDomainException($e);
        }
    }
}
