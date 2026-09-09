# Self-Review Protection Verification

## Anti-Self-Review Enforcement

Even if client-side state is tampered with:

### Rule:
Candidate cannot evaluate their own submission under any circumstances.

### Verification:
- **Scenario**: Candidate `usr_001` with Dean/HR role attempts to open their own evaluation workspace `eval_001` where `eval_001.personnel_id == 'usr_001'`.
- **Result**:
  - `validateReviewerAccess` catches `candidate_id === reviewer_id`.
  - Throws `403 Forbidden`:
    `"Access Denied (403): Candidate cannot access their own evaluation with reviewer privileges (Self-review prohibited)"`
- Tested and verified in test suite (`PersonnelEvaluatorWorkspaceG2.test.jsx`).
