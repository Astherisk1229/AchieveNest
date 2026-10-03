# Scale Override Audit Evidence

- **Event Key**: `evaluation_scale_overridden`
- **Display Label**: "Evaluation Ranking Scale Overridden"
- **Actor**: `HR`
- **Captured Fields**:
  - `before_state`: Original/automatic ranking scale (e.g. `ADMINISTRATORS_RANKING_SCALE`)
  - `after_state`: Overridden scale (e.g. `NON_TEACHING_PERSONNEL_RANKING_SCALE`)
  - `metadata`: `{ reason: "Verified reason citing official reclassification memo" }`
  - `actor_user_id`: Authenticated HR administrator
  - `occurred_at`: ISO timestamp
- **Invariant**: No silent scale override is permitted; audit fails if before/after or verified reason is omitted.
