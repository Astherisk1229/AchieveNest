<?php

namespace App\Services;

use RuntimeException;
use Throwable;

class SupabaseAdminAuthService
{
    protected string $projectUrl;
    protected string $serviceRoleKey;

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

        $this->projectUrl = rtrim($url, '/');
        $this->serviceRoleKey = trim($key);
    }

    /**
     * Checks whether the administrative credentials are configured.
     */
    public function isConfigured(): bool
    {
        return $this->projectUrl !== '' && $this->serviceRoleKey !== '';
    }

    /**
     * Creates a new Supabase Auth user via the backend Admin API.
     *
     * @param string $email
     * @param string $password
     * @param array $userMetadata
     * @return array Contains 'id' (Auth UUID), 'email', etc.
     * @throws RuntimeException
     */
    public function createUser(string $email, string $password, array $userMetadata = []): array
    {
        $cleanEmail = strtolower(trim($email));
        if ($cleanEmail === '') {
            throw new RuntimeException('Email cannot be empty.');
        }

        if (! $this->isConfigured()) {
            throw new RuntimeException('Supabase URL or Service Role Key is not configured for administrative auth operations.');
        }

        $endpoint = $this->projectUrl . '/auth/v1/admin/users';

        $payload = [
            'email'         => $cleanEmail,
            'password'      => $password,
            'email_confirm' => true,
            'user_metadata' => $userMetadata,
        ];

        $response = $this->sendRequest('POST', $endpoint, $payload);

        if (! isset($response['id']) || ! is_string($response['id']) || trim($response['id']) === '') {
            $msg = $response['msg'] ?? $response['message'] ?? $response['error_description'] ?? 'Unknown Supabase Admin error';
            throw new RuntimeException('Failed to create Supabase Auth user: ' . $msg);
        }

        return $response;
    }

    /**
     * Deletes a Supabase Auth user via the backend Admin API.
     * Used for compensating cleanup when database transaction fails.
     *
     * @param string $userId Supabase Auth UUID
     * @return bool
     */
    public function deleteUser(string $userId): bool
    {
        $authId = trim($userId);
        if ($authId === '' || ! $this->isConfigured()) {
            return false;
        }

        $endpoint = $this->projectUrl . '/auth/v1/admin/users/' . urlencode($authId);

        try {
            $this->sendRequest('DELETE', $endpoint);
            return true;
        } catch (Throwable $e) {
            log_message('error', sprintf('CRITICAL: Orphan Auth user [%s] cleanup failed: %s', $authId, $e->getMessage()));
            return false;
        }
    }

    /**
     * Sends an HTTP request to the Supabase Admin endpoint.
     */
    protected function sendRequest(string $method, string $url, ?array $body = null): array
    {
        $curl = curl_init();

        $headers = [
            'apikey: ' . $this->serviceRoleKey,
            'Authorization: Bearer ' . $this->serviceRoleKey,
            'Content-Type: application/json',
        ];

        $options = [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 15,
            CURLOPT_SSL_VERIFYPEER => true,
        ];

        if ($body !== null && in_array($method, ['POST', 'PUT', 'PATCH'], true)) {
            $options[CURLOPT_POSTFIELDS] = json_encode($body);
        }

        curl_setopt_array($curl, $options);

        $rawResponse = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $error = curl_error($curl);
        curl_close($curl);

        if ($rawResponse === false) {
            throw new RuntimeException('cURL request failed: ' . $error);
        }

        $decoded = json_decode($rawResponse, true);
        if (! is_array($decoded)) {
            if ($httpCode >= 200 && $httpCode < 300) {
                return ['success' => true, 'status' => $httpCode];
            }
            throw new RuntimeException(sprintf('Supabase Admin returned HTTP %d: %s', $httpCode, $rawResponse));
        }

        if ($httpCode >= 400) {
            $errorMsg = $decoded['msg'] ?? $decoded['message'] ?? $decoded['error'] ?? 'API error with code ' . $httpCode;
            throw new RuntimeException($errorMsg, $httpCode);
        }

        return $decoded;
    }
}
