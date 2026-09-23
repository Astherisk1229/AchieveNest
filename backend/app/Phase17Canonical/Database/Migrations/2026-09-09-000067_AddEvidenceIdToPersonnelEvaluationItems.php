<?php

namespace Phase17Canonical\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

class AddEvidenceIdToPersonnelEvaluationItems extends Migration
{
    public function up()
    {
        $this->assertMySQL();
        $this->db->resetDataCache();
        if (! $this->db->tableExists('personnel_evaluation_items')) {
            throw new RuntimeException('Required personnel_evaluation_items table is missing.');
        }

        if (! $this->db->fieldExists('evidence_id', 'personnel_evaluation_items')) {
            $this->forge->addColumn('personnel_evaluation_items', [
                'evidence_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true],
            ]);
        }

        $this->db->resetDataCache();
        $field = $this->db->getFieldData('personnel_evaluation_items');
        foreach ($field as $metadata) {
            if ($metadata->name === 'evidence_id' && strtolower($metadata->type) === 'varchar' && (int) $metadata->max_length === 64 && (bool) $metadata->nullable) {
                $this->addIndexIfMissing('personnel_evaluation_items', 'idx_personnel_eval_items_evidence_id', ['evidence_id']);
                return;
            }
        }
        throw new RuntimeException('Existing personnel_evaluation_items.evidence_id is incompatible.');
    }

    public function down()
    {
        if ($this->db->fieldExists('evidence_id', 'personnel_evaluation_items')) {
            $this->forge->dropColumn('personnel_evaluation_items', 'evidence_id');
        }
    }

    private function assertMySQL(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Canonical evidence identity requires MySQLi.');
    }

    private function addIndexIfMissing(string $table, string $name, array $columns): void
    {
        $row = $this->db->query('SELECT COUNT(*) c FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name=? AND index_name=?', [$table, $name])->getRowArray();
        if ((int) ($row['c'] ?? 0) === 0) {
            $this->db->query("ALTER TABLE `{$table}` ADD KEY `{$name}` (`" . implode('`,`', $columns) . '`)');
        }
    }
}
