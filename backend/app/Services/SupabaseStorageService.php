<?php

namespace App\Services;

use RuntimeException;

/**
 * Backend-only Supabase Storage client.
 *
 * Uses the service-role key exclusively on the server. Never expose this key or
 * this service directly to the browser.
 */
class SupabaseStorageService
{
    private string $projectUrl;
    private string $serviceRoleKey;

    public function __construct(?string $projectUrl = null, ?string $serviceRoleKey = null)
    {
        $url = $projectUrl
            ?: (string) env('supabase.url', '')
            ?: (string) env('SUPABASE_URL', '')
            ?: (string) getenv('SUPABASE_URL');

        $key = $serviceRoleKey
            ?: (string) env('supabase.serviceRoleKey', '')
            ?: (string) env('SUPABASE_SERVICE_ROLE_KEY', '')
            ?: (string) getenv('SUPABASE_SERVICE_ROLE_KEY');

        $this->projectUrl = rtrim(trim($url), '/');
        $this->serviceRoleKey = trim($key);
    }

    public function isConfigured(): bool
    {
        return $this->projectUrl !== '' && $this->serviceRoleKey !== '';
    }

    /**
     * @throws RuntimeException
     */
    public function uploadObject(string $bucket, string $path, string $bytes, string $mimeType): void
    {
        $this->assertConfigured();
        $this->assertSafeBucketAndPath($bucket, $path);

        $endpoint = $this->projectUrl . '/storage/v1/object/'
            . rawurlencode($bucket) . '/' . $this->encodeObjectPath($path);

        [$status, $body] = $this->request('POST', $endpoint, $bytes, [
            'Content-Type: ' . $mimeType,
            'x-upsert: false',
        ]);

        if ($status < 200 || $status >= 300) {
            throw new RuntimeException('Storage upload failed: ' . $this->extractError($body, $status));
        }
    }

    /**
     * Best-effort compensating delete used if metadata persistence fails after upload.
     */
    public function deleteObject(string $bucket, string $path): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        try {
            $this->assertSafeBucketAndPath($bucket, $path);
            $endpoint = $this->projectUrl . '/storage/v1/object/'
                . rawurlencode($bucket) . '/' . $this->encodeObjectPath($path);
            [$status] = $this->request('DELETE', $endpoint);
            return $status >= 200 && $status < 300;
        } catch (\Throwable $e) {
            log_message('error', 'Evidence storage compensation failed: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Creates a short-lived signed URL only after application authorization has succeeded.
     *
     * @throws RuntimeException
     */
    public function createSignedUrl(string $bucket, string $path, int $expiresIn = 120): string
    {
        $this->assertConfigured();
        $this->assertSafeBucketAndPath($bucket, $path);
        $expiresIn = max(30, min($expiresIn, 300));

        $endpoint = $this->projectUrl . '/storage/v1/object/sign/'
            . rawurlencode($bucket) . '/' . $this->encodeObjectPath($path);

        [$status, $body] = $this->request(
            'POST',
            $endpoint,
            json_encode(['expiresIn' => $expiresIn], JSON_THROW_ON_ERROR),
            ['Content-Type: application/json']
        );

        if ($status < 200 || $status >= 300) {
            throw new RuntimeException('Unable to create signed evidence URL: ' . $this->extractError($body, $status));
        }

        $decoded = json_decode($body, true);
        if (! is_array($decoded)) {
            throw new RuntimeException('Supabase Storage returned an invalid signed URL response.');
        }

        $signed = (string) ($decoded['signedURL'] ?? $decoded['signedUrl'] ?? '');
        if ($signed === '') {
            throw new RuntimeException('Supabase Storage did not return a signed URL.');
        }

        if (str_starts_with($signed, 'http://') || str_starts_with($signed, 'https://')) {
            return $signed;
        }

        return $this->projectUrl . $signed;
    }

    private function assertConfigured(): void
    {
        if (! $this->isConfigured()) {
            throw new RuntimeException('Supabase Storage administrative credentials are not configured.');
        }
    }

    private function assertSafeBucketAndPath(string $bucket, string $path): void
    {
        if (! preg_match('/^[a-z0-9][a-z0-9-]{1,62}$/', $bucket)) {
            throw new RuntimeException('Invalid Storage bucket identifier.');
        }

        if ($path === '' || str_contains($path, '..') || str_starts_with($path, '/') || str_contains($path, "\\")) {
            throw new RuntimeException('Invalid Storage object path.');
        }

        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || ! preg_match('/^[A-Za-z0-9._-]+$/', $segment)) {
                throw new RuntimeException('Unsafe Storage object path segment.');
            }
        }
    }

    private function encodeObjectPath(string $path): string
    {
        return implode('/', array_map('rawurlencode', explode('/', $path)));
    }

    /**
     * @return array{0:int,1:string}
     */
    private function request(string $method, string $url, ?string $body = null, array $extraHeaders = []): array
    {
        $curl = curl_init();
        $headers = array_merge([
            'apikey: ' . $this->serviceRoleKey,
            'Authorization: Bearer ' . $this->serviceRoleKey,
        ], $extraHeaders);

        $options = [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 30,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ];

        if ($body !== null && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            $options[CURLOPT_POSTFIELDS] = $body;
        }

        curl_setopt_array($curl, $options);
        $raw = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($raw === false) {
            throw new RuntimeException('Supabase Storage request failed: ' . $error);
        }

        return [$status, (string) $raw];
    }

    private function extractError(string $body, int $status): string
    {
        $decoded = json_decode($body, true);
        if (is_array($decoded)) {
            return (string) ($decoded['message'] ?? $decoded['error'] ?? $decoded['statusCode'] ?? ('HTTP ' . $status));
        }
        return 'HTTP ' . $status;
    }
}
