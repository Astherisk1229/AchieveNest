<?php

namespace Tests\Unit;

use App\Services\CertificateEligibilityService;
use App\Services\StudentCategoryMapperRegistry;
use CodeIgniter\Test\CIUnitTestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class EventSourceRecordCertificateReadinessContractTest extends CIUnitTestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    public function testCommunityVolunteerFactBecomesAppreciationEligible(): void
    {
        $fact=['category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','subcategory_id'=>'community-based','participation_role'=>'volunteer'];
        $this->assertSame([], (new StudentCategoryMapperRegistry())->validate($fact));
        $eligibility=(new CertificateEligibilityService())->resolve(['id'=>'source-community','category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','verification_status'=>'verified','structured_attributes'=>['role'=>'volunteer','origin_type'=>'event','origin_event_id'=>'event-community','origin_event_participation_id'=>'participation-1']]);
        $this->assertSame('ELIGIBLE',$eligibility['eligibility_status']);
        $this->assertSame('APPRECIATION',$eligibility['eligible_purpose']);
        $this->assertSame('source-community',$eligibility['source_record_id']);
    }

    public function testSportsChampionFactBecomesRecognitionEligible(): void
    {
        $fact=['category_code'=>'SPORTS','subcategory_id'=>'basketball','placement'=>'champion'];
        $this->assertSame([], (new StudentCategoryMapperRegistry())->validate($fact));
        $eligibility=(new CertificateEligibilityService())->resolve(['id'=>'source-sports','category_code'=>'SPORTS','verification_status'=>'verified','structured_attributes'=>['placement'=>'champion','origin_type'=>'event','origin_event_id'=>'event-sports','origin_event_participation_id'=>'participation-2']]);
        $this->assertSame('RECOGNITION',$eligibility['eligible_purpose']);
    }

    public function testPendingEventFactCannotBecomeCertificateEligible(): void
    {
        $eligibility=(new CertificateEligibilityService())->resolve(['id'=>'source-pending','category_code'=>'COMMUNITY_SERVICE_VOLUNTEERISM','verification_status'=>'pending','structured_attributes'=>['role'=>'volunteer']]);
        $this->assertSame('NOT_ELIGIBLE',$eligibility['eligibility_status']);
        $this->assertSame(['SOURCE_RECORD_NOT_VERIFIED'],$eligibility['reason_codes']);
    }

    public function testCanonicalAttendanceEvidenceScenarios(): void
    {
        $db = \Config\Database::connect('default');
        $db->transBegin();
        try {
            $bridge = new \App\Services\EventSourceRecordBridgeService($db);
            $now = date('Y-m-d H:i:s');

            $studentAId = 'f7000000-0000-4000-8000-000000000001';
            $studentBId = 'f7000000-0000-4000-8000-000000000002';
            $creatorId = 'f7000000-0000-4000-8000-000000000003';
            $event1Id = 'f7000000-0000-4000-8000-000000000011';
            $event2Id = 'f7000000-0000-4000-8000-000000000012';
            $orgId = 'd0000000-0000-0000-0002-000000000000';

            // Ensure profiles exist
            foreach ([
                [$studentAId, 'student', 'Student A', 'STU-A-001'],
                [$studentBId, 'student', 'Student B', 'STU-B-002'],
                [$creatorId, 'personnel', 'Creator', 'PERS-001'],
            ] as [$pid, $acct, $name, $instId]) {
                $existing = $db->table('profiles')->where('id', $pid)->get()->getRowArray();
                if (!$existing) {
                    $db->table('profiles')->insert([
                        'id' => $pid, 'account_type' => $acct, 'full_name' => $name, 'institutional_id' => $instId,
                        'email' => strtolower(str_replace(' ', '', $name)) . '@example.com', 'status' => 'active', 'created_at' => $now
                    ]);
                }
            }

            // Ensure events exist
            foreach ([$event1Id, $event2Id] as $eid) {
                $existing = $db->table('events')->where('id', $eid)->get()->getRowArray();
                if (!$existing) {
                    $db->table('events')->insert([
                        'id' => $eid,
                        'organizer_profile_id' => $creatorId,
                        'organization_id' => $orgId,
                        'title' => 'Test Event ' . substr($eid, -2),
                        'description' => 'Test Description',
                        'event_type' => 'general',
                        'status' => 'completed',
                        'start_time' => $now,
                        'end_time' => $now,
                        'created_at' => $now,
                        'updated_at' => $now
                    ]);
                }
            }

            // Category and Subcategory
            $cat = $db->table('portfolio_categories')->where('code', 'COMMUNITY_SERVICE_VOLUNTEERISM')->get()->getRowArray();
            $subcat = $db->table('portfolio_subcategories')->where('category_id', $cat['id'])->get()->getRowArray();

            // Scenario 8: No attendance session -> false
            $this->assertFalse($bridge->hasCanonicalAttendanceEvidence($event1Id, $studentAId));

            // Session S1 on Event 1 (closed)
            $session1Id = 'f7000000-0000-4000-8000-000000000021';
            $db->table('attendance_sessions')->insert([
                'id' => $session1Id, 'event_id' => $event1Id, 'session_name' => 'Session 1',
                'session_type' => 'general', 'status' => 'closed', 'check_in_start' => $now,
                'check_in_end' => $now, 'created_at' => $now, 'updated_at' => $now
            ]);

            // Scenario 2: Closed Event session + no attendance record -> false
            $this->assertFalse($bridge->hasCanonicalAttendanceEvidence($event1Id, $studentAId));

            // Scenario 1: Closed Event session + canonical attendance record -> true
            $record1Id = 'f7000000-0000-4000-8000-000000000031';
            $db->table('attendance_records')->insert([
                'id' => $record1Id, 'session_id' => $session1Id, 'attendee_profile_id' => $studentAId,
                'scanned_by' => $creatorId, 'checked_in_at' => $now, 'verification_method' => 'qr_scan'
            ]);
            $this->assertTrue($bridge->hasCanonicalAttendanceEvidence($event1Id, $studentAId));

            // Scenario 6: Attendance for another student -> student B is false
            $this->assertFalse($bridge->hasCanonicalAttendanceEvidence($event1Id, $studentBId));

            // Scenario 5: Attendance in another event -> student A in Event 2 is false
            $this->assertFalse($bridge->hasCanonicalAttendanceEvidence($event2Id, $studentAId));

            // Scenario 3: Open Event session + record -> false
            $sessionOpenId = 'f7000000-0000-4000-8000-000000000022';
            $db->table('attendance_sessions')->insert([
                'id' => $sessionOpenId, 'event_id' => $event2Id, 'session_name' => 'Session Open',
                'session_type' => 'general', 'status' => 'open', 'check_in_start' => $now,
                'check_in_end' => $now, 'created_at' => $now, 'updated_at' => $now
            ]);
            $db->table('attendance_records')->insert([
                'id' => 'f7000000-0000-4000-8000-000000000032', 'session_id' => $sessionOpenId,
                'attendee_profile_id' => $studentAId, 'scanned_by' => $creatorId, 'checked_in_at' => $now,
                'verification_method' => 'qr_scan'
            ]);
            $this->assertFalse($bridge->hasCanonicalAttendanceEvidence($event2Id, $studentAId));

            // Scenario 4: Scheduled Event session + record -> false
            $sessionScheduledId = 'f7000000-0000-4000-8000-000000000023';
            $db->table('attendance_sessions')->insert([
                'id' => $sessionScheduledId, 'event_id' => $event2Id, 'session_name' => 'Session Sched',
                'session_type' => 'general', 'status' => 'scheduled', 'check_in_start' => $now,
                'check_in_end' => $now, 'created_at' => $now, 'updated_at' => $now
            ]);
            $db->table('attendance_records')->insert([
                'id' => 'f7000000-0000-4000-8000-000000000033', 'session_id' => $sessionScheduledId,
                'attendee_profile_id' => $studentBId, 'scanned_by' => $creatorId, 'checked_in_at' => $now,
                'verification_method' => 'qr_scan'
            ]);
            $this->assertFalse($bridge->hasCanonicalAttendanceEvidence($event2Id, $studentBId));

            // Scenario 7: Multiple qualifying Event sessions -> student A attended session 1 and session 2 (both closed)
            $session1bId = 'f7000000-0000-4000-8000-000000000024';
            $db->table('attendance_sessions')->insert([
                'id' => $session1bId, 'event_id' => $event1Id, 'session_name' => 'Session 1B',
                'session_type' => 'general', 'status' => 'closed', 'check_in_start' => $now,
                'check_in_end' => $now, 'created_at' => $now, 'updated_at' => $now
            ]);
            $db->table('attendance_records')->insert([
                'id' => 'f7000000-0000-4000-8000-000000000034', 'session_id' => $session1bId,
                'attendee_profile_id' => $studentAId, 'scanned_by' => $creatorId, 'checked_in_at' => $now,
                'verification_method' => 'qr_scan'
            ]);
            $profileIds = $bridge->getCanonicalAttendanceProfileIdsForEvent($event1Id);
            $this->assertSame([$studentAId], array_values(array_unique($profileIds)));

            // Scenario 9 & 10: recordFacts and resolve override client-supplied boolean
            // Client supplies attendance_verified = false, but student A has canonical attendance -> server sets true
            $resultsA = $bridge->recordFacts($event1Id, [[
                'student_id' => $studentAId,
                'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM',
                'subcategory_code' => $subcat['code'],
                'participation_role' => 'volunteer',
                'attendance_verified' => false, // Client tries to supply false
                'facts_finalized' => true,
                'verification_status' => 'verified'
            ]], $creatorId);
            $factA = $db->table('event_student_source_records')->where('id', $resultsA[0]['event_participation_id'])->get()->getRowArray();
            $this->assertSame(1, (int)$factA['attendance_verified']);

            // Client supplies attendance_verified = true, but student B has NO canonical attendance -> server sets false
            $resultsB = $bridge->recordFacts($event1Id, [[
                'student_id' => $studentBId,
                'category_code' => 'COMMUNITY_SERVICE_VOLUNTEERISM',
                'subcategory_code' => $subcat['code'],
                'participation_role' => 'volunteer',
                'attendance_verified' => true, // Client tries to supply true
                'facts_finalized' => true,
                'verification_status' => 'verified'
            ]], $creatorId);
            $factB = $db->table('event_student_source_records')->where('id', $resultsB[0]['event_participation_id'])->get()->getRowArray();
            $this->assertSame(0, (int)$factB['attendance_verified']);

            // Test resolveFact enforces server authority
            $resolvedA = $bridge->resolve($event1Id, [$studentAId], $creatorId);
            $this->assertSame('CREATED', $resolvedA[0]['bridge_status']);
            $this->assertSame([], $resolvedA[0]['reason_codes']);

            $resolvedB = $bridge->resolve($event1Id, [$studentBId], $creatorId);
            $this->assertSame('BLOCKED', $resolvedB[0]['bridge_status']);
            $this->assertContains('ATTENDANCE_NOT_VERIFIED', $resolvedB[0]['reason_codes']);

            // Test candidate listing derives attendance_verified dynamically
            $candidates = $bridge->candidates($event1Id);
            $this->assertCount(1, $candidates);
            $this->assertSame($studentAId, $candidates[0]['student_id']);
            $this->assertTrue($candidates[0]['attendance_verified']);
        } finally {
            $db->transRollback();
        }
    }
}
