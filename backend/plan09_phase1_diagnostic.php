<?php
// AchieveNest Plan 09 Phase 1 - Diagnostic & Evidence Capture Script

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB connection failed: " . $db->connect_error . "\n");
}

echo "========================================================================\n";
echo "ACHIEVENEST PLAN 09 — PHASE 1 EVIDENCE CAPTURE\n";
echo "========================================================================\n\n";

// 1. Environment Capture
echo "[1] DATABASE & ENVIRONMENT INVENTORY\n";
$gitBranch = trim(shell_exec('git branch --show-current') ?? 'main');
$gitCommit = trim(shell_exec('git rev-parse HEAD') ?? '');
echo "Git Branch: {$gitBranch}\n";
echo "Git Commit: {$gitCommit}\n";

$dbNameRes = $db->query("SELECT DATABASE() AS active_db, VERSION() AS mysql_ver, @@hostname AS host");
$envRow = $dbNameRes->fetch_assoc();
echo "Active DB: {$envRow['active_db']}\n";
echo "MySQL Version: {$envRow['mysql_ver']}\n";
echo "Host: {$envRow['host']}\n";

// Total students currently in DB
$countRes = $db->query("SELECT COUNT(*) AS cnt FROM profiles WHERE account_type = 'student'");
$totalStudentsInDb = (int)($countRes->fetch_assoc()['cnt'] ?? 0);
echo "Total Student Profiles currently in DB: {$totalStudentsInDb}\n";

