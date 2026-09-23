# Plan H Phase H3 — Separation of Evaluation Result & Promotion Decision

### Distinct Facts
1. **Evaluation Result**:
   - Owned by Plan F / H1.
   - Values: `Passed` | `Retained`.
   - Answers: "Did the candidate achieve the required scoring threshold for the cycle?"
2. **Promotion Decision**:
   - Owned by Plan H (Phase H3).
   - Values: `Approved` | `Not Approved`.
   - Answers: "Did the Deliberation Committee / HR approve rank promotion following deliberation?"

### Independence Matrix
- `Passed + Pending Deliberation`: Valid post-evaluation state.
- `Passed + Approved`: Valid state leading to Plan E rank update.
- `Passed + Not Approved`: Valid state preserving current rank.
- `Retained + Ineligible for Promotion`: Retained evaluations are barred from promotion approval.
