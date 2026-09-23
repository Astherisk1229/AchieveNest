# Plan 05 Phase 7 — Portfolio Authorization Matrix
## Object-Level Security & Scope Enforcement

| Actor Role | Self Portfolio Read | Cross-Student Read via `?student_profile_id` | Create Portfolio Record | Edit / Delete Own Record | View `osad_evaluation` |
|---|---|---|---|---|---|
| `student` | **ALLOW** | **DENY (Blocked by Scope Policy)** | **ALLOW** | **ALLOW (Draft/Revisions only)** | **DENY** |
| `osad_staff` | **ALLOW** | **ALLOW** | **DENY** | **DENY** | **ALLOW** |
| `program_coordinator` | **ALLOW** | **ALLOW (Departmental Scope)** | **DENY** | **DENY** | **DENY** |
| `dean` | **ALLOW** | **ALLOW (College Scope)** | **DENY** | **DENY** | **ALLOW** |

- **Cross-Profile Student Leakage Risk**: **0 (Enforced server-side in `scopeListQuery`)**.
