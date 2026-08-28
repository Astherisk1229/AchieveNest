<?php

namespace App\Services;

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use RuntimeException;
use Throwable;

class LocalTokenService
{
    protected string $jwtSecret;
    protected string $issuer;
    protected string $audience;
    protected int $accessTtl;
    protected int $rememberTtl;

    public function __construct()
    {
        $this->jwtSecret = (string) (env('LOCAL_AUTH_JWT_SECRET') ?: env('local_auth.jwtSecret', ''));
        $this->issuer = (string) (env('LOCAL_AUTH_ISSUER') ?: 'achievenest-local');
        $this->audience = (string) (env('LOCAL_AUTH_AUDIENCE') ?: 'achievenest-web');
        $this->accessTtl = (int) (env('LOCAL_AUTH_ACCESS_TTL_SECONDS') ?: 3600);
        $this->rememberTtl = (int) (env('LOCAL_AUTH_REMEMBER_TTL_SECONDS') ?: 28800);
    }

    /**
     * Issues a local signed JWT and records the session in local_auth_sessions.
     */
    public function issueToken(
        string $profileId,
        bool $rememberMe = false,
        ?string $ip = null,
        ?string $userAgent = null
    ): array {
        if ($this->jwtSecret === '') {
            throw new RuntimeException('LOCAL_AUTH_JWT_SECRET is not configured. Local authentication fails closed.');
        }

        $now = time();
        $ttl = $rememberMe ? $this->rememberTtl : $this->accessTtl;
        $exp = $now + $ttl;
        $jti = bin2hex(random_bytes(16));

        $payload = [
            'iss' => $this->issuer,
            'aud' => $this->audience,
            'sub' => $profileId,
            'iat' => $now,
            'exp' => $exp,
            'jti' => $jti,
        ];

        $token = JWT::encode($payload, $this->jwtSecret, 'HS256');
        $tokenHash = hash('sha256', $token);
        $sessionId = sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            random_int(0, 0xffff), random_int(0, 0xffff),
            random_int(0, 0xffff),
            random_int(0, 0x0fff) | 0x4000,
            random_int(0, 0x3fff) | 0x8000,
            random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)
        );

        $db = db_connect();
        $db->table('local_auth_sessions')->insert([
            'id'              => $sessionId,
            'profile_id'      => $profileId,
            'token_hash'      => $tokenHash,
            'issued_at'       => date('Y-m-d H:i:s.u', $now),
            'expires_at'      => date('Y-m-d H:i:s.u', $exp),
            'last_seen_at'    => date('Y-m-d H:i:s.u', $now),
            'revoked_at'      => null,
            'revocation_reason' => null,
            'created_ip'      => $ip,
            'user_agent_hash' => $userAgent ? hash('sha256', $userAgent) : null,
        ]);

        return [
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'expires_at'   => date('c', $exp),
            'expires_in'   => $ttl,
        ];
    }

    /**
     * Verifies the local JWT signature, claims, server-side session, and profile status.
     */
    public function verifyToken(string $token): ?object
    {
        if ($this->jwtSecret === '') {
            return null; // Fail closed if secret missing
        }

        $jwt = trim($token);
        if ($jwt === '') {
            return null;
        }

        try {
            $decoded = JWT::decode($jwt, new Key($this->jwtSecret, 'HS256'));
        } catch (Throwable) {
            return null;
        }

        // Validate claims
        if (! isset($decoded->iss) || $decoded->iss !== $this->issuer) {
            return null;
        }

        if (! isset($decoded->aud) || $decoded->aud !== $this->audience) {
            return null;
        }

        if (! isset($decoded->exp) || (int) $decoded->exp < time()) {
            return null;
        }

        $profileId = (string) ($decoded->sub ?? '');
        if ($profileId === '') {
            return null;
        }

        // Validate server-side session revocation
        $tokenHash = hash('sha256', $jwt);
        $db = db_connect();

        $session = $db->table('local_auth_sessions')
            ->where('token_hash', $tokenHash)
            ->where('profile_id', $profileId)
            ->get()
            ->getRowArray();

        if ($session === null) {
            return null; // Session record missing -> fail closed
        }

        if (! empty($session['revoked_at'])) {
            return null; // Explicitly revoked -> fail closed
        }

        // Validate current profile status
        $profile = $db->table('profiles')
            ->where('id', $profileId)
            ->get()
            ->getRowArray();

        if ($profile === null || ($profile['status'] ?? '') !== 'active') {
            return null; // Suspended/archived/deleted -> fail closed
        }

        // Update last seen
        $db->table('local_auth_sessions')
            ->where('id', $session['id'])
            ->update(['last_seen_at' => date('Y-m-d H:i:s.u')]);

        return $decoded;
    }

    /**
     * Revokes a specific token session.
     */
    public function revokeSession(string $token, string $reason = 'logout'): bool
    {
        $tokenHash = hash('sha256', trim($token));
        $db = db_connect();

        $session = $db->table('local_auth_sessions')
            ->where('token_hash', $tokenHash)
            ->get()
            ->getRowArray();

        if ($session === null) {
            return false;
        }

        $db->table('local_auth_sessions')
            ->where('id', $session['id'])
            ->update([
                'revoked_at'        => date('Y-m-d H:i:s.u'),
                'revocation_reason' => $reason,
            ]);

        return true;
    }

    /**
     * Revokes all active sessions for a given profile (e.g. upon password change/reset).
     */
    public function revokeAllSessionsForProfile(string $profileId, string $reason = 'password_change'): bool
    {
        $db = db_connect();
        $db->table('local_auth_sessions')
            ->where('profile_id', $profileId)
            ->where('revoked_at IS NULL', null, false)
            ->update([
                'revoked_at'        => date('Y-m-d H:i:s.u'),
                'revocation_reason' => $reason,
            ]);

        return true;
    }
}
