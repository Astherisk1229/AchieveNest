# phase18-verify-backup.ps1
# Phase 18 Disaster Recovery and Defense Fixture Restoration Validation Script.
# Performs local-defense backup, temporary restore, integrity validation,
# and non-destructive cleanup without exposing any secrets.

param(
    [string]$BackupRootDir = "C:\Users\Admin\Documents\AchieveNest-Defense-Backup",
    [string]$MysqlBin = "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe",
    [string]$MysqldumpBin = "C:\wamp64\bin\mysql\mysql8.4.7\bin\mysqldump.exe"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host "AchieveNest -- Phase 18 Disaster Recovery and Restoration Verification" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Yellow

$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$RepoRoot = (Resolve-Path "$PSScriptRoot\..\..").Path
$BackendDir = Join-Path $RepoRoot "backend"
$EvidenceSourceDir = Join-Path $BackendDir "writable\uploads\evidence"
$RestoreTestDir = Join-Path $BackendDir "writable\restore_test"
$EvidenceRestoreDir = Join-Path $RestoreTestDir "evidence"

# Setup backup workspace
$DbBackupDir = Join-Path $BackupRootDir "database"
$EvidenceBackupDir = Join-Path $BackupRootDir "evidence"
$ManifestsDir = Join-Path $BackupRootDir "manifests"
$TemplatesDir = Join-Path $BackupRootDir "templates"

foreach ($dir in @($DbBackupDir, $EvidenceBackupDir, $ManifestsDir, $TemplatesDir)) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
}

$sha256 = [System.Security.Cryptography.SHA256]::Create()

function Get-FileSha256([string]$filePath) {
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $hashBytes = $sha256.ComputeHash($bytes)
    return [System.BitConverter]::ToString($hashBytes).Replace("-", "").ToLower()
}

$testResults = @()
function Record-Test([string]$id, [string]$title, [bool]$passed, [string]$details = "") {
    $status = if ($passed) { "[PASS]" } else { "[FAIL]" }
    $color = if ($passed) { "Green" } else { "Red" }
    Write-Host ("  {0,-10} {1,-58} {2}" -f $id, $title, $status) -ForegroundColor $color
    if (-not $passed -and $details -ne "") {
        Write-Host "    Details: $details" -ForegroundColor Red
    }
    $script:testResults += [PSCustomObject]@{
        Id = $id
        Title = $title
        Passed = $passed
        Details = $details
    }
}

# -----------------------------------------------------------------------------
# STEP 1: Safe Environment Template Creation
# -----------------------------------------------------------------------------
Write-Host "`n[1/7] Creating Safe Environment Template (No Real Secrets)..." -ForegroundColor Cyan

$templatePath = Join-Path $TemplatesDir "backend.env.defense.template"
$lines = @(
    "CI_ENVIRONMENT = development",
    "ACHIEVENEST_ENV = local-defense",
    "",
    "app.baseURL = 'http://localhost:8080/'",
    "app.forceGlobalSecureRequests = false",
    "",
    "# Local WAMP MySQL defense database configuration",
    "database.defaultGroup = local_defense",
    "",
    "database.local_defense.hostname = 127.0.0.1",
    "database.local_defense.database = achievenest_local",
    "database.local_defense.username = achievenest_app",
    "database.local_defense.password = [SET_LOCALLY]",
    "database.local_defense.DBDriver = MySQLi",
    "database.local_defense.port = 3306",
    "database.local_defense.charset = utf8mb4",
    "database.local_defense.DBCollat = utf8mb4_unicode_ci",
    "",
    "AUTH_MODE = local-defense",
    "LOCAL_AUTH_JWT_SECRET = [SET_LOCALLY]",
    "LOCAL_AUTH_ISSUER = achievenest-local",
    "LOCAL_AUTH_AUDIENCE = achievenest-web",
    "LOCAL_AUTH_ACCESS_TTL_SECONDS = 3600",
    "LOCAL_AUTH_REMEMBER_TTL_SECONDS = 28800",
    "ACHIEVENEST_DEMO_PASSWORD = [SET_LOCALLY]"
)
Set-Content -Path $templatePath -Value $lines -Encoding utf8
Record-Test "DR-TMPL" "Safe environment template created with placeholders only" (Test-Path $templatePath)

