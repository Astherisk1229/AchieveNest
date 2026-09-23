[CmdletBinding()]
param([string]$RepositoryRoot = (Split-Path -Parent $PSScriptRoot))

$ErrorActionPreference = 'Stop'
$routeFile = Join-Path $RepositoryRoot 'backend/app/Config/Routes.php'
$controllerDir = Join-Path $RepositoryRoot 'backend/app/Controllers/Api'
$serviceDir = Join-Path $RepositoryRoot 'backend/app/Services'
$outputFile = Join-Path $RepositoryRoot 'BACKEND_API_DATABASE_MAP.csv'

$rows = [System.Collections.Generic.List[object]]::new()
$seen = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
foreach ($line in Get-Content $routeFile) {
    if ($line -match "\`$routes->(get|post|put|patch|delete)\('([^']+)',\s*'([^']+)'") {
        $method = $matches[1].ToUpperInvariant()
        $relative = $matches[2]
        $action = $matches[3]
        $route = if ($relative -eq '/') { '/' } else { '/api/v1/' + $relative }
        $key = "$method $route"
        if (-not $seen.Add($key)) { continue }

        $controllerSpec = ($action -split '/')[0]
        $controllerClass = (($controllerSpec -split '::')[0] -split '\\')[-1]
        $controllerPath = Join-Path $controllerDir ($controllerClass + '.php')
        $sourceText = if (Test-Path $controllerPath) { Get-Content -Raw $controllerPath } else { '' }

        $services = [regex]::Matches($sourceText, '\b([A-Z][A-Za-z0-9]+Service)\b') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique
        $combined = $sourceText
        foreach ($service in $services) {
            $servicePath = Join-Path $serviceDir ($service + '.php')
            if (Test-Path $servicePath) { $combined += "`n" + (Get-Content -Raw $servicePath) }
        }
        $tables = [regex]::Matches($combined, '(?:table|join|tableExists|fieldExists)\(\s*[''"](?:public\.)?([a-z][a-z0-9_]+)') | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

        $rows.Add([pscustomobject]@{
            route = $route
            http_method = $method
            controller_action = $action
            controller_file = if (Test-Path $controllerPath) { 'backend/app/Controllers/Api/' + $controllerClass + '.php' } else { 'backend/app/Controllers/Home.php' }
            service_files = ($services -join ';')
            tables = ($tables -join ';')
            access = if ($method -eq 'GET') { 'READ' } else { 'WRITE_OR_ACTION' }
            auth_scope = 'Controller/filter enforced; inspect mapped action'
        })
    }
}

$rows | Export-Csv -LiteralPath $outputFile -NoTypeInformation -Encoding utf8
Write-Output "Generated $($rows.Count) unique route/method rows at $outputFile"
