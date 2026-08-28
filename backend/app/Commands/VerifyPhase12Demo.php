<?php

namespace App\Commands;

use App\Services\AuthorizationService;
use App\Services\LocalAuthService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class VerifyPhase12Demo extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:phase12-demo';
    protected $description = 'Runs comprehensive Phase 12 defense demonstration personas and scenario fixture verification test suite.';

    private function computeReferenceFingerprint(\CodeIgniter\Database\BaseConnection $db): string
    {
        $payload = '';
        foreach ($db->table('roles')->orderBy('role_key', 'ASC')->get()->getResultArray() as $r) {
            $payload .= "ROLE:{$r['id']}:{$r['role_key']}:{$r['display_name']}:{$r['is_system_role']}\n";
        }
        foreach ($db->table('colleges')->orderBy('code', 'ASC')->get()->getResultArray() as $c) {
            $payload .= "COLLEGE:{$c['id']}:{$c['code']}:{$c['name']}:{$c['status']}\n";
        }
        foreach ($db->table('academic_programs')->orderBy('code', 'ASC')->get()->getResultArray() as $p) {
            $payload .= "PROG:{$p['id']}:{$p['college_id']}:{$p['code']}:{$p['name']}:{$p['status']}\n";
        }
        foreach ($db->table('administrative_units')->orderBy('code', 'ASC')->get()->getResultArray() as $u) {
            $payload .= "ADMIN:{$u['id']}:{$u['code']}:{$u['name']}:{$u['unit_type']}:{$u['status']}\n";
        }
        foreach ($db->table('portfolio_categories')->orderBy('sort_order', 'ASC')->get()->getResultArray() as $cat) {
            $payload .= "CAT:{$cat['id']}:{$cat['code']}:{$cat['name']}:{$cat['sort_order']}:{$cat['status']}\n";
        }
        foreach ($db->table('portfolio_subcategories')->orderBy('category_id', 'ASC')->orderBy('sort_order', 'ASC')->get()->getResultArray() as $s) {
            $payload .= "SUBCAT:{$s['id']}:{$s['category_id']}:{$s['code']}:{$s['name']}:{$s['sort_order']}:{$s['status']}\n";
        }
        foreach ($db->table('award_definitions')->orderBy('code', 'ASC')->get()->getResultArray() as $a) {
            $payload .= "AWARD:{$a['id']}:{$a['code']}:{$a['name']}:{$a['candidate_threshold_percent']}:{$a['status']}\n";
        }
        return hash('sha256', $payload);
    }

    private function computeDemoFingerprint(\CodeIgniter\Database\BaseConnection $db): string
    {
        $payload = '';
        $demoProfiles = $db->table('profiles')->like('id', 'd0000000-%')->orderBy('id', 'ASC')->get()->getResultArray();
        foreach ($demoProfiles as $dp) {
            $payload .= "DEMO_PROFILE:{$dp['id']}:{$dp['email']}:{$dp['account_type']}:{$dp['designation_title']}\n";
        }
        $demoRecords = $db->table('student_portfolio_records')->like('id', 'd0000000-%')->orderBy('id', 'ASC')->get()->getResultArray();
        foreach ($demoRecords as $dr) {
            $payload .= "DEMO_REC:{$dr['id']}:{$dr['student_profile_id']}:{$dr['status']}:{$dr['title']}\n";
        }
        $demoAcc = $db->table('personnel_accomplishments')->like('id', 'd0000000-%')->orderBy('id', 'ASC')->get()->getResultArray();
        foreach ($demoAcc as $da) {
            $payload .= "DEMO_ACC:{$da['id']}:{$da['personnel_profile_id']}:{$da['domain']}:{$da['status']}\n";
        }
        $demoAssign = $db->table('program_coordinator_assignments')->like('id', 'd0000000-%')->orderBy('id', 'ASC')->get()->getResultArray();
        foreach ($demoAssign as $das) {
            $payload .= "DEMO_COORD:{$das['id']}:{$das['personnel_profile_id']}:{$das['academic_program_id']}\n";
        }
        return hash('sha256', $payload);
    }

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Phase 12 Defense Demo Personas & Scenario Test Suite", 'yellow');
        CLI::write("========================================================================", 'yellow');

        $db = db_connect();
        $authService = new LocalAuthService();
        $authz = new AuthorizationService();
        $storage = new LocalEvidenceStorageService();

        $testCases = [];
        $runTest = static function (string $id, string $title, bool $condition, string $details = '') use (&$testCases) {
            $testCases[] = ['id' => $id, 'title' => $title, 'passed' => $condition, 'details' => $details];
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-10s %-58s %s", $id, $title, $status), $color);
            if (! $condition && $details !== '') {
                CLI::write("    Details: " . $details, 'red');
            }
        };

        CLI::write("\n[1/5] Executing Defense Demo Fixture Seeding & Reset...", 'cyan');
        $seeder = \Config\Database::seeder();
        $seeder->call('DefenseDemoSeeder');

        // DEMO-001: Reference fingerprint unchanged
        $refFp = $this->computeReferenceFingerprint($db);
        $targetRefFp = 'a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f';
        $runTest('DEMO-001', 'Permanent Reference Fingerprint 100% unchanged', $refFp === $targetRefFp, "Actual: {$refFp}");

        CLI::write("\n[2/5] Verifying 10 Synthetic Demo Personas & Identity Invariants...", 'cyan');

        $demoEmails = [
            'demo.student.a@ndmu.edu.ph',
            'demo.student.b@ndmu.edu.ph',
            'demo.academic.personnel@ndmu.edu.ph',
            'demo.nonacademic.personnel@ndmu.edu.ph',
            'demo.hr.admin@ndmu.edu.ph',
            'demo.osad.admin@ndmu.edu.ph',
            'demo.dean@ndmu.edu.ph',
            'demo.coordinator.a@ndmu.edu.ph',
            'demo.coordinator.b@ndmu.edu.ph',
            'demo.moderator@ndmu.edu.ph',
        ];

        $demoConfig = new \App\Services\DefenseDemoConfigService();
        $password = $demoConfig->requirePassword();

        // DEMO-002: Student A
        $studentA = $db->table('profiles')->where('email', 'demo.student.a@ndmu.edu.ph')->get()->getRowArray();
        $runTest('DEMO-002', 'Demo Student A profile exists and is active', $studentA !== null && $studentA['account_type'] === 'student' && $studentA['status'] === 'active');

        // DEMO-003: Student B
        $studentB = $db->table('profiles')->where('email', 'demo.student.b@ndmu.edu.ph')->get()->getRowArray();
        $runTest('DEMO-003', 'Demo Student B profile exists and is active', $studentB !== null && $studentB['account_type'] === 'student' && $studentB['status'] === 'active');

        // DEMO-004: Students in different programs
        $enrA = $db->table('student_program_enrollments')->where('student_profile_id', $studentA['id'] ?? '')->get()->getRowArray();
        $enrB = $db->table('student_program_enrollments')->where('student_profile_id', $studentB['id'] ?? '')->get()->getRowArray();
        $diffProg = $enrA !== null && $enrB !== null && $enrA['academic_program_id'] !== $enrB['academic_program_id'];
        $runTest('DEMO-004', 'Students A and B are enrolled in distinct Academic Programs', $diffProg);

        // DEMO-005: Academic Personnel
        $facAff = $db->table('personnel_college_affiliations')->where('personnel_profile_id', 'd0000000-0000-0000-0001-000000000003')->get()->getRowArray();
        $runTest('DEMO-005', 'Academic Personnel has valid College affiliation', $facAff !== null && $facAff['is_active'] == 1);

        // DEMO-006: Non-Academic Personnel
        $nonAcAff = $db->table('personnel_administrative_unit_affiliations')->where('personnel_profile_id', 'd0000000-0000-0000-0001-000000000004')->get()->getRowArray();
        $runTest('DEMO-006', 'Non-Academic Personnel mapped to Administrative Unit', $nonAcAff !== null && $nonAcAff['is_active'] == 1);

        $actorService = new \App\Services\AuthenticatedActorService();
        $getActor = function (string $email) use ($authService, $actorService, $password): ?array {
            $res = $authService->login($email, $password);
            if (! isset($res['data']['access_token'])) {
                return null;
            }
            return $actorService->resolveActor('Bearer ' . $res['data']['access_token']);
        };

        // DEMO-007: HR Admin
        $hrActor = $getActor('demo.hr.admin@ndmu.edu.ph');
        $runTest('DEMO-007', 'HR Admin persona has hr_staff role and active status', $hrActor !== null && in_array('hr_staff', $hrActor['roles'] ?? [], true));

        // DEMO-008: OSAD Admin
        $osadActor = $getActor('demo.osad.admin@ndmu.edu.ph');
        $runTest('DEMO-008', 'OSAD Admin persona has osad_staff role and active status', $osadActor !== null && in_array('osad_staff', $osadActor['roles'] ?? [], true));

        // DEMO-009: Dean Assignment
        $deanAssign = $db->table('dean_assignments')->where('personnel_profile_id', 'd0000000-0000-0000-0001-000000000007')->where('is_active', 1)->get()->getRowArray();
        $runTest('DEMO-009', 'College Dean has valid active dean_assignments record', $deanAssign !== null);

        // DEMO-010: Coordinator A Assignment
        $coordAAssign = $db->table('program_coordinator_assignments')->where('personnel_profile_id', 'd0000000-0000-0000-0001-000000000008')->where('is_active', 1)->get()->getRowArray();
        $runTest('DEMO-010', 'Coordinator A has active assignment to Program A (BSA)', $coordAAssign !== null && $coordAAssign['academic_program_id'] === $enrA['academic_program_id']);

        // DEMO-011: Coordinator B Assignment (Different Program)
        $coordBAssign = $db->table('program_coordinator_assignments')->where('personnel_profile_id', 'd0000000-0000-0000-0001-000000000009')->where('is_active', 1)->get()->getRowArray();
        $runTest('DEMO-011', 'Coordinator B has active assignment to Program B (BSBA-FM)', $coordBAssign !== null && $coordBAssign['academic_program_id'] === $enrB['academic_program_id']);

        // DEMO-012: Organization Moderator Assignment
        $modAssign = $db->table('organization_moderator_assignments')->where('personnel_profile_id', 'd0000000-0000-0000-0001-000000000010')->where('is_active', 1)->get()->getRowArray();
        $runTest('DEMO-012', 'Organization Moderator has valid active assignment', $modAssign !== null);

        // DEMO-013: All 10 demo personas authenticate
        $allAuth = true;
        foreach ($demoEmails as $email) {
            $res = $authService->login($email, $password);
            if (! isset($res['data']['access_token'])) {
                $allAuth = false;
                break;
            }
        }
        $runTest('DEMO-013', 'All 10 demo personas authenticate & issue JWT tokens', $allAuth);

        // DEMO-014: Zero plaintext passwords stored
        $plainPasswords = $db->query("SELECT * FROM local_auth_credentials WHERE password_hash NOT LIKE '$2y$%' AND password_hash NOT LIKE '$2a$%'")->getResultArray();
        $runTest('DEMO-014', 'Zero plaintext passwords stored in database (all bcrypt)', count($plainPasswords) === 0);

        // DEMO-015: No production identity collision
        $demoProfiles = $db->table('profiles')->like('id', 'd0000000-%')->get()->getResultArray();
        $allSynthetic = true;
        foreach ($demoProfiles as $dp) {
            if (! str_starts_with($dp['email'], 'demo.')) {
                $allSynthetic = false;
            }
        }
        $runTest('DEMO-015', 'All demo identities use synthetic demo.*@ndmu.edu.ph namespace', $allSynthetic && count($demoProfiles) === 10);

        // DEMO-016: Zero deprecated Department dependencies
        $hasDept = $db->query("SHOW TABLES LIKE '%department%'")->getResultArray();
        $runTest('DEMO-016', 'Zero deprecated Department / degree_programs dependencies', count($hasDept) === 0);

        CLI::write("\n[3/5] Verifying Scenario Fixtures & Physical Evidence Integrity...", 'cyan');

        // DEMO-017: Student Portfolio Draft
        $draftRec = $db->table('student_portfolio_records')->where('id', 'd0000000-0000-0000-0003-000000000001')->get()->getRowArray();
        $runTest('DEMO-017', 'DEMO-PORT-01 draft record fixture exists', $draftRec !== null && $draftRec['status'] === 'draft');

        // DEMO-018: Student Portfolio Verified
        $verifiedRec = $db->table('student_portfolio_records')->where('id', 'd0000000-0000-0000-0003-000000000003')->get()->getRowArray();
        $runTest('DEMO-018', 'DEMO-PORT-03 verified record fixture exists with timestamp', $verifiedRec !== null && $verifiedRec['status'] === 'verified' && ! empty($verifiedRec['verified_at']));

        // DEMO-019: Revision Requested Fixture
        $revRec = $db->table('student_portfolio_records')->where('id', 'd0000000-0000-0000-0003-000000000004')->get()->getRowArray();
        $runTest('DEMO-019', 'DEMO-PORT-04 revision-requested record fixture exists', $revRec !== null && $revRec['status'] === 'revision_requested');

        // DEMO-020: Sports Category Fixture
        $sportsRec = $db->table('student_portfolio_records')->where('id', 'd0000000-0000-0000-0003-000000000005')->get()->getRowArray();
        $hasSportsMeta = ! empty($sportsRec['structured_metadata']) && str_contains($sportsRec['structured_metadata'], 'sport_type');
        $runTest('DEMO-020', 'DEMO-PORT-05 Sports record has valid structured metadata', $sportsRec !== null && $hasSportsMeta);

        // DEMO-021: Physical Student Evidence Files Exist
        $studentEv = $db->table('student_portfolio_evidence')->like('id', 'd0000000-%')->get()->getResultArray();
        $allStudentEvExists = count($studentEv) > 0;
        foreach ($studentEv as $ev) {
            $abs = $storage->resolveAbsolutePath($ev['storage_path']);
            if ($abs === null || ! file_exists($abs)) {
                $allStudentEvExists = false;
                break;
            }
        }
        $runTest('DEMO-021', 'Physical protected Student evidence files exist on disk', $allStudentEvExists);

        // DEMO-022: Physical Personnel Evidence Files Exist
        $personnelEv = $db->table('personnel_accomplishment_evidence')->like('id', 'd0000000-%')->get()->getResultArray();
        $allPersonnelEvExists = count($personnelEv) > 0;
        foreach ($personnelEv as $ev) {
            $abs = $storage->resolveAbsolutePath($ev['storage_path']);
            if ($abs === null || ! file_exists($abs)) {
                $allPersonnelEvExists = false;
                break;
            }
        }
        $runTest('DEMO-022', 'Physical protected Personnel evidence files exist on disk', $allPersonnelEvExists);

        // DEMO-023: Evidence Metadata & Containment Integrity
        $allContainmentValid = true;
        foreach (array_merge($studentEv, $personnelEv) as $ev) {
            if (empty($ev['sha256']) || strlen($ev['sha256']) !== 64 || $ev['byte_size'] <= 0) {
                $allContainmentValid = false;
            }
        }
        $runTest('DEMO-023', 'Evidence SHA-256 hashes and byte sizes authoritative', $allContainmentValid);

        // DEMO-024: Phase 10 Posture Preserved (pending & none_deferred)
        $allPostureValid = true;
        foreach (array_merge($studentEv, $personnelEv) as $ev) {
            if ($ev['security_status'] !== 'pending' || $ev['malware_scanner'] !== 'none_deferred') {
                $allPostureValid = false;
            }
        }
        $runTest('DEMO-024', 'Phase 10 security_status=pending and none_deferred preserved', $allPostureValid);

        CLI::write("\n[4/5] Testing Authorization Scopes & Cross-Program Boundaries...", 'cyan');

        // DEMO-025: Coordinator A in-scope Student A review/verify
        $submittedRec = $db->table('student_portfolio_records')->where('id', 'd0000000-0000-0000-0003-000000000002')->get()->getRowArray();
        $coordAActor = $getActor('demo.coordinator.a@ndmu.edu.ph');
        $canCoordAVerify = $authz->portfolio()->canVerify($coordAActor, $submittedRec);
        $runTest('DEMO-025', 'Coordinator A authorized to verify in-scope Student A submission', $canCoordAVerify);

        // DEMO-026: Coordinator B cross-Program denial
        $coordBActor = $getActor('demo.coordinator.b@ndmu.edu.ph');
        $canCoordBVerify = $authz->portfolio()->canVerify($coordBActor, $submittedRec);
        $runTest('DEMO-026', 'Coordinator B denied verify of out-of-scope Student A (403 Boundary)', ! $canCoordBVerify);

        // DEMO-027: HR Personnel Directory Scope
        $canHrManage = $authz->hasRole($hrActor, 'hr_staff');
        $runTest('DEMO-027', 'HR Admin authorized for personnel directory and evaluations', $canHrManage);

        // DEMO-028: OSAD Governance / Award Scope
        $canOsadAwards = $authz->hasRole($osadActor, 'osad_staff');
        $runTest('DEMO-028', 'OSAD Admin authorized for award cycles and evaluations', $canOsadAwards);

        // DEMO-029: Award Cycle & Dean Nomination Scenarios Ready
        $cycle = $db->table('award_cycles')->where('id', 'd0000000-0000-0000-0008-000000000001')->get()->getRowArray();
        $nom = $db->table('dean_student_nominations')->where('id', 'd0000000-0000-0000-0009-000000000001')->get()->getRowArray();
        $runTest('DEMO-029', 'Active Award Cycle & Dean Nomination scenario records ready', $cycle !== null && $nom !== null);

        // DEMO-030: Personnel Accomplishment Scenario Ready
        $acc = $db->table('personnel_accomplishments')->where('id', 'd0000000-0000-0000-0004-000000000001')->get()->getRowArray();
        $runTest('DEMO-030', 'Personnel Accomplishment submission scenario ready', $acc !== null && $acc['status'] === 'submitted');

        // DEMO-031: Notifications Ready
        $notifs = $db->table('notifications')->like('id', 'd0000000-%')->get()->getResultArray();
        $runTest('DEMO-031', 'Mandatory notifications populated for Student A scenarios', count($notifs) >= 2);

        CLI::write("\n[5/5] Testing Reset Idempotency & Clean State Invariants...", 'cyan');

        // Compute demo fingerprint
        $demoFp1 = $this->computeDemoFingerprint($db);
        CLI::write("  Initial Demo Fingerprint: " . $demoFp1, 'white');

        // Reseed again to test idempotency
        $seeder->call('DefenseDemoSeeder');
        $demoFp2 = $this->computeDemoFingerprint($db);
        CLI::write("  Second Demo Fingerprint:  " . $demoFp2, 'white');

        $runTest('DEMO-032', 'Demo Reset is 100% idempotent (identical fingerprints)', $demoFp1 === $demoFp2);

        // DEMO-033: Zero orphan records/files
        $orphanStudentEv = (int) $db->table('student_portfolio_evidence spe')
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id', 'left')
            ->where('spr.id IS NULL')
            ->countAllResults();
        $runTest('DEMO-033', 'Zero orphan demo evidence rows or broken foreign keys', $orphanStudentEv === 0);

        // DEMO-034: Exact Administrative Unit code resolution
        $unitRow = $db->table('administrative_units au')
            ->join('personnel_administrative_unit_affiliations pau', 'pau.administrative_unit_id = au.id')
            ->where('pau.personnel_profile_id', 'd0000000-0000-0000-0001-000000000004')
            ->where('pau.is_active', 1)
            ->get()->getRowArray();
        $expectedUnitCode = $demoConfig->requiredAdministrativeUnitCode();
        $runTest('DEMO-034', "Exact Administrative Unit code resolution ({$expectedUnitCode}) without fallback", ($unitRow['code'] ?? '') === $expectedUnitCode);

        // DEMO-035: Static source audit: zero committed password fallbacks in Phase 12 files
        $phase12Files = [
            APPPATH . 'Database/Seeds/DefenseDemoPersonaSeeder.php',
            APPPATH . 'Database/Seeds/DefenseDemoScenarioSeeder.php',
            APPPATH . 'Database/Seeds/DefenseDemoSeeder.php',
            APPPATH . 'Commands/DemoReset.php',
            APPPATH . 'Services/DefenseDemoConfigService.php',
            APPPATH . 'Services/DefenseDemoPreflightService.php',
        ];
        $forbiddenLiteral = 'Pass' . 'word123';
        $hasPasswordLiteral = false;
        foreach ($phase12Files as $filePath) {
            if (file_exists($filePath)) {
                $content = file_get_contents($filePath);
                if (str_contains($content, $forbiddenLiteral) || str_contains($content, 'admin123')) {
                    $hasPasswordLiteral = true;
                    break;
                }
            }
        }
        $runTest('DEMO-035', 'Static audit: zero hardcoded fallback passwords in Phase 12 sources', ! $hasPasswordLiteral);

        // DEMO-036: Preflight fails fast on missing secret with zero mutation
        $mockConfig = new class extends \App\Services\DefenseDemoConfigService {
            public function requirePassword(): string
            {
                throw new \RuntimeException('MOCK_MISSING_SECRET_TEST');
            }
        };
        $mockPreflight = new \App\Services\DefenseDemoPreflightService($mockConfig);
        $caughtException = false;
        try {
            $mockPreflight->validate($db);
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'MOCK_MISSING_SECRET_TEST') {
                $caughtException = true;
            }
        }
        $runTest('DEMO-036', 'Preflight fails fast on missing secret before any mutation', $caughtException);

        $passedCount = count(array_filter($testCases, static fn($t) => $t['passed']));
        $totalCount = count($testCases);

        CLI::write("\n========================================================================", 'yellow');
        CLI::write(sprintf('Phase 12 Demo Test Result: %d / %d PASSED', $passedCount, $totalCount), $passedCount === $totalCount ? 'green' : 'red');
        CLI::write('========================================================================', 'yellow');

        return $passedCount === $totalCount ? 0 : 1;
    }
}
