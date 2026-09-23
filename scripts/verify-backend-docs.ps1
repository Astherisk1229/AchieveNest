[CmdletBinding()]
param([string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
$backend = Join-Path $RepositoryRoot 'backend'
$docs = @(
    'BACKEND_SQL_AND_DATABASE_INDEX.md',
    'BACKEND_FOLDER_ARCHITECTURE_MAP.md',
    'BACKEND_PERSONNEL_EVALUATION_DATABASE_MAP.md',
    'BACKEND_SCHEMA_DRIFT_AND_RISK_REPORT.md',
    'BACKEND_TABLE_CATALOG.csv',
    'BACKEND_API_DATABASE_MAP.csv',
    'docs/implementation/AchieveNest_Backend_SQL_and_Database_Discovery_Audit_Report.md'
)

$expected = [ordered]@{
    migrations = 64
    seeders = 5
    services = 66
    controllers = 27
    rawSql = 72
    writableSql = 7
}
$actual = [ordered]@{
    migrations = @(Get-ChildItem (Join-Path $backend 'app/Database/Migrations') -File -Filter *.php).Count
    seeders = @(Get-ChildItem (Join-Path $backend 'app/Database/Seeds') -File -Filter *.php).Count
    services = @(Get-ChildItem (Join-Path $backend 'app/Services') -File -Filter *.php).Count
    controllers = @(Get-ChildItem (Join-Path $backend 'app/Controllers/Api') -File -Filter *.php).Count
    rawSql = @(Get-ChildItem $backend -Recurse -File -Filter *.sql).Count
    writableSql = @(Get-ChildItem (Join-Path $backend 'writable/backups') -Recurse -File -Filter *.sql).Count
}

$failures = [System.Collections.Generic.List[string]]::new()
foreach ($key in $expected.Keys) {
    if ($actual[$key] -ne $expected[$key]) { $failures.Add("$key expected $($expected[$key]), found $($actual[$key])") }
}
foreach ($doc in $docs) {
    if (-not (Test-Path (Join-Path $RepositoryRoot $doc))) { $failures.Add("missing documentation file: $doc") }
}

$migrationText = (Get-ChildItem (Join-Path $backend 'app/Database/Migrations') -File -Filter *.php | Get-Content -Raw) -join "`n"
$runtimeText = ((Get-ChildItem (Join-Path $backend 'app/Services') -File -Filter *.php) + (Get-ChildItem (Join-Path $backend 'app/Controllers/Api') -File -Filter *.php) | Get-Content -Raw) -join "`n"
$requiredTables = @('profiles','personnel_profiles','colleges','administrative_units','faculty_rank_catalog','faculty_rank_transitions','personnel_qualifications','personnel_annual_reviews','evaluation_scales','evaluation_scale_areas','evaluation_scale_criteria','personnel_accomplishments','personnel_evaluations','personnel_evaluation_items')
foreach ($table in $requiredTables) {
    if ($migrationText -notmatch [regex]::Escape($table)) { $failures.Add("major table lacks migration evidence: $table") }
}

$routesText = Get-Content -Raw (Join-Path $backend 'app/Config/Routes.php')
$personnelMap = Get-Content -Raw (Join-Path $RepositoryRoot 'BACKEND_PERSONNEL_EVALUATION_DATABASE_MAP.md')
$documentedRoutes = [regex]::Matches($personnelMap, '/api/v1/[A-Za-z0-9_/:()\-]+') | ForEach-Object Value | Sort-Object -Unique
foreach ($route in $documentedRoutes) {
    $relative = $route -replace '^/api/v1/', '' -replace ':segment', ':segment'
    if ($routesText -notmatch [regex]::Escape($relative)) { $failures.Add("documented route not found: $route") }
}

$catalog = Import-Csv (Join-Path $RepositoryRoot 'BACKEND_TABLE_CATALOG.csv')
$duplicates = $catalog | Group-Object table_name | Where-Object Count -gt 1
foreach ($duplicate in $duplicates) { $failures.Add("duplicate catalog table: $($duplicate.Name)") }
foreach ($row in $catalog) {
    if ($migrationText -notmatch [regex]::Escape($row.table_name)) { $failures.Add("catalog table lacks migration evidence: $($row.table_name)") }
    $migrationPath = Join-Path $backend ('app/Database/Migrations/' + $row.created_by_migration)
    if (-not (Test-Path $migrationPath)) { $failures.Add("catalog migration path missing: $($row.created_by_migration)") }
}

$api = Import-Csv (Join-Path $RepositoryRoot 'BACKEND_API_DATABASE_MAP.csv')
$routeDuplicates = $api | Group-Object route,http_method | Where-Object Count -gt 1
foreach ($duplicate in $routeDuplicates) { $failures.Add("duplicate API route/method: $($duplicate.Name)") }
foreach ($row in $api) {
    if ($row.controller_file -and -not (Test-Path (Join-Path $RepositoryRoot $row.controller_file))) { $failures.Add("API controller path missing: $($row.controller_file)") }
}

$hierarchy = 'Actual repository contents','Current runtime configuration','CodeIgniter migrations','Current route/controller/service implementation','Generated documentation','Historical SQL backups'
$indexText = Get-Content -Raw (Join-Path $RepositoryRoot 'BACKEND_SQL_AND_DATABASE_INDEX.md')
foreach ($item in $hierarchy) { if ($indexText -notmatch [regex]::Escape($item)) { $failures.Add("source-of-truth hierarchy item missing: $item") } }

Write-Output 'Focused backend documentation check'
foreach ($key in $actual.Keys) { Write-Output ("{0}: {1}" -f $key, $actual[$key]) }
if ($failures.Count -gt 0) {
    $failures | ForEach-Object { Write-Output "FAIL: $_" }
    exit 1
}
Write-Output 'PASS: counts, paths, tables, routes, duplicates, and hierarchy checks passed.'
