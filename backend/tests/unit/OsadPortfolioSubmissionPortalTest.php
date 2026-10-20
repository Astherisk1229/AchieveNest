<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Services\LocalEvidenceStorageService;
use App\Services\OsadPortfolioSubmissionPortalService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;
use RuntimeException;

final class OsadPortfolioSubmissionPortalTest extends CIUnitTestCase
{
    protected $db;
    private OsadPortfolioSubmissionPortalService $portals;
    private string $storageRoot;
    private string $adminId = '10000000-0000-4000-8000-000000000001';
    private string $eligibleStudentId = '20000000-0000-4000-8000-000000000001';
    private string $outsideNomineeId = '20000000-0000-4000-8000-000000000002';
    private string $unselectedStudentId = '20000000-0000-4000-8000-000000000003';
    private string $portalId = '30000000-0000-4000-8000-000000000001';
    private string $awardOneId = '60000000-0000-4000-8000-000000000001';
    private string $awardTwoId = '60000000-0000-4000-8000-000000000002';
    private string $unassignedAwardId = '60000000-0000-4000-8000-000000000003';

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = Database::connect('tests');
        // Profiles may be created by the shared test database bootstrap. Use unique IDs so
        // this fixture can coexist with those rows and avoid dropping the shared table.
        $this->adminId = $this->uuid();
        $this->eligibleStudentId = $this->uuid();
        $this->outsideNomineeId = $this->uuid();
        $this->unselectedStudentId = $this->uuid();
        $this->createSchema();
        $this->storageRoot = sys_get_temp_dir() . DIRECTORY_SEPARATOR . 'osad-portfolio-' . bin2hex(random_bytes(5)) . DIRECTORY_SEPARATOR;
        $this->portals = new OsadPortfolioSubmissionPortalService($this->db, new LocalEvidenceStorageService($this->storageRoot));
        $this->seedProfiles();
        foreach ([[$this->awardOneId, 'Campus Journalism'], [$this->awardTwoId, 'Leadership'], [$this->unassignedAwardId, 'Unassigned Award']] as [$id, $name]) $this->db->table('award_definitions')->insert(['id' => $id, 'name' => $name]);
        $today = new \DateTimeImmutable('today', new \DateTimeZone(config('App')->appTimezone ?? 'Asia/Manila'));
        $this->db->table('osad_portfolio_submission_portals')->insert(['id' => $this->portalId, 'title' => 'Award Portfolio', 'award_period' => $this->portals->activeAwardYear(), 'start_date' => $today->format('Y-m-d'), 'end_date' => $today->modify('+1 day')->format('Y-m-d'), 'status' => 'open', 'created_by' => $this->adminId]);
        foreach ([$this->awardOneId, $this->awardTwoId] as $awardId) $this->db->table('osad_portfolio_submission_portal_awards')->insert(['id' => '70000000-0000-4000-8000-' . substr($awardId, -12), 'portal_id' => $this->portalId, 'award_definition_id' => $awardId, 'assigned_by' => $this->adminId]);
        $this->portals->selectStudents($this->portalId, [$this->eligibleStudentId, $this->outsideNomineeId], $this->adminId, [$this->awardOneId, $this->awardTwoId]);
    }

    protected function tearDown(): void
    {
        foreach (['osad_portfolio_submission_events', 'osad_portfolio_submission_submission_awards', 'osad_portfolio_submission_portal_awards', 'osad_portfolio_submission_access_awards', 'osad_portfolio_submissions', 'osad_portfolio_submission_access', 'osad_portfolio_submission_portals', 'student_portfolio_evidence', 'student_portfolio_records', 'portfolio_subcategories', 'portfolio_categories', 'award_definitions'] as $table) {
            $this->db->query('DROP TABLE IF EXISTS db_' . $table);
        }
        $this->db->table('profiles')->whereIn('id', [
            $this->adminId, $this->eligibleStudentId, $this->outsideNomineeId, $this->unselectedStudentId,
        ])->delete();
        if (is_dir($this->storageRoot)) {
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($this->storageRoot, \FilesystemIterator::SKIP_DOTS), \RecursiveIteratorIterator::CHILD_FIRST);
            foreach ($iterator as $entry) $entry->isDir() ? @rmdir($entry->getPathname()) : @unlink($entry->getPathname());
            @rmdir($this->storageRoot);
        }
        parent::tearDown();
    }

    public function testCalculatedCandidateAndBelowThresholdNomineeHaveSameSubmissionAndStudentProjection(): void
    {
        // The source and score are intentionally not inputs to access. Both paths are explicit OSAD selections.
        $this->addPortfolioRecord($this->eligibleStudentId, 'Achievement from calculated-result path');
        $this->addPortfolioRecord($this->outsideNomineeId, 'Achievement from outside-nomination path');

        $calculated = $this->portals->studentPortal($this->portalId, $this->eligibleStudentId);
        $nominated = $this->portals->studentPortal($this->portalId, $this->outsideNomineeId);
        self::assertSame('Portfolio Submission', $calculated['portal']['name']);
        self::assertSame($calculated['portal']['name'], $nominated['portal']['name']);
        self::assertSame('draft', $calculated['portal']['status']);
        self::assertSame('draft', $nominated['portal']['status']);
        self::assertArrayNotHasKey('score', $calculated);
        self::assertArrayNotHasKey('candidate_status', $nominated);

        $calculatedFinal = $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->awardOneId]);
        $nominatedFinal = $this->portals->submit($this->portalId, $this->outsideNomineeId, [$this->awardOneId]);
        self::assertSame(1, $calculatedFinal['version']);
        self::assertSame(1, $nominatedFinal['version']);
        $calculatedSubmission = $this->portals->studentPortal($this->portalId, $this->eligibleStudentId)['submission'];
        self::assertCount(1, $calculatedSubmission['records']);
        self::assertArrayNotHasKey('score', $calculatedSubmission['records'][0]['details']);
        self::assertSame('University award', $calculatedSubmission['records'][0]['details']['recognition']);
        self::assertCount(1, $this->portals->studentPortal($this->portalId, $this->outsideNomineeId)['submission']['records']);

        try {
            $this->portals->studentPortal($this->portalId, $this->unselectedStudentId);
            self::fail('An unselected account must not access the portal.');
        } catch (RuntimeException $error) {
            self::assertSame('PORTAL_ACCESS_NOT_AVAILABLE', $error->getMessage());
        }
    }

    public function testStudentPortalAccessAndEditingFollowOsadSubmissionDates(): void
    {
        $today = new \DateTimeImmutable('today', new \DateTimeZone(config('App')->appTimezone ?? 'Asia/Manila'));
        $futureStart = $today->modify('+2 days')->format('Y-m-d');
        $futureEnd = $today->modify('+9 days')->format('Y-m-d');
        $this->db->table('osad_portfolio_submission_portals')->where('id', $this->portalId)->update(['start_date' => $futureStart, 'end_date' => $futureEnd]);

        self::assertSame([], $this->portals->listOpenStudentPortals($this->eligibleStudentId), 'A selected student must not see the portal before its start date.');
        try {
            $this->portals->studentPortal($this->portalId, $this->eligibleStudentId);
            self::fail('A selected student must not access the portal before its start date.');
        } catch (RuntimeException $error) {
            self::assertSame('PORTAL_ACCESS_NOT_AVAILABLE', $error->getMessage());
        }

        $this->db->table('osad_portfolio_submission_portals')->where('id', $this->portalId)->update([
            'start_date' => $today->modify('-1 day')->format('Y-m-d'),
            'end_date' => $today->modify('+1 day')->format('Y-m-d'),
        ]);
        self::assertCount(1, $this->portals->listOpenStudentPortals($this->eligibleStudentId));
        self::assertTrue($this->portals->studentPortal($this->portalId, $this->eligibleStudentId)['can_edit']);
        $this->addPortfolioRecord($this->eligibleStudentId, 'Submitted during the allowed period');
        $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->awardOneId]);

        $this->db->table('osad_portfolio_submission_portals')->where('id', $this->portalId)->update([
            'start_date' => $today->modify('-9 days')->format('Y-m-d'),
            'end_date' => $today->modify('-1 day')->format('Y-m-d'),
        ]);
        self::assertSame([], $this->portals->listOpenStudentPortals($this->outsideNomineeId), 'An unsubmitted student must lose access after the end date.');
        self::assertCount(1, $this->portals->listOpenStudentPortals($this->eligibleStudentId), 'A final portfolio remains available to view after the end date.');
        self::assertFalse($this->portals->studentPortal($this->portalId, $this->eligibleStudentId)['can_edit']);
        try {
            $this->portals->studentPortal($this->portalId, $this->outsideNomineeId);
            self::fail('An unsubmitted student must not access the portal after its end date.');
        } catch (RuntimeException $error) {
            self::assertSame('PORTAL_ACCESS_NOT_AVAILABLE', $error->getMessage());
        }
    }

    public function testSubmissionLocksDirectPortfolioAndEvidenceMutations(): void
    {
        $this->addPortfolioRecord($this->eligibleStudentId, 'Locked accomplishment');
        $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->awardOneId]);
        $policy = new \App\Services\Policies\StudentPortfolioPolicy($this->db);
        $actor = ['profile' => ['id' => $this->eligibleStudentId, 'account_type' => 'student', 'status' => 'active'], 'roles' => ['student']];
        $record = ['id' => '40000000-0000-4000-8000-000000000001', 'student_profile_id' => $this->eligibleStudentId, 'status' => 'draft'];
        self::assertFalse($policy->canCreate($actor));
        self::assertFalse($policy->canEdit($actor, $record));
        self::assertFalse($policy->canDelete($actor, $record));
        $evidencePolicy = new \App\Services\Policies\EvidencePolicy($policy, db: $this->db);
        self::assertFalse($evidencePolicy->canDeleteStudentEvidence($actor, ['id' => '50000000-0000-4000-8000-000000000001', 'student_profile_id' => $this->eligibleStudentId, 'portfolio_record_id' => $record['id']]));
    }

    public function testReopenAfterEvaluationRequiresExceptionAndResubmitsAsNewCurrentVersion(): void
    {
        $this->addPortfolioRecord($this->eligibleStudentId, 'Original accomplishment');
        $first = $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->awardOneId]);
        $this->portals->startEvaluation($this->portalId, $this->eligibleStudentId, $this->adminId);

        try {
            $this->portals->reopen($this->portalId, $this->eligibleStudentId, $this->adminId, 'Correct the uploaded file', false);
            self::fail('Reopening after evaluation must require explicit exception acknowledgement.');
        } catch (RuntimeException $error) {
            self::assertSame('EVALUATION_EXCEPTION_ACK_REQUIRED', $error->getMessage());
        }

        $reopened = $this->portals->reopen($this->portalId, $this->eligibleStudentId, $this->adminId, 'Correct the uploaded file', true);
        self::assertTrue($reopened['evaluation_exception']);
        $this->portals->updatePortalStatus($this->portalId, 'closed', $this->adminId);
        $this->db->table('student_portfolio_records')->where('student_profile_id', $this->eligibleStudentId)->update(['title' => 'Corrected accomplishment']);
        $second = $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->awardOneId]);

        self::assertSame(2, $second['version']);
        $history = $this->portals->submissionForOsad($this->portalId, $this->eligibleStudentId);
        self::assertSame('current', $history['versions'][0]['status']);
        self::assertSame(2, (int) $history['versions'][0]['version_number']);
        self::assertSame('superseded', $history['versions'][1]['status']);
        self::assertSame($first['submission_id'], $history['versions'][1]['id']);
        self::assertSame('Corrected accomplishment', $history['versions'][0]['snapshot']['records'][0]['title']);
        $reopenEvent = $this->db->table('osad_portfolio_submission_events')->where(['event_type' => 'reopened', 'student_profile_id' => $this->eligibleStudentId])->get()->getRowArray();
        self::assertSame($this->adminId, $reopenEvent['actor_profile_id']);
        self::assertSame('Correct the uploaded file', $reopenEvent['reason']);
        self::assertSame(1, (int) $reopenEvent['evaluation_exception']);
        self::assertCount(1, $this->portals->studentPortal($this->portalId, $this->eligibleStudentId)['submission']['records']);
    }

    public function testStudentCanSubmitOnePortfolioForSeveralAssignedAwardsButCannotTamperWithAwards(): void
    {
        $this->portals->assignStudentAwards($this->portalId, $this->outsideNomineeId, [$this->awardOneId], $this->adminId);
        self::assertSame([$this->awardOneId], array_column($this->portals->studentPortal($this->portalId, $this->outsideNomineeId)['awards'], 'id'));
        $this->addPortfolioRecord($this->eligibleStudentId, 'Shared award accomplishment');
        $studentView = $this->portals->studentPortal($this->portalId, $this->eligibleStudentId);
        self::assertSame([$this->awardOneId, $this->awardTwoId], array_column($studentView['awards'], 'id'));
        self::assertArrayNotHasKey('score', $studentView);

        try {
            $this->portals->submit($this->portalId, $this->eligibleStudentId, []);
            self::fail('The student must select at least one allowed award.');
        } catch (RuntimeException $error) {
            self::assertSame('AWARD_SELECTION_REQUIRED', $error->getMessage());
        }

        try {
            $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->unassignedAwardId]);
            self::fail('A student must not submit for an award OSAD did not assign.');
        } catch (RuntimeException $error) {
            self::assertSame('AWARD_NOT_ASSIGNED', $error->getMessage());
        }

        $final = $this->portals->submit($this->portalId, $this->eligibleStudentId, [$this->awardOneId, $this->awardTwoId]);
        self::assertSame(1, $final['version']);
        self::assertSame(1, $this->db->table('osad_portfolio_submissions')->where('portal_id', $this->portalId)->where('student_profile_id', $this->eligibleStudentId)->countAllResults());
        self::assertSame(2, $this->db->table('osad_portfolio_submission_submission_awards')->where('submission_id', $final['submission_id'])->countAllResults());

        $groups = $this->portals->portalDetails($this->portalId)['award_groups'];
        self::assertCount(2, $groups);
        foreach ($groups as $group) {
            self::assertCount(1, $group['students']);
            self::assertSame($this->eligibleStudentId, $group['students'][0]['student_profile_id']);
            self::assertSame($final['submission_id'], $group['students'][0]['submission_id']);
        }
    }

    public function testPortalIsCreatedOpenWithAwardSectionsAndSelectedStudents(): void
    {
        $awardYear = $this->portals->activeAwardYear();
        $portal = $this->portals->createPortal([
            'title' => 'Student Honors Portfolio',
            'award_year' => $awardYear,
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+1 day')),
            'awards' => [
                ['award_id' => $this->awardOneId, 'student_profile_ids' => [$this->eligibleStudentId]],
                ['award_id' => $this->awardTwoId, 'student_profile_ids' => [$this->eligibleStudentId, $this->outsideNomineeId]],
            ],
        ], $this->adminId);
        $portalId = $portal['portal']['id'];
        self::assertSame('open', $portal['portal']['status']);
        self::assertSame($awardYear, $portal['portal']['award_period']);
        try {
            $this->portals->updatePortalStatus($portalId, 'draft', $this->adminId);
            self::fail('Portal status must not be set to draft.');
        } catch (RuntimeException $error) {
            self::assertSame('INVALID_PORTAL_STATUS', $error->getMessage());
        }

        try {
            $this->portals->addPortalAward($portalId, $this->awardOneId, $this->adminId);
            self::fail('An award must not be added twice.');
        } catch (RuntimeException $error) {
            self::assertSame('PORTAL_AWARD_ALREADY_ADDED', $error->getMessage());
        }

        $details = $this->portals->portalDetails($portalId);
        self::assertCount(2, $details['award_groups']);
        $counts = [];
        foreach ($details['award_groups'] as $group) $counts[$group['award']['id']] = $group['selected_count'];
        self::assertSame(1, $counts[$this->awardOneId]);
        self::assertSame(2, $counts[$this->awardTwoId]);
        $calculatedStudent = array_values(array_filter($details['students'], fn(array $student): bool => $student['student_profile_id'] === $this->eligibleStudentId))[0];
        self::assertEqualsCanonicalizing([$this->awardOneId, $this->awardTwoId], array_column($calculatedStudent['awards'], 'id'));

        try {
            $this->portals->createPortal([
                'title' => 'Incomplete Portal',
                'award_year' => $awardYear,
                'start_date' => date('Y-m-d'),
                'end_date' => date('Y-m-d', strtotime('+1 day')),
                'awards' => [['award_id' => $this->awardOneId, 'student_profile_ids' => []]],
            ], $this->adminId);
            self::fail('A portal without selected students must not be created.');
        } catch (RuntimeException $error) {
            self::assertSame('PORTAL_ASSIGNMENTS_REQUIRED', $error->getMessage());
        }
        self::assertSame(2, $this->db->table('osad_portfolio_submission_portals')->countAllResults(), 'Failed setup should roll back without leaving a portal behind.');
    }

    public function testPortalAwardYearComesFromTheSystemAndCannotBeOverridden(): void
    {
        $activeYear = $this->portals->activeAwardYear();
        $previousStartYear = (int) substr($activeYear, 0, 4) - 1;
        $portal = $this->portals->createPortal([
            'title' => 'System Award Year',
            'award_year' => $previousStartYear . '-' . ($previousStartYear + 1),
            'start_date' => date('Y-m-d'),
            'end_date' => date('Y-m-d', strtotime('+1 day')),
            'awards' => [['award_id' => $this->awardOneId, 'student_profile_ids' => [$this->eligibleStudentId]]],
        ], $this->adminId);
        self::assertSame($activeYear, $portal['portal']['award_period']);
    }

    private function createSchema(): void
    {
        $ddl = [
            'CREATE TABLE db_profiles (id TEXT PRIMARY KEY, full_name TEXT, institutional_id TEXT, account_type TEXT, status TEXT, last_name TEXT, first_name TEXT)',
            'CREATE TABLE db_award_definitions (id TEXT PRIMARY KEY, name TEXT)',
            'CREATE TABLE db_osad_portfolio_submission_portals (id TEXT PRIMARY KEY, award_definition_id TEXT, title TEXT, award_period TEXT, start_date TEXT, end_date TEXT, status TEXT, created_by TEXT, updated_by TEXT, created_at TEXT, updated_at TEXT, closed_at TEXT)',
            'CREATE TABLE db_osad_portfolio_submission_portal_awards (id TEXT PRIMARY KEY, portal_id TEXT, award_definition_id TEXT, assigned_by TEXT, assigned_at TEXT)',
            'CREATE TABLE db_osad_portfolio_submission_access (id TEXT PRIMARY KEY, portal_id TEXT, student_profile_id TEXT, access_status TEXT, submission_state TEXT, selected_by TEXT, selected_at TEXT, current_submission_id TEXT, evaluation_started_at TEXT, updated_at TEXT)',
            'CREATE TABLE db_osad_portfolio_submission_access_awards (id TEXT PRIMARY KEY, access_id TEXT, award_definition_id TEXT, assigned_by TEXT, assigned_at TEXT)',
            'CREATE TABLE db_osad_portfolio_submissions (id TEXT PRIMARY KEY, portal_id TEXT, student_profile_id TEXT, version_number INTEGER, snapshot_json TEXT, status TEXT, submitted_by TEXT, submitted_at TEXT)',
            'CREATE TABLE db_osad_portfolio_submission_submission_awards (id TEXT PRIMARY KEY, submission_id TEXT, award_definition_id TEXT, selected_at TEXT)',
            'CREATE TABLE db_osad_portfolio_submission_events (id TEXT PRIMARY KEY, portal_id TEXT, student_profile_id TEXT, submission_id TEXT, actor_profile_id TEXT, event_type TEXT, reason TEXT, evaluation_exception INTEGER, occurred_at TEXT)',
            'CREATE TABLE db_portfolio_categories (id TEXT PRIMARY KEY, name TEXT)',
            'CREATE TABLE db_portfolio_subcategories (id TEXT PRIMARY KEY, name TEXT)',
            'CREATE TABLE db_student_portfolio_records (id TEXT PRIMARY KEY, student_profile_id TEXT, title TEXT, organizer_or_body TEXT, occurrence_date TEXT, start_date TEXT, end_date TEXT, description TEXT, structured_metadata TEXT, status TEXT, submitted_at TEXT, verified_at TEXT, created_at TEXT, category_id TEXT, subcategory_id TEXT)',
            'CREATE TABLE db_student_portfolio_evidence (id TEXT PRIMARY KEY, portfolio_record_id TEXT, status TEXT, uploaded_at TEXT)',
        ];
        foreach ($ddl as $sql) {
            $this->db->query(str_replace('CREATE TABLE ', 'CREATE TABLE IF NOT EXISTS ', $sql));
        }
    }

    private function uuid(): string
    {
        return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
    }

    private function seedProfiles(): void
    {
        foreach ([[$this->adminId, 'OSAD Admin', 'osad_admin'], [$this->eligibleStudentId, 'Calculated Student', 'student'], [$this->outsideNomineeId, 'Outside Nominee', 'student'], [$this->unselectedStudentId, 'Unselected Student', 'student']] as [$id, $name, $type]) {
            $profile = ['id' => $id, 'full_name' => $name, 'institutional_id' => strtoupper(substr($id, -8)), 'account_type' => $type, 'status' => 'active'];
            if ($this->db->fieldExists('email', 'profiles')) $profile['email'] = $id . '@test.invalid';
            $this->db->table('profiles')->insert($profile);
        }
    }

    private function addPortfolioRecord(string $studentId, string $title): void
    {
        $this->db->table('student_portfolio_records')->insert([
            'id' => '40000000-0000-4000-8000-' . substr($studentId, -12), 'student_profile_id' => $studentId, 'title' => $title,
            'organizer_or_body' => 'University', 'occurrence_date' => '2026-06-01', 'start_date' => '2026-06-01', 'end_date' => null,
            'description' => 'Portfolio accomplishment', 'structured_metadata' => '{"score":99,"recognition":"University award"}', 'status' => 'verified',
            'submitted_at' => '2026-06-02', 'verified_at' => '2026-06-03', 'created_at' => '2026-06-01', 'category_id' => null, 'subcategory_id' => null,
        ]);
    }
}
