# Notification Trigger Audit

| Workflow Action | Target Recipient | Expected Notification | Current Implementation Status |
|---|---|---|---|
| Submission Accepted into Review | Personnel Owner | "Your portfolio has been received for review." | Partial (status reflection) |
| Returned for Revision | Personnel Owner | "Your portfolio requires revisions." | Partial (status + return reason payload) |
| Resubmission Received | Reviewer (Dean/HR) | "A revised portfolio has been resubmitted." | Partial (status reflection) |
| Evaluation Finalized | Personnel Owner | "Your annual evaluation has been finalized." | Partial (status reflection) |
| Summary Report Ready | Personnel Owner | "Your evaluation summary sheet is now available." | Absent (manual download) |
| Reviewer Assigned | Reviewer (Dean) | "You have been assigned to review a faculty portfolio." | Absent (dashboard query) |
