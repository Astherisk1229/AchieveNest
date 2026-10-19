-- Add an OSAD-managed inclusive date window for student portfolio submission.
ALTER TABLE osad_portfolio_submission_portals
    ADD COLUMN start_date DATE NULL AFTER award_period,
    ADD COLUMN end_date DATE NULL AFTER start_date,
    ADD CONSTRAINT ck_osad_portal_date_range
        CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date);
