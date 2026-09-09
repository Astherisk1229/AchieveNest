# Plan H Phase H1 — Rank-Mutation Guard Evidence

### Guard Verification
- Zero mutations to candidate rank occur during Phase H1 result recording.
- Fields strictly forbidden from mutation in Phase H1:
  - `current_rank_code`
  - `current_rank_name`
  - `next_rank_code`
  - `approved_rank`
  - `promotion_rank`
  - `rank_effective_date`
- Invariant: `current_rank` remains identical before and after result recording for both `Passed` and `Retained` outcomes.
