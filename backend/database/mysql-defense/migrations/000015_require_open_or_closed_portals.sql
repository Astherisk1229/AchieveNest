-- Retire any previously saved portal drafts and prevent the status from returning.
UPDATE osad_portfolio_submission_portals
SET status = 'closed', closed_at = COALESCE(closed_at, CURRENT_TIMESTAMP(6))
WHERE status = 'draft';

ALTER TABLE osad_portfolio_submission_portals
    DROP CHECK ck_osad_portal_status,
    ADD CONSTRAINT ck_osad_portal_status CHECK (status IN ('open','closed'));
