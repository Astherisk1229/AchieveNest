<?php

namespace Tests\Unit;

use App\Commands\BootstrapProductionDemoAdmins;
use App\Services\ProductionDemoAdminBootstrapConfig;
use PHPUnit\Framework\TestCase;
use ReflectionClass;
use RuntimeException;

final class ProductionDemoAdminBootstrapConfigTest extends TestCase
{
    private function validValues(): array
    {
        return [
            'CI_ENVIRONMENT' => 'production',
            'ACHIEVENEST_ENV' => 'production',
            'RAILWAY_ENVIRONMENT_NAME' => 'production',
            'ACHIEVENEST_BOOTSTRAP_TARGET' => 'production',
            'ACHIEVENEST_BOOTSTRAP_EXPECTED_RAILWAY_ENVIRONMENT' => 'production',
            'ACHIEVENEST_BOOTSTRAP_CONFIRM' => ProductionDemoAdminBootstrapConfig::CONFIRMATION,
            'ACHIEVENEST_BOOTSTRAP_HR_PASSWORD' => 'Hr-Temporary-2026!',
            'ACHIEVENEST_BOOTSTRAP_OSAD_PASSWORD' => 'Osad-Temporary-2026!',
            'ACHIEVENEST_DEMO_PASSWORD' => 'Shared-Staging-2026!',
        ];
    }

    public function testAcceptsSeparateProductionOnlyPasswords(): void
    {
        $result = (new ProductionDemoAdminBootstrapConfig())->validate($this->validValues());

        $this->assertSame('production', $result['target']);
        $this->assertSame('Hr-Temporary-2026!', $result['hr_password']);
        $this->assertSame('Osad-Temporary-2026!', $result['osad_password']);
    }

    /** @dataProvider invalidConfigurationProvider */
    public function testFailsClosedForInvalidConfiguration(callable $mutate): void
    {
        $values = $this->validValues();
        $mutate($values);

        $this->expectException(RuntimeException::class);
        (new ProductionDemoAdminBootstrapConfig())->validate($values);
    }

    public static function invalidConfigurationProvider(): array
    {
        return [
            'non-production framework environment' => [static function (array &$values): void {
                $values['CI_ENVIRONMENT'] = 'development';
            }],
            'application environment does not match target' => [static function (array &$values): void {
                $values['ACHIEVENEST_ENV'] = 'staging';
            }],
            'Railway environment does not match target' => [static function (array &$values): void {
                $values['RAILWAY_ENVIRONMENT_NAME'] = 'staging';
            }],
            'staging target cannot name production Railway' => [static function (array &$values): void {
                $values['ACHIEVENEST_ENV'] = 'staging';
                $values['ACHIEVENEST_BOOTSTRAP_TARGET'] = 'staging';
                $values['ACHIEVENEST_BOOTSTRAP_CONFIRM'] = ProductionDemoAdminBootstrapConfig::STAGING_CONFIRMATION;
            }],
            'missing confirmation' => [static function (array &$values): void {
                $values['ACHIEVENEST_BOOTSTRAP_CONFIRM'] = '';
            }],
            'weak password' => [static function (array &$values): void {
                $values['ACHIEVENEST_BOOTSTRAP_HR_PASSWORD'] = 'weak';
            }],
            'shared administrator password' => [static function (array &$values): void {
                $values['ACHIEVENEST_BOOTSTRAP_OSAD_PASSWORD'] = $values['ACHIEVENEST_BOOTSTRAP_HR_PASSWORD'];
            }],
            'staging password reuse' => [static function (array &$values): void {
                $values['ACHIEVENEST_BOOTSTRAP_HR_PASSWORD'] = $values['ACHIEVENEST_DEMO_PASSWORD'];
            }],
        ];
    }

    public function testAcceptsDisposableStagingWithStagingConfirmation(): void
    {
        $values = $this->validValues();
        $values['ACHIEVENEST_ENV'] = 'staging';
        $values['RAILWAY_ENVIRONMENT_NAME'] = 'staging';
        $values['ACHIEVENEST_BOOTSTRAP_TARGET'] = 'staging';
        $values['ACHIEVENEST_BOOTSTRAP_EXPECTED_RAILWAY_ENVIRONMENT'] = 'staging';
        $values['ACHIEVENEST_BOOTSTRAP_CONFIRM'] = ProductionDemoAdminBootstrapConfig::STAGING_CONFIRMATION;

        $result = (new ProductionDemoAdminBootstrapConfig())->validate($values);

        $this->assertSame('staging', $result['target']);
    }

    public function testAcceptsExplicitlyNamedDisposableStagingEnvironment(): void
    {
        $values = $this->validValues();
        $values['ACHIEVENEST_ENV'] = 'staging';
        $values['RAILWAY_ENVIRONMENT_NAME'] = 'bootstrap-proof';
        $values['ACHIEVENEST_BOOTSTRAP_TARGET'] = 'staging';
        $values['ACHIEVENEST_BOOTSTRAP_EXPECTED_RAILWAY_ENVIRONMENT'] = 'bootstrap-proof';
        $values['ACHIEVENEST_BOOTSTRAP_CONFIRM'] = ProductionDemoAdminBootstrapConfig::STAGING_CONFIRMATION;

        $result = (new ProductionDemoAdminBootstrapConfig())->validate($values);

        $this->assertSame('staging', $result['target']);
    }

    public function testCliCommandUsesTheExpectedNonHttpName(): void
    {
        $reflection = new ReflectionClass(BootstrapProductionDemoAdmins::class);
        $defaults = $reflection->getDefaultProperties();

        $this->assertSame('accounts:bootstrap-demo-admins', $defaults['name']);
        $this->assertNotSame(
            'd0000000-0000-0000-0001-000000000005',
            $reflection->getReflectionConstant('HR_PROFILE_ID')->getValue()
        );
        $this->assertNotSame(
            $reflection->getReflectionConstant('HR_PROFILE_ID')->getValue(),
            $reflection->getReflectionConstant('OSAD_PROFILE_ID')->getValue()
        );
    }
}
