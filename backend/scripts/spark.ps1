param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $SparkArguments
)

& "$PSScriptRoot\php.ps1" "$PSScriptRoot\..\spark" @SparkArguments
exit $LASTEXITCODE
