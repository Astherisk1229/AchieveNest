# Reviewer Queue Scope Regression Verification

## Queue Isolation & Filtering Verification

Reviewer queues strictly isolate evaluation records to authorized reviewers:

1. **Dean Queue**:
   - Shows only academic evaluations matching the Dean's assigned college (`evaluator_college_id === actor.assigned_college_id`).
   - Excludes cross-college evaluations.
   - Excludes HR-routed evaluations.
2. **HR Queue**:
   - Shows only evaluations with `assigned_reviewer_role === 'hr'` or `'hr_staff'`.
   - Excludes academic Dean-scoped evaluations.
3. **Department Secretary**:
   - Zero evaluator queue access.
