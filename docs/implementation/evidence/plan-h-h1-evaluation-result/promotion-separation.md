# Plan H Phase H1 — Separation of Evaluation Result & Promotion Decision

### Core Invariant
> **Passed means the evaluation passed only. It does not automatically mean promotion. Retained keeps the current rank/title.**

### Separation Proofs
1. **Evaluation Result**:
   - `Passed`: Candidate achieved score >= passing threshold under Plan F rules.
   - `Retained`: Candidate score < passing threshold under Plan F rules.
2. **Promotion Decision**:
   - Strictly unrecorded and null in Phase H1 (`promotion_decision: null`, `is_promoted: false`).
   - Read model status: `promotion_decision_status: 'pending_deliberation_phase_h3'`.
   - Promotion deliberation, decision, and President/HR approval are quarantined in Phase H3.
