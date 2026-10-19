-- Persist award sections independently from student selection records.
ALTER TABLE osad_portfolio_submission_portals
    ADD COLUMN award_period VARCHAR(120) NOT NULL DEFAULT '' AFTER title;

CREATE TABLE IF NOT EXISTS osad_portfolio_submission_portal_awards (
    id CHAR(36) NOT NULL PRIMARY KEY,
    portal_id CHAR(36) NOT NULL,
    award_definition_id CHAR(36) NOT NULL,
    assigned_by CHAR(36) NOT NULL,
    assigned_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    UNIQUE KEY uq_osad_portal_award (portal_id, award_definition_id),
    KEY idx_osad_portal_award_definition (award_definition_id),
    CONSTRAINT fk_osad_portal_award_portal FOREIGN KEY (portal_id) REFERENCES osad_portfolio_submission_portals(id) ON DELETE CASCADE,
    CONSTRAINT fk_osad_portal_award_definition FOREIGN KEY (award_definition_id) REFERENCES award_definitions(id) ON DELETE RESTRICT,
    CONSTRAINT fk_osad_portal_award_assigner FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO osad_portfolio_submission_portal_awards (id, portal_id, award_definition_id, assigned_by, assigned_at)
SELECT UUID(), p.id, aa.award_definition_id, p.created_by, p.created_at
FROM osad_portfolio_submission_portals p
JOIN osad_portfolio_submission_access a ON a.portal_id = p.id
JOIN osad_portfolio_submission_access_awards aa ON aa.access_id = a.id;

INSERT IGNORE INTO osad_portfolio_submission_portal_awards (id, portal_id, award_definition_id, assigned_by, assigned_at)
SELECT UUID(), p.id, p.award_definition_id, p.created_by, p.created_at
FROM osad_portfolio_submission_portals p
WHERE p.award_definition_id IS NOT NULL;
