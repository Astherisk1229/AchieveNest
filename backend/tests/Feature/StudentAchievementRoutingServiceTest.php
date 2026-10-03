<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Services\StudentAchievementRoutingService;
use App\Services\StudentAchievementFormSchemaRegistry;
use PHPUnit\Framework\TestCase;

#[\PHPUnit\Framework\Attributes\Group('manual-proof')]
final class StudentAchievementRoutingServiceTest extends TestCase
{
    public static function setUpBeforeClass(): void
    {
        \Tests\Support\ManualProofGate::requireOptIn(false);
        parent::setUpBeforeClass();
    }

    private $db;
    private array $fixture;
    private string $recordId;
    private string $versionId;

    protected function setUp(): void
    {
        parent::setUp();
        $this->db = db_connect('local_defense');
        $dbConfig = new \Config\Database();
        $dbConfig->tests = $dbConfig->local_defense;
        $dbConfig->default = $dbConfig->local_defense;
        $dbConfig->defaultGroup = 'local_defense';
        \CodeIgniter\Config\Factories::injectMock(
            'config',
            'Database',
            $dbConfig
        );

        $this->fixture = $this->db
            ->table('student_program_enrollments spe')
            ->select(
                'spe.student_profile_id, spe.academic_program_id, '
                . 'pca.id AS assignment_id, '
                . 'pca.personnel_profile_id AS coordinator_profile_id'
            )
            ->join(
                'program_coordinator_assignments pca',
                'pca.academic_program_id = spe.academic_program_id '
                . 'AND pca.is_active = 1'
            )
            ->join(
                'profiles p',
                "p.id = pca.personnel_profile_id AND p.status = 'active'"
            )
            ->where('spe.is_active', 1)
            ->get(1)
            ->getRowArray();

        self::assertNotEmpty(
            $this->fixture,
            'Routing test requires one active student/program/coordinator fixture.'
        );

        $this->recordId = $this->uuid();
        $this->versionId = $this->uuid();
        $now = date('Y-m-d H:i:s');

        $this->db->transBegin();
        $this->db->table('achievement_records')->insert([
            'id' => $this->recordId,
            'owner_profile_id' => $this->fixture['student_profile_id'],
            'owner_domain' => 'STUDENT',
            'current_version_id' => null,
            'canonical_status' => 'active',
            'created_by_profile_id' => $this->fixture['student_profile_id'],
            'created_at' => $now,
            'updated_at' => $now,
        ]);
        $this->db->table('achievement_record_versions')->insert([
            'id' => $this->versionId,
            'achievement_record_id' => $this->recordId,
            'version_number' => 1,
            'previous_version_id' => null,
            'contract_code' => 'S01-SSG',
            'submission_state' => 'draft',
            'source_type' => 'OWNER_ENTRY',
            'created_by_profile_id' => $this->fixture['student_profile_id'],
            'revision_token' => 1,
            'created_at' => $now,
        ]);
        $this->db->table('achievement_records')
            ->where('id', $this->recordId)
            ->update(['current_version_id' => $this->versionId]);
    }

    protected function tearDown(): void
    {
        $this->db->transRollback();
        parent::tearDown();
    }

    public function testMissingCoordinatorPersistsThenRoutesExactlyOnce(): void
    {
        $this->db->table('program_coordinator_assignments')
            ->where('id', $this->fixture['assignment_id'])
            ->update(['is_active' => 0]);

        $service = new StudentAchievementRoutingService($this->db);
        $pending = $service->routeSubmittedVersion($this->versionId);

        self::assertSame('routing_pending', $pending['submission_state']);
        self::assertSame(
            'NO_ACTIVE_AUTHORIZED_PROGRAM_COORDINATOR',
            $pending['reason_code']
        );
        self::assertNull($pending['coordinator_profile_id']);
        self::assertSame(
            'routing_pending',
            $this->version()['submission_state']
        );
        self::assertSame(1, $this->routeCount());
        self::assertSame(1, $this->eventCount());

        $this->db->table('program_coordinator_assignments')
            ->where('id', $this->fixture['assignment_id'])
            ->update(['is_active' => 1]);

        $routed = $service->routeSubmittedVersion($this->versionId);

        self::assertSame('submitted', $routed['submission_state']);
        self::assertSame('routed', $routed['routing_status']);
        self::assertSame(
            $this->fixture['coordinator_profile_id'],
            $routed['coordinator_profile_id']
        );
        self::assertSame(1, $this->routeCount());
        self::assertSame(2, $this->eventCount());

        $retry = $service->routeSubmittedVersion($this->versionId);
        self::assertFalse($retry['changed']);
        self::assertSame(1, $this->routeCount());
        self::assertSame(2, $this->eventCount());
    }

    public function testLiveActiveContractCatalogMatchesRendererRegistry(): void
    {
        $rows = $this->db->table('achievement_contracts')
            ->select('contract_code, display_name, category_code')
            ->where('domain', 'STUDENT')
            ->where('is_active', 1)
            ->get()
            ->getResultArray();

        (new StudentAchievementFormSchemaRegistry())
            ->assertMatchesActiveContractRows($rows);

        self::assertCount(57, $rows);
    }

    private function version(): array
    {
        return $this->db->table('achievement_record_versions')
            ->where('id', $this->versionId)
            ->get()
            ->getRowArray();
    }

    private function routeCount(): int
    {
        return $this->db
            ->table('student_achievement_verification_routes')
            ->where('record_version_id', $this->versionId)
            ->countAllResults();
    }

    private function eventCount(): int
    {
        return $this->db
            ->table('student_achievement_routing_events')
            ->where('record_version_id', $this->versionId)
            ->countAllResults();
    }

    private function uuid(): string
    {
        $data = random_bytes(16);
        $data[6] = chr((ord($data[6]) & 0x0f) | 0x40);
        $data[8] = chr((ord($data[8]) & 0x3f) | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(
            bin2hex($data),
            4
        ));
    }
}
