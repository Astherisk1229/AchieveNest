<?php

namespace App\Services;

use RuntimeException;
use Throwable;

class LocalAuthService
{
    protected LocalTokenService $tokenService;

    public function __construct(?LocalTokenService $tokenService = null)
    {
        $this->tokenService = $tokenService ?? new LocalTokenService();
    }

    /**
     * Authenticates an institutional email and password in local-defense mode.
     */
    public function login(
        string $email,
        string $password,
        bool $rememberMe = false,
        ?string $ip = null,
        ?string $userAgent = null
    ): array {
        $normalizedEmail = strtolower(trim($email));

        if ($normalizedEmail === '' || $password === '') {
            return [
                'success' => false,
                'status'  => 422,
                'error'   => [
                    'code'    => 'VALIDATION_ERROR',
                    'message' => 'Institutional email and password are required.',
                ],
            ];
        }

        if (! filter_var($normalizedEmail, FILTER_VALIDATE_EMAIL) || ! str_ends_with($normalizedEmail, '@ndmu.edu.ph')) {
            return [
                'success' => false,
                'status'  => 422,
                'error'   => [
                    'code'    => 'INVALID_INSTITUTIONAL_EMAIL',
                    'message' => 'Only institutional email addresses ending with @ndmu.edu.ph are allowed.',
                ],
            ];
        }

        $db = db_connect();

        // 1. Resolve profile by institutional email
        $profile = $db->table('profiles')
            ->where('email', $normalizedEmail)
            ->get()
            ->getRowArray();

        if ($profile === null) {
            return [
                'success' => false,
                'status'  => 401,
                'error'   => [
                    'code'    => 'INVALID_CREDENTIALS',
                    'message' => 'Invalid email or password.',
                ],
            ];
        }

        // 2. Check profile lifecycle status
        $status = $profile['status'] ?? 'active';
        if ($status === 'suspended') {
            return [
                'success' => false,
                'status'  => 403,
                'error'   => [
                    'code'    => 'ACCOUNT_SUSPENDED',
                    'message' => 'This account has been suspended. Please contact administration.',
                ],
            ];
        }

        if ($status === 'archived') {
            return [
                'success' => false,
                'status'  => 403,
                'error'   => [
                    'code'    => 'ACCOUNT_ARCHIVED',
                    'message' => 'This account has been archived and cannot log in.',
                ],
            ];
        }

        // 3. Resolve password hash from local_auth_credentials or profiles
        $credential = $db->table('local_auth_credentials')
            ->where('profile_id', $profile['id'])
            ->get()
            ->getRowArray();

        $hash = $credential['password_hash'] ?? ($profile['password_hash'] ?? '');

        if ($credential !== null && ($credential['status'] ?? 'active') !== 'active') {
            return [
                'success' => false,
                'status'  => 403,
                'error'   => [
                    'code'    => 'CREDENTIAL_DISABLED',
                    'message' => 'Local authentication credential is disabled.',
                ],
            ];
        }

        if ($hash === '' || ! password_verify($password, $hash)) {
            return [
                'success' => false,
                'status'  => 401,
                'error'   => [
                    'code'    => 'INVALID_CREDENTIALS',
                    'message' => 'Invalid email or password.',
                ],
            ];
        }

        // 4. Ensure local_auth_credentials record exists and is synced
        if ($credential === null) {
            $db->table('local_auth_credentials')->insert([
                'profile_id'    => $profile['id'],
                'password_hash' => $hash,
                'status'        => 'active',
                'created_at'    => date('Y-m-d H:i:s.u'),
                'updated_at'    => date('Y-m-d H:i:s.u'),
            ]);
        }

        // 5. Issue local token and session
        try {
            $tokenData = $this->tokenService->issueToken($profile['id'], $rememberMe, $ip, $userAgent);
        } catch (Throwable $e) {
            return [
                'success' => false,
                'status'  => 500,
                'error'   => [
                    'code'    => 'AUTH_TOKEN_ERROR',
                    'message' => 'Failed to issue authentication token.',
                ],
            ];
        }

        return [
            'success' => true,
            'status'  => 200,
            'data'    => [
                'access_token'         => $tokenData['access_token'],
                'token_type'           => $tokenData['token_type'],
                'expires_at'           => $tokenData['expires_at'],
                'expires_in'           => $tokenData['expires_in'],
                'must_change_password' => (bool) ($profile['must_change_password'] ?? false),
                'user_id'              => $profile['id'],
            ],
        ];
    }

