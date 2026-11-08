<?php

namespace Phase2\Database\Migrations;

use CodeIgniter\Database\Migration;

final class CreateOsadPortfolioSubmissionPortal extends Migration
{
    public function up()
    {
        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_portals (
  id CHAR(36) NOT NULL,
  award_definition_id CHAR(36) NULL,
  title VARCHAR(180) NOT NULL,
  award_period VARCHAR(120) NOT NULL DEFAULT '',
  start_date DATE NULL,
  end_date DATE NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'open',
  created_by CHAR(36) NOT NULL,
  updated_by CHAR(36) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  closed_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  KEY idx_osad_portal_status (status),
  KEY idx_osad_portal_award (award_definition_id),
  CONSTRAINT fk_osad_portal_award FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE SET NULL,
  CONSTRAINT fk_osad_portal_creator FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_updater FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT ck_osad_portal_status CHECK (status IN ('open','closed')),
  CONSTRAINT ck_osad_portal_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        if (! $this->db->fieldExists('award_period', 'osad_portfolio_submission_portals')) {
            $this->db->query("ALTER TABLE osad_portfolio_submission_portals ADD COLUMN award_period VARCHAR(120) NOT NULL DEFAULT '' AFTER title");
        }
        if (! $this->db->fieldExists('start_date', 'osad_portfolio_submission_portals')) {
            $this->db->query('ALTER TABLE osad_portfolio_submission_portals ADD COLUMN start_date DATE NULL AFTER award_period');
        }
        if (! $this->db->fieldExists('end_date', 'osad_portfolio_submission_portals')) {
            $this->db->query('ALTER TABLE osad_portfolio_submission_portals ADD COLUMN end_date DATE NULL AFTER start_date');
        }

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_access (
  id CHAR(36) NOT NULL,
  portal_id CHAR(36) NOT NULL,
  student_profile_id CHAR(36) NOT NULL,
  access_status VARCHAR(20) NOT NULL DEFAULT 'active',
  submission_state VARCHAR(20) NOT NULL DEFAULT 'not_started',
  selected_by CHAR(36) NOT NULL,
  selected_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  current_submission_id CHAR(36) NULL,
  evaluation_started_at DATETIME(6) NULL,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_osad_portal_student (portal_id, student_profile_id),
  KEY idx_osad_portal_access_student (student_profile_id, access_status, submission_state),
  CONSTRAINT fk_osad_portal_access_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE CASCADE,
  CONSTRAINT fk_osad_portal_access_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_access_selector FOREIGN KEY (selected_by) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT ck_osad_portal_access_status CHECK (access_status IN ('active','revoked')),
  CONSTRAINT ck_osad_portal_submission_state CHECK (submission_state IN ('not_started','draft','submitted','reopened'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submissions (
  id CHAR(36) NOT NULL,
  portal_id CHAR(36) NOT NULL,
  student_profile_id CHAR(36) NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  snapshot_json LONGTEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'current',
  submitted_by CHAR(36) NOT NULL,
  submitted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_osad_portal_submission_version (portal_id, student_profile_id, version_number),
  KEY idx_osad_portal_submission_current (portal_id, student_profile_id, status, version_number),
  CONSTRAINT fk_osad_portal_submission_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_submission_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_submission_actor FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT ck_osad_portal_submission_status CHECK (status IN ('current','superseded'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        if (! $this->constraintExists('fk_osad_portal_access_current_submission')) {
            $this->db->query(<<<'SQL'
ALTER TABLE osad_portfolio_submission_access
  ADD CONSTRAINT fk_osad_portal_access_current_submission
  FOREIGN KEY (current_submission_id) REFERENCES osad_portfolio_submissions(id) ON DELETE SET NULL
SQL);
        }

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_events (
  id CHAR(36) NOT NULL,
  portal_id CHAR(36) NOT NULL,
  student_profile_id CHAR(36) NOT NULL,
  submission_id CHAR(36) NULL,
  actor_profile_id CHAR(36) NOT NULL,
  event_type VARCHAR(32) NOT NULL,
  reason TEXT NULL,
  evaluation_exception TINYINT(1) NOT NULL DEFAULT 0,
  occurred_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_osad_portal_events_history (portal_id, student_profile_id, occurred_at),
  CONSTRAINT fk_osad_portal_event_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_event_student FOREIGN KEY (student_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_event_submission FOREIGN KEY (submission_id) REFERENCES osad_portfolio_submissions(id) ON DELETE SET NULL,
  CONSTRAINT fk_osad_portal_event_actor FOREIGN KEY (actor_profile_id) REFERENCES profiles(id) ON DELETE RESTRICT,
  CONSTRAINT ck_osad_portal_event_type CHECK (event_type IN ('student_selected','draft_started','submitted','reopened','evaluation_started','portal_closed','portal_opened','access_revoked'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_access_awards (
  id CHAR(36) NOT NULL,
  access_id CHAR(36) NOT NULL,
  award_definition_id CHAR(36) NOT NULL,
  assigned_by CHAR(36) NOT NULL,
  assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_osad_access_award (access_id, award_definition_id),
  KEY idx_osad_access_award_definition (award_definition_id),
  CONSTRAINT fk_osad_access_award_access FOREIGN KEY (access_id) REFERENCES osad_portfolio_submission_access(id) ON DELETE CASCADE,
  CONSTRAINT fk_osad_access_award_definition FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_access_award_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_submission_awards (
  id CHAR(36) NOT NULL,
  submission_id CHAR(36) NOT NULL,
  award_definition_id CHAR(36) NOT NULL,
  selected_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_osad_submission_award (submission_id, award_definition_id),
  KEY idx_osad_submission_award_definition (award_definition_id),
  CONSTRAINT fk_osad_submission_award_submission FOREIGN KEY (submission_id) REFERENCES osad_portfolio_submissions(id) ON DELETE CASCADE,
  CONSTRAINT fk_osad_submission_award_definition FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_portal_awards (
  id CHAR(36) NOT NULL,
  portal_id CHAR(36) NOT NULL,
  award_definition_id CHAR(36) NOT NULL,
  assigned_by CHAR(36) NOT NULL,
  assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uq_osad_portal_award (portal_id, award_definition_id),
  KEY idx_osad_portal_award_definition (award_definition_id),
  CONSTRAINT fk_osad_portal_award_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE CASCADE,
  CONSTRAINT fk_osad_portal_award_definition FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
  CONSTRAINT fk_osad_portal_award_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
SQL);

        $this->db->query(<<<'SQL'
INSERT IGNORE INTO osad_portfolio_submission_access_awards (id, access_id, award_definition_id, assigned_by, assigned_at)
SELECT UUID(), a.id, p.award_definition_id, a.selected_by, a.selected_at
FROM osad_portfolio_submission_access a
JOIN osad_portfolio_submission_portals p ON p.id = a.portal_id
WHERE p.award_definition_id IS NOT NULL
SQL);
        $this->db->query(<<<'SQL'
INSERT IGNORE INTO osad_portfolio_submission_submission_awards (id, submission_id, award_definition_id)
SELECT UUID(), s.id, p.award_definition_id
FROM osad_portfolio_submissions s
JOIN osad_portfolio_submission_portals p ON p.id = s.portal_id
WHERE p.award_definition_id IS NOT NULL
SQL);
        $this->db->query(<<<'SQL'
INSERT IGNORE INTO osad_portfolio_submission_portal_awards (id, portal_id, award_definition_id, assigned_by, assigned_at)
SELECT UUID(), p.id, aa.award_definition_id, p.created_by, p.created_at
FROM osad_portfolio_submission_portals p
JOIN osad_portfolio_submission_access a ON a.portal_id = p.id
JOIN osad_portfolio_submission_access_awards aa ON aa.access_id = a.id
SQL);
        $this->db->query(<<<'SQL'
INSERT IGNORE INTO osad_portfolio_submission_portal_awards (id, portal_id, award_definition_id, assigned_by, assigned_at)
SELECT UUID(), p.id, p.award_definition_id, p.created_by, p.created_at
FROM osad_portfolio_submission_portals p
WHERE p.award_definition_id IS NOT NULL
SQL);

        $this->db->query("UPDATE osad_portfolio_submission_portals SET status = 'closed', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP(6)) WHERE status = 'draft'");
        if ($this->constraintExists('ck_osad_portal_status')) {
            $this->db->query('ALTER TABLE osad_portfolio_submission_portals DROP CHECK ck_osad_portal_status');
        }
        $this->db->query("ALTER TABLE osad_portfolio_submission_portals ADD CONSTRAINT ck_osad_portal_status CHECK (status IN ('open','closed'))");
        if (! $this->constraintExists('ck_osad_portal_date_range')) {
            $this->db->query('ALTER TABLE osad_portfolio_submission_portals ADD CONSTRAINT ck_osad_portal_date_range CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date)');
        }
    }

    public function down()
    {
        // Preserve live portal submissions and their immutable history.
    }

    private function constraintExists(string $name): bool
    {
        return (int) $this->db->query(
            'SELECT COUNT(*) AS total FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = ?',
            [$name]
        )->getRowArray()['total'] > 0;
    }
}
