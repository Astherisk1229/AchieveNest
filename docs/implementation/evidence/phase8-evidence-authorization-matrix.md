# Plan 05 Phase 8 — Evidence Authorization Matrix
## Capability and Access Matrix for Portfolio Evidence Files

| Role / Actor | View Own Evidence | View Other Evidence | Download Evidence | Upload / Add Evidence | Delete / Replace Evidence | See Mapping Trace |
|---|---|---|---|---|---|---|
| `student` | **ALLOW** | **DENY** | **ALLOW** | **ALLOW (Draft / Revisions)** | **ALLOW (Draft / Revisions)** | **DENY** |
| `program_coordinator` | **ALLOW** | **ALLOW (Dept Scope)** | **ALLOW** | **DENY** | **DENY** | **DENY** |
| `osad_staff` | **ALLOW** | **ALLOW (Universal)** | **ALLOW** | **DENY** | **DENY** | **ALLOW** |
| `dean` | **ALLOW** | **ALLOW (College Scope)** | **ALLOW** | **DENY** | **DENY** | **ALLOW** |

- **Cross-Student Unauthorized File Download Risk**: **0 (Enforced by Storage & Portfolio Policies)**.
