<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Controllers\Api\PersonnelAccomplishmentController;
use App\Services\AuthorizationService;
use App\Services\CanonicalPersonnelAccomplishmentService;
use App\Services\LockedCriterionResolverService;
use App\Services\RubricAdministrationService;
use CodeIgniter\HTTP\IncomingRequest;
use CodeIgniter\HTTP\URI;
use CodeIgniter\HTTP\UserAgent;
use PHPUnit\Framework\TestCase;
use RuntimeException;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class CanonicalPersonnelAccomplishmentPersistenceTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private const PROFILE_ID = 'c7a00000-0000-4000-8000-000000000001';
    private const NTF_PROFILE_ID = 'c7a00000-0000-4000-8000-000000000002';
    private const EMAIL = 'canonical.a3.fixture@ndmu.edu.ph';
    private $db;

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $dbConfig = new \Config\Database();
        $dbConfig->tests = $dbConfig->local_defense;
        $dbConfig->default = $dbConfig->local_defense;
        $dbConfig->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock('config', 'Database', $dbConfig);
        $ref = new \ReflectionClass(\Config\Database::class);
        $instances = $ref->getProperty('instances');
        $current = $instances->getValue();
        $current['default'] = $this->db;
        $current['tests'] = $this->db;
        $current['local_defense'] = $this->db;
        $instances->setValue(null, $current);
        $this->cleanup();
        $now = date('Y-m-d H:i:s');
        $this->db->table('profiles')->insert([
            'id' => self::PROFILE_ID,
            'institutional_id' => 'CANONICAL-A3-TEST',
            'email' => self::EMAIL,
            'full_name' => 'Canonical A3 Test Faculty',
            'account_type' => 'personnel',
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->db->table('personnel_profiles')->insert([
            'profile_id' => self::PROFILE_ID,
            'personnel_classification' => 'academic',
            'employment_status' => 'permanent',
            'employment_start_date' => '2020-01-01',
            'rank_level' => 1,
            'personnel_group' => 'FACULTY',
            'organizational_side' => 'academic',
            'faculty_engagement' => 'full_time_faculty',
            'position_title' => 'Instructor',
            'current_rank_title' => 'Instructor I',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->db->table('profiles')->insert([
            'id' => self::NTF_PROFILE_ID,
            'institutional_id' => 'CANONICAL-NTF-TEST',
            'email' => 'canonical.ntf.fixture@ndmu.edu.ph',
            'full_name' => 'Canonical NTF Test Personnel',
            'account_type' => 'personnel',
            'status' => 'active',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->db->table('personnel_profiles')->insert([
            'profile_id' => self::NTF_PROFILE_ID,
            'personnel_classification' => 'non_academic',
            'employment_status' => 'permanent',
            'employment_start_date' => '2020-01-01',
            'rank_level' => 1,
            'personnel_group' => 'NON_TEACHING_FACULTY',
            'organizational_side' => 'non_academic',
            'position_title' => 'Administrative Assistant',
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        self::assertSame(1, $this->db->table('achievement_contracts')->where([
            'contract_code' => 'FAC-A3', 'domain' => 'FACULTY', 'is_active' => 1,
        ])->countAllResults());
        self::assertSame(1, $this->db->table('achievement_contracts')->where([
            'contract_code' => 'NTF-B1A', 'domain' => 'NTP', 'is_active' => 1,
        ])->countAllResults());
    }

    protected function tearDown(): void
    {
        $this->cleanup();
        parent::tearDown();
    }

    public function testCreatePersistsOneCompatibilityRowAndOneCanonicalA3Graph(): void
    {
        $controller = new PersonnelAccomplishmentController(
            $this->authz(),
            null,
            new CanonicalPersonnelAccomplishmentService($this->db)
        );
        $this->initController($controller, $this->request($this->payload()));
        $response = $controller->create();

        self::assertSame(201, $response->getStatusCode());
        $body = json_decode((string) $response->getBody(), true);
        $legacyId = $body['data']['id'] ?? null;
        self::assertNotEmpty($legacyId);
        self::assertSame('draft', $body['data']['status'] ?? null);

        $legacy = $this->db->table('personnel_accomplishments')->where('id', $legacyId)->get()->getRowArray();
        self::assertSame(self::PROFILE_ID, $legacy['personnel_profile_id'] ?? null);
        self::assertSame('A.3', $legacy['category_code'] ?? null);

        $crosswalks = $this->db->table('achievement_legacy_crosswalk')->where([
            'legacy_table' => 'personnel_accomplishments',
            'legacy_id' => $legacyId,
        ])->get()->getResultArray();
        self::assertCount(1, $crosswalks);
        $crosswalk = $crosswalks[0];
        self::assertSame('FAC-A3', $crosswalk['mapped_contract_code']);

        $roots = $this->db->table('achievement_records')->where('owner_profile_id', self::PROFILE_ID)->get()->getResultArray();
        self::assertCount(1, $roots);
        self::assertSame('PERSONNEL', $roots[0]['owner_domain']);
        self::assertSame($crosswalk['achievement_record_id'], $roots[0]['id']);
        self::assertSame($crosswalk['record_version_id'], $roots[0]['current_version_id']);

        $versions = $this->db->table('achievement_record_versions')->where('achievement_record_id', $roots[0]['id'])->get()->getResultArray();
        self::assertCount(1, $versions);
        self::assertSame(1, (int) $versions[0]['version_number']);
        self::assertSame('FAC-A3', $versions[0]['contract_code']);
        self::assertSame('draft', $versions[0]['submission_state']);
        self::assertSame('OWNER_ENTRY', $versions[0]['source_type']);
        self::assertSame(self::PROFILE_ID, $versions[0]['created_by_profile_id']);

        $details = $this->db->table('personnel_seminar_training_attendance_details')->where('record_version_id', $versions[0]['id'])->get()->getResultArray();
        self::assertCount(1, $details);
        self::assertSame('2026-09-10', $details[0]['start_date']);
        self::assertSame('2026-09-11', $details[0]['end_date']);
        self::assertSame('R7 Canonical Academic Seminar', $details[0]['title']);
        self::assertSame('Notre Dame of Marbel University', $details[0]['conducted_or_organized_by']);
        self::assertSame('Focused canonical persistence fixture.', $details[0]['remarks']);

        // The active submission path still discovers the compatibility row,
        // while its locked A.3 category-level lookup resolves against the
        // governed Faculty scale without requiring a criterion row.
        self::assertSame(1, $this->db->table('personnel_accomplishments')->where([
            'personnel_profile_id' => self::PROFILE_ID,
            'category_code' => 'A.3',
        ])->countAllResults());
        $snapshot = (new RubricAdministrationService($this->db))->getScaleVersionHierarchy('ver-admin-2025-001');
        $locked = (new LockedCriterionResolverService())->resolve($snapshot, 'A.3', $this->payload()['category_metadata']);
        self::assertSame('A3_ATTENDANCE', $locked['criterion_reference']);
        self::assertSame(3.0, $locked['configured_points']);
    }

    public function testTypedDetailFailureRollsBackTheEntireGraph(): void
    {
        $failingService = new class($this->db) extends CanonicalPersonnelAccomplishmentService {
            protected function insertTypedDetail(string $versionId, array $detail): void
            {
                throw new RuntimeException('FORCED_TYPED_DETAIL_FAILURE');
            }
        };
        $controller = new PersonnelAccomplishmentController($this->authz(), null, $failingService);
        $this->initController($controller, $this->request($this->payload('Rollback')));
        $response = $controller->create();

        self::assertSame(500, $response->getStatusCode());
        self::assertSame(0, $this->db->table('personnel_accomplishments')->where('personnel_profile_id', self::PROFILE_ID)->countAllResults());
        self::assertSame(0, $this->db->table('achievement_records')->where('owner_profile_id', self::PROFILE_ID)->countAllResults());
        self::assertSame(0, $this->db->table('achievement_record_versions v')->join('achievement_records r', 'r.id=v.achievement_record_id')->where('r.owner_profile_id', self::PROFILE_ID)->countAllResults());
        self::assertSame(0, $this->db->table('achievement_legacy_crosswalk')->where('mapped_by_profile_id', self::PROFILE_ID)->countAllResults());
    }

    /** @dataProvider validNtfRoles */
    public function testCreatePersistsOneCanonicalNtfB1AGraph(string $role): void
    {
        $controller = new PersonnelAccomplishmentController(
            $this->authz(self::NTF_PROFILE_ID),
            null,
            new CanonicalPersonnelAccomplishmentService($this->db)
        );
        $this->initController($controller, $this->request($this->ntfPayload($role)));
        $response = $controller->create();

        self::assertSame(201, $response->getStatusCode());
        $legacyId = json_decode((string) $response->getBody(), true)['data']['id'] ?? '';
        self::assertNotSame('', $legacyId);
        self::assertSame(1, $this->db->table('personnel_accomplishments')->where('id', $legacyId)->countAllResults());

        $crosswalks = $this->db->table('achievement_legacy_crosswalk')->where([
            'legacy_table' => 'personnel_accomplishments', 'legacy_id' => $legacyId,
        ])->get()->getResultArray();
        self::assertCount(1, $crosswalks);
        self::assertSame('NTF-B1A', $crosswalks[0]['mapped_contract_code']);

        $root = $this->db->table('achievement_records')->where('id', $crosswalks[0]['achievement_record_id'])->get()->getRowArray();
        self::assertSame(self::NTF_PROFILE_ID, $root['owner_profile_id']);
        self::assertSame('PERSONNEL', $root['owner_domain']);
        self::assertSame($crosswalks[0]['record_version_id'], $root['current_version_id']);

        $versions = $this->db->table('achievement_record_versions')->where('achievement_record_id', $root['id'])->get()->getResultArray();
        self::assertCount(1, $versions);
        self::assertSame(1, (int) $versions[0]['version_number']);
        self::assertSame('NTF-B1A', $versions[0]['contract_code']);
        self::assertSame(self::NTF_PROFILE_ID, $versions[0]['created_by_profile_id']);

        $details = $this->db->table('personnel_moderator_assignment_details')->where('record_version_id', $versions[0]['id'])->get()->getResultArray();
        self::assertCount(1, $details);
        self::assertSame('RANGE', $details[0]['period_precision']);
        self::assertSame(2026, (int) $details[0]['period_start_year']);
        self::assertSame(2026, (int) $details[0]['period_end_year']);
        self::assertSame($role, $details[0]['assignment_role']);
        self::assertSame('NDMU Administrative Personnel Association', $details[0]['clubs_organizations']);
        self::assertSame('Notre Dame of Marbel University', $details[0]['conducted_or_organized_by']);

        self::assertSame(0, $this->db->table('achievement_records')->where('owner_profile_id', self::PROFILE_ID)->countAllResults());
    }

    public static function validNtfRoles(): array
    {
        return [['MODERATOR'], ['OFFICER']];
    }

    /** @dataProvider invalidNtfPayloads */
    public function testNtfValidationRejectsInvalidOrIncompletePayload(array $payload): void
    {
        $controller = new PersonnelAccomplishmentController($this->authz(self::NTF_PROFILE_ID), null, new CanonicalPersonnelAccomplishmentService($this->db));
        $this->initController($controller, $this->request($payload));
        $response = $controller->create();

        self::assertSame(422, $response->getStatusCode());
        self::assertSame(0, $this->db->table('personnel_accomplishments')->where('personnel_profile_id', self::NTF_PROFILE_ID)->countAllResults());
        self::assertSame(0, $this->db->table('achievement_records')->where('owner_profile_id', self::NTF_PROFILE_ID)->countAllResults());
    }

    public static function invalidNtfPayloads(): array
    {
        $invalidRole = self::ntfPayloadStatic('CHAIRPERSON');
        $missingOrganization = self::ntfPayloadStatic('MODERATOR');
        unset($missingOrganization['category_metadata']['details']['organization']);
        return [[$invalidRole], [$missingOrganization]];
    }

    public function testNtfTypedDetailFailureRollsBackEntireGraph(): void
    {
        $service = new class($this->db) extends CanonicalPersonnelAccomplishmentService {
            protected function insertNtfB1ADetail(string $versionId, array $detail): void
            {
                throw new RuntimeException('FORCED_NTF_TYPED_DETAIL_FAILURE');
            }
        };
        $controller = new PersonnelAccomplishmentController($this->authz(self::NTF_PROFILE_ID), null, $service);
        $this->initController($controller, $this->request($this->ntfPayload('MODERATOR')));
        self::assertSame(500, $controller->create()->getStatusCode());
        self::assertSame(0, $this->db->table('personnel_accomplishments')->where('personnel_profile_id', self::NTF_PROFILE_ID)->countAllResults());
        self::assertSame(0, $this->db->table('achievement_records')->where('owner_profile_id', self::NTF_PROFILE_ID)->countAllResults());
        self::assertSame(0, $this->db->table('achievement_legacy_crosswalk')->where('mapped_by_profile_id', self::NTF_PROFILE_ID)->countAllResults());
    }

    public function testNtfDuplicateRequestDoesNotCreateSecondGraph(): void
    {
        $controller = new PersonnelAccomplishmentController($this->authz(self::NTF_PROFILE_ID), null, new CanonicalPersonnelAccomplishmentService($this->db));
        $this->initController($controller, $this->request($this->ntfPayload('MODERATOR')));
        self::assertSame(201, $controller->create()->getStatusCode());

        $second = new PersonnelAccomplishmentController($this->authz(self::NTF_PROFILE_ID), null, new CanonicalPersonnelAccomplishmentService($this->db));
        $this->initController($second, $this->request($this->ntfPayload('MODERATOR')));
        $secondResponse = $second->create();
        self::assertSame(409, $secondResponse->getStatusCode(), (string) $secondResponse->getBody());
        self::assertSame(1, $this->db->table('personnel_accomplishments')->where('personnel_profile_id', self::NTF_PROFILE_ID)->countAllResults());
        self::assertSame(1, $this->db->table('achievement_records')->where('owner_profile_id', self::NTF_PROFILE_ID)->countAllResults());
    }

    public function testNonTeachingPersonnelCannotCreateAreaAAccomplishment(): void
    {
        $controller = new PersonnelAccomplishmentController($this->authz(self::NTF_PROFILE_ID), null, new CanonicalPersonnelAccomplishmentService($this->db));
        $this->initController($controller, $this->request($this->payload('forbidden-ntf-area-a')));

        $response = $controller->create();

        self::assertSame(403, $response->getStatusCode(), (string) $response->getBody());
        self::assertStringContainsString('AREA_NOT_OPEN_TO_PERSONNEL', (string) $response->getBody());
        self::assertSame(0, $this->db->table('personnel_accomplishments')->where('personnel_profile_id', self::NTF_PROFILE_ID)->countAllResults());
    }

    private function payload(string $suffix = ''): array
    {
        $title = trim('R7 Canonical Academic Seminar ' . $suffix);
        return [
            'title' => $title,
            'category' => 'A.3 Attendance to Seminar / Workshop / Training',
            'category_area' => 'areaA',
            'description' => 'Focused canonical persistence fixture.',
            'issuer' => 'Notre Dame of Marbel University',
            'date_achieved' => '2026-09-11',
            'category_metadata' => [
                'portfolio_format' => 'faculty_academic',
                'criterion_code' => 'A.3',
                'subcategory_code' => 'A3_ATTENDANCE',
                'faculty_confirmed_category' => true,
                'date_mode' => 'range',
                'start_date' => '2026-09-10',
                'end_date' => '2026-09-11',
                'ongoing' => false,
                'details' => [
                    'title' => $title,
                    'organizer' => 'Notre Dame of Marbel University',
                    'scope' => 'In-House',
                ],
            ],
        ];
    }

    private function ntfPayload(string $role): array
    {
        return self::ntfPayloadStatic($role);
    }

    private static function ntfPayloadStatic(string $role): array
    {
        return [
            'title' => 'R7 NTF Moderator Assignment',
            'category' => 'B.1.a Moderator or Officer of Clubs',
            'category_area' => 'areaB',
            'description' => 'Focused NTF canonical persistence fixture.',
            'issuer' => 'Notre Dame of Marbel University',
            'date_achieved' => '2026-09-20',
            'category_metadata' => [
                'portfolio_format' => 'non_teaching_faculty',
                'contract_code' => 'NTF-B1A',
                'criterion_code' => 'B.1.a',
                'subcategory_code' => 'NTF_B1A_MODERATOR_OFFICER',
                'date_mode' => 'range',
                'start_date' => '2026-09-01',
                'end_date' => '2026-09-20',
                'ongoing' => false,
                'details' => [
                    'organization' => 'NDMU Administrative Personnel Association',
                    'assignment_role' => $role,
                    'organizer' => 'Notre Dame of Marbel University',
                ],
            ],
        ];
    }

    private function authz(string $profileId = self::PROFILE_ID): AuthorizationService
    {
        $email = $profileId === self::PROFILE_ID ? self::EMAIL : 'canonical.ntf.fixture@ndmu.edu.ph';
        $actor = [
            'profile' => ['id' => $profileId, 'email' => $email, 'account_type' => 'personnel', 'status' => 'active'],
            'id' => $profileId,
            'role' => 'personnel',
            'roles' => ['personnel'],
            'active_role' => 'personnel',
            'account_type' => 'personnel',
        ];
        return new class($actor) extends AuthorizationService {
            public function __construct(private array $actorData) { parent::__construct(); }
            public function resolveActor(?string $authorizationHeader = null): ?array { return $this->actorData; }
        };
    }

    private function request(array $body): IncomingRequest
    {
        $request = new IncomingRequest(new \Config\App(), new URI('http://localhost/api/v1/personnel/accomplishments'), null, new UserAgent());
        $request->setMethod('POST');
        $request->setBody(json_encode($body));
        $request->setHeader('Content-Type', 'application/json');
        $request->setHeader('Authorization', 'Bearer fake-token');
        return $request;
    }

    private function initController(PersonnelAccomplishmentController $controller, IncomingRequest $request): void
    {
        $response = \Config\Services::response();
        $response->setStatusCode(200);
        $response->setBody('');
        $controller->initController($request, $response, \Config\Services::logger());
    }

    private function cleanup(): void
    {
        $profileIds = [self::PROFILE_ID, self::NTF_PROFILE_ID];
        $rootIds = array_column($this->db->table('achievement_records')->select('id')->whereIn('owner_profile_id', $profileIds)->get()->getResultArray(), 'id');
        $versionIds = $rootIds === [] ? [] : array_column($this->db->table('achievement_record_versions')->select('id')->whereIn('achievement_record_id', $rootIds)->get()->getResultArray(), 'id');
        $this->db->table('achievement_legacy_crosswalk')->whereIn('mapped_by_profile_id', $profileIds)->delete();
        if ($versionIds !== []) $this->db->table('personnel_seminar_training_attendance_details')->whereIn('record_version_id', $versionIds)->delete();
        if ($versionIds !== []) $this->db->table('personnel_moderator_assignment_details')->whereIn('record_version_id', $versionIds)->delete();
        if ($rootIds !== []) $this->db->table('achievement_records')->whereIn('id', $rootIds)->update(['current_version_id' => null]);
        if ($versionIds !== []) $this->db->table('achievement_record_versions')->whereIn('id', $versionIds)->delete();
        if ($rootIds !== []) $this->db->table('achievement_records')->whereIn('id', $rootIds)->delete();
        $this->db->table('personnel_accomplishments')->whereIn('personnel_profile_id', $profileIds)->delete();
        $this->db->table('personnel_profiles')->whereIn('profile_id', $profileIds)->delete();
        $this->db->table('profiles')->whereIn('id', $profileIds)->delete();
    }
}
