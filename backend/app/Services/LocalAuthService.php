<?php

namespace App\Services;

use App\Helpers\ValidationHelper;
use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

class LocalAuthService
{
    protected LocalTokenService $tokenService;
    protected AuthenticationEligibilityService $eligibilityService;
    protected AuthenticationCompletionService $completionService;
    protected ?BaseConnection $db;

    public function __construct(
        ?LocalTokenService $tokenService = null,
        ?AuthenticationEligibilityService $eligibilityService = null,
        ?AuthenticationCompletionService $completionService = null,
        ?BaseConnection $db = null
    ) {
        $this->tokenService = $tokenService ?? new LocalTokenService();
        $this->eligibilityService = $eligibilityService ?? new AuthenticationEligibilityService();
        $this->completionService = $completionService ?? new AuthenticationCompletionService($this->tokenService);
        $this->db = $db;
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

        $db = $this->db ?? db_connect();

        // 1. Resolve profile by institutional email
        $profile = $db->table('profiles')
            ->where('email', $normalizedEmail)
            ->get()
            ->getRowArray();

        if ($profile === null) {
            $this->logAuthFailure($db, null, 'INVALID_CREDENTIALS', 'Invalid email or password.', $ip);
            return [
                'success' => false,
                'status'  => 401,
                'error'   => [
                    'code'    => 'INVALID_CREDENTIALS',
                    'message' => 'Invalid email or password.',
                ],
            ];
        }

        // 2. Resolve password hash strictly from local_auth_credentials
        $credential = $db->table('local_auth_credentials')
            ->where('profile_id', $profile['id'])
            ->get()
            ->getRowArray();

        if ($credential === null) {
            $this->logAuthFailure($db, $profile['id'], 'MISSING_CREDENTIALS', 'Missing local auth credential.', $ip);
            return [
                'success' => false,
                'status'  => 401,
                'error'   => [
                    'code'    => 'INVALID_CREDENTIALS',
                    'message' => 'Invalid email or password.',
                ],
            ];
        }

        $hash = $credential['password_hash'] ?? '';

        $credentialStatus = (string) ($credential['status'] ?? 'active');
        if ($credentialStatus !== 'active' && $credentialStatus !== 'locked') {
            $this->logAuthFailure($db, $profile['id'], 'CREDENTIAL_DISABLED', 'Credential disabled.', $ip);
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
            $this->logAuthFailure($db, $profile['id'], 'INVALID_PASSWORD', 'Invalid password supplied.', $ip);
            return [
                'success' => false,
                'status'  => 401,
                'error'   => [
                    'code'    => 'INVALID_CREDENTIALS',
                    'message' => 'Invalid email or password.',
                ],
            ];
        }

        // 4. Delegate provider-neutral lifecycle eligibility after password proof.
        $eligibility = $this->eligibilityService->evaluate(array_merge($profile, [
            'must_change_password' => $credential['must_change_password'] ?? null,
            'is_locked' => $credentialStatus === 'locked',
        ]));

        if ($eligibility['eligible'] !== true) {
            return $this->deniedEligibilityResult($db, $profile, $eligibility, $credentialStatus, $ip);
        }

        // 5. Delegate shared JWT issuance, session persistence, and response assembly.
        $completion = $this->completionService->complete($profile, $eligibility, [
            'remember_me' => $rememberMe,
            'authentication_method' => 'password',
            'ip' => $ip,
            'user_agent' => $userAgent,
        ]);

        if (($completion['success'] ?? false) !== true) {
            return $completion;
        }

        // 6. Record the password-flow success audit exactly once, after completion.
        $isFirstLogin = (bool) ($eligibility['must_change_password'] ?? false);
        $logId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
        $db->table('audit_logs')->insert([
            'id'               => $logId,
            'actor_profile_id' => $profile['id'],
            'event_code'       => $isFirstLogin ? 'AUTH_FIRST_LOGIN_SUCCESS' : 'AUTH_LOGIN_SUCCESS',
            'category'         => 'auth',
            'target_type'      => 'profile',
            'target_id'        => $profile['id'],
            'outcome'          => 'success',
            'ip_address'       => $ip,
            'details'          => $isFirstLogin ? 'First login with temporary credentials successful. Password change required.' : 'User authentication successful.',
            'safe_context'     => json_encode(['auth_mode' => 'local-defense', 'first_login' => $isFirstLogin]),
        ]);

        return $completion;
    }

