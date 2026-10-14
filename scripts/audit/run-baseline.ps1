<#
 AchieveNest objectives baseline (Phase A: AUTH-01, STU-01, STU-04).
 READ THIS FIRST:
  - Targets the app's real database (achievenest_phase2_restore_test). Take a backup first; only uniquely marked rows are written.
  - Passwords are NOT stored. Copy accounts.example.json to accounts.local.json (add emails);
    you will be prompted for each password at run time.
  - Writes only uniquely marked rows (title contains the marker). No deletes.
 Usage:  powershell -ExecutionPolicy Bypass -File .\run-baseline.ps1 -SharedPassword
#>
param(
  [string]$BaseUrl = 'http://localhost:8080/api/v1',
  [string]$Database = 'achievenest_phase2_restore_test',
  [string]$MysqlExe = 'C:\wamp64\bin\mysql\mysql8.4.7\bin\mysql.exe',
  [string]$MysqlUser = 'root',
  [string]$Accounts = "$PSScriptRoot\accounts.local.json",
  [switch]$SharedPassword   # use one password for all roles (the demo accounts share ACHIEVENEST_DEMO_PASSWORD)
)
if ($Database -eq 'achievenest_local') { throw 'Refusing to run against the protected achievenest_local database.' }
$Marker = 'DEFENSE-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
$OutDir = Join-Path $PSScriptRoot "evidence\$Marker"; New-Item -ItemType Directory -Force $OutDir | Out-Null
$Results = New-Object System.Collections.Generic.List[object]

function Api($Method, $Path, $Token, $Body) {
  $h = @{ 'Accept' = 'application/json' }; if ($Token) { $h['Authorization'] = "Bearer $Token" }
  $p = @{ Uri = "$BaseUrl/$Path"; Method = $Method; Headers = $h; UseBasicParsing = $true; ErrorAction = 'Stop' }
  if ($null -ne $Body) { $p['Body'] = ($Body | ConvertTo-Json -Depth 8); $p['ContentType'] = 'application/json' }
  try { $r = Invoke-WebRequest @p; $code = [int]$r.StatusCode; $txt = $r.Content }
  catch {
    $resp = $_.Exception.Response
    if ($resp) { $code = [int]$resp.StatusCode; $txt = (New-Object IO.StreamReader($resp.GetResponseStream())).ReadToEnd() }
    else { $code = 0; $txt = $_.Exception.Message }
  }
  $json = $null; try { $json = $txt | ConvertFrom-Json } catch {}
  [pscustomobject]@{ Status = $code; Json = $json; Raw = $txt }
}
function Sql($query) {
  $out = & $MysqlExe -u $MysqlUser --batch --skip-column-names $Database -e $query 2>&1
  ($out -join "`n").Trim()
}
function Record($id, $test, $expected, $actual, $pass, $evidence) {
  $Results.Add([pscustomobject]@{ ID=$id; Test=$test; Expected=$expected; Actual=$actual; Verdict=$(if ($pass) {'PASS'} else {'FAIL'}); Evidence=$evidence })
  Write-Host ("[{0}] {1} - {2}" -f $(if ($pass) {'PASS'} else {'FAIL'}), $id, $test)
}
function FindToken($j) {
  foreach ($p in 'data.access_token','data.token','access_token','token') {
    $v = $j; foreach ($k in $p.Split('.')) { if ($v) { $v = $v.$k } }
    if ($v) { return [string]$v }
  }
}

$acc = Get-Content $Accounts -Raw | ConvertFrom-Json
$tok = @{}
$shared = $null
if ($SharedPassword) { $shared = Read-Host 'Shared demo password for all roles' -AsSecureString }
Write-Host "Marker: $Marker  DB: $Database"
$sp = Read-Host 'MySQL password for the audit user (blank if none)' -AsSecureString
$env:MYSQL_PWD = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sp))  # process-only, never written to disk

