# Portfolio Snapshot Evidence Binding

## Snapshot Submission
When a portfolio is submitted under Plan C:
1. `personnel_evaluation_items.evidence_id` is populated with the exact `evidence_id` referenced by the accomplishment at the moment of submission.
2. The snapshot freezes this identifier point-in-time.
3. No transient client URLs, browser blobs, or unpersisted paths are stored in the snapshot.
4. If an accomplishment attached evidence is later replaced in editable working revisions, the historical snapshot continues to point to the original `evidence_id`.
