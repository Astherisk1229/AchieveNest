<?php

namespace App\Commands;

use App\Services\DefenseDemoConfigService;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use RuntimeException;

/**
 * Restores the configured local-defense password for the synthetic demo
 * accounts without invoking the broad demo fixture reset.
 *
 * This deliberately touches credentials only. Production execution requires
 * an explicit flag and is restricted to the named Railway demo service. It
 * does not create, delete, or alter achievement, evidence, routing, or
 * verification data.
 */
class SyncDefenseDemoCredentials extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'demo:sync-credentials';
    protected $description = 'Synchronizes only the ten local-defense demo-account credentials with ACHIEVENEST_DEMO_PASSWORD.';

    /** @var list<string> */
    private const DEMO_EMAILS = [
        'demo.student.a@ndmu.edu.ph',
        'demo.student.b@ndmu.edu.ph',
        'demo.academic.personnel@ndmu.edu.ph',
        'demo.nonacademic.personnel@ndmu.edu.ph',
        'demo.hr.admin@ndmu.edu.ph',
        'demo.osad.admin@ndmu.edu.ph',
        'demo.dean@ndmu.edu.ph',
        'demo.coordinator.a@ndmu.edu.ph',
        'demo.coordinator.b@ndmu.edu.ph',
        'demo.moderator@ndmu.edu.ph',
    ];

    public function run(array $params)
    {
        $environment = (string) (getenv('ACHIEVENEST_ENV') ?: env('ACHIEVENEST_ENV'));
        $allowProduction = CLI::getOption('allow-production') !== null
            || in_array('--allow-production', $_SERVER['argv'] ?? [], true);
        $isApprovedProductionDemo = $environment === 'production'
            && $allowProduction
            && (string) getenv('RAILWAY_ENVIRONMENT_NAME') === 'production'
            && (string) getenv('RAILWAY_SERVICE_NAME') === 'AchieveNest';

        if ($environment !== 'local-defense' && ! $isApprovedProductionDemo) {
            throw new RuntimeException(
                'demo:sync-credentials requires ACHIEVENEST_ENV=local-defense, or --allow-production '
                . 'on the production Railway AchieveNest demo service.'
            );
        }

        $password = (new DefenseDemoConfigService())->requirePassword();
        $db = db_connect();

        $profiles = $db->table('profiles')
            ->select('id, email')
            ->whereIn('email', self::DEMO_EMAILS)
            ->get()
            ->getResultArray();

        if (count($profiles) !== count(self::DEMO_EMAILS)) {
            throw new RuntimeException(sprintf(
                'Found %d of 10 expected synthetic demo profiles; credentials were not changed.',
                count($profiles)
            ));
        }

        $profileIds = array_column($profiles, 'id');
        $credentialCount = $db->table('local_auth_credentials')
            ->whereIn('profile_id', $profileIds)
            ->countAllResults();

        if ($credentialCount !== count(self::DEMO_EMAILS)) {
            throw new RuntimeException('The expected ten demo credential rows were not found; credentials were not changed.');
        }

        $passwordHash = password_hash($password, PASSWORD_BCRYPT);
        $now = date('Y-m-d H:i:s.u');

        $db->transStart();
        $db->table('profiles')
            ->whereIn('id', $profileIds)
            ->update([
                'password_hash' => $passwordHash,
                'updated_at' => $now,
            ]);
        $db->table('local_auth_credentials')
            ->whereIn('profile_id', $profileIds)
            ->update([
                'password_hash' => $passwordHash,
                'must_change_password' => 0,
                'status' => 'active',
                'updated_at' => $now,
            ]);
        $db->transComplete();

        if ($db->transStatus() === false) {
            throw new RuntimeException('Demo credential synchronization failed and was rolled back.');
        }

        CLI::write('Synchronized the configured local-defense credential for 10 synthetic demo accounts.', 'green');
        CLI::write('No achievements, evidence, routes, tasks, or fixture records were changed.', 'yellow');

        return EXIT_SUCCESS;
    }
}
