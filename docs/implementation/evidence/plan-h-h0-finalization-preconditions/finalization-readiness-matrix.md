# Finalization Readiness Matrix

## Pre-Finalization Gate Status

| Check Item | Condition for Ready | Failure Reason Code | Precondition Status |
|---|---|---|---|
| **Identity** | Evaluation and Personnel IDs present | `evaluation_not_found`, `personnel_not_found` | **VERIFIED** |
| **Cycle** | Valid academic year, no duplicate active cycle record | `evaluation_cycle_missing`, `duplicate_cycle_evaluation` | **VERIFIED** |
| **Reviewer** | Reviewer assigned, review completed, no self-review | `reviewer_assignment_missing`, `self_review_invalid` | **VERIFIED** |
| **Revision** | Zero unresolved revisions, status not returned | `revision_request_unresolved` | **VERIFIED** |
| **Scoring** | No null judgment items, Area A complete | `scoring_incomplete` | **VERIFIED** |
| **Integrity** | Non-negative scores, scores within criterion caps | `invalid_score_state` | **VERIFIED** |
| **Recalculation** | Authoritative Plan F accepted totals computed | `result_pending` | **VERIFIED** |
| **Snapshot** | Submitted Plan C snapshot preserved | `snapshot_invalid` | **VERIFIED** |
| **Rule Version** | `NDMU-PERSONNEL-RATING-V2` matched | `rule_version_unavailable` | **VERIFIED** |
| **HR Auth** | Performed by authorized HR staff/admin | `unauthorized_finalization_actor` | **VERIFIED** |

**Pre-Finalization Gate Status**: **READY FOR PLAN H WORKFLOWS**
