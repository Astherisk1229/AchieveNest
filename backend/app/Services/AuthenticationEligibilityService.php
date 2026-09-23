<?php

namespace App\Services;

/**
 * Provider-neutral authentication eligibility for an already-resolved profile.
 *
 * This service deliberately performs no identity proof, role lookup, persistence,
 * audit logging, or session/token creation. AccountLifecycleResolver remains the
 * authority for lifecycle classification.
 */
class AuthenticationEligibilityService
{
    public const CODE_ELIGIBLE            = 'AUTH_ELIGIBLE';
    public const CODE_PENDING_FIRST_LOGIN = 'AUTH_PENDING_FIRST_LOGIN';
    public const CODE_ACCOUNT_SUSPENDED   = 'AUTH_ACCOUNT_SUSPENDED';
    public const CODE_ACCOUNT_ARCHIVED    = 'AUTH_ACCOUNT_ARCHIVED';
    public const CODE_ACCOUNT_DISABLED    = 'AUTH_ACCOUNT_DISABLED';
    public const CODE_ACCOUNT_LOCKED      = 'AUTH_ACCOUNT_LOCKED';
    public const CODE_ACCOUNT_UNKNOWN     = 'AUTH_ACCOUNT_UNKNOWN';

    /**
     * Evaluate local account eligibility without proving identity or creating a session.
     *
     * The input is a resolved profile/account-state projection. It accepts the native
     * profile `status` field plus the lifecycle metadata `must_change_password`,
     * optional `is_locked`, and optional `credential_integrity_status`.
     *
     * @return array{
     *   eligible: bool,
     *   code: string,
     *   lifecycle_state: string,
     *   must_change_password: ?bool,
     *   reason: string,
     *   administrative_status: string,
     *   credential_integrity_status: string,
     *   can_access_protected_portal: bool,
     *   required_next_action: string
     * }
     */
    public function evaluate(array $profile): array
    {
        $lifecycle = AccountLifecycleResolver::resolve(
            isset($profile['status']) ? (string) $profile['status'] : null,
            $profile['must_change_password'] ?? null,
            $this->lockState($profile['is_locked'] ?? false),
            isset($profile['credential_integrity_status'])
                ? (string) $profile['credential_integrity_status']
                : null
        );

        $state = $lifecycle['account_lifecycle_status'];
        [$code, $reason] = $this->decisionFor($state);

        return [
            'eligible'                    => $lifecycle['can_authenticate'] === true,
            'code'                        => $code,
            'lifecycle_state'             => $state,
            'must_change_password'        => $lifecycle['must_change_password'],
            'reason'                      => $reason,
            'administrative_status'       => $lifecycle['administrative_status'],
            'credential_integrity_status' => $lifecycle['credential_integrity_status'],
            'can_access_protected_portal' => $lifecycle['can_access_protected_portal'] === true,
            'required_next_action'        => $lifecycle['required_next_action'],
        ];
    }

    private function lockState(mixed $value): ?bool
    {
        if ($value === null || is_bool($value)) {
            return $value;
        }

        if (in_array($value, [0, '0'], true)) {
            return false;
        }

        if (in_array($value, [1, '1'], true)) {
            return true;
        }

        // An invalid lock value must not accidentally create an unlocked account.
        return true;
    }

    /** @return array{0: string, 1: string} */
    private function decisionFor(string $state): array
    {
        return match ($state) {
            AccountLifecycleResolver::STATUS_ACTIVE => [
                self::CODE_ELIGIBLE,
                'Account is eligible to authenticate.',
            ],
            AccountLifecycleResolver::STATUS_PENDING_FIRST_LOGIN => [
                self::CODE_PENDING_FIRST_LOGIN,
                'Account may authenticate but must change its password before protected portal access.',
            ],
            AccountLifecycleResolver::STATUS_SUSPENDED => [
                self::CODE_ACCOUNT_SUSPENDED,
                'Account is suspended.',
            ],
            AccountLifecycleResolver::STATUS_ARCHIVED => [
                self::CODE_ACCOUNT_ARCHIVED,
                'Account is archived.',
            ],
            AccountLifecycleResolver::STATUS_DISABLED => [
                self::CODE_ACCOUNT_DISABLED,
                'Account is disabled.',
            ],
            AccountLifecycleResolver::STATUS_LOCKED => [
                self::CODE_ACCOUNT_LOCKED,
                'Account is locked.',
            ],
            default => [
                self::CODE_ACCOUNT_UNKNOWN,
                'Account lifecycle is unknown or invalid.',
            ],
        };
    }
}
