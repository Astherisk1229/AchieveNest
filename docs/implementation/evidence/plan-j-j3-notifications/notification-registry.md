# Phase J3 Evidence: Notification Registry Architecture

## Notification Types & Registries
- **Backend**: `PersonnelWorkflowNotificationRegistry.php`
- **Frontend**: `PersonnelWorkflowNotificationRegistry.js`

## Canonical Types Defined
1. `personnel_reviewer_work_arrived`: New submission arrives in evaluator queue.
2. `personnel_reviewer_assigned`: Reviewer assignment notification.
3. `personnel_review_started`: Portfolio accepted into active review.
4. `personnel_revision_requested`: Portfolio returned for revision with deficiency guidance.
5. `personnel_portfolio_resubmitted`: Resubmitted portfolio version ready for review.
6. `personnel_evaluation_finalized`: Neutral ranking evaluation finalization.
7. `personnel_summary_available`: Evaluation summary report available for candidate download.
