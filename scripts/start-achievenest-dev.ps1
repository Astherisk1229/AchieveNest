$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot 'backend'
$frontendRoot = Join-Path $projectRoot 'frontend'
$viteCommand = Join-Path $frontendRoot 'node_modules\.bin\vite.cmd'

function Resolve-PhpBinary {
    if ($env:ACHIEVENEST_PHP_BINARY -and (Test-Path -LiteralPath $env:ACHIEVENEST_PHP_BINARY)) {
        return $env:ACHIEVENEST_PHP_BINARY
    }

    $wampPhp = Get-ChildItem -LiteralPath 'C:\wamp64\bin\php' -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -like 'php8.4.*' } |
        Sort-Object Name -Descending |
        ForEach-Object { Join-Path $_.FullName 'php.exe' } |
        Where-Object { Test-Path -LiteralPath $_ } |
        Select-Object -First 1
    if ($wampPhp) {
        return $wampPhp
    }

    $pathPhp = Get-Command php -ErrorAction SilentlyContinue
    if ($pathPhp) {
        return $pathPhp.Source
    }

    throw 'PHP was not found. Set ACHIEVENEST_PHP_BINARY to the full php.exe path.'
}

if (-not (Test-Path -LiteralPath $viteCommand)) {
    throw 'Frontend dependencies are missing. Run npm install in the frontend directory.'
}

$phpBinary = Resolve-PhpBinary
$existingFrontend = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -eq 5173 } |
    Select-Object -First 1
if ($existingFrontend) {
    throw 'Frontend port 5173 is already in use. Stop the existing frontend process, then run npm run dev again.'
}

$existingApi = Get-NetTCPConnection -State Listen -LocalPort 8080 -ErrorAction SilentlyContinue
$apiProcess = $null

if (-not $existingApi) {
    Write-Host "Starting AchieveNest API at http://localhost:8080 with $phpBinary ..."
    $rewriteScript = Join-Path $backendRoot 'vendor\codeigniter4\framework\system\rewrite.php'
    $apiProcess = Start-Process -FilePath $phpBinary -ArgumentList '-d', 'upload_max_filesize=10M', '-d', 'post_max_size=64M', '-d', 'max_file_uploads=20', '-d', 'memory_limit=256M', '-S', '127.0.0.1:8080', '-t', 'public', $rewriteScript -WorkingDirectory $backendRoot -WindowStyle Hidden -PassThru

    $deadline = (Get-Date).AddSeconds(15)
    do {
        Start-Sleep -Milliseconds 250
        try {
            $health = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:8080/api/v1/health' -TimeoutSec 2
        } catch {
            $health = $null
        }
    } until ($health.StatusCode -eq 200 -or (Get-Date) -ge $deadline -or $apiProcess.HasExited)

    if ($health.StatusCode -ne 200) {
        if (-not $apiProcess.HasExited) { Stop-Process -Id $apiProcess.Id -Force }
        throw 'AchieveNest API did not become healthy on port 8080. Check the backend log and MySQL service.'
    }
} else {
    Write-Host 'Using the existing AchieveNest API listener on http://localhost:8080.'
}

Write-Host 'Starting AchieveNest frontend at http://localhost:5173 ...'
$viteExitCode = 0
try {
    Push-Location $frontendRoot
    & $viteCommand
    $viteExitCode = $LASTEXITCODE
} finally {
    Pop-Location
    if ($apiProcess -and -not $apiProcess.HasExited) {
        Stop-Process -Id $apiProcess.Id -Force
        Write-Host 'Stopped the API process started by this development session.'
    }
}

exit $viteExitCode
