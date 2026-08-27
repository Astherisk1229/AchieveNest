param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $PhpArguments
)

$phpBinary = "C:\wamp64\bin\php\php8.3.28\php.exe"

if (-not (Test-Path $phpBinary)) {
    Write-Error "Required AchieveNest PHP runtime not found: $phpBinary"
    exit 1
}

& $phpBinary @PhpArguments
exit $LASTEXITCODE
