-- ============================================================================
-- Migration: 000007_notifications.sql
-- Domain: Persistent Notifications and User Preferences
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Notifications (Persistent in-app workflow, security, and governance alerts)
CREATE TABLE IF NOT EXISTS notifications (
    id CHAR(36) NOT NULL PRIMARY KEY,
    recipient_profile_id CHAR(36) NOT NULL,
    actor_profile_id CHAR(36) NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    reference_type VARCHAR(50) NULL,
    reference_id CHAR(36) NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT 0,
    read_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Notification Preferences (User-level channel toggles for optional notifications)
CREATE TABLE IF NOT EXISTS notification_preferences (
    id CHAR(36) NOT NULL PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    category VARCHAR(50) NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT 1,
    in_app_enabled BOOLEAN NOT NULL DEFAULT 1,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_notif_prefs_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE KEY uq_profile_notif_category (profile_id, category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
