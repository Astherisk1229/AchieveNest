<?php

namespace App\Services;

/**
 * AccountLifecycleResolver
 * 
 * Single authoritative backend resolver for deriving account lifecycle states.
 * Combines administrative access status (profiles.status) with canonical credential state (local_auth_credentials.must_change_password).
 * 
 * Rules:
 * 1. Missing / null / invalid credential inputs fail closed -> 'unknown' lifecycle, 'missing'/'invalid' integrity.
 * 2. Administrative restrictions (suspended, archived, disabled) take top precedence for valid credentials.
 * 3. Explicit lock state takes second precedence for valid credentials.
 * 4. If administrative status is 'active' and must_change_password is true -> 'pending_first_login'
 * 5. If administrative status is 'active' and must_change_password is false -> 'active'
 * 6. Any unsupported/unknown status fails closed -> 'unknown'
 */
class AccountLifecycleResolver
{
    public const STATUS_PENDING_FIRST_LOGIN = 'pending_first_login';
    public const STATUS_ACTIVE              = 'active';
    public const STATUS_SUSPENDED           = 'suspended';
    public const STATUS_ARCHIVED            = 'archived';
    public const STATUS_DISABLED            = 'disabled';
    public const STATUS_LOCKED              = 'locked';
    public const STATUS_UNKNOWN             = 'unknown';

    public const ACTION_CHANGE_PASSWORD       = 'change_password';
    public const ACTION_CONTACT_ADMINISTRATOR = 'contact_administrator';
    public const ACTION_NONE                  = 'none';

    public const INTEGRITY_VALID     = 'valid';
    public const INTEGRITY_MISSING   = 'missing';
    public const INTEGRITY_INVALID   = 'invalid';
    public const INTEGRITY_DUPLICATE = 'duplicate';

    /**
     * Resolves the canonical account lifecycle dictionary.
     *
     * @param string|null $profileStatus Administrative status from profiles.status
     * @param mixed       $mustChangePassword Canonical boolean / tinyint flag from local_auth_credentials (or null if missing)
     * @param bool|null   $isLocked Optional lock flag
     * @param string|null $explicitIntegrity Optional explicit integrity status ('missing', 'invalid', 'duplicate', 'valid')
     * @return array
     */
    public static function resolve(
        ?string $profileStatus,
        mixed $mustChangePassword,
        ?bool $isLocked = false,
        ?string $explicitIntegrity = null
    ): array {
        $normalizedStatus = $profileStatus !== null ? strtolower(trim($profileStatus)) : null;

        // 1. Missing or invalid credential handling (Fail-closed)
        if ($explicitIntegrity === self::INTEGRITY_DUPLICATE) {
            return [
                'account_lifecycle_status'    => self::STATUS_UNKNOWN,
                'administrative_status'       => $normalizedStatus ?? 'unknown',
                'credential_integrity_status'=> self::INTEGRITY_DUPLICATE,
                'must_change_password'        => null,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        if ($explicitIntegrity === self::INTEGRITY_MISSING || $mustChangePassword === null) {
            return [
                'account_lifecycle_status'    => self::STATUS_UNKNOWN,
                'administrative_status'       => $normalizedStatus ?? 'unknown',
                'credential_integrity_status'=> self::INTEGRITY_MISSING,
                'must_change_password'        => null,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        if (! is_bool($mustChangePassword) && ! in_array($mustChangePassword, [0, 1, '0', '1'], true)) {
            return [
                'account_lifecycle_status'    => self::STATUS_UNKNOWN,
                'administrative_status'       => $normalizedStatus ?? 'unknown',
                'credential_integrity_status'=> self::INTEGRITY_INVALID,
                'must_change_password'        => null,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        $mustChange = (bool) (is_numeric($mustChangePassword) ? (int) $mustChangePassword : $mustChangePassword);

        // 2. Administrative denial states take absolute precedence for valid credentials
        if ($normalizedStatus === 'suspended') {
            return [
                'account_lifecycle_status'    => self::STATUS_SUSPENDED,
                'administrative_status'       => 'suspended',
                'credential_integrity_status'=> self::INTEGRITY_VALID,
                'must_change_password'        => $mustChange,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        if ($normalizedStatus === 'archived') {
            return [
                'account_lifecycle_status'    => self::STATUS_ARCHIVED,
                'administrative_status'       => 'archived',
                'credential_integrity_status'=> self::INTEGRITY_VALID,
                'must_change_password'        => $mustChange,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        if ($normalizedStatus === 'disabled') {
            return [
                'account_lifecycle_status'    => self::STATUS_DISABLED,
                'administrative_status'       => 'disabled',
                'credential_integrity_status'=> self::INTEGRITY_VALID,
                'must_change_password'        => $mustChange,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        // 3. Lock state precedence
        if ($isLocked === true) {
            return [
                'account_lifecycle_status'    => self::STATUS_LOCKED,
                'administrative_status'       => $normalizedStatus ?? 'unknown',
                'credential_integrity_status'=> self::INTEGRITY_VALID,
                'must_change_password'        => $mustChange,
                'can_authenticate'            => false,
                'can_access_protected_portal' => false,
                'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
            ];
        }

        // 4. Active administrative status: evaluate must_change_password
        if ($normalizedStatus === 'active') {
            if ($mustChange) {
                return [
                    'account_lifecycle_status'    => self::STATUS_PENDING_FIRST_LOGIN,
                    'administrative_status'       => 'active',
                    'credential_integrity_status'=> self::INTEGRITY_VALID,
                    'must_change_password'        => true,
                    'can_authenticate'            => true,
                    'can_access_protected_portal' => false,
                    'required_next_action'        => self::ACTION_CHANGE_PASSWORD,
                ];
            }

            return [
                'account_lifecycle_status'    => self::STATUS_ACTIVE,
                'administrative_status'       => 'active',
                'credential_integrity_status'=> self::INTEGRITY_VALID,
                'must_change_password'        => false,
                'can_authenticate'            => true,
                'can_access_protected_portal' => true,
                'required_next_action'        => self::ACTION_NONE,
            ];
        }

        // 5. Fallback for unsupported status: fail closed
        return [
            'account_lifecycle_status'    => self::STATUS_UNKNOWN,
            'administrative_status'       => $normalizedStatus ?? 'unknown',
            'credential_integrity_status'=> self::INTEGRITY_VALID,
            'must_change_password'        => $mustChange,
            'can_authenticate'            => false,
            'can_access_protected_portal' => false,
            'required_next_action'        => self::ACTION_CONTACT_ADMINISTRATOR,
        ];
    }
}
