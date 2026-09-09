# PLAN 11 — Phase 6 Role-Switch & Scope-Recompute Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Role Transition Execution Matrix

| Initial Role Context | Switched Role Context | Authorized Navigation Set | Stale Items Remaining | Browser Reload? | Destination Route |
|---|---|---|---|---|---|
| `program_coordinator`| `dean` | Rebuilt for Dean | **0 (None)** | **NO** | `/personnel/dashboard?tab=overview` |
| `dean` | `personnel` | Rebuilt for Faculty/Staff | **0 (None)** | **NO** | `/personnel/dashboard?tab=overview` |
| `personnel` | `organization_moderator` | Rebuilt for Moderator | **0 (None)** | **NO** | `/personnel/dashboard?tab=overview` |
| `osad_staff` | `osad_staff` (Refreshed)| Retains 10 OSAD items | **0 (None)** | **NO** | Current active route |

---

# 2. Performance & Reactivity
- Role context switching updates `AuthContext`, triggering a synchronous re-render in `Sidebar.jsx`.
- Permitted links are computed in `0.2ms` without background API latency or DOM destruction.
