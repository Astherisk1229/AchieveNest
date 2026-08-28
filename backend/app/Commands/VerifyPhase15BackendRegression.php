<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use Throwable;

class VerifyPhase15BackendRegression extends BaseCommand
{
    protected $group       = 'Verification';
    protected $name        = 'test:phase15-backend';
    protected $description = 'Runs Master Phase 15 Backend Regression Gate across all local-approved defense suites.';

    public function run(array $params)
    {
        CLI::write("========================================================================", 'yellow');
        CLI::write("AchieveNest — Phase 15 Master Backend Regression Gate", 'yellow');
        CLI::write("========================================================================\n", 'yellow');

        $db = db_connect();
        $dbName = $db->database;
        $dbVersion = $db->getVersion();

        CLI::write("Environment Preflight:", 'cyan');
        CLI::write("  Runtime Database : {$dbName}", 'white');
        CLI::write("  Engine Version   : {$dbVersion}", 'white');
        CLI::write("  Target Branch    : defense/wamp-local\n", 'white');

        $passedSuites = 0;
        $totalSuites = 0;
        $suiteResults = [];

        $commandMap = [
            'Phase 7'   => [\App\Commands\VerifyPhase7Auth::class, 'Local Authentication & Session Registry'],
            'Phase 8'   => [\App\Commands\VerifyPhase8Authz::class, 'Centralized CodeIgniter Authorization Matrix'],
            'Phase 9'   => [\App\Commands\VerifyPhase9Storage::class, 'Protected Local Evidence Storage & Streaming'],
            'Phase 11'  => [\App\Commands\VerifyPhase11ReferenceData::class, 'Permanent Reference Data & SHA-256 Fingerprint'],
            'Phase 12'  => [\App\Commands\VerifyPhase12Demo::class, 'Demo Personas & Scenario Fixtures'],
            'Phase 13'  => [\App\Commands\VerifyPhase13Step4Local::class, 'Step 4 Portfolio & Verification Lifecycle'],
            'Phase 14A' => [\App\Commands\VerifyPhase14Awards::class, 'Award Evaluation Engine & Dean Nominations'],
            'Phase 14B' => [\App\Commands\VerifyPhase14Workflows::class, 'HR, Personnel, Governance & Audit Workflows'],
        ];

        // 1. Initial Clean Reset
        CLI::write("[1/3] Executing Baseline Demo Seed & Reset...", 'cyan');
        $seeder = \Config\Database::seeder();
        $seeder->call('DefenseDemoSeeder');

        // 2. Run All Backend Regression Commands in Deterministic Sequence
        CLI::write("\n[2/3] Executing Local-Defense Verification Suites...", 'cyan');

        foreach ($commandMap as $phase => [$cmdClass, $description]) {
            $totalSuites++;
            CLI::write("------------------------------------------------------------------------", 'dark_gray');
            CLI::write("Running [{$phase}] {$description}...", 'cyan');

            try {
                /** @var BaseCommand $instance */
                $instance = new $cmdClass(service('logger'), service('commands'));
                $exitCode = $instance->run([]);

                if ($exitCode === 0) {
                    $passedSuites++;
                    $suiteResults[$phase] = ['name' => $description, 'status' => 'PASS'];
                    CLI::write("  -> [{$phase}] {$description}: PASSED\n", 'green');
                } else {
                    $suiteResults[$phase] = ['name' => $description, 'status' => 'FAIL'];
                    CLI::write("  -> [{$phase}] {$description}: FAILED (Exit Code: {$exitCode})\n", 'red');
                }
            } catch (Throwable $e) {
                $suiteResults[$phase] = ['name' => $description, 'status' => 'ERROR'];
                CLI::write("  -> [{$phase}] {$description}: ERROR — " . $e->getMessage() . "\n", 'red');
            }
        }

        // 3. Perform Aggregate Final Invariant & Orphan Checks
        CLI::write("\n[3/3] Aggregate Invariants & Final Verification Gate...", 'cyan');

        // Check reference fingerprint
        $refFingerprint = $this->computeReferenceFingerprint($db);
        $isFingerprintValid = ($refFingerprint === 'a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f');
        CLI::write(sprintf("  %-50s %s", "Permanent Reference Fingerprint (a7cb...)", $isFingerprintValid ? "[PASS]" : "[FAIL]"), $isFingerprintValid ? 'green' : 'red');

        // Check zero DB evidence orphans
        $orphanStudentEv = (int) $db->query("SELECT COUNT(*) AS c FROM student_portfolio_evidence spe LEFT JOIN student_portfolio_records spr ON spr.id = spe.portfolio_record_id WHERE spr.id IS NULL")->getRow()->c;
        $orphanPersEv = (int) $db->query("SELECT COUNT(*) AS c FROM personnel_accomplishment_evidence pae LEFT JOIN personnel_accomplishments pa ON pa.id = pae.accomplishment_id WHERE pa.id IS NULL")->getRow()->c;
        $zeroDbOrphans = ($orphanStudentEv === 0 && $orphanPersEv === 0);
        CLI::write(sprintf("  %-50s %s", "Zero Database Evidence Orphans", $zeroDbOrphans ? "[PASS]" : "[FAIL]"), $zeroDbOrphans ? 'green' : 'red');

        // Final clean reset
        $seeder->call('DefenseDemoSeeder');

        CLI::write("\n========================================================================", 'yellow');
        CLI::write("Master Backend Regression Summary", 'yellow');
        CLI::write("========================================================================", 'yellow');

        foreach ($suiteResults as $ph => $res) {
            CLI::write(sprintf("  %-12s %-50s [%s]", $ph, $res['name'], $res['status']), $res['status'] === 'PASS' ? 'green' : 'red');
        }

        $allPassed = ($passedSuites === $totalSuites) && $isFingerprintValid && $zeroDbOrphans;

        CLI::write("========================================================================", 'yellow');
        CLI::write(sprintf("Backend Regression Result: %d / %d Suites PASSED", $passedSuites, $totalSuites), $allPassed ? 'green' : 'red');
        CLI::write(sprintf("Overall Backend Gate Status: %s", $allPassed ? "PHASE 15 PASSED" : "PHASE 15 FAILED"), $allPassed ? 'green' : 'red');
        CLI::write("========================================================================\n", 'yellow');

        return $allPassed ? 0 : 1;
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
