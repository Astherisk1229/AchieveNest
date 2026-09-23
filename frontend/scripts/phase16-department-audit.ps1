$ErrorActionPreference = 'Stop'

$frontendRoot = Split-Path $PSScriptRoot -Parent
$repoRoot = Split-Path $frontendRoot -Parent
$sourceRoot = Join-Path $frontendRoot 'src'
$baselinePath = Join-Path $repoRoot 'docs\Phase_16_Department_Scan_Baseline.txt'
$auditPath = Join-Path $repoRoot 'docs\Phase_16_Department_Occurrence_Audit.md'
$pattern = 'Department Secretary|Department|department_id|departmentId|department_name|departments|departmentCode|departmentLabel|departmentName|department_secretary|departmentSecretary'

function Get-RepoRelativePath($path) {
    $rootUri = [Uri]((Resolve-Path $repoRoot).Path.TrimEnd('\') + '\')
    $pathUri = [Uri](Resolve-Path $path).Path
    return [Uri]::UnescapeDataString($rootUri.MakeRelativeUri($pathUri).ToString())
}

$hits = @(Get-ChildItem $sourceRoot -Recurse -File |
    Select-String -Pattern $pattern |
    Sort-Object Path, LineNumber)

function Resolve-SourceImport($ownerPath, $specifier) {
    if (-not $specifier.StartsWith('.')) { return $null }
    $base = Join-Path (Split-Path $ownerPath -Parent) $specifier
    $candidates = @($base, "$base.js", "$base.jsx", (Join-Path $base 'index.js'), (Join-Path $base 'index.jsx'))
    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate -PathType Leaf) {
            return [IO.Path]::GetFullPath($candidate)
        }
    }
    return $null
}

function Get-ReachableSourceFiles() {
    $reachable = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
    $pending = [Collections.Generic.Stack[string]]::new()
    $pending.Push([IO.Path]::GetFullPath((Join-Path $sourceRoot 'App.jsx')))
    while ($pending.Count -gt 0) {
        $path = $pending.Pop()
        if (-not $reachable.Add($path)) { continue }
        $content = [IO.File]::ReadAllText($path)
        $matches = [regex]::Matches($content, '(?:from\s+|import\s*\()\s*[''"]([^''"]+)[''"]')
        foreach ($match in $matches) {
            $resolved = Resolve-SourceImport $path $match.Groups[1].Value
            if ($resolved -and -not $reachable.Contains($resolved)) { $pending.Push($resolved) }
        }
    }
    return $reachable
}

$reachableFiles = Get-ReachableSourceFiles

$baselineLines = @(
    '# Phase 16 Department Scan Baseline'
    "# Generated: $([DateTime]::Now.ToString('yyyy-MM-dd HH:mm:ss zzz'))"
    "# Matching source lines: $($hits.Count)"
    '# Pattern:'
    "# $pattern"
    ''
) + ($hits | ForEach-Object {
    $relative = Get-RepoRelativePath $_.Path
    "${relative}:$($_.LineNumber):$($_.Line.Trim())"
})
[IO.File]::WriteAllLines($baselinePath, $baselineLines)

