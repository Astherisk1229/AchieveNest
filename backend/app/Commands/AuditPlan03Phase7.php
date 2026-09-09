<?php

namespace App\Commands;

use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;

class AuditPlan03Phase7 extends BaseCommand
{
    protected $group       = 'Audit';
    protected $name        = 'audit:plan03-phase7';
    protected $description = 'Comprehensive Regression Audit for Plan 03 (OSAD Student Account Management & Data Completeness)';

    public function run(array $params)
    {
        $db = db_connect();

        CLI::write("========================================================================", 'cyan');
        CLI::write("AchieveNest — OSAD Student Account Management & Student Data Completeness", 'yellow');
        CLI::write("Plan 03 Phase 7 — Comprehensive Full Regression Suite", 'yellow');
        CLI::write("========================================================================", 'cyan');

        $passCount = 0;
        $failCount = 0;

        // 1. Schema & Source of Truth: profiles.sex
        $fields = $db->getFieldData('profiles');
        $hasSex = false;
        foreach ($fields as $f) {
            if (strtolower($f->name) === 'sex') {
                $hasSex = true;
                break;
            }
        }
        if ($hasSex) {
            CLI::write("[PASS] 1. profiles.sex authoritative column present", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 1. profiles.sex authoritative column missing");
            $failCount++;
        }

        // 2. Subtype tables have 0 duplicate sex fields
        $spFields = $db->getFieldData('student_profiles');
        $hasSpSex = false;
        foreach ($spFields as $f) {
            if (strtolower($f->name) === 'sex') {
                $hasSpSex = true;
                break;
            }
        }
        if (! $hasSpSex) {
            CLI::write("[PASS] 2. 0 duplicate Sex fields in student_profiles", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 2. Duplicate Sex field detected in student_profiles");
            $failCount++;
        }

        // 3. Sex domain integrity
        $invalidSexRows = $db->query("
            SELECT id, sex FROM profiles 
            WHERE sex IS NOT NULL AND sex NOT IN ('Male', 'Female', 'Prefer not to say')
        ")->getResultArray();
        if (count($invalidSexRows) === 0) {
            CLI::write("[PASS] 3. Sex domain integrity: 0 invalid values (domain: Male, Female, Prefer not to say)", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 3. Sex domain integrity: " . count($invalidSexRows) . " invalid values found");
            $failCount++;
        }

        // 4. Year Level Cache Drift
        $driftRows = $db->query("
            SELECT sp.profile_id, sp.year_level AS profile_yl, spe.year_level AS enrollment_yl
            FROM student_profiles sp
            JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
            WHERE sp.year_level <> spe.year_level
        ")->getResultArray();
        if (count($driftRows) === 0) {
            CLI::write("[PASS] 4. Year-Level cache drift: 0 drift between student_profiles & active enrollment", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 4. Year-Level cache drift: " . count($driftRows) . " drift detected");
            $failCount++;
        }

        // 5. Program source resolution
        $unresolvedProg = $db->query("
            SELECT spe.id, spe.academic_program_id
            FROM student_program_enrollments spe
            LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
            WHERE spe.is_active = 1 AND ap.id IS NULL
        ")->getResultArray();
        if (count($unresolvedProg) === 0) {
            CLI::write("[PASS] 5. Program authority: 100% active enrollments resolve to valid academic_programs", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 5. Program authority: " . count($unresolvedProg) . " orphan program enrollments");
            $failCount++;
        }

        // 6. College source resolution
        $unresolvedCol = $db->query("
            SELECT ap.id, ap.name, ap.college_id
            FROM academic_programs ap
            LEFT JOIN colleges c ON c.id = ap.college_id
            WHERE ap.status = 'active' AND c.id IS NULL
        ")->getResultArray();
        if (count($unresolvedCol) === 0) {
            CLI::write("[PASS] 6. College authority: 100% active programs resolve to valid colleges", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 6. College authority: " . count($unresolvedCol) . " programs with missing colleges");
            $failCount++;
        }

        // 7. Orphan checks
        $orphanSp = $db->query("SELECT sp.profile_id FROM student_profiles sp LEFT JOIN profiles p ON p.id = sp.profile_id WHERE p.id IS NULL")->getResultArray();
        $orphanSpe = $db->query("SELECT spe.id FROM student_program_enrollments spe LEFT JOIN student_profiles sp ON sp.profile_id = spe.student_profile_id WHERE sp.profile_id IS NULL")->getResultArray();
        if (count($orphanSp) === 0 && count($orphanSpe) === 0) {
            CLI::write("[PASS] 7. Database integrity: 0 orphan student_profiles, 0 orphan enrollments", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 7. Database integrity: orphans detected (sp=" . count($orphanSp) . ", spe=" . count($orphanSpe) . ")");
            $failCount++;
        }

        // 8. Identity uniqueness
        $dupIds = $db->query("SELECT institutional_id, COUNT(*) as cnt FROM profiles GROUP BY institutional_id HAVING cnt > 1")->getResultArray();
        $dupEmails = $db->query("SELECT email, COUNT(*) as cnt FROM profiles GROUP BY email HAVING cnt > 1")->getResultArray();
        if (count($dupIds) === 0 && count($dupEmails) === 0) {
            CLI::write("[PASS] 8. Identity uniqueness: 0 duplicate institutional IDs, 0 duplicate emails", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 8. Identity uniqueness: collisions detected (IDs=" . count($dupIds) . ", Emails=" . count($dupEmails) . ")");
            $failCount++;
        }

        // 9. Query performance & N+1 verification
        $t0 = microtime(true);
        $rows = $db->table('profiles p')
            ->select('
                p.id,
                p.institutional_id,
                p.email,
                p.first_name,
                p.middle_name,
                p.last_name,
                p.full_name,
                p.sex,
                p.status,
                sp.year_level,
                sp.enrollment_status,
                ap.id AS academic_program_id,
                ap.code AS program_code,
                ap.name AS program_name,
                c.id AS college_id,
                c.code AS college_code,
                c.name AS college_name
            ')
            ->join('student_profiles sp', 'sp.profile_id = p.id')
            ->join('student_program_enrollments spe', 'spe.student_profile_id = sp.profile_id AND spe.is_active = 1', 'left')
            ->join('academic_programs ap', 'ap.id = spe.academic_program_id', 'left')
            ->join('colleges c', 'c.id = ap.college_id', 'left')
            ->where('p.account_type', 'student')
            ->orderBy('p.last_name', 'ASC')
            ->orderBy('p.first_name', 'ASC')
            ->get()->getResultArray();
        $queryTimeMs = round((microtime(true) - $t0) * 1000, 2);

        if ($queryTimeMs < 100.0 && count($rows) > 0) {
            CLI::write("[PASS] 9. Eager joined student query: {$queryTimeMs}ms for " . count($rows) . " students (0 N+1 queries)", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 9. Eager joined student query degraded: {$queryTimeMs}ms");
            $failCount++;
        }

        // 10. Provisioning Transaction & Rollback verification
        $activeProg = $db->table('academic_programs')->where('status', 'active')->get()->getRowArray();
        $progId = $activeProg['id'] ?? null;
        $testInstId = 'REG_TEST_' . time();
        $testEmail = 'reg.test.' . time() . '@ndmu.edu.ph';
        $testUserId = '77777777-7777-7777-7777-' . substr(md5($testInstId), 0, 12);
        $now = date('Y-m-d H:i:s');

        // Test Transaction Success
        $db->transStart();
        $db->table('profiles')->insert([
            'id'                   => $testUserId,
            'institutional_id'     => $testInstId,
            'email'                => $testEmail,
            'first_name'           => 'RegressionTest',
            'last_name'            => 'Student',
            'full_name'            => 'RegressionTest Student',
            'sex'                  => 'Female',
            'account_type'         => 'student',
            'status'               => 'active',
            'password_hash'        => password_hash('RegPass123!', PASSWORD_DEFAULT),
            'must_change_password' => 1,
            'created_at'           => $now,
            'updated_at'           => $now,
        ]);
        $db->table('student_profiles')->insert([
            'profile_id'        => $testUserId,
            'year_level'        => '3rd Year',
            'enrollment_status' => 'enrolled',
        ]);
        $db->table('student_program_enrollments')->insert([
            'id'                  => '88888888-8888-8888-8888-' . substr(md5($testInstId), 0, 12),
            'student_profile_id'  => $testUserId,
            'academic_program_id' => $progId,
            'year_level'          => '3rd Year',
            'academic_year'       => '2025-2026',
            'effective_from'      => date('Y-m-d'),
            'is_active'           => 1,
        ]);
        $db->transComplete();

        $savedRow = $db->table('profiles')->where('id', $testUserId)->get()->getRowArray();
        $savedSp = $db->table('student_profiles')->where('profile_id', $testUserId)->get()->getRowArray();
        $savedSpe = $db->table('student_program_enrollments')->where('student_profile_id', $testUserId)->get()->getRowArray();

        if ($savedRow && $savedRow['sex'] === 'Female' && $savedSp['year_level'] === '3rd Year' && $savedSpe['year_level'] === '3rd Year') {
            CLI::write("[PASS] 10. Transactional provisioning integrity: profiles + student_profiles + enrollments verified", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 10. Transactional provisioning integrity check failed");
            $failCount++;
        }

        // Cleanup
        $db->table('student_program_enrollments')->where('student_profile_id', $testUserId)->delete();
        $db->table('student_profiles')->where('profile_id', $testUserId)->delete();
        $db->table('profiles')->where('id', $testUserId)->delete();

        // 11. Transaction Rollback on Failure Verification
        $rollbackUserId = '99999999-9999-9999-9999-' . substr(md5($testInstId . 'rb'), 0, 12);
        $db->transStart();
        $db->table('profiles')->insert([
            'id'                   => $rollbackUserId,
            'institutional_id'     => $testInstId . '_rb',
            'email'                => $testEmail . '_rb',
            'first_name'           => 'RollbackTest',
            'last_name'            => 'Student',
            'full_name'            => 'RollbackTest Student',
            'sex'                  => 'Male',
            'account_type'         => 'student',
            'status'               => 'active',
            'password_hash'        => password_hash('Pass123!', PASSWORD_DEFAULT),
            'must_change_password' => 1,
            'created_at'           => $now,
            'updated_at'           => $now,
        ]);
        // Simulate forced rollback
        $db->transRollback();

        $rbRow = $db->table('profiles')->where('id', $rollbackUserId)->get()->getRowArray();
        if ($rbRow === null) {
            CLI::write("[PASS] 11. Transaction rollback on failure: 0 partial persistence", 'green');
            $passCount++;
        } else {
            CLI::error("[FAIL] 11. Transaction rollback failed: row remained persisted");
            $failCount++;
        }

        CLI::write("------------------------------------------------------------------------", 'cyan');
        CLI::write("Plan 03 Phase 7 Backend Regression Total: {$passCount} PASSED, {$failCount} FAILED", $failCount === 0 ? 'green' : 'red');
        CLI::write("========================================================================", 'cyan');
    }
}
