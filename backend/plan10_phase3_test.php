<?php
// AchieveNest Plan 10 Phase 3 — College Color Master-Data Verification Script

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("Database connection failed: " . $db->connect_error . "\n");
}

echo "========================================================================\n";
echo "ACHIEVENEST PLAN 10 — PHASE 3 COLLEGE COLOR MASTER-DATA TEST\n";
echo "========================================================================\n\n";

// 1. Verify CEAC Master Color
$ceac = $db->query("SELECT id, code, name, acronym_badge_color FROM colleges WHERE code = 'CEAC'")->fetch_assoc();
echo "[1] CEAC Master Color Record:\n";
echo "  - Code: {$ceac['code']}\n";
echo "  - Name: {$ceac['name']}\n";
echo "  - Configured Color: {$ceac['acronym_badge_color']}\n";
$ceacPass = ($ceac['acronym_badge_color'] === '#371683');
echo "  - Status: " . ($ceacPass ? "PASS (#371683 Verified)" : "FAIL") . "\n\n";

// 2. Verify List Query Projection
$query = "
    SELECT 
        p.id,
        p.institutional_id,
        c.code AS college_code,
        c.name AS college_name,
        c.acronym_badge_color AS college_color
    FROM profiles p
    JOIN student_profiles sp ON sp.profile_id = p.id
    LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
    LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
    LEFT JOIN colleges c ON c.id = ap.college_id
    WHERE p.account_type = 'student'
";
$res = $db->query($query);
$count = $res->num_rows;
echo "[2] List Query Student Population with College Color:\n";
echo "  - Total Students Returned: {$count}\n";
echo "  - Status: " . ($count === 103 ? "PASS (Parity 103/103)" : "FAIL") . "\n\n";

// 3. Verify All Configured Colleges
echo "[3] All Configured Colleges in Database:\n";
$colleges = $db->query("SELECT id, code, name, acronym_badge_color FROM colleges");
while ($col = $colleges->fetch_assoc()) {
    $colorVal = $col['acronym_badge_color'] ?? 'NULL (Fallback #16834A)';
    echo "  - [{$col['code']}] {$col['name']} -> {$colorVal}\n";
}
echo "\n========================================================================\n";
echo "PHASE 3 MASTER-DATA VERIFICATION: COMPLETE\n";
echo "========================================================================\n";
