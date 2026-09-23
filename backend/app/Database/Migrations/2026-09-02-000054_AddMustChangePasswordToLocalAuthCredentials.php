<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddMustChangePasswordToLocalAuthCredentials extends Migration
{
    public function up(): void
    {
        // 1. Add must_change_password to local_auth_credentials if not present
        if (! $this->db->fieldExists('must_change_password', 'local_auth_credentials')) {
            $this->forge->addColumn('local_auth_credentials', [
                'must_change_password' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'null'       => false,
                    'default'    => 1,
                    'after'      => 'password_changed_at',
                ],
            ]);
        }

        // 2. Backfill local_auth_credentials.must_change_password from profiles.must_change_password if available
        if ($this->db->fieldExists('must_change_password', 'profiles')) {
            $this->db->query("
                UPDATE local_auth_credentials lac
                JOIN profiles p ON p.id = lac.profile_id
                SET lac.must_change_password = p.must_change_password
            ");
        }
    }

    public function down(): void
    {
        if ($this->db->fieldExists('must_change_password', 'local_auth_credentials')) {
            $this->forge->dropColumn('local_auth_credentials', 'must_change_password');
        }
    }
}
