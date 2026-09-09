# Reviewer Validation Verification

## Plan G Reviewer Authorization Verification

1. **Reviewer Assignment**:
   - Every evaluation entering finalization must have an active reviewer assignment (`assigned_reviewer_role`).
   - Missing assignment triggers `reviewer_assignment_missing`.
2. **Anti-Self-Review Invariant**:
   - The assigned evaluator cannot be the evaluated personnel profile.
   - Self-review triggers `self_review_invalid`.
3. **Review Lifecycle State**:
   - Evaluations in `draft` status trigger `review_incomplete`.
