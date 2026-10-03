<?php
namespace Tests\Isolated;

use App\Services\AuthorityRankingRosterService;
use App\Services\OrganizationalAuthorityResolver;
use App\Services\PersonnelEligibilityService;
use CodeIgniter\Test\CIUnitTestCase;
use Config\Database;

/**
 * Faculty who hold an active Dean assignment are routed to HR (annual review and
 * portfolio evaluation), and HR gets a read-only institution-wide Faculty roster on
 * the Annual Reviews tab without gaining Dean-owned upload authority.
 * SQLite :memory: fixtures only.
 */
final class DeanRoutingAndHrRosterTest extends CIUnitTestCase
{
    private $sqlite;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sqlite = Database::connect(['DBDriver' => 'SQLite3', 'database' => ':memory:', 'DBPrefix' => ''], false);
        foreach ([
            'CREATE TABLE profiles (id TEXT PRIMARY KEY, full_name TEXT, first_name TEXT, last_name TEXT, institutional_id TEXT, email TEXT, avatar_url TEXT, designation_title TEXT, status TEXT)',
            'CREATE TABLE personnel_profiles (profile_id TEXT PRIMARY KEY, personnel_group TEXT COLLATE NOCASE, personnel_classification TEXT, organizational_side TEXT, faculty_engagement TEXT, employment_status TEXT, employment_start_date TEXT, position_title TEXT, current_rank_title TEXT)',
            'CREATE TABLE colleges (id TEXT PRIMARY KEY, name TEXT, code TEXT)',
            'CREATE TABLE administrative_units (id TEXT PRIMARY KEY, name TEXT, college_id TEXT, status TEXT)',
            'CREATE TABLE personnel_college_affiliations (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE personnel_administrative_unit_affiliations (personnel_profile_id TEXT, administrative_unit_id TEXT, is_active INTEGER)',
            'CREATE TABLE dean_assignments (personnel_profile_id TEXT, college_id TEXT, is_active INTEGER)',
            'CREATE TABLE department_head_assignments (personnel_profile_id TEXT, department_id TEXT, is_active INTEGER)',
            'CREATE TABLE roles (id TEXT PRIMARY KEY, role_key TEXT)',
            'CREATE TABLE profile_roles (profile_id TEXT, role_id TEXT, is_active INTEGER)',
            'CREATE TABLE ranking_cycles (id TEXT PRIMARY KEY)',
            'CREATE TABLE personnel_evaluation_periods (id TEXT PRIMARY KEY, ranking_cycle_id TEXT, personnel_group TEXT, academic_year TEXT, status TEXT, evaluation_end_at TEXT)',
            'CREATE TABLE personnel_annual_reviews (id TEXT, personnel_profile_id TEXT, evaluation_period_id TEXT, superseded_at TEXT, created_at TEXT)',
        ] as $sql) $this->sqlite->query($sql);

