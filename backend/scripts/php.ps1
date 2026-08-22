param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $PhpArguments
)

$previousIniScanDir = $env:PHP_INI_SCAN_DIR
$env:PHP_INI_SCAN_DIR = $PSScriptRoot

try {
    & php @PhpArguments
} finally {
    $env:PHP_INI_SCAN_DIR = $previousIniScanDir
}

exit $LASTEXITCODE
