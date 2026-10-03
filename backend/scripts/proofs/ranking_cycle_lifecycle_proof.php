<?php

declare(strict_types=1);

/**
 * Ranking-cycle lifecycle proof against a running backend and a DISPOSABLE MySQL copy.
 *
 * Proves: single-step creation writes the cycle and its tracks atomically; generated name, coverage,
 * schedule and criteria survive a fresh read; duplicates are refused; stage and status follow the
 * authoritative track lifecycle; archiving keeps every track and makes the cycle read-only.
 *
 * Usage (never point this at the protected local database):
 *   PROOF_BASE=http://127.0.0.1:8080/api/v1 PROOF_HR_EMAIL=... PROOF_HR_PASSWORD=... \
 *   PROOF_DB_HOST=127.0.0.1 PROOF_DB_NAME=achievenest_proof_copy PROOF_DB_USER=... PROOF_DB_PASS=... \
 *   php scripts/proofs/ranking_cycle_lifecycle_proof.php
 *
 * The fixture uses an unused academic year (2090+) and removes every row it created.
 */

$env = static fn(string $key, ?string $default = null): string => (string) (getenv($key) ?: $default ?? throw new RuntimeException("Missing {$key}"));
$base = rtrim($env('PROOF_BASE', 'http://127.0.0.1:8080/api/v1'), '/');
$dbName = $env('PROOF_DB_NAME');
if (in_array($dbName, ['achievenest_local', 'achievenest_phase2_restore_test'], true)) {
    fwrite(STDERR, "Refusing to run against a protected database ({$dbName}).\n");
    exit(2);
}
$db = new mysqli($env('PROOF_DB_HOST', '127.0.0.1'), $env('PROOF_DB_USER'), getenv('PROOF_DB_PASS') ?: '', $dbName, (int) $env('PROOF_DB_PORT', '3306'));
$db->set_charset('utf8mb4');

$failures = 0;
$check = static function (bool $condition, string $label) use (&$failures): void {
    echo ($condition ? '  PASS ' : '  FAIL ') . $label . PHP_EOL;
    if (! $condition) $failures++;
};
$http = static function (string $method, string $path, ?array $payload = null, ?string $token = null, array $extra = []) use ($base): array {
    $ch = curl_init($base . $path);
    $headers = array_merge(['Accept: application/json', 'Content-Type: application/json'], $token ? ["Authorization: Bearer {$token}"] : [], $extra);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 60]);
    if ($payload !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
    $raw = (string) curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    return ['status' => $status, 'body' => json_decode($raw, true) ?? [], 'raw' => $raw];
};
$scalar = static function (string $sql, array $params = []) use ($db) {
    $stmt = $db->prepare($sql);
    if ($params) $stmt->bind_param(str_repeat('s', count($params)), ...$params);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_row();
    return $row[0] ?? null;
};

$login = $http('POST', '/auth/login', ['email' => $env('PROOF_HR_EMAIL'), 'password' => $env('PROOF_HR_PASSWORD')]);
$token = $login['body']['data']['access_token'] ?? null;
if (! $token) { fwrite(STDERR, "HR login failed: {$login['raw']}\n"); exit(2); }

$year = '';
for ($start = 2090; $start < 2099; $start++) {
    if ((int) $scalar('SELECT COUNT(*) FROM personnel_evaluation_periods WHERE academic_year = ?', ["{$start}-" . ($start + 1)]) === 0) { $year = "{$start}-" . ($start + 1); break; }
}
[$first] = explode('-', $year);
$label = 'AY ' . str_replace('-', '–', $year);
$payload = ['academic_year' => $year, 'personnel_coverage' => 'BOTH', 'submission_open_at' => "{$first}-09-01", 'submission_close_at' => "{$first}-09-30", 'evaluation_start_at' => "{$first}-10-01", 'evaluation_end_at' => "{$first}-10-20"];
$created = [];

