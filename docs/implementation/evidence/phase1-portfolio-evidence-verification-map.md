# Plan 05 Phase 1 — Evidence & Verification Traceability Map
## Cross-View Evidence and Lifecycle Verification Entity Alignment

### 1. Evidence Entities
- **Underlying Authority**: `student_portfolio_evidence`.
- **Foreign Key Binding**: `portfolio_record_id` -> `student_portfolio_records.id`.
- **Storage Path**: Managed canonically via `LocalEvidenceStorageService`.
- **Integrity Status**: 0 duplicate evidence records created during OSAD inspection or award review.

### 2. Verification History Entities
- **Underlying Authority**: `student_portfolio_verification_events`.
- **Lifecycle Action Log**: Tracks `submitted`, `under_review`, `revisions_requested`, `resubmitted`, `verified`, `rejected`.
- **Actor Identity**: Joined with `profiles` to show the full name and role of the verifying personnel.
- **Traceability Status**: 100% shared authority across coordinator queues and OSAD audit views.
