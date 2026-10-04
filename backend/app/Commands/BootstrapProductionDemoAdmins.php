<?php

namespace App\Commands;

use App\Services\FacultyStatusService;
use App\Services\PersonnelClassificationService;
use App\Services\ProductionDemoAdminBootstrapConfig;
use CodeIgniter\CLI\BaseCommand;
use CodeIgniter\CLI\CLI;
use CodeIgniter\Database\BaseConnection;
use RuntimeException;
use Throwable;

/**
 * One-time, CLI-only bootstrap for the two explicitly authorized production
 * demo administrators. This command deliberately has no HTTP route.
 */
class BootstrapProductionDemoAdmins extends BaseCommand
{
    protected $group = 'AchieveNest';
    protected $name = 'accounts:bootstrap-demo-admins';
    protected $description = 'Creates only the authorized HR and OSAD demo administrators in an explicitly selected hosted environment.';

    // Deliberately distinct from all legacy defense-fixture IDs. In particular,
    // d0000000-0000-0000-0001-000000000005 is the canonical bridge actor.
    private const HR_PROFILE_ID = '20853c88-a33d-494c-9576-39f28dac9544';
    private const OSAD_PROFILE_ID = 'a36a96d8-4fbe-4649-ac38-54e8d551e756';

    public function run(array $params)
    {
        $db = null;
        $transactionStarted = false;

        try {
            $config = (new ProductionDemoAdminBootstrapConfig())->validate([
                'CI_ENVIRONMENT' => $this->environmentValue('CI_ENVIRONMENT'),
                'ACHIEVENEST_ENV' => $this->environmentValue('ACHIEVENEST_ENV'),
                'RAILWAY_ENVIRONMENT_NAME' => $this->environmentValue('RAILWAY_ENVIRONMENT_NAME'),
                'ACHIEVENEST_BOOTSTRAP_TARGET' => $this->environmentValue('ACHIEVENEST_BOOTSTRAP_TARGET'),
                'ACHIEVENEST_BOOTSTRAP_EXPECTED_RAILWAY_ENVIRONMENT' => $this->environmentValue('ACHIEVENEST_BOOTSTRAP_EXPECTED_RAILWAY_ENVIRONMENT'),
                'ACHIEVENEST_BOOTSTRAP_CONFIRM' => $this->environmentValue('ACHIEVENEST_BOOTSTRAP_CONFIRM'),
                'ACHIEVENEST_BOOTSTRAP_HR_PASSWORD' => $this->environmentValue('ACHIEVENEST_BOOTSTRAP_HR_PASSWORD'),
                'ACHIEVENEST_BOOTSTRAP_OSAD_PASSWORD' => $this->environmentValue('ACHIEVENEST_BOOTSTRAP_OSAD_PASSWORD'),
                'ACHIEVENEST_DEMO_PASSWORD' => $this->environmentValue('ACHIEVENEST_DEMO_PASSWORD'),
            ]);

            $db = db_connect();
            $this->assertSchema($db);
            $roles = $this->requiredRoles($db);
            $hrUnit = $db->table('administrative_units')
                ->where('code', 'HR')
                ->where('status', 'active')
                ->get()
                ->getRowArray();
            if ($hrUnit === null) {
                throw new RuntimeException('The active HR administrative unit is missing.');
            }

            $now = date('Y-m-d H:i:s.u');
            $db->transBegin();
            $transactionStarted = true;

            $this->upsertAdmin($db, [
                'id' => self::HR_PROFILE_ID,
                'institutional_id' => '2026-DEMO-005',
                'email' => 'demo.hr.admin@ndmu.edu.ph',
                'full_name' => 'Demo HR Administrator',
                'account_type' => 'hr_admin',
                'designation_title' => 'HR Director',
                'role_id' => $roles['hr_staff'],
                'password' => $config['hr_password'],
                'administrative_unit_id' => (string) $hrUnit['id'],
            ], $now);

            $this->upsertAdmin($db, [
                'id' => self::OSAD_PROFILE_ID,
                'institutional_id' => '2026-DEMO-006',
                'email' => 'demo.osad.admin@ndmu.edu.ph',
                'full_name' => 'Demo OSAD Administrator',
                'account_type' => 'osad_admin',
                'designation_title' => 'Director of Student Affairs',
                'role_id' => $roles['osad_staff'],
                'password' => $config['osad_password'],
                'administrative_unit_id' => null,
            ], $now);

            if ($db->transStatus() === false) {
                throw new RuntimeException('Database transaction reported a failure.');
            }
            $db->transCommit();
            $transactionStarted = false;

            CLI::write("Created or reconciled exactly two {$config['target']} demo administrators.", 'green');
            CLI::write('HR: demo.hr.admin@ndmu.edu.ph (first-login password change required)', 'yellow');
            CLI::write('OSAD: demo.osad.admin@ndmu.edu.ph (first-login password change required)', 'yellow');
            CLI::write('Remove all ACHIEVENEST_BOOTSTRAP_* variables immediately.', 'yellow');

            return EXIT_SUCCESS;
        } catch (Throwable $e) {
            if ($db instanceof BaseConnection && $transactionStarted) {
                $db->transRollback();
            }
            CLI::error('[ERROR] Demo-admin bootstrap failed: ' . $e->getMessage());

            return EXIT_ERROR;
        }
    }

    private function environmentValue(string $key): string
    {
        $value = getenv($key);

        return trim((string) ($value !== false ? $value : env($key)));
    }

