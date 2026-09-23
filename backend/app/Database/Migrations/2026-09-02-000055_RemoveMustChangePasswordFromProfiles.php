<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class RemoveMustChangePasswordFromProfiles extends Migration
{
    public function up(): void
    {
        // Drop must_change_password from profiles if present
        if ($this->db->fieldExists('must_change_password', 'profiles')) {
            $this->forge->dropColumn('profiles', 'must_change_password');
        }
    }

    public function down(): void
    {
        // Re-add must_change_password to profiles if missing
        if (! $this->db->fieldExists('must_change_password', 'profiles')) {
            $this->forge->addColumn('profiles', [
                'must_change_password' => [
                    'type'       => 'TINYINT',
                    'constraint' => 1,
                    'null'       => false,
                    'default'    => 1,
                    'after'      => 'status',
                ],
            ]);

            // Backfill from canonical credentials
            if ($this->db->fieldExists('must_change_password', 'local_auth_credentials')) {
                $this->db->query("
                    UPDATE profiles p
                    JOIN local_auth_credentials lac ON lac.profile_id = p.id
                    SET p.must_change_password = lac.must_change_password
                ");
            }
        }
    }
}
