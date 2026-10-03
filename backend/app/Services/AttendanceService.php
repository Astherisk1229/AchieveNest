<?php

namespace App\Services;

use App\Models\AttendanceRecordModel;
use App\Models\AttendanceSessionModel;
use CodeIgniter\Database\BaseConnection;
use CodeIgniter\Database\Exceptions\DatabaseException;
use RuntimeException;
use Throwable;

class AttendanceService
{
    private const ALLOWED_SESSION_TYPES = [
        'general',
        'morning',
        'afternoon',
        'breakout',
    ];

    private const ALLOWED_VERIFICATION_METHODS = [
        'qr_scan',
        'manual',
    ];

    private const ACTIVE_EVENT_STATUSES = [
        'published',
        'ongoing',
    ];

    protected BaseConnection $db;
    protected AuthorizationService $authz;
    protected AttendanceSessionModel $sessionModel;
    protected AttendanceRecordModel $recordModel;
    /** @var callable|null */
    protected $clock;

    public function __construct(
        ?BaseConnection $db = null,
        ?AuthorizationService $authz = null,
        ?AttendanceSessionModel $sessionModel = null,
        ?AttendanceRecordModel $recordModel = null,
        ?callable $clock = null
    ) {
        $this->db = $db ?? db_connect('default');
        $this->authz = $authz ?? new AuthorizationService();
        $this->sessionModel = $sessionModel ?? new AttendanceSessionModel($this->db);
        $this->recordModel = $recordModel ?? new AttendanceRecordModel($this->db);
        $this->clock = $clock;
    }

    public function getTimezone(): \DateTimeZone
    {
        $appTimezone = config('App')->appTimezone ?? 'Asia/Manila';
        return new \DateTimeZone($appTimezone);
    }

    /**
     * Get current server time string in application timezone (supports injectable clock for deterministic unit testing).
     */
    public function now(): string
    {
        if ($this->clock !== null) {
            return (string) call_user_func($this->clock);
        }
        $tz = $this->getTimezone();
        return (new \DateTimeImmutable('now', $tz))->format('Y-m-d H:i:s');
    }

    /**
     * Generate a canonical UUID v4 string.
     */
    protected function uuid(): string
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
     * Validates whether the given actor has authority to manage the given event's attendance.
     */
    public function canManageEventAttendance(array $actor, array $event): bool
    {
        $roles = $actor['roles'] ?? [];

        // OSAD staff have global authority over institutional and organization event attendance
        if (in_array('osad_staff', $roles, true)) {
            return true;
        }

        // Organization Moderator authority is strictly bound to their moderated organizations
        if (in_array('organization_moderator', $roles, true)) {
            if (empty($event['organization_id'])) {
                return false;
            }
            $modOrgIds = $this->authz->getModeratedOrganizationIds($actor);
            return in_array((string) $event['organization_id'], $modOrgIds, true);
        }

        return false;
    }

    /**
     * Helper to load an event and assert management authority.
     */
    protected function getAuthorizedEvent(string $eventId, array $actor): array
    {
        $event = $this->db->table('events')->where('id', $eventId)->get()->getRowArray();
        if ($event === null) {
            throw new RuntimeException('EVENT_NOT_FOUND');
        }

        if (! $this->canManageEventAttendance($actor, $event)) {
            throw new RuntimeException('FORBIDDEN');
        }

        return $event;
    }

    /**
     * Helper to load a session with event context and assert management authority.
     */
    protected function getAuthorizedSession(string $sessionId, array $actor): array
    {
        $session = $this->sessionModel->findWithEvent($sessionId);
        if ($session === null) {
            throw new RuntimeException('SESSION_NOT_FOUND');
        }

        $event = [
            'id'              => $session['event_id'],
            'organization_id' => $session['organization_id'],
            'status'          => $session['event_status'],
            'title'           => $session['event_title'],
        ];

        if (! $this->canManageEventAttendance($actor, $event)) {
            throw new RuntimeException('FORBIDDEN');
        }

        return $session;
    }

    /**
     * 1. List all attendance sessions for an event.
     */
    public function listSessionsForEvent(string $eventId, array $actor): array
    {
        $this->getAuthorizedEvent($eventId, $actor);
        return $this->sessionModel->findByEvent($eventId);
    }

