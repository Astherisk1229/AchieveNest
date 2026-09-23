# Append-Only Enforcement Evidence

### Invariant
Once written to the database, audit records cannot be edited, overwritten, or deleted by any ordinary application actor or workflow endpoint.

### Verification
1. `PersonnelEvaluationAuditService::updateAuditEvent()` throws `RuntimeException` with an explicit violation message.
2. `PersonnelEvaluationAuditService::deleteAuditEvent()` throws `RuntimeException` with an explicit violation message.
3. Frontend service `PersonnelEvaluationAuditService.assertImmutability()` raises an error for any client-side mutation attempts.
