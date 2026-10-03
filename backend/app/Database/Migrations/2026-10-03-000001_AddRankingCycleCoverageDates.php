<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Achievement coverage of a ranking cycle: the dates a portfolio record must belong to
 * (PERIOD) or precede (QUALIFICATION) to take part in that cycle. Separate from the
 * submission and evaluation windows on each track. Nullable: existing cycles keep their
 * previous behaviour until HR sets the dates.
 */
class AddRankingCycleCoverageDates extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('ranking_cycles')) return;
        if (! $this->db->fieldExists('coverage_start', 'ranking_cycles')) {
            $this->forge->addColumn('ranking_cycles', [
                'coverage_start' => ['type' => 'DATE', 'null' => true, 'after' => 'academic_year'],
                'coverage_end' => ['type' => 'DATE', 'null' => true, 'after' => 'coverage_start'],
            ]);
            $this->db->query('ALTER TABLE ranking_cycles ADD CONSTRAINT ck_ranking_cycle_coverage CHECK (coverage_start IS NULL OR coverage_end IS NULL OR coverage_start <= coverage_end)');
        }
    }

    public function down()
    {
        if (! $this->db->tableExists('ranking_cycles') || ! $this->db->fieldExists('coverage_start', 'ranking_cycles')) return;
        $this->db->query('ALTER TABLE ranking_cycles DROP CHECK ck_ranking_cycle_coverage');
        $this->forge->dropColumn('ranking_cycles', ['coverage_start', 'coverage_end']);
    }
}
