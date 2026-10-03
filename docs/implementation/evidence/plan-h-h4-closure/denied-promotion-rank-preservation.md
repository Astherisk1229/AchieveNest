# Denied Promotion Rank Preservation

## Invariant
When HR records a `Not Approved` promotion decision, the candidate's current rank/title must remain strictly unchanged at its pre-deliberation state. No new rank advancement entry may be created, and no demotion may occur.

## Validation Status
- **Result**: `VERIFIED`
- **Candidate Current Rank**: Maintained as `INST_1` (or whatever pre-deliberation rank held).
- **Promotion Rank History**: 0 promotional advancement records generated.
- **Evaluation Status**: Finalized and locked with `evaluation_result: "Passed"` and `promotion_decision: "Not Approved"`.
- **Demotion Check**: Zero rank reduction or penalty applied.
