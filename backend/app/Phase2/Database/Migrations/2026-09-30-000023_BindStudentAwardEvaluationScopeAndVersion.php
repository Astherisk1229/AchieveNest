<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/**
 * Step 5: one evaluation row per (cycle, award, student) and the scoring version used.
 * Existing duplicates are reported and block the migration; they are never deleted here.
 */
final class BindStudentAwardEvaluationScopeAndVersion extends Migration
{
    public function up()
    {
        $duplicates = $this->db->query(
            'SELECT cycle_id, award_definition_id, student_profile_id, COUNT(*) AS rows_count, GROUP_CONCAT(id) AS ids
             FROM student_award_evaluations
             GROUP BY cycle_id, award_definition_id, student_profile_id
             HAVING COUNT(*) > 1'
        )->getResultArray();
        if ($duplicates !== []) {
            throw new RuntimeException('Duplicate student_award_evaluations must be resolved by OSAD first: ' . json_encode($duplicates));
        }

        $fields = $this->db->getFieldNames('student_award_evaluations');
        $changes = [];
        if (! in_array('scoring_model_version_id', $fields, true)) {
            $changes[] = 'ADD COLUMN `scoring_model_version_id` CHAR(36) NULL AFTER `max_computable_score`';
        }
        if (! in_array('scoring_version', $fields, true)) {
            $changes[] = 'ADD COLUMN `scoring_version` VARCHAR(20) NULL AFTER `scoring_model_version_id`';
        }
        if (! $this->indexExists('uq_student_award_evaluation_scope')) {
            $changes[] = 'ADD UNIQUE KEY `uq_student_award_evaluation_scope` (`cycle_id`, `award_definition_id`, `student_profile_id`)';
        }
        if ($changes !== []) {
            // Single ALTER so the change applies completely or not at all.
            $this->db->query('ALTER TABLE `student_award_evaluations` ' . implode(', ', $changes));
        }
    }

    public function down()
    {
        $changes = [];
        if ($this->indexExists('uq_student_award_evaluation_scope')) {
            $changes[] = 'DROP INDEX `uq_student_award_evaluation_scope`';
        }
        $fields = $this->db->getFieldNames('student_award_evaluations');
        if (in_array('scoring_version', $fields, true)) {
            $changes[] = 'DROP COLUMN `scoring_version`';
        }
        if (in_array('scoring_model_version_id', $fields, true)) {
            $changes[] = 'DROP COLUMN `scoring_model_version_id`';
        }
        if ($changes !== []) {
            $this->db->query('ALTER TABLE `student_award_evaluations` ' . implode(', ', $changes));
        }
    }

    private function indexExists(string $name): bool
    {
        return $this->db->query(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
            ['student_award_evaluations', $name]
        )->getRowArray() !== null;
    }
}