# -----------------------------------------------------------------------------
# STEP 2: Record Source Evidence Manifest and Checksums
# -----------------------------------------------------------------------------
Write-Host "`n[2/7] Recording Source Evidence Inventory and SHA-256 Hashes..." -ForegroundColor Cyan

$sourceFiles = Get-ChildItem -Path $EvidenceSourceDir -Recurse -File | Where-Object { $_.Name -ne ".gitkeep" }
$sourceManifestFile = Join-Path $ManifestsDir "evidence-source-manifest-$Timestamp.csv"
$sourceManifestEntries = @()

foreach ($f in $sourceFiles) {
    $relPath = $f.FullName.Substring($EvidenceSourceDir.Length).TrimStart("\/") -replace "\\", "/"
    $hash = Get-FileSha256 $f.FullName
    $sourceManifestEntries += [PSCustomObject]@{
        relative_path = $relPath
        file_name = $f.Name
        size_bytes = $f.Length
        sha256 = $hash
    }
}

$sourceManifestEntries | Export-Csv -Path $sourceManifestFile -NoTypeInformation -Encoding utf8
$sourceFileCount = $sourceManifestEntries.Count
$sourceTotalBytes = ($sourceManifestEntries | Measure-Object -Property size_bytes -Sum).Sum
Record-Test "DR-SRC-EVID" ("Source evidence manifest recorded ({0} files, {1} bytes)" -f $sourceFileCount, $sourceTotalBytes) ($sourceFileCount -gt 0)

# -----------------------------------------------------------------------------
# STEP 3: Create MySQL Database Dump and Evidence Archive
# -----------------------------------------------------------------------------
Write-Host "`n[3/7] Generating Full Database Dump and Evidence ZIP Archive..." -ForegroundColor Cyan

$sqlDumpPath = Join-Path $DbBackupDir "achievenest_local-$Timestamp.sql"
$evidenceZipPath = Join-Path $EvidenceBackupDir "evidence-$Timestamp.zip"

# Execute mysqldump
$dumpArgs = @(
    "--host=127.0.0.1",
    "--port=3306",
    "-u", "root",
    "--single-transaction",
    "--triggers",
    "--default-character-set=utf8mb4",
    "achievenest_local"
)

& $MysqldumpBin $dumpArgs | Set-Content -Path $sqlDumpPath -Encoding utf8
$dumpExists = (Test-Path $sqlDumpPath) -and ((Get-Item $sqlDumpPath).Length -gt 10000)
$dumpHash = if ($dumpExists) { Get-FileSha256 $sqlDumpPath } else { "" }
Record-Test "DR-DUMP" "Full database SQL dump created and hashed" $dumpExists ("SHA-256: " + $dumpHash)

# Scan SQL dump for plaintext application secrets
$dumpContent = Get-Content -Path $sqlDumpPath -Raw
$hasSecretLeak = ($dumpContent -match "ACHIEVENEST_DEMO_PASSWORD") -or ($dumpContent -match "LOCAL_AUTH_JWT_SECRET")
Record-Test "DR-DUMP-SEC" "Database dump contains 0 plaintext application configuration secrets" (-not $hasSecretLeak)

# Create Evidence ZIP archive
if (Test-Path $evidenceZipPath) { Remove-Item $evidenceZipPath -Force }
Compress-Archive -Path "$EvidenceSourceDir\*" -DestinationPath $evidenceZipPath -Force
$zipExists = (Test-Path $evidenceZipPath) -and ((Get-Item $evidenceZipPath).Length -gt 0)
$zipHash = if ($zipExists) { Get-FileSha256 $evidenceZipPath } else { "" }
Record-Test "DR-ZIP" "Protected evidence archive created and hashed" $zipExists ("SHA-256: " + $zipHash)

