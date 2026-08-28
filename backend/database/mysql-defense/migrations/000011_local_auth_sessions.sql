-- ============================================================================
-- Migration: 000011_local_auth_sessions.sql
-- Domain: Local Authentication Credentials and Server-Side Session Registry
-- Engine: MySQL 8.4.7 (InnoDB, utf8mb4_unicode_ci)
-- ============================================================================

-- 1. Local Auth Credentials (Authentication credentials for local-defense mode)
CREATE TABLE IF NOT EXISTS local_auth_credentials (
    profile_id CHAR(36) NOT NULL PRIMARY KEY,
    password_hash VARCHAR(255) NOT NULL,
    password_changed_at DATETIME(6) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_local_auth_credentials_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT ck_local_auth_credentials_status CHECK (status IN ('active', 'disabled', 'locked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Local Auth Sessions (Server-side session tracking and immediate token revocation)
CREATE TABLE IF NOT EXISTS local_auth_sessions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    profile_id CHAR(36) NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    issued_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    expires_at DATETIME(6) NOT NULL,
    last_seen_at DATETIME(6) NULL,
    revoked_at DATETIME(6) NULL,
    revocation_reason VARCHAR(64) NULL,
    created_ip VARCHAR(45) NULL,
    user_agent_hash CHAR(64) NULL,
    CONSTRAINT fk_local_auth_sessions_profile FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- High-value session search indexes
CREATE INDEX idx_local_auth_sessions_profile ON local_auth_sessions(profile_id);
CREATE INDEX idx_local_auth_sessions_revoked ON local_auth_sessions(revoked_at);
CREATE INDEX idx_local_auth_sessions_expires ON local_auth_sessions(expires_at);
