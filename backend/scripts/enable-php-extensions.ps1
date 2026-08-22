$ErrorActionPreference = 'Stop'

$phpIniPath = 'C:\Program Files\php\php.ini'
$backupPath = 'C:\Program Files\php\php.ini.phase1-backup'
$requiredExtensions = @(
    'intl',
    'pgsql',
    'pdo_pgsql',
    'sqlite3',
    'pdo_sqlite'
)

$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent()
$principal = [Security.Principal.WindowsPrincipal]::new($currentIdentity)
$isAdministrator = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdministrator) {
    throw 'Run PowerShell as Administrator, then execute this script again.'
}

if (-not (Test-Path -LiteralPath $phpIniPath)) {
    throw "PHP configuration not found at $phpIniPath"
}

if (-not (Test-Path -LiteralPath $backupPath)) {
    Copy-Item -LiteralPath $phpIniPath -Destination $backupPath
}

$phpIniContent = Get-Content -LiteralPath $phpIniPath -Raw

foreach ($extensionName in $requiredExtensions) {
    $pattern = "(?m)^\s*;\s*extension\s*=\s*$extensionName\s*$"
    $phpIniContent = $phpIniContent -replace $pattern, "extension=$extensionName"
}

Set-Content -LiteralPath $phpIniPath -Value $phpIniContent -Encoding UTF8

$loadedExtensions = & php -m
$missingExtensions = $requiredExtensions | Where-Object { $_ -notin $loadedExtensions }

if ($missingExtensions.Count -gt 0) {
    throw "These extensions are still missing: $($missingExtensions -join ', ')"
}

Write-Host 'All required PHP extensions are enabled and verified.' -ForegroundColor Green
Write-Host "Backup: $backupPath"
