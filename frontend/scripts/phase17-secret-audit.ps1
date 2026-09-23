# phase17-secret-audit.ps1
# Static secret audit for AchieveNest.
# Scans tracked code and documentation to prevent hardcoded credentials,
# default fallbacks, and compromised historical password hashes.

param(
    [string]$TargetDir = (Resolve-Path "$PSScriptRoot\..\..").Path
)

Write-Host "=== Phase 17 Static Secret Audit ===" -ForegroundColor Cyan
Write-Host "Target Root: $TargetDir"

$COMPROMISED_HASH = "b003a407ac2ec86fa2f156d1f37594118010f8e4e35ffe060ff44897ec5b0f90"
$sha256 = [System.Security.Cryptography.SHA256]::Create()

$scanDirs = @(
    (Join-Path $TargetDir "frontend\src"),
    (Join-Path $TargetDir "frontend\scripts"),
    (Join-Path $TargetDir "backend\app"),
    (Join-Path $TargetDir "backend\tests"),
    (Join-Path $TargetDir "docs")
)

$fileExtensions = @("*.js", "*.jsx", "*.ts", "*.tsx", "*.php", "*.md", "*.json", "*.html", "*.ps1")

$filesToScan = @()
foreach ($dir in $scanDirs) {
    if (Test-Path $dir) {
        foreach ($ext in $fileExtensions) {
            $filesToScan += Get-ChildItem -Path $dir -Filter $ext -Recurse -File | Where-Object {
                $_.FullName -notmatch "node_modules" -and
                $_.FullName -notmatch "dist" -and
                $_.FullName -notmatch "vendor" -and
                $_.FullName -notmatch "scratch" -and
                $_.FullName -notmatch "\.git" -and
                $_.Name -notmatch "phase17-secret-audit\.ps1"
            }
        }
    }
}

Write-Host "Scanning $($filesToScan.Count) files across frontend, backend, and documentation..."

$violations = @()

# 1. Pattern checks for forbidden password assignments and fallbacks
$forbiddenPatterns = @(
    @{ Pattern = "DEMO_PASSWORD\s*=\s*['`"][^'`"]+['`"]"; Description = "Hardcoded DEMO_PASSWORD assignment" },
    @{ Pattern = "ACHIEVENEST_DEMO_PASSWORD\s*\?\?\s*['`"][^'`"]+['`"]"; Description = "Fallback literal for ACHIEVENEST_DEMO_PASSWORD (??" },
    @{ Pattern = "ACHIEVENEST_DEMO_PASSWORD\s*\|\|\s*['`"][^'`"]+['`"]"; Description = "Fallback literal for ACHIEVENEST_DEMO_PASSWORD (||" },
    @{ Pattern = "process\.env\.ACHIEVENEST_DEMO_PASSWORD\s*\|\|"; Description = "Inline default fallback for process.env.ACHIEVENEST_DEMO_PASSWORD" }
)

foreach ($file in $filesToScan) {
    $lines = Get-Content -Path $file.FullName
    $lineNum = 0
    foreach ($line in $lines) {
        $lineNum++
        
        # Check patterns
        foreach ($rule in $forbiddenPatterns) {
            if ($line -match $rule.Pattern) {
                $violations += [PSCustomObject]@{
                    File = $file.FullName.Replace($TargetDir, "").TrimStart("\/")
                    Line = $lineNum
                    Rule = $rule.Description
                }
            }
        }

        # Check compromised hash on all quoted substrings
        $matches = [regex]::Matches($line, "['`"]([^'`"]{8,64})['`"]")
        foreach ($match in $matches) {
            $candidateStr = $match.Groups[1].Value
            $candidateBytes = [System.Text.Encoding]::UTF8.GetBytes($candidateStr)
            $candidateHash = [System.BitConverter]::ToString($sha256.ComputeHash($candidateBytes)).Replace("-", "").ToLower()
            if ($candidateHash -eq $COMPROMISED_HASH) {
                $violations += [PSCustomObject]@{
                    File = $file.FullName.Replace($TargetDir, "").TrimStart("\/")
                    Line = $lineNum
                    Rule = "Compromised historical credential detected"
                }
            }
        }
    }
}

if ($violations.Count -gt 0) {
    Write-Host "`n[ERROR] Secret Audit FAILED: $($violations.Count) violation(s) detected:" -ForegroundColor Red
    $violations | Format-Table -AutoSize
    exit 1
}

Write-Host "[PASS] Secret Audit PASSED: 0 hardcoded credentials, 0 fallbacks, and 0 compromised hashes found." -ForegroundColor Green
exit 0
