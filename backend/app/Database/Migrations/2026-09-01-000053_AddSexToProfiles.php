<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddSexToProfiles extends Migration
{
    public function up()
    {
        $db = $this->db;

        // Check if column already exists
        $fields = $db->getFieldData('profiles');
        $hasSex = false;
        foreach ($fields as $field) {
            if (strtolower($field->name) === 'sex') {
                $hasSex = true;
                break;
            }
        }

        if (! $hasSex) {
            $this->forge->addColumn('profiles', [
                'sex' => [
                    'type'       => 'VARCHAR',
                    'constraint' => 20,
                    'null'       => true,
                    'after'      => 'full_name',
                ],
            ]);
        }
    }

    public function down()
    {
        $fields = $this->db->getFieldData('profiles');
        $hasSex = false;
        foreach ($fields as $field) {
            if (strtolower($field->name) === 'sex') {
                $hasSex = true;
                break;
            }
        }

        if ($hasSex) {
            $this->forge->dropColumn('profiles', 'sex');
        }
    }
}
