<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/** Adds immutable, coordinator-reviewed revision lineage to student portfolio records. */
final class AddStudentPortfolioRecordRevisions extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver === 'Postgre') {
            if (! $this->db->fieldExists('revision_of_record_id', 'student_portfolio_records')) {
                $this->db->query("ALTER TABLE public.student_portfolio_records ADD COLUMN revision_of_record_id uuid NULL REFERENCES public.student_portfolio_records(id) ON DELETE RESTRICT");
            }
            $this->db->query("CREATE INDEX IF NOT EXISTS idx_portfolio_revision_parent_status ON public.student_portfolio_records(revision_of_record_id, status)");
            $this->db->query("ALTER TABLE public.student_portfolio_verification_events DROP CONSTRAINT IF EXISTS student_portfolio_verification_events_action_check");
            $this->db->query("ALTER TABLE public.student_portfolio_verification_events ADD CONSTRAINT student_portfolio_verification_events_action_check CHECK (action IN ('submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected', 'superseded', 'scoring_requested', 'criteria_scored', 'scoring_failed'))");
            return;
        }
        if ($this->db->DBDriver !== 'MySQLi') {
            throw new \RuntimeException('Student portfolio record revisions require PostgreSQL or MySQL.');
        }

        if (! $this->db->fieldExists('revision_of_record_id', 'student_portfolio_records')) {
            $this->db->query("ALTER TABLE student_portfolio_records ADD COLUMN revision_of_record_id CHAR(36) NULL AFTER status");
        }
        $hasRevisionForeignKey = $this->db->query("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'student_portfolio_records' AND CONSTRAINT_NAME = 'fk_portfolio_revision_parent' AND CONSTRAINT_TYPE = 'FOREIGN KEY'")->getRowArray();
        if (! $hasRevisionForeignKey) {
            $this->db->query("ALTER TABLE student_portfolio_records ADD CONSTRAINT fk_portfolio_revision_parent FOREIGN KEY (revision_of_record_id) REFERENCES student_portfolio_records(id) ON DELETE RESTRICT");
        }
        $hasRevisionIndex = $this->db->query("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_portfolio_records' AND INDEX_NAME = 'idx_portfolio_revision_parent_status'")->getRowArray();
        if (! $hasRevisionIndex) {
            $this->db->query("ALTER TABLE student_portfolio_records ADD KEY idx_portfolio_revision_parent_status (revision_of_record_id, status)");
        }
        $actionChecks = $this->db->query("SELECT tc.CONSTRAINT_NAME AS name FROM information_schema.TABLE_CONSTRAINTS tc JOIN information_schema.CHECK_CONSTRAINTS cc ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA = DATABASE() AND tc.TABLE_NAME = 'student_portfolio_verification_events' AND tc.CONSTRAINT_TYPE = 'CHECK' AND cc.CHECK_CLAUSE LIKE '%action%'")->getResultArray();
        foreach ($actionChecks as $actionCheck) {
            $constraintName = str_replace('`', '``', (string) $actionCheck['name']);
            $this->db->query("ALTER TABLE student_portfolio_verification_events DROP CHECK `{$constraintName}`");
        }
        $this->db->query("ALTER TABLE student_portfolio_verification_events ADD CONSTRAINT ck_verification_events_action CHECK (action IN ('submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected', 'superseded', 'scoring_requested', 'criteria_scored', 'scoring_failed'))");
    }

    public function down()
    {
        if ($this->db->DBDriver === 'Postgre') {
            $this->db->query("ALTER TABLE public.student_portfolio_verification_events DROP CONSTRAINT IF EXISTS student_portfolio_verification_events_action_check");
            $this->db->query("ALTER TABLE public.student_portfolio_verification_events ADD CONSTRAINT student_portfolio_verification_events_action_check CHECK (action IN ('submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected', 'scoring_requested', 'criteria_scored', 'scoring_failed'))");
            $this->db->query("ALTER TABLE public.student_portfolio_records DROP CONSTRAINT IF EXISTS student_portfolio_records_revision_of_record_id_fkey");
            $this->db->query("DROP INDEX IF EXISTS public.idx_portfolio_revision_parent_status");
            if ($this->db->fieldExists('revision_of_record_id', 'student_portfolio_records')) {
                $this->db->query("ALTER TABLE public.student_portfolio_records DROP COLUMN revision_of_record_id");
            }
            return;
        }
        if ($this->db->DBDriver !== 'MySQLi') return;
        $hasActionCheck = $this->db->query("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'student_portfolio_verification_events' AND CONSTRAINT_NAME = 'ck_verification_events_action' AND CONSTRAINT_TYPE = 'CHECK'")->getRowArray();
        if ($hasActionCheck) {
            $this->db->query("ALTER TABLE student_portfolio_verification_events DROP CHECK ck_verification_events_action");
        }
        $this->db->query("ALTER TABLE student_portfolio_verification_events ADD CONSTRAINT ck_verification_events_action CHECK (action IN ('submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected', 'scoring_requested', 'criteria_scored', 'scoring_failed'))");
        $hasRevisionForeignKey = $this->db->query("SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'student_portfolio_records' AND CONSTRAINT_NAME = 'fk_portfolio_revision_parent' AND CONSTRAINT_TYPE = 'FOREIGN KEY'")->getRowArray();
        if ($hasRevisionForeignKey) $this->db->query("ALTER TABLE student_portfolio_records DROP FOREIGN KEY fk_portfolio_revision_parent");
        $hasRevisionIndex = $this->db->query("SELECT 1 FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_portfolio_records' AND INDEX_NAME = 'idx_portfolio_revision_parent_status'")->getRowArray();
        if ($hasRevisionIndex) $this->db->query("ALTER TABLE student_portfolio_records DROP INDEX idx_portfolio_revision_parent_status");
        if ($this->db->fieldExists('revision_of_record_id', 'student_portfolio_records')) {
            $this->db->query("ALTER TABLE student_portfolio_records DROP COLUMN revision_of_record_id");
        }
    }
}
