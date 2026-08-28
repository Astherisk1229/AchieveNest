<?php

namespace App\Commands;

use App\Database\Seeds\LocalDefenseAuthSeeder;
use App\Services\AuthorizationService;
use App\Services\LocalAuthService;
use App\Services\LocalTokenService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class VerifyPhase8Authz extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:phase8-authz';
    protected $description = 'Executes Phase 8 Authorization & RLS-Replacement Matrix Validation against achievenest_local';

    public function run(array $params)
    {
        CLI::write('========================================================================', 'yellow');
        CLI::write('AchieveNest — Phase 8 Authorization & Security Policy Test Suite', 'yellow');
        CLI::write('========================================================================', 'yellow');

        $db = db_connect();
        $authService = new LocalAuthService();
        $tokenService = new LocalTokenService();
        $authz = new AuthorizationService();

        // 1. Seed deterministic test actors
        CLI::write('[1/4] Ensuring test actor seeds are populated in achievenest_local...', 'cyan');
        $seeder = \Config\Database::seeder();
        $seeder->call('LocalDefenseAuthSeeder');

        // 2. Resolve test actors and generate fresh tokens
        CLI::write('[2/4] Issuing deterministic session tokens for test actors...', 'cyan');

        $password = 'Password123!@#';

        $studentRes = $authService->login('student.01@ndmu.edu.ph', $password);
        $studentToken = $studentRes['data']['access_token'] ?? null;
        $studentActor = $authz->resolveActor('Bearer ' . $studentToken);

        $student2Res = $authService->login('student.02@ndmu.edu.ph', $password);
        $student2Token = $student2Res['data']['access_token'] ?? null;
        $student2Actor = $authz->resolveActor('Bearer ' . $student2Token);

        $coordRes = $authService->login('coord.bscs01@ndmu.edu.ph', $password);
        $coordToken = $coordRes['data']['access_token'] ?? null;
        $coordActor = $authz->resolveActor('Bearer ' . $coordToken);

        $deanRes = $authService->login('dean.cet01@ndmu.edu.ph', $password);
        $deanToken = $deanRes['data']['access_token'] ?? null;
        $deanActor = $authz->resolveActor('Bearer ' . $deanToken);

        $hrRes = $authService->login('hr.admin01@ndmu.edu.ph', $password);
        $hrToken = $hrRes['data']['access_token'] ?? null;
        $hrActor = $authz->resolveActor('Bearer ' . $hrToken);

        $osadRes = $authService->login('osad.admin01@ndmu.edu.ph', $password);
        $osadToken = $osadRes['data']['access_token'] ?? null;
        $osadActor = $authz->resolveActor('Bearer ' . $osadToken);

        $personnelRes = $authService->login('faculty.01@ndmu.edu.ph', $password);
        $personnelToken = $personnelRes['data']['access_token'] ?? null;
        $personnelActor = $authz->resolveActor('Bearer ' . $personnelToken);

        CLI::write('[3/4] Preparing deterministic test fixtures...', 'cyan');

        // Fetch reference data IDs
        $sportsCategory = $db->table('portfolio_categories')->where('code', 'sports')->get()->getRowArray();
        $leadershipCategory = $db->table('portfolio_categories')->where('code', 'leadership')->get()->getRowArray();
        $csProgram = $db->table('academic_programs')->where('code', 'BSCS')->get()->getRowArray();
        $casCollege = $db->table('colleges')->where('code', 'CAS')->get()->getRowArray();
        $cbaCollege = $db->table('colleges')->where('code', 'CBA')->get()->getRowArray();
        $awardDef = $db->table('award_definitions')->where('status', 'active')->get()->getRowArray();

        $catId = $sportsCategory['id'] ?? $leadershipCategory['id'] ?? '11111111-1111-1111-1111-111111111111';
        $awardId = $awardDef['id'] ?? '55555555-5555-5555-5555-555555555555';

        // Student 1 Draft Record
        $draftRecordId = '88888888-0001-0001-0001-000000000001';
        $db->table('student_portfolio_records')->where('id', $draftRecordId)->delete();
        $db->table('student_portfolio_records')->insert([
            'id'                  => $draftRecordId,
            'student_profile_id'  => $studentActor['profile']['id'],
            'category_id'         => $catId,
            'title'               => 'Test Private Draft',
            'status'              => 'draft',
            'created_at'          => date('Y-m-d H:i:s'),
        ]);

        // Student 1 Submitted Record
        $submittedRecordId = '88888888-0001-0001-0001-000000000002';
        $db->table('student_portfolio_records')->where('id', $submittedRecordId)->delete();
        $db->table('student_portfolio_records')->insert([
            'id'                  => $submittedRecordId,
            'student_profile_id'  => $studentActor['profile']['id'],
            'category_id'         => $catId,
            'title'               => 'Test Submitted Record',
            'status'              => 'submitted',
            'submitted_at'        => date('Y-m-d H:i:s'),
            'created_at'          => date('Y-m-d H:i:s'),
        ]);

        // Student 1 Evidence Record
        $evidenceId = '88888888-0001-0001-0001-000000000003';
        $db->table('student_portfolio_evidence')->where('id', $evidenceId)->delete();
        $db->table('student_portfolio_evidence')->insert([
            'id'                  => $evidenceId,
            'portfolio_record_id' => $submittedRecordId,
            'storage_path'        => $studentActor['profile']['id'] . '/cert1.pdf',
            'original_filename'   => 'cert1.pdf',
            'mime_type'           => 'application/pdf',
            'byte_size'           => 2048,
            'uploaded_by'         => $studentActor['profile']['id'],
            'uploaded_at'         => date('Y-m-d H:i:s'),
            'security_status'     => 'clean',
            'status'              => 'active',
        ]);

        $testCases = [];
        $runTest = static function (string $id, string $desc, bool $condition, ?string $detail = null) use (&$testCases) {
            $testCases[] = [
                'id'      => $id,
                'desc'    => $desc,
                'passed'  => $condition,
                'detail'  => $detail,
            ];
            $statusStr = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf('  %-10s %-68s %s', $id, $desc, $statusStr), $color);
        };

        CLI::write("\n[4/4] Executing Negative and Positive Authorization Test Suites...", 'cyan');
        CLI::write('------------------------------------------------------------------------', 'white');
        CLI::write('NEGATIVE TEST MATRIX (AUTHZ-001 through AUTHZ-018)', 'yellow');
        CLI::write('------------------------------------------------------------------------', 'white');

        // AUTHZ-001: Unauthenticated request denied
        $anonActor = $authz->resolveActor(null);
        $runTest('AUTHZ-001', 'Missing authorization token resolves to null actor (401)', $anonActor === null);

        // AUTHZ-002: Cross-student cannot view private draft
        $draftRecord = $db->table('student_portfolio_records')->where('id', $draftRecordId)->get()->getRowArray();
        $canStudent2ViewDraft = $authz->portfolio()->canView($student2Actor, $draftRecord);
        $runTest('AUTHZ-002', 'Cross-student denied viewing private draft record (403)', ! $canStudent2ViewDraft);

        // AUTHZ-003: Cross-student cannot edit or delete another student\'s record
        $canStudent2Edit = $authz->portfolio()->canEdit($student2Actor, $draftRecord);
        $canStudent2Delete = $authz->portfolio()->canDelete($student2Actor, $draftRecord);
        $runTest('AUTHZ-003', 'Cross-student denied modifying or deleting student draft (403)', ! $canStudent2Edit && ! $canStudent2Delete);

        // AUTHZ-004: Student cannot self-verify own submission
        $submittedRecord = $db->table('student_portfolio_records')->where('id', $submittedRecordId)->get()->getRowArray();
        $canSelfVerify = $authz->portfolio()->canVerify($studentActor, $submittedRecord);
        $runTest('AUTHZ-004', 'Student owner denied self-verification (403)', ! $canSelfVerify);

        // AUTHZ-005: Student cannot create personnel accomplishment
        $canStudentCreatePersonnel = $authz->personnel()->canCreateAccomplishment($studentActor);
        $runTest('AUTHZ-005', 'Student denied creating personnel accomplishments (403)', ! $canStudentCreatePersonnel);

        // AUTHZ-006: Cross-program coordinator cannot verify out-of-scope student
        $fakeCoordActor = $coordActor;
        $fakeCoordActor['assignments'] = [
            ['role_key' => 'program_coordinator', 'scope_type' => 'academic_program', 'scope_id' => '00000000-0000-0000-0000-000000000000']
        ];
        $canOutOfScopeCoordVerify = $authz->portfolio()->canVerify($fakeCoordActor, $submittedRecord);
        $runTest('AUTHZ-006', 'Out-of-scope coordinator denied verifying submission (403)', ! $canOutOfScopeCoordVerify);

        // AUTHZ-007: Inactive coordinator assignment denied verification
        $inactiveCoordActor = $coordActor;
        $inactiveCoordActor['assignments'] = [];
        $canInactiveCoordVerify = $authz->portfolio()->canVerify($inactiveCoordActor, $submittedRecord);
        $runTest('AUTHZ-007', 'Inactive coordinator assignment denied verification (403)', ! $canInactiveCoordVerify);

        // AUTHZ-008: Inactive dean assignment cannot nominate students
        $inactiveDeanActor = $deanActor;
        $inactiveDeanActor['assignments'] = [];
        $canInactiveDeanNominate = $authz->award()->canNominateStudent($inactiveDeanActor);
        $runTest('AUTHZ-008', 'Inactive dean assignment denied award nomination (403)', ! $canInactiveDeanNominate);

        // AUTHZ-009: Dean cannot evaluate personnel outside assigned college
        $cbaPersonnel = $db->table('profiles p')
            ->join('personnel_college_affiliations pca', 'pca.personnel_profile_id = p.id AND pca.is_active = 1')
            ->where('pca.college_id', $cbaCollege['id'] ?? '22222222-2222-2222-2222-222222222222')
            ->where('p.account_type', 'personnel')
            ->get()->getRowArray();
        $canDeanEvalCrossCollege = false;
        if ($cbaPersonnel !== null) {
            $canDeanEvalCrossCollege = $authz->personnel()->canEvaluatePersonnel($deanActor, $cbaPersonnel['id']);
        }
        $runTest('AUTHZ-009', 'Dean denied evaluating personnel in unassigned college (403)', ! $canDeanEvalCrossCollege);

        // AUTHZ-010: Moderator cannot verify academic program portfolio records
        $modActor = $studentActor;
        $modActor['roles'] = ['organization_moderator'];
        $modActor['assignments'] = [['role_key' => 'organization_moderator', 'scope_type' => 'organization', 'scope_id' => '1111']];
        $canModVerify = $authz->portfolio()->canVerify($modActor, $submittedRecord);
        $runTest('AUTHZ-010', 'Organization Moderator denied program portfolio verification (403)', ! $canModVerify);

        // AUTHZ-011: Regular personnel cannot perform administrative lifecycle actions
        $canPersonnelManageLifecycle = $authz->governance()->canManageLifecycle($personnelActor, 'student');
        $runTest('AUTHZ-011', 'Regular personnel denied administrative lifecycle actions (403)', ! $canPersonnelManageLifecycle);

        // AUTHZ-012: OSAD Admin cannot assign Dean or provision personnel
        $canOsadAssignDean = $authz->governance()->canAssignDean($osadActor);
        $canOsadProvisionPersonnel = $authz->governance()->canProvisionPersonnel($osadActor);
        $runTest('AUTHZ-012', 'OSAD Admin denied HR governance actions (Assign Dean/Personnel) (403)', ! $canOsadAssignDean && ! $canOsadProvisionPersonnel);

        // AUTHZ-013: HR Admin cannot assign Coordinator or run student award evaluation
        $canHrAssignCoord = $authz->governance()->canAssignCoordinator($hrActor);
        $canHrRunAward = $authz->award()->canRunAwardEvaluation($hrActor);
        $runTest('AUTHZ-013', 'HR Admin denied OSAD governance actions (Assign Coord/Award Eval) (403)', ! $canHrAssignCoord && ! $canHrRunAward);

        // AUTHZ-014: Non-HR actor cannot finalize HR evaluations
        $canOsadManageHREval = $authz->governance()->canManageHREvaluation($osadActor);
        $canDeanManageHREval = $authz->governance()->canManageHREvaluation($deanActor);
        $runTest('AUTHZ-014', 'Non-HR actors denied managing HR evaluations (403)', ! $canOsadManageHREval && ! $canDeanManageHREval);

        // AUTHZ-015: Student cannot spoof profile creation
        $canStudentSpoof = $authz->isStudentOwner($studentActor, $student2Actor['profile']['id']);
        $runTest('AUTHZ-015', 'Student cannot claim ownership of other student ID (403)', ! $canStudentSpoof);

        // AUTHZ-016: Revoked session token denied
        $tempSession = $tokenService->issueToken($studentActor['profile']['id']);
        $tokenService->revokeSession($tempSession['access_token']);
        $revokedActor = $authz->resolveActor('Bearer ' . $tempSession['access_token']);
        $runTest('AUTHZ-016', 'Revoked session token denied resolution (401)', $revokedActor === null);

        // AUTHZ-017: Inactive / suspended account denied resolution
        $db->table('profiles')->where('id', $student2Actor['profile']['id'])->update(['status' => 'suspended']);
        $suspendedTokenRes = $authService->login('student.02@ndmu.edu.ph', $password);
        $db->table('profiles')->where('id', $student2Actor['profile']['id'])->update(['status' => 'active']);
        $runTest('AUTHZ-017', 'Suspended account denied authentication/access (401)', ! ($suspendedTokenRes['success'] ?? true));

        // AUTHZ-018: Unauthorized actor denied reading private evidence
        $evidenceRecord = $db->table('student_portfolio_evidence')->where('id', $evidenceId)->get()->getRowArray();
        $canStudent2ReadEvidence = $authz->evidence()->canReadStudentEvidence($student2Actor, $evidenceRecord);
        $runTest('AUTHZ-018', 'Cross-student denied viewing private student evidence (403)', ! $canStudent2ReadEvidence);

        CLI::write("\n------------------------------------------------------------------------", 'white');
        CLI::write('POSITIVE TEST MATRIX (AUTHZ-P01 through AUTHZ-P10)', 'yellow');
        CLI::write('------------------------------------------------------------------------', 'white');

        // AUTHZ-P01: Student can view own records
        $canStudentViewOwnDraft = $authz->portfolio()->canView($studentActor, $draftRecord);
        $canStudentViewOwnSubmitted = $authz->portfolio()->canView($studentActor, $submittedRecord);
        $runTest('AUTHZ-P01', 'Student can view own draft and submitted records (200)', $canStudentViewOwnDraft && $canStudentViewOwnSubmitted);

        // AUTHZ-P02: Student can create, edit, submit, and attach evidence
        $canStudentCreate = $authz->portfolio()->canCreate($studentActor);
        $canStudentEdit = $authz->portfolio()->canEdit($studentActor, $draftRecord);
        $canStudentSubmit = $authz->portfolio()->canSubmit($studentActor, $draftRecord);
        $canStudentUploadEv = $authz->evidence()->canUploadStudentEvidence($studentActor, $draftRecord);
        $runTest('AUTHZ-P02', 'Student can create, edit, submit, and upload evidence to own draft (200)', $canStudentCreate && $canStudentEdit && $canStudentSubmit && $canStudentUploadEv);

        // AUTHZ-P03: Active Program Coordinator can verify student in assigned program
        $canCoordVerify = $authz->portfolio()->canVerify($coordActor, $submittedRecord);
        $runTest('AUTHZ-P03', 'Active Program Coordinator can verify in-scope student submission (200)', $canCoordVerify);

        // AUTHZ-P04: HR Admin can manage personnel, evaluations, and Dean assignments
        $canHrViewPersonnel = $authz->personnel()->canEvaluatePersonnel($hrActor);
        $canHrAssignDean = $authz->governance()->canAssignDean($hrActor);
        $canHrProvision = $authz->governance()->canProvisionPersonnel($hrActor);
        $runTest('AUTHZ-P04', 'HR Admin authorized for personnel evaluations & Dean assignments (200)', $canHrViewPersonnel && $canHrAssignDean && $canHrProvision);

        // AUTHZ-P05: OSAD Admin can manage student awards, coordinators, and moderators
        $canOsadAward = $authz->award()->canRunAwardEvaluation($osadActor);
        $canOsadAssignCoord = $authz->governance()->canAssignCoordinator($osadActor);
        $canOsadAssignMod = $authz->governance()->canAssignModerator($osadActor);
        $runTest('AUTHZ-P05', 'OSAD Admin authorized for award evaluation & coordinator assignment (200)', $canOsadAward && $canOsadAssignCoord && $canOsadAssignMod);

        // AUTHZ-P06: Active Dean can view student portfolio in assigned college
        $canDeanViewStudent = $authz->portfolio()->canView($deanActor, $submittedRecord);
        $runTest('AUTHZ-P06', 'Active Dean can view student portfolio in assigned college (200)', $canDeanViewStudent);

        // AUTHZ-P07: Active Dean can nominate student across university for awards
        $canDeanNominate = $authz->award()->canNominateStudent($deanActor);
        $runTest('AUTHZ-P07', 'Active Dean authorized for student award nominations (cross-college) (200)', $canDeanNominate);

        // AUTHZ-P08: Organization Moderator assignments resolved
        $modAssignment = $db->table('organization_moderator_assignments')->where('is_active', 1)->get()->getRowArray();
        $runTest('AUTHZ-P08', 'Organization Moderator assignment active in database (200)', $modAssignment !== null);

        // AUTHZ-P09: Personnel can create and manage own accomplishments
        $canPersonnelCreate = $authz->personnel()->canCreateAccomplishment($personnelActor);
        $runTest('AUTHZ-P09', 'Personnel can create and manage own accomplishments (200)', $canPersonnelCreate);

        // AUTHZ-P10: EvidencePolicy permits authorized reviewers to view evidence
        $canCoordReadEv = $authz->evidence()->canReadStudentEvidence($coordActor, $evidenceRecord);
        $canDeanReadEv = $authz->evidence()->canReadStudentEvidence($deanActor, $evidenceRecord);
        $canOsadReadEv = $authz->evidence()->canReadStudentEvidence($osadActor, $evidenceRecord);
        $runTest('AUTHZ-P10', 'Authorized reviewers (Coordinator, Dean, OSAD) can read evidence (200)', $canCoordReadEv && $canDeanReadEv && $canOsadReadEv);

        // Cleanup fixtures
        $db->table('student_portfolio_evidence')->where('id', $evidenceId)->delete();
        $db->table('student_portfolio_records')->whereIn('id', [$draftRecordId, $submittedRecordId])->delete();

        $passedCount = count(array_filter($testCases, static fn($t) => $t['passed']));
        $totalCount = count($testCases);

        CLI::write("\n========================================================================", 'yellow');
        CLI::write(sprintf('Phase 8 Authorization Test Result: %d / %d PASSED', $passedCount, $totalCount), $passedCount === $totalCount ? 'green' : 'red');
        CLI::write('========================================================================', 'yellow');

        return $passedCount === $totalCount ? 0 : 1;
    }
}
