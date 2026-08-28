$ErrorActionPreference = 'Stop'

$sourceRoot = Join-Path $PSScriptRoot '..\src'
$activeRoots = @(
    (Join-Path $sourceRoot 'pages'),
    (Join-Path $sourceRoot 'components'),
    (Join-Path $sourceRoot 'config')
)

$departmentSecretaryHits = Get-ChildItem $activeRoots -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\__tests__\\|\\department-secretary\\' } |
    Select-String -Pattern 'Department Secretary|department_secretary'

$potentialAwardRoots = @(
    (Join-Path $sourceRoot 'pages\osad-admin'),
    (Join-Path $sourceRoot 'pages\student'),
    (Join-Path $sourceRoot 'components\osad')
)

$potentialAwardUiHits = Get-ChildItem $potentialAwardRoots -Recurse -File |
    Where-Object { $_.FullName -notmatch '\\__tests__\\|\\department-secretary\\' } |
    Select-String -Pattern '(?i)>[^<]*(winner|final awardee|interview score|final score)[^<]*<'

Write-Host 'Phase 16 terminology audit'
Write-Host "Department Secretary active-source hits: $($departmentSecretaryHits.Count)"
Write-Host "Prohibited Potential Award visible-text hits: $($potentialAwardUiHits.Count)"

if ($departmentSecretaryHits.Count -gt 0) {
    $departmentSecretaryHits | ForEach-Object { Write-Host $_ }
}
if ($potentialAwardUiHits.Count -gt 0) {
    $potentialAwardUiHits | ForEach-Object { Write-Host $_ }
}

if ($departmentSecretaryHits.Count -gt 0 -or $potentialAwardUiHits.Count -gt 0) {
    exit 1
}

Write-Host 'Terminology audit passed.' -ForegroundColor Green
