# Phase J2 Evidence: Point-in-Time Snapshot & Evidence Immutability

## Snapshot Integrity Rules
1. **Submitted Snapshots are Read-Only**: Once submitted, Version N is locked. Creating a revision request unlocks the *working draft* (Plan C), but the submitted rows of Version N remain immutable.
2. **Evidence Identity Retention**: The canonical `evidence_id` in Version N remains strictly tied to the historical file. Replacement in the working draft allocates a new evidence record and does not overwrite historical proofs.
3. **Reviewer Message Protection**: Personnel has no write access to reviewer messages, deficiency codes, or reviewer comments.