    private function deniedEligibilityResult(
        $db,
        array $profile,
        array $eligibility,
        string $credentialStatus,
        ?string $ip
    ): array {
        $state = $eligibility['lifecycle_state'] ?? AccountLifecycleResolver::STATUS_UNKNOWN;

        if ($state === AccountLifecycleResolver::STATUS_SUSPENDED) {
            $this->logAuthFailure($db, $profile['id'], 'ACCOUNT_SUSPENDED', 'Account suspended.', $ip);
            return [
                'success' => false,
                'status' => 403,
                'error' => [
                    'code' => 'ACCOUNT_SUSPENDED',
                    'message' => 'This account has been suspended. Please contact administration.',
                ],
            ];
        }

        if ($state === AccountLifecycleResolver::STATUS_ARCHIVED) {
            $this->logAuthFailure($db, $profile['id'], 'ACCOUNT_ARCHIVED', 'Account archived.', $ip);
            return [
                'success' => false,
                'status' => 403,
                'error' => [
                    'code' => 'ACCOUNT_ARCHIVED',
                    'message' => 'This account has been archived and cannot log in.',
                ],
            ];
        }

        if ($state === AccountLifecycleResolver::STATUS_LOCKED && $credentialStatus === 'locked') {
            $this->logAuthFailure($db, $profile['id'], 'CREDENTIAL_DISABLED', 'Credential disabled.', $ip);
            return [
                'success' => false,
                'status' => 403,
                'error' => [
                    'code' => 'CREDENTIAL_DISABLED',
                    'message' => 'Local authentication credential is disabled.',
                ],
            ];
        }

        $this->logAuthFailure($db, $profile['id'], 'ACCOUNT_RESTRICTED', 'Account restricted from authentication.', $ip);
        return [
            'success' => false,
            'status' => 403,
            'error' => [
                'code' => 'ACCOUNT_RESTRICTED',
                'message' => 'Your account cannot authenticate at this time.',
            ],
        ];
    }

