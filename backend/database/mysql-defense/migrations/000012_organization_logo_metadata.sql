-- ============================================================================
-- Migration: 000012_organization_logo_metadata.sql
-- Domain: Student Organization Logo & Asset Metadata Storage
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

ALTER TABLE organizations
    ADD COLUMN logo_storage_key VARCHAR(500) NULL AFTER status,
    ADD COLUMN logo_original_name VARCHAR(255) NULL AFTER logo_storage_key,
    ADD COLUMN logo_mime_type VARCHAR(100) NULL AFTER logo_original_name,
    ADD COLUMN logo_updated_at DATETIME(6) NULL AFTER logo_mime_type;