        $this->sqlite->table('colleges')->insertBatch([['id' => 'C1', 'name' => 'College One', 'code' => 'C1'], ['id' => 'C2', 'name' => 'College Two', 'code' => 'C2']]);
        $people = [
            // id, name, group, college affiliation
            ['DEAN1', 'Dean One', 'faculty', 'C1'],     // Dean of C1, affiliated with C1
            ['DEAN2', 'Dean Two', 'faculty', null],     // Dean of C2, NO college affiliation (previously unresolvable)
            ['FAC1', 'Faculty One', 'faculty', 'C1'],   // ordinary faculty under Dean One
            ['FAC2', 'Faculty No College', 'faculty', null],
            ['HR1', 'HR Admin', 'non_teaching_faculty', null],
        ];
        foreach ($people as [$id, $name, $group, $college]) {
            $this->sqlite->table('profiles')->insert(['id' => $id, 'full_name' => $name, 'institutional_id' => $id, 'status' => 'active']);
            $this->sqlite->table('personnel_profiles')->insert(['profile_id' => $id, 'personnel_group' => $group, 'organizational_side' => 'academic', 'employment_status' => 'permanent']);
            if ($college) $this->sqlite->table('personnel_college_affiliations')->insert(['personnel_profile_id' => $id, 'college_id' => $college, 'is_active' => 1]);
        }
        $this->sqlite->table('dean_assignments')->insertBatch([
            ['personnel_profile_id' => 'DEAN1', 'college_id' => 'C1', 'is_active' => 1],
            ['personnel_profile_id' => 'DEAN2', 'college_id' => 'C2', 'is_active' => 1],
        ]);
        $this->sqlite->table('roles')->insertBatch([['id' => 'R-HRADMIN', 'role_key' => 'hr_admin'], ['id' => 'R-HRSTAFF', 'role_key' => 'hr_staff']]);
        // HR1 only holds hr_admin; a separate active hr_staff profile must exist for HR routing to resolve.
        $this->sqlite->table('profile_roles')->insert(['profile_id' => 'HR1', 'role_id' => 'R-HRADMIN', 'is_active' => 1]);
        $this->sqlite->table('profiles')->insert(['id' => 'HRSTAFF', 'full_name' => 'HR Staff', 'status' => 'active']);
        $this->sqlite->table('profile_roles')->insert(['profile_id' => 'HRSTAFF', 'role_id' => 'R-HRSTAFF', 'is_active' => 1]);
        $this->sqlite->table('ranking_cycles')->insert(['id' => 'CYCLE']);
        $this->sqlite->table('personnel_evaluation_periods')->insert(['id' => 'TRACK', 'ranking_cycle_id' => 'CYCLE', 'personnel_group' => 'FACULTY', 'academic_year' => '2027-2028', 'status' => 'OPEN_FOR_SUBMISSION', 'evaluation_end_at' => '2026-10-17']);
    }

    protected function tearDown(): void
    {
        $this->sqlite->close();
        parent::tearDown();
    }

    private function roster(): AuthorityRankingRosterService
    {
        $eligibility = $this->createMock(PersonnelEligibilityService::class);
        $eligibility->method('evaluateEligibility')->willReturn(['eligibility_status' => 'pending', 'annual_review_requirement' => ['status' => 'pending']]);
        return new AuthorityRankingRosterService($this->sqlite, new OrganizationalAuthorityResolver($this->sqlite), $eligibility);
    }

    private function ids(array $result): array
    {
        return array_map(fn ($item) => $item['personnel']['id'], $result['personnel']);
    }

    public function testActiveDeansRouteToHrRegardlessOfCollegeAffiliation(): void
    {
        $resolver = new OrganizationalAuthorityResolver($this->sqlite);
        self::assertSame('HR', $resolver->resolveResponsibleAuthority('DEAN1')['authority_type']);
        self::assertSame('HR', $resolver->resolveResponsibleAuthority('DEAN2')['authority_type']);
        $faculty = $resolver->resolveResponsibleAuthority('FAC1');
        self::assertSame('DEAN', $faculty['authority_type']);
        self::assertSame('DEAN1', $faculty['authority_profile_id']);
    }

    public function testHrAdminMayActOnHrRoutedPersonnel(): void
    {
        $resolver = new OrganizationalAuthorityResolver($this->sqlite);
        self::assertTrue($resolver->actorMayAct($resolver->resolveResponsibleAuthority('DEAN1'), 'HR1'));
        self::assertFalse($resolver->actorMayAct($resolver->resolveResponsibleAuthority('FAC1'), 'HR1'));
    }

    public function testDefaultRosterStaysManagedOnlyForAuthorizationCallers(): void
    {
        $result = $this->roster()->list(['profile' => ['id' => 'HR1'], 'roles' => ['hr_admin']], 'CYCLE', 'faculty');
        self::assertEqualsCanonicalizing(['DEAN1', 'DEAN2'], $this->ids($result));
        foreach ($result['personnel'] as $item) self::assertTrue($item['can_manage']);
    }

    public function testHrReadOnlyRosterShowsAllFacultyWithResponsibility(): void
    {
        $result = $this->roster()->list(['profile' => ['id' => 'HR1'], 'roles' => ['hr_admin']], 'CYCLE', 'faculty', true);
        $byId = [];
        foreach ($result['personnel'] as $item) $byId[$item['personnel']['id']] = $item;
        self::assertEqualsCanonicalizing(['DEAN1', 'DEAN2', 'FAC1', 'FAC2'], array_keys($byId));
        self::assertTrue($byId['DEAN1']['can_manage']);
        self::assertTrue($byId['DEAN2']['can_manage']);
        self::assertFalse($byId['FAC1']['can_manage']);
        self::assertSame('DEAN', $byId['FAC1']['responsible_authority']['authority_type']);
        self::assertSame('Dean One', $byId['FAC1']['responsible_authority']['authority_name']);
        self::assertFalse($byId['FAC2']['can_manage']);
        self::assertSame('unresolved', $byId['FAC2']['responsible_authority']['status']);
    }

    public function testDeanRosterIsUnchangedAndExcludesFellowDeans(): void
    {
        $result = $this->roster()->list(['profile' => ['id' => 'DEAN1'], 'roles' => ['dean']], 'CYCLE', 'faculty', true);
        self::assertSame(['FAC1'], $this->ids($result));
        self::assertTrue($result['personnel'][0]['can_manage']);
    }
}
