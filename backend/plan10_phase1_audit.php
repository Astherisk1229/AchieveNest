<?php
// AchieveNest Plan 10 Phase 1 - Table Usage & Data Audit Script

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("Database connection failed: " . $db->connect_error . "\n");
}

echo "========================================================================\n";
echo "ACHIEVENEST PLAN 10 — PHASE 1 TABLE USAGE & DATA AUDIT\n";
echo "========================================================================\n\n";

// 1. ENROLLMENT STATUS DISTRIBUTION
echo "[1] ENROLLMENT STATUS DISTRIBUTION IN student_profiles\n";
$enrollmentRes = $db->query("SELECT enrollment_status, COUNT(*) as cnt FROM student_profiles GROUP BY enrollment_status");
$enrollmentDist = [];
while ($r = $enrollmentRes->fetch_assoc()) {
    $enrollmentDist[$r['enrollment_status'] ?? 'NULL'] = (int)$r['cnt'];
    echo "  - " . ($r['enrollment_status'] ?? 'NULL') . ": {$r['cnt']}\n";
}
echo "\n";

// 2. ACCOUNT STATUS DISTRIBUTION IN profiles (for students)
echo "[2] ACCOUNT STATUS DISTRIBUTION IN profiles (account_type='student')\n";
$statusRes = $db->query("SELECT status, COUNT(*) as cnt FROM profiles WHERE account_type = 'student' GROUP BY status");
while ($r = $statusRes->fetch_assoc()) {
    echo "  - " . ($r['status'] ?? 'NULL') . ": {$r['cnt']}\n";
}
echo "\n";

// 3. MUST CHANGE PASSWORD (PENDING FIRST LOGIN)
echo "[3] PENDING FIRST LOGIN STATUS\n";
$lacRes = $db->query("SELECT lac.must_change_password, COUNT(*) as cnt FROM local_auth_credentials lac JOIN profiles p ON p.id = lac.profile_id WHERE p.account_type = 'student' GROUP BY lac.must_change_password");
while ($r = $lacRes->fetch_assoc()) {
    echo "  - must_change_password=" . $r['must_change_password'] . ": {$r['cnt']}\n";
}
echo "\n";

// 4. COLLEGES SCHEMA AND MASTER DATA
echo "[4] COLLEGES TABLE SCHEMA & COLOR CONFIGURATION\n";
$collegesCols = $db->query("DESCRIBE colleges");
$cols = [];
while ($r = $collegesCols->fetch_assoc()) {
    $cols[] = $r['Field'] . " (" . $r['Type'] . ")";
}
echo "  Columns: " . implode(', ', $cols) . "\n\n";

$collegesData = $db->query("SELECT * FROM colleges");
echo "  Configured Colleges:\n";
while ($c = $collegesData->fetch_assoc()) {
    echo "  - [{$c['code']}] {$c['name']} | Color: " . ($c['color'] ?? $c['theme_color'] ?? $c['color_hex'] ?? $c['badge_color'] ?? 'NULL') . "\n";
    print_r($c);
}
echo "\n";

// 5. CHECK IF STUDENTS LIST ENDPOINT RETURNS COLLEGE COLOR
echo "[5] LIST QUERY COLLEGE COLOR RETURN CHECK\n";
$sampleQuery = $db->query("
    SELECT p.id, p.institutional_id, c.code AS college_code, c.name AS college_name, c.*
    FROM profiles p
    JOIN student_profiles sp ON sp.profile_id = p.id
    LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
    LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
    LEFT JOIN colleges c ON c.id = ap.college_id
    WHERE p.account_type = 'student'
    LIMIT 3
");
while ($sq = $sampleQuery->fetch_assoc()) {
    echo "  Student: [{$sq['institutional_id']}] -> College Code: {$sq['college_code']}\n";
}
echo "\n========================================================================\n";
