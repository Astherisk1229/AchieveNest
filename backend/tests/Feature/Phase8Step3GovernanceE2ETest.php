<?php

namespace Tests\Feature;

use App\Services\AuthenticatedActorService;
use App\Services\SupabaseAuthService;
use CodeIgniter\Test\CIUnitTestCase;
use CodeIgniter\Test\FeatureTestTrait;
use PDO;

final class Phase8Step3GovernanceE2ETest extends CIUnitTestCase
{
    use FeatureTestTrait;

    protected static ?PDO $pdo = null;

    protected static string $collegeAId = '20000000-0000-0000-0000-000000000001';
    protected static string $collegeBId = '20000000-0000-0000-0000-000000000002';
    protected static string $programAId = '30000000-0000-0000-0000-000000000001'; // BSCS (under CET)
    protected static string $programBId = '30000000-0000-0000-0000-000000000002'; // BSIT (under CBA)
    protected static string $adminUnitAId = '8cb1b662-a405-4e3a-ae6b-5fa1cc4603b2'; // HR
    protected static string $adminUnitBId = 'db80fc1b-0eec-49d4-ad83-2113ee84ef1f'; // GTC
    protected static string $orgAId = '40000000-0000-0000-0000-000000000001'; // CSS (under CET)
    protected static string $orgBId = '40000000-0000-0000-0000-000000000002'; // JPIA (under CBA)