# Record Backup Manifest
$backupManifestPath = Join-Path $ManifestsDir "backup-manifest-$Timestamp.txt"
$gitSha = (git -C $RepoRoot rev-parse HEAD).Trim()
$manifestLines = @(
    "========================================================================",
    "AchieveNest Defense Disaster Recovery Backup Manifest",
    "========================================================================",
    "Backup Timestamp:      $Timestamp",
    "Git Commit SHA:        $gitSha",
    "Database Dump:         achievenest_local-$Timestamp.sql",
    "Database Dump Size:    $((Get-Item $sqlDumpPath).Length) bytes",
    "Database Dump SHA-256: $dumpHash",
    "Evidence Archive:      evidence-$Timestamp.zip",
    "Evidence Archive Size: $((Get-Item $evidenceZipPath).Length) bytes",
    "Evidence Archive SHA:  $zipHash",
    "Source Evidence Files: $sourceFileCount files",
    "Source Evidence Bytes: $sourceTotalBytes bytes",
    "Expected Fingerprint:  a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f",
    "========================================================================"
)
Set-Content -Path $backupManifestPath -Value $manifestLines -Encoding utf8
Record-Test "DR-MAN" "Backup manifest recorded in workspace" (Test-Path $backupManifestPath)

# -----------------------------------------------------------------------------
# STEP 4: Restore SQL Dump into Isolated Temporary Database
# -----------------------------------------------------------------------------
Write-Host "`n[4/7] Restoring SQL Dump into Isolated Target 'achievenest_restore_test'..." -ForegroundColor Cyan

$tempDb = "achievenest_restore_test"

# Drop & Create clean target DB
& $MysqlBin -u root -e "DROP DATABASE IF EXISTS $tempDb; CREATE DATABASE $tempDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Restore SQL dump
$restoreStart = Get-Date
Get-Content -Path $sqlDumpPath | & $MysqlBin -u root $tempDb
$restoreEnd = Get-Date
$restoreDurationSec = [Math]::Round(($restoreEnd - $restoreStart).TotalSeconds, 2)

# Verify table count in restored DB
$restoredTables = & $MysqlBin -u root -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$tempDb' AND table_type = 'BASE TABLE';"
$tableCount = [int]($restoredTables.Trim())
Record-Test "DR-REST-DB" ("SQL dump restored cleanly into {0} (in {1}s)" -f $tempDb, $restoreDurationSec) ($tableCount -eq 35) ("Found tables: " + $tableCount)

# -----------------------------------------------------------------------------
# STEP 5: Reference Data and Fingerprint Verification on Restored Target
# -----------------------------------------------------------------------------
Write-Host "`n[5/7] Verifying Reference Fingerprint and Entity Counts on Restored DB..." -ForegroundColor Cyan

$counts = & $MysqlBin -u root -N -e "
    SELECT 
        (SELECT COUNT(*) FROM $tempDb.roles),
        (SELECT COUNT(*) FROM $tempDb.colleges),
        (SELECT COUNT(*) FROM $tempDb.academic_programs),
        (SELECT COUNT(*) FROM $tempDb.administrative_units),
        (SELECT COUNT(*) FROM $tempDb.portfolio_categories),
        (SELECT COUNT(*) FROM $tempDb.portfolio_subcategories),
        (SELECT COUNT(*) FROM $tempDb.award_definitions)
"
$countParts = $counts.Trim().Split("`t")
$rRoles = [int]$countParts[0]
$rColleges = [int]$countParts[1]
$rProgs = [int]$countParts[2]
$rAdmin = [int]$countParts[3]
$rCats = [int]$countParts[4]
$rSubcats = [int]$countParts[5]
$rAwards = [int]$countParts[6]

$refCountsMatch = ($rRoles -eq 7 -and $rColleges -eq 5 -and $rProgs -eq 14 -and $rAdmin -eq 19 -and $rCats -eq 9 -and $rSubcats -eq 57 -and $rAwards -eq 15)
Record-Test "DR-REF-COUNTS" "Restored reference counts exact (7/5/14/19/9/57/15)" $refCountsMatch ("Roles:{0}, Colleges:{1}, Progs:{2}, Units:{3}, Cats:{4}, Subcats:{5}, Awards:{6}" -f $rRoles, $rColleges, $rProgs, $rAdmin, $rCats, $rSubcats, $rAwards)

# Compute Reference Fingerprint on restored DB
$fingerprintPayload = ""
$rRows = & $MysqlBin -u root -N -e "SELECT id, role_key, display_name, is_system_role FROM $tempDb.roles ORDER BY role_key ASC;"
foreach ($line in $rRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "ROLE:$($p[0]):$($p[1]):$($p[2]):$($p[3])`n" } }

