# Status Transition Writers Matrix

| Transition | From Status | To Status | Writer / Controller | Actor Role | Event Persisted? |
|---|---|---|---|---|---|
| Submit Portfolio | `[none]` | `submitted` | `PersonnelPortfolioSubmissionController::submit` | Faculty / Personnel | YES (`personnel_evaluation_events`) |
| Start Review | `submitted` | `in_evaluation` | `PersonnelEvaluatorWorkspaceController` | Dean / HR | Partial (timestamp update) |
| Return for Revision | `submitted` / `in_evaluation` | `returned_for_revision` | `PersonnelPortfolioSubmissionController::returnForRevision` | Dean / HR | YES (`personnel_evaluation_events`) |
| Resubmit Portfolio | `returned_for_revision` | `submitted` | `PersonnelPortfolioSubmissionController::submit` | Faculty / Personnel | YES (`personnel_evaluation_events`) |
| Mark Ready for Finalization | `in_evaluation` | `ready_for_finalization` | `PersonnelEvaluatorScoringController` | Dean / HR | Partial (timestamp update) |
| Finalize / Final Lock | `ready_for_finalization` | `completed` | `PersonnelEvaluationFinalLockController` | HR Admin | YES (`personnel_evaluation_events`) |
