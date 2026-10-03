# Submitted Snapshot Evidence Binding

## 1. Snapshot Evidence Identity Retention
1. **Server-Derived Snapshots**: When a portfolio is submitted, each evaluation item freezes the exact `evidence_id` linked at submission time.
2. **Immutability Invariant**: When an evaluator accesses the workspace, the system streams evidence referenced by the submitted snapshot's `evidence_id`, regardless of any subsequent changes to live working drafts.
3. **No Live Evidence Substitution**: Evaluators never see unsaved or replacement evidence from later revisions during the review of an earlier submitted version.

## 2. Test Verification
- Test 11.1: `preserves historical snapshot evidence_id even when live accomplishment evidence changes` (PASSED).