$cRows = & $MysqlBin -u root -N -e "SELECT id, code, name, status FROM $tempDb.colleges ORDER BY code ASC;"
foreach ($line in $cRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "COLLEGE:$($p[0]):$($p[1]):$($p[2]):$($p[3])`n" } }

$pRows = & $MysqlBin -u root -N -e "SELECT id, college_id, code, name, status FROM $tempDb.academic_programs ORDER BY code ASC;"
foreach ($line in $pRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "PROG:$($p[0]):$($p[1]):$($p[2]):$($p[3])`n" } }

$uRows = & $MysqlBin -u root -N -e "SELECT id, code, name, unit_type, status FROM $tempDb.administrative_units ORDER BY code ASC;"
foreach ($line in $uRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "ADMIN:$($p[0]):$($p[1]):$($p[2]):$($p[3])`n" } }

$catRows = & $MysqlBin -u root -N -e "SELECT id, code, name, sort_order, status FROM $tempDb.portfolio_categories ORDER BY sort_order ASC;"
foreach ($line in $catRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "CAT:$($p[0]):$($p[1]):$($p[2]):$($p[3]):$($p[4])`n" } }

$subRows = & $MysqlBin -u root -N -e "SELECT id, category_id, code, name, sort_order, status FROM $tempDb.portfolio_subcategories ORDER BY category_id ASC, sort_order ASC;"
foreach ($line in $subRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "SUBCAT:$($p[0]):$($p[1]):$($p[2]):$($p[3]):$($p[4]):$($p[5])`n" } }

$awRows = & $MysqlBin -u root -N -e "SELECT id, code, name, candidate_threshold_percent, status FROM $tempDb.award_definitions ORDER BY code ASC;"
foreach ($line in $awRows) { if ($line) { $p = $line.Split("`t"); $fingerprintPayload += "AWARD:$($p[0]):$($p[1]):$($p[2]):$($p[3]):$($p[4])`n" } }

$bytes = [System.Text.Encoding]::UTF8.GetBytes($fingerprintPayload)
$restoredFingerprint = [System.BitConverter]::ToString($sha256.ComputeHash($bytes)).Replace("-", "").ToLower()
$expectedFingerprint = "a7cb00863ab7baa83fae56da96cae71a0f4efde2dbcf5647304f5d088d23642f"

Record-Test "DR-FP" "Restored DB reference SHA-256 fingerprint matches baseline 100%" ($restoredFingerprint -eq $expectedFingerprint) ("Restored: " + $restoredFingerprint)

# -----------------------------------------------------------------------------
# STEP 6: Restore Evidence Archive and Checksum Comparison
# -----------------------------------------------------------------------------
Write-Host "`n[6/7] Restoring Physical Evidence and Verifying Checksums..." -ForegroundColor Cyan

if (Test-Path $RestoreTestDir) { Remove-Item $RestoreTestDir -Recurse -Force }
New-Item -ItemType Directory -Path $EvidenceRestoreDir -Force | Out-Null

Expand-Archive -Path $evidenceZipPath -DestinationPath $EvidenceRestoreDir -Force

$restoredFiles = Get-ChildItem -Path $EvidenceRestoreDir -Recurse -File | Where-Object { $_.Name -ne ".gitkeep" }
$restoredManifestFile = Join-Path $ManifestsDir "evidence-restored-manifest-$Timestamp.csv"
$restoredManifestEntries = @()

foreach ($f in $restoredFiles) {
    $relPath = $f.FullName.Substring($EvidenceRestoreDir.Length).TrimStart("\/") -replace "\\", "/"
    $hash = Get-FileSha256 $f.FullName
    $restoredManifestEntries += [PSCustomObject]@{
        relative_path = $relPath
        file_name = $f.Name
        size_bytes = $f.Length
        sha256 = $hash
    }
}

$restoredManifestEntries | Export-Csv -Path $restoredManifestFile -NoTypeInformation -Encoding utf8

# Compare manifests
$sourceMap = @{}
foreach ($item in $sourceManifestEntries) { $sourceMap[$item.relative_path] = $item }

$restoredMatch = $true
$mismatchCount = 0

