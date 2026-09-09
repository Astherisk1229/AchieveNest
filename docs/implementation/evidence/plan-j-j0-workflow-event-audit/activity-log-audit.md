# Activity Log Architecture Audit

## Existing Activity & Event Logs
1. **`audit_logs`**: System security and administrative provisioning events (login, role assignment, token revocation, account lifecycle).
2. **`personnel_evaluation_events`**: Evaluation lifecycle events (`submitted`, `returned_for_revision`, `resubmitted`, `portfolio_purged`).
3. **`evaluation_scale_change_events`**: HR scale override events (Plan F).
4. **`file_security_audit_events`**: Upload and evidence security scans (Plan I).
5. **`role_assignment_events`**: Governance and rank assignment changes (Plan E/H).

## Immutability & Scope
- All event tables are append-only.
- RLS policies restrict UPDATE and DELETE from authenticated roles.
- `created_at` / `occurred_at` are server-generated timestamps (`now()`).
