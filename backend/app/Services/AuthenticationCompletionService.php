<?php

namespace App\Services;

use Throwable;

/**
 * Completes an already-proven and eligible authentication by issuing the
 * standard AchieveNest token/session and assembling the existing login result.
 *
 * Identity proof, profile resolution, eligibility evaluation, provider-link
 * persistence, and success auditing remain responsibilities of the caller.
 */
class AuthenticationCompletionService
{
    private LocalTokenService $tokenService;

    public function __construct(?LocalTokenService $tokenService = null)
    {
        $this->tokenService = $tokenService ?? new LocalTokenService();
    }

    /**
     * @param array $profile Resolved local profile containing its stable `id`.
     * @param array $eligibility Result from AuthenticationEligibilityService.
     * @param array $options Supported keys: remember_me, ip, user_agent.
     * @return array Existing LocalAuthService-style success or controlled failure.
     */
    public function complete(array $profile, array $eligibility, array $options = []): array
    {
        $profileId = trim((string) ($profile['id'] ?? ''));
        if ($profileId === '') {
            return $this->failure(
                500,
                'AUTH_COMPLETION_INVALID_PROFILE',
                'Authentication completion requires a resolved local profile.'
            );
        }

        $lifecycleState = (string) ($eligibility['lifecycle_state'] ?? 'unknown');
        $allowedLifecycle = in_array($lifecycleState, [
            AccountLifecycleResolver::STATUS_ACTIVE,
            AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN,
        ], true);

        if (($eligibility['eligible'] ?? false) !== true || ! $allowedLifecycle) {
            return $this->failure(
                403,
                (string) ($eligibility['code'] ?? AuthenticationEligibilityService::CODE_ACCOUNT_UNKNOWN),
                'The local account is not eligible to authenticate.'
            );
        }

        $rememberMe = ($options['remember_me'] ?? false) === true;
        $ip = isset($options['ip']) ? (string) $options['ip'] : null;
        $userAgent = isset($options['user_agent']) ? (string) $options['user_agent'] : null;

        try {
            // LocalTokenService owns both JWT signing and local_auth_sessions persistence.
            $tokenData = $this->tokenService->issueToken($profileId, $rememberMe, $ip, $userAgent);
        } catch (Throwable) {
            return $this->failure(
                500,
                'AUTH_TOKEN_ERROR',
                'Failed to issue authentication token.'
            );
        }

        return [
            'success' => true,
            'status'  => 200,
            'data'    => [
                'access_token'             => $tokenData['access_token'],
                'token_type'               => $tokenData['token_type'],
                'expires_at'               => $tokenData['expires_at'],
                'expires_in'               => $tokenData['expires_in'],
                'must_change_password'     => $eligibility['must_change_password'] ?? null,
                'account_lifecycle_status' => $lifecycleState,
                'administrative_status'    => $eligibility['administrative_status'] ?? 'unknown',
                'required_next_action'     => $eligibility['required_next_action'] ?? AccountLifecycleResolver::ACTION_CONTACT_ADMINISTRATOR,
                'user_id'                  => $profileId,
            ],
        ];
    }

    private function failure(int $status, string $code, string $message): array
    {
        return [
            'success' => false,
            'status'  => $status,
            'error'   => [
                'code'    => $code,
                'message' => $message,
            ],
        ];
    }
}
