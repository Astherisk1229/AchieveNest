# Material Event Coverage Matrix

| Material Action | Current Source | Persisted? | Actor Recorded? | Version Recorded? | Before/After? | Coverage Gap |
|---|---|---|---|---|---|---|
| Evidence Upload | `EvidenceController` | YES | YES | NO | N/A | Fully covered |
| Portfolio Submitted | `PersonnelPortfolioSubmissionController` | YES | YES | YES | YES | Fully covered |
| Reviewer Assigned | `PersonnelReviewerAssignmentController` | Partial | YES | NO | NO | Needs explicit audit event |
| Review Started | `PersonnelEvaluatorWorkspaceController` | Partial | YES | YES | NO | Needs explicit audit event |
| Scale Overridden | `PersonnelEvaluationScaleController` | YES | YES | YES | YES | Fully covered |
| Returned for Revision | `PersonnelPortfolioSubmissionController` | YES | YES | YES | YES | Fully covered |
| Resubmitted | `PersonnelPortfolioSubmissionController` | YES | YES | YES | YES | Fully covered |
| Scoring Completed | `PersonnelEvaluatorScoringController` | Partial | YES | YES | NO | Needs explicit audit event |
| Result Determined | `PersonnelEvaluationResultController` | YES | YES | YES | YES | Fully covered |
| Summary Report Printed | `PersonnelEvaluationPrintController` | NO | NO | NO | NO | Ephemeral; needs audit event |
| Promotion Recorded | `PersonnelPromotionDecisionController` | YES | YES | YES | YES | Fully covered |
| Final Lock Applied | `PersonnelEvaluationFinalLockController` | YES | YES | YES | YES | Fully covered |
| Complete Deletion | `PersonnelPortfolioSubmissionController` | YES | YES | NO | YES | Fully covered |
