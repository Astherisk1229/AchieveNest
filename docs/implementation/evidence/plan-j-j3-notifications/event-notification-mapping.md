# Phase J3 Evidence: Event-to-Notification Mapping

| Persisted Event Key | Notification Type | Target Recipient | Template Title | Default Deep Link |
|---|---|---|---|---|
| `portfolio_submitted` | `personnel_reviewer_work_arrived` | Assigned Reviewer | New Portfolio Submission Awaiting Review | `/personnel/evaluations/workspace` |
| `reviewer_assigned` | `personnel_reviewer_assigned` | Assigned Reviewer | Evaluation Portfolio Assigned to You | `/personnel/evaluations/workspace` |
| `review_started` | `personnel_review_started` | Personnel | Portfolio Accepted into Review | `/personnel/portfolio` |
| `revision_requested` | `personnel_revision_requested` | Personnel | Portfolio Returned for Revision | `/personnel/portfolio/revision` |
| `portfolio_resubmitted` | `personnel_portfolio_resubmitted` | Assigned Reviewer | Revised Portfolio Resubmitted | `/personnel/evaluations/workspace` |
| `evaluation_finalized` | `personnel_evaluation_finalized` | Personnel | Personnel Evaluation Finalized | `/personnel/portfolio/summary` |
| `summary_available` | `personnel_summary_available` | Personnel | Evaluation Summary Report Available | `/personnel/portfolio/summary` |
