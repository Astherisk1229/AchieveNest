# Evidence Replacement & Versioning Validation

## Replacement Rules
- Replacement is permitted only in editable accomplishment working data.
- Replacing evidence generates a new canonical `evidence_id` for the new file.
- The previous evidence row and physical file remain untouched in database and storage to satisfy prior submitted snapshots.
- Direct replacement within locked or submitted evaluations is strictly blocked (`portfolio_submission_locked`).
