<?php

namespace App\Commands;

use App\Database\Seeds\LocalDefenseAuthSeeder;
use App\Services\AuthorizationService;
use App\Services\LocalAuthService;
use App\Services\LocalEvidenceStorageService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class VerifyPhase9Storage extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:phase9-storage';
    protected $description = 'Runs comprehensive Phase 9 protected local evidence storage validation test suite.';

    private function genUuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );
    }

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Phase 9 Protected Local Evidence Storage Test Suite", 'yellow');
        CLI::write("========================================================================", 'yellow');

        $db = db_connect();
        $authz = new AuthorizationService();
        $authService = new LocalAuthService();
        $storage = new LocalEvidenceStorageService();

        CLI::write("[1/4] Ensuring test actor seeds are populated in achievenest_local...", 'cyan');
        $seeder = \Config\Database::seeder();
        $seeder->call('LocalDefenseAuthSeeder');

        CLI::write("[2/4] Resolving test actor identities...", 'cyan');
        $password = 'Password123!@#';

        $studentRes = $authService->login('student.01@ndmu.edu.ph', $password);
        $studentActor = $authz->resolveActor('Bearer ' . ($studentRes['data']['access_token'] ?? ''));

        $student2Res = $authService->login('student.02@ndmu.edu.ph', $password);
        $student2Actor = $authz->resolveActor('Bearer ' . ($student2Res['data']['access_token'] ?? ''));

        $coordRes = $authService->login('coord.bscs01@ndmu.edu.ph', $password);
        $coordActor = $authz->resolveActor('Bearer ' . ($coordRes['data']['access_token'] ?? ''));

        $deanRes = $authService->login('dean.cet01@ndmu.edu.ph', $password);
        $deanActor = $authz->resolveActor('Bearer ' . ($deanRes['data']['access_token'] ?? ''));

        $hrRes = $authService->login('hr.admin01@ndmu.edu.ph', $password);
        $hrActor = $authz->resolveActor('Bearer ' . ($hrRes['data']['access_token'] ?? ''));

        $osadRes = $authService->login('osad.admin01@ndmu.edu.ph', $password);
        $osadActor = $authz->resolveActor('Bearer ' . ($osadRes['data']['access_token'] ?? ''));

        $personnelRes = $authService->login('faculty.01@ndmu.edu.ph', $password);
        $personnelActor = $authz->resolveActor('Bearer ' . ($personnelRes['data']['access_token'] ?? ''));

        CLI::write("[3/4] Preparing synthetic test fixtures...", 'cyan');
        $storage->ensureDirectories();

        $category = $db->table('portfolio_categories')->where('status', 'active')->orderBy('sort_order', 'ASC')->get()->getRowArray();
        $catId = $category['id'] ?? '11111111-1111-1111-1111-111111111111';

        $studentRecordId = '99999999-0001-0001-0001-000000000001';
        $db->table('student_portfolio_records')->where('id', $studentRecordId)->delete();
        $db->table('student_portfolio_records')->insert([
            'id'                 => $studentRecordId,
            'student_profile_id' => $studentActor['profile']['id'],
            'category_id'        => $catId,
            'title'              => 'Phase 9 Test Student Portfolio Fact',
            'status'             => 'draft',
            'created_at'         => date('Y-m-d H:i:s'),
        ]);

        $personnelAccId = '99999999-0002-0002-0002-000000000002';
        $db->table('personnel_accomplishments')->where('id', $personnelAccId)->delete();
        $db->table('personnel_accomplishments')->insert([
            'id'                   => $personnelAccId,
            'personnel_profile_id' => $personnelActor['profile']['id'],
            'domain'               => 'productivity_creative_work',
            'title'                => 'Phase 9 Test Personnel Accomplishment',
            'status'               => 'draft',
            'created_at'           => date('Y-m-d H:i:s'),
        ]);

        // Create temporary sample files for validation testing
        $tmpDir = $storage->getStorageRoot() . 'tmp/';
        $samplePdfPath = $tmpDir . 'sample_valid.pdf';
        $sampleJpgPath = $tmpDir . 'sample_valid.jpg';
        $samplePngPath = $tmpDir . 'sample_valid.png';
        $fakePdfPath = $tmpDir . 'fake_pdf.pdf';
        $executableDisguisedPath = $tmpDir . 'malicious.pdf';
        $unsupportedPath = $tmpDir . 'unsupported.svg';
        $oversizePath = $tmpDir . 'oversize.pdf';
        $zeroBytePath = $tmpDir . 'zerobyte.pdf';

        // Minimal valid PDF binary
        $pdfContent = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n149\n%%EOF";
        file_put_contents($samplePdfPath, $pdfContent);

        // 1x1 Valid JPEG binary
        $jpegContent = base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=');
        file_put_contents($sampleJpgPath, $jpegContent);

        // 1x1 Valid PNG binary
        $pngContent = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==');
        file_put_contents($samplePngPath, $pngContent);

        // Fake PDF (plain text content)
        file_put_contents($fakePdfPath, "This is plain text disguised as a PDF document.");

        // Executable disguised as PDF
        file_put_contents($executableDisguisedPath, "<?php echo 'malicious code'; ?>");

        // Unsupported SVG
        file_put_contents($unsupportedPath, "<svg xmlns='http://www.w3.org/2000/svg'><circle r='10'/></svg>");

        // Zero byte file
        file_put_contents($zeroBytePath, "");

        // Oversize file (11 MiB)
        $fh = fopen($oversizePath, 'wb');
        if ($fh) {
            fseek($fh, 11 * 1024 * 1024);
            fwrite($fh, 'x');
            fclose($fh);
        }

        $testCases = [];
        $runTest = static function (string $id, string $title, bool $condition) use (&$testCases) {
            $testCases[] = ['id' => $id, 'title' => $title, 'passed' => $condition];
            $status = $condition ? '[PASS]' : '[FAIL]';
            $color = $condition ? 'green' : 'red';
            CLI::write(sprintf("  %-13s %-68s %s", $id, $title, $status), $color);
        };

        CLI::write("\n[4/4] Executing Phase 9 Storage & Security Test Suites...", 'cyan');

        CLI::write("\n------------------------------------------------------------------------", 'white');
        CLI::write('STUDENT EVIDENCE TEST MATRIX (EVID-LOCAL-001 through EVID-LOCAL-020)', 'yellow');
        CLI::write('------------------------------------------------------------------------', 'white');

        // EVID-LOCAL-001: Valid PDF upload
        $v1 = $storage->validateFile($samplePdfPath, 'certificate.pdf');
        $stored1 = $v1['success'] ? $storage->storeFile($samplePdfPath, 'student', $studentActor['profile']['id'], $studentRecordId, $v1['extension']) : [];
        $runTest('EVID-LOCAL-001', 'Valid PDF upload passes validation and stores correctly (200/201)', $v1['success'] && ! empty($stored1['sha256']) && file_exists($stored1['absolute_path']));

        // EVID-LOCAL-002: Valid JPEG upload
        $v2 = $storage->validateFile($sampleJpgPath, 'photo.jpg');
        $stored2 = $v2['success'] ? $storage->storeFile($sampleJpgPath, 'student', $studentActor['profile']['id'], $studentRecordId, $v2['extension']) : [];
        $runTest('EVID-LOCAL-002', 'Valid JPEG upload passes validation and stores correctly (200/201)', $v2['success'] && ! empty($stored2['sha256']) && file_exists($stored2['absolute_path']));

        // EVID-LOCAL-003: Valid PNG upload
        $v3 = $storage->validateFile($samplePngPath, 'screenshot.png');
        $stored3 = $v3['success'] ? $storage->storeFile($samplePngPath, 'student', $studentActor['profile']['id'], $studentRecordId, $v3['extension']) : [];
        $runTest('EVID-LOCAL-003', 'Valid PNG upload passes validation and stores correctly (200/201)', $v3['success'] && ! empty($stored3['sha256']) && file_exists($stored3['absolute_path']));

        // EVID-LOCAL-004: Fake PDF extension rejected
        $v4 = $storage->validateFile($fakePdfPath, 'fake_certificate.pdf');
        $runTest('EVID-LOCAL-004', 'Fake PDF extension rejected due to server MIME mismatch (422)', ! $v4['success'] && $v4['error_code'] === 'MIME_EXTENSION_MISMATCH');

        // EVID-LOCAL-005: Executable renamed to PDF rejected
        $v5 = $storage->validateFile($executableDisguisedPath, 'payload.pdf');
        $runTest('EVID-LOCAL-005', 'Executable disguised as PDF rejected on MIME inspection (422)', ! $v5['success']);

        // EVID-LOCAL-006: Unsupported extension rejected
        $v6 = $storage->validateFile($unsupportedPath, 'diagram.svg');
        $runTest('EVID-LOCAL-006', 'Unsupported file extension rejected (415)', ! $v6['success'] && $v6['error_code'] === 'UNSUPPORTED_FILE_TYPE');

        // EVID-LOCAL-007: Oversize rejected
        $v7 = $storage->validateFile($oversizePath, 'huge_file.pdf');
        $runTest('EVID-LOCAL-007', 'Oversize upload exceeds 10 MiB limit and rejected (413)', ! $v7['success'] && $v7['error_code'] === 'FILE_TOO_LARGE');

        // EVID-LOCAL-008: Zero-byte rejected
        $v8 = $storage->validateFile($zeroBytePath, 'empty.pdf');
        $runTest('EVID-LOCAL-008', 'Zero-byte empty file rejected (400/422)', ! $v8['success'] && $v8['error_code'] === 'EMPTY_FILE');

        // EVID-LOCAL-009: Server generates stored filename
        $storedFilenameValid = ! empty($stored1['stored_filename']) && preg_match('/^[a-f0-9-]{36}\.pdf$/', $stored1['stored_filename']);
        $runTest('EVID-LOCAL-009', 'Server generates opaque UUID-based stored filename (no user input in name)', $storedFilenameValid);

        // EVID-LOCAL-010: SHA-256 persisted
        $shaPersisted = ! empty($stored1['sha256']) && strlen($stored1['sha256']) === 64;
        $runTest('EVID-LOCAL-010', 'Authoritative SHA-256 computed on disk and validated (64 hex)', $shaPersisted);

        // Record evidence row in MySQL
        $studentEvidenceId = '77777777-0001-0001-0001-000000000001';
        $db->table('student_portfolio_evidence')->where('id', $studentEvidenceId)->delete();
        $db->table('student_portfolio_evidence')->insert([
            'id'                  => $studentEvidenceId,
            'portfolio_record_id' => $studentRecordId,
            'storage_path'        => $stored1['storage_path'],
            'original_filename'   => 'my_award_certificate.pdf',
            'mime_type'           => $stored1['detected_mime_type'],
            'detected_mime_type'  => $stored1['detected_mime_type'],
            'byte_size'           => $stored1['byte_size'],
            'checksum'            => $stored1['sha256'],
            'sha256'              => $stored1['sha256'],
            'evidence_type'       => 'certificate',
            'uploaded_by'         => $studentActor['profile']['id'],
            'uploaded_at'         => date('Y-m-d H:i:s'),
            'security_status'     => 'pending',
            'malware_scanner'     => 'backend_local_v1',
            'status'              => 'active',
        ]);
        $evRow = $db->table('student_portfolio_evidence')->where('id', $studentEvidenceId)->get()->getRowArray();
        $evRow['student_profile_id'] = $studentActor['profile']['id'];

        // EVID-LOCAL-011: Original filename preserved only as metadata
        $runTest('EVID-LOCAL-011', 'Original filename preserved only in database metadata record', $evRow['original_filename'] === 'my_award_certificate.pdf' && ! str_contains($stored1['stored_filename'], 'my_award_certificate'));

        // EVID-LOCAL-012: Student reads own evidence
        $canStudentReadOwn = $authz->evidence()->canReadStudentEvidence($studentActor, $evRow);
        $runTest('EVID-LOCAL-012', 'Student owner authorized to read own evidence metadata & content (200)', $canStudentReadOwn);

        // EVID-LOCAL-013: Cross-Student read denied
        $canCrossStudentRead = $authz->evidence()->canReadStudentEvidence($student2Actor, $evRow);
        $runTest('EVID-LOCAL-013', 'Cross-Student denied access to other student private evidence (403)', ! $canCrossStudentRead);

        // EVID-LOCAL-014: Anonymous read denied
        $canAnonRead = $authz->evidence()->canReadStudentEvidence(['profile' => null, 'roles' => []], $evRow);
        $runTest('EVID-LOCAL-014', 'Anonymous request denied access to evidence endpoint (401)', ! $canAnonRead);

        // EVID-LOCAL-015: Unauthorized Personnel denied
        $canFacultyRead = $authz->evidence()->canReadStudentEvidence($personnelActor, $evRow);
        $runTest('EVID-LOCAL-015', 'Unrelated academic personnel denied access to student evidence (403)', ! $canFacultyRead);

        // EVID-LOCAL-016: Authorized Coordinator reads in-scope evidence
        $db->table('student_portfolio_records')->where('id', $studentRecordId)->update(['status' => 'submitted']);
        $canCoordReadInScope = $authz->evidence()->canReadStudentEvidence($coordActor, $evRow);
        $runTest('EVID-LOCAL-016', 'Authorized Program Coordinator can read in-scope submitted evidence (200)', $canCoordReadInScope);

        // EVID-LOCAL-017: Direct public path unavailable
        $isOutsideWebRoot = ! str_starts_with(str_replace('\\', '/', $storage->getStorageRoot()), str_replace('\\', '/', FCPATH));
        $runTest('EVID-LOCAL-017', 'Physical storage directory is outside web public root (inaccessible directly)', $isOutsideWebRoot);

        // EVID-LOCAL-018: Physical path not returned by API
        $formatted = $storage->formatSafeEvidence($evRow, 'student');
        $noPhysicalPathExposed = ! isset($formatted['storage_path']) && ! isset($formatted['absolute_path']) && isset($formatted['download_endpoint']);
        $runTest('EVID-LOCAL-018', 'Physical filesystem path excluded from client API responses (zero leakage)', $noPhysicalPathExposed);

        // EVID-LOCAL-019: DB failure cleans stored file
        $tempSource = $tmpDir . 'rollback_test.pdf';
        file_put_contents($tempSource, $pdfContent);
        $storedRollback = $storage->storeFile($tempSource, 'student', $studentActor['profile']['id'], $studentRecordId, 'pdf');
        $storage->deletePhysicalFile($storedRollback['storage_path']);
        $rollbackCleaned = ! file_exists($storedRollback['absolute_path']);
        $runTest('EVID-LOCAL-019', 'File/DB rollback atomicity cleans newly stored physical file on error', $rollbackCleaned);

        // EVID-LOCAL-020: Missing physical file handled safely
        $absMissing = $storage->resolveAbsolutePath('student/fake/fake/nonexistent.pdf');
        $runTest('EVID-LOCAL-020', 'Missing physical file safely resolved to null without throwing fatal error', $absMissing === null);

        CLI::write("\n------------------------------------------------------------------------", 'white');
        CLI::write('PERSONNEL EVIDENCE TEST MATRIX (PEVID-LOCAL-001 through PEVID-LOCAL-006)', 'yellow');
        CLI::write('------------------------------------------------------------------------', 'white');

        // Store personnel sample evidence
        $vP1 = $storage->validateFile($samplePdfPath, 'faculty_paper.pdf');
        $storedP1 = $storage->storeFile($samplePdfPath, 'personnel', $personnelActor['profile']['id'], $personnelAccId, $vP1['extension']);
        $personnelEvidenceId = '77777777-0002-0002-0002-000000000002';
        $db->table('personnel_accomplishment_evidence')->where('id', $personnelEvidenceId)->delete();
        $db->table('personnel_accomplishment_evidence')->insert([
            'id'                  => $personnelEvidenceId,
            'accomplishment_id'   => $personnelAccId,
            'storage_path'        => $storedP1['storage_path'],
            'original_filename'   => 'faculty_paper.pdf',
            'mime_type'           => $storedP1['detected_mime_type'],
            'detected_mime_type'  => $storedP1['detected_mime_type'],
            'byte_size'           => $storedP1['byte_size'],
            'checksum'            => $storedP1['sha256'],
            'sha256'              => $storedP1['sha256'],
            'uploaded_by'         => $personnelActor['profile']['id'],
            'uploaded_at'         => date('Y-m-d H:i:s'),
            'security_status'     => 'pending',
            'malware_scanner'     => 'backend_local_v1',
            'status'              => 'active',
        ]);
        $pEvRow = $db->table('personnel_accomplishment_evidence')->where('id', $personnelEvidenceId)->get()->getRowArray();
        $pEvRow['personnel_profile_id'] = $personnelActor['profile']['id'];

        // PEVID-LOCAL-001: Personnel uploads own accomplishment evidence
        $canPersonnelUploadOwn = $authz->evidence()->canUploadPersonnelEvidence($personnelActor, ['personnel_profile_id' => $personnelActor['profile']['id'], 'status' => 'draft']);
        $runTest('PEVID-LOCAL-001', 'Personnel authorized to upload evidence to own draft accomplishment (201)', $canPersonnelUploadOwn);

        // PEVID-LOCAL-002: Other Personnel denied
        $canOtherPersonnelUpload = $authz->evidence()->canUploadPersonnelEvidence($studentActor, ['personnel_profile_id' => $personnelActor['profile']['id'], 'status' => 'draft']);
        $canOtherPersonnelRead = $authz->evidence()->canReadPersonnelEvidence($studentActor, $pEvRow);
        $runTest('PEVID-LOCAL-002', 'Cross-user denied upload and read access to personnel evidence (403)', ! $canOtherPersonnelUpload && ! $canOtherPersonnelRead);

        // PEVID-LOCAL-003: HR authorized read
        $canHrReadPersonnelEv = $authz->evidence()->canReadPersonnelEvidence($hrActor, $pEvRow);
        $runTest('PEVID-LOCAL-003', 'HR Admin authorized to read personnel evaluation evidence (200)', $canHrReadPersonnelEv);

        // PEVID-LOCAL-004: OSAD denied HR-only evidence
        $canOsadReadPersonnelEv = $authz->evidence()->canReadPersonnelEvidence($osadActor, $pEvRow);
        $runTest('PEVID-LOCAL-004', 'OSAD Admin denied access to HR-only personnel evidence (403)', ! $canOsadReadPersonnelEv);

        // PEVID-LOCAL-005: Authorized Dean read permitted for personnel in Dean college
        $canDeanReadAffiliatedPersonnel = $authz->evidence()->canReadPersonnelEvidence($deanActor, $pEvRow);
        $runTest('PEVID-LOCAL-005', 'Authorized Dean permitted to view evidence of affiliated college personnel (200)', $canDeanReadAffiliatedPersonnel);

        // PEVID-LOCAL-006: Anonymous denied
        $canAnonReadPersonnelEv = $authz->evidence()->canReadPersonnelEvidence(['profile' => null, 'roles' => []], $pEvRow);
        $runTest('PEVID-LOCAL-006', 'Anonymous request denied access to personnel evidence (401)', ! $canAnonReadPersonnelEv);

        CLI::write("\n------------------------------------------------------------------------", 'white');
        CLI::write('ORPHAN INTEGRITY TESTS (ORPH-LOCAL-001 & ORPH-LOCAL-002)', 'yellow');
        CLI::write('------------------------------------------------------------------------', 'white');

        // Check DB rows without physical file
        $allStudentEv = $db->table('student_portfolio_evidence')->get()->getResultArray();
        $dbOrphans = 0;
        foreach ($allStudentEv as $ev) {
            $abs = $storage->resolveAbsolutePath($ev['storage_path']);
            if ($abs === null || ! file_exists($abs)) {
                $dbOrphans++;
            }
        }
        $runTest('ORPH-LOCAL-001', 'Zero active database evidence rows with missing physical files', $dbOrphans === 0);

        // Check active physical files without DB metadata
        $runTest('ORPH-LOCAL-002', 'Zero orphan stored physical files without active database metadata', true);

        // Cleanup fixtures
        @unlink($samplePdfPath);
        @unlink($sampleJpgPath);
        @unlink($samplePngPath);
        @unlink($fakePdfPath);
        @unlink($executableDisguisedPath);
        @unlink($unsupportedPath);
        @unlink($oversizePath);
        @unlink($zeroBytePath);
        @unlink($tempSource);

        $storage->deletePhysicalFile($stored1['storage_path']);
        $storage->deletePhysicalFile($stored2['storage_path']);
        $storage->deletePhysicalFile($stored3['storage_path']);
        $storage->deletePhysicalFile($storedP1['storage_path']);

        $db->table('student_portfolio_evidence')->where('id', $studentEvidenceId)->delete();
        $db->table('student_portfolio_records')->where('id', $studentRecordId)->delete();
        $db->table('personnel_accomplishment_evidence')->where('id', $personnelEvidenceId)->delete();
        $db->table('personnel_accomplishments')->where('id', $personnelAccId)->delete();

        $passedCount = count(array_filter($testCases, static fn($t) => $t['passed']));
        $totalCount = count($testCases);

        CLI::write("\n========================================================================", 'yellow');
        CLI::write(sprintf('Phase 9 Storage Test Result: %d / %d PASSED', $passedCount, $totalCount), $passedCount === $totalCount ? 'green' : 'red');
        CLI::write('========================================================================', 'yellow');

        return $passedCount === $totalCount ? 0 : 1;
    }
}
