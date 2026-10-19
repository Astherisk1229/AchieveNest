<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Removes Dean student nominations and their award-eligibility pathway. */
final class RemoveDeanStudentNominationWorkflow extends Migration
{
    public function up()
    {
        $schema = new September15BridgeSchemaInspector($this->db);

        if ($schema->tableExists('award_interview_eligibilities')) {
            $hasSource = $schema->columnExists('award_interview_eligibilities', 'eligibility_source');
            $hasPathway = $schema->columnExists('award_interview_eligibilities', 'pathway');
            $hasNominationId = $schema->columnExists('award_interview_eligibilities', 'dean_nomination_id');

            foreach ([
                'ck_award_eligibility_source_reference',
                'ck_interview_eligibility_pathway',
                'ck_interview_eligibility_source',
            ] as $constraint) {
                if ($this->checkConstraintExists('award_interview_eligibilities', $constraint)) {
                    $this->db->query('ALTER TABLE award_interview_eligibilities DROP CHECK `' . $constraint . '`');
                }
            }

            if ($this->foreignKeyExists('award_interview_eligibilities', 'fk_interview_eligibility_nomination')) {
                $this->db->query('ALTER TABLE award_interview_eligibilities DROP FOREIGN KEY `fk_interview_eligibility_nomination`');
            }

            if ($hasSource) {
                $this->db->table('award_interview_eligibilities')
                    ->where('eligibility_source', 'dean_nomination')
                    ->delete();
            }

            if ($hasPathway) {
                $this->db->table('award_interview_eligibilities')
                    ->where('pathway', 'dean_nomination')
                    ->update(['pathway' => 'automated_threshold']);
                $this->db->table('award_interview_eligibilities')
                    ->where('pathway', 'both')
                    ->update(['pathway' => 'automated_threshold']);
            }

            if ($hasNominationId) {
                $this->db->query('DELETE FROM award_interview_eligibilities WHERE dean_nomination_id IS NOT NULL');

                if ($schema->indexExists('award_interview_eligibilities', 'fk_interview_eligibility_nomination')) {
                    $this->db->query('ALTER TABLE award_interview_eligibilities DROP INDEX `fk_interview_eligibility_nomination`');
                }

                $this->db->query('ALTER TABLE award_interview_eligibilities DROP COLUMN `dean_nomination_id`');
            }

            if ($hasSource && $schema->columnExists('award_interview_eligibilities', 'evaluation_id')) {
                $this->db->query("ALTER TABLE award_interview_eligibilities ADD CONSTRAINT `ck_award_eligibility_source_reference` CHECK (`eligibility_source` = 'portfolio_based' AND `evaluation_id` IS NOT NULL)");
                $this->db->query("ALTER TABLE award_interview_eligibilities ADD CONSTRAINT `ck_interview_eligibility_source` CHECK (`eligibility_source` = 'portfolio_based')");
            }

            if ($hasPathway) {
                $this->db->query("ALTER TABLE award_interview_eligibilities ADD CONSTRAINT `ck_interview_eligibility_pathway` CHECK (`pathway` = 'automated_threshold')");
            }
        }

        if ($schema->tableExists('award_student_evaluation_summaries')
            && $schema->columnExists('award_student_evaluation_summaries', 'candidate_pathway')
            && $schema->columnExists('award_student_evaluation_summaries', 'summary_payload')) {
            $this->db->query(<<<'SQL'
UPDATE award_student_evaluation_summaries
SET candidate_pathway = 'automatic_portfolio',
    summary_payload = JSON_REMOVE(
        JSON_SET(summary_payload, '$.candidate_intake.candidate_pathway', 'automatic_portfolio'),
        '$.candidate_intake.dean_nomination'
    )
WHERE candidate_pathway = 'dean_nomination'
SQL);
        }

        if ($schema->tableExists('dean_student_nominations')) {
            $this->db->query('DROP TABLE `dean_student_nominations`');
        }
    }

    public function down()
    {
        // This workflow and its nomination records are intentionally retired permanently.
    }

    private function checkConstraintExists(string $table, string $constraint): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = \'CHECK\') AS present',
            [$table, $constraint]
        )->getRowArray();

        return (int) ($row['present'] ?? 0) === 1;
    }

    private function foreignKeyExists(string $table, string $constraint): bool
    {
        $row = $this->db->query(
            'SELECT EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = \'FOREIGN KEY\') AS present',
            [$table, $constraint]
        )->getRowArray();

        return (int) ($row['present'] ?? 0) === 1;
    }
}
