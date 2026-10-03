# Deletion Workflow Audit

## Audit of Confirmed Deletion Refinement
1. **Owner-Authorized Complete Deletion**:
   - The personnel owner has the confirmed authority to request complete deletion of their portfolio and evidence records.
   - Owner may ask HR Admin to execute the deletion on their behalf with documented justification.
2. **Current Implementation Analysis**:
   - `PersonnelAccomplishmentController::delete($id)`: Safely deletes physical files via `deletePhysicalFile` before deleting DB rows.
   - `PersonnelPortfolioSubmissionController::purge()` (Phase C5 exception): Purges accomplishments, evaluation roots, and evaluation submissions.
   - *Risk Identified*: `purge()` currently deletes `personnel_accomplishment_evidence` database rows without iterating over storage paths to delete physical files from the storage provider.
3. **Audit Outcome**: Documented in Risk Register as RISK-I0-02 to be rectified in Phase I4/I6.
