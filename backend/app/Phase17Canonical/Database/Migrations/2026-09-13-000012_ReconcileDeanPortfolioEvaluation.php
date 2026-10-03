<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class ReconcileDeanPortfolioEvaluation extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Dean portfolio evaluation reconciliation requires canonical MySQL.');
        }

        $this->addMissing('personnel_evaluation_items', [
            'criterion_key' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true, 'after' => 'criterion_code'],
            'criterion_title' => ['type' => 'VARCHAR', 'constraint' => 255, 'null' => true, 'after' => 'criterion_key'],
            'criterion_version_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true, 'after' => 'criterion_title'],
            'criterion_snapshot' => ['type' => 'JSON', 'null' => true, 'after' => 'criterion_version_id'],
            'configured_points_snapshot' => ['type' => 'DECIMAL', 'constraint' => '10,2', 'null' => true, 'after' => 'criterion_snapshot'],
            'portfolio_section' => ['type' => 'VARCHAR', 'constraint' => 100, 'null' => true, 'after' => 'configured_points_snapshot'],
            'submission_order' => ['type' => 'INT', 'unsigned' => true, 'null' => false, 'default' => 0, 'after' => 'portfolio_section'],
            'evidence_snapshot' => ['type' => 'JSON', 'null' => true, 'after' => 'evidence_id'],
            'verification_status' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => false, 'default' => 'pending', 'after' => 'evidence_snapshot'],
            'rating_status' => ['type' => 'VARCHAR', 'constraint' => 30, 'null' => false, 'default' => 'unrated', 'after' => 'verification_status'],
            'evaluator_remarks' => ['type' => 'TEXT', 'null' => true, 'after' => 'rating_status'],
            'rejection_reason' => ['type' => 'TEXT', 'null' => true, 'after' => 'evaluator_remarks'],
            'evaluated_by' => ['type' => 'CHAR', 'constraint' => 36, 'null' => true, 'after' => 'rejection_reason'],
            'evaluated_at' => ['type' => 'DATETIME', 'null' => true, 'after' => 'evaluated_by'],
            'updated_at' => ['type' => 'DATETIME', 'null' => true, 'after' => 'evaluated_at'],
        ]);

        $this->addMissing('personnel_evaluations', [
            'originating_evaluator_profile_id' => ['type' => 'CHAR', 'constraint' => 36, 'null' => true, 'after' => 'evaluator_profile_id'],
        ]);
        $this->db->query('UPDATE personnel_evaluations SET originating_evaluator_profile_id = evaluator_profile_id WHERE originating_evaluator_profile_id IS NULL');
    }

    private function addMissing(string $table, array $columns): void
    {
        if (! $this->db->tableExists($table)) {
            throw new RuntimeException("Required table {$table} is missing.");
        }
        foreach ($columns as $name => $definition) {
            if (! $this->db->fieldExists($name, $table)) {
                $this->forge->addColumn($table, [$name => $definition]);
            }
        }
    }

    public function down()
    {
        throw new RuntimeException('Forward-only canonical migration.');
    }
}
