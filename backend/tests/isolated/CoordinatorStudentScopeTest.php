<?php
namespace Tests\Isolated;

use App\Services\Policies\StudentPortfolioPolicy;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/**
 * PC-3 / C1: a Program Coordinator sees, reviews and verifies only students
 * actively enrolled in the program they coordinate. SQLite :memory:.
 */
final class CoordinatorStudentScopeTest extends CIUnitTestCase
{
    private $sqlite;
    private StudentPortfolioPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        $db = $this->sqlite;
        $db->query('CREATE TABLE academic_programs (id TEXT PRIMARY KEY, college_id TEXT, status TEXT)');
        $db->query('CREATE TABLE student_program_enrollments (student_profile_id TEXT, academic_program_id TEXT, is_active INTEGER, effective_from TEXT)');
        $db->query('CREATE TABLE student_portfolio_records (id TEXT PRIMARY KEY, student_profile_id TEXT, status TEXT)');
        $db->table('academic_programs')->insertBatch([
            ['id' => 'BSIT', 'college_id' => 'CICT', 'status' => 'active'],
            ['id' => 'BSN', 'college_id' => 'CHS', 'status' => 'active'],
        ]);
        $db->table('student_program_enrollments')->insertBatch([
            ['student_profile_id' => 'S-IT', 'academic_program_id' => 'BSIT', 'is_active' => 1, 'effective_from' => '2025-06-01'],
            ['student_profile_id' => 'S-NURSE', 'academic_program_id' => 'BSN', 'is_active' => 1, 'effective_from' => '2025-06-01'],
            // Shifted out of BSIT: only the inactive enrollment points at BSIT.
            ['student_profile_id' => 'S-SHIFTED', 'academic_program_id' => 'BSIT', 'is_active' => 0, 'effective_from' => '2024-06-01'],
            ['student_profile_id' => 'S-SHIFTED', 'academic_program_id' => 'BSN', 'is_active' => 1, 'effective_from' => '2025-06-01'],
        ]);
        $db->table('student_portfolio_records')->insertBatch([
            ['id' => 'R1', 'student_profile_id' => 'S-IT', 'status' => 'submitted'],
            ['id' => 'R2', 'student_profile_id' => 'S-NURSE', 'status' => 'submitted'],
            ['id' => 'R3', 'student_profile_id' => 'S-SHIFTED', 'status' => 'submitted'],
            ['id' => 'R4', 'student_profile_id' => 'S-IT', 'status' => 'draft'],
        ]);
        $this->policy = new StudentPortfolioPolicy($db);
    }

    protected function tearDown(): void { $this->sqlite?->close(); parent::tearDown(); }

    private function coordinator(string $program): array
    {
        return ['profile' => ['id' => 'PC-' . $program, 'account_type' => 'personnel'], 'roles' => ['program_coordinator'],
            'assignments' => [['role_key' => 'program_coordinator', 'scope_type' => 'academic_program', 'scope_id' => $program]]];
    }

    private function listed(array $actor): array
    {
        $builder = $this->sqlite->table('student_portfolio_records spr')->select('spr.id')->orderBy('spr.id');
        $this->policy->scopeListQuery($actor, $builder);
        return array_column($builder->get()->getResultArray(), 'id');
    }

    public function testListShowsOnlyOwnProgramAndNoDrafts(): void
    {
        self::assertSame(['R1'], $this->listed($this->coordinator('BSIT')));
        self::assertSame(['R2', 'R3'], $this->listed($this->coordinator('BSN')));
    }

    public function testVerificationQueueIsScopedTheSameWay(): void
    {
        $builder = $this->sqlite->table('student_portfolio_records spr')->select('spr.id')->where('spr.status', 'submitted')->orderBy('spr.id');
        $this->policy->scopeVerificationQuery($this->coordinator('BSIT'), $builder);
        self::assertSame(['R1'], array_column($builder->get()->getResultArray(), 'id'));
    }

    public function testCannotViewOrVerifyAnotherProgramsStudent(): void
    {
        $it = $this->coordinator('BSIT');
        self::assertTrue($this->policy->canView($it, ['student_profile_id' => 'S-IT', 'status' => 'submitted']));
        self::assertTrue($this->policy->canVerify($it, ['student_profile_id' => 'S-IT', 'status' => 'submitted']));
        self::assertFalse($this->policy->canView($it, ['student_profile_id' => 'S-NURSE', 'status' => 'submitted']));
        self::assertFalse($this->policy->canVerify($it, ['student_profile_id' => 'S-NURSE', 'status' => 'submitted']));
        self::assertFalse($this->policy->canView($it, ['student_profile_id' => 'S-SHIFTED', 'status' => 'submitted']), 'past enrollment gives no access');
        self::assertFalse($this->policy->canView($it, ['student_profile_id' => 'S-IT', 'status' => 'draft']), 'drafts stay private');
    }

    public function testPersonnelWithoutAssignmentSeesNothing(): void
    {
        $nobody = ['profile' => ['id' => 'X', 'account_type' => 'personnel'], 'roles' => ['program_coordinator'], 'assignments' => []];
        self::assertSame([], $this->listed($nobody));
        self::assertFalse($this->policy->canView($nobody, ['student_profile_id' => 'S-IT', 'status' => 'submitted']));
    }
}
