# ==============================================================================
# AchieveNest — Phase 16 Master Frontend Regression Gate Runner
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "========================================================================" -ForegroundColor Yellow
Write-Host "AchieveNest — Phase 16 Master Frontend Regression Gate" -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Yellow

function Run-Step($name, $cmd) {
    Write-Host "`n>>> Running: $name" -ForegroundColor Cyan
    Invoke-Expression $cmd
    $stepExitCode = if ($null -eq $LASTEXITCODE) { 0 } else { $LASTEXITCODE }
    if ($stepExitCode -ne 0) {
        Write-Host "`nFAILED: $name exited with code $stepExitCode" -ForegroundColor Red
        exit $stepExitCode
    }
    Write-Host "PASSED: $name" -ForegroundColor Green
}

Run-Step "Frozen terminology audit" "& ./scripts/phase16-terminology-audit.ps1"

# 1. Run Vitest Suite (Unit, Component, and Local Defense Auth)
Run-Step "Vitest Suite" "npm test"

# 2. Run Oxlint Linter
Run-Step "Frontend Linter (0 errors)" "npm run lint"

# 3. Production Vite Bundle Build
Run-Step "Production Build (Vite/Rollup)" "npm run build"

Write-Host "`n========================================================================" -ForegroundColor Green
Write-Host "AUTOMATED PHASE 16 FRONTEND GATES PASSED" -ForegroundColor Green
Write-Host "Manual browser matrix: ../docs/Phase_16_Frontend_Regression_Matrix.md" -ForegroundColor Yellow
Write-Host "Phase 16 remains IN PROGRESS until all required browser rows pass." -ForegroundColor Yellow
Write-Host "========================================================================" -ForegroundColor Green
