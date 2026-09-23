# Submission to Review Journey Evidence

### End-to-End Workflow Trajectory
1. **Portfolio Submission**: Candidate submits active dossier. Status becomes `submitted`.
2. **Reviewer Assignment**: HR assigns Dean or HR evaluator. `reviewer_assigned` event emitted.
3. **Notification**: Evaluator receives `personnel_reviewer_work_arrived` notification.
4. **Review Start**: Evaluator begins scoring; status transitions to `in_evaluation`.
5. **Timeline Sync**: Reconstructs complete lineage in `PersonnelEvaluationAuditService`.
