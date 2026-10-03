<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: 2026-08-30-000028_AddOrganizationLogoMetadata.php
 * Domain: Student Organization Logo & Asset Metadata Storage
 * Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
 *
 * NOTE: Prepared during Phase D (Database Safety & Migration Preparation).
 * Unapplied until Phase E execution.
 */
class AddOrganizationLogoMetadata extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE organizations
    ADD COLUMN logo_storage_key VARCHAR(500) NULL AFTER status,
    ADD COLUMN logo_original_name VARCHAR(255) NULL AFTER logo_storage_key,
    ADD COLUMN logo_mime_type VARCHAR(100) NULL AFTER logo_original_name,
    ADD COLUMN logo_updated_at DATETIME(6) NULL AFTER logo_mime_type;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE organizations
    DROP COLUMN logo_storage_key,
    DROP COLUMN logo_original_name,
    DROP COLUMN logo_mime_type,
    DROP COLUMN logo_updated_at;
SQL);
    }
}
