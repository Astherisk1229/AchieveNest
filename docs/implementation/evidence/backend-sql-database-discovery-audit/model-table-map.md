# Model-to-Table Mapping & Architecture Audit

### Model Inventory Findings
- Directory: `backend/app/Models`
- Total Model files: **0** (contains only `.gitkeep`).

### Architectural Analysis
The AchieveNest backend intentionally omits CodeIgniter Active Record models in favor of a **Service-Repository Pattern**:
1. Business logic and database access are encapsulated inside `backend/app/Services`.
2. Services use `$db->table('...')` Query Builder directly within database transactions.
3. This architecture guarantees:
   - Atomic multi-table updates (e.g., personnel profile + college affiliation + role events).
   - Strict server-side authorization checks before execution.
   - Comprehensive audit logging via `PersonnelEvaluationAuditService`.