    /**
     * Updates an authenticated user's password, clears must_change_password flag, and revokes prior sessions.
     */
    public function changePassword(string $profileId, string $newPassword, ?string $ip = null): array
    {
        if (strlen($newPassword) < 8) {
            return [
                'success' => false,
                'status'  => 422,
                'error'   => [
                    'code'    => 'INVALID_PASSWORD_LENGTH',
                    'message' => 'New password must be at least 8 characters long.',
                ],
            ];
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
        $db = db_connect();

        $db->transStart();

        // Update profiles table
        $db->table('profiles')
            ->where('id', $profileId)
            ->update([
                'password_hash'        => $newHash,
                'must_change_password' => 0,
                'updated_at'           => date('Y-m-d H:i:s.u'),
            ]);

        // Update local_auth_credentials table
        $credentialExists = $db->table('local_auth_credentials')
            ->where('profile_id', $profileId)
            ->countAllResults();

        if ($credentialExists > 0) {
            $db->table('local_auth_credentials')
                ->where('profile_id', $profileId)
                ->update([
                    'password_hash'       => $newHash,
                    'password_changed_at' => date('Y-m-d H:i:s.u'),
                    'updated_at'          => date('Y-m-d H:i:s.u'),
                ]);
        } else {
            $db->table('local_auth_credentials')->insert([
                'profile_id'          => $profileId,
                'password_hash'       => $newHash,
                'password_changed_at' => date('Y-m-d H:i:s.u'),
                'status'              => 'active',
                'created_at'          => date('Y-m-d H:i:s.u'),
                'updated_at'          => date('Y-m-d H:i:s.u'),
            ]);
        }

        // Revoke prior active sessions
        $this->tokenService->revokeAllSessionsForProfile($profileId, 'password_change');

        // Log security audit event
        $logId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
        $db->table('audit_logs')->insert([
            'id'               => $logId,
            'actor_profile_id' => $profileId,
            'event_code'       => 'AUTH_PASSWORD_CHANGE_COMPLETED',
            'category'         => 'security',
            'target_type'      => 'profile',
            'target_id'        => $profileId,
            'outcome'          => 'success',
            'ip_address'       => $ip,
            'details'          => 'Mandatory password change completed.',
            'safe_context'     => json_encode(['auth_mode' => 'local-defense']),
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return [
                'success' => false,
                'status'  => 500,
                'error'   => [
                    'code'    => 'PASSWORD_UPDATE_FAILED',
                    'message' => 'Failed to update password transactionally.',
                ],
            ];
        }

        return [
            'success' => true,
            'status'  => 200,
            'data'    => [
                'message'              => 'Password has been updated successfully.',
                'must_change_password' => false,
            ],
        ];
    }

    /**
     * Administrator-initiated password reset: generates temporary password, sets must_change_password = 1, revokes sessions.
     */
    public function adminResetPassword(string $actorId, string $targetProfileId, ?string $ip = null): array
    {
        $temporaryPassword = 'Temp_' . bin2hex(random_bytes(6)) . '!A1';
        $newHash = password_hash($temporaryPassword, PASSWORD_DEFAULT);
        $db = db_connect();

        $db->transStart();

        $db->table('profiles')
            ->where('id', $targetProfileId)
            ->update([
                'password_hash'        => $newHash,
                'must_change_password' => 1,
                'updated_at'           => date('Y-m-d H:i:s.u'),
            ]);

        $credentialExists = $db->table('local_auth_credentials')
            ->where('profile_id', $targetProfileId)
            ->countAllResults();

        if ($credentialExists > 0) {
            $db->table('local_auth_credentials')
                ->where('profile_id', $targetProfileId)
                ->update([
                    'password_hash'       => $newHash,
                    'password_changed_at' => date('Y-m-d H:i:s.u'),
                    'updated_at'          => date('Y-m-d H:i:s.u'),
                ]);
        } else {
            $db->table('local_auth_credentials')->insert([
                'profile_id'          => $targetProfileId,
                'password_hash'       => $newHash,
                'password_changed_at' => date('Y-m-d H:i:s.u'),
                'status'              => 'active',
                'created_at'          => date('Y-m-d H:i:s.u'),
                'updated_at'          => date('Y-m-d H:i:s.u'),
            ]);
        }

        $this->tokenService->revokeAllSessionsForProfile($targetProfileId, 'admin_password_reset');

        $logId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
        $db->table('audit_logs')->insert([
            'id'               => $logId,
            'actor_profile_id' => $actorId,
            'event_code'       => 'AUTH_ADMIN_PASSWORD_RESET_COMPLETED',
            'category'         => 'security',
            'target_type'      => 'profile',
            'target_id'        => $targetProfileId,
            'outcome'          => 'success',
            'ip_address'       => $ip,
            'details'          => 'Administrative password reset executed.',
            'safe_context'     => json_encode(['auth_mode' => 'local-defense']),
        ]);

        $db->transComplete();

        if ($db->transStatus() === false) {
            return [
                'success' => false,
                'status'  => 500,
                'error'   => [
                    'code'    => 'PASSWORD_RESET_FAILED',
                    'message' => 'Failed to reset password transactionally.',
                ],
            ];
        }

        return [
            'success' => true,
            'status'  => 200,
            'data'    => [
                'temporary_password'   => $temporaryPassword,
                'must_change_password' => true,
            ],
        ];
    }
}
