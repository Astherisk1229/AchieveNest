# Plan H Phase H1 — Authorization Boundary Evidence

### Role Matrix
| Role | Phase H1 Result Finalization Authority | Error Code |
| :--- | :--- | :--- |
| `hr_staff` | Allowed | 200 OK |
| `hr_admin` | Allowed | 200 OK |
| `faculty` (Candidate) | Denied | 403 Forbidden |
| `department_secretary` | Denied | 403 Forbidden |
| `dean` | Denied (Evaluator role ended at Plan G) | 403 Forbidden |
