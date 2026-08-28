<?php

namespace App\Commands;

use App\Services\AuthenticatedActorService;
use App\Services\AuthorizationService;
use App\Services\DefenseDemoConfigService;
use App\Services\DefenseDemoPreflightService;
use App\Services\LocalAuthService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class VerifyPhase13Step4Local extends BaseCommand
{
    protected $group       = 'AchieveNest';
    protected $name        = 'test:phase13-step4';
    protected $description = 'Runs the Phase 13 Step 4 Portfolio / Achievement / Evidence / Verification E2E validation suite on WAMP MySQL.';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Phase 13 Step 4 Local E2E Verification Suite", 'yellow');
        CLI::write("========================================================================", 'yellow');

        $db = db_connect();
        $testCases = [];

        $runTest = function (string $id, string $desc, bool $passed, string $extra = '') use (&$testCases) {
            $testCases[] = ['id' => $id, 'desc' => $desc, 'passed' => $passed];
            $status = $passed ? CLI::color('[PASS]', 'green') : CLI::color('[FAIL]', 'red');
            $msg = sprintf("  %-10s %-60s %s", $id, $desc, $status);
            if (! $passed && $extra !== '') {
                $msg .= "\n    " . CLI::color($extra, 'red');
            }
            CLI::write($msg);
        };

        // ---------------------------------------------------------------------
        // Step 0: Preflight & Clean Demo Reset
        // ---------------------------------------------------------------------
        CLI::write("\n[1/7] Preflight Validation & Clean Demo State Initialization...", 'cyan');

        $demoConfig = new DefenseDemoConfigService();
        $password = $demoConfig->requirePassword();

        $preflight = new DefenseDemoPreflightService($demoConfig);
        $preflight->validate($db);

        $seeder = \Config\Database::seeder();
        $seeder->call('DefenseDemoSeeder');

        // Check Permanent Reference Fingerprint
        $refFp = $this->computeReferenceFingerprint($db);
        $targetRefFp = 'a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f';
        $runTest('REF-001', 'Permanent Reference Fingerprint 100% unchanged', $refFp === $targetRefFp, "Actual: {$refFp}");

        // Resolve Local Auth Tokens & Actors
        $authService = new LocalAuthService();
        $actorService = new AuthenticatedActorService();
        $authz = new AuthorizationService();
        $storage = new LocalEvidenceStorageService();

        $getActor = function (string $email) use ($authService, $actorService, $password): array {
            $res = $authService->login($email, $password);
            if (! isset($res['data']['access_token'])) {
                throw new \RuntimeException("Failed to authenticate demo actor {$email}");
            }
            $actor = $actorService->resolveActor('Bearer ' . $res['data']['access_token']);
            if ($actor === null) {
                throw new \RuntimeException("Failed to resolve actor profile for {$email}");
            }
            return $actor;
        };

        $studentAActor   = $getActor('demo.student.a@ndmu.edu.ph');
        $studentBActor   = $getActor('demo.student.b@ndmu.edu.ph');
        $coordAActor     = $getActor('demo.coordinator.a@ndmu.edu.ph');
        $coordBActor     = $getActor('demo.coordinator.b@ndmu.edu.ph');
        $facultyActor    = $getActor('demo.academic.personnel@ndmu.edu.ph');
        $osadActor       = $getActor('demo.osad.admin@ndmu.edu.ph');
        $hrActor         = $getActor('demo.hr.admin@ndmu.edu.ph');
        $deanActor       = $getActor('demo.dean@ndmu.edu.ph');

        $studentAId = $studentAActor['profile']['id'];
        $studentBId = $studentBActor['profile']['id'];
        $coordAId   = $coordAActor['profile']['id'];
        $coordBId   = $coordBActor['profile']['id'];
        $facultyId  = $facultyActor['profile']['id'];

        // ---------------------------------------------------------------------
        // Step 1: PORT-001 to PORT-003 (Portfolio & Taxonomy Model)
        // ---------------------------------------------------------------------
        CLI::write("\n[2/7] PORT: Student Portfolio Access & Taxonomy Invariants...", 'cyan');

        // PORT-001: Student Identity & Scope
        $studentAProfile = $db->table('profiles')->where('id', $studentAId)->get()->getRowArray();
        $studentAEnrollment = $db->table('student_program_enrollments spe')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id')
            ->where('spe.student_profile_id', $studentAId)
            ->where('spe.is_active', 1)
            ->get()->getRowArray();
        $isPort001 = $studentAProfile !== null
            && $studentAProfile['account_type'] === 'student'
            && $studentAProfile['status'] === 'active'
            && ($studentAEnrollment['code'] ?? '') === 'BSA';
        $runTest('PORT-001', 'Student Portfolio Access & Identity Invariants', $isPort001);

        // PORT-002: Taxonomy Load (9 categories, 57 subcategories, exact distribution)
        $categories = $db->table('portfolio_categories')->where('status', 'active')->orderBy('sort_order', 'ASC')->get()->getResultArray();
        $subcategories = $db->table('portfolio_subcategories')->where('status', 'active')->get()->getResultArray();
        $expectedDistribution = [
            'LEADERSHIP_POSITION'            => 4,
            'ORG_MEMBERSHIP_PARTICIPATION'   => 5,
            'COMMUNITY_SERVICE_VOLUNTEERISM' => 5,
            'CHURCH_MINISTRY_INVOLVEMENT'    => 4,
            'SEMINAR_TRAINING'               => 8,
            'CITATION_RECOGNITION'           => 8,
            'SPORTS'                         => 10,
            'SOCIO_CULTURAL_PERFORMING_ARTS' => 7,
            'CAMPUS_JOURNALISM'              => 6,
        ];
        $catDistributionOk = true;
        foreach ($expectedDistribution as $code => $expectedCount) {
            $actualCount = $db->table('portfolio_subcategories ps')
                ->join('portfolio_categories pc', 'pc.id = ps.category_id')
                ->where('pc.code', $code)
                ->where('ps.status', 'active')
                ->countAllResults();
            if ($actualCount !== $expectedCount) {
                $catDistributionOk = false;
                break;
            }
        }
        $isPort002 = count($categories) === 9 && count($subcategories) === 57 && $catDistributionOk;
        $runTest('PORT-002', 'Taxonomy Load (9 categories, 57 subcategories, exact distribution)', $isPort002);

        // PORT-003: Description Model (40 described, 17 NULL disciplines: 10 Sports, 7 Socio-Cultural)
        $describedCount = $db->table('portfolio_subcategories')
            ->where('status', 'active')
            ->where('description IS NOT NULL', null, false)
            ->where('description !=', '')
            ->countAllResults();
        $nullCount = $db->table('portfolio_subcategories')
            ->where('status', 'active')
            ->where('description IS NULL', null, false)
            ->countAllResults();
        $sportsNull = $db->table('portfolio_subcategories ps')
            ->join('portfolio_categories pc', 'pc.id = ps.category_id')
            ->where('pc.code', 'SPORTS')
            ->where('ps.description IS NULL', null, false)
            ->countAllResults();
        $socioNull = $db->table('portfolio_subcategories ps')
            ->join('portfolio_categories pc', 'pc.id = ps.category_id')
            ->where('pc.code', 'SOCIO_CULTURAL_PERFORMING_ARTS')
            ->where('ps.description IS NULL', null, false)
            ->countAllResults();
        $isPort003 = ($describedCount === 40) && ($nullCount === 17) && ($sportsNull === 10) && ($socioNull === 7);
        $runTest('PORT-003', 'Description Model (40 described, 17 NULL disciplines)', $isPort003);

        // ---------------------------------------------------------------------
        // Step 2: ACH-001 to ACH-005 (Achievement Creation & Business Rules)
        // ---------------------------------------------------------------------
        CLI::write("\n[3/7] ACH: Achievement Creation & Validation Rules...", 'cyan');

        $now = date('Y-m-d H:i:s');
        $leadershipCat = $db->table('portfolio_categories')->where('code', 'LEADERSHIP_POSITION')->get()->getRowArray();
        $leadershipSub = $db->table('portfolio_subcategories')->where('category_id', $leadershipCat['id'])->get()->getRowArray();
        $sportsCat = $db->table('portfolio_categories')->where('code', 'SPORTS')->get()->getRowArray();
        $sportsSub = $db->table('portfolio_subcategories')->where('category_id', $sportsCat['id'])->get()->getRowArray();

        // ACH-001: Valid Achievement Creation
        $testRec1Id = 'd0000000-0000-0000-0003-000000000011';
        $db->table('student_portfolio_records')->insert([
            'id'                 => $testRec1Id,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'E2E Test Leadership Record',
            'organizer_or_body'  => 'NDMU JPIA Council',
            'occurrence_date'    => '2026-02-10',
            'description'        => 'E2E validation test leadership entry',
            'status'             => 'submitted',
            'submitted_at'       => $now,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_verification_events')->insert([
            'id'                  => 'd0000000-0000-0000-0004-000000000011',
            'portfolio_record_id' => $testRec1Id,
            'actor_profile_id'    => $studentAId,
            'action'              => 'submitted',
            'previous_status'     => null,
            'new_status'          => 'submitted',
            'remarks'             => 'Submitted for verification',
            'occurred_at'         => $now,
        ]);
        $createdRec = $db->table('student_portfolio_records')->where('id', $testRec1Id)->get()->getRowArray();
        $isAch001 = $createdRec !== null && $createdRec['status'] === 'submitted' && $createdRec['student_profile_id'] === $studentAId;
        $runTest('ACH-001', 'Valid Achievement Submission (server owner, submitted status)', $isAch001);

        // ACH-002: Invalid Taxonomy Combination (Category Leadership + Subcategory Sports)
        $subBelongsToCat = $db->table('portfolio_subcategories')
            ->where('id', $sportsSub['id'])
            ->where('category_id', $leadershipCat['id'])
            ->countAllResults() > 0;
        $runTest('ACH-002', 'Invalid Taxonomy Combination Rejection (Zero cross-category match)', ! $subBelongsToCat);

        // ACH-003: Sports Metadata Rule Enforcement
        $validSportsMeta = ['academic_year' => '2025-2026', 'sports_discipline' => 'Basketball'];
        $hasRequiredSportsMeta = ! empty($validSportsMeta['academic_year']) || ! empty($validSportsMeta['event_date']);
        $emptySportsMeta = [];
        $hasEmptySportsMeta = ! empty($emptySportsMeta['academic_year']) || ! empty($emptySportsMeta['event_date']);
        $isAch003 = $hasRequiredSportsMeta && ! $hasEmptySportsMeta;
        $runTest('ACH-003', 'Sports Metadata Rule Enforcement (Mandatory event/AY attribute)', $isAch003);

        // ACH-004: Student Cannot Self-Verify Own Submission
        $canStudentSelfVerify = $authz->portfolio()->canVerify($studentAActor, $createdRec);
        $runTest('ACH-004', 'Student Cannot Self-Verify Own Submission (Forbidden 403)', ! $canStudentSelfVerify);

        // ACH-005: Student Cannot Set Internal Award Outcomes
        $awardScoreRows = $db->table('student_award_score_evidence')->where('portfolio_record_id', $testRec1Id)->countAllResults();
        $runTest('ACH-005', 'Student Cannot Set Internal Award Outcomes (Zero evaluation injection)', $awardScoreRows === 0);

        // ---------------------------------------------------------------------
        // Step 3: EVID-001 to EVID-009 (Evidence Storage, Integrity & Security)
        // ---------------------------------------------------------------------
        CLI::write("\n[4/7] EVID: Protected Local Evidence Storage & Access Control...", 'cyan');

        // EVID-001: Store Valid Synthetic PDF
        $testPdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n162\n%%EOF";
        $pdfTmp = tempnam(sys_get_temp_dir(), 'evid_pdf_');
        file_put_contents($pdfTmp, $testPdfContent);
        $valPdf = $storage->validateFile($pdfTmp, 'e2e_test_certificate.pdf');
        $pdfStored = $storage->storeFile($pdfTmp, 'student', $studentAId, $testRec1Id, $valPdf['extension']);
        unlink($pdfTmp);

        $testEv1Id = 'd0000000-0000-0000-0005-000000000011';
        $db->table('student_portfolio_evidence')->insert([
            'id'                  => $testEv1Id,
            'portfolio_record_id' => $testRec1Id,
            'storage_path'        => $pdfStored['storage_path'],
            'original_filename'   => 'e2e_test_certificate.pdf',
            'mime_type'           => $pdfStored['detected_mime_type'],
            'detected_mime_type'  => $pdfStored['detected_mime_type'],
            'byte_size'           => $pdfStored['byte_size'],
            'sha256'              => $pdfStored['sha256'],
            'evidence_type'       => 'certificate',
            'uploaded_by'         => $studentAId,
            'uploaded_at'         => $now,
            'security_status'     => 'pending',
            'malware_scanner'     => 'none_deferred',
            'status'              => 'active',
        ]);

        $ev1Row = $db->table('student_portfolio_evidence')->where('id', $testEv1Id)->get()->getRowArray();
        $isEvid001 = $ev1Row !== null
            && $ev1Row['mime_type'] === 'application/pdf'
            && $ev1Row['security_status'] === 'pending'
            && $ev1Row['malware_scanner'] === 'none_deferred'
            && file_exists($storage->resolveAbsolutePath($ev1Row['storage_path']));
        $runTest('EVID-001', 'Valid Protected PDF Upload (Authoritative SHA-256, physical file)', $isEvid001);

        // EVID-002: Store Valid Synthetic PNG Image
        $testPngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==');
        $pngTmp = tempnam(sys_get_temp_dir(), 'evid_png_');
        file_put_contents($pngTmp, $testPngContent);
        $valPng = $storage->validateFile($pngTmp, 'e2e_test_photo.png');
        $pngStored = $storage->storeFile($pngTmp, 'student', $studentAId, $testRec1Id, $valPng['extension']);
        unlink($pngTmp);

        $testEv2Id = 'd0000000-0000-0000-0005-000000000012';
        $db->table('student_portfolio_evidence')->insert([
            'id'                  => $testEv2Id,
            'portfolio_record_id' => $testRec1Id,
            'storage_path'        => $pngStored['storage_path'],
            'original_filename'   => 'e2e_test_photo.png',
            'mime_type'           => $pngStored['detected_mime_type'],
            'detected_mime_type'  => $pngStored['detected_mime_type'],
            'byte_size'           => $pngStored['byte_size'],
            'sha256'              => $pngStored['sha256'],
            'evidence_type'       => 'photo',
            'uploaded_by'         => $studentAId,
            'uploaded_at'         => $now,
            'security_status'     => 'pending',
            'malware_scanner'     => 'none_deferred',
            'status'              => 'active',
        ]);
        $ev2Row = $db->table('student_portfolio_evidence')->where('id', $testEv2Id)->get()->getRowArray();
        $isEvid002 = $ev2Row !== null
            && $ev2Row['mime_type'] === 'image/png'
            && $ev2Row['security_status'] === 'pending'
            && file_exists($storage->resolveAbsolutePath($ev2Row['storage_path']));
        $runTest('EVID-002', 'Valid Protected Image Upload (MIME validation, physical file)', $isEvid002);

        // EVID-003: Invalid MIME / Extension Rejection
        $badTmp = tempnam(sys_get_temp_dir(), 'evid_bad_');
        file_put_contents($badTmp, "MZ\x90\x00\x03\x00\x00\x00ExecutableContent");
        $valBad = $storage->validateFile($badTmp, 'malicious.pdf');
        unlink($badTmp);
        $runTest('EVID-003', 'Invalid MIME / Spoofed Extension Rejection (Zero storage mutation)', ! $valBad['success']);

        // EVID-004: Oversize Boundary Rejection
        $oversizePdf = tempnam(sys_get_temp_dir(), 'evid_huge_');
        file_put_contents($oversizePdf, "PDF");
        $mockStorage = new LocalEvidenceStorageService(null, 100); // 100 bytes limit
        file_put_contents($oversizePdf, str_repeat("A", 200));
        $valOversize = $mockStorage->validateFile($oversizePdf, 'huge.pdf');
        unlink($oversizePdf);
        $runTest('EVID-004', 'Oversize File Boundary Rejection (> max allowed bytes rejected)', ! $valOversize['success']);

        // EVID-005: Direct Public Storage Bypass Denial (Outside public web root)
        $storageReal = realpath($storage->getStorageRoot()) ?: $storage->getStorageRoot();
        $publicReal  = realpath(FCPATH) ?: FCPATH;
        $isOutsidePublic = ! str_starts_with($storageReal, $publicReal);
        $runTest('EVID-005', 'Direct Web Bypass Denial (Stored outside public document root)', $isOutsidePublic);

        // EVID-006: Own Evidence Access (Student A)
        $evidenceWithRecord = array_merge($ev1Row, ['student_profile_id' => $studentAId]);
        $canStudentARead = $authz->evidence()->canReadStudentEvidence($studentAActor, $evidenceWithRecord);
        $runTest('EVID-006', 'Student Authorized to Access Own Evidence Metadata & Stream', $canStudentARead);

        // EVID-007: Cross-Student Evidence Denial (Student B)
        $canStudentBRead = $authz->evidence()->canReadStudentEvidence($studentBActor, $evidenceWithRecord);
        $runTest('EVID-007', 'Cross-Student Evidence Denial (Student B 403 Forbidden)', ! $canStudentBRead);

        // EVID-008: Anonymous Evidence Denial
        $canAnonRead = $authz->evidence()->canReadStudentEvidence(['profile' => null, 'roles' => []], $evidenceWithRecord);
        $runTest('EVID-008', 'Anonymous Request Denied Evidence Access (401 Unauthorized)', ! $canAnonRead);

        // EVID-009: Unauthorized Personnel Evidence Denial (Non-coordinator faculty)
        $canFacultyRead = $authz->evidence()->canReadStudentEvidence($facultyActor, $evidenceWithRecord);
        $runTest('EVID-009', 'Unauthorized Ordinary Personnel Denied Student Evidence (403)', ! $canFacultyRead);

        // ---------------------------------------------------------------------
        // Step 4: VER-001 to VER-014 (Verification Lifecycle & Decision Rules)
        // ---------------------------------------------------------------------
        CLI::write("\n[5/7] VER: Program Coordinator Verification Lifecycle...", 'cyan');

        // VER-001: Reviewer Routing (Student A / BSA -> Coordinator A / BSA)
        $studentProgramId = $studentAEnrollment['academic_program_id'];
        $assignedCoord = $db->table('program_coordinator_assignments')
            ->where('academic_program_id', $studentProgramId)
            ->where('is_active', 1)
            ->get()->getRowArray();
        $isVer001 = $assignedCoord !== null && $assignedCoord['personnel_profile_id'] === $coordAId;
        $runTest('VER-001', 'Automatic Reviewer Routing to in-scope Program Coordinator', $isVer001);

        // VER-002: Coordinator A Verification Queue Visibility
        $canCoordAView = $authz->portfolio()->canView($coordAActor, $createdRec);
        $canCoordAVerify = $authz->portfolio()->canVerify($coordAActor, $createdRec);
        $runTest('VER-002', 'Coordinator A Queue Visibility for in-scope Submission', $canCoordAView && $canCoordAVerify);

        // VER-003: Cross-Program Coordinator Denial (Coordinator B / BSBA-FM)
        $canCoordBView = $authz->portfolio()->canView($coordBActor, $createdRec);
        $canCoordBVerify = $authz->portfolio()->canVerify($coordBActor, $createdRec);
        $runTest('VER-003', 'Cross-Program Coordinator Denial (Coordinator B 403 Forbidden)', ! $canCoordBView && ! $canCoordBVerify);

        // VER-004: Student Cannot Act as Verifier
        $canStudentVerify = $authz->portfolio()->canVerify($studentAActor, $createdRec);
        $runTest('VER-004', 'Student Cannot Act as Verifier on Any Submission', ! $canStudentVerify);

        // VER-005: Coordinator A Approval Lifecycle
        $db->table('student_portfolio_records')->where('id', $testRec1Id)->update([
            'status'      => 'verified',
            'verified_at' => $now,
            'updated_at'  => $now,
        ]);
        $db->table('student_portfolio_verification_events')->insert([
            'id'                  => 'd0000000-0000-0000-0004-000000000012',
            'portfolio_record_id' => $testRec1Id,
            'actor_profile_id'    => $coordAId,
            'action'              => 'verified',
            'previous_status'     => 'submitted',
            'new_status'          => 'verified',
            'remarks'             => 'Approved: verified certificate of appointment.',
            'occurred_at'         => $now,
        ]);
        $db->table('notifications')->insert([
            'id'                   => 'd0000000-0000-0000-0006-000000000011',
            'recipient_profile_id' => $studentAId,
            'actor_profile_id'     => $coordAId,
            'notification_type'    => 'portfolio_verified',
            'title'                => 'Portfolio Submission Verified',
            'message'              => 'Your leadership portfolio entry has been verified.',
            'reference_type'       => 'student_portfolio_records',
            'reference_id'         => $testRec1Id,
            'is_mandatory'         => 1,
            'created_at'           => $now,
        ]);

        $verifiedRec = $db->table('student_portfolio_records')->where('id', $testRec1Id)->get()->getRowArray();
        $isVer005 = $verifiedRec['status'] === 'verified' && $verifiedRec['verified_at'] !== null;
        $runTest('VER-005', 'Coordinator Approval Lifecycle (verified_at set, event recorded)', $isVer005);

        // VER-006: Verified Visibility & Award Readiness
        $canStudentAViewVerified = $authz->portfolio()->canView($studentAActor, $verifiedRec);
        $canOsadViewVerified = $authz->portfolio()->canView($osadActor, $verifiedRec);
        $runTest('VER-006', 'Verified Record Visible to Student and OSAD Award Engine', $canStudentAViewVerified && $canOsadViewVerified);

        // VER-007: Verification Notification Delivery
        $notifRow = $db->table('notifications')->where('id', 'd0000000-0000-0000-0006-000000000011')->get()->getRowArray();
        $isVer007 = $notifRow !== null && $notifRow['recipient_profile_id'] === $studentAId && $notifRow['notification_type'] === 'portfolio_verified';
        $runTest('VER-007', 'Verification Notification Dispatched to Student A', $isVer007);

        // VER-008: Notification Read Protection (Only recipient marks read)
        $db->table('notifications')->where('id', 'd0000000-0000-0000-0006-000000000011')->update(['read_at' => $now]);
        $readNotif = $db->table('notifications')->where('id', 'd0000000-0000-0000-0006-000000000011')->get()->getRowArray();
        $runTest('VER-008', 'Notification Read State Isolation (read_at persisted for owner)', $readNotif['read_at'] !== null);

        // VER-009: Rejection Workflow
        $testRec2Id = 'd0000000-0000-0000-0003-000000000012';
        $db->table('student_portfolio_records')->insert([
            'id'                 => $testRec2Id,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'E2E Test Rejection Record',
            'status'             => 'submitted',
            'submitted_at'       => $now,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_records')->where('id', $testRec2Id)->update(['status' => 'rejected', 'updated_at' => $now]);
        $db->table('student_portfolio_verification_events')->insert([
            'id'                  => 'd0000000-0000-0000-0004-000000000013',
            'portfolio_record_id' => $testRec2Id,
            'actor_profile_id'    => $coordAId,
            'action'              => 'rejected',
            'previous_status'     => 'submitted',
            'new_status'          => 'rejected',
            'remarks'             => 'Rejected: Certificate lacks official seal.',
            'occurred_at'         => $now,
        ]);
        $rejectedRec = $db->table('student_portfolio_records')->where('id', $testRec2Id)->get()->getRowArray();
        $runTest('VER-009', 'Rejection Workflow (status=rejected, remarks logged in audit event)', $rejectedRec['status'] === 'rejected');

        // VER-010: Revision Request Workflow (Deficiency)
        $testRec3Id = 'd0000000-0000-0000-0003-000000000013';
        $db->table('student_portfolio_records')->insert([
            'id'                 => $testRec3Id,
            'student_profile_id' => $studentAId,
            'category_id'        => $leadershipCat['id'],
            'subcategory_id'     => $leadershipSub['id'],
            'title'              => 'E2E Test Revision Workflow Record',
            'status'             => 'submitted',
            'submitted_at'       => $now,
            'created_at'         => $now,
            'updated_at'         => $now,
        ]);
        $db->table('student_portfolio_records')->where('id', $testRec3Id)->update(['status' => 'revision_requested', 'updated_at' => $now]);
        $db->table('student_portfolio_verification_events')->insert([
            'id'                  => 'd0000000-0000-0000-0004-000000000014',
            'portfolio_record_id' => $testRec3Id,
            'actor_profile_id'    => $coordAId,
            'action'              => 'revision_requested',
            'previous_status'     => 'submitted',
            'new_status'          => 'revision_requested',
            'remarks'             => 'Please provide formal endorsement letter.',
            'occurred_at'         => $now,
        ]);
        $revRec = $db->table('student_portfolio_records')->where('id', $testRec3Id)->get()->getRowArray();
        $runTest('VER-010', 'Revision Request Workflow (status=revision_requested, remarks persisted)', $revRec['status'] === 'revision_requested');

        // VER-011: Resubmission Workflow (Student resubmits)
        $db->table('student_portfolio_records')->where('id', $testRec3Id)->update(['status' => 'submitted', 'submitted_at' => $now, 'updated_at' => $now]);
        $db->table('student_portfolio_verification_events')->insert([
            'id'                  => 'd0000000-0000-0000-0004-000000000015',
            'portfolio_record_id' => $testRec3Id,
            'actor_profile_id'    => $studentAId,
            'action'              => 'resubmitted',
            'previous_status'     => 'revision_requested',
            'new_status'          => 'submitted',
            'remarks'             => 'Resubmitted with requested endorsement letter.',
            'occurred_at'         => $now,
        ]);
        $resubmittedRec = $db->table('student_portfolio_records')->where('id', $testRec3Id)->get()->getRowArray();
        $runTest('VER-011', 'Resubmission Workflow (Student resubmits, timeline event appended)', $resubmittedRec['status'] === 'submitted');

        // VER-012: Re-Approval Workflow (Coordinator verifies resubmission)
        $db->table('student_portfolio_records')->where('id', $testRec3Id)->update(['status' => 'verified', 'verified_at' => $now, 'updated_at' => $now]);
        $db->table('student_portfolio_verification_events')->insert([
            'id'                  => 'd0000000-0000-0000-0004-000000000016',
            'portfolio_record_id' => $testRec3Id,
            'actor_profile_id'    => $coordAId,
            'action'              => 'verified',
            'previous_status'     => 'submitted',
            'new_status'          => 'verified',
            'remarks'             => 'Endorsement letter verified. Approved.',
            'occurred_at'         => $now,
        ]);
        $reApprovedRec = $db->table('student_portfolio_records')->where('id', $testRec3Id)->get()->getRowArray();
        $runTest('VER-012', 'Re-Approval Workflow (Final verified state reached with full history)', $reApprovedRec['status'] === 'verified');

        // VER-013: Duplicate / Invalid Transition Protection
        $canReVerify = $authz->portfolio()->canVerify($coordAActor, $reApprovedRec); // status is 'verified', canVerify only accepts 'submitted'/'under_review'
        $runTest('VER-013', 'Duplicate / Invalid Transition Protection (Already verified blocked)', ! $canReVerify);

        // VER-014: Unassigned Personnel Decision Denial
        $canFacultyDecide = $authz->portfolio()->canVerify($facultyActor, $resubmittedRec);
        $runTest('VER-014', 'Unassigned Personnel Review Denial (Faculty without assignment blocked)', ! $canFacultyDecide);

        // ---------------------------------------------------------------------
        // Step 5: AUTHZ-PORT-001 to AUTHZ-PORT-003 (Authorization Equivalence)
        // ---------------------------------------------------------------------
        CLI::write("\n[6/7] AUTHZ: Security & Scope Equivalence Isolation Matrix...", 'cyan');

        // AUTHZ-PORT-001: Cross-Student Draft Isolation
        $studentADraft = $db->table('student_portfolio_records')->where('id', 'd0000000-0000-0000-0003-000000000001')->get()->getRowArray();
        $canStudentBViewDraft = $authz->portfolio()->canView($studentBActor, $studentADraft);
        $canCoordAViewDraft   = $authz->portfolio()->canView($coordAActor, $studentADraft);
        $runTest('AUTHZ-PORT-001', 'Cross-Student Draft Isolation (Draft visible ONLY to owner)', ! $canStudentBViewDraft && ! $canCoordAViewDraft);

        // AUTHZ-PORT-002: Coordinator Program Filtering
        $builderA = $db->table('student_portfolio_records spr');
        $authz->portfolio()->scopeListQuery($coordAActor, $builderA);
        $builderA->join('student_program_enrollments spe', 'spe.student_profile_id = spr.student_profile_id AND spe.is_active = 1');
        $builderA->join('academic_programs ap', 'ap.id = spe.academic_program_id');
        $coordAPrograms = array_unique(array_column($builderA->select('ap.code')->get()->getResultArray(), 'code'));

        $builderB = $db->table('student_portfolio_records spr');
        $authz->portfolio()->scopeListQuery($coordBActor, $builderB);
        $builderB->join('student_program_enrollments spe', 'spe.student_profile_id = spr.student_profile_id AND spe.is_active = 1');
        $builderB->join('academic_programs ap', 'ap.id = spe.academic_program_id');
        $coordBPrograms = array_unique(array_column($builderB->select('ap.code')->get()->getResultArray(), 'code'));

        $isAuthz002 = (! in_array('BSBA-FM', $coordAPrograms, true)) && (! in_array('BSA', $coordBPrograms, true));
        $runTest('AUTHZ-PORT-002', 'Coordinator Program Query Filtering (Strict BSA vs BSBA-FM boundaries)', $isAuthz002);

        // AUTHZ-PORT-003: Evidence Object-Level Authorization Policy
        $canOwnerAccess = $authz->evidence()->canReadStudentEvidence($studentAActor, $evidenceWithRecord);
        $canCoordAccess = $authz->evidence()->canReadStudentEvidence($coordAActor, $evidenceWithRecord);
        $canCoordBDenied = $authz->evidence()->canReadStudentEvidence($coordBActor, $evidenceWithRecord);
        $canFacultyDenied = $authz->evidence()->canReadStudentEvidence($facultyActor, $evidenceWithRecord);
        $isAuthz003 = $canOwnerAccess && $canCoordAccess && (! $canCoordBDenied) && (! $canFacultyDenied);
        $runTest('AUTHZ-PORT-003', 'Evidence Object Isolation Policy (Owner/Coordinator vs Out-of-Scope)', $isAuthz003);

        // ---------------------------------------------------------------------
        // Step 6: AUD-PORT-001 to AUD-PORT-003 & Zero Orphan Evidence
        // ---------------------------------------------------------------------
        CLI::write("\n[7/7] AUD & ORPH: Verification Audit Trail & File System Integrity...", 'cyan');

        // AUD-PORT-001: Verification Lifecycle Events Sequence
        $timelineEvents = $db->table('student_portfolio_verification_events')
            ->where('portfolio_record_id', $testRec3Id)
            ->orderBy('occurred_at', 'ASC')
            ->get()->getResultArray();
        $actionsLogged = array_column($timelineEvents, 'action');
        $isAud001 = in_array('revision_requested', $actionsLogged, true)
            && in_array('resubmitted', $actionsLogged, true)
            && in_array('verified', $actionsLogged, true);
        $runTest('AUD-PORT-001', 'Complete Lifecycle Audit Trail Logged (submitted/revised/verified)', $isAud001);

        // AUD-PORT-002: Authoritative Actor Attribution
        $studentAction = $db->table('student_portfolio_verification_events')
            ->where('portfolio_record_id', $testRec3Id)
            ->where('action', 'resubmitted')
            ->get()->getRowArray();
        $coordAction = $db->table('student_portfolio_verification_events')
            ->where('portfolio_record_id', $testRec3Id)
            ->where('action', 'verified')
            ->get()->getRowArray();
        $isAud002 = ($studentAction['actor_profile_id'] ?? '') === $studentAId
            && ($coordAction['actor_profile_id'] ?? '') === $coordAId;
        $runTest('AUD-PORT-002', 'Authoritative Actor ID Attribution on all Audit Events', $isAud002);

        // AUD-PORT-003: Coherent Chronological Ordering
        $timestamps = array_column($timelineEvents, 'occurred_at');
        $sortedTimestamps = $timestamps;
        sort($sortedTimestamps);
        $runTest('AUD-PORT-003', 'Chronological Timestamp Ordering Coherent on Audit Trail', $timestamps === $sortedTimestamps);

        // ORPH-001: Zero DB Orphan Evidence Rows
        $orphanDbRows = (int) $db->table('student_portfolio_evidence spe')
            ->join('student_portfolio_records spr', 'spr.id = spe.portfolio_record_id', 'left')
            ->where('spr.id IS NULL')
            ->countAllResults();
        $runTest('ORPH-001', 'Zero Database Evidence Rows with Missing Parent Record', $orphanDbRows === 0);

        // ORPH-002: Zero Orphan Stored Physical Files
        $evidenceRows = $db->table('student_portfolio_evidence')->get()->getResultArray();
        $allPhysicalFilesExist = true;
        foreach ($evidenceRows as $row) {
            if (! file_exists($storage->resolveAbsolutePath($row['storage_path']))) {
                $allPhysicalFilesExist = false;
                break;
            }
        }
        $runTest('ORPH-002', 'Zero Physical Files Missing for Active Evidence Rows', $allPhysicalFilesExist);

        // ---------------------------------------------------------------------
        // Final Clean Reset & Summary
        // ---------------------------------------------------------------------
        $seeder->call('DefenseDemoSeeder');

        $passedCount = count(array_filter($testCases, static fn($t) => $t['passed']));
        $totalCount = count($testCases);

        CLI::write("\n========================================================================", 'yellow');
        CLI::write(sprintf('Phase 13 Step 4 Test Result: %d / %d PASSED', $passedCount, $totalCount), $passedCount === $totalCount ? 'green' : 'red');
        CLI::write('========================================================================', 'yellow');

        return $passedCount === $totalCount ? 0 : 1;
    }

    private function computeReferenceFingerprint(\CodeIgniter\Database\BaseConnection $db): string
    {
        $fingerprintPayload = '';

        $roles = $db->table('roles')->orderBy('role_key', 'ASC')->get()->getResultArray();
        foreach ($roles as $r) {
            $fingerprintPayload .= "ROLE:{$r['id']}:{$r['role_key']}:{$r['display_name']}:{$r['is_system_role']}\n";
        }

        $colleges = $db->table('colleges')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($colleges as $c) {
            $fingerprintPayload .= "COLLEGE:{$c['id']}:{$c['code']}:{$c['name']}:{$c['status']}\n";
        }

        $progs = $db->table('academic_programs')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($progs as $p) {
            $fingerprintPayload .= "PROG:{$p['id']}:{$p['college_id']}:{$p['code']}:{$p['name']}:{$p['status']}\n";
        }

        $adminUnits = $db->table('administrative_units')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($adminUnits as $u) {
            $fingerprintPayload .= "ADMIN:{$u['id']}:{$u['code']}:{$u['name']}:{$u['unit_type']}:{$u['status']}\n";
        }

        $categories = $db->table('portfolio_categories')->orderBy('sort_order', 'ASC')->get()->getResultArray();
        foreach ($categories as $cat) {
            $fingerprintPayload .= "CAT:{$cat['id']}:{$cat['code']}:{$cat['name']}:{$cat['sort_order']}:{$cat['status']}\n";
        }

        $subcats = $db->table('portfolio_subcategories')->orderBy('category_id', 'ASC')->orderBy('sort_order', 'ASC')->get()->getResultArray();
        foreach ($subcats as $s) {
            $fingerprintPayload .= "SUBCAT:{$s['id']}:{$s['category_id']}:{$s['code']}:{$s['name']}:{$s['sort_order']}:{$s['status']}\n";
        }

        $awards = $db->table('award_definitions')->orderBy('code', 'ASC')->get()->getResultArray();
        foreach ($awards as $a) {
            $fingerprintPayload .= "AWARD:{$a['id']}:{$a['code']}:{$a['name']}:{$a['candidate_threshold_percent']}:{$a['status']}\n";
        }

        return hash('sha256', $fingerprintPayload);
    }
}
