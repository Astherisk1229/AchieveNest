# Personnel Evaluation Track — Plan G — Phase G0: Evaluator Judgment Criteria Audit

## Inventory of Criteria Requiring Evaluator Judgment

Under the approved NDMU evaluation instruments, specific criteria provide an upper ceiling but no lower-level deterministic formula. These criteria require authorized evaluator deliberation.

| Scale Code | Criterion Code | Criterion Title | Maximum Ceiling | Rule Type | Evaluator Input Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `ADMINISTRATORS_RANKING_SCALE` | **B.3** | Conduct of Research | **40.0 pts** | `EVALUATOR_JUDGMENT_MAX_ONLY` | Accepted points ($0.0 \le \text{pts} \le 40.0$) + Evaluation remarks |
| `ADMINISTRATORS_RANKING_SCALE` | **B.6** | Creative Work | **20.0 pts** | `EVALUATOR_JUDGMENT_MAX_ONLY` | Accepted points ($0.0 \le \text{pts} \le 20.0$) + Evaluation remarks |
| `NON_TEACHING_PERSONNEL_RANKING_SCALE`| **B.5** | Recognition / Meritorious Award | **30.0 pts** | `EVALUATOR_JUDGMENT_MAX_ONLY` | Accepted points ($0.0 \le \text{pts} \le 30.0$) + Evaluation remarks |

---

## State & Semantic Guarantees

1. **Unresolved State**: `accepted_points = null` while awaiting evaluator input.
2. **Explicit Zero Award**: `accepted_points = 0.0` when the evaluator deliberates and awards 0 points.
3. **Ceiling Enforcement**: Attempting to save a score exceeding the maximum ceiling is blocked by Plan F validation.
