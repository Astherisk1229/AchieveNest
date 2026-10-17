<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Non-teaching applications use the shared rank rules without a faculty placement. */
class AllowNonTeachingRankApplications extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('personnel_rank_applied_for_decisions')) return;
        $this->db->query('ALTER TABLE personnel_rank_applied_for_decisions
            MODIFY placement_id_snapshot VARCHAR(36) NULL,
            MODIFY placement_group_id_snapshot BIGINT UNSIGNED NULL');
    }

    public function down()
    {
        // Existing non-teaching decisions may have no faculty placement.
    }
}
