# Evaluator Judgment Required Criteria Verification — Non-Teaching B.5

## Criterion B.5: Recognition / Meritorious Award (`B5_RECOGNITION_MERITORIOUS_AWARD`)

### Governance Rule
> **Plan F must calculate only confirmed rules. If an approved instrument gives only a maximum and no lower-level formula, the system must preserve the maximum and defer the official accepted value to an authorized evaluator rather than inventing a scoring formula.**

---

### Implementation Details
- **Configured Ceiling**: `30.0 points`
- **Metadata Flag**: `evaluator_judgment_required: true`
- **Rule Type**: `EVALUATOR_JUDGMENT_MAX_ONLY`
- **Automatic Score Earned**: `0.0` (or `null` during Personnel draft stage)
- **UI Presentation**: Displays explanation `"Evaluator judgment required (maximum 30 pts)"`.
- **Evaluator Deliberation (Plan G / F4)**: Official score between `0.0` and `30.0` is assigned by an authorized evaluator during evaluation review.

---

### Prohibited Behaviors Prevented & Verified
1. **No Automatic Full Points**: Does not award 30.0 points automatically upon upload.
2. **No Invented Matrix**: Does not reuse Administrators B.4 Nominee/Awardee matrix or create Local/Regional/National tiers.
3. **No Free-Claim Field**: Personnel cannot submit custom claimed points for B.5.
