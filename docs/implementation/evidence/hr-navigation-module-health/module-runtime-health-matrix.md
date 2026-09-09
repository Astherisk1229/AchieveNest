# HR Module Runtime Health Matrix

| Module | Loading State | Empty State | Data State | API Error State | RBAC State | Stale Cache State | Overall Health |
|---|---|---|---|---|---|---|---|
| **HR Dashboard** | Loading skeletons rendered | Safe count zeroing | Full metrics & quick actions rendered | Handled via try/catch toast | hr_admin / hr_staff only | Safe fallback | HEALTHY |
| **Personnel Directory** | Safe null handling before fetch | "No Personnel Records Found" empty row with clear filter CTA | Full roster with Plan D badges (Faculty, Non-Teaching Faculty; Academic, Non-Academic) | Controlled toast & non-crashing UI | Protected | Safe fallback | HEALTHY |
| **Evaluation Submissions** | Skeletons / spinners rendered | Zero-safe count tabs and empty queue state | Tabbed queue (submitted, in_evaluation, etc.) | Handled gracefully | Protected | Safe fallback | HEALTHY |
| **Faculty Evaluation & Ranking** | Handled | "No faculty evaluation records found matching the selected filters" | Full ranked portfolio masterboard with area scores | Handled | Protected | Safe fallback | HEALTHY |
| **Audit Trail** | Handled via hook | "No Matching Audit Logs Found" with clear filter CTA | Filterable audit event cards with timestamps | Handled | Protected | Safe fallback | HEALTHY |
| **Rank Assignment Logs** | Handled | Safe empty table | Conferred ranks with resolution references | Handled | Protected | Safe fallback | HEALTHY |
| **Password Resets** | Loading spinner | "No requests found" | Interactive queue with 1-time passkey modal | Controlled error banner | Protected | Safe fallback | HEALTHY |
