# Plan H Phase H4 — Promotion Decision Historical Stability

### Invariants
1. `promotion_decision` is preserved separately from `evaluation_result`.
2. Preserved fields: `promotion_decision` (`Approved` | `Not Approved`), `decided_by`, `decided_at`, `previous_rank`, `applied_current_rank`, `approved_rank_code`, `plan_e_rule_reference`.
3. Read model displays evaluation result and promotion decision as distinct historical sections.