    private function assertSchema(BaseConnection $db): void
    {
        foreach ([
            'profiles',
            'personnel_profiles',
            'local_auth_credentials',
            'local_auth_sessions',
            'roles',
            'profile_roles',
            'administrative_units',
            'personnel_administrative_unit_affiliations',
        ] as $table) {
            if (! $db->tableExists($table)) {
                throw new RuntimeException("Required table {$table} is missing.");
            }
        }
    }

    /** @return array{hr_staff: string, osad_staff: string} */
    private function requiredRoles(BaseConnection $db): array
    {
        $rows = $db->table('roles')
            ->select('id, role_key')
            ->whereIn('role_key', ['hr_staff', 'osad_staff'])
            ->get()
            ->getResultArray();
        $roles = array_column($rows, 'id', 'role_key');
        if (! isset($roles['hr_staff'], $roles['osad_staff'])) {
            throw new RuntimeException('Required hr_staff or osad_staff role is missing.');
        }

        return $roles;
    }

    /** @param array<string, string|null> $admin */
    private function upsertAdmin(BaseConnection $db, array $admin, string $now): void
    {
        $byId = $db->table('profiles')->where('id', $admin['id'])->get()->getRowArray();
        $byEmail = $db->table('profiles')->where('email', $admin['email'])->get()->getRowArray();
        if ($byId !== null && strtolower((string) $byId['email']) !== $admin['email']) {
            throw new RuntimeException("Reserved profile ID conflict for {$admin['email']}.");
        }
        if ($byEmail !== null && (string) $byEmail['id'] !== $admin['id']) {
            throw new RuntimeException("Existing email belongs to a different profile: {$admin['email']}.");
        }

        $passwordHash = password_hash((string) $admin['password'], PASSWORD_DEFAULT);
        $profile = [
            'institutional_id' => $admin['institutional_id'],
            'email' => $admin['email'],
            'full_name' => $admin['full_name'],
            'account_type' => $admin['account_type'],
            'designation_title' => $admin['designation_title'],
            'status' => 'active',
            'password_hash' => $passwordHash,
            'updated_at' => $now,
        ];
        if ($byId === null) {
            $db->table('profiles')->insert(['id' => $admin['id'], 'created_at' => $now] + $profile);
        } else {
            $db->table('profiles')->where('id', $admin['id'])->update($profile);
        }

        $personnel = $db->table('personnel_profiles')
            ->where('profile_id', $admin['id'])
            ->get()
            ->getRowArray();
        $personnelData = [
            'personnel_classification' => PersonnelClassificationService::SIDE_NON_ACADEMIC,
            'personnel_group' => PersonnelClassificationService::GROUP_NON_TEACHING_FACULTY,
            'organizational_side' => PersonnelClassificationService::SIDE_NON_ACADEMIC,
            'employment_status' => FacultyStatusService::EMPLOYMENT_PERMANENT,
            'faculty_engagement' => null,
            'updated_at' => $now,
        ];
        if ($personnel === null) {
            $db->table('personnel_profiles')->insert([
                'profile_id' => $admin['id'],
                'created_at' => $now,
            ] + $personnelData);
        } else {
            $db->table('personnel_profiles')->where('profile_id', $admin['id'])->update($personnelData);
        }

        $credential = $db->table('local_auth_credentials')
            ->where('profile_id', $admin['id'])
            ->get()
            ->getRowArray();
        $credentialData = [
            'password_hash' => $passwordHash,
            'must_change_password' => 1,
            'status' => 'active',
            'updated_at' => $now,
        ];
        if ($credential === null) {
            $db->table('local_auth_credentials')->insert([
                'profile_id' => $admin['id'],
                'created_at' => $now,
            ] + $credentialData);
        } else {
            $db->table('local_auth_credentials')->where('profile_id', $admin['id'])->update($credentialData);
        }
        $db->table('local_auth_sessions')->where('profile_id', $admin['id'])->delete();

        $roleAssignment = $db->table('profile_roles')
            ->where('profile_id', $admin['id'])
            ->where('role_id', $admin['role_id'])
            ->where('scope_type', 'university')
            ->get()
            ->getRowArray();
        if ($roleAssignment === null) {
            $db->table('profile_roles')->insert([
                'id' => 'd0000000-0000-0000-0009-' . substr((string) $admin['id'], -8) . substr((string) $admin['role_id'], -4),
                'profile_id' => $admin['id'],
                'role_id' => $admin['role_id'],
                'scope_type' => 'university',
                'is_active' => 1,
                'assigned_at' => $now,
            ]);
        } else {
            $db->table('profile_roles')->where('id', $roleAssignment['id'])->update([
                'is_active' => 1,
                'revoked_at' => null,
                'revoked_by' => null,
            ]);
        }

        if ($admin['administrative_unit_id'] !== null) {
            $affiliation = $db->table('personnel_administrative_unit_affiliations')
                ->where('personnel_profile_id', $admin['id'])
                ->where('administrative_unit_id', $admin['administrative_unit_id'])
                ->get()
                ->getRowArray();
            if ($affiliation === null) {
                $db->table('personnel_administrative_unit_affiliations')->insert([
                    'id' => 'd0000000-0000-0000-0005-' . substr((string) $admin['id'], -12),
                    'personnel_profile_id' => $admin['id'],
                    'administrative_unit_id' => $admin['administrative_unit_id'],
                    'effective_from' => date('Y-m-d'),
                    'is_active' => 1,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            } else {
                $db->table('personnel_administrative_unit_affiliations')
                    ->where('id', $affiliation['id'])
                    ->update(['is_active' => 1, 'updated_at' => $now]);
            }
        }
    }
}