    /**
     * 2. Create a canonical attendance session linked to an event.
     */
    public function createSession(string $eventId, array $data, array $actor): array
    {
        $event = $this->getAuthorizedEvent($eventId, $actor);

        $eventStatus = $event['status'] ?? 'draft';
        if ($eventStatus === 'cancelled') {
            throw new RuntimeException('EVENT_CANCELLED');
        }
        if ($eventStatus === 'completed') {
            throw new RuntimeException('EVENT_COMPLETED');
        }

        $sessionName = trim((string) ($data['session_name'] ?? ''));
        if ($sessionName === '') {
            throw new RuntimeException('MISSING_SESSION_NAME');
        }

        $sessionType = trim((string) ($data['session_type'] ?? 'general'));
        if (! in_array($sessionType, self::ALLOWED_SESSION_TYPES, true)) {
            throw new RuntimeException('INVALID_SESSION_TYPE');
        }

        $tz = $this->getTimezone();
        $startStr = substr(trim((string) ($data['check_in_start'] ?? '')), 0, 19);
        $endStr = substr(trim((string) ($data['check_in_end'] ?? '')), 0, 19);

        $startObj = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startStr, $tz)
            ?: (strtotime($startStr) !== false ? new \DateTimeImmutable($startStr, $tz) : false);
        $endObj = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endStr, $tz)
            ?: (strtotime($endStr) !== false ? new \DateTimeImmutable($endStr, $tz) : false);

        if (! $startObj || ! $endObj || $endObj <= $startObj) {
            throw new RuntimeException('INVALID_CHECKIN_WINDOW');
        }

        $now = $this->now();
        $sessionId = $this->uuid();

        $sessionRecord = [
            'id'             => $sessionId,
            'event_id'       => $eventId,
            'session_name'   => $sessionName,
            'session_type'   => $sessionType,
            'check_in_start' => $startObj->format('Y-m-d H:i:s'),
            'check_in_end'   => $endObj->format('Y-m-d H:i:s'),
            'status'         => 'scheduled',
            'created_at'     => $now,
            'updated_at'     => $now,
        ];

        $this->sessionModel->insert($sessionRecord);

        return $this->sessionModel->find($sessionId);
    }

    /**
     * 3. Get session details and live status.
     */
    public function getSession(string $sessionId, array $actor): array
    {
        $session = $this->getAuthorizedSession($sessionId, $actor);
        $recordCount = $this->db->table('attendance_records')
            ->where('session_id', $sessionId)
            ->countAllResults();

        $session['record_count'] = $recordCount;
        return $session;
    }

    /**
     * 4. Transition session lifecycle status (scheduled -> open, open -> closed).
     */
    public function transitionSessionStatus(string $sessionId, string $newStatus, array $actor): array
    {
        $session = $this->getAuthorizedSession($sessionId, $actor);
        $currentStatus = $session['status'] ?? 'scheduled';
        $eventStatus = $session['event_status'] ?? 'published';

        if ($currentStatus === 'closed') {
            throw new RuntimeException('CLOSED_SESSION_IS_TERMINAL');
        }

        if ($currentStatus === 'scheduled' && $newStatus === 'open') {
            if (! in_array($eventStatus, self::ACTIVE_EVENT_STATUSES, true)) {
                throw new RuntimeException('CANNOT_OPEN_SESSION_FOR_INACTIVE_EVENT');
            }
        } elseif ($currentStatus === 'open' && $newStatus === 'closed') {
            // Valid closure
        } else {
            throw new RuntimeException('INVALID_STATUS_TRANSITION');
        }

        $now = $this->now();
        $this->sessionModel->update($sessionId, [
            'status'     => $newStatus,
            'updated_at' => $now,
        ]);

        return $this->sessionModel->findWithEvent($sessionId);
    }

    /**
     * 5. List verified attendance records for a session.
     */
    public function listSessionRecords(string $sessionId, array $actor): array
    {
        $this->getAuthorizedSession($sessionId, $actor);
        return $this->recordModel->listForSession($sessionId);
    }

    /**
     * 6. Record an attendee check-in against a session.
     */
    public function checkIn(string $sessionId, array $input, array $actor): array
    {
        // Gates 1, 2, 3: Session exists, event exists, actor authorized
        $session = $this->getAuthorizedSession($sessionId, $actor);

        // Gate 4: Event status must be published or ongoing
        $eventStatus = $session['event_status'] ?? 'published';
        if (! in_array($eventStatus, self::ACTIVE_EVENT_STATUSES, true)) {
            throw new RuntimeException('EVENT_NOT_ACTIVE');
        }

        // Gate 5: Session status == open
        if (($session['status'] ?? '') !== 'open') {
            throw new RuntimeException('SESSION_NOT_OPEN');
        }

        // Gate 6: Current server time inside check_in_start <= now <= check_in_end
        $tz = $this->getTimezone();
        $nowStr = substr(trim($this->now()), 0, 19);
        $nowObj = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $nowStr, $tz)
            ?: (strtotime($nowStr) !== false ? new \DateTimeImmutable($nowStr, $tz) : false);

        $startStr = substr(trim((string) $session['check_in_start']), 0, 19);
        $startObj = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $startStr, $tz)
            ?: (strtotime($startStr) !== false ? new \DateTimeImmutable($startStr, $tz) : false);

        $endStr = substr(trim((string) $session['check_in_end']), 0, 19);
        $endObj = \DateTimeImmutable::createFromFormat('Y-m-d H:i:s', $endStr, $tz)
            ?: (strtotime($endStr) !== false ? new \DateTimeImmutable($endStr, $tz) : false);

        if ($nowObj === false || $startObj === false || $endObj === false) {
            throw new RuntimeException('INVALID_CHECKIN_WINDOW');
        }

        if ($nowObj < $startObj) {
            throw new RuntimeException('CHECKIN_WINDOW_NOT_STARTED');
        }
        if ($nowObj > $endObj) {
            throw new RuntimeException('CHECKIN_WINDOW_EXPIRED');
        }

        // Gate 7: Supplied identifier resolves to exactly one profile
        $identifier = trim((string) ($input['identifier'] ?? ''));
        if ($identifier === '') {
            throw new RuntimeException('MISSING_IDENTIFIER');
        }

        $profile = $this->db->table('profiles')
            ->groupStart()
                ->where('institutional_id', $identifier)
                ->orWhere('id', $identifier)
            ->groupEnd()
            ->get()
            ->getRowArray();

        if ($profile === null) {
            throw new RuntimeException('ATTENDEE_NOT_FOUND');
        }

        // Gate 8: Profile must be active student
        if (($profile['account_type'] ?? '') !== 'student' || ($profile['status'] ?? '') !== 'active') {
            throw new RuntimeException('ATTENDEE_NOT_ELIGIBLE');
        }

        // Gate 9: Verification method in allowlist ('qr_scan', 'manual')
        $verificationMethod = trim((string) ($input['verification_method'] ?? 'qr_scan'));
        if (! in_array($verificationMethod, self::ALLOWED_VERIFICATION_METHODS, true)) {
            throw new RuntimeException('INVALID_VERIFICATION_METHOD');
        }

        // Gate 10: Pre-check duplicate in session
        $attendeeProfileId = $profile['id'];
        $existing = $this->recordModel->findForSessionAndAttendee($sessionId, $attendeeProfileId);
        if ($existing !== null) {
            throw new RuntimeException('ATTENDEE_ALREADY_CHECKED_IN');
        }

        // Gate 11 & 12: Server-owned scanned_by and timestamps
        $scannerProfileId = $actor['profile']['id'] ?? null;
        $recordId = $this->uuid();

        $recordData = [
            'id'                  => $recordId,
            'session_id'          => $sessionId,
            'attendee_profile_id' => $attendeeProfileId,
            'scanned_by'          => $scannerProfileId,
            'checked_in_at'       => $nowStr,
            'verification_method' => $verificationMethod,
        ];

        try {
            $this->recordModel->insert($recordData);
        } catch (DatabaseException $e) {
            // Handle race condition on unique key uq_session_attendee
            if (str_contains($e->getMessage(), 'uq_session_attendee') || str_contains($e->getMessage(), '1062')) {
                throw new RuntimeException('ATTENDEE_ALREADY_CHECKED_IN');
            }
            throw $e;
        }

        return [
            'id'                  => $recordId,
            'session_id'          => $sessionId,
            'attendee_profile_id' => $attendeeProfileId,
            'student_id'          => $profile['institutional_id'],
            'full_name'           => $profile['full_name'],
            'email'               => $profile['email'],
            'checked_in_at'       => $nowStr,
            'verification_method' => $verificationMethod,
            'scanned_by'          => $scannerProfileId,
        ];
    }
}
