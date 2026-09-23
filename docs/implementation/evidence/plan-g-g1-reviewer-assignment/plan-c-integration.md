# Personnel Evaluation Track — Plan G — Phase G1: Plan C Integration

## Integration with Plan C (Portfolio Submission & Snapshot Integrity)

### 1. Handoff Boundary
- Reviewer assignment attaches strictly to a submitted Plan C portfolio snapshot (`status = 'submitted'`).
- Live draft portfolios in Plan C are never assigned reviewers or exposed to reviewer queues.

### 2. Snapshot Preservation
- Resolving a reviewer, storing assignment metadata, and transitioning to `in_evaluation` does **not** alter the candidate's submitted achievement entries, evidence files, or point estimates in Plan C.
- The submission snapshot remains locked and tamper-proof throughout reviewer assignment.
