# Evidence Identity & Snapshot Immutability Validation

## Identity Architecture
- Every uploaded evidence receives a canonical UUID v4 (`evidence_id`).
- Accomplishments reference `evidence_id`.
- Submitted portfolio snapshots reference `personnel_evaluation_items.evidence_id`.
- Reviewers preview documents by `evidence_id`.
- Filenames and client-local URLs are never used as identifiers.
