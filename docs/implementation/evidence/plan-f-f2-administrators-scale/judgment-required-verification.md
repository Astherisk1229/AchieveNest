# Evaluator Judgment Required Criteria Verification — Administrators Scale

## Governance Rule
> **Plan F must calculate only confirmed rules. If an approved instrument gives only a maximum and no lower-level formula, the system must preserve the maximum and defer the official accepted value to an authorized evaluator rather than inventing a scoring formula.**

---

## 1. Conduct of Research (`B3_CONDUCT_OF_RESEARCH`)
- **Configured Ceiling**: `40.0 points`
- **Metadata Flag**: `evaluator_judgment_required: true`
- **Automatic Score Earned**: `0.0` (or `null` during Personnel submission)
- **UI Presentation**: Shows explanation `"Evaluator judgment required (maximum 40 pts)"`. Does **not** render a claimed points input field or automatic score selector.
- **Evaluator Deliberation (Plan G / F4)**: Evaluator assigns verified points between `0.0` and `40.0` based on institutional evaluation guidelines.

---

## 2. Creative Work (`B6_CREATIVE_WORK`)
- **Configured Ceiling**: `20.0 points`
- **Metadata Flag**: `evaluator_judgment_required: true`
- **Automatic Score Earned**: `0.0` (or `null` during Personnel submission)
- **UI Presentation**: Shows explanation `"Evaluator judgment required (maximum 20 pts)"`. Does **not** render a claimed points input field or automatic score selector.
- **Evaluator Deliberation (Plan G / F4)**: Evaluator assigns verified points between `0.0` and `20.0` based on institutional evaluation guidelines.

---

## Prohibited Behaviors Prevented & Verified
1. **No Automatic Full Points**: Neither B.3 nor B.6 automatically awards full points (40 or 20).
2. **No Invented Formulas**: No unapproved formulas (such as tiering by publication status or medium type) are synthesized.
3. **No Free-Claim Input**: Personnel cannot type or submit claimed point values for these criteria.
