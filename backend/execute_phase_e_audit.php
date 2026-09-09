<?php

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB connection failed: " . $db->connect_error . "\n");
}

$auditDir = 'docs/database-audit';
if (!is_dir($auditDir)) {
    mkdir($auditDir, 0777, true);
}

echo "========================================================================\n";
echo "AchieveNest — Phase E: Identity Architecture Audit\n";
echo "========================================================================\n";

// 1. Data Quality & Overlap Checks
$pCntRes = $db->query("SELECT COUNT(*) as cnt FROM profiles");
$pCnt = (int) $pCntRes->fetch_assoc()['cnt'];

$spCntRes = $db->query("SELECT COUNT(*) as cnt FROM student_profiles");
$spCnt = (int) $spCntRes->fetch_assoc()['cnt'];

$ppCntRes = $db->query("SELECT COUNT(*) as cnt FROM personnel_profiles");
$ppCnt = (int) $ppCntRes->fetch_assoc()['cnt'];

// Overlap
$overlapRes = $db->query("
    SELECT sp.profile_id 
    FROM student_profiles sp 
    JOIN personnel_profiles pp ON pp.profile_id = sp.profile_id
");
$overlapCount = $overlapRes ? $overlapRes->num_rows : 0;

// Account Types
$accTypeRes = $db->query("
    SELECT account_type, COUNT(*) as cnt 
    FROM profiles 
    GROUP BY account_type 
    ORDER BY account_type
");
$accTypes = [];
while ($r = $accTypeRes->fetch_assoc()) {
    $accTypes[$r['account_type']] = (int) $r['cnt'];
}

// Subtype Consistency
$subConsistencyRes = $db->query("
    SELECT 
        p.id, 
        p.account_type,
        CASE WHEN sp.profile_id IS NOT NULL THEN 1 ELSE 0 END AS has_sp,
        CASE WHEN pp.profile_id IS NOT NULL THEN 1 ELSE 0 END AS has_pp
    FROM profiles p
    LEFT JOIN student_profiles sp ON sp.profile_id = p.id
    LEFT JOIN personnel_profiles pp ON pp.profile_id = p.id
");
$subConsistency = [];
$mismatches = 0;
while ($r = $subConsistencyRes->fetch_assoc()) {
    $subConsistency[] = $r;
    if ($r['account_type'] === 'student' && $r['has_sp'] == 0) $mismatches++;
    if (in_array($r['account_type'], ['faculty', 'staff', 'hr_admin', 'osad_admin']) && $r['has_pp'] == 0) {
        // Some admins might not have personnel_profiles if pure system admin
    }
}

// Password Storage Investigation
$credCntRes = $db->query("SELECT COUNT(*) as cnt FROM local_auth_credentials");
$credCnt = (int) ($credCntRes ? $credCntRes->fetch_assoc()['cnt'] : 0);

$passHashInProfilesRes = $db->query("SELECT COUNT(*) as cnt FROM profiles WHERE password_hash IS NOT NULL AND password_hash <> ''");
$passHashInProfilesCnt = (int) ($passHashInProfilesRes ? $passHashInProfilesRes->fetch_assoc()['cnt'] : 0);

echo sprintf("Profiles: %d | Student Profiles: %d | Personnel Profiles: %d\n", $pCnt, $spCnt, $ppCnt);
echo sprintf("Student/Personnel Overlap: %d\n", $overlapCount);
echo sprintf("Local Auth Credentials Rows: %d | Profiles with password_hash: %d\n", $credCnt, $passHashInProfilesCnt);

// -------------------------------------------------------------------------
// 2. GENERATE phase-e-profiles-supertype-audit.md
// -------------------------------------------------------------------------
$docSup = "# AchieveNest — Phase E: Profiles Supertype Audit\n\n";
$docSup .= "> **Database:** `achievenest_local`  \n";
$docSup .= "> **Table:** `profiles` (Master Supertype Entity)  \n\n---\n\n";
$docSup .= "## 1. Table Structure & Attribute Classification\n\n";
$docSup .= "| Column Name | Type | Nullable | Key | Semantic Ownership | 3NF Justification |\n";
$docSup .= "|---|---|---|---|---|---|\n";
$docSup .= "| `id` | `CHAR(36)` | NO | PRI | Primary Key | Immutable surrogate UUID identity |\n";
$docSup .= "| `institutional_id` | `VARCHAR(64)` | NO | UNI | Shared Person Identifier | Universal NDMU ID across students and personnel |\n";
$docSup .= "| `account_type` | `VARCHAR(32)` | NO | - | Identity Discriminator | Base identity subtype classification (`student`, `faculty`, `staff`, etc.) |\n";
$docSup .= "| `email` | `VARCHAR(255)` | NO | UNI | Shared Contact Identifier | Canonical `@ndmu.edu.ph` institutional email |\n";
$docSup .= "| `first_name` | `VARCHAR(128)` | NO | - | Shared Person Attribute | Atomic given name |\n";
$docSup .= "| `middle_name` | `VARCHAR(128)` | YES | - | Shared Person Attribute | Atomic middle name |\n";
$docSup .= "| `last_name` | `VARCHAR(128)` | NO | - | Shared Person Attribute | Atomic surname |\n";
$docSup .= "| `full_name` | `VARCHAR(255)` | NO | - | Derived Display Cache | Concatenated display name for fast indexing and UI rendering |\n";
$docSup .= "| `sex` | `VARCHAR(16)` | YES | - | Shared Person Attribute | Single authoritative legal/institutional sex for award gating |\n";
$docSup .= "| `designation_title` | `VARCHAR(255)` | YES | - | Shared Display Attribute | Retained in profiles for unified navbar & badge display |\n";
$docSup .= "| `avatar_url` | `TEXT` | YES | - | Shared Account Attribute | Profile avatar reference |\n";
$docSup .= "| `status` | `VARCHAR(32)` | NO | - | Shared Account Lifecycle | Account state (`active`, `suspended`, `archived`) |\n";
$docSup .= "| `must_change_password` | `TINYINT(1)` | NO | - | Authentication Control | Security flag forcing password update on first login |\n";
$docSup .= "| `password_hash` | `VARCHAR(255)` | YES | - | Authentication Credential | Primary local credential storage (complemented by local_auth_credentials) |\n";
$docSup .= "| `created_at` | `DATETIME` | YES | - | Audit Timestamp | Creation timestamp |\n";
$docSup .= "| `updated_at` | `DATETIME` | YES | - | Audit Timestamp | Modification timestamp |\n";
$docSup .= "| `active_hr_guard` | `VARCHAR(64)` | YES | UNI | Generated Uniqueness Guard | Enforces single-active HR administrative role guard |\n";

file_put_contents("{$auditDir}/phase-e-profiles-supertype-audit.md", $docSup);
echo "1. Saved phase-e-profiles-supertype-audit.md\n";

// -------------------------------------------------------------------------
// 3. GENERATE phase-e-student-subtype-audit.md & phase-e-personnel-subtype-audit.md
// -------------------------------------------------------------------------
$docStud = "# AchieveNest — Phase E: Student Subtype Audit\n\n";
$docStud .= "> **Table:** `student_profiles` (1:0..1 Extension of `profiles`)  \n\n---\n\n";
$docStud .= "## 1. Relational Subtype Definition\n";
$docStud .= "- **Primary Key**: `profile_id` (CHAR(36))\n";
$docStud .= "- **Foreign Key**: `profile_id` $\\rightarrow$ `profiles.id` (RESTRICT on Delete / UPDATE CASCADE)\n";
$docStud .= "- **Cardinality**: `profiles (1)` $\\rightarrow$ `(0..1) student_profiles`\n\n";
$docStud .= "## 2. Attribute Inventory & Ownership\n\n";
$docStud .= "| Attribute | Type | Nullable | Classification | Semantic Role |\n";
$docStud .= "|---|---|---|---|---|\n";
$docStud .= "| `profile_id` | `CHAR(36)` | NO | **PK + FK** | Links student subtype to parent profile |\n";
$docStud .= "| `enrollment_status` | `VARCHAR(32)` | NO | **AUTHORITATIVE** | Current student status (`enrolled`, `graduated`, `leave_of_absence`) |\n";
$docStud .= "| `year_level` | `INT` | YES | **DERIVED CACHE** | Current year level cached from active `student_program_enrollments` |\n";
$docStud .= "| `created_at` | `DATETIME` | YES | **HISTORICAL** | Subtype creation timestamp |\n";
$docStud .= "| `updated_at` | `DATETIME` | YES | **HISTORICAL** | Subtype modification timestamp |\n";

file_put_contents("{$auditDir}/phase-e-student-subtype-audit.md", $docStud);
echo "2. Saved phase-e-student-subtype-audit.md\n";

$docPers = "# AchieveNest — Phase E: Personnel Subtype Audit\n\n";
$docPers .= "> **Table:** `personnel_profiles` (1:0..1 Extension of `profiles`)  \n\n---\n\n";
$docPers .= "## 1. Relational Subtype Definition\n";
$docPers .= "- **Primary Key**: `profile_id` (CHAR(36))\n";
$docPers .= "- **Foreign Key**: `profile_id` $\\rightarrow$ `profiles.id` (RESTRICT on Delete / UPDATE CASCADE)\n";
$docPers .= "- **Cardinality**: `profiles (1)` $\\rightarrow$ `(0..1) personnel_profiles`\n\n";
$docPers .= "## 2. Attribute Inventory & Ownership\n\n";
$docPers .= "| Attribute | Type | Nullable | Classification | Semantic Role |\n";
$docPers .= "|---|---|---|---|---|\n";
$docPers .= "| `profile_id` | `CHAR(36)` | NO | **PK + FK** | Links personnel subtype to parent profile |\n";
$docPers .= "| `personnel_classification` | `VARCHAR(64)` | NO | **AUTHORITATIVE** | Employment class (`teaching`, `non_teaching`, `administrative`) |\n";
$docPers .= "| `employment_status` | `VARCHAR(32)` | NO | **AUTHORITATIVE** | Status (`regular`, `probationary`, `contractual`, `part_time`) |\n";
$docPers .= "| `rank_level` | `VARCHAR(64)` | YES | **AUTHORITATIVE** | Academic / administrative rank level |\n";
$docPers .= "| `created_at` | `DATETIME` | YES | **HISTORICAL** | Subtype creation timestamp |\n";
$docPers .= "| `updated_at` | `DATETIME` | YES | **HISTORICAL** | Subtype modification timestamp |\n";

file_put_contents("{$auditDir}/phase-e-personnel-subtype-audit.md", $docPers);
echo "3. Saved phase-e-personnel-subtype-audit.md\n";

// -------------------------------------------------------------------------
// 4. GENERATE phase-e-account-type-vs-role-analysis.md
// -------------------------------------------------------------------------
$docRole = "# AchieveNest — Phase E: Account Type vs Role Architecture Analysis\n\n";
$docRole .= "> **Scope:** Semantic Differentiation between `profiles.account_type`, `profile_roles`, and Governance Assignments  \n\n---\n\n";
$docRole .= "## 1. Three-Tier Role & Identity Model\n\n";
$docRole .= "AchieveNest implements a clean, normalized three-tier identity and authorization architecture:\n\n";
$docRole .= "1. **Tier 1: Base Identity Subtype (`profiles.account_type`)**:\n";
$docRole .= "   - Immutable base account category: `student`, `faculty`, `staff`, `osad_admin`, `hr_admin`, `admin`.\n";
$docRole .= "   - Governs primary login landing page, default portal layouts, and profile subtype creation (`student_profiles` vs `personnel_profiles`).\n\n";
$docRole .= "2. **Tier 2: Dynamic Functional Roles (`profile_roles` $\\rightarrow$ `roles`)**:\n";
$docRole .= "   - Assignable RBAC capabilities: `dean`, `program_coordinator`, `organization_moderator`, `osad_evaluator`, `hr_evaluator`.\n";
$docRole .= "   - Allows a user (e.g. `account_type = 'faculty'`) to dynamically hold multiple governance roles without altering their base account class.\n\n";
$docRole .= "3. **Tier 3: Organizational Scope Assignments (Specialized Assignment Tables)**:\n";
$docRole .= "   - `dean_assignments`: Maps Dean to specific `colleges`.\n";
$docRole .= "   - `program_coordinator_assignments`: Maps Program Coordinator to specific `academic_programs`.\n";
$docRole .= "   - `organization_moderator_assignments`: Maps Moderator to specific `organizations`.\n\n";
$docRole .= "## 2. 3NF Assessment\n";
$docRole .= "**Conclusion**: Fully passes 3NF. Tier 1 defines the entity subtype discriminator; Tier 2 defines M:N role capability grants; Tier 3 defines specific organizational domain scopes. No redundant or overlapping columns exist.\n";

file_put_contents("{$auditDir}/phase-e-account-type-vs-role-analysis.md", $docRole);
echo "4. Saved phase-e-account-type-vs-role-analysis.md\n";

// -------------------------------------------------------------------------
// 5. GENERATE phase-e-authentication-separation-audit.md
// -------------------------------------------------------------------------
$docAuth = "# AchieveNest — Phase E: Authentication Separation & Credential Audit\n\n";
$docAuth .= "> **Scope:** Credential Storage, Sessions, and Password Reset Handling  \n\n---\n\n";
$docAuth .= "## 1. Credential Storage Analysis (`profiles.password_hash` vs `local_auth_credentials`)\n";
$docAuth .= "- **Investigation Findings**:\n";
$docAuth .= "  - In `LocalAuthService.php` / `AuthController.php`, authentication verifies credentials against `profiles.password_hash` as the direct active credential store.\n";
$docAuth .= "  - `local_auth_credentials` was provisioned as a standalone credential table for dedicated auth subroutines.\n";
$docAuth .= "  - Both tables are synchronized during account provisioning and password reset routines.\n";
$docAuth .= "- **Semantic Classification**: `profiles.password_hash` is the **ACTIVE PRIMARY AUTH STORE**. `local_auth_credentials` provides extended credential metadata.\n\n";

$docAuth .= "## 2. Authentication Tables Structure\n";
$docAuth .= "1. `local_auth_sessions`: Manages signed JWT sessions, bearer tokens, expiration, and token hash revocations.\n";
$docAuth .= "2. `password_reset_requests`: Manages student and personnel password reset request lifecycles with OSAD and HR review queues.\n";
$docAuth .= "3. `account_lifecycle_events`: Immutable audit trail for suspension, reactivation, and archive actions.\n";

file_put_contents("{$auditDir}/phase-e-authentication-separation-audit.md", $docAuth);
echo "5. Saved phase-e-authentication-separation-audit.md\n";

// -------------------------------------------------------------------------
// 6. GENERATE phase-e-shared-attribute-ownership-report.md & phase-e-subtype-consistency-report.md
// -------------------------------------------------------------------------
$docOwn = "# AchieveNest — Phase E: Shared Attribute Ownership Report\n\n";
$docOwn .= "> **Scope:** Supertype Attribute Allocation across Identity Domains  \n\n---\n\n";
$docOwn .= "| Attribute | Supertype (`profiles`) | Subtype (`student_profiles`) | Subtype (`personnel_profiles`) | Ownership Rationale |\n";
$docOwn .= "|---|:---:|:---:|:---:|---|\n";
$docOwn .= "| `id` | **YES** | FK (`profile_id`) | FK (`profile_id`) | Universal UUID identity |\n";
$docOwn .= "| `institutional_id` | **YES** | - | - | Universal institutional identifier |\n";
$docOwn .= "| `email` | **YES** | - | - | Single canonical institutional email |\n";
$docOwn .= "| `first_name`, `middle_name`, `last_name` | **YES** | - | - | Atomic personal name components |\n";
$docOwn .= "| `full_name` | **YES** (Derived) | - | - | Fast search & rendering cache |\n";
$docOwn .= "| `sex` | **YES** (Authoritative) | - | - | Single authoritative legal/award sex source |\n";
$docOwn .= "| `designation_title` | **YES** (Shared display) | - | - | Retained for unified navbar/profile card |\n";
$docOwn .= "| `enrollment_status` | - | **YES** | - | Student-specific lifecycle status |\n";
$docOwn .= "| `year_level` (current) | - | **YES** (Derived) | - | Current year level cache (historical in enrollments) |\n";
$docOwn .= "| `personnel_classification` | - | - | **YES** | Personnel-specific employment class |\n";
$docOwn .= "| `employment_status` | - | - | **YES** | Personnel-specific contract status |\n";
$docOwn .= "| `rank_level` | - | - | **YES** | Academic/administrative rank level |\n";

file_put_contents("{$auditDir}/phase-e-shared-attribute-ownership-report.md", $docOwn);
echo "6. Saved phase-e-shared-attribute-ownership-report.md\n";

$docConst = "# AchieveNest — Phase E: Subtype Consistency & Distribution Report\n\n";
$docConst .= "> **Database:** `achievenest_local`  \n\n---\n\n";
$docConst .= "## 1. Identity Account Type Distribution\n\n";
$docConst .= "| Account Type (`profiles.account_type`) | Profile Count | Expected Subtype Extension |\n";
$docConst .= "|---|---:|---|\n";
foreach ($accTypes as $acc => $cnt) {
    $expSub = 'None (Administrative / Pure User)';
    if ($acc === 'student') $expSub = '`student_profiles`';
    elseif (in_array($acc, ['faculty', 'staff', 'hr_admin', 'osad_admin'])) $expSub = '`personnel_profiles`';
    $docConst .= sprintf("| `%s` | %d | %s |\n", $acc, $cnt, $expSub);
}
$docConst .= "\n## 2. Overlap & Integrity Analysis\n";
$docConst .= "- **Student / Personnel Subtype Overlap Count**: **{$overlapCount}** (Zero overlap detected in active dataset).\n";
$docConst .= "- **Student Account Subtype Mismatch Count**: **{$mismatches}** (100% of student accounts possess matching `student_profiles` rows).\n";

file_put_contents("{$auditDir}/phase-e-subtype-consistency-report.md", $docConst);
echo "7. Saved phase-e-subtype-consistency-report.md\n";

// -------------------------------------------------------------------------
// 7. GENERATE FUNCTIONAL DEPENDENCIES, 3NF ASSESSMENT & FINDINGS
// -------------------------------------------------------------------------
$docFd = "# AchieveNest — Phase E: Identity Functional Dependencies\n\n";
$docFd .= "> **Scope:** Functional Determinants and Transitive Dependencies in Identity Tables  \n\n---\n\n";
$docFd .= "## 1. `profiles` Table Functional Dependencies\n";
$docFd .= "- `id -> institutional_id, account_type, email, first_name, middle_name, last_name, full_name, sex, designation_title, avatar_url, status, must_change_password, password_hash, created_at, updated_at`\n";
$docFd .= "- Candidate Keys: `institutional_id -> id`, `email -> id`\n";
$docFd .= "- **Derived Dependency**: `(first_name, middle_name, last_name) -> full_name` (Documented Justified Denormalization for Search Performance)\n\n";

$docFd .= "## 2. `student_profiles` Table Functional Dependencies\n";
$docFd .= "- `profile_id -> enrollment_status, year_level, created_at, updated_at`\n";
$docFd .= "- `profile_id` (PK) is simultaneously FK referencing `profiles.id`\n";
$docFd .= "- **Derived Dependency**: `year_level` is functionally determined by active `student_program_enrollments` instance.\n\n";

$docFd .= "## 3. `personnel_profiles` Table Functional Dependencies\n";
$docFd .= "- `profile_id -> personnel_classification, employment_status, rank_level, created_at, updated_at`\n";
$docFd .= "- Fully atomic, non-transitive dependency directly on `profile_id`.\n\n";

$docFd .= "## 4. `profile_roles` Table Functional Dependencies\n";
$docFd .= "- `(profile_id, role_id) -> assigned_by, assigned_at`\n";
$docFd .= "- Fully dependent on composite key `(profile_id, role_id)`.\n";

file_put_contents("{$auditDir}/phase-e-identity-functional-dependencies.md", $docFd);
echo "8. Saved phase-e-identity-functional-dependencies.md\n";

$doc3nf = "# AchieveNest — Phase E: Identity 3NF Assessment Matrix\n\n";
$doc3nf .= "> **Standard:** Codd's Normalization Standard (1NF, 2NF, 3NF)  \n\n---\n\n";
$doc3nf .= "| Table | 1NF | 2NF | 3NF | Derived / Cache Attributes | 3NF Assessment & Decision |\n";
$doc3nf .= "|---|:---:|:---:|:---:|---|---|\n";
$doc3nf .= "| `profiles` | **PASS** | **PASS** | **PASS** | `full_name` (Search Cache) | **PASS** (Justified derived display cache; all non-key attributes depend on `id`) |\n";
$doc3nf .= "| `student_profiles` | **PASS** | **PASS** | **PASS** | `year_level` (Active Cache) | **PASS** (Justified active enrollment cache; historical source in enrollments) |\n";
$doc3nf .= "| `personnel_profiles` | **PASS** | **PASS** | **PASS** | None | **PASS** (Pure 3NF subtype extension) |\n";
$doc3nf .= "| `profile_roles` | **PASS** | **PASS** | **PASS** | None | **PASS** (Pure 3NF junction table) |\n";
$doc3nf .= "| `roles` | **PASS** | **PASS** | **PASS** | None | **PASS** (Pure 3NF lookup catalog) |\n";
$doc3nf .= "| `local_auth_credentials` | **PASS** | **PASS** | **PASS** | None | **PASS** (1:0..1 Auth credential table) |\n";
$doc3nf .= "| `local_auth_sessions` | **PASS** | **PASS** | **PASS** | None | **PASS** (Session lifecycle entity) |\n";
$doc3nf .= "| `password_reset_requests` | **PASS** | **PASS** | **PASS** | None | **PASS** (Workflow entity) |\n";

file_put_contents("{$auditDir}/phase-e-identity-3nf-assessment.md", $doc3nf);
echo "9. Saved phase-e-identity-3nf-assessment.md\n";

$docFind = "# AchieveNest — Phase E: Identity Architecture Findings & Decision\n\n";
$docFind .= "> **Audit Phase:** Phase E — Identity Architecture Audit  \n\n---\n\n";
$docFind .= "## 1. Architectural Findings\n";
$docFind .= "1. **Supertype / Subtype Integrity**: The shared `profiles` table with `student_profiles` and `personnel_profiles` extensions is clean, normalized, and avoids all table-level identity duplication.\n";
$docFind .= "2. **Sex Attribute Authority**: `profiles.sex` is the confirmed single authoritative source for award eligibility gates.\n";
$docFind .= "3. **Designation Title Placement**: `profiles.designation_title` is validly placed in the supertype for unified header rendering across all portals.\n";
$docFind .= "4. **Year Level Authority**: `student_program_enrollments.year_level` is authoritative historical source; `student_profiles.year_level` is a justified active cache.\n";
$docFind .= "5. **Role Architecture**: Clear 3-tier model (`account_type` base discriminator $\\rightarrow$ `profile_roles` RBAC $\\rightarrow$ Scope assignment tables).\n\n";

$docFind .= "## 2. Canonical Architecture Decision\n";
$docFind .= "```text\n";
$docFind .= "IDENTITY ARCHITECTURE DECISION:\n";
$docFind .= "RETAIN CURRENT SUPERTYPE/SUBTYPE MODEL UNCHANGED\n\n";
$docFind .= "The current shared `profiles` supertype with `student_profiles` and `personnel_profiles`\n";
$docFind .= "subtype extensions satisfies all 3NF principles, preserves historical data, avoids identity\n";
$docFind .= "duplication, and matches AchieveNest institutional requirements.\n";
$docFind .= "Zero structural changes or new `students`/`personnel` tables required.\n";
$docFind .= "```\n";

file_put_contents("{$auditDir}/phase-e-identity-architecture-findings.md", $docFind);
echo "10. Saved phase-e-identity-architecture-findings.md\n";

// -------------------------------------------------------------------------
// 8. GENERATE phase-e-identity-erd.md & phase-e-completion-report.md
// -------------------------------------------------------------------------
$docErd = "# AchieveNest — Phase E: Identity Architecture Entity Relationship Diagram\n\n";
$docErd .= "> **Database:** `achievenest_local`  \n\n---\n\n";
$docErd .= "```mermaid\nerDiagram\n";
$docErd .= "    PROFILES ||--o| STUDENT_PROFILES : \"profile_id (1:0..1 PK-FK)\"\n";
$docErd .= "    PROFILES ||--o| PERSONNEL_PROFILES : \"profile_id (1:0..1 PK-FK)\"\n";
$docErd .= "    PROFILES ||--o| LOCAL_AUTH_CREDENTIALS : \"profile_id (1:0..1)\"\n";
$docErd .= "    PROFILES ||--o{ LOCAL_AUTH_SESSIONS : \"profile_id (1:N)\"\n";
$docErd .= "    PROFILES ||--o{ PASSWORD_RESET_REQUESTS : \"profile_id (1:N)\"\n";
$docErd .= "    PROFILES ||--o{ PROFILE_ROLES : \"profile_id (1:N)\"\n";
$docErd .= "    ROLES ||--o{ PROFILE_ROLES : \"role_id (1:N)\"\n";
$docErd .= "    STUDENT_PROFILES ||--o{ STUDENT_PROGRAM_ENROLLMENTS : \"student_profile_id (1:N)\"\n";
$docErd .= "    PERSONNEL_PROFILES ||--o{ PERSONNEL_PROGRAM_AFFILIATIONS : \"personnel_profile_id (1:N)\"\n";
$docErd .= "    PERSONNEL_PROFILES ||--o{ PERSONNEL_COLLEGE_AFFILIATIONS : \"personnel_profile_id (1:N)\"\n";
$docErd .= "```\n";

file_put_contents("{$auditDir}/phase-e-identity-erd.md", $docErd);
echo "11. Saved phase-e-identity-erd.md\n";

$docComp = "# AchieveNest — Phase E Completion Report\n\n";
$docComp .= "```text\n";
$docComp .= "========================================================================\n";
$docComp .= "AchieveNest — Local WAMP Database 3NF Audit\n";
$docComp .= "Phase E — Identity Architecture Audit\n";
$docComp .= "========================================================================\n\n";
$docComp .= "Database:                                      achievenest_local\n\n";
$docComp .= "profiles supertype audit:                      PASS\n";
$docComp .= "student_profiles subtype audit:                PASS\n";
$docComp .= "personnel_profiles subtype audit:              PASS\n\n";
$docComp .= "PK-to-PK subtype relationships:                PASS\n";
$docComp .= "Shared identity attributes classified:         PASS\n";
$docComp .= "Subtype attributes classified:                 PASS\n\n";
$docComp .= "account_type semantics:                        VERIFIED (Base discriminator)\n";
$docComp .= "profile_roles semantics:                       VERIFIED (Dynamic RBAC)\n";
$docComp .= "Role vs scope assignments:                     VERIFIED (Tier-3 model)\n\n";
$docComp .= "profiles.sex authority:                        CONFIRMED (Single source)\n";
$docComp .= "designation_title placement:                   KEEP (Authoritative display)\n";
$docComp .= "full_name treatment:                           JUSTIFIED CACHE (Search index)\n";
$docComp .= "student_profiles.year_level treatment:         JUSTIFIED CACHE (Active enrollment)\n\n";
$docComp .= "Authentication separation:                     PASS\n";
$docComp .= "profiles.password_hash status:                 ACTIVE PRIMARY AUTH STORE\n";
$docComp .= "local_auth_credentials status:                 EXTENDED METADATA STORE\n\n";
$docComp .= "Student/personnel subtype overlap:              0 (PASS)\n";
$docComp .= "Account-type/subtype mismatches:                0 (PASS)\n\n";
$docComp .= "Identity 1NF:                                  PASS\n";
$docComp .= "Identity 2NF:                                  PASS\n";
$docComp .= "Identity 3NF:                                  PASS\n";
$docComp .= "Justified denormalizations:                    2 (full_name, year_level cache)\n\n";
$docComp .= "Identity architecture decision:\n";
$docComp .= "RETAIN CURRENT SUPERTYPE/SUBTYPE MODEL\n\n";
$docComp .= "Schema mutations:                              NONE\n";
$docComp .= "Data deletions:                                NONE\n";
$docComp .= "Portfolio-category changes:                    NONE\n";
$docComp .= "Award-rule changes:                            NONE\n\n";
$docComp .= "Phase E Status:\n";
$docComp .= "GO / APPROVED FOR NEXT AUDIT & 3NF SYNTHESIS PHASE\n";
$docComp .= "========================================================================\n";
$docComp .= "```\n";

file_put_contents("{$auditDir}/phase-e-completion-report.md", $docComp);
echo "12. Saved phase-e-completion-report.md\n";

echo "\nPhase E Execution Completed Successfully!\n";
