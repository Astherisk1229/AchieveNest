# Approved Rank Update Audit Evidence

- **Event Key**: `approved_rank_applied`
- **Display Label**: "Approved Faculty Rank Applied"
- **Actor**: `HR`
- **Captured Fields**:
  - `before_state`: Old faculty rank (e.g. `ASSISTANT_PROFESSOR_I`)
  - `after_state`: New faculty rank (e.g. `ASSISTANT_PROFESSOR_II`)
  - `metadata`: `{ source_decision: "Approved", plan_e_validated: true }`
- **Invariant**: Rank change audit is only created when the rank actually transitions to a new grade/level.
