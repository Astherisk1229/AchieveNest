# Plan H Phase H4 — Post-Lock Mutation Guards

### Guard Invariants
- Once finalized and locked, ordinary edits are strictly blocked (`HTTP 409 Conflict` / `evaluation_finalized_locked`).
- Protected against post-lock mutation:
  - Accepted scores and evaluator judgment points
  - Non-Teaching Area A ratings
  - Evaluation Result (`Passed` / `Retained`)
  - Promotion Decision (`Approved` / `Not Approved`)
  - Reviewer assignment
  - Submitted snapshot and evidence links
  - Re-application of promotion rank updates
