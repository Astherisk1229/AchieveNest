# PLAN 11 — Phase 6 Authorization & Role Navigation Source Map
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Navigation Source Authority

- **Function Authority**: `getAuthorizedNavigationForSession(userSession)` located in `src/config/personnelRoleNavigation.js`.
- **Master Catalog**: `NAVIGATION_CATALOG` in `src/config/navigationCatalog.js`.
- **Session Inputs**:
  - `account_type`: Primary account classification (`student`, `personnel`, `hr_admin`, `osad_admin`).
  - `active_role_context`: Active operating persona (e.g. `program_coordinator`, `dean`, `osad_staff`).
  - `assigned_roles`: List of granted role permissions.

---

# 2. Portal Catalog Invariants
- **OSAD Admin**: Exactly 10 workflow destinations.
- **Student**: Exactly 6 dedicated student destinations.
- **HR Admin**: Exactly 9 governance and ranking destinations.
- **Personnel**: Dynamically filtered based on active context (`program_coordinator` vs `dean` vs `personnel`).
