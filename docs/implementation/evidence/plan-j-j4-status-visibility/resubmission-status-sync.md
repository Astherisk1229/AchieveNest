# Resubmission Status Synchronization Evidence

### Candidate Resubmission Action
1. Candidate addresses revision items and submits revised portfolio.
2. Canonical lifecycle transitions to `submitted` or `in_evaluation` (based on review queue state).
3. Active portfolio version increments (e.g. V1 -> V2).
4. `revision_request_status` marks prior request as resolved/historical.
5. All authorized views (Personnel, Dean, HR) immediately clear stale `returned_for_revision` banners and reflect new version and active status.
