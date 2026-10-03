# Version & Revision Cases Freeze — Plan K Phase K0

## Revision & Snapshot Mechanics

1. **Initial Submission (V1)**:
   - Candidate submits portfolio $\rightarrow$ Generates immutable V1 snapshot.
   - Status moves to `submitted` $\rightarrow$ `in_evaluation`.
2. **Reviewer Return for Revision**:
   - Single reviewer action returns the **whole submitted portfolio**.
   - Reviewer records mandatory overall revision message.
   - Status transitions to `returned_for_revision`.
   - V1 remains completely immutable and historical.
3. **Resubmission (V2)**:
   - Candidate makes updates and resubmits $\rightarrow$ Generates immutable V2 snapshot.
   - Status transitions back to `submitted` / `in_evaluation`.
   - Prior revision request flag is resolved; version lineage (`v1` $\rightarrow$ `v2`) is linked.
4. **Subsequent Cycles (V2 $\rightarrow$ V3)**:
   - Follows identical whole-portfolio return and resubmission semantics with preserved append-only audit trail.
