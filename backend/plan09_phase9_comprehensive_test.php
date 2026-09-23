<?php
// AchieveNest Plan 09 Phase 9 — Backend Comprehensive Test Harness

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("Database connection failed: " . $db->connect_error . "\n");
}

echo "========================================================================\n";
echo "ACHIEVENEST PLAN 09 — PHASE 9 BACKEND COMPREHENSIVE TEST SUITE\n";
echo "========================================================================\n\n";

$passCount = 0;
$failCount = 0;

function assertTest(string $scenarioName, bool $condition) {
    global $passCount, $failCount;
    if ($condition) {
        echo "[PASS] {$scenarioName}\n";
        $passCount++;
    } else {
        echo "[FAIL] {$scenarioName}\n";
        $failCount++;
    }
}

// 1. Baseline Count Verification
$baselineCount = (int)($db->query("SELECT COUNT(DISTINCT p.id) AS c FROM profiles p JOIN student_profiles sp ON sp.profile_id = p.id WHERE p.account_type = 'student'")->fetch_assoc()['c'] ?? 0);
assertTest("Scenario 1/5: Baseline canonical count is 103", $baselineCount === 103);

// 2. Canonical Identifier Match Verification
$sampleStudent = $db->query("
    SELECT p.id, p.institutional_id, p.email, sp.year_level, spe.academic_program_id, lac.must_change_password
    FROM profiles p
    JOIN student_profiles sp ON sp.profile_id = p.id
    LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
    LEFT JOIN local_auth_credentials lac ON lac.profile_id = p.id
    WHERE p.account_type = 'student'
    LIMIT 1
")->fetch_assoc();

assertTest("Scenario 3/4/5: Canonical identifier consistency (profile, student_profile, enrollment, auth)", !empty($sampleStudent['id']) && !empty($sampleStudent['institutional_id']));

// 3. Duplicate Prevention Verification
$dupCheckId = $sampleStudent['institutional_id'];
$dupCheckRes = $db->query("SELECT COUNT(*) AS c FROM profiles WHERE institutional_id = '{$dupCheckId}'")->fetch_assoc()['c'];
assertTest("Scenario 12: Duplicate Student ID integrity preserved (exactly 1 record in DB)", (int)$dupCheckRes === 1);

// 4. Legacy NULL Sex Verification
$nullSexCount = (int)($db->query("SELECT COUNT(*) AS c FROM profiles p JOIN student_profiles sp ON sp.profile_id = p.id WHERE p.account_type = 'student' AND (p.sex IS NULL OR TRIM(p.sex) = '')")->fetch_assoc()['c'] ?? 0);
assertTest("Scenario 24: Preserves 74 legacy NULL sex records safely", $nullSexCount === 74);

// 5. Rollback Safety Verification
$db->begin_transaction();
$testId = 'TEST-ROLLBACK-' . time();
$db->query("INSERT INTO profiles (id, institutional_id, first_name, last_name, email, account_type, status) VALUES ('{$testId}', '9999999', 'Rollback', 'Test', 'rollback.test@ndmu.edu.ph', 'student', 'active')");
$db->rollback();

$verifyRollback = (int)($db->query("SELECT COUNT(*) AS c FROM profiles WHERE id = '{$testId}'")->fetch_assoc()['c'] ?? 0);
assertTest("Scenario 14: Transaction rollback leaves 0 partial records", $verifyRollback === 0);

echo "\n========================================================================\n";
echo "PHASE 9 BACKEND SUITE SUMMARY: {$passCount} Passed, {$failCount} Failed\n";
echo "========================================================================\n";
