# Plan H Phase H1 — Passed / Retained Persistence Evidence

### Canonical Vocabulary Enforcement
- Only two evaluation result values are permitted in Plan H:
  - `Passed`
  - `Retained`
- Disallowed vocabulary strictly rejected: `Failed`, `Promoted`, `Approved`, `Denied`, `Qualified for Promotion`, `For Promotion`, `Not Promoted`, `Deferred`.

### Persistence Fields
- `evaluation_id`: UUID/string
- `personnel_profile_id`: UUID/string
- `evaluation_result`: `Passed` | `Retained`
- `final_accepted_total`: float
- `passing_score`: float
- `maximum_score`: float
- `evaluation_scale_code`: string
- `rule_version`: `NDMU-PERSONNEL-RATING-V2`
- `result_explanation`: string
- `result_status`: `finalized`
- `source`: `plan_f`
- `recorded_by`: string
- `recorded_at`: ISO timestamp
- `promotion_decision`: `null`
- `is_promoted`: `false`
- `current_rank`: string (unchanged)
- `rank_mutation_applied`: `false`
