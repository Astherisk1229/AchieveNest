# Stale UI Prevention Evidence

### Prevention Mechanism
1. Client-side mutations trigger centralized status invalidation and re-fetch against `/api/v1/personnel/evaluations/{id}/workflow-status` or the canonical status service.
2. Local component state does not independently track or fabricate lifecycle states.
3. UI components receive pure reactive props derived from the authoritative status read model.
4. Action handlers (return for revision, submit revision, finalize) immediately reconcile the model, ensuring instantaneous UI synchronization.