function Classify-Hit($hit) {
    $relative = Get-RepoRelativePath $hit.Path
    $line = $hit.Line.Trim()

    if (-not $reachableFiles.Contains([IO.Path]::GetFullPath($hit.Path)) -and $relative -notmatch '/__tests__/|\.test\.(js|jsx)$') {
        return @('LEGACY/HOSTED', 'No', 'Keep isolated or remove after dependency review', 'Not reachable from the active App import graph')
    }

    if ($relative -match '/__tests__/|\.test\.(js|jsx)$') {
        return @('TEST', 'No', 'Review fixture', 'Test fixture or compatibility assertion')
    }
    if ($relative -match '/models/DepartmentModel\.js$|/department-secretary/') {
        return @('LEGACY/HOSTED', 'No', 'Keep isolated', 'Unrouted legacy implementation; must not be imported by local-defense routes')
    }
    if ($line -match '^\s*(//|/\*|\*)' -or $line -match 'compatib|legacy|deprecated') {
        return @('DOCUMENTATION', 'No', 'Review wording', 'Comment or migration note')
    }
    if ($relative -match '/services/authService\.js$' -and $line -match 'department_id') {
        return @('COMPATIBILITY-FIELD', 'No', 'Keep inert', 'Preserved response/session compatibility; not an authorization source')
    }
    if ($relative -match '/controllers/|/models/|/hooks/' -and $line -match 'department(_id|Id|s|Name|Code)?') {
        return @('ACTIVE-LOGIC', 'Yes', 'Migrate or prove unreachable', 'Potential placement, filtering, payload, or governance dependency')
    }
    if ($relative -match '/pages/|/components/|/config/' -and $line -match '[''"][^''"]*Department|>[^<]*Department') {
        return @('ACTIVE-UI', 'Yes', 'Replace', 'Visible organizational terminology must use College, Academic Program, or Administrative Unit')
    }
    if ($relative -match '/pages/|/components/|/config/') {
        return @('ACTIVE-LOGIC', 'Yes', 'Migrate or prove inert', 'Component/config reference may influence active placement or filtering')
    }
    return @('COMPATIBILITY-FIELD', 'No', 'Keep after review', 'Non-UI shape retained only when it has no local authority')
}

$rows = @()
$counts = @{}
$index = 0
foreach ($hit in $hits) {
    $index++
    $classification, $active, $action, $reason = Classify-Hit $hit
    if (-not $counts.ContainsKey($classification)) { $counts[$classification] = 0 }
    $counts[$classification]++
    $relative = Get-RepoRelativePath $hit.Path
    $reference = $hit.Line.Trim().Replace('|', '\|').Replace('`', '\`')
    $status = if ($classification -in @('ACTIVE-UI', 'ACTIVE-LOGIC')) { 'OPEN' } else { 'REVIEWED' }
    $rows += "| $index | ``$relative`` | $($hit.LineNumber) | ``$reference`` | $classification | $active | $action | $reason | $status |"
}

$activeUi = if ($counts.ContainsKey('ACTIVE-UI')) { [int]$counts['ACTIVE-UI'] } else { 0 }
$activeLogic = if ($counts.ContainsKey('ACTIVE-LOGIC')) { [int]$counts['ACTIVE-LOGIC'] } else { 0 }
$retained = $hits.Count - $activeUi - $activeLogic

$document = @(
    '# Phase 16 Department Occurrence Audit'
    ''
    '- Prior reported baseline: 94 broad `Department` matches before the latest remediation batches.'
    "- Current matching source lines reviewed: $($hits.Count)"
    "- ACTIVE-UI candidates: $activeUi"
    "- ACTIVE-LOGIC candidates: $activeLogic"
    "- Compatibility/legacy/test/documentation candidates retained: $retained"
    '- Department Secretary active-source gate: see `frontend/scripts/phase16-terminology-audit.ps1`.'
    '- Status: IN PROGRESS until every OPEN row is resolved or reclassified with evidence.'
    ''
    '## Classification policy'
    ''
    'Compatibility properties may remain only when inert. Local-defense placement and governance must use College, Academic Program, Administrative Unit, or Organization as applicable. Automated classification is conservative: every OPEN row requires code review.'
    ''
    '## Occurrences'
    ''
    '| # | File | Line | Current Reference | Classification | Active in Local Defense? | Action | Replacement/Reason | Status |'
    '|---:|---|---:|---|---|---|---|---|---|'
) + $rows + @(
    ''
    '## Exit summary'
    ''
    "- Total matching source lines reviewed: $($hits.Count)"
    "- Active structural candidates still open: $($activeUi + $activeLogic)"
    '- Resolved structural blockers: pending row-by-row remediation'
    '- Remaining confirmed structural blockers: pending row-by-row remediation'
    "- Compatibility/history/test/documentation candidates: $retained"
)
[IO.File]::WriteAllLines($auditPath, $document)

Write-Host "Department scan written to $baselinePath"
Write-Host "Occurrence audit written to $auditPath"
Write-Host "Current matching lines: $($hits.Count); ACTIVE-UI: $activeUi; ACTIVE-LOGIC: $activeLogic"
