<?php

namespace App\Services;

use App\Helpers\ValidationHelper;
use RuntimeException;

final class ProductionDemoAdminBootstrapConfig
{
    public const CONFIRMATION = 'CREATE_TWO_PRODUCTION_DEMO_ADMINS';
    public const STAGING_CONFIRMATION = 'CREATE_TWO_STAGING_DEMO_ADMINS';

    /**
     * @param array<string, string|null> $values
     * @return array{target: string, hr_password: string, osad_password: string}
     */
    public function validate(array $values): array
    {
        $target = strtolower(trim((string) ($values['ACHIEVENEST_BOOTSTRAP_TARGET'] ?? '')));
        if (! in_array($target, ['staging', 'production'], true)) {
            throw new RuntimeException('Bootstrap target must be exactly staging or production.');
        }

        if (($values['CI_ENVIRONMENT'] ?? '') !== 'production') {
            throw new RuntimeException(
                'Hosted demo-admin bootstrap requires CI_ENVIRONMENT=production so framework debug output remains disabled.'
            );
        }

        if (($values['ACHIEVENEST_ENV'] ?? '') !== $target) {
            throw new RuntimeException('Bootstrap target must match ACHIEVENEST_ENV.');
        }

        $expectedRailwayEnvironment = strtolower(trim((string) ($values['ACHIEVENEST_BOOTSTRAP_EXPECTED_RAILWAY_ENVIRONMENT'] ?? '')));
        $actualRailwayEnvironment = strtolower(trim((string) ($values['RAILWAY_ENVIRONMENT_NAME'] ?? '')));
        if ($expectedRailwayEnvironment === '' || $actualRailwayEnvironment !== $expectedRailwayEnvironment) {
            throw new RuntimeException('RAILWAY_ENVIRONMENT_NAME must match the explicitly expected Railway environment.');
        }
        if (($target === 'production') !== ($expectedRailwayEnvironment === 'production')) {
            throw new RuntimeException('Only the production target may name the production Railway environment.');
        }

        $expectedConfirmation = $target === 'production' ? self::CONFIRMATION : self::STAGING_CONFIRMATION;
        if (! hash_equals($expectedConfirmation, (string) ($values['ACHIEVENEST_BOOTSTRAP_CONFIRM'] ?? ''))) {
            throw new RuntimeException('Production demo-admin bootstrap confirmation is missing or invalid.');
        }

        $hrPassword = trim((string) ($values['ACHIEVENEST_BOOTSTRAP_HR_PASSWORD'] ?? ''));
        $osadPassword = trim((string) ($values['ACHIEVENEST_BOOTSTRAP_OSAD_PASSWORD'] ?? ''));
        if (! ValidationHelper::validatePasswordPolicy($hrPassword)
            || ! ValidationHelper::validatePasswordPolicy($osadPassword)) {
            throw new RuntimeException(
                'Each bootstrap password must satisfy the authoritative uppercase, lowercase, number, and special-character policy.'
            );
        }

        if (hash_equals($hrPassword, $osadPassword)) {
            throw new RuntimeException('The HR and OSAD bootstrap passwords must be different.');
        }

        $sharedDemoPassword = trim((string) ($values['ACHIEVENEST_DEMO_PASSWORD'] ?? ''));
        if ($sharedDemoPassword !== ''
            && (hash_equals($sharedDemoPassword, $hrPassword) || hash_equals($sharedDemoPassword, $osadPassword))) {
            throw new RuntimeException('The shared staging demo password must not be reused for production bootstrap accounts.');
        }

        return [
            'target' => $target,
            'hr_password' => $hrPassword,
            'osad_password' => $osadPassword,
        ];
    }
}
