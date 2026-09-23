# Evidence Replacement Behavior Audit

## Findings
1. **Working Draft Replacement (Plan B)**:
   - When in working draft mode (prior to submission or during revision after return), personnel can upload new evidence to an accomplishment.
   - Uploading new evidence creates a new record in `personnel_accomplishment_evidence` and physical file with a new UUID.
2. **Immutable Snapshot Protection (Plan C)**:
   - Accomplishment changes in the working draft do not overwrite past submitted `personnel_evaluation_items` rows.
   - Submitted versions retain their original historical references.
