<?php

namespace App\Database\Migrations;

use CodeIgniter\Database\Migration;

/**
 * Migration: 2026-08-30-000029_AddCollegeBrandingMetadata.php
 * Domain: College Branding, Visual Identity & Badge Colors
 * Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
 */
class AddCollegeBrandingMetadata extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE colleges
    ADD COLUMN logo_storage_key VARCHAR(500) NULL AFTER status,
    ADD COLUMN logo_original_name VARCHAR(255) NULL AFTER logo_storage_key,
    ADD COLUMN logo_mime_type VARCHAR(100) NULL AFTER logo_original_name,
    ADD COLUMN logo_updated_at DATETIME(6) NULL AFTER logo_mime_type,
    ADD COLUMN acronym_badge_color VARCHAR(7) NULL AFTER logo_updated_at;
SQL);
    }

    public function down()
    {
        $this->db->query(<<<'SQL'
ALTER TABLE colleges
    DROP COLUMN logo_storage_key,
    DROP COLUMN logo_original_name,
    DROP COLUMN logo_mime_type,
    DROP COLUMN logo_updated_at,
    DROP COLUMN acronym_badge_color;
SQL);
    }
}
