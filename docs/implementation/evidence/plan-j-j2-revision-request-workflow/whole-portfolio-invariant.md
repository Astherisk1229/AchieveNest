# Phase J2 Evidence: Whole-Portfolio Revision Invariant

## Invariant Statement
> **Revision is whole-portfolio based. One reviewer action returns the entire portfolio. Item-level comments are guidance only and do not constitute independent submission cycles.**

## Architectural Rules Enforced
1. **Single Portfolio Lifecycle**: The evaluation status transitions to `returned_for_revision`. No independent per-item submission state or partial submission queue is created.
2. **Subordinate Guidance**: Reviewer comments reference specific items or criteria solely to provide actionable feedback for the whole-portfolio resubmission.
3. **Point-in-Time Immutability**: The prior submitted snapshot (e.g. Version 1) remains frozen and immutable. Personnel works against a working revision copy.
4. **Cohesive Resubmission**: Personnel resubmits the entire portfolio package as Version N+1, which resolves the prior revision request.
