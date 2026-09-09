# Plan H Phase H3 — Invalid Rank Transition Rejection

### Rejected Cases
1. **Multi-Step Jumps**: E.g. `Assistant Professor I` -> `Associate Professor I` (Rejected: `invalid_rank_transition`).
2. **Downward Transitions**: E.g. `Assistant Professor II` -> `Assistant Professor I` (Rejected: `invalid_rank_transition`).
3. **Unrelated / Non-Existent Ranks**: E.g. `CHIEF_DIRECTOR_GENERAL` (Rejected: `rank_not_found`).
