# Finalization Status Synchronization Evidence

### Evaluation Finalization Workflow
1. Authorized HR officer completes evaluation scoring and dossier finalization.
2. Canonical lifecycle transitions to `completed`.
3. Dossier lock flag `is_locked` is set to `true`.
4. Independent Evaluation Result (`Passed` / `Retained`) is recorded and exposed.
5. All authorized views (Personnel, Dean, HR) reflect `Completed` status synchronously upon next fetch or event invalidation.
