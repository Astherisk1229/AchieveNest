# Plan H Phase H3 — Rank History Verification

### Audit Trail
Upon recording an `Approved` promotion decision, the system atomically records:
- `evaluation_id`: UUID/string
- `personnel_profile_id`: UUID/string
- `from_rank`: Previous rank title
- `to_rank`: Approved rank title
- `to_rank_code`: Approved rank code
- `transition_type`: `normal_sequential` | `phd_exception`
- `action`: `PROMOTION_APPROVED`
- `recorded_by`: HR actor profile ID
- `recorded_at`: ISO timestamp
- `plan_e_rule_reference`: `NDMU-DOC-ACAD-RANKS-2026-V1`

For `Not Approved` decisions, no rank-history promotion entry is created (`is_promoted: false`).
