<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;
use RuntimeException;

final class GovernCertificateAssets extends Migration
{
    public function up(): void
    {
        if ($this->db->DBDriver !== 'MySQLi') throw new RuntimeException('Governed certificate assets require MySQLi.');
        $this->db->query("CREATE TABLE IF NOT EXISTS certificate_assets (
            id CHAR(36) PRIMARY KEY, asset_type ENUM('BACKGROUND','BORDER_FRAME','LOGO','SEAL','WATERMARK','DECORATIVE_ELEMENT','FONT') NOT NULL,
            display_name VARCHAR(180) NOT NULL, status ENUM('ACTIVE','ARCHIVED','REJECTED') NOT NULL DEFAULT 'ACTIVE', system_owned TINYINT(1) NOT NULL DEFAULT 0,
            created_by CHAR(36) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            archived_at DATETIME NULL, KEY idx_certificate_assets_picker (asset_type,status), KEY idx_certificate_assets_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $this->db->query("CREATE TABLE IF NOT EXISTS certificate_asset_versions (
            id CHAR(36) PRIMARY KEY, asset_id CHAR(36) NOT NULL, version_number INT UNSIGNED NOT NULL, mime_type VARCHAR(100) NOT NULL,
            file_size BIGINT UNSIGNED NOT NULL, storage_key VARCHAR(500) NOT NULL, checksum CHAR(64) NOT NULL, metadata_json JSON NULL,
            renderer_compatible TINYINT(1) NOT NULL DEFAULT 0, created_by CHAR(36) NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_certificate_asset_version (asset_id,version_number), UNIQUE KEY uq_certificate_asset_storage (storage_key),
            KEY idx_certificate_asset_checksum (checksum), CONSTRAINT fk_certificate_asset_version_asset FOREIGN KEY (asset_id) REFERENCES certificate_assets(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        $this->db->query("CREATE TABLE IF NOT EXISTS certificate_template_asset_bindings (
            id CHAR(36) PRIMARY KEY, template_version_id CHAR(36) NOT NULL, binding_role VARCHAR(64) NOT NULL, asset_version_id CHAR(36) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_certificate_template_asset_role (template_version_id,binding_role),
            KEY idx_certificate_binding_asset_version (asset_version_id),
            CONSTRAINT fk_certificate_binding_template FOREIGN KEY (template_version_id) REFERENCES certificate_template_versions(id) ON DELETE CASCADE,
            CONSTRAINT fk_certificate_binding_asset_version FOREIGN KEY (asset_version_id) REFERENCES certificate_asset_versions(id) ON DELETE RESTRICT
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        foreach (['certificate_assets','certificate_asset_versions','certificate_template_asset_bindings'] as $table) if (! $this->db->tableExists($table, false)) throw new RuntimeException("Certificate asset table {$table} was not created.");
    }

    public function down(): void
    {
        foreach (['certificate_template_asset_bindings','certificate_asset_versions','certificate_assets'] as $table) $this->forge->dropTable($table, true);
    }
}
