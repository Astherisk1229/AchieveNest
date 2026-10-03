# ==============================================================================
# AchieveNest — Phase 15 Master Local Backend Regression Gate Runner
# ==============================================================================
$ErrorActionPreference = "Stop"
$php = "C:\wamp64\bin\php\php8.3.28\php.exe"

Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host "AchieveNest — Phase 15 Master Backend Regression Gate" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Yellow

function Run-Step($name, $cmd) {
    Write-Host "`n>>> Running: $name" -ForegroundColor Cyan
    Invoke-Expression $cmd
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`nFAILED: $name exited with code $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "PASSED: $name" -ForegroundColor Green
}

# 1. Reset Demo Environment
Run-Step "Deterministic Baseline Reset" "& '$php' spark demo:reset"

# 2. Sequential Regression Suites
Run-Step "Phase 7 Local Auth Suite" "& '$php' spark test:phase7-auth"
Run-Step "Phase 8 Authorization Suite" "& '$php' spark test:phase8-authz"
Run-Step "Phase 9 Storage Suite" "& '$php' spark test:phase9-storage"
Run-Step "Phase 11 Permanent Reference Suite" "& '$php' spark test:phase11-reference"
Run-Step "Phase 12 Demo Personas & Scenarios" "& '$php' spark test:phase12-demo"
Run-Step "Phase 13 Step 4 Portfolio E2E" "& '$php' spark test:phase13-step4"
Run-Step "Phase 14 Award Evaluation Engine" "& '$php' spark test:phase14-awards"
Run-Step "Phase 14 Remaining Workflows" "& '$php' spark test:phase14-workflows"

# 3. Master Spark Suite
Run-Step "Master Phase 15 Backend Aggregator" "& '$php' spark test:phase15-backend"

# 4. Local Defense PHPUnit Suite
Run-Step "Local Defense PHPUnit Suite" "& '$php' vendor/bin/phpunit -c phpunit.local-defense.xml"

# 5. Route Consistency
Run-Step "Backend Routes Consistency" "& '$php' spark routes"

Write-Host "`n========================================================================" -ForegroundColor Green
Write-Host "ALL PHASE 15 BACKEND REGRESSIONS PASSED (0 FAILURES, 0 ERRORS)" -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
