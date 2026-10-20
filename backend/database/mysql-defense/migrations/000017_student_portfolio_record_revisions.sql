-- Preserve verified achievement records while a student edits a separate revision.
ALTER TABLE student_portfolio_records
    ADD COLUMN revision_of_record_id CHAR(36) NULL AFTER status,
    ADD KEY idx_portfolio_revision_parent_status (revision_of_record_id, status),
    ADD CONSTRAINT fk_portfolio_revision_parent
        FOREIGN KEY (revision_of_record_id) REFERENCES student_portfolio_records(id) ON DELETE RESTRICT;

ALTER TABLE student_portfolio_verification_events
    DROP CHECK ck_verification_events_action,
    ADD CONSTRAINT ck_verification_events_action
        CHECK (action IN ('submitted', 'revision_requested', 'resubmitted', 'verified', 'rejected', 'superseded'));
