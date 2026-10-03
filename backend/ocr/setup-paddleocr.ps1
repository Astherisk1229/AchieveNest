[CmdletBinding()]
param(
    [string] $RuntimeRoot = (Join-Path $PSScriptRoot '..\.runtime\python')
)

$ErrorActionPreference = 'Stop'

$pythonVersion = '3.12.10'
$pythonArchive = "python-$pythonVersion-embed-amd64.zip"
$pythonUrl = "https://www.python.org/ftp/python/$pythonVersion/$pythonArchive"
$pythonMd5 = 'fe8ef205f2e9c3ba44d0cf9954e1abd3'
$paddleCpuIndex = 'https://www.paddlepaddle.org.cn/packages/stable/cpu/'

$resolvedBackend = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$resolvedRuntime = [System.IO.Path]::GetFullPath($RuntimeRoot)
$runtimeBoundary = [System.IO.Path]::GetFullPath((Join-Path $resolvedBackend '.runtime'))

if (-not $resolvedRuntime.StartsWith($runtimeBoundary, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "RuntimeRoot must remain inside $runtimeBoundary"
}

$python = Join-Path $resolvedRuntime 'python.exe'

if (-not (Test-Path -LiteralPath $python)) {
    if ((Test-Path -LiteralPath $resolvedRuntime) -and
        (Get-ChildItem -LiteralPath $resolvedRuntime -Force | Select-Object -First 1)) {
        throw "Runtime directory is not empty: $resolvedRuntime"
    }

    New-Item -ItemType Directory -Path $resolvedRuntime -Force | Out-Null

    $archivePath = Join-Path ([System.IO.Path]::GetTempPath()) $pythonArchive
    Invoke-WebRequest -Uri $pythonUrl -OutFile $archivePath

    $actualMd5 = (Get-FileHash -LiteralPath $archivePath -Algorithm MD5).Hash.ToLowerInvariant()
    if ($actualMd5 -ne $pythonMd5) {
        throw "Python archive checksum mismatch: $actualMd5"
    }

    Expand-Archive -LiteralPath $archivePath -DestinationPath $resolvedRuntime -Force

    $pthPath = Join-Path $resolvedRuntime 'python312._pth'
    $pth = Get-Content -LiteralPath $pthPath
    $pth = $pth -replace '^#import site$', 'import site'
    if ($pth -notcontains 'Lib\site-packages') {
        $pth += 'Lib\site-packages'
    }
    Set-Content -LiteralPath $pthPath -Value $pth -Encoding ascii

    New-Item -ItemType Directory -Path (Join-Path $resolvedRuntime 'Lib\site-packages') -Force | Out-Null

    $getPipPath = Join-Path ([System.IO.Path]::GetTempPath()) 'get-pip.py'
    Invoke-WebRequest -Uri 'https://bootstrap.pypa.io/get-pip.py' -OutFile $getPipPath
    & $python $getPipPath --no-warn-script-location
    if ($LASTEXITCODE -ne 0) {
        throw 'pip bootstrap failed.'
    }
}

& $python -m pip install --disable-pip-version-check --no-warn-script-location --no-compile `
    'paddlepaddle==3.2.2' --index-url $paddleCpuIndex
if ($LASTEXITCODE -ne 0) {
    throw 'PaddlePaddle CPU installation failed.'
}

& $python -m pip install --disable-pip-version-check --no-warn-script-location --no-compile `
    --requirement (Join-Path $PSScriptRoot 'requirements.lock')
if ($LASTEXITCODE -ne 0) {
    throw 'PaddleOCR dependency installation failed.'
}

& $python (Join-Path $PSScriptRoot 'student_ocr_bridge.py') --health
if ($LASTEXITCODE -ne 0) {
    throw 'PaddleOCR runtime health check failed.'
}
