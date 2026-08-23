<?php

namespace App\Services;

use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use RuntimeException;

class SupabaseAuthService
{
    public function verifyAccessToken(string $token): object
    {
        $jwt = trim($token);
        if ($jwt === '') {
            throw new RuntimeException('Bearer token is empty.');
        }

        $projectUrl = rtrim((string) env('SUPABASE_URL', ''), '/');
        if ($projectUrl === '') {
            throw new RuntimeException('Supabase project URL is not configured.');
        }

        $jwks = $this->fetchJwks($projectUrl);
        $keys = JWK::parseKeySet($jwks, 'RS256');
        $decoded = JWT::decode($jwt, $keys);

        if (! isset($decoded->iss) || ! is_string($decoded->iss)) {
            throw new RuntimeException('JWT issuer is missing.');
        }

        $expectedIssuer = rtrim($projectUrl, '/') . '/auth/v1';
        if (rtrim($decoded->iss, '/') !== $expectedIssuer) {
            throw new RuntimeException('JWT issuer does not match the configured Supabase project.');
        }

        if (! empty($decoded->exp) && (int) $decoded->exp < time()) {
            throw new RuntimeException('JWT has expired.');
        }

        if (isset($decoded->aud)) {
            $aud = $decoded->aud;
            if (is_array($aud) && $aud === []) {
                throw new RuntimeException('JWT audience is missing.');
            }
            if (is_string($aud) && trim($aud) === '') {
                throw new RuntimeException('JWT audience is empty.');
            }
        }

        if (! isset($decoded->sub) || ! is_string($decoded->sub) || trim($decoded->sub) === '') {
            throw new RuntimeException('JWT subject is missing.');
        }

        return $decoded;
    }

    protected function fetchJwks(string $projectUrl): array
    {
        $jwksUrl = rtrim($projectUrl, '/') . '/auth/v1/.well-known/jwks.json';
        $contents = @file_get_contents($jwksUrl);

        if ($contents === false || trim($contents) === '') {
            throw new RuntimeException('Unable to fetch Supabase JWKS.');
        }

        $decoded = json_decode($contents, true);
        if (! is_array($decoded) || ! isset($decoded['keys']) || ! is_array($decoded['keys'])) {
            throw new RuntimeException('Supabase JWKS response is invalid.');
        }

        return $decoded;
    }
}
