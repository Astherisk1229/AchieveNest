<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class GovernStudentCertificates extends Migration
{
    public function up()
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Governed student certificates require MySQLi.');
        $statements = [<<<'SQL'
CREATE TABLE IF NOT EXISTS certificate_signatory_authorizations (
 id CHAR(36) PRIMARY KEY, person_id CHAR(36) NOT NULL, role_code VARCHAR(64) NOT NULL,
 status ENUM('ACTIVE','SUSPENDED','EXPIRED','REVOKED') NOT NULL DEFAULT 'ACTIVE', valid_from DATE NOT NULL,
 valid_until DATE NULL, scope_json JSON NULL, created_by CHAR(36) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_cert_signatory_person_role (person_id,role_code), KEY idx_cert_signatory_validity (status,valid_from,valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
<<<'SQL'
CREATE TABLE IF NOT EXISTS certificate_signature_assets (
 id CHAR(36) PRIMARY KEY, person_id CHAR(36) NOT NULL, storage_path VARCHAR(500) NOT NULL,
 status ENUM('PENDING','APPROVED','REVOKED','EXPIRED') NOT NULL DEFAULT 'PENDING', valid_from DATE NULL,
 valid_until DATE NULL, approved_by CHAR(36) NULL, approved_at DATETIME NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_cert_signature_person_status (person_id,status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
<<<'SQL'
CREATE TABLE IF NOT EXISTS certificate_number_sequences (
 issue_year SMALLINT UNSIGNED PRIMARY KEY, next_value BIGINT UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
<<<'SQL'
CREATE TABLE IF NOT EXISTS certificate_issuances (
 id CHAR(36) PRIMARY KEY, certificate_number VARCHAR(40) NOT NULL, public_verification_id CHAR(64) NOT NULL,
 student_id CHAR(36) NOT NULL, source_record_type VARCHAR(64) NOT NULL, source_record_id CHAR(36) NOT NULL,
 certificate_purpose ENUM('PARTICIPATION','COMPLETION','APPRECIATION','RECOGNITION') NOT NULL,
 template_family_id CHAR(36) NOT NULL, template_version_id CHAR(36) NOT NULL,
 status ENUM('ISSUED','SUPERSEDED','REVOKED') NOT NULL DEFAULT 'ISSUED', issued_by CHAR(36) NOT NULL,
 issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, supersedes_certificate_id CHAR(36) NULL,
 superseded_by_certificate_id CHAR(36) NULL, reissue_reason VARCHAR(64) NULL, reissue_reason_details TEXT NULL,
 revoked_at DATETIME NULL, revoked_by CHAR(36) NULL, revocation_reason TEXT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 current_identity VARCHAR(220) GENERATED ALWAYS AS (CASE WHEN status='ISSUED' THEN CONCAT(student_id,':',source_record_type,':',source_record_id,':',certificate_purpose) ELSE NULL END) STORED,
 UNIQUE KEY uq_certificate_number (certificate_number), UNIQUE KEY uq_certificate_public_verification (public_verification_id),
 UNIQUE KEY uq_certificate_current_identity (current_identity), KEY idx_certificate_student_date (student_id,issued_at),
 KEY idx_certificate_source (source_record_type,source_record_id), KEY idx_certificate_template (template_version_id),
 CONSTRAINT fk_certificate_student FOREIGN KEY (student_id) REFERENCES profiles(id) ON DELETE RESTRICT,
 CONSTRAINT fk_certificate_source_record FOREIGN KEY (source_record_id) REFERENCES student_portfolio_records(id) ON DELETE RESTRICT,
 CONSTRAINT fk_certificate_template_family FOREIGN KEY (template_family_id) REFERENCES certificate_template_families(id) ON DELETE RESTRICT,
 CONSTRAINT fk_certificate_template_version FOREIGN KEY (template_version_id) REFERENCES certificate_template_versions(id) ON DELETE RESTRICT,
 CONSTRAINT fk_certificate_issuer FOREIGN KEY (issued_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
<<<'SQL'
CREATE TABLE IF NOT EXISTS certificate_issuance_snapshots (
 id CHAR(36) PRIMARY KEY, certificate_issuance_id CHAR(36) NOT NULL, snapshot_json JSON NOT NULL,
 created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_certificate_snapshot_issuance (certificate_issuance_id),
 CONSTRAINT fk_certificate_snapshot_issuance FOREIGN KEY (certificate_issuance_id) REFERENCES certificate_issuances(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL,
<<<'SQL'
CREATE TABLE IF NOT EXISTS certificate_idempotency (
 id CHAR(36) PRIMARY KEY, actor_profile_id CHAR(36) NOT NULL, idempotency_key VARCHAR(120) NOT NULL,
 request_hash CHAR(64) NOT NULL, response_json JSON NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uq_certificate_idempotency (actor_profile_id,idempotency_key),
 CONSTRAINT fk_certificate_idempotency_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL];
        foreach ($statements as $statement) $this->db->query($statement);
        $this->db->resetDataCache();
        foreach (['certificate_signatory_authorizations','certificate_signature_assets','certificate_number_sequences','certificate_issuances','certificate_issuance_snapshots','certificate_idempotency'] as $table) {
            if (! $this->db->tableExists($table)) throw new RuntimeException("Certificate table {$table} was not created.");
        }
        $this->extendTemplates();
    }

    private function extendTemplates(): void
    {
        if (! $this->db->tableExists('certificate_template_families') || ! $this->db->tableExists('certificate_template_versions')) throw new RuntimeException('Baseline certificate template registry is missing.');
        foreach (['certificate_purpose'=>['type'=>'VARCHAR','constraint'=>20,'null'=>true],'variant_code'=>['type'=>'VARCHAR','constraint'=>64,'null'=>true],'supported_capabilities'=>['type'=>'JSON','null'=>true],'is_default'=>['type'=>'TINYINT','constraint'=>1,'default'=>0]] as $name=>$definition) if (!$this->db->fieldExists($name,'certificate_template_families')) $this->forge->addColumn('certificate_template_families',[$name=>$definition]);
        foreach (['placeholder_contract_json'=>['type'=>'JSON','null'=>true],'signatory_slots_json'=>['type'=>'JSON','null'=>true],'created_at'=>['type'=>'DATETIME','null'=>true]] as $name=>$definition) if (!$this->db->fieldExists($name,'certificate_template_versions')) $this->forge->addColumn('certificate_template_versions',[$name=>$definition]);
    }

    public function down(): void
    {
        foreach (['certificate_idempotency', 'certificate_issuance_snapshots', 'certificate_issuances', 'certificate_number_sequences', 'certificate_signature_assets', 'certificate_signatory_authorizations'] as $table) {
            $this->forge->dropTable($table, true);
        }

        $this->db->resetDataCache();

        foreach (['placeholder_contract_json', 'signatory_slots_json'] as $column) {
            if ($this->db->fieldExists($column, 'certificate_template_versions')) {
                $this->forge->dropColumn('certificate_template_versions', $column);
            }
        }

        foreach (['certificate_purpose', 'variant_code', 'supported_capabilities', 'is_default'] as $column) {
            if ($this->db->fieldExists($column, 'certificate_template_families')) {
                $this->forge->dropColumn('certificate_template_families', $column);
            }
        }
    }
}
