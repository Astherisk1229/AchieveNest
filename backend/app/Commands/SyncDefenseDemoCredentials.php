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
 * This deliberately touches credentials only. It must never be used against
 * a non-local-defense database and it does not create, delete, or alter any
 * achievement, evidence, routing, or verification data.
 */
class SyncDefenseDemoCredentials extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'demo:sync-credentials';
    protected $description = 'Synchronizes only the ten local-defense demo-account credentials with ACHIEVENEST_DEMO_PASSWORD.';

    /** @var list<string> */
    private const DEMO_PROFILE_IDS = [
        'd0000000-0000-0000-0001-000000000001',
        'd0000000-0000-0000-0001-000000000002',
        'd0000000-0000-0000-0001-000000000003',
        'd0000000-0000-0000-0001-000000000004',
        'd0000000-0000-0000-0001-000000000005',
        'd0000000-0000-0000-0001-000000000006',
        'd0000000-0000-0000-0001-000000000007',
        'd0000000-0000-0000-0001-000000000008',
        'd0000000-0000-0000-0001-000000000009',
        'd0000000-0000-0000-0001-000000000010',
    ];

    public function run(array $params)
    {
        $environment = (string) (getenv('ACHIEVENEST_ENV') ?: env('ACHIEVENEST_ENV'));
        if ($environment !== 'local-defense') {
            throw new RuntimeException('demo:sync-credentials is permitted only when ACHIEVENEST_ENV=local-defense.');
        }

        $password = (new DefenseDemoConfigService())->requirePassword();
        $db = db_connect();

        $profiles = $db->table('profiles')
            ->select('id, email')
            ->whereIn('id', self::DEMO_PROFILE_IDS)
            ->like('email', 'demo.', 'after')
            ->get()
            ->getResultArray();

        if (count($profiles) !== count(self::DEMO_PROFILE_IDS)) {
            throw new RuntimeException('The expected ten synthetic demo profiles were not found; credentials were not changed.');
        }

        $profileIds = array_column($profiles, 'id');
        $credentialCount = $db->table('local_auth_credentials')
            ->whereIn('profile_id', $profileIds)
            ->countAllResults();

        if ($credentialCount !== count(self::DEMO_PROFILE_IDS)) {
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
