# Submitted Snapshot Evidence Audit

## Findings
1. **Plan C Submission Snapshots**:
   - Stored in table `personnel_evaluation_items`.
   - Each item captures `file_name` and `file_url` (`storage_path`) at point of submission.
2. **Version Independence**:
   - Version 1 captures point-in-time storage paths of evidence.
   - If returned for revision and resubmitted as Version 2, Version 2 creates new rows in `personnel_evaluation_items` while Version 1 rows remain immutable.
3. **Identified Risk (RISK-I0-03)**:
   - `personnel_evaluation_items` references `file_url` as string path rather than explicit foreign key `evidence_id` to `personnel_accomplishment_evidence.id`.
   - Recommended for hardening in Phase I2.
