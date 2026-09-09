# Personnel Evaluation Track — Plan G — Phase G0: Plan C to Plan G Handoff Audit

## Evaluation Submission Handoff Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft: Plan C Portfolio Creation
    Draft --> Submitted: Personnel Submits Portfolio (Plan C Lock)
    Submitted --> InEvaluation: Reviewer Routes & Accepts Review (Plan G Start)
    InEvaluation --> ReturnedForRevision: Evaluator Requests Correction (Plan G Return)
    ReturnedForRevision --> Submitted: Personnel Resubmits Correction (Plan C Resubmit)
    InEvaluation --> ReadyForFinalization: Evaluator Completes Scoring (Plan G Ready)
    ReadyForFinalization --> Completed: Evaluator Finalizes Result (Plan G Finalize)
    Completed --> [*]: Handoff to Plan H (Deliberation)
```

### Audit Findings & Invariants:
1. **Submission Snapshot Locking**: When Personnel submits a portfolio in Plan C, the snapshot is locked with immutable `rule_version = 'NDMU-PERSONNEL-RATING-V2'`.
2. **Reviewer Assignment Trigger**: Reviewer route is resolved server-side upon entering `submitted` status based on the candidate's active classification and college placement.
3. **No In-Place Mutation**: Evaluators cannot modify Personnel achievement entries, dates, titles, or evidence uploads. They only enter verification decisions, evaluator comments, and accepted points.