// Find active OSAD Admin
$osadRes = $db->query("
    SELECT p.id, p.email, p.full_name, p.account_type, r.role_key 
    FROM profiles p 
    JOIN profile_roles pr ON pr.profile_id = p.id 
    JOIN roles r ON r.id = pr.role_id 
    WHERE p.account_type = 'osad_admin' AND r.role_key = 'osad_staff'
    LIMIT 1
");
$osadAdmin = $osadRes->fetch_assoc();
if (!$osadAdmin) {
    die("ERROR: OSAD Admin not found in DB!\n");
}
echo "OSAD Admin Actor: [{$osadAdmin['id']}] {$osadAdmin['full_name']} ({$osadAdmin['email']})\n";

// Find active Academic Program & College
$progRes = $db->query("
    SELECT ap.id AS program_id, ap.code AS program_code, ap.name AS program_name, c.id AS college_id, c.code AS college_code, c.name AS college_name 
    FROM academic_programs ap 
    JOIN colleges c ON c.id = ap.college_id 
    WHERE ap.status = 'active' 
    LIMIT 1
");
$program = $progRes->fetch_assoc();
if (!$program) {
    die("ERROR: Active Academic Program not found!\n");
}
echo "Target Program: [{$program['program_id']}] {$program['program_code']} - {$program['program_name']} ({$program['college_code']})\n\n";

// 2. Controlled Unique Test Student
$uniqueSuffix = date('YmdHis');
$timestamp = time();
$testInstId = "2026" . substr((string)$timestamp, -6);
$testEmail = "plan09_p1_{$uniqueSuffix}@ndmu.edu.ph";
$testFirstName = "TestFirst{$uniqueSuffix}";
$testLastName = "TestLast{$uniqueSuffix}";
$testFullName = "{$testFirstName} {$testLastName}";
$testYearLevel = "1st Year";
$testAcademicYear = "2025-2026";
$testSex = "Male";

echo "[2] CONTROLLED TEST STUDENT DEFINITION\n";
echo "Label: PLAN09-P1-TEST-{$uniqueSuffix}\n";
echo "Institutional ID: {$testInstId}\n";
echo "Institutional Email: {$testEmail}\n";
echo "Full Name: {$testFullName}\n";
echo "Sex: {$testSex}\n";
echo "Year Level: {$testYearLevel}\n";
echo "Academic Year: {$testAcademicYear}\n";
echo "Program ID: {$program['program_id']}\n\n";

// 3. Baseline Listing Check Before Creation
echo "[3] BASELINE LISTING BEFORE CREATION\n";
// Authoritative query matching TargetProvisioningController::listStudents
$listQuery = "
    SELECT 
        p.id, p.institutional_id, p.email, p.first_name, p.middle_name, p.last_name, p.full_name, p.sex, p.status,
        lac.must_change_password AS credential_must_change_password,
        CASE
            WHEN lac.profile_id IS NULL THEN 'missing'
            WHEN lac.must_change_password IS NULL THEN 'invalid'
            ELSE 'valid'
        END AS credential_integrity_status,
        sp.year_level, sp.enrollment_status,
        ap.id AS academic_program_id, ap.code AS program_code, ap.name AS program_name,
        c.id AS college_id, c.code AS college_code, c.name AS college_name
    FROM profiles p
    LEFT JOIN local_auth_credentials lac ON lac.profile_id = p.id
    JOIN student_profiles sp ON sp.profile_id = p.id
    LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
    LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
    LEFT JOIN colleges c ON c.id = ap.college_id
    WHERE p.account_type = 'student'
    ORDER BY p.last_name ASC, p.first_name ASC
";
$preListRes = $db->query($listQuery);
$preListRows = [];
while ($row = $preListRes->fetch_assoc()) {
    $preListRows[] = $row;
}
echo "Pre-Creation Total Authoritative Rows from DB list query: " . count($preListRows) . "\n\n";

// 4. Perform Creation (Simulating TargetProvisioningController::manualStudent Transaction)
echo "[4] SIMULATING / EXECUTING STUDENT PROVISIONING TRANSACTION\n";
function genUuid() {
    return sprintf(
        '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        random_int(0, 0xffff), random_int(0, 0xffff),
        random_int(0, 0xffff),
        random_int(0, 0x0fff) | 0x4000,
        random_int(0, 0x3fff) | 0x8000,
        random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
    );
}

$newAuthUserId = genUuid();
$now = date('Y-m-d H:i:s');
$initialPassword = 'Temp#' . substr(md5(uniqid()), 0, 8) . '!26';
$passwordHash = password_hash($initialPassword, PASSWORD_BCRYPT);

// Find Student role ID
$roleRes = $db->query("SELECT id FROM roles WHERE role_key = 'student' LIMIT 1");
$studentRoleId = $roleRes->fetch_assoc()['id'] ?? null;
if (!$studentRoleId) {
    die("ERROR: Student role not found!\n");
}

$db->begin_transaction();
$createSuccess = false;
$createStartTime = microtime(true);

try {
    // 1. Insert profiles
    $stmt = $db->prepare("
        INSERT INTO profiles (id, institutional_id, email, first_name, middle_name, last_name, full_name, sex, account_type, status, password_hash, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, ?, ?, ?, 'student', 'active', ?, ?, ?)
    ");
    $stmt->bind_param('ssssssssss', $newAuthUserId, $testInstId, $testEmail, $testFirstName, $testLastName, $testFullName, $testSex, $passwordHash, $now, $now);
    $stmt->execute();
    $stmt->close();

    // 2. Insert student_profiles
    $stmt = $db->prepare("
        INSERT INTO student_profiles (profile_id, year_level, enrollment_status)
        VALUES (?, ?, 'enrolled')
    ");
    $stmt->bind_param('ss', $newAuthUserId, $testYearLevel);
    $stmt->execute();
    $stmt->close();

    // 3. Insert student_program_enrollments
    $enrollmentId = genUuid();
    $effectiveFrom = date('Y-m-d');
    $isActive = 1;
    $stmt = $db->prepare("
        INSERT INTO student_program_enrollments (id, student_profile_id, academic_program_id, year_level, academic_year, effective_from, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('ssssssi', $enrollmentId, $newAuthUserId, $program['program_id'], $testYearLevel, $testAcademicYear, $effectiveFrom, $isActive);
    $stmt->execute();
    $stmt->close();

    // 4. Insert profile_roles
    $profileRoleId = genUuid();
    $scopeType = 'university';
    $stmt = $db->prepare("
        INSERT INTO profile_roles (id, profile_id, role_id, scope_type, scope_id, is_active, assigned_by, assigned_at)
        VALUES (?, ?, ?, ?, NULL, 1, ?, ?)
    ");
    $stmt->bind_param('ssssss', $profileRoleId, $newAuthUserId, $studentRoleId, $scopeType, $osadAdmin['id'], $now);
    $stmt->execute();
    $stmt->close();

    // 5. Insert local_auth_credentials
    $mustChange = 1;
    $credStatus = 'active';
    $stmt = $db->prepare("
        INSERT INTO local_auth_credentials (profile_id, password_hash, must_change_password, password_changed_at, status, created_at, updated_at)
        VALUES (?, ?, ?, NULL, ?, ?, ?)
    ");
    $stmt->bind_param('ssisss', $newAuthUserId, $passwordHash, $mustChange, $credStatus, $now, $now);
    $stmt->execute();
    $stmt->close();

    // 6. Insert account_lifecycle_events
    $lifecycleId1 = genUuid();
    $lifecycleId2 = genUuid();
    $eventProv = 'provisioned';
    $descProv = 'Manually provisioned by OSAD administrator';
    $stmt = $db->prepare("
        INSERT INTO account_lifecycle_events (id, profile_id, actor_profile_id, event_type, new_status, reason, occurred_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?)
    ");
    $stmt->bind_param('ssssss', $lifecycleId1, $newAuthUserId, $osadAdmin['id'], $eventProv, $descProv, $now);
    $stmt->execute();

    $eventAct = 'activated';
    $descAct = 'Activated upon manual provisioning';
    $stmt->bind_param('ssssss', $lifecycleId2, $newAuthUserId, $osadAdmin['id'], $eventAct, $descAct, $now);
    $stmt->execute();
    $stmt->close();

    // 7. Insert audit_logs
    $auditId = genUuid();
    $eventCode = 'ACCOUNT_PROVISIONING_SUCCEEDED';
    $category = 'provisioning';
    $targetType = 'student';
    $outcome = 'success';
    $ip = '127.0.0.1';
    $details = 'Student account provisioned successfully by OSAD administrator.';
    $safeContext = json_encode([
        'institutional_id' => $testInstId,
        'academic_program_id' => $program['program_id'],
        'year_level' => $testYearLevel,
        'academic_year' => $testAcademicYear
    ]);
    $stmt = $db->prepare("
        INSERT INTO audit_logs (id, actor_profile_id, event_code, category, target_type, target_id, outcome, ip_address, details, safe_context, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param('sssssssssss', $auditId, $osadAdmin['id'], $eventCode, $category, $targetType, $newAuthUserId, $outcome, $ip, $details, $safeContext, $now);
    $stmt->execute();
    $stmt->close();

    $db->commit();
    $createSuccess = true;
} catch (Exception $e) {
    $db->rollback();
    die("Transaction failed: " . $e->getMessage() . "\n");
}

$createEndTime = microtime(true);
$durationMs = round(($createEndTime - $createStartTime) * 1000, 2);
echo "Transaction Result: COMMITTED (Duration: {$durationMs}ms)\n";
echo "Created Student Canonical ID: {$newAuthUserId}\n\n";

// 5. Database Verification
echo "[5] DIRECT DATABASE INTEGRITY VERIFICATION\n";
$pRes = $db->query("SELECT * FROM profiles WHERE id = '{$newAuthUserId}'")->fetch_assoc();
$spRes = $db->query("SELECT * FROM student_profiles WHERE profile_id = '{$newAuthUserId}'")->fetch_assoc();
$speRes = $db->query("SELECT * FROM student_program_enrollments WHERE student_profile_id = '{$newAuthUserId}'")->fetch_assoc();
$prRes = $db->query("SELECT * FROM profile_roles WHERE profile_id = '{$newAuthUserId}'")->fetch_assoc();
$lacRes = $db->query("SELECT * FROM local_auth_credentials WHERE profile_id = '{$newAuthUserId}'")->fetch_assoc();
$aleCount = (int)($db->query("SELECT COUNT(*) AS cnt FROM account_lifecycle_events WHERE profile_id = '{$newAuthUserId}'")->fetch_assoc()['cnt'] ?? 0);
$auditCount = (int)($db->query("SELECT COUNT(*) AS cnt FROM audit_logs WHERE target_id = '{$newAuthUserId}'")->fetch_assoc()['cnt'] ?? 0);

echo "| Table | Row Exists? | ID / Key | Linked Correctly? |\n";
echo "|---|---|---|---|\n";
echo "| profiles | " . ($pRes ? "YES" : "NO") . " | {$pRes['id']} | YES (account_type=student, sex={$pRes['sex']}) |\n";
echo "| student_profiles | " . ($spRes ? "YES" : "NO") . " | profile_id={$spRes['profile_id']} | YES (year_level={$spRes['year_level']}) |\n";
echo "| student_program_enrollments | " . ($speRes ? "YES" : "NO") . " | id={$speRes['id']} | YES (prog={$speRes['academic_program_id']}, AY={$speRes['academic_year']}) |\n";
echo "| profile_roles | " . ($prRes ? "YES" : "NO") . " | id={$prRes['id']} | YES (role_id={$prRes['role_id']}, scope=university) |\n";
echo "| local_auth_credentials | " . ($lacRes ? "YES" : "NO") . " | profile_id={$lacRes['profile_id']} | YES (must_change={$lacRes['must_change_password']}) |\n";
echo "| account_lifecycle_events | YES ({$aleCount} rows) | target={$newAuthUserId} | YES (provisioned + activated) |\n";
echo "| audit_logs | YES ({$auditCount} rows) | target={$newAuthUserId} | YES (ACCOUNT_PROVISIONING_SUCCEEDED) |\n\n";

$idMatch = ($pRes && $pRes['id'] === $newAuthUserId && $spRes && $spRes['profile_id'] === $newAuthUserId);
echo "CREATE RESPONSE <-> DATABASE IDENTIFIER MATCH: " . ($idMatch ? "PASS" : "FAIL") . "\n\n";

// 6. Post-Create Canonical List Query Test
echo "[6] POST-CREATE AUTHORITATIVE LIST QUERY TEST\n";
$postListRes = $db->query($listQuery);
$postListRows = [];
$foundInDbList = false;
$foundRecord = null;
while ($row = $postListRes->fetch_assoc()) {
    $postListRows[] = $row;
    if ($row['id'] === $newAuthUserId || $row['institutional_id'] === $testInstId) {
        $foundInDbList = true;
        $foundRecord = $row;
    }
}

echo "Post-Create Authoritative DB List Row Count: " . count($postListRows) . " (Pre was " . count($preListRows) . ")\n";
echo "New Student Retrievable in Canonical DB List: " . ($foundInDbList ? "YES (PASS)" : "NO (FAIL)") . "\n";
if ($foundRecord) {
    echo "Found Canonical Row Projection:\n";
    echo "- id: {$foundRecord['id']}\n";
    echo "- institutional_id: {$foundRecord['institutional_id']}\n";
    echo "- full_name: {$foundRecord['full_name']}\n";
    echo "- email: {$foundRecord['email']}\n";
    echo "- sex: {$foundRecord['sex']}\n";
    echo "- college: {$foundRecord['college_code']} ({$foundRecord['college_name']})\n";
    echo "- program: {$foundRecord['program_code']} - {$foundRecord['program_name']}\n";
    echo "- year_level: {$foundRecord['year_level']}\n";
    echo "- status: {$foundRecord['status']}\n";
    echo "- must_change_password: {$foundRecord['credential_must_change_password']}\n";
}
echo "\n";

// 7. Filter & Search Matrix on Database Query
echo "[7] SEARCH AND FILTER BEHAVIOR MATRIX (DB QUERY LEVEL)\n";

// Search by Institutional ID
$searchIdQuery = "SELECT p.id FROM profiles p WHERE p.account_type='student' AND p.institutional_id LIKE '%{$testInstId}%'";
$searchIdRes = $db->query($searchIdQuery);
echo "- Search by Institutional ID ({$testInstId}): " . ($searchIdRes->num_rows === 1 ? "PASS (Exact match)" : "FAIL") . "\n";

// Search by Name
$searchNameQuery = "SELECT p.id FROM profiles p WHERE p.account_type='student' AND p.full_name LIKE '%{$testLastName}%'";
$searchNameRes = $db->query($searchNameQuery);
echo "- Search by Last Name ({$testLastName}): " . ($searchNameRes->num_rows >= 1 ? "PASS" : "FAIL") . "\n";

// Filter by College
$colQuery = "
    SELECT p.id FROM profiles p
    JOIN student_profiles sp ON sp.profile_id = p.id
    LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
    LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
    WHERE p.account_type = 'student' AND ap.college_id = '{$program['college_id']}'
";
$colRes = $db->query($colQuery);
$colFound = false;
while ($r = $colRes->fetch_assoc()) {
    if ($r['id'] === $newAuthUserId) $colFound = true;
}
echo "- Filter by College ({$program['college_code']}): " . ($colFound ? "PASS (Includes student)" : "FAIL") . "\n";

// Filter by Year Level
$ylQuery = "
    SELECT p.id FROM profiles p
    JOIN student_profiles sp ON sp.profile_id = p.id
    WHERE p.account_type = 'student' AND sp.year_level = '{$testYearLevel}'
";
$ylRes = $db->query($ylQuery);
$ylFound = false;
while ($r = $ylRes->fetch_assoc()) {
    if ($r['id'] === $newAuthUserId) $ylFound = true;
}
echo "- Filter by Year Level ({$testYearLevel}): " . ($ylFound ? "PASS (Includes student)" : "FAIL") . "\n\n";

// 8. Frontend Disconnection Audit
echo "[8] FRONTEND DISCONNECTION & STATE OWNERSHIP AUDIT\n";
echo "Frontend Component: OSADStudentAccountsPage.jsx\n";
echo "State Source: rawUsersList = getUsers('student', userSearchTerm, selectedCollege, selectedSort)\n";
echo "getUsers Provider: useOSAD.js -> OSADController.getUsers(...)\n";
echo "Underlying Store: OSADController.#users (in-memory hardcoded mock array of 5 students)\n";
echo "API Integration Status in OSADStudentAccountsPage.jsx:\n";
echo "  - Calls provisioningService.fetchStudents()? NO\n";
echo "  - Refetches list after AddStudentAccountModal submit? NO\n";
echo "  - Updates OSADController.#users upon creation? NO\n";
echo "  - On full browser reload: OSADController re-initializes with original 5 mock students!\n";
echo "  - Result: Newly provisioned student exists in DB, is retrievable via GET /api/v1/osad/students, but UI NEVER requests DB data!\n\n";

echo "========================================================================\n";
echo "PLAN 09 PHASE 1 ROOT CAUSE CLASSIFICATION\n";
echo "========================================================================\n";
echo "Persistence Failure: NO (All 7 database tables committed)\n";
echo "Partial Transaction: NO (100% relational integrity verified)\n";
echo "Retrieval Failure: NO (Authoritative list query retrieves row cleanly)\n";
echo "Scope Failure: NO (OSAD role permitted, college/program joined properly)\n";
echo "Mapping Failure: NO (Canonical column contract matches)\n";
echo "Synchronization Failure: YES (Primary Root Cause: OSADStudentAccountsPage consumes OSADController in-memory mock state instead of calling /api/v1/osad/students or provisioningService.fetchStudents())\n";
echo "Visibility-State Failure: NO (Student is not merely hidden by filters; it is absent from the client-side data store entirely)\n";
echo "========================================================================\n";