try {
    echo "Creation\n";
    $bad = $http('POST', '/hr/ranking-cycles', ['evaluation_start_at' => "{$first}-09-15"] + $payload, $token);
    $check($bad['status'] === 422 && ($bad['body']['error']['code'] ?? '') === 'SCHEDULE_OVERLAP', 'overlapping submission/evaluation dates are refused (422)');
    $before = (int) $scalar('SELECT COUNT(*) FROM ranking_cycles');
    $res = $http('POST', '/hr/ranking-cycles', $payload, $token);
    $check($res['status'] === 201, 'cycle created in one request (201)');
    $id = $res['body']['data']['cycle']['id'] ?? '';
    if ($id) $created[] = $id;
    $check((int) $scalar('SELECT COUNT(*) FROM ranking_cycles') === $before + 1, 'exactly one ranking_cycles row written');
    $check((int) $scalar('SELECT COUNT(*) FROM personnel_evaluation_periods WHERE ranking_cycle_id = ?', [$id]) === 2, 'two authoritative tracks written (Faculty + NTF)');
    $check((int) $scalar("SELECT COUNT(*) FROM audit_logs WHERE target_id = ? AND event_code = 'ranking_cycle_created'", [$id]) === 1, 'creation audit log written');

    echo "Fresh read (reload)\n";
    $cycle = $http('GET', "/hr/ranking-cycles/{$id}", null, $token)['body']['data']['cycle'] ?? [];
    $check(($cycle['display_name'] ?? '') === "{$label} Personnel Ranking", 'generated name persists');
    $check(($cycle['coverage']['key'] ?? '') === 'BOTH', 'coverage persists');
    $check(($cycle['lifecycle_status']['key'] ?? '') === 'UPCOMING' && ($cycle['current_stage']['key'] ?? '') === 'annual_reviews', 'status Upcoming, stage Annual Reviews');
    $tracksOk = count($cycle['tracks'] ?? []) === 2;
    foreach ($cycle['tracks'] ?? [] as $t) $tracksOk = $tracksOk && $t['submission_open_at'] === "{$first}-09-01 00:00:00" && $t['evaluation_end_at'] === "{$first}-10-20 23:59:59" && ! empty($t['evaluation_scale_version_id']) && ($t['criteria']['locked'] ?? false);
    $check($tracksOk, 'schedules and criteria versions persist per track');

    echo "Duplicate rule\n";
    $dup = $http('POST', '/hr/ranking-cycles', ['personnel_coverage' => 'FACULTY'] + $payload, $token);
    $check($dup['status'] === 409 && ($dup['body']['error']['code'] ?? '') === 'DUPLICATE_RANKING_CYCLE', 'second Faculty cycle for the same academic year refused (409)');

    echo "Atomicity\n";
    $key = 'proof-' . bin2hex(random_bytes(6));
    $ntfYear = ($first + 1) . '-' . ($first + 2);
    $ntfFirst = $first + 1;
    $ntf = $http('POST', '/hr/ranking-cycles', ['academic_year' => $ntfYear, 'personnel_coverage' => 'NON_TEACHING_FACULTY', 'submission_open_at' => "{$ntfFirst}-09-01", 'submission_close_at' => "{$ntfFirst}-09-30", 'evaluation_start_at' => "{$ntfFirst}-10-01", 'evaluation_end_at' => "{$ntfFirst}-10-20"], $token, ["Idempotency-Key: {$key}"]);
    if (($ntf['body']['data']['cycle']['id'] ?? '') !== '') $created[] = $ntf['body']['data']['cycle']['id'];
    $count = (int) $scalar('SELECT COUNT(*) FROM ranking_cycles');
    $bothYear = ($first + 2) . '-' . ($first + 3);
    $bf = $first + 2;
    $fail = $http('POST', '/hr/ranking-cycles', ['academic_year' => $bothYear, 'personnel_coverage' => 'BOTH', 'submission_open_at' => "{$bf}-09-01", 'submission_close_at' => "{$bf}-09-30", 'evaluation_start_at' => "{$bf}-10-01", 'evaluation_end_at' => "{$bf}-10-20"], $token, ["Idempotency-Key: {$key}"]);
    $check($fail['status'] === 409 && (int) $scalar('SELECT COUNT(*) FROM ranking_cycles') === $count && (int) $scalar('SELECT COUNT(*) FROM personnel_evaluation_periods WHERE academic_year = ?', [$bothYear]) === 0, 'a failure on the second track rolls back the cycle and the first track');

    echo "Lifecycle\n";
    $check($http('POST', "/hr/ranking-cycles/{$id}/archive", ['confirm' => true], $token)['status'] === 409, 'archive refused before completion');
    $db->query("UPDATE personnel_evaluation_periods SET status = 'EVALUATION_ONGOING' WHERE ranking_cycle_id = '" . $db->real_escape_string($id) . "'");
    $ongoing = $http('GET', "/hr/ranking-cycles/{$id}", null, $token)['body']['data']['cycle'];
    $check($ongoing['lifecycle_status']['key'] === 'ONGOING' && $ongoing['current_stage']['key'] === 'evaluation', 'status Ongoing, stage Evaluation');
    $workspace = $http('GET', "/hr/ranking-cycles/{$id}/tracks/faculty/workspace/evaluation", null, $token);
    $check($workspace['status'] === 200 && ($workspace['body']['data']['read_only'] ?? null) === false, 'workspace opens for an ongoing cycle');
    foreach ($ongoing['tracks'] as $t) $http('POST', "/hr/personnel-evaluation-periods/{$t['id']}/close", ['expected_version' => (int) $t['version']], $token, ['Idempotency-Key: ' . bin2hex(random_bytes(8))]);
    $done = $http('GET', "/hr/ranking-cycles/{$id}", null, $token)['body']['data']['cycle'];
    $check($done['lifecycle_status']['key'] === 'COMPLETED' && $done['current_stage']['key'] === 'results' && $done['is_read_only'] === true, 'status Completed, stage Results, read-only');
    $check($http('POST', "/hr/ranking-cycles/{$id}/archive", [], $token)['status'] === 422, 'archive requires explicit confirmation');
    $arch = $http('POST', "/hr/ranking-cycles/{$id}/archive", ['confirm' => true], $token);
    $check($arch['status'] === 200, 'completed cycle archived');
    $after = $http('GET', "/hr/ranking-cycles/{$id}", null, $token)['body']['data']['cycle'];
    $check($after['lifecycle_status']['key'] === 'ARCHIVED' && $after['allowed_actions'] === ['view'], 'archived cycle is view-only');
    $check(count($after['tracks']) === 2 && array_unique(array_column($after['tracks'], 'status')) === ['ARCHIVED'], 'archiving keeps both tracks');
    $check((int) $scalar("SELECT COUNT(*) FROM personnel_evaluation_period_events e JOIN personnel_evaluation_periods p ON p.id = e.evaluation_period_id WHERE p.ranking_cycle_id = ? AND e.event_type = 'archive'", [$id]) === 2, 'archive events recorded per track');
    $ws = $http('GET', "/hr/ranking-cycles/{$id}/tracks/faculty/workspace/results", null, $token);
    $check($ws['status'] === 200 && ($ws['body']['data']['read_only'] ?? null) === true, 'archived workspace is still viewable and flagged read-only');
    $check($http('DELETE', "/hr/ranking-cycles/{$id}", null, $token)['status'] === 409, 'cycle with records cannot be deleted');
    $check($http('PATCH', "/hr/ranking-cycles/{$id}/schedule", $payload, $token)['status'] === 409, 'archived schedule cannot change');
    $list = $http('GET', '/hr/ranking-cycles', null, $token)['body']['data']['cycles'] ?? [];
    $check(in_array($id, array_column($list, 'id'), true), 'archived cycle stays listed');
} finally {
    foreach ($created as $cid) {
        $e = $db->real_escape_string($cid);
        $db->query("DELETE e FROM personnel_evaluation_period_events e JOIN personnel_evaluation_periods p ON p.id = e.evaluation_period_id WHERE p.ranking_cycle_id = '{$e}'");
        $db->query("DELETE i FROM personnel_evaluation_idempotency i JOIN personnel_evaluation_periods p ON p.id = i.resource_id WHERE p.ranking_cycle_id = '{$e}'");
        $db->query("DELETE FROM personnel_evaluation_periods WHERE ranking_cycle_id = '{$e}'");
        $db->query("DELETE FROM audit_logs WHERE target_type = 'ranking_cycle' AND target_id = '{$e}'");
        $db->query("DELETE FROM ranking_cycles WHERE id = '{$e}'");
    }
}

echo $failures === 0 ? "\nAll ranking-cycle lifecycle checks passed.\n" : "\n{$failures} check(s) failed.\n";
exit($failures === 0 ? 0 : 1);
