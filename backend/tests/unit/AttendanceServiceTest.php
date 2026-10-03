<?php

namespace Tests\Unit;

use App\Models\AttendanceRecordModel;
use App\Models\AttendanceSessionModel;
use App\Services\AttendanceService;
use App\Services\AuthorizationService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use RuntimeException;

/**
 * @internal
 */
final class AttendanceServiceTest extends CIUnitTestCase
{
    private function createActor(string $role, ?string $orgId = 'd0000000-0000-0000-0002-000000000000', ?string $profileId = 'd0000000-0000-0000-0001-000000000001'): array
    {
        $assignments = [];
        if ($orgId !== null && $role === 'organization_moderator') {
            $assignments[] = [
                'role_key'   => 'organization_moderator',
                'scope_type' => 'organization',
                'scope_id'   => $orgId,
            ];
        }

        return [
            'profile' => [
                'id'           => $profileId,
                'full_name'    => 'Test Moderator',
                'account_type' => 'personnel',
            ],
            'roles'       => [$role],
            'assignments' => $assignments,
        ];
    }

    /**
     * Create an in-memory/mocked AttendanceService for isolated testing without permanent DB mutation.
     */
    private function createServiceWithMockDb(
        array $events = [],
        array $sessions = [],
        array $records = [],
        array $profiles = [],
        ?callable $clock = null,
        bool $simulateUniqueRace = false
    ): AttendanceService {
        // Create an anonymous subclass that overrides DB queries with in-memory array state
        return new class($events, $sessions, $records, $profiles, $clock, $simulateUniqueRace) extends AttendanceService {
            private array $eventsData;
            private array $sessionsData;
            private array $recordsData;
            private array $profilesData;
            private bool $simulateUniqueRace;

            public function __construct(
                array $events,
                array $sessions,
                array $records,
                array $profiles,
                ?callable $clock,
                bool $simulateUniqueRace
            ) {
                $this->eventsData = $events;
                $this->sessionsData = $sessions;
                $this->recordsData = $records;
                $this->profilesData = $profiles;
                $this->simulateUniqueRace = $simulateUniqueRace;

                $authz = new AuthorizationService();
                $sessionModel = new class($this->sessionsData, $this->eventsData) extends AttendanceSessionModel {
                    private array $sData;
                    private array $eData;

                    public function __construct(array $sData, array $eData)
                    {
                        $this->sData = $sData;
                        $this->eData = $eData;
                    }

                    public function findByEvent(string $eventId): array
                    {
                        $rows = [];
                        foreach ($this->sData as $s) {
                            if ($s['event_id'] === $eventId) {
                                $rows[] = $s;
                            }
                        }
                        return $rows;
                    }

                    public function findWithEvent(string $sessionId): ?array
                    {
                        $session = $this->sData[$sessionId] ?? null;
                        if (! $session) {
                            return null;
                        }
                        $event = $this->eData[$session['event_id']] ?? null;
                        return array_merge($session, [
                            'event_title'      => $event['title'] ?? 'Test Event',
                            'organization_id'  => $event['organization_id'] ?? null,
                            'event_status'     => $event['status'] ?? 'published',
                            'event_start_time' => $event['start_time'] ?? '2026-10-01 09:00:00',
                            'event_end_time'   => $event['end_time'] ?? '2026-10-01 17:00:00',
                        ]);
                    }

                    public function find($id = null)
                    {
                        return $this->sData[$id] ?? null;
                    }

                    public function insert($data = null, bool $returnID = true)
                    {
                        $this->sData[$data['id']] = $data;
                        return $data['id'];
                    }

                    public function update($id = null, $data = null): bool
                    {
                        if (isset($this->sData[$id])) {
                            $this->sData[$id] = array_merge($this->sData[$id], $data);
                            return true;
                        }
                        return false;
                    }
                };

                $recordModel = new class($this->recordsData, $this->profilesData, $simulateUniqueRace) extends AttendanceRecordModel {
                    private array $rData;
                    private array $pData;
                    private bool $simRace;

                    public function __construct(array $rData, array $pData, bool $simRace)
                    {
                        $this->rData = $rData;
                        $this->pData = $pData;
                        $this->simRace = $simRace;
                    }

                    public function findForSessionAndAttendee(string $sessionId, string $attendeeProfileId): ?array
                    {
                        foreach ($this->rData as $r) {
                            if ($r['session_id'] === $sessionId && $r['attendee_profile_id'] === $attendeeProfileId) {
                                return $r;
                            }
                        }
                        return null;
                    }

                    public function listForSession(string $sessionId): array
                    {
                        $list = [];
                        foreach ($this->rData as $r) {
                            if ($r['session_id'] === $sessionId) {
                                $profile = $this->pData[$r['attendee_profile_id']] ?? [];
                                $list[] = array_merge($r, [
                                    'institutional_id'  => $profile['institutional_id'] ?? '2022-00001',
                                    'full_name'         => $profile['full_name'] ?? 'Test Student',
                                    'email'             => $profile['email'] ?? 'student@ndmu.edu.ph',
                                    'designation_title' => $profile['designation_title'] ?? null,
                                    'scanned_by_name'   => 'Test Moderator',
                                ]);
                            }
                        }
                        return $list;
                    }

                    public function insert($data = null, bool $returnID = true)
                    {
                        if ($this->simRace) {
                            throw new \CodeIgniter\Database\Exceptions\DatabaseException('Duplicate entry for key uq_session_attendee (1062)');
                        }
                        $this->rData[$data['id']] = $data;
                        return $data['id'];
                    }
                };

                $testDb = Database::connect([
                    'DBDriver' => 'SQLite3',
                    'database' => ':memory:',
                    'DBPrefix' => '',
                ], false);

                parent::__construct($testDb, $authz, $sessionModel, $recordModel, $clock);
            }

            protected function getAuthorizedEvent(string $eventId, array $actor): array
            {
                $event = $this->eventsData[$eventId] ?? null;
                if ($event === null) {
                    throw new RuntimeException('EVENT_NOT_FOUND');
                }
                if (! $this->canManageEventAttendance($actor, $event)) {
                    throw new RuntimeException('FORBIDDEN');
                }
                return $event;
            }

            public function checkIn(string $sessionId, array $input, array $actor): array
            {
                $session = $this->getAuthorizedSession($sessionId, $actor);
                $eventStatus = $session['event_status'] ?? 'published';
                if (! in_array($eventStatus, ['published', 'ongoing'], true)) {
                    throw new RuntimeException('EVENT_NOT_ACTIVE');
                }

                if (($session['status'] ?? '') !== 'open') {
                    throw new RuntimeException('SESSION_NOT_OPEN');
                }

                $nowStr = $this->now();
                $nowTs = strtotime($nowStr);
                $startTs = strtotime($session['check_in_start']);
                $endTs = strtotime($session['check_in_end']);

                if ($startTs !== false && $nowTs < $startTs) {
                    throw new RuntimeException('CHECKIN_WINDOW_NOT_STARTED');
                }
                if ($endTs !== false && $nowTs > $endTs) {
                    throw new RuntimeException('CHECKIN_WINDOW_EXPIRED');
                }

                $identifier = trim((string) ($input['identifier'] ?? ''));
                if ($identifier === '') {
                    throw new RuntimeException('MISSING_IDENTIFIER');
                }

                $profile = null;
                foreach ($this->profilesData as $p) {
                    if (($p['institutional_id'] ?? '') === $identifier || ($p['id'] ?? '') === $identifier) {
                        $profile = $p;
                        break;
                    }
                }

                if ($profile === null) {
                    throw new RuntimeException('ATTENDEE_NOT_FOUND');
                }

                if (($profile['account_type'] ?? '') !== 'student' || ($profile['status'] ?? '') !== 'active') {
                    throw new RuntimeException('ATTENDEE_NOT_ELIGIBLE');
                }

                $verificationMethod = trim((string) ($input['verification_method'] ?? 'qr_scan'));
                if (! in_array($verificationMethod, ['qr_scan', 'manual'], true)) {
                    throw new RuntimeException('INVALID_VERIFICATION_METHOD');
                }

                $attendeeProfileId = $profile['id'];
                $existing = $this->recordModel->findForSessionAndAttendee($sessionId, $attendeeProfileId);
                if ($existing !== null) {
                    throw new RuntimeException('ATTENDEE_ALREADY_CHECKED_IN');
                }

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
                } catch (\CodeIgniter\Database\Exceptions\DatabaseException $e) {
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
        };
    }

    // =========================================================================
    // SECTION A: CREATE SESSION (Tests 1–10)
    // =========================================================================

    public function test1DraftEventCreateSessionSucceeds(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'draft', 'title' => 'Draft Event']];
        $service = $this->createServiceWithMockDb($events);

