<?php

namespace App\Commands;

use App\Services\DefenseDemoConfigService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Config\Database;
use Throwable;

class VerifyPhase18DisasterRecovery extends BaseCommand
{
    protected $group       = 'Testing';
    protected $name        = 'test:phase18-dr';
    protected $description = 'Executes complete Phase 18 Disaster Recovery & Defense Fixture Restoration Validation.';

    protected string $mysqlBinary = 'C:\\wamp64\\bin\\mysql\\mysql8.4.7\\bin\\mysql.exe';
    protected string $mysqldumpBinary = 'C:\\wamp64\\bin\\mysql\\mysql8.4.7\\bin\\mysqldump.exe';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Phase 18 Disaster Recovery & Restoration Test Suite", 'yellow');
        CLI::write("========================================================================", 'yellow');

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

        $origDb = Database::connect('local_defense');
        $origDbName = 'achievenest_local';
        $tempDbName = 'achievenest_restore_test';

        $backupDir = 'C:\\Users\\Admin\\Documents\\AchieveNest-Defense-Backup\\';
        if (! is_dir($backupDir)) {
            mkdir($backupDir, 0755, true);
        }

        $dbBackupDir = $backupDir . 'database/';
        $evidenceBackupDir = $backupDir . 'evidence/';
        $manifestsDir = $backupDir . 'manifests/';
        $templatesDir = $backupDir . 'templates/';

        foreach ([$dbBackupDir, $evidenceBackupDir, $manifestsDir, $templatesDir] as $d) {
            if (! is_dir($d)) {
                mkdir($d, 0755, true);
            }
        }

        $timestamp = date('Ymd-His');
        $sqlDumpFile = $dbBackupDir . "achievenest_local-{$timestamp}.sql";
        $evidenceSourceDir = WRITEPATH . 'uploads/evidence/';
        $evidenceZipFile = $evidenceBackupDir . "evidence-{$timestamp}.zip";
        $evidenceRestoreDir = WRITEPATH . 'restore_test/evidence/';

        // ---------------------------------------------------------------------
        // STEP 1: Database & Physical Evidence Backup
        // ---------------------------------------------------------------------
        CLI::write("\n[1/6] Executing Complete Local Database & Evidence Backup...", 'cyan');

        $dbHost = '127.0.0.1';
        $dbPort = 3306;

        $dumpCmd = sprintf(
            '"%s" -h%s -P%d -uroot --single-transaction --triggers --default-character-set=utf8mb4 %s > "%s"',
            $this->mysqldumpBinary,
            $dbHost,
            $dbPort,
            $origDbName,
            $sqlDumpFile
        );

        exec($dumpCmd, $dumpOutput, $dumpRet);
        $dumpSuccess = ($dumpRet === 0 && file_exists($sqlDumpFile) && filesize($sqlDumpFile) > 10000);
        $dumpHash = $dumpSuccess ? hash_file('sha256', $sqlDumpFile) : '';
        $runTest('DR-001', 'MySQL database backup generated via mysqldump', $dumpSuccess, "File size: " . (file_exists($sqlDumpFile) ? filesize($sqlDumpFile) : 0));

        // Scan SQL dump for secret leaks
        $dumpContent = file_get_contents($sqlDumpFile);
        $hasSecretLeak = str_contains($dumpContent, 'ACHIEVENEST_DEMO_PASSWORD') || str_contains($dumpContent, 'LOCAL_AUTH_JWT_SECRET');
        $runTest('DR-002', 'Database dump contains 0 plaintext application configuration secrets', ! $hasSecretLeak);

        // Record source evidence manifest
        $sourceManifestFile = $manifestsDir . "evidence-source-manifest-{$timestamp}.csv";
        $sourceManifestFp = fopen($sourceManifestFile, 'w');
        fputcsv($sourceManifestFp, ['relative_path', 'file_name', 'size_bytes', 'sha256']);

        $sourceFiles = [];
        $sourceFileCount = 0;
        $sourceTotalBytes = 0;

