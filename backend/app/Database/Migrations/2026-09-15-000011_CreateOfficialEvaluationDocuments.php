<?php
namespace App\Database\Migrations;
use CodeIgniter\Database\Migration;

class CreateOfficialEvaluationDocuments extends Migration
{
    public function up()
    {
        $this->db->query("CREATE TABLE IF NOT EXISTS personnel_official_evaluation_documents (
            id VARCHAR(36) PRIMARY KEY,
            hr_final_rank_review_id VARCHAR(36) NOT NULL,
            personnel_profile_id VARCHAR(36) NOT NULL,
            ranking_cycle_id VARCHAR(36) NOT NULL,
            ranking_track_id VARCHAR(36) NOT NULL,
            evaluation_id VARCHAR(36) NOT NULL,
            evaluation_version INT UNSIGNED NOT NULL,
            classification VARCHAR(32) NOT NULL,
            document_type VARCHAR(64) NOT NULL,
            final_rank_applied_for_code VARCHAR(100) NOT NULL,
            final_recommended_rank_code VARCHAR(100) NOT NULL,
            reference_number VARCHAR(80) NOT NULL,
            qr_payload TEXT NOT NULL,
            summary_payload JSON NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'current',
            superseded_by_document_id VARCHAR(36) NULL,
            generated_by_profile_id VARCHAR(36) NOT NULL,
            generated_at DATETIME NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_official_eval_document_review (hr_final_rank_review_id),
            UNIQUE KEY uq_official_eval_document_reference (reference_number),
            INDEX idx_official_eval_document_version (evaluation_id,evaluation_version,status),
            INDEX idx_official_eval_document_personnel (personnel_profile_id,generated_at),
            CONSTRAINT fk_official_eval_document_review FOREIGN KEY (hr_final_rank_review_id) REFERENCES personnel_hr_final_rank_reviews(id),
            CONSTRAINT fk_official_eval_document_personnel FOREIGN KEY (personnel_profile_id) REFERENCES personnel_profiles(profile_id),
            CONSTRAINT fk_official_eval_document_cycle FOREIGN KEY (ranking_cycle_id) REFERENCES ranking_cycles(id),
            CONSTRAINT fk_official_eval_document_track FOREIGN KEY (ranking_track_id) REFERENCES personnel_evaluation_periods(id),
            CONSTRAINT fk_official_eval_document_evaluation FOREIGN KEY (evaluation_id) REFERENCES personnel_evaluations(id),
            CONSTRAINT fk_official_eval_document_actor FOREIGN KEY (generated_by_profile_id) REFERENCES profiles(id),
            CONSTRAINT fk_official_eval_document_superseded FOREIGN KEY (superseded_by_document_id) REFERENCES personnel_official_evaluation_documents(id),
            CONSTRAINT chk_official_eval_document_classification CHECK (classification IN ('FACULTY','NON_TEACHING_FACULTY')),
            CONSTRAINT chk_official_eval_document_status CHECK (status IN ('current','superseded'))
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    }

    public function down(){ $this->forge->dropTable('personnel_official_evaluation_documents', true); }
}
