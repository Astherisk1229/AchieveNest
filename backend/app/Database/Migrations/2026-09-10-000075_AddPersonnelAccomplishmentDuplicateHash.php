<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

class AddPersonnelAccomplishmentDuplicateHash extends Migration
{
    public function up()
    {
        if (! $this->db->tableExists('personnel_accomplishments')) return;
        if (! $this->db->fieldExists('duplicate_hash', 'personnel_accomplishments')) {
            $this->forge->addColumn('personnel_accomplishments', [
                'duplicate_hash' => ['type' => 'CHAR', 'constraint' => 64, 'null' => true, 'after' => 'category_metadata'],
            ]);
        }
        $indexes = $this->db->getIndexData('personnel_accomplishments');
        if (! isset($indexes['uq_personnel_accomplishment_duplicate'])) {
            $this->forge->addKey(['personnel_profile_id', 'duplicate_hash'], false, true, 'uq_personnel_accomplishment_duplicate');
            $this->forge->processIndexes('personnel_accomplishments');
        }
        if ($this->db->tableExists('personnel_accomplishment_evidence') && $this->db->fieldExists('sha256', 'personnel_accomplishment_evidence')) {
            $evidenceIndexes = $this->db->getIndexData('personnel_accomplishment_evidence');
            if (! isset($evidenceIndexes['uq_personnel_evidence_checksum'])) {
                $this->forge->addKey(['accomplishment_id', 'sha256'], false, true, 'uq_personnel_evidence_checksum');
                $this->forge->processIndexes('personnel_accomplishment_evidence');
            }
        }
        if ($this->db->tableExists('notifications') && ! $this->db->fieldExists('workflow_event_id', 'notifications')) {
            $this->forge->addColumn('notifications', ['workflow_event_id' => ['type' => 'VARCHAR', 'constraint' => 64, 'null' => true, 'after' => 'reference_id']]);
            $this->forge->addKey(['workflow_event_id', 'recipient_profile_id', 'notification_type'], false, true, 'uq_notification_workflow_event_recipient');
            $this->forge->processIndexes('notifications');
        }
    }

    public function down()
    {
        if (! $this->db->tableExists('personnel_accomplishments')) return;
        if ($this->db->tableExists('personnel_accomplishment_evidence')) {
            $evidenceIndexes = $this->db->getIndexData('personnel_accomplishment_evidence');
            if (isset($evidenceIndexes['uq_personnel_evidence_checksum'])) $this->db->query('ALTER TABLE personnel_accomplishment_evidence DROP INDEX uq_personnel_evidence_checksum');
        }
        if ($this->db->tableExists('notifications') && $this->db->fieldExists('workflow_event_id', 'notifications')) {
            $indexes = $this->db->getIndexData('notifications');
            if (isset($indexes['uq_notification_workflow_event_recipient'])) $this->db->query('ALTER TABLE notifications DROP INDEX uq_notification_workflow_event_recipient');
            $this->forge->dropColumn('notifications', 'workflow_event_id');
        }
        $indexes = $this->db->getIndexData('personnel_accomplishments');
        if (isset($indexes['uq_personnel_accomplishment_duplicate'])) $this->db->query('ALTER TABLE personnel_accomplishments DROP INDEX uq_personnel_accomplishment_duplicate');
        if ($this->db->fieldExists('duplicate_hash', 'personnel_accomplishments')) $this->forge->dropColumn('personnel_accomplishments', 'duplicate_hash');
    }
}
