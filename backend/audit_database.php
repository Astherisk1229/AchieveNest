<?php

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB connection failed: " . $db->connect_error . "\n");
}

echo "========================================================================\n";
echo "AchieveNest — Local Database 3NF Audit Extraction\n";
echo "========================================================================\n";

// 1. Tables & Row counts
$tablesRes = $db->query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'achievenest_local' ORDER BY TABLE_NAME");
$tables = [];
while ($row = $tablesRes->fetch_assoc()) {
    $t = $row['TABLE_NAME'];
    $cntRes = $db->query("SELECT COUNT(*) as cnt FROM `{$t}`");
    $cnt = $cntRes ? $cntRes->fetch_assoc()['cnt'] : 0;
    $tables[$t] = $cnt;
}

echo sprintf("Total Tables in achievenest_local: %d\n", count($tables));
foreach ($tables as $t => $cnt) {
    echo sprintf("  - %-45s (Rows: %d)\n", $t, $cnt);
}

// 2. Foreign Keys
echo "\n--- Foreign Keys ---\n";
$fkRes = $db->query("
    SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = 'achievenest_local'
      AND REFERENCED_TABLE_NAME IS NOT NULL
    ORDER BY TABLE_NAME, COLUMN_NAME
");
$fks = [];
while ($row = $fkRes->fetch_assoc()) {
    $fks[] = $row;
    echo sprintf("  %s.%s -> %s.%s (%s)\n", 
        $row['TABLE_NAME'], 
        $row['COLUMN_NAME'], 
        $row['REFERENCED_TABLE_NAME'], 
        $row['REFERENCED_COLUMN_NAME'],
        $row['CONSTRAINT_NAME']
    );
}

// 3. Portfolio Categories & Subcategories
echo "\n--- Portfolio Categories ---\n";
$catRes = $db->query("SELECT * FROM portfolio_categories ORDER BY sort_order, name");
if ($catRes) {
    while ($row = $catRes->fetch_assoc()) {
        echo sprintf("  [%s] %s (%s, active: %s)\n", $row['id'], $row['name'], $row['code'], $row['is_active'] ?? '1');
    }
}

echo "\n--- Portfolio Subcategories ---\n";
$subRes = $db->query("
    SELECT pc.name AS cat_name, ps.* 
    FROM portfolio_subcategories ps
    JOIN portfolio_categories pc ON pc.id = ps.category_id
    ORDER BY pc.sort_order, ps.sort_order, ps.name
");
if ($subRes) {
    while ($row = $subRes->fetch_assoc()) {
        echo sprintf("  [%-35s -> %-35s] code: %-30s (active: %s)\n", $row['cat_name'], $row['name'], $row['code'], $row['is_active'] ?? '1');
    }
}

// 4. Orphan Record Integrity Checks
echo "\n--- Orphan Checks ---\n";
$orphanChecks = [
    'student_profiles -> profiles' => "SELECT sp.profile_id FROM student_profiles sp LEFT JOIN profiles p ON p.id = sp.profile_id WHERE p.id IS NULL",
    'personnel_profiles -> profiles' => "SELECT pp.profile_id FROM personnel_profiles pp LEFT JOIN profiles p ON p.id = pp.profile_id WHERE p.id IS NULL",
    'profile_roles -> profiles' => "SELECT pr.profile_id FROM profile_roles pr LEFT JOIN profiles p ON p.id = pr.profile_id WHERE p.id IS NULL",
    'profile_roles -> roles' => "SELECT pr.role_id FROM profile_roles pr LEFT JOIN roles r ON r.id = pr.role_id WHERE r.id IS NULL",
    'student_program_enrollments -> student_profiles' => "SELECT spe.student_profile_id FROM student_program_enrollments spe LEFT JOIN student_profiles sp ON sp.profile_id = spe.student_profile_id WHERE sp.profile_id IS NULL",
    'student_program_enrollments -> academic_programs' => "SELECT spe.academic_program_id FROM student_program_enrollments spe LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id WHERE ap.id IS NULL",
    'academic_programs -> colleges' => "SELECT ap.college_id FROM academic_programs ap LEFT JOIN colleges c ON c.id = ap.college_id WHERE c.id IS NULL",
    'award_criteria -> award_definitions' => "SELECT ac.award_definition_id FROM award_criteria ac LEFT JOIN award_definitions ad ON ad.id = ac.award_definition_id WHERE ad.id IS NULL",
    'award_criterion_components -> award_criteria' => "SELECT acc.criterion_id FROM award_criterion_components acc LEFT JOIN award_criteria ac ON ac.id = acc.criterion_id WHERE ac.id IS NULL",
    'student_award_evaluations -> award_definitions' => "SELECT sae.award_definition_id FROM student_award_evaluations sae LEFT JOIN award_definitions ad ON ad.id = sae.award_definition_id WHERE ad.id IS NULL",
    'student_portfolio_records -> portfolio_categories' => "SELECT spr.category_id FROM student_portfolio_records spr LEFT JOIN portfolio_categories pc ON pc.id = spr.category_id WHERE pc.id IS NULL",
];

foreach ($orphanChecks as $label => $sql) {
    $res = $db->query($sql);
    $cnt = $res ? $res->num_rows : -1;
    echo sprintf("  %-55s: %s (Orphans: %d)\n", $label, ($cnt === 0 ? "PASS" : "WARN"), $cnt);
}