# ---------- AUTH-01 ----------
foreach ($role in 'student','osad','moderator','personnel','dean','hr') {
  $email = $acc.$role.email; if (-not $email) { Record 'AUTH-01' "login $role" 'token' 'no email configured' $false "accounts.local.json"; continue }
  $pw = if ($shared) { $shared } else { Read-Host "Password for $role ($email)" -AsSecureString }
  $plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($pw))
  $r = Api 'POST' 'auth/login' $null @{ email = $email; password = $plain }; $plain = $null
  $t = FindToken $r.Json
  Record 'AUTH-01' "login $role" '200 + token' "HTTP $($r.Status), token=$([bool]$t)" ($r.Status -eq 200 -and $t) "auth/login"
  if ($t) { $tok[$role] = $t; $me = Api 'GET' 'auth/me' $t $null; Record 'AUTH-01' "me $role" '200' "HTTP $($me.Status)" ($me.Status -eq 200) ($me.Raw.Substring(0,[Math]::Min(300,$me.Raw.Length))) }
}
foreach ($path in 'portfolio','events','hr/evaluations','osad/awards','notifications','certificates') {
  $r = Api 'GET' $path $null $null; Record 'AUTH-01' "unauthenticated GET $path" '401' "HTTP $($r.Status)" ($r.Status -eq 401) $path
}
$matrix = @(
  @('student','hr/evaluations'), @('student','osad/awards'), @('personnel','osad/awards'),
  @('hr','osad/awards'), @('student','hr/ranking-cycles'), @('personnel','hr/ranking-cycles')
)
foreach ($m in $matrix) { if ($tok[$m[0]]) { $r = Api 'GET' $m[1] $tok[$m[0]] $null; Record 'AUTH-01' "wrong-role $($m[0]) GET $($m[1])" '403' "HTTP $($r.Status)" ($r.Status -eq 403) $m[1] } }

# ---------- STU-01 ----------
if ($tok['student']) {
  $cat = Api 'GET' 'portfolio/categories' $tok['student'] $null
  $catId = $null; try { $c = if ($cat.Json.data) { $cat.Json.data } else { $cat.Json }; $first = @($c)[0]; $catId = $first.id } catch {}
  $before = Sql "SELECT COUNT(*) FROM student_portfolio_records WHERE title LIKE '%$Marker%'"
  $title = "$Marker student draft"
  $c1 = Api 'POST' 'portfolio' $tok['student'] @{ title = $title; category_id = $catId; organizer_or_body = 'Audit'; occurrence_date = (Get-Date -Format 'yyyy-MM-dd'); description = 'baseline'; submit_now = $false }
  $rid = $null; try { $rid = if ($c1.Json.data.id) { $c1.Json.data.id } else { $c1.Json.id } } catch {}
  Record 'STU-01' 'create draft' '2xx + id' "HTTP $($c1.Status), id=$rid" ($c1.Status -in 200,201 -and $rid) $c1.Raw
  if ($rid) {
    $u = Api 'PUT' "portfolio/$rid" $tok['student'] @{ title = "$title EDITED"; category_id = $catId; description = 'edited' }
    Record 'STU-01' 'edit draft' '2xx' "HTTP $($u.Status)" ($u.Status -in 200,201) $u.Raw
    $row = Sql "SELECT id,title,status FROM student_portfolio_records WHERE id='$rid'"
    Record 'STU-01' 'row in MySQL with edited title' "title contains 'EDITED'" $row ($row -match 'EDITED') $row
    $g = Api 'GET' "portfolio/$rid" $tok['student'] $null
    Record 'STU-01' 'read back via API (new request)' 'EDITED' "HTTP $($g.Status)" ($g.Raw -match 'EDITED') $g.Raw
    # ---------- STU-04 ----------
    $cntBefore = Sql "SELECT COUNT(*) FROM student_portfolio_verification_events WHERE portfolio_record_id='$rid'"
    $v = Api 'POST' "portfolio/$rid/verify" $tok['student'] @{}
    $stBefore = $row
    $cntAfter = Sql "SELECT COUNT(*) FROM student_portfolio_verification_events WHERE portfolio_record_id='$rid'"
    $stAfter = Sql "SELECT status FROM student_portfolio_records WHERE id='$rid'"
    Record 'STU-04' 'student self-verify rejected, no DB change' '401/403/4xx and counts equal' "HTTP $($v.Status), events $cntBefore->$cntAfter, status $stAfter" ($v.Status -in 401,403,409,422 -and $cntBefore -eq $cntAfter -and $stAfter -notmatch 'verified') $v.Raw
  }
}

# ---------- output ----------
$Results | Export-Csv "$OutDir\results.csv" -NoTypeInformation
$Results | ConvertTo-Json -Depth 4 | Set-Content "$OutDir\results.json"
$Results | Format-Table ID,Test,Verdict,Actual -AutoSize | Out-String | Set-Content "$OutDir\summary.txt"
Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
Write-Host "`nEvidence: $OutDir"
Write-Host ("PASS {0} / FAIL {1}" -f ($Results | ? Verdict -eq 'PASS').Count, ($Results | ? Verdict -eq 'FAIL').Count)