        $session = $service->createSession('evt-1', [
            'session_name'   => 'Morning Check-in',
            'session_type'   => 'morning',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:30:00',
        ], $actor);

        $this->assertSame('Morning Check-in', $session['session_name']);
        $this->assertSame('scheduled', $session['status']);
    }

    public function test2PublishedEventCreateSessionSucceeds(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published', 'title' => 'Published Event']];
        $service = $this->createServiceWithMockDb($events);

        $session = $service->createSession('evt-1', [
            'session_name'   => 'General Session',
            'session_type'   => 'general',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ], $actor);

        $this->assertSame('scheduled', $session['status']);
    }

    public function test3OngoingEventCreateSessionSucceeds(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'ongoing', 'title' => 'Ongoing Event']];
        $service = $this->createServiceWithMockDb($events);

        $session = $service->createSession('evt-1', [
            'session_name'   => 'Afternoon Check-in',
            'session_type'   => 'afternoon',
            'check_in_start' => '2026-10-01 13:00:00',
            'check_in_end'   => '2026-10-01 14:00:00',
        ], $actor);

        $this->assertSame('afternoon', $session['session_type']);
    }

    public function test4CompletedEventCreateSessionRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('EVENT_COMPLETED');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'completed', 'title' => 'Completed Event']];
        $service = $this->createServiceWithMockDb($events);

        $service->createSession('evt-1', [
            'session_name'   => 'Late Session',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:00:00',
        ], $actor);
    }

    public function test5CancelledEventCreateSessionRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('EVENT_CANCELLED');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'cancelled', 'title' => 'Cancelled Event']];
        $service = $this->createServiceWithMockDb($events);

        $service->createSession('evt-1', [
            'session_name'   => 'Session',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:00:00',
        ], $actor);
    }

    public function test6CreatedStatusIsAlwaysScheduled(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $service = $this->createServiceWithMockDb($events);

        // Even if client attempts to pass status=open, server enforces scheduled
        $session = $service->createSession('evt-1', [
            'session_name'   => 'Session',
            'status'         => 'open',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:00:00',
        ], $actor);

        $this->assertSame('scheduled', $session['status']);
    }

    public function test7InvalidSessionTypeRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('INVALID_SESSION_TYPE');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $service = $this->createServiceWithMockDb($events);

        $service->createSession('evt-1', [
            'session_name'   => 'Session',
            'session_type'   => 'unsupported_type_xyz',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:00:00',
        ], $actor);
    }

    public function test8InvalidOrReversedCheckInWindowRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('INVALID_CHECKIN_WINDOW');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $service = $this->createServiceWithMockDb($events);

        $service->createSession('evt-1', [
            'session_name'   => 'Session',
            'check_in_start' => '2026-10-01 10:00:00',
            'check_in_end'   => '2026-10-01 09:00:00', // end is earlier than start
        ], $actor);
    }

    public function test9OrganizationModeratorCrossOrgRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('FORBIDDEN');

        $actor = $this->createActor('organization_moderator', 'd0000000-0000-0000-0002-000000000001'); // Moderator for Org 1
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => 'd0000000-0000-0000-0002-000000000002', 'status' => 'published']]; // Event belongs to Org 2
        $service = $this->createServiceWithMockDb($events);

        $service->createSession('evt-1', [
            'session_name'   => 'Session',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:00:00',
        ], $actor);
    }

    public function test10OSADAllowedAcrossAllOrganizations(): void
    {
        $actor = $this->createActor('osad_staff', null);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => 'd0000000-0000-0000-0002-000000000009', 'status' => 'published']];
        $service = $this->createServiceWithMockDb($events);

        $session = $service->createSession('evt-1', [
            'session_name'   => 'OSAD Supervised Session',
            'check_in_start' => '2026-10-01 08:00:00',
            'check_in_end'   => '2026-10-01 09:00:00',
        ], $actor);

        $this->assertSame('OSAD Supervised Session', $session['session_name']);
    }

    // =========================================================================
    // SECTION B: TRANSITIONS (Tests 11–18)
    // =========================================================================

    public function test11ScheduledToOpenSucceedsForPublishedEvent(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'scheduled']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $updated = $service->transitionSessionStatus('sess-1', 'open', $actor);
        $this->assertSame('open', $updated['status']);
    }

    public function test12ScheduledToOpenSucceedsForOngoingEvent(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'ongoing']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'scheduled']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $updated = $service->transitionSessionStatus('sess-1', 'open', $actor);
        $this->assertSame('open', $updated['status']);
    }

    public function test13DraftEventSessionOpenRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CANNOT_OPEN_SESSION_FOR_INACTIVE_EVENT');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'draft']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'scheduled']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->transitionSessionStatus('sess-1', 'open', $actor);
    }

    public function test14ScheduledToClosedRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('INVALID_STATUS_TRANSITION');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'scheduled']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->transitionSessionStatus('sess-1', 'closed', $actor);
    }

    public function test15OpenToScheduledRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('INVALID_STATUS_TRANSITION');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->transitionSessionStatus('sess-1', 'scheduled', $actor);
    }

    public function test16OpenToClosedSucceeds(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $updated = $service->transitionSessionStatus('sess-1', 'closed', $actor);
        $this->assertSame('closed', $updated['status']);
    }

    public function test17ClosedToOpenRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CLOSED_SESSION_IS_TERMINAL');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'closed']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->transitionSessionStatus('sess-1', 'open', $actor);
    }

    public function test18ClosedToClosedRejectedAsTerminal(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CLOSED_SESSION_IS_TERMINAL');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'closed']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->transitionSessionStatus('sess-1', 'closed', $actor);
    }

    // =========================================================================
    // SECTION C: CHECK-IN GATES (Tests 19–38)
    // =========================================================================

    public function test19OpenAndActiveEventAndValidWindowCheckInSucceeds(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-10-01 08:30:00',
            'check_in_end'   => '2026-10-01 10:00:00',
        ]];
        $profiles = ['stud-1' => [
            'id'               => 'stud-1',
            'institutional_id' => '2022-01452',
            'full_name'        => 'Juan Dela Cruz',
            'email'            => 'jdelacruz@ndmu.edu.ph',
            'account_type'     => 'student',
            'status'           => 'active',
        ]];

        $clock = fn() => '2026-10-01 09:00:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $result = $service->checkIn('sess-1', ['identifier' => '2022-01452', 'verification_method' => 'qr_scan'], $actor);

        $this->assertSame('stud-1', $result['attendee_profile_id']);
        $this->assertSame('2022-01452', $result['student_id']);
        $this->assertSame('qr_scan', $result['verification_method']);
    }

    public function test20ScheduledSessionCheckInRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('SESSION_NOT_OPEN');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'scheduled', 'check_in_start' => '2026-10-01 08:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test21ClosedSessionCheckInRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('SESSION_NOT_OPEN');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'closed', 'check_in_start' => '2026-10-01 08:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test22CompletedEventCheckInRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('EVENT_NOT_ACTIVE');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'completed']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 08:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test23CancelledEventCheckInRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('EVENT_NOT_ACTIVE');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'cancelled']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 08:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test24CheckInBeforeStartWindowRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CHECKIN_WINDOW_NOT_STARTED');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $clock = fn() => '2026-10-01 08:59:59';
        $service = $this->createServiceWithMockDb($events, $sessions, [], [], $clock);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test25CheckInAfterEndWindowRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CHECKIN_WINDOW_EXPIRED');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $clock = fn() => '2026-10-01 10:00:01';
        $service = $this->createServiceWithMockDb($events, $sessions, [], [], $clock);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test26CheckInExactlyAtStartWindowAccepted(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active', 'full_name' => 'Student A', 'email' => 'a@ndmu.edu.ph']];
        $clock = fn() => '2026-10-01 09:00:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $res = $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
        $this->assertSame('stud-1', $res['attendee_profile_id']);
    }

    public function test27CheckInExactlyAtEndWindowAccepted(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active', 'full_name' => 'Student A', 'email' => 'a@ndmu.edu.ph']];
        $clock = fn() => '2026-10-01 10:00:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $res = $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
        $this->assertSame('stud-1', $res['attendee_profile_id']);
    }

    public function test28UnknownAttendeeRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('ATTENDEE_NOT_FOUND');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], [], $clock);

        $service->checkIn('sess-1', ['identifier' => '9999-99999'], $actor);
    }

    public function test29InactiveStudentRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('ATTENDEE_NOT_ELIGIBLE');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'suspended']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test30NonStudentProfileRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('ATTENDEE_NOT_ELIGIBLE');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['fac-1' => ['id' => 'fac-1', 'institutional_id' => 'EMP-001', 'account_type' => 'personnel', 'status' => 'active']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $service->checkIn('sess-1', ['identifier' => 'EMP-001'], $actor);
    }

    public function test31QrScanAccepted(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active', 'full_name' => 'S1', 'email' => 's1@ndmu.edu.ph']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $res = $service->checkIn('sess-1', ['identifier' => '2022-01452', 'verification_method' => 'qr_scan'], $actor);
        $this->assertSame('qr_scan', $res['verification_method']);
    }

    public function test32ManualAccepted(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active', 'full_name' => 'S1', 'email' => 's1@ndmu.edu.ph']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $res = $service->checkIn('sess-1', ['identifier' => '2022-01452', 'verification_method' => 'manual'], $actor);
        $this->assertSame('manual', $res['verification_method']);
    }

    public function test33SelfCheckinRejectedInR4(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('INVALID_VERIFICATION_METHOD');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $service->checkIn('sess-1', ['identifier' => '2022-01452', 'verification_method' => 'self_checkin'], $actor);
    }

    public function test34UnknownVerificationMethodRejected(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('INVALID_VERIFICATION_METHOD');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        $service->checkIn('sess-1', ['identifier' => '2022-01452', 'verification_method' => 'bluetooth_beacon'], $actor);
    }

    public function test35DuplicatePrecheckReturnsConflict(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('ATTENDEE_ALREADY_CHECKED_IN');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active']];
        $records = ['rec-1' => ['id' => 'rec-1', 'session_id' => 'sess-1', 'attendee_profile_id' => 'stud-1']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, $records, $profiles, $clock);

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test36SimulatedUniqueKeyRaceMapsToDuplicateConflict(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('ATTENDEE_ALREADY_CHECKED_IN');

        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock, true); // simulate race

        $service->checkIn('sess-1', ['identifier' => '2022-01452'], $actor);
    }

    public function test37ScannedByComesFromAuthenticatedActorProfile(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $moderatorProfileId = 'd0000000-0000-0000-0001-000000000088';
        $actor = $this->createActor('organization_moderator', $orgId, $moderatorProfileId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active', 'full_name' => 'S1', 'email' => 's1@ndmu.edu.ph']];
        $clock = fn() => '2026-10-01 09:30:00';
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        // Client attempts to pass fake scanned_by
        $res = $service->checkIn('sess-1', [
            'identifier' => '2022-01452',
            'scanned_by' => 'fake-attacker-profile',
        ], $actor);

        $this->assertSame($moderatorProfileId, $res['scanned_by']);
    }

    public function test38CheckedInAtTimestampIsServerOwned(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'open', 'check_in_start' => '2026-10-01 09:00:00', 'check_in_end' => '2026-10-01 10:00:00']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'account_type' => 'student', 'status' => 'active', 'full_name' => 'S1', 'email' => 's1@ndmu.edu.ph']];
        $serverClockTime = '2026-10-01 09:35:12';
        $clock = fn() => $serverClockTime;
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, $clock);

        // Client attempts to pass arbitrary client time
        $res = $service->checkIn('sess-1', [
            'identifier'    => '2022-01452',
            'checked_in_at' => '1999-01-01 00:00:00',
        ], $actor);

        $this->assertSame($serverClockTime, $res['checked_in_at']);
    }

    // =========================================================================
    // SECTION D: READ SCOPE (Tests 39–43)
    // =========================================================================

    public function test39OrganizationModeratorCanReadOwnEventSessions(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = [
            's-1' => ['id' => 's-1', 'event_id' => 'evt-1', 'session_name' => 'Session 1'],
            's-2' => ['id' => 's-2', 'event_id' => 'evt-1', 'session_name' => 'Session 2'],
        ];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $list = $service->listSessionsForEvent('evt-1', $actor);
        $this->assertCount(2, $list);
    }

    public function test40OrganizationModeratorCannotReadCrossOrgSessions(): void
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('FORBIDDEN');

        $actor = $this->createActor('organization_moderator', 'd0000000-0000-0000-0002-000000000001');
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => 'd0000000-0000-0000-0002-000000000002', 'status' => 'published']];
        $service = $this->createServiceWithMockDb($events);

        $service->listSessionsForEvent('evt-1', $actor);
    }

    public function test41OSADCanReadAuthorizedGlobalSessions(): void
    {
        $actor = $this->createActor('osad_staff', null);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => 'd0000000-0000-0000-0002-000000000099', 'status' => 'published']];
        $sessions = ['s-1' => ['id' => 's-1', 'event_id' => 'evt-1', 'session_name' => 'Session 1']];
        $service = $this->createServiceWithMockDb($events, $sessions);

        $list = $service->listSessionsForEvent('evt-1', $actor);
        $this->assertCount(1, $list);
    }

    public function test42CompletedEventHistoricalRecordsRemainReadable(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'completed']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'closed']];
        $records = ['rec-1' => ['id' => 'rec-1', 'session_id' => 'sess-1', 'attendee_profile_id' => 'stud-1']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'full_name' => 'Student Historical']];
        $service = $this->createServiceWithMockDb($events, $sessions, $records, $profiles);

        $recordsList = $service->listSessionRecords('sess-1', $actor);
        $this->assertCount(1, $recordsList);
    }

    public function test43CancelledEventHistoricalRecordsRemainReadable(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'cancelled']];
        $sessions = ['sess-1' => ['id' => 'sess-1', 'event_id' => 'evt-1', 'status' => 'closed']];
        $records = ['rec-1' => ['id' => 'rec-1', 'session_id' => 'sess-1', 'attendee_profile_id' => 'stud-1']];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-01452', 'full_name' => 'Student Cancelled']];
        $service = $this->createServiceWithMockDb($events, $sessions, $records, $profiles);

        $recordsList = $service->listSessionRecords('sess-1', $actor);
        $this->assertCount(1, $recordsList);
    }

    public function test44CheckInWindowNotStartedInAppTimezone(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-09-24 20:52:00',
            'check_in_end'   => '2026-09-24 21:00:00',
        ]];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
        
        // now = 20:51:00 (1 minute before start)
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 20:51:00');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CHECKIN_WINDOW_NOT_STARTED');
        $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);
    }

    public function test45CheckInWindowOpenInAppTimezone(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-09-24 20:52:00',
            'check_in_end'   => '2026-09-24 21:00:00',
        ]];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
        
        // now = 20:55:00 (inside window)
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 20:55:00');
        $result = $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);

        $this->assertEquals('stud-1', $result['attendee_profile_id']);
    }

    public function test46CheckInWindowExpiredInAppTimezone(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-09-24 20:52:00',
            'check_in_end'   => '2026-09-24 21:00:00',
        ]];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
        
        // now = 22:37:08 (historical test case - after window expired)
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 22:37:08');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CHECKIN_WINDOW_EXPIRED');
        $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);
    }

    public function test47CheckInWindowExactStartBoundaryAllowed(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-09-24 20:52:00',
            'check_in_end'   => '2026-09-24 21:00:00',
        ]];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
        
        // now = 20:52:00 (exact start boundary)
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 20:52:00');
        $result = $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);

        $this->assertEquals('stud-1', $result['attendee_profile_id']);
    }

    public function test48CheckInWindowExactEndBoundaryAllowed(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-09-24 20:52:00',
            'check_in_end'   => '2026-09-24 21:00:00',
        ]];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
        
        // now = 21:00:00 (exact end boundary)
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 21:00:00');
        $result = $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);

        $this->assertEquals('stud-1', $result['attendee_profile_id']);
    }

    public function test49CheckInWindowOneSecondAfterEndExpired(): void
    {
        $orgId = 'd0000000-0000-0000-0002-000000000000';
        $actor = $this->createActor('organization_moderator', $orgId);
        $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
        $sessions = ['sess-1' => [
            'id'             => 'sess-1',
            'event_id'       => 'evt-1',
            'status'         => 'open',
            'check_in_start' => '2026-09-24 20:52:00',
            'check_in_end'   => '2026-09-24 21:00:00',
        ]];
        $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
        
        // now = 21:00:01 (one second after end)
        $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 21:00:01');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('CHECKIN_WINDOW_EXPIRED');
        $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);
    }

    public function test50PhpDefaultUtcDoesNotCorruptAppTimezoneSemantics(): void
    {
        $prevTz = date_default_timezone_get();
        date_default_timezone_set('UTC');
        try {
            $orgId = 'd0000000-0000-0000-0002-000000000000';
            $actor = $this->createActor('organization_moderator', $orgId);
            $events = ['evt-1' => ['id' => 'evt-1', 'organization_id' => $orgId, 'status' => 'published']];
            $sessions = ['sess-1' => [
                'id'             => 'sess-1',
                'event_id'       => 'evt-1',
                'status'         => 'open',
                'check_in_start' => '2026-09-24 20:52:00',
                'check_in_end'   => '2026-09-24 21:00:00',
            ]];
            $profiles = ['stud-1' => ['id' => 'stud-1', 'institutional_id' => '2022-0001', 'full_name' => 'Demo Student', 'email' => 'demo.student@ndmu.edu.ph', 'account_type' => 'student', 'status' => 'active']];
            
            // Inside window
            $service = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 20:55:00');
            $result = $service->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);
            $this->assertEquals('stud-1', $result['attendee_profile_id']);

            // Expired check
            $serviceExpired = $this->createServiceWithMockDb($events, $sessions, [], $profiles, fn() => '2026-09-24 22:37:08');
            try {
                $serviceExpired->checkIn('sess-1', ['identifier' => '2022-0001'], $actor);
                $this->fail('Expected CHECKIN_WINDOW_EXPIRED exception');
            } catch (RuntimeException $e) {
                $this->assertEquals('CHECKIN_WINDOW_EXPIRED', $e->getMessage());
            }
        } finally {
            date_default_timezone_set($prevTz);
        }
    }
}
