# Last Meaningful Event Selection Evidence

### Meaningful Event Criteria
Only persisted business workflow transitions count as meaningful events.

#### Included Events
- `portfolio_submitted` ("Portfolio Submitted")
- `reviewer_assigned` ("Reviewer Assigned")
- `review_started` ("Review Started")
- `revision_requested` ("Revision Requested")
- `portfolio_resubmitted` ("Portfolio Resubmitted")
- `evaluation_result_recorded` ("Evaluation Result Recorded")
- `ready_for_finalization` ("Ready for Finalization")
- `evaluation_finalized` ("Evaluation Finalized")
- `summary_available` ("Summary Available")

#### Excluded Actions
- `page_viewed` / `page_rendered` (ephemeral navigation)
- `notification_read` / `notification_clicked` (ephemeral user state)
- `modal_opened` / `modal_closed` (local UI state)

Derived strictly from persisted J1 event logs ordered chronologically by `occurred_at`.
