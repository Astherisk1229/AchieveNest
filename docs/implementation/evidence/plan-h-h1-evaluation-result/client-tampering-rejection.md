# Plan H Phase H1 — Client Tampering Rejection Evidence

### Defense Model
- Any client attempts to submit:
  - `evaluation_result = 'Passed'` on a failing evaluation
  - `evaluation_result = 'Retained'` on a passing evaluation
  - Altered `final_accepted_total`
  - Altered `passing_score` or `maximum_score`
  - Injected promotion decisions or rank updates
- Are strictly ignored or rejected by the backend and frontend services.
- The server recomputes the state authoritatively from the snapshot and frozen scale criteria.
