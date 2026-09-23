# Revision Guard Verification

## Unresolved Revision Request Guard

1. **Active Revision Request Blocking**:
   - Evaluations in `returned_for_revision` or `in_revision` status are blocked from finalization.
   - Evaluations with active `has_unresolved_revision_request === true` are blocked.
   - Reason Code: `revision_request_unresolved` (`Not ready for finalization — portfolio revision request remains unresolved.`)
2. **Resubmitted Snapshot Eligibility**:
   - Once revised and resubmitted through Plan C/G, the new reviewed version becomes eligible for finalization.
