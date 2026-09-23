# Material Workflow Event Inventory

| Event Action | Plan Domain | Actor | Subject / Entity | Current Persistence |
|---|---|---|---|---|
| Evidence Upload Saved | Plan A / I1 | Personnel | `personnel_evidence` | `personnel_evidence` row + SHA-256 |
| Portfolio Submitted (V1) | Plan C1 | Personnel | `personnel_evaluations` | `personnel_evaluation_events` (`submitted`) |
| Reviewer Assigned | Plan G0 | Dean / HR | `personnel_evaluations` | `personnel_evaluations.evaluator_profile_id` |
| Evaluation Started | Plan G2 | Reviewer | `personnel_evaluations` | `personnel_evaluations.evaluation_started_at` |
| HR Scale Overridden | Plan F2 | HR Admin | `personnel_evaluations` | `evaluation_scale_change_events` |
| Scoring Updated | Plan F / G | Reviewer | `personnel_evaluation_items` | `personnel_evaluation_items` scored fields |
| Whole-Portfolio Returned for Revision | Plan C3 / G | Reviewer | `personnel_evaluations` | `personnel_evaluation_events` (`returned_for_revision`) |
| Portfolio Resubmitted (V_N+1) | Plan C4 | Personnel | `personnel_evaluations` | `personnel_evaluation_events` (`resubmitted`) |
| Evaluation Result Determined | Plan F5 | System / Reviewer | `personnel_evaluations` | `personnel_evaluations.final_snapshot` |
| Summary Report Printed / Generated | Plan H2 | HR / Dean | Evaluation PDF | Client ephemeral / log |
| Promotion Decision Recorded | Plan H3 | HR Admin | `personnel_evaluations` | `personnel_evaluations.promotion_decision` |
| Approved Rank Update Applied | Plan H3 / E | HR Admin | `profiles.faculty_rank` | `role_assignment_events` / profiles update |
| Final Lock Applied | Plan H4 | HR Admin | `personnel_evaluations` | `personnel_evaluations.status` (`completed`) |
| Portfolio Purged (Owner Deletion) | Plan I4 / C5 | Owner / HR | Portfolio & Files | `personnel_evaluation_events` (`portfolio_purged`) |
