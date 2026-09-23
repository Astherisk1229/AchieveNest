<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Restores the non-login HR actor required by the September 15 bridge data. */
class RestoreBridgeCompatibilityActor extends Migration
{
    private const PROFILE_ID = 'd0000000-0000-0000-0001-000000000005';
    private const ROLE_ASSIGNMENT_ID = 'd0000000-0000-0000-0009-0000000549bf';
    private const ROLE_ID = '7b14b5ee-27a5-4e05-b00e-7f37723b49bf';

    public function up()
    {
        $this->assertCanonicalMySQL();

        foreach (['profiles', 'roles', 'profile_roles'] as $table) {
            if (! $this->db->tableExists($table)) {
                throw new RuntimeException("Bridge compatibility actor requires {$table}.");
            }
        }

        $expectedProfile = [
            'id' => self::PROFILE_ID,
            'institutional_id' => '2026-DEMO-005',
            'account_type' => 'hr_admin',
            'email' => 'demo.hr.admin@ndmu.edu.ph',
            'full_name' => 'Demo HR Administrator',
            'designation_title' => 'HR Director',
            'status' => 'active',
        ];
        $matches = $this->db->table('profiles')
            ->groupStart()
                ->where('id', self::PROFILE_ID)
                ->orWhere('institutional_id', $expectedProfile['institutional_id'])
                ->orWhere('email', $expectedProfile['email'])
            ->groupEnd()
            ->get()->getResultArray();

        if ($matches === []) {
            $insert = $expectedProfile + [
                'first_name' => null,
                'middle_name' => null,
                'last_name' => null,
                'avatar_url' => null,
                'password_hash' => null,
                'created_at' => '2026-09-10 09:56:11.000000',
                'updated_at' => '2026-09-10 09:56:11.000000',
            ];
            $insert = array_intersect_key($insert, array_flip($this->db->getFieldNames('profiles')));
            if (! $this->db->table('profiles')->insert($insert)) {
                throw new RuntimeException('Failed to restore the bridge compatibility HR actor.');
            }
        } elseif (count($matches) !== 1 || ! $this->compatible($matches[0], $expectedProfile)) {
            throw new RuntimeException('Bridge compatibility HR actor identity conflicts with existing profile data.');
        }

        $role = $this->db->table('roles')->where('id', self::ROLE_ID)->get()->getRowArray();
        if ($role === null || (string) ($role['role_key'] ?? '') !== 'hr_staff') {
            throw new RuntimeException('Canonical hr_staff role is missing or incompatible.');
        }

        $expectedRole = [
            'id' => self::ROLE_ASSIGNMENT_ID,
            'profile_id' => self::PROFILE_ID,
            'role_id' => self::ROLE_ID,
            'scope_type' => 'university',
            'scope_id' => null,
            'is_active' => '1',
        ];
        $assignments = $this->db->table('profile_roles')
            ->groupStart()
                ->where('id', self::ROLE_ASSIGNMENT_ID)
                ->orGroupStart()
                    ->where('profile_id', self::PROFILE_ID)
                    ->where('role_id', self::ROLE_ID)
                    ->where('scope_type', 'university')
                    ->where('scope_id', null)
                ->groupEnd()
            ->groupEnd()
            ->get()->getResultArray();

        if ($assignments === []) {
            if (! $this->db->table('profile_roles')->insert($expectedRole + [
                'assigned_at' => '2026-09-10 09:56:11.000000',
                'assigned_by' => null,
            ])) {
                throw new RuntimeException('Failed to restore the bridge compatibility HR role assignment.');
            }
        } elseif (count($assignments) !== 1 || ! $this->compatible($assignments[0], $expectedRole)) {
            throw new RuntimeException('Bridge compatibility HR role assignment conflicts with existing data.');
        }
    }

    public function down()
    {
        $this->assertCanonicalMySQL();
        if (! $this->db->tableExists('profiles')) {
            return;
        }

        $this->refuseReferencedDeletion('profiles', self::PROFILE_ID, ['profile_roles']);
        if ($this->db->tableExists('profile_roles')) {
            $extraRoles = $this->db->table('profile_roles')
                ->where('profile_id', self::PROFILE_ID)
                ->where('id !=', self::ROLE_ASSIGNMENT_ID)
                ->countAllResults();
            if ($extraRoles > 0) {
                throw new RuntimeException('Refusing to remove bridge actor: additional role assignments still reference it.');
            }
            $this->db->table('profile_roles')->where('id', self::ROLE_ASSIGNMENT_ID)->delete();
        }
        $this->db->table('profiles')->where('id', self::PROFILE_ID)->delete();
    }

    private function compatible(array $actual, array $expected): bool
    {
        foreach ($expected as $field => $value) {
            if ($value === null ? $actual[$field] !== null : (string) $actual[$field] !== (string) $value) {
                return false;
            }
        }
        return true;
    }

    private function refuseReferencedDeletion(string $table, string $id, array $ignoredTables): void
    {
        $references = $this->db->query(
            'SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE '
            . 'WHERE REFERENCED_TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME = ? AND REFERENCED_COLUMN_NAME = ?',
            [$table, 'id']
        )->getResultArray();
        foreach ($references as $reference) {
            if (in_array($reference['TABLE_NAME'], $ignoredTables, true)) {
                continue;
            }
            $count = $this->db->table($reference['TABLE_NAME'])->where($reference['COLUMN_NAME'], $id)->countAllResults();
            if ($count > 0) {
                throw new RuntimeException("Refusing to remove bridge actor: {$reference['TABLE_NAME']} still references it.");
            }
        }
    }

    private function assertCanonicalMySQL(): void
    {
        $database = (string) $this->db->getDatabase();
        if ($this->db->DBDriver !== 'MySQLi' || ! str_starts_with($database, 'achievenest_phase17m_')) {
            throw new RuntimeException("Refusing bridge actor restoration against [{$database}].");
        }
    }
}
