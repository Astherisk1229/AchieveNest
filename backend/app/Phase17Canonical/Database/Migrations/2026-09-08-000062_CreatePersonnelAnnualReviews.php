<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

/** Creates the canonical Dean annual-review table omitted from the baseline. */
class CreatePersonnelAnnualReviews extends Migration
{
    private const TABLE = 'personnel_annual_reviews';

    public function up()
    {
        $this->assertCanonicalMySQL();
        $this->db->resetDataCache();

        if ($this->db->tableExists(self::TABLE)) {
            $this->assertCompatibleExistingTable();

            return;
        }

        $this->forge->addField([
            'id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => false],
            'personnel_profile_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => false],
            'evaluation_cycle_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => false],
            'college_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => false],
            'review_period_label' => [
                'type' => 'VARCHAR', 'constraint' => 100, 'null' => false,
                'default' => 'AY 2025-2026 Annual Review',
            ],
            'decision' => ['type' => 'VARCHAR', 'constraint' => 32, 'null' => false],
            'decision_reason' => ['type' => 'TEXT', 'null' => true],
            'evidence_document_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'evidence_reference' => ['type' => 'TEXT', 'null' => true],
            'review_summary_payload' => ['type' => 'TEXT', 'null' => true],
            'recorded_by_dean_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => false],
            'recorded_at' => ['type' => 'DATETIME', 'null' => false],
            'supersedes_review_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'superseded_at' => ['type' => 'DATETIME', 'null' => true],
            'superseded_by_dean_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            'created_at' => ['type' => 'DATETIME', 'null' => true],
            'updated_at' => ['type' => 'DATETIME', 'null' => true],
        ]);
        $this->forge->addKey('id', true);
        $this->forge->addKey(
            ['personnel_profile_id', 'evaluation_cycle_id'],
            false,
            false,
            'idx_par_personnel_cycle'
        );
        $this->forge->addKey(
            ['college_id', 'evaluation_cycle_id', 'decision'],
            false,
            false,
            'idx_par_college_cycle_dec'
        );
        $this->forge->addKey('supersedes_review_id', false, false, 'idx_par_supersedes');
        $this->forge->createTable(self::TABLE, true);
        $this->db->query(
            "ALTER TABLE personnel_annual_reviews ADD CONSTRAINT ck_par_decision CHECK (decision IN ('cleared', 'not_cleared'))"
        );
    }

    public function down()
    {
        $this->assertCanonicalMySQL();
        $this->forge->dropTable(self::TABLE, true);
    }

    private function assertCanonicalMySQL(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new RuntimeException('Canonical personnel annual reviews require MySQLi.');
        }
    }

    private function assertCompatibleExistingTable(): void
    {
        $required = [
            'id', 'personnel_profile_id', 'evaluation_cycle_id', 'college_id',
            'review_period_label', 'decision', 'decision_reason', 'evidence_document_id',
            'evidence_reference', 'review_summary_payload', 'recorded_by_dean_id',
            'recorded_at', 'supersedes_review_id', 'superseded_at',
            'superseded_by_dean_id', 'created_at', 'updated_at',
        ];

        foreach ($required as $field) {
            if (! $this->db->fieldExists($field, self::TABLE)) {
                throw new RuntimeException(
                    "Existing personnel_annual_reviews table is incompatible: missing {$field}."
                );
            }
        }
    }
}
