# Editable State Guard

## 1. Editability Constraint
Evidence replacement is strictly prohibited when:
1. The portfolio submission is in `submitted`, `under_review`, `deliberated`, `finalized`, or `locked` status.
2. The accomplishment itself is marked `locked`, `submitted`, or `archived`.
3. The requesting actor is not the verified owner of the achievement.

## 2. Permitted Contexts
Evidence replacement is permitted only during:
- Initial draft compilation (`status === 'draft'`).
- Reopened working revision following return for revision (Plan C Phase C3).

## 3. Test Verification
- Test 1.1: `allows evidence replacement on an editable draft accomplishment` (PASSED)
- Test 1.4: `rejects replacement attempt when portfolio submission is in locked/submitted status` (PASSED)
- Test 1.5: `rejects replacement attempt when accomplishment is locked` (PASSED)
- Test 1.6: `rejects replacement attempt by non-owner actor` (PASSED)
