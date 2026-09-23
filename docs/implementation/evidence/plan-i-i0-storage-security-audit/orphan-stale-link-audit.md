# Orphan & Stale-Link Risk Audit

## Orphan Scenarios Evaluated
1. **DB Record without Physical File**:
   - Prevention: Storage upload precedes DB insert; failure aborts before DB insert.
2. **Physical File without DB Record**:
   - Prevention: Transaction rollback in `PersonnelAccomplishmentController::addEvidence` immediately deletes physical file.
3. **Evidence Linked to Deleted Accomplishment**:
   - Handled: Accomplishment deletion cascades to delete linked physical files and evidence DB rows.
4. **Purge Orphan Risk**:
   - Highlighted: `PersonnelPortfolioSubmissionController::purge()` must be enhanced in Plan I to delete physical files along with database rows.
5. **Stale / Expired Link Behavior**:
   - Attempting to download a non-existent or unlinked evidence ID returns clean `HTTP 404 NOT_FOUND` rather than leaking internal filesystem paths or unhandled stack traces.
