<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Adds the approved Teaching rank bypass from verified PhD holders to Professor I. */
class AddTeachingPhdRankTransitions extends Migration
{
    public function up()
    {
        $sources = ['ASSISTANT_PROFESSOR', 'ASSISTANT_PROFESSOR_I', 'ASSISTANT_PROFESSOR_II', 'ASSISTANT_PROFESSOR_III', 'ASSISTANT_PROFESSOR_IV', 'ASSOCIATE_PROFESSOR', 'ASSOCIATE_PROFESSOR_I', 'ASSOCIATE_PROFESSOR_II', 'ASSOCIATE_PROFESSOR_III', 'ASSOCIATE_PROFESSOR_IV'];
        foreach ($sources as $source) {
            $where = ['from_rank_code' => $source, 'to_rank_code' => 'PROFESSOR_I', 'transition_type' => 'phd_exception'];
            $existing = $this->db->table('faculty_rank_transitions')->where($where)->get()->getRowArray();
            $values = ['requires_verified_phd' => 1, 'rule_reference' => 'NDMU-TEACHING-RANK-PROGRESSION/VERIFIED-PHD-BYPASS', 'is_active' => 1];
            if ($existing) $this->db->table('faculty_rank_transitions')->where('id', $existing['id'])->update($values);
            else $this->db->table('faculty_rank_transitions')->insert($where + $values + ['created_at' => date('Y-m-d H:i:s')]);
        }
    }

    public function down()
    {
        // Keep approved rank-transition audit/configuration rows intact on rollback.
    }
}
