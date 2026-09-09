# Canonical Audit Service Architecture Evidence

### Service Boundaries
- **Backend Authority**: `PersonnelEvaluationAuditService.php` located in `backend/app/Services/`.
- **Frontend Service**: `PersonnelEvaluationAuditService.js` located in `frontend/src/services/`.

### Responsibilities
1. `recordAuditEvent(array $data)`: Validates and persists immutable audit trail records with actor/subject/version contexts.
2. `updateAuditEvent(...)` & `deleteAuditEvent(...)`: Rejects update and delete attempts with `RuntimeException` to enforce append-only storage.
3. `validateAuditAccess(array $currentUser, array $subjectContext)`: Enforces role boundaries (HR full access, Dean college scope, Personnel self scope, Department Secretary denied).
4. `reconstructTimeline(array $auditEntries, ...)`: Reconstructs chronological audit timelines and multi-version revision lineages (V1 -> V2 -> V3).
