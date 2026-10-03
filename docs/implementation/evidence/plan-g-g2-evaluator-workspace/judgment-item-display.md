# Evaluator Judgment Item Display Verification

## Canonical Judgment-Only Criteria

Under Plan F rules, certain creative, research, and recognition criteria cannot be deterministically scored by server formula and require official evaluator judgment:

1. **Administrators B.3 — Research**:
   - `max_points`: `40.0`
   - `status`: `awaiting_evaluator`
   - `explanation`: `"Evaluator judgment required up to maximum of 40.0 points based on qualitative review."`

2. **Administrators B.6 — Creative Work**:
   - `max_points`: `20.0`
   - `status`: `awaiting_evaluator`
   - `explanation`: `"Evaluator judgment required up to maximum of 20.0 points based on qualitative review."`

3. **Non-Teaching B.5 — Recognition / Meritorious Award**:
   - `max_points`: `30.0`
   - `status`: `awaiting_evaluator`
   - `explanation`: `"Evaluator judgment required up to maximum of 30.0 points based on qualitative review."`

## Phase G2 Presentation
- The workspace marks these criteria as `requires_evaluator_judgment = true`.
- Displays the maximum allowed cap and evidence attached.
- Does NOT expose score editing inputs in Phase G2 (score entry workflow is owned by Phase G3).
