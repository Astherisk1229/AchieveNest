<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

final class AlignStudentContractDisplayNames extends Migration
{
    public function up()
    {
        $this->db->table('achievement_contracts')
            ->where('contract_code', 'S03-UNIVERSITY_BASED_SERVICE')
            ->where('domain', 'STUDENT')
            ->update([
                'display_name' => 'School / University-Based Service',
            ]);
    }

    public function down()
    {
        $this->db->table('achievement_contracts')
            ->where('contract_code', 'S03-UNIVERSITY_BASED_SERVICE')
            ->where('domain', 'STUDENT')
            ->update([
                'display_name' => 'University-Based Service',
            ]);
    }
}
