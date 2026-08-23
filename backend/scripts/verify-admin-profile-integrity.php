<?php

// verify-admin-profile-integrity.php
// Verifies DB check constraints and regression status in AchieveNest-Test.

$lines = file(__DIR__ . '/../.env', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$env = [];
foreach ($lines as $line) {
    $line = trim($line);
    if (str_starts_with($line, '#')) continue;
    if (str_contains($line, '=')) {
        [$k, $v] = explode('=', $line, 2);
        $env[trim($k)] = trim($v);
    }
}

$username = $env['database.development.username'] ?? '';
$password = $env['database.development.password'] ?? '';
$host     = $env['database.development.hostname'] ?? '';
$port     = $env['database.development.port'] ?? 5432;
$dbname   = $env['database.development.database'] ?? 'postgres';

echo "Connecting to: $host (Username: $username)...\n";
$dsn = "pgsql:host=$host;port=$port;dbname=$dbname;sslmode=require";
$pdo = new PDO($dsn, $username, $password, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

echo "=== 1. Checking Existing Profiles Regression ===\n";
$stmt = $pdo->query("SELECT id, institutional_id, account_type, designation, department_id, degree_program_id, year_level, status FROM public.profiles ORDER BY account_type, institutional_id");
$profiles = $stmt->fetchAll(PDO::FETCH_ASSOC);

$studentCount = 0;
$personnelCount = 0;
$adminCount = 0;

foreach ($profiles as $p) {
    if ($p['account_type'] === 'student') $studentCount++;
    elseif ($p['account_type'] === 'personnel') $personnelCount++;
    elseif (in_array($p['account_type'], ['hr_admin', 'osad_admin'], true)) $adminCount++;
}

echo "Found Profiles: Total=" . count($profiles) . ", Students=$studentCount, Personnel=$personnelCount, Admins=$adminCount\n";
if ($studentCount !== 5 || $personnelCount !== 5 || $adminCount !== 0) {
    throw new RuntimeException("Regression check failed! Expected exactly 5 students, 5 personnel, 0 admins.");
}
echo "[PASS] Existing 10 demo accounts intact.\n\n";

echo "=== 2. Testing Database Check Constraints (In Rollback Transaction) ===\n";

$deptStmt = $pdo->query("SELECT id FROM public.departments LIMIT 1");
$deptId = $deptStmt->fetchColumn();

$progStmt = $pdo->query("SELECT id FROM public.degree_programs LIMIT 1");
$progId = $progStmt->fetchColumn();

$tests = [
    [
        'name' => 'Must Succeed: Valid HR Admin (designation="HR Director", null academic fields)',
        'should_succeed' => true,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000001',
            'institutional_id' => '9990000001',
            'institutional_email' => 'test.hr.admin@ndmu.edu.ph',
            'first_name' => 'HR',
            'last_name' => 'Admin',
            'full_name' => 'HR Admin',
            'account_type' => 'hr_admin',
            'designation' => 'HR Director',
            'department_id' => null,
            'degree_program_id' => null,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Succeed: Valid OSAD Admin (designation="Student Affairs Director", null academic fields)',
        'should_succeed' => true,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000002',
            'institutional_id' => '9990000002',
            'institutional_email' => 'test.osad.admin@ndmu.edu.ph',
            'first_name' => 'OSAD',
            'last_name' => 'Admin',
            'full_name' => 'OSAD Admin',
            'account_type' => 'osad_admin',
            'designation' => 'Student Affairs Director',
            'department_id' => null,
            'degree_program_id' => null,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Fail: HR Admin with NULL designation',
        'should_succeed' => false,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000003',
            'institutional_id' => '9990000003',
            'institutional_email' => 'test.hr.null.desig@ndmu.edu.ph',
            'first_name' => 'HR',
            'last_name' => 'Admin',
            'full_name' => 'HR Admin',
            'account_type' => 'hr_admin',
            'designation' => null,
            'department_id' => null,
            'degree_program_id' => null,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Fail: HR Admin with empty string designation',
        'should_succeed' => false,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000004',
            'institutional_id' => '9990000004',
            'institutional_email' => 'test.hr.empty.desig@ndmu.edu.ph',
            'first_name' => 'HR',
            'last_name' => 'Admin',
            'full_name' => 'HR Admin',
            'account_type' => 'hr_admin',
            'designation' => '',
            'department_id' => null,
            'degree_program_id' => null,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Fail: OSAD Admin with whitespace-only designation',
        'should_succeed' => false,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000005',
            'institutional_id' => '9990000005',
            'institutional_email' => 'test.osad.space.desig@ndmu.edu.ph',
            'first_name' => 'OSAD',
            'last_name' => 'Admin',
            'full_name' => 'OSAD Admin',
            'account_type' => 'osad_admin',
            'designation' => '   ',
            'department_id' => null,
            'degree_program_id' => null,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Fail: HR Admin with non-null department_id',
        'should_succeed' => false,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000006',
            'institutional_id' => '9990000006',
            'institutional_email' => 'test.hr.dept@ndmu.edu.ph',
            'first_name' => 'HR',
            'last_name' => 'Admin',
            'full_name' => 'HR Admin',
            'account_type' => 'hr_admin',
            'designation' => 'HR Director',
            'department_id' => $deptId,
            'degree_program_id' => null,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Fail: OSAD Admin with non-null degree_program_id',
        'should_succeed' => false,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000007',
            'institutional_id' => '9990000007',
            'institutional_email' => 'test.osad.prog@ndmu.edu.ph',
            'first_name' => 'OSAD',
            'last_name' => 'Admin',
            'full_name' => 'OSAD Admin',
            'account_type' => 'osad_admin',
            'designation' => 'OSAD Officer',
            'department_id' => null,
            'degree_program_id' => $progId,
            'year_level' => null,
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
    [
        'name' => 'Must Fail: HR Admin with non-null year_level',
        'should_succeed' => false,
        'data' => [
            'id' => 'a0000000-0000-4000-8000-000000000008',
            'institutional_id' => '9990000008',
            'institutional_email' => 'test.hr.year@ndmu.edu.ph',
            'first_name' => 'HR',
            'last_name' => 'Admin',
            'full_name' => 'HR Admin',
            'account_type' => 'hr_admin',
            'designation' => 'HR Director',
            'department_id' => null,
            'degree_program_id' => null,
            'year_level' => '1st Year',
            'status' => 'provisioned',
            'provisioning_method' => 'manual',
        ]
    ],
];

foreach ($tests as $t) {
    $pdo->beginTransaction();
    try {
        // Insert auth user to satisfy FK during rollback test
        $authSql = "INSERT INTO auth.users (id, aud, role, email) VALUES (:id, 'authenticated', 'authenticated', :email)";
        $authStmt = $pdo->prepare($authSql);
        $authStmt->execute([
            'id' => $t['data']['id'],
            'email' => $t['data']['institutional_email'],
        ]);

        $sql = "INSERT INTO public.profiles (
            id, institutional_id, institutional_email, first_name, last_name, full_name,
            account_type, designation, department_id, degree_program_id, year_level, status, provisioning_method
        ) VALUES (
            :id, :institutional_id, :institutional_email, :first_name, :last_name, :full_name,
            :account_type, :designation, :department_id, :degree_program_id, :year_level, :status, :provisioning_method
        )";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($t['data']);
        $pdo->rollBack();

        if ($t['should_succeed']) {
            echo "[PASS] " . $t['name'] . "\n";
        } else {
            echo "[FAIL] " . $t['name'] . " - Expected insert to be rejected, but it succeeded!\n";
            exit(1);
        }
    } catch (PDOException $e) {
        $pdo->rollBack();
        if (! $t['should_succeed']) {
            echo "[PASS] " . $t['name'] . " (Correctly rejected: " . $e->getCode() . ")\n";
        } else {
            echo "[FAIL] " . $t['name'] . " - Unexpected error: " . $e->getMessage() . "\n";
            exit(1);
        }
    }
}

echo "\n=== All Database Acceptance Tests PASSED Successfully ===\n";
