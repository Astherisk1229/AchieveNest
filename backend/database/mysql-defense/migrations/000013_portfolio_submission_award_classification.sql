-- Per-student OSAD award grants and award links for each immutable portfolio version.
CREATE TABLE IF NOT EXISTS osad_portfolio_submission_access_awards (
    id CHAR(36) NOT NULL PRIMARY KEY,
    access_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    assigned_by CHAR(36) NOT NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_osad_access_award (access_id, award_definition_id),
    KEY idx_osad_access_award_definition (award_definition_id),
    CONSTRAINT fk_osad_access_award_access FOREIGN KEY (access_id) REFERENCES osad_portfolio_submission_access(id) ON DELETE CASCADE,
    CONSTRAINT fk_osad_access_award_definition FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_access_award_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS osad_portfolio_submission_submission_awards (
    id CHAR(36) NOT NULL PRIMARY KEY,
    submission_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    selected_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_osad_submission_award (submission_id, award_definition_id),
    KEY idx_osad_submission_award_definition (award_definition_id),
    CONSTRAINT fk_osad_submission_award_submission FOREIGN KEY (submission_id) REFERENCES osad_portfolio_submissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_osad_submission_award_definition FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Keep previous portals functional where a single award was already configured.
INSERT INTO osad_portfolio_submission_access_awards (id, access_id, award_definition_id, assigned_by, assigned_at)
SELECT UUID(), a.id, p.award_definition_id, a.selected_by, a.selected_at
FROM osad_portfolio_submission_access a
JOIN osad_portfolio_submission_portals p ON p.id = a.portal_id
WHERE p.award_definition_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM osad_portfolio_submission_access_awards aa
      WHERE aa.access_id = a.id AND aa.award_definition_id = p.award_definition_id
  );

INSERT INTO osad_portfolio_submission_submission_awards (id, submission_id, award_definition_id)
SELECT UUID(), s.id, p.award_definition_id
FROM osad_portfolio_submissions s
JOIN osad_portfolio_submission_portals p ON p.id = s.portal_id
WHERE p.award_definition_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM osad_portfolio_submission_submission_awards sa
      WHERE sa.submission_id = s.id AND sa.award_definition_id = p.award_definition_id
  );