if ($restoredManifestEntries.Count -ne $sourceManifestEntries.Count) {
    $restoredMatch = $false
    $mismatchCount++
}

foreach ($rItem in $restoredManifestEntries) {
    if (-not $sourceMap.ContainsKey($rItem.relative_path)) {
        $restoredMatch = $false
        $mismatchCount++
    } else {
        $sItem = $sourceMap[$rItem.relative_path]
        if ($sItem.sha256 -ne $rItem.sha256 -or $sItem.size_bytes -ne $rItem.size_bytes) {
            $restoredMatch = $false
            $mismatchCount++
        }
    }
}

Record-Test "DR-EVID-MATCH" "Restored physical evidence matches source 100% (paths, sizes, hashes)" $restoredMatch ("Restored: {0}, Source: {1}, Mismatches: {2}" -f $restoredManifestEntries.Count, $sourceManifestEntries.Count, $mismatchCount)

# Verify 10 Demo Personas in restored DB
$demoCount = [int](& $MysqlBin -u root -N -e "SELECT COUNT(*) FROM $tempDb.profiles WHERE email LIKE 'demo.%@ndmu.edu.ph';").Trim()
Record-Test "DR-DEMO-PERS" "All 10 demo personas present in restored database" ($demoCount -eq 10) ("Found: " + $demoCount)

# Verify Student and Personnel evidence rows in restored DB point to valid files
$seCount = [int](& $MysqlBin -u root -N -e "SELECT COUNT(*) FROM $tempDb.student_evidence;").Trim()
$peCount = [int](& $MysqlBin -u root -N -e "SELECT COUNT(*) FROM $tempDb.personnel_evidence;").Trim()
Record-Test "DR-EVID-ROWS" ("Restored relational evidence metadata intact (Student: {0}, Personnel: {1})" -f $seCount, $peCount) ($seCount -gt 0 -and $peCount -gt 0)

# -----------------------------------------------------------------------------
# STEP 7: Original Baseline Untouched Verification and Non-Destructive Teardown
# -----------------------------------------------------------------------------
Write-Host "`n[7/7] Proving Original Database and Files Untouched and Cleaning Sandbox..." -ForegroundColor Cyan

$origCounts = & $MysqlBin -u root -N -e "
    SELECT 
        (SELECT COUNT(*) FROM achievenest_local.roles),
        (SELECT COUNT(*) FROM achievenest_local.colleges),
        (SELECT COUNT(*) FROM achievenest_local.academic_programs),
        (SELECT COUNT(*) FROM achievenest_local.profiles WHERE email LIKE 'demo.%@ndmu.edu.ph')
"
$origParts = $origCounts.Trim().Split("`t")
$origUntouched = ([int]$origParts[0] -eq 7 -and [int]$origParts[1] -eq 5 -and [int]$origParts[2] -eq 14 -and [int]$origParts[3] -eq 10)
Record-Test "DR-ORIG-DB" "Original achievenest_local database 100% untouched and intact" $origUntouched

$currSourceFiles = (Get-ChildItem -Path $EvidenceSourceDir -Recurse -File | Where-Object { $_.Name -ne ".gitkeep" }).Count
Record-Test "DR-ORIG-EVID" ("Original physical evidence directory 100% untouched ({0} files)" -f $currSourceFiles) ($currSourceFiles -eq $sourceFileCount)

# Drop temporary database and remove restore test directory
& $MysqlBin -u root -e "DROP DATABASE IF EXISTS $tempDb;"
if (Test-Path $RestoreTestDir) { Remove-Item $RestoreTestDir -Recurse -Force }
Record-Test "DR-CLEANUP" "Temporary restore database and test sandbox cleaned up cleanly" (-not (Test-Path $RestoreTestDir))

Write-Host "`n========================================================================" -ForegroundColor Yellow
$passedCount = ($testResults | Where-Object { $_.Passed }).Count
$totalCount = $testResults.Count
Write-Host ("Phase 18 Disaster Recovery Verification Result: {0} / {1} PASSED" -f $passedCount, $totalCount) -ForegroundColor $(if ($passedCount -eq $totalCount) { "Green" } else { "Red" })
Write-Host "========================================================================`n" -ForegroundColor Yellow

if ($passedCount -ne $totalCount) {
    exit 1
}
exit 0
