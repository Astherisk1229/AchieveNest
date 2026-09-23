# Promotion Decision Separation Audit (Plan H)

## Canonical Separation
- **Evaluation Result**: `Passed` | `Retained` (Plan F / Evaluator scoring).
- **Promotion Decision**: `Approved` | `Not Approved` (Plan H / HR Board deliberation).

## Invariants
1. `Passed` enables promotion consideration but does not guarantee an `Approved` promotion.
2. `Retained` evaluations cannot be promoted (must remain current rank).
3. `Not Approved` decisions retain current rank without demotion.
4. `Approved` decisions trigger validated Plan E rank progression.
5. In no schema or UI is `Passed` conflated with `Approved`.