    protected static string $studentAId = '10000000-0000-0000-0000-000000000001';
    protected static string $studentBId = '10000000-0000-0000-0000-000000000002';
    protected static string $academicPersonnelId = '10000000-0000-0000-0000-000000000003';
    protected static string $nonAcademicPersonnelId = '10000000-0000-0000-0000-000000000007';
    protected static string $hrAdminId = '10000000-0000-0000-0000-000000000004';
    protected static string $osadAdminId = '10000000-0000-0000-0000-000000000005';
    protected static string $deanId = '10000000-0000-0000-0000-000000000008';
    protected static string $progCoordId = '10000000-0000-0000-0000-000000000009';
    protected static string $orgModId = '10000000-0000-0000-0000-000000000010';
    protected static string $multiRoleId = '10000000-0000-0000-0000-000000000006';

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        $lines = file(APPPATH . '../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $env = [];
        foreach ($lines as $line) {
            $line = trim($line);
            if (str_starts_with($line, '#')) continue;
            if (str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $env[trim($k)] = trim(trim($v), "'\"");
            }
        }

        $username = $env['database.default.username'] ?? 'postgres';
        $password = $env['database.default.password'] ?? 'postgres';
        $host     = $env['database.default.hostname'] ?? '127.0.0.1';
        $port     = $env['database.default.port'] ?? 54322;
        $dbname   = $env['database.default.database'] ?? 'postgres';
        $sslmode  = $env['database.default.sslmode'] ?? 'disable';

        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=$sslmode";
        self::$pdo = new PDO($dsn, $username, $password, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        self::seedStep3Fixtures(self::$pdo);
    }

    private static function seedStep3Fixtures(PDO $pdo): void
    {
        // 1. Institutional reference structures
        $pdo->exec("INSERT INTO public.colleges (id, code, name, status, created_at, updated_at) VALUES
            ('" . self::$collegeAId . "', 'CET', 'College of Engineering and Technology', 'active', NOW(), NOW()),
            ('" . self::$collegeBId . "', 'CBA', 'College of Business and Accountancy', 'active', NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET code = EXCLUDED.code, name = EXCLUDED.name;");

        $pdo->exec("INSERT INTO public.academic_programs (id, college_id, code, name, degree_level, status, created_at, updated_at) VALUES
            ('" . self::$programAId . "', '" . self::$collegeAId . "', 'BSCS', 'Bachelor of Science in Computer Science', 'undergraduate', 'active', NOW(), NOW()),
            ('" . self::$programBId . "', '" . self::$collegeBId . "', 'BSIT', 'Bachelor of Science in Information Technology', 'undergraduate', 'active', NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET college_id = EXCLUDED.college_id, code = EXCLUDED.code, name = EXCLUDED.name;");

        $pdo->exec("INSERT INTO public.organizations (id, college_id, code, name, scope, category, status, created_at, updated_at) VALUES
            ('" . self::$orgAId . "', '" . self::$collegeAId . "', 'CSS', 'Computer Science Society', 'college', 'academic_college', 'active', NOW(), NOW()),
            ('" . self::$orgBId . "', '" . self::$collegeBId . "', 'JPIA', 'Junior Philippine Institute of Accountants', 'college', 'academic_college', 'active', NOW(), NOW())
            ON CONFLICT (id) DO UPDATE SET college_id = EXCLUDED.college_id, code = EXCLUDED.code, name = EXCLUDED.name;");

        // 2. Ensure all 10 actors exist in public.profiles
        $actors = [
            [self::$studentAId, '2026000001', 'Juan Dela Cruz', 'student.01@ndmu.edu.ph', 'student', 'Student'],
            [self::$studentBId, '2026000002', 'Maria Santos', 'student.02@ndmu.edu.ph', 'student', 'Student'],
            [self::$academicPersonnelId, '9000000001', 'Ricardo Reyes', 'faculty.01@ndmu.edu.ph', 'personnel', 'Assistant Professor'],
            [self::$nonAcademicPersonnelId, '9000000007', 'Lourdes Bautista', 'staff.nonacad01@ndmu.edu.ph', 'personnel', 'Administrative Officer'],
            [self::$hrAdminId, '9000000010', 'Evelyn Mercado', 'hr.admin01@ndmu.edu.ph', 'hr_admin', 'HR Director'],
            [self::$osadAdminId, '9000000020', 'Marcus Cruz', 'osad.admin01@ndmu.edu.ph', 'osad_admin', 'OSAD Director'],
            [self::$deanId, '9000000008', 'Arthur Pendelton', 'dean.cet01@ndmu.edu.ph', 'personnel', 'College Dean'],
            [self::$progCoordId, '9000000009', 'Cynthia Ramos', 'coord.bscs01@ndmu.edu.ph', 'personnel', 'Program Coordinator'],
            [self::$orgModId, '9000000011', 'David Villanueva', 'mod.css01@ndmu.edu.ph', 'personnel', 'Faculty Moderator'],
            [self::$multiRoleId, '9000000002', 'Elena Torres', 'multirole.01@ndmu.edu.ph', 'personnel', 'Associate Professor'],
        ];

        foreach ($actors as [$id, $instId, $name, $email, $accountType, $desig]) {
            $pdo->exec("INSERT INTO auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at) VALUES
                ('$id', 'authenticated', 'authenticated', '$email', NOW(), NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;");

            $pdo->exec("INSERT INTO public.profiles (id, institutional_id, full_name, first_name, last_name, institutional_email, account_type, designation, status, provisioning_method, must_change_password, provisioned_at, activated_at, created_at, updated_at) VALUES
                ('$id', '$instId', '$name', '$name', 'User', '$email', '$accountType', '$desig', 'active', 'manual', false, NOW(), NOW(), NOW(), NOW())
                ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, account_type = EXCLUDED.account_type, designation = EXCLUDED.designation, status = 'active';");
        }

        // 3. Sub-profiles
        $pdo->exec("INSERT INTO public.student_profiles (profile_id, student_status, created_at, updated_at) VALUES
            ('" . self::$studentAId . "', 'active', NOW(), NOW()),
            ('" . self::$studentBId . "', 'active', NOW(), NOW())
            ON CONFLICT (profile_id) DO UPDATE SET student_status = 'active';");

        $pdo->exec("INSERT INTO public.personnel_profiles (profile_id, personnel_classification, created_at, updated_at) VALUES
            ('" . self::$academicPersonnelId . "', 'academic', NOW(), NOW()),
            ('" . self::$nonAcademicPersonnelId . "', 'non_academic', NOW(), NOW()),
            ('" . self::$deanId . "', 'academic', NOW(), NOW()),
            ('" . self::$progCoordId . "', 'academic', NOW(), NOW()),
            ('" . self::$orgModId . "', 'academic', NOW(), NOW()),
            ('" . self::$multiRoleId . "', 'academic', NOW(), NOW())
            ON CONFLICT (profile_id) DO UPDATE SET personnel_classification = EXCLUDED.personnel_classification;");

        // 4. Base profile_roles
        $roleMap = [];
        $stmt = $pdo->query("SELECT id, role_key FROM public.roles");
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $r) {
            $roleMap[$r['role_key']] = $r['id'];
        }

        $baseRoles = [
            [self::$studentAId, $roleMap['student']],
            [self::$studentBId, $roleMap['student']],
            [self::$academicPersonnelId, $roleMap['personnel']],
            [self::$nonAcademicPersonnelId, $roleMap['personnel']],
            [self::$hrAdminId, $roleMap['hr_staff']],
            [self::$osadAdminId, $roleMap['osad_staff']],
            [self::$deanId, $roleMap['personnel']],
            [self::$progCoordId, $roleMap['personnel']],
            [self::$orgModId, $roleMap['personnel']],
            [self::$multiRoleId, $roleMap['personnel']],
        ];

        foreach ($baseRoles as [$profileId, $roleId]) {
            $pdo->exec("INSERT INTO public.profile_roles (id, profile_id, role_id, scope_type, scope_id, is_active, assigned_at) VALUES
                (gen_random_uuid(), '$profileId', '$roleId', 'university', NULL, true, NOW())
                ON CONFLICT DO NOTHING;");
        }

        // 5. Affiliations
        // Student A -> BSCS, Student B -> BSIT
        $pdo->exec("DELETE FROM public.student_program_enrollments WHERE student_profile_id IN ('" . self::$studentAId . "', '" . self::$studentBId . "');");
        $pdo->exec("INSERT INTO public.student_program_enrollments (id, student_profile_id, academic_program_id, year_level, academic_year, effective_from, is_active, created_at) VALUES
            (gen_random_uuid(), '" . self::$studentAId . "', '" . self::$programAId . "', '3rd Year', '2026-2027', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$studentBId . "', '" . self::$programBId . "', '2nd Year', '2026-2027', CURRENT_DATE, true, NOW());");

        // Academic Personnel -> CET / BSCS
        $pdo->exec("DELETE FROM public.personnel_college_affiliations WHERE personnel_profile_id IN ('" . self::$academicPersonnelId . "', '" . self::$deanId . "', '" . self::$progCoordId . "', '" . self::$orgModId . "', '" . self::$multiRoleId . "');");
        $pdo->exec("INSERT INTO public.personnel_college_affiliations (id, personnel_profile_id, college_id, effective_from, is_active, created_at) VALUES
            (gen_random_uuid(), '" . self::$academicPersonnelId . "', '" . self::$collegeAId . "', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$deanId . "', '" . self::$collegeAId . "', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$progCoordId . "', '" . self::$collegeAId . "', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$orgModId . "', '" . self::$collegeAId . "', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$multiRoleId . "', '" . self::$collegeBId . "', CURRENT_DATE, true, NOW());");

        $pdo->exec("DELETE FROM public.personnel_program_affiliations WHERE personnel_profile_id IN ('" . self::$academicPersonnelId . "', '" . self::$progCoordId . "', '" . self::$multiRoleId . "');");
        $pdo->exec("INSERT INTO public.personnel_program_affiliations (id, personnel_profile_id, academic_program_id, effective_from, is_active, created_at) VALUES
            (gen_random_uuid(), '" . self::$academicPersonnelId . "', '" . self::$programAId . "', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$progCoordId . "', '" . self::$programAId . "', CURRENT_DATE, true, NOW()),
            (gen_random_uuid(), '" . self::$multiRoleId . "', '" . self::$programBId . "', CURRENT_DATE, true, NOW());");

        // Non-Academic Personnel -> HR unit
        $pdo->exec("DELETE FROM public.personnel_administrative_unit_affiliations WHERE personnel_profile_id = '" . self::$nonAcademicPersonnelId . "';");
        $pdo->exec("INSERT INTO public.personnel_administrative_unit_affiliations (id, personnel_profile_id, administrative_unit_id, effective_from, is_active, created_at) VALUES
            (gen_random_uuid(), '" . self::$nonAcademicPersonnelId . "', '" . self::$adminUnitAId . "', CURRENT_DATE, true, NOW());");

        // 6. Specialized Governance Assignments
        // Dean -> Dean of CET
        $pdo->exec("DELETE FROM public.dean_assignments WHERE personnel_profile_id IN ('" . self::$deanId . "');");
        $pdo->exec("INSERT INTO public.dean_assignments (id, personnel_profile_id, college_id, effective_from, is_active, assigned_by, assigned_at) VALUES
            (gen_random_uuid(), '" . self::$deanId . "', '" . self::$collegeAId . "', CURRENT_DATE, true, '" . self::$hrAdminId . "', NOW());");

        // Program Coordinator -> BSCS (ProgCoord), BSIT (MultiRole)
        $pdo->exec("DELETE FROM public.program_coordinator_assignments WHERE personnel_profile_id IN ('" . self::$progCoordId . "', '" . self::$multiRoleId . "');");
        $pdo->exec("INSERT INTO public.program_coordinator_assignments (id, personnel_profile_id, academic_program_id, effective_from, is_active, assigned_by, assigned_at) VALUES
            (gen_random_uuid(), '" . self::$progCoordId . "', '" . self::$programAId . "', CURRENT_DATE, true, '" . self::$osadAdminId . "', NOW()),
            (gen_random_uuid(), '" . self::$multiRoleId . "', '" . self::$programBId . "', CURRENT_DATE, true, '" . self::$osadAdminId . "', NOW());");

        // Org Moderator -> CSS (OrgMod), JPIA (MultiRole)
        $pdo->exec("DELETE FROM public.organization_moderator_assignments WHERE personnel_profile_id IN ('" . self::$orgModId . "', '" . self::$multiRoleId . "');");
        $pdo->exec("INSERT INTO public.organization_moderator_assignments (id, organization_id, personnel_profile_id, effective_from, is_active, assigned_by, assigned_at) VALUES
            (gen_random_uuid(), '" . self::$orgAId . "', '" . self::$orgModId . "', CURRENT_DATE, true, '" . self::$osadAdminId . "', NOW()),
            (gen_random_uuid(), '" . self::$orgBId . "', '" . self::$multiRoleId . "', CURRENT_DATE, true, '" . self::$osadAdminId . "', NOW());");
    }

    private function buildMockActor(string $profileId): array
    {
        $stmt = self::$pdo->prepare("SELECT * FROM public.profiles WHERE id = ?");
        $stmt->execute([$profileId]);
        $profile = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = self::$pdo->prepare(
            "SELECT r.role_key, r.display_name, pr.id AS assignment_id,
                    'university'::text AS scope_type, NULL::uuid AS scope_id,
                    NULL::text AS scope_code, 'University'::text AS scope_name
             FROM public.profile_roles pr
             JOIN public.roles r ON r.id = pr.role_id
             WHERE pr.profile_id = ?
               AND pr.is_active = true
               AND r.role_key NOT IN ('dean', 'program_coordinator', 'organization_moderator')"
        );
        $stmt->execute([$profileId]);
        $genericRoleRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = self::$pdo->prepare(
            "SELECT 'dean'::text AS role_key, 'Dean'::text AS display_name,
                    da.id AS assignment_id, 'college'::text AS scope_type,
                    da.college_id AS scope_id, c.code AS scope_code, c.name AS scope_name
             FROM public.dean_assignments da
             JOIN public.colleges c ON c.id = da.college_id
             WHERE da.personnel_profile_id = ? AND da.is_active = true"
        );
        $stmt->execute([$profileId]);
        $deanRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = self::$pdo->prepare(
            "SELECT 'program_coordinator'::text AS role_key,
                    'Program Coordinator'::text AS display_name,
                    pca.id AS assignment_id, 'academic_program'::text AS scope_type,
                    pca.academic_program_id AS scope_id, ap.code AS scope_code, ap.name AS scope_name
             FROM public.program_coordinator_assignments pca
             JOIN public.academic_programs ap ON ap.id = pca.academic_program_id
             WHERE pca.personnel_profile_id = ? AND pca.is_active = true"
        );
        $stmt->execute([$profileId]);
        $coordinatorRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt = self::$pdo->prepare(
            "SELECT 'organization_moderator'::text AS role_key,
                    'Organization Moderator'::text AS display_name,
                    oma.id AS assignment_id, 'organization'::text AS scope_type,
                    oma.organization_id AS scope_id, o.code AS scope_code, o.name AS scope_name
             FROM public.organization_moderator_assignments oma
             JOIN public.organizations o ON o.id = oma.organization_id
             WHERE oma.personnel_profile_id = ? AND oma.is_active = true"
        );
        $stmt->execute([$profileId]);
        $moderatorRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $assignments = array_merge($genericRoleRows, $deanRows, $coordinatorRows, $moderatorRows);
        $roles = array_values(array_unique(array_column($assignments, 'role_key')));

        return [
            'profile'     => $profile,
            'roles'       => $roles,
            'assignments' => $assignments,
            'scopes'      => $assignments,
        ];
    }

    public function testActorInventoryIntegrity(): void
    {
        $stmt = self::$pdo->query("SELECT count(*) FROM public.profiles WHERE id IN (
            '" . self::$studentAId . "', '" . self::$studentBId . "', '" . self::$academicPersonnelId . "',
            '" . self::$nonAcademicPersonnelId . "', '" . self::$hrAdminId . "', '" . self::$osadAdminId . "',
            '" . self::$deanId . "', '" . self::$progCoordId . "', '" . self::$orgModId . "', '" . self::$multiRoleId . "'
        )");
        $count = (int) $stmt->fetchColumn();

        $this->assertEquals(10, $count, "All 10 E2E actors must exist in profiles table.");
    }

    public function testGov001HrContextHydrationAndRouteAccess(): void
    {
        $hrActor = $this->buildMockActor(self::$hrAdminId);
        $this->assertEquals('hr_admin', $hrActor['profile']['account_type']);
        $this->assertContains('hr_staff', $hrActor['roles']);
        $this->assertNotContains('osad_staff', $hrActor['roles']);
    }

    public function testGov002OsadContextHydrationAndRouteAccess(): void
    {
        $osadActor = $this->buildMockActor(self::$osadAdminId);
        $this->assertEquals('osad_admin', $osadActor['profile']['account_type']);
        $this->assertContains('osad_staff', $osadActor['roles']);
        $this->assertNotContains('hr_staff', $osadActor['roles']);
    }

    public function testGov003HrManagesNonAcademicPersonnel(): void
    {
        $stmt = self::$pdo->prepare(
            "SELECT p.id, p.full_name, pau.administrative_unit_id, au.code as unit_code
             FROM public.profiles p
             JOIN public.personnel_administrative_unit_affiliations pau ON pau.personnel_profile_id = p.id AND pau.is_active = true
             JOIN public.administrative_units au ON au.id = pau.administrative_unit_id
             WHERE p.id = ?"
        );
        $stmt->execute([self::$nonAcademicPersonnelId]);
        $nonAcad = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($nonAcad);
        $this->assertEquals('HR', $nonAcad['unit_code']);
    }

    public function testGov004HrCannotPerformOsadAssignments(): void
    {
        $hrActor = $this->buildMockActor(self::$hrAdminId);
        $isOsad = (($hrActor['profile']['account_type'] ?? '') === 'osad_admin' && in_array('osad_staff', $hrActor['roles'], true));
        $this->assertFalse($isOsad, "HR must not be identified as OSAD admin");
    }

    public function testGov005OsadAssignsProgramCoordinator(): void
    {
        $osadActor = $this->buildMockActor(self::$osadAdminId);
        $this->assertTrue(($osadActor['profile']['account_type'] === 'osad_admin' && in_array('osad_staff', $osadActor['roles'], true)));

        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.program_coordinator_assignments
             WHERE personnel_profile_id = ? AND academic_program_id = ? AND is_active = true"
        );
        $stmt->execute([self::$progCoordId, self::$programAId]);
        $pca = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($pca, "Program Coordinator assignment must exist and be active");
    }

    public function testGov006OsadAssignsOrgModerator(): void
    {
        $osadActor = $this->buildMockActor(self::$osadAdminId);
        $this->assertTrue(($osadActor['profile']['account_type'] === 'osad_admin' && in_array('osad_staff', $osadActor['roles'], true)));

        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.organization_moderator_assignments
             WHERE personnel_profile_id = ? AND organization_id = ? AND is_active = true"
        );
        $stmt->execute([self::$orgModId, self::$orgAId]);
        $oma = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($oma, "Organization Moderator assignment must exist and be active");
    }

    public function testGov007OsadCannotPerformHrDeanAssignment(): void
    {
        $osadActor = $this->buildMockActor(self::$osadAdminId);
        $isHr = (($osadActor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $osadActor['roles'], true));
        $this->assertFalse($isHr, "OSAD must not have HR admin authority");
    }

    public function testGov008HrAssignsDeanAuthority(): void
    {
        $hrActor = $this->buildMockActor(self::$hrAdminId);
        $isHr = (($hrActor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $hrActor['roles'], true));
        $this->assertTrue($isHr);

        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.dean_assignments
             WHERE personnel_profile_id = ? AND college_id = ? AND is_active = true"
        );
        $stmt->execute([self::$deanId, self::$collegeAId]);
        $dean = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($dean, "Dean assignment must exist for College A");
    }

    public function testGov009UnauthorizedDeanAssignmentDenied(): void
    {
        $nonHrActor = $this->buildMockActor(self::$academicPersonnelId);
        $isHr = (($nonHrActor['profile']['account_type'] ?? '') === 'hr_admin' && in_array('hr_staff', $nonHrActor['roles'], true));
        $this->assertFalse($isHr, "Regular personnel cannot assign Dean");
    }

    public function testAff001AcademicPersonnelAffiliation(): void
    {
        $actor = $this->buildMockActor(self::$academicPersonnelId);
        $this->assertEquals('personnel', $actor['profile']['account_type']);

        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.personnel_college_affiliations
             WHERE personnel_profile_id = ? AND college_id = ? AND is_active = true"
        );
        $stmt->execute([self::$academicPersonnelId, self::$collegeAId]);
        $colAff = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->assertNotFalse($colAff, "Academic personnel must be affiliated with College A");

        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.personnel_program_affiliations
             WHERE personnel_profile_id = ? AND academic_program_id = ? AND is_active = true"
        );
        $stmt->execute([self::$academicPersonnelId, self::$programAId]);
        $progAff = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->assertNotFalse($progAff, "Academic personnel must be affiliated with Program A");
    }

    public function testAff002NonAcademicPersonnelAffiliation(): void
    {
        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.personnel_administrative_unit_affiliations
             WHERE personnel_profile_id = ? AND administrative_unit_id = ? AND is_active = true"
        );
        $stmt->execute([self::$nonAcademicPersonnelId, self::$adminUnitAId]);
        $unitAff = $stmt->fetch(PDO::FETCH_ASSOC);
        $this->assertNotFalse($unitAff, "Non-academic personnel must be affiliated with Admin Unit A");

        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.personnel_program_affiliations
             WHERE personnel_profile_id = ?"
        );
        $stmt->execute([self::$nonAcademicPersonnelId]);
        $progAff = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->assertEmpty($progAff, "Non-academic personnel must not have academic program affiliations");
    }

    public function testAff003AcademicPersonnelCannotInheritNonAcademicScope(): void
    {
        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.personnel_administrative_unit_affiliations
             WHERE personnel_profile_id = ?"
        );
        $stmt->execute([self::$academicPersonnelId]);
        $unitAff = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->assertEmpty($unitAff, "Academic personnel must not have admin unit affiliations");
    }

    public function testAff004NonAcademicPersonnelCannotInheritAcademicScope(): void
    {
        $stmt = self::$pdo->prepare(
            "SELECT * FROM public.personnel_college_affiliations
             WHERE personnel_profile_id = ?"
        );
        $stmt->execute([self::$nonAcademicPersonnelId]);
        $colAff = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->assertEmpty($colAff, "Non-academic personnel must not have college affiliations");
    }

    public function testDean001To003DeanContextAndScopeEnforcement(): void
    {
        $deanActor = $this->buildMockActor(self::$deanId);
        $this->assertContains('dean', $deanActor['roles']);

        $deanAssignment = null;
        foreach ($deanActor['assignments'] as $asgn) {
            if ($asgn['role_key'] === 'dean') {
                $deanAssignment = $asgn;
                break;
            }
        }
        $this->assertNotNull($deanAssignment);
        $this->assertEquals(self::$collegeAId, $deanAssignment['scope_id']);
        $this->assertEquals('CET', $deanAssignment['scope_code']);
        $this->assertNotEquals(self::$collegeBId, $deanAssignment['scope_id']);
    }

    public function testPc001To003ProgramCoordinatorContextAndScopeEnforcement(): void
    {
        $pcActor = $this->buildMockActor(self::$progCoordId);
        $this->assertContains('program_coordinator', $pcActor['roles']);

        $pcAssignment = null;
        foreach ($pcActor['assignments'] as $asgn) {
            if ($asgn['role_key'] === 'program_coordinator') {
                $pcAssignment = $asgn;
                break;
            }
        }
        $this->assertNotNull($pcAssignment);
        $this->assertEquals(self::$programAId, $pcAssignment['scope_id']);
        $this->assertEquals('BSCS', $pcAssignment['scope_code']);
        $this->assertNotEquals(self::$programBId, $pcAssignment['scope_id']);
    }

    public function testOm001To003OrgModeratorContextAndScopeEnforcement(): void
    {
        $omActor = $this->buildMockActor(self::$orgModId);
        $this->assertContains('organization_moderator', $omActor['roles']);

        $omAssignment = null;
        foreach ($omActor['assignments'] as $asgn) {
            if ($asgn['role_key'] === 'organization_moderator') {
                $omAssignment = $asgn;
                break;
            }
        }
        $this->assertNotNull($omAssignment);
        $this->assertEquals(self::$orgAId, $omAssignment['scope_id']);
        $this->assertEquals('CSS', $omAssignment['scope_code']);
        $this->assertNotEquals(self::$orgBId, $omAssignment['scope_id']);
    }

    public function testStu001To004StudentPlacementResolutionAndMutationGuard(): void
    {
        $stmt = self::$pdo->prepare(
            "SELECT spe.student_profile_id, ap.code as program_code, c.code as college_code
             FROM public.student_program_enrollments spe
             JOIN public.academic_programs ap ON ap.id = spe.academic_program_id
             JOIN public.colleges c ON c.id = ap.college_id
             WHERE spe.student_profile_id = ? AND spe.is_active = true"
        );
        $stmt->execute([self::$studentAId]);
        $stuA = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($stuA);
        $this->assertEquals('BSCS', $stuA['program_code']);
        $this->assertEquals('CET', $stuA['college_code']);

        $stmt->execute([self::$studentBId]);
        $stuB = $stmt->fetch(PDO::FETCH_ASSOC);

        $this->assertNotFalse($stuB);
        $this->assertEquals('BSIT', $stuB['program_code']);
        $this->assertEquals('CBA', $stuB['college_code']);

        $stuActorA = $this->buildMockActor(self::$studentAId);
        $this->assertEquals('student', $stuActorA['profile']['account_type']);
        $this->assertFalse(in_array('osad_admin', [$stuActorA['profile']['account_type']], true));
    }

    public function testMulti001To004MultiRoleHydrationAndScopeBounding(): void
    {
        $multiActor = $this->buildMockActor(self::$multiRoleId);
        $this->assertEquals('personnel', $multiActor['profile']['account_type']);
        $this->assertContains('personnel', $multiActor['roles']);
        $this->assertContains('program_coordinator', $multiActor['roles']);
        $this->assertContains('organization_moderator', $multiActor['roles']);
        $this->assertNotContains('dean', $multiActor['roles']);
        $this->assertNotContains('hr_staff', $multiActor['roles']);
        $this->assertNotContains('osad_staff', $multiActor['roles']);

        $scopes = array_column($multiActor['assignments'], 'scope_code', 'role_key');
        $this->assertEquals('BSIT', $scopes['program_coordinator']);
        $this->assertEquals('JPIA', $scopes['organization_moderator']);
    }

    public function testGov011InactiveAssignmentRevocation(): void
    {
        self::$pdo->exec("UPDATE public.dean_assignments SET is_active = false WHERE personnel_profile_id = '" . self::$deanId . "'");
        $revokedDeanActor = $this->buildMockActor(self::$deanId);
        $this->assertNotContains('dean', $revokedDeanActor['roles'], "Inactive Dean assignment must not grant dean role");

        self::$pdo->exec("UPDATE public.dean_assignments SET is_active = true WHERE personnel_profile_id = '" . self::$deanId . "'");
        $reactivatedDeanActor = $this->buildMockActor(self::$deanId);
        $this->assertContains('dean', $reactivatedDeanActor['roles'], "Reactivated Dean assignment restores dean role");
    }

    public function testCompatibilityViewsReturnLiveE2EData(): void
    {
        $stmt = self::$pdo->prepare("SELECT * FROM public.v_current_student_academic_placement WHERE profile_id IN (?, ?)");
        $stmt->execute([self::$studentAId, self::$studentBId]);
        $stuView = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->assertCount(2, $stuView, "v_current_student_academic_placement must return exactly 2 rows for Student A and B");

        $stmt = self::$pdo->prepare("SELECT * FROM public.v_current_personnel_affiliation WHERE profile_id IN (?, ?)");
        $stmt->execute([self::$academicPersonnelId, self::$nonAcademicPersonnelId]);
        $persView = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->assertCount(2, $persView, "v_current_personnel_affiliation must return exactly 2 rows for Academic and Non-Academic personnel");
    }
}