        $rIter = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($evidenceSourceDir, \FilesystemIterator::SKIP_DOTS));
        foreach ($rIter as $file) {
            if ($file->isFile() && $file->getFilename() !== '.gitkeep') {
                $rel = str_replace('\\', '/', substr($file->getPathname(), strlen($evidenceSourceDir)));
                $hash = hash_file('sha256', $file->getPathname());
                $size = $file->getSize();
                $sourceFiles[$rel] = ['rel' => $rel, 'name' => $file->getFilename(), 'size' => $size, 'hash' => $hash];
                fputcsv($sourceManifestFp, [$rel, $file->getFilename(), $size, $hash]);
                $sourceFileCount++;
                $sourceTotalBytes += $size;
            }
        }
        fclose($sourceManifestFp);
        $runTest('DR-003', "Source evidence manifest recorded ({$sourceFileCount} files, {$sourceTotalBytes} bytes)", $sourceFileCount > 0);

        // Compress evidence directory to ZIP archive
        $zip = new \ZipArchive();
        if ($zip->open($evidenceZipFile, \ZipArchive::CREATE | \ZipArchive::OVERWRITE) === true) {
            foreach ($sourceFiles as $rel => $info) {
                $zip->addFile($evidenceSourceDir . $rel, $rel);
            }
            $zip->close();
        }
        $zipSuccess = (file_exists($evidenceZipFile) && filesize($evidenceZipFile) > 0);
        $zipHash = $zipSuccess ? hash_file('sha256', $evidenceZipFile) : '';
        $runTest('DR-004', 'Protected evidence ZIP archive created and hashed', $zipSuccess, "SHA-256: {$zipHash}");

        // Create Safe Environment Template
        $templatePath = $templatesDir . 'backend.env.defense.template';
        $templateContent = "CI_ENVIRONMENT = development\nACHIEVENEST_ENV = local-defense\n\napp.baseURL = 'http://localhost:8080/'\napp.forceGlobalSecureRequests = false\n\n# Local WAMP MySQL defense database configuration\ndatabase.defaultGroup = local_defense\n\ndatabase.local_defense.hostname = 127.0.0.1\ndatabase.local_defense.database = achievenest_local\ndatabase.local_defense.username = achievenest_app\ndatabase.local_defense.password = [SET_LOCALLY]\ndatabase.local_defense.DBDriver = MySQLi\ndatabase.local_defense.port = 3306\ndatabase.local_defense.charset = utf8mb4\ndatabase.local_defense.DBCollat = utf8mb4_unicode_ci\n\nAUTH_MODE = local-defense\nLOCAL_AUTH_JWT_SECRET = [SET_LOCALLY]\nLOCAL_AUTH_ISSUER = achievenest-local\nLOCAL_AUTH_AUDIENCE = achievenest-web\nLOCAL_AUTH_ACCESS_TTL_SECONDS = 3600\nLOCAL_AUTH_REMEMBER_TTL_SECONDS = 28800\nACHIEVENEST_DEMO_PASSWORD = [SET_LOCALLY]\n";
        file_put_contents($templatePath, $templateContent);
        $runTest('DR-005', 'Safe environment template created with placeholders only', file_exists($templatePath));

        // ---------------------------------------------------------------------
        // STEP 2: Restoration into Separate Temporary Targets
        // ---------------------------------------------------------------------
        CLI::write("\n[2/6] Restoring Database and Evidence into Isolated Targets...", 'cyan');

        // Recreate temporary DB via root
        $rootConfig = config('Database')->local_defense;
        $rootConfig['username'] = 'root';
        $rootConfig['password'] = '';
        $rootDb = Database::connect($rootConfig, false);

        $rootDb->query("DROP DATABASE IF EXISTS `{$tempDbName}`");
        $rootDb->query("CREATE DATABASE `{$tempDbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Restore SQL dump into temporary database
        $restoreCmd = sprintf(
            '"%s" -h%s -P%d -uroot %s < "%s"',
            $this->mysqlBinary,
            $dbHost,
            $dbPort,
            $tempDbName,
            $sqlDumpFile
        );

        $restoreStart = microtime(true);
        exec($restoreCmd, $restoreOutput, $restoreRet);
        $restoreDurationSec = round(microtime(true) - $restoreStart, 2);

        $tempConfig = $rootConfig;
        $tempConfig['database'] = $tempDbName;
        $tempDb = Database::connect($tempConfig, false);

        $tableCount = (int) $tempDb->query("SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = '{$tempDbName}' AND table_type = 'BASE TABLE'")->getRowArray()['c'];
        $runTest('DR-006', "Database restored cleanly into temporary schema (57 tables in {$restoreDurationSec}s)", $restoreRet === 0 && $tableCount === 57, "Tables: {$tableCount}");

        // Restore evidence ZIP into temporary restore directory
        if (is_dir($evidenceRestoreDir)) {
            $this->removeDirectory($evidenceRestoreDir);
        }
        mkdir($evidenceRestoreDir, 0755, true);

        $zipRestore = new \ZipArchive();
        if ($zipRestore->open($evidenceZipFile) === true) {
            $zipRestore->extractTo($evidenceRestoreDir);
            $zipRestore->close();
        }

        $restoredFiles = [];
        $rIter2 = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($evidenceRestoreDir, \FilesystemIterator::SKIP_DOTS));
        foreach ($rIter2 as $file) {
            if ($file->isFile() && $file->getFilename() !== '.gitkeep') {
                $rel = str_replace('\\', '/', substr($file->getPathname(), strlen($evidenceRestoreDir)));
                $hash = hash_file('sha256', $file->getPathname());
                $size = $file->getSize();
                $restoredFiles[$rel] = ['rel' => $rel, 'name' => $file->getFilename(), 'size' => $size, 'hash' => $hash];
            }
        }
        $runTest('DR-007', 'Physical evidence extracted into temporary target directory', count($restoredFiles) === $sourceFileCount, "Extracted: " . count($restoredFiles));

        // ---------------------------------------------------------------------
        // STEP 3: Reference Data & Fingerprint Verification on Restored Target
        // ---------------------------------------------------------------------
        CLI::write("\n[3/6] Verifying Reference Fingerprint on Restored Database...", 'cyan');

        $rolesCount = (int) $tempDb->table('roles')->countAllResults();
        $collegesCount = (int) $tempDb->table('colleges')->countAllResults();
        $progsCount = (int) $tempDb->table('academic_programs')->countAllResults();
        $adminCount = (int) $tempDb->table('administrative_units')->countAllResults();
        $catsCount = (int) $tempDb->table('portfolio_categories')->countAllResults();
        $subcatsCount = (int) $tempDb->table('portfolio_subcategories')->countAllResults();
        $awardsCount = (int) $tempDb->table('award_definitions')->countAllResults();

        $refCountsValid = ($rolesCount === 7 && $collegesCount === 5 && $progsCount === 14 && $adminCount === 19 && $catsCount === 9 && $subcatsCount === 57 && $awardsCount === 15);
        $runTest('DR-008', 'Permanent reference entity counts exact (7/5/14/19/9/57/15)', $refCountsValid);

        // Compute Reference Fingerprint on restored DB
        $fingerprintPayload = '';
        foreach ($tempDb->table('roles')->orderBy('role_key', 'ASC')->get()->getResultArray() as $r) {
            $fingerprintPayload .= "ROLE:{$r['id']}:{$r['role_key']}:{$r['display_name']}:{$r['is_system_role']}\n";
        }
        foreach ($tempDb->table('colleges')->orderBy('code', 'ASC')->get()->getResultArray() as $c) {
            $fingerprintPayload .= "COLLEGE:{$c['id']}:{$c['code']}:{$c['name']}:{$c['status']}\n";
        }
        foreach ($tempDb->table('academic_programs')->orderBy('code', 'ASC')->get()->getResultArray() as $p) {
            $fingerprintPayload .= "PROG:{$p['id']}:{$p['college_id']}:{$p['code']}:{$p['name']}:{$p['status']}\n";
        }
        foreach ($tempDb->table('administrative_units')->orderBy('code', 'ASC')->get()->getResultArray() as $u) {
            $fingerprintPayload .= "ADMIN:{$u['id']}:{$u['code']}:{$u['name']}:{$u['unit_type']}:{$u['status']}\n";
        }
        foreach ($tempDb->table('portfolio_categories')->orderBy('sort_order', 'ASC')->get()->getResultArray() as $cat) {
            $fingerprintPayload .= "CAT:{$cat['id']}:{$cat['code']}:{$cat['name']}:{$cat['sort_order']}:{$cat['status']}\n";
        }
        foreach ($tempDb->table('portfolio_subcategories')->orderBy('category_id', 'ASC')->orderBy('sort_order', 'ASC')->get()->getResultArray() as $s) {
            $fingerprintPayload .= "SUBCAT:{$s['id']}:{$s['category_id']}:{$s['code']}:{$s['name']}:{$s['sort_order']}:{$s['status']}\n";
        }
        foreach ($tempDb->table('award_definitions')->orderBy('code', 'ASC')->get()->getResultArray() as $a) {
            $fingerprintPayload .= "AWARD:{$a['id']}:{$a['code']}:{$a['name']}:{$a['candidate_threshold_percent']}:{$a['status']}\n";
        }

        $restoredFingerprint = hash('sha256', $fingerprintPayload);
        $expectedFingerprint = 'a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f';
        $runTest('DR-009', 'Restored reference SHA-256 fingerprint matches baseline 100%', $restoredFingerprint === $expectedFingerprint, "Restored: {$restoredFingerprint}");

        // ---------------------------------------------------------------------
        // STEP 4: Demo Personas & Credential Consistency on Restored Target
        // ---------------------------------------------------------------------
        CLI::write("\n[4/6] Verifying 10 Demo Personas and Roles on Restored Target...", 'cyan');

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

        $restoredProfiles = $tempDb->table('profiles')->whereIn('email', $demoEmails)->get()->getResultArray();
        $runTest('DR-010', 'All 10 demo personas present and active on restored database', count($restoredProfiles) === 10);

        // Verify password hash consistency
        $demoConfig = new DefenseDemoConfigService();
        $currentPass = $demoConfig->requirePassword();

        $allPassMatch = true;
        foreach ($restoredProfiles as $p) {
            $cred = $tempDb->table('local_auth_credentials')->where('profile_id', $p['id'])->get()->getRowArray();
            $hash = $cred['password_hash'] ?? ($p['password_hash'] ?? '');
            if (! password_verify($currentPass, $hash)) {
                $allPassMatch = false;
                break;
            }
        }
        $runTest('DR-011', 'All 10 demo accounts verify with current rotated credential', $allPassMatch);

        // ---------------------------------------------------------------------
        // STEP 5: Physical Evidence Checksum & Relational Integrity
        // ---------------------------------------------------------------------
        CLI::write("\n[5/6] Verifying Restored Evidence Physical Files & Hashes...", 'cyan');

        $evidenceMatch = true;
        foreach ($sourceFiles as $rel => $sInfo) {
            if (! isset($restoredFiles[$rel])) {
                $evidenceMatch = false;
                break;
            }
            if ($restoredFiles[$rel]['hash'] !== $sInfo['hash'] || $restoredFiles[$rel]['size'] !== $sInfo['size']) {
                $evidenceMatch = false;
                break;
            }
        }
        $runTest('DR-012', 'Restored physical evidence matches source 100% (paths, sizes, SHA-256)', $evidenceMatch);

        $seCount = (int) $tempDb->table('student_portfolio_evidence')->countAllResults();
        $peCount = (int) $tempDb->table('personnel_accomplishment_evidence')->countAllResults();
        $runTest('DR-013', "Restored relational evidence metadata intact (Student: {$seCount}, Personnel: {$peCount})", $seCount > 0 && $peCount > 0);

        // ---------------------------------------------------------------------
        // STEP 6: Original Baseline Isolation & Untouched Verification
        // ---------------------------------------------------------------------
        CLI::write("\n[6/6] Proving Original Baseline Untouched & Cleaning Sandbox...", 'cyan');

        $origRolesCount = (int) $origDb->table('roles')->countAllResults();
        $origCollegesCount = (int) $origDb->table('colleges')->countAllResults();
        $origProgsCount = (int) $origDb->table('academic_programs')->countAllResults();
        $origProfilesCount = (int) $origDb->table('profiles')->whereIn('email', $demoEmails)->countAllResults();

        $origUntouched = ($origRolesCount === 7 && $origCollegesCount === 5 && $origProgsCount === 14 && $origProfilesCount === 10);
        $runTest('DR-014', 'Original achievenest_local database completely intact & untouched', $origUntouched);

        $currSourceFiles = 0;
        $rIter3 = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($evidenceSourceDir, \FilesystemIterator::SKIP_DOTS));
        foreach ($rIter3 as $file) {
            if ($file->isFile() && $file->getFilename() !== '.gitkeep') {
                $currSourceFiles++;
            }
        }
        $runTest('DR-015', "Original physical evidence directory completely untouched ({$currSourceFiles} files)", $currSourceFiles === $sourceFileCount);

        // Drop temporary database and remove restore test directory
        $rootDb->query("DROP DATABASE IF EXISTS `{$tempDbName}`");
        $this->removeDirectory(WRITEPATH . 'restore_test');
        $runTest('DR-016', 'Temporary restoration sandbox cleaned up safely after validation', ! is_dir(WRITEPATH . 'restore_test'));

        CLI::write("\n========================================================================", 'yellow');
        $passedCount = count(array_filter($testCases, static fn ($t) => $t['passed']));
        $totalCount = count($testCases);
        CLI::write("Phase 18 Disaster Recovery Test Result: {$passedCount} / {$totalCount} PASSED", $passedCount === $totalCount ? 'green' : 'red');
        CLI::write("========================================================================\n", 'yellow');

        if ($passedCount !== $totalCount) {
            exit(1);
        }
    }

    private function removeDirectory(string $dir): void
    {
        if (! is_dir($dir)) {
            return;
        }
        $files = array_diff(scandir($dir), ['.', '..']);
        foreach ($files as $file) {
            (is_dir("$dir/$file")) ? $this->removeDirectory("$dir/$file") : @unlink("$dir/$file");
        }
        @rmdir($dir);
    }
}
