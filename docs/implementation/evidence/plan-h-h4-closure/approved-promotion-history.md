# Plan H Phase H4 — Approved Promotion History

### Traceability Invariants
- `from_rank`: Pre-deliberation rank title.
- `to_rank`: Approved rank title.
- `to_rank_code`: Approved rank code.
- `transition_type`: `normal_sequential` or `phd_exception`.
- `action`: `PROMOTION_APPROVED`.
- `recorded_by`: HR actor ID.
- `recorded_at`: Timestamp.
- Candidate current rank is updated once and locked atomically with decision history.