    /**
     * Updates an authenticated user's password, clears must_change_password flag, revokes prior sessions, and issues a fresh session.
     */
    public function changePassword(
        string $profileId,
        string $newPassword,
        ?string $currentPassword = null,
        ?string $ip = null,
        ?string $userAgent = null
    ): array {
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

        if (! ValidationHelper::validatePasswordPolicy($newPassword)) {
            return [
                'success' => false,
                'status'  => 422,
                'error'   => [
                    'code'    => 'INVALID_PASSWORD_POLICY',
                    'message' => 'New password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character.',
                ],
            ];
        }

        if ($currentPassword !== null && $currentPassword !== '' && $currentPassword === $newPassword) {
            return [
                'success' => false,
                'status'  => 422,
                'error'   => [
                    'code'    => 'PASSWORD_REUSE_FORBIDDEN',
                    'message' => 'New password cannot be the same as your temporary password.',
                ],
            ];
        }

        $db = db_connect();
        $db->transStart();

        // 1. Lock and inspect canonical credential row
        $credRow = $db->query(
            "SELECT * FROM local_auth_credentials WHERE profile_id = ? FOR UPDATE",
            [$profileId]
        )->getRowArray();

        if ($credRow !== null && $currentPassword !== null && $currentPassword !== '') {
            if (! password_verify($currentPassword, $credRow['password_hash'])) {
                $db->transRollback();
                return [
                    'success' => false,
                    'status'  => 422,
                    'error'   => [
                        'code'    => 'INCORRECT_CURRENT_PASSWORD',
                        'message' => 'The current temporary password is incorrect.',
                    ],
                ];
            }
        }

        $newHash = password_hash($newPassword, PASSWORD_DEFAULT);

        // 2. Update profiles table
        $db->table('profiles')
            ->where('id', $profileId)
            ->update([
                'password_hash' => $newHash,
                'updated_at'    => date('Y-m-d H:i:s.u'),
            ]);

        // 3. Update local_auth_credentials table (canonical authority for must_change_password)
        if ($credRow !== null) {
            $db->table('local_auth_credentials')
                ->where('profile_id', $profileId)
                ->update([
                    'password_hash'        => $newHash,
                    'must_change_password' => 0,
                    'password_changed_at'  => date('Y-m-d H:i:s.u'),
                    'updated_at'           => date('Y-m-d H:i:s.u'),
                ]);
        } else {
            $db->table('local_auth_credentials')->insert([
                'profile_id'           => $profileId,
                'password_hash'        => $newHash,
                'must_change_password' => 0,
                'password_changed_at'  => date('Y-m-d H:i:s.u'),
                'status'               => 'active',
                'created_at'           => date('Y-m-d H:i:s.u'),
                'updated_at'           => date('Y-m-d H:i:s.u'),
            ]);
        }

        // 4. Revoke prior active sessions
        $this->tokenService->revokeAllSessionsForProfile($profileId, 'password_change');

        // 5. Issue fresh post-change session
        $tokenData = $this->tokenService->issueToken($profileId, false, $ip, $userAgent);

        // 6. Log security audit events
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
            'details'          => 'User password change completed successfully.',
            'safe_context'     => json_encode(['auth_mode' => 'local-defense']),
        ]);

        $actLogId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
        $db->table('audit_logs')->insert([
            'id'               => $actLogId,
            'actor_profile_id' => $profileId,
            'event_code'       => 'ACCOUNT_ACTIVATED',
            'category'         => 'lifecycle',
            'target_type'      => 'profile',
            'target_id'        => $profileId,
            'outcome'          => 'success',
            'ip_address'       => $ip,
            'details'          => 'Account activated upon first login password establishment.',
            'safe_context'     => json_encode(['auth_mode' => 'local-defense', 'prior_state' => 'pending_first_login', 'new_state' => 'active']),
        ]);

        $db->table('account_lifecycle_events')->insert([
            'id'               => sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff)),
            'profile_id'       => $profileId,
            'actor_profile_id' => $profileId,
            'event_type'       => 'activated',
            'previous_status'  => 'pending_first_login',
            'new_status'       => 'active',
            'reason'           => 'First login password change completed and account fully activated',
            'occurred_at'      => date('Y-m-d H:i:s'),
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
                'message'                  => 'Password has been updated successfully.',
                'access_token'             => $tokenData['access_token'],
                'must_change_password'     => false,
                'account_lifecycle_status' => AccountLifecycleResolver::STATUS_ACTIVE,
                'administrative_status'    => 'active',
                'credential_integrity_status' => 'valid',
                'required_next_action'     => AccountLifecycleResolver::ACTION_NONE,
                'can_authenticate'         => true,
                'can_access_protected_portal' => true,
                'session'                  => $tokenData,
                'account'                  => [
                    'account_lifecycle_status' => AccountLifecycleResolver::STATUS_ACTIVE,
                    'administrative_status'    => 'active',
                    'credential_integrity_status' => 'valid',
                    'must_change_password'     => false,
                    'required_next_action'     => AccountLifecycleResolver::ACTION_NONE,
                    'can_authenticate'         => true,
                    'can_access_protected_portal' => true,
                ],
            ],
        ];
    }

    /**
     * Administrator-initiated password reset: generates temporary password, sets must_change_password = 1, revokes sessions.
     */
    public function adminResetPassword(string $actorId, string $targetProfileId, ?string $ip = null): array
    {
        $db = db_connect();
        $db->transStart();

        // 1. Lock and inspect target profile
        $targetProfile = $db->query(
            "SELECT * FROM profiles WHERE id = ? FOR UPDATE",
            [$targetProfileId]
        )->getRowArray();

        if ($targetProfile === null) {
            $db->transRollback();
            return [
                'success' => false,
                'status'  => 404,
                'error'   => [
                    'code'    => 'TARGET_PROFILE_NOT_FOUND',
                    'message' => 'The target profile could not be found.',
                ],
            ];
        }

        if (($targetProfile['status'] ?? '') !== 'active') {
            $db->transRollback();
            return [
                'success' => false,
                'status'  => 422,
                'error'   => [
                    'code'    => 'TARGET_INACTIVE_OR_SUSPENDED',
                    'message' => 'Cannot reset password for suspended, disabled, or archived accounts.',
                ],
            ];
        }

        // 2. Lock and inspect canonical credential row
        $credRow = $db->query(
            "SELECT * FROM local_auth_credentials WHERE profile_id = ? FOR UPDATE",
            [$targetProfileId]
        )->getRowArray();

        $temporaryPassword = ValidationHelper::generateTemporaryPassword();
        $newHash = password_hash($temporaryPassword, PASSWORD_DEFAULT);

        $db->table('profiles')
            ->where('id', $targetProfileId)
            ->update([
                'password_hash' => $newHash,
                'updated_at'    => date('Y-m-d H:i:s.u'),
            ]);

        if ($credRow !== null) {
            $db->table('local_auth_credentials')
                ->where('profile_id', $targetProfileId)
                ->update([
                    'password_hash'        => $newHash,
                    'must_change_password' => 1,
                    'password_changed_at'  => date('Y-m-d H:i:s.u'),
                    'updated_at'           => date('Y-m-d H:i:s.u'),
                ]);
        } else {
            $db->table('local_auth_credentials')->insert([
                'profile_id'           => $targetProfileId,
                'password_hash'        => $newHash,
                'must_change_password' => 1,
                'password_changed_at'  => date('Y-m-d H:i:s.u'),
                'status'               => 'active',
                'created_at'           => date('Y-m-d H:i:s.u'),
                'updated_at'           => date('Y-m-d H:i:s.u'),
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

        $lifecycle = AccountLifecycleResolver::resolve(
            $targetProfile['status'] ?? 'active',
            1
        );

        return [
            'success' => true,
            'status'  => 200,
            'data'    => [
                'action'                      => 'administrative_reset',
                'temporary_password'          => $temporaryPassword,
                'profile_id'                  => $targetProfileId,
                'institutional_id'            => (string) ($targetProfile['institutional_id'] ?? ''),
                'institutional_email'         => (string) ($targetProfile['email'] ?? ''),
                'full_name'                   => (string) ($targetProfile['full_name'] ?? ''),
                'owner_type'                  => (string) ($targetProfile['account_type'] ?? 'student'),
                'must_change_password'        => true,
                'account_lifecycle_status'    => $lifecycle['account_lifecycle_status'],
                'administrative_status'       => $lifecycle['administrative_status'],
                'credential_integrity_status' => 'valid',
                'required_next_action'        => $lifecycle['required_next_action'],
                'can_authenticate'            => true,
                'can_access_protected_portal' => false,
            ],
        ];
    }

    private function logAuthFailure($db, ?string $profileId, string $code, string $details, ?string $ip): void
    {
        try {
            $logId = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x', random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0x0fff) | 0x4000, random_int(0, 0x3fff) | 0x8000, random_int(0, 0xffff), random_int(0, 0xffff), random_int(0, 0xffff));
            $db->table('audit_logs')->insert([
                'id'               => $logId,
                'actor_profile_id' => $profileId,
                'event_code'       => 'AUTH_LOGIN_FAILED',
                'category'         => 'auth',
                'target_type'      => 'profile',
                'target_id'        => $profileId,
                'outcome'          => 'failure',
                'ip_address'       => $ip,
                'details'          => $details,
                'safe_context'     => json_encode(['auth_mode' => 'local-defense', 'failure_code' => $code]),
            ]);
        } catch (Throwable $e) {
            // Non-blocking log failure
        }
    }
}
