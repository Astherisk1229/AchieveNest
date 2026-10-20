-- Explicit OSAD access, immutable whole-portfolio snapshots, and correction history.
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_portals (
    id CHAR(36) NOT NULL PRIMARY KEY,
    award_definition_id CHAR(36) NULL,
    title VARCHAR(180) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    created_by CHAR(36) NOT NULL,
    updated_by CHAR(36) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    closed_at DATETIME(6) NULL,
    KEY idx_osad_portal_status (status),
    KEY idx_osad_portal_award (award_definition_id),
    CONSTRAINT fk_osad_portal_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE SET NULL,
    CONSTRAINT fk_osad_portal_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_updater FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL,
    CONSTRAINT ck_osad_portal_status CHECK (status IN ('open', 'closed'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS osad_portfolio_submission_access (
    id CHAR(36) NOT NULL PRIMARY KEY,
    portal_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    access_status VARCHAR(20) NOT NULL DEFAULT 'active',
    submission_state VARCHAR(20) NOT NULL DEFAULT 'not_started',
    selected_by CHAR(36) NOT NULL,
    selected_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    current_submission_id CHAR(36) NULL,
    evaluation_started_at DATETIME(6) NULL,
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_osad_portal_student (portal_id, student_profile_id),
    KEY idx_osad_portal_access_student (student_profile_id, access_status, submission_state),
    CONSTRAINT fk_osad_portal_access_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE CASCADE,
    CONSTRAINT fk_osad_portal_access_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_access_selector FOREIGN KEY (selected_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_osad_portal_access_status CHECK (access_status IN ('active', 'revoked')),
    CONSTRAINT ck_osad_portal_submission_state CHECK (submission_state IN ('not_started', 'draft', 'submitted', 'reopened'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS osad_portfolio_submissions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    portal_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    version_number INT UNSIGNED NOT NULL,
    snapshot_json LONGTEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'current',
    submitted_by CHAR(36) NOT NULL,
    submitted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_osad_portal_submission_version (portal_id, student_profile_id, version_number),
    KEY idx_osad_portal_submission_current (portal_id, student_profile_id, status, version_number),
    CONSTRAINT fk_osad_portal_submission_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_submission_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_submission_actor FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_osad_portal_submission_status CHECK (status IN ('current', 'superseded'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE osad_portfolio_submission_access
    ADD CONSTRAINT fk_osad_portal_access_current_submission
    FOREIGN KEY (current_submission_id) REFERENCES osad_portfolio_submissions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS osad_portfolio_submission_events (
    id CHAR(36) NOT NULL PRIMARY KEY,
    portal_id CHAR(36) NOT NULL,
    student_profile_id CHAR(36) NOT NULL,
    submission_id CHAR(36) NULL,
    actor_profile_id CHAR(36) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    reason TEXT NULL,
    evaluation_exception TINYINT(1) NOT NULL DEFAULT 0,
    occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY idx_osad_portal_events_history (portal_id, student_profile_id, occurred_at),
    CONSTRAINT fk_osad_portal_event_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_event_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_event_submission FOREIGN KEY (submission_id) REFERENCES osad_portfolio_submissions(id) ON DELETE SET NULL,
    CONSTRAINT fk_osad_portal_event_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
    CONSTRAINT ck_osad_portal_event_type CHECK (event_type IN ('student_selected', 'draft_started', 'submitted', 'reopened', 'evaluation_started', 'portal_closed', 'portal_opened', 'access_revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
