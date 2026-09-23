# Database Cleanup & Foreign-Key Order

## 1. FK-Safe Deletion Sequence
When complete deletion is triggered:
1. `personnel_evaluation_items` rows for target evaluations are deleted.
2. `personnel_evaluation_events` rows are deleted.
3. `personnel_evaluation_deficiency_requests` / `reports` are deleted.
4. `personnel_evaluations` submission headers are deleted.
5. `personnel_evaluation_roots` are deleted.
6. `personnel_accomplishment_evidence` rows are deleted.
7. `personnel_accomplishments` master rows are deleted.
8. Non-sensitive audit event `portfolio_purged` is recorded.
