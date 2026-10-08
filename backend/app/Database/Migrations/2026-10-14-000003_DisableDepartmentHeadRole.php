<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Retires Department Head access while retaining existing assignment rows for audit history.
 */
class DisableDepartmentHeadRole extends Migration
{
    public function up()
    {
        if ($this->db->tableExists('department_head_assignments')) {
            $this->db->table('department_head_assignments')
                ->where('is_active', 1)
                ->update(['is_active' => 0, 'effective_until' => date('Y-m-d')]);
        }

        if (! $this->db->tableExists('roles') || ! $this->db->tableExists('profile_roles')) {
            return;
        }

        $role = $this->db->table('roles')->select('id')->where('role_key', 'department_head')->get()->getRowArray();
        if ($role === null) {
            return;
        }

        $this->db->table('profile_roles')->where('role_id', $role['id'])->where('is_active', 1)
            ->update(['is_active' => 0, 'revoked_at' => date('Y-m-d H:i:s')]);
    }

    public function down()
    {
        // Deliberately do not restore a retired role or reactivate legacy assignments.
    }
}
