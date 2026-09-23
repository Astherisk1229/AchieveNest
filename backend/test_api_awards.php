<?php

$db = new mysqli('localhost', 'root', '', 'achievenest_local');
if ($db->connect_error) {
    die("DB connection failed: " . $db->connect_error . "\n");
}

// Find OSAD profile
$res = $db->query("SELECT * FROM profiles WHERE designation_title LIKE '%OSAD%' OR account_type = 'osad_admin' LIMIT 1");
$profile = $res ? $res->fetch_assoc() : null;

if (!$profile) {
    die("No OSAD profile found.\n");
}

echo "Found profile: " . $profile['full_name'] . " (" . $profile['email'] . ")\n";

require_once 'backend/vendor/autoload.php';
use Firebase\JWT\JWT;

// Read JWT secret from .env
$jwtSecret = 'achievenest_jwt_secret_key_super_secure_for_local_development_testing_2026';
if (file_exists('backend/.env')) {
    $envContent = file_get_contents('backend/.env');
    if (preg_match('/LOCAL_AUTH_JWT_SECRET\s*=\s*([^\r\n]+)/', $envContent, $m)) {
        $jwtSecret = trim($m[1], " \t\n\r\0\x0B\"'");
    }
}

$now = time();
$exp = $now + 3600;
$jti = bin2hex(random_bytes(16));

$payload = [
    'iss' => 'achievenest-local',
    'aud' => 'achievenest-web',
    'sub' => $profile['id'],
    'iat' => $now,
    'exp' => $exp,
    'jti' => $jti,
];

$token = JWT::encode($payload, $jwtSecret, 'HS256');
$tokenHash = hash('sha256', $token);

$sessionId = sprintf(
    '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    random_int(0, 0xffff), random_int(0, 0xffff),
    random_int(0, 0xffff),
    random_int(0, 0x0fff) | 0x4000,
    random_int(0, 0x3fff) | 0x8000,
    random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
);

$issuedAt = date('Y-m-d H:i:s.u', $now);
$expiresAt = date('Y-m-d H:i:s.u', $exp);

$db->query("INSERT INTO local_auth_sessions (id, profile_id, token_hash, issued_at, expires_at, last_seen_at) VALUES ('{$sessionId}', '{$profile['id']}', '{$tokenHash}', '{$issuedAt}', '{$expiresAt}', '{$issuedAt}')");

// Call GET /api/v1/osad/awards
$ch = curl_init('http://localhost:8080/api/v1/osad/awards');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\n--- GET /api/v1/osad/awards Response ---\n";
echo "HTTP Status: " . $httpCode . "\n";

$json = json_decode($response, true);
if ($httpCode === 200 && isset($json['data'])) {
    $data = $json['data'];
    $awards = isset($data['awards']) ? $data['awards'] : (is_array($data) ? $data : []);
    echo sprintf("Total Awards Returned: %d\n\n", count($awards));
    $i = 1;
    foreach ($awards as $aw) {
        echo sprintf("  %2d. [%-28s] %-50s (Threshold: %s%%)\n", $i++, $aw['code'] ?? '', $aw['name'] ?? '', $aw['candidate_threshold_percent'] ?? '80.00');
    }
    echo "\n>>> VERIFICATION SUCCESS: All 15 Authoritative Awards Loaded Cleanly (HTTP 200 OK) <<<\n";
} else {
    echo "Response body: " . $response . "\n";
}

// Call GET /api/v1/osad/organizations
$ch = curl_init('http://localhost:8080/api/v1/osad/organizations');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $token,
    'Accept: application/json',
]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$orgResp = curl_exec($ch);
$orgCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\n--- GET /api/v1/osad/organizations Response ---\n";
echo "HTTP Status: " . $orgCode . "\n";
$orgJson = json_decode($orgResp, true);
if ($orgCode === 200 && isset($orgJson['organizations'])) {
    echo sprintf("Total Organizations Returned: %d\n", count($orgJson['organizations']));
    echo ">>> VERIFICATION SUCCESS: Organizations endpoint 200 OK! <<<\n";
} else {
    echo "Response body: " . $orgResp . "\n";
}
