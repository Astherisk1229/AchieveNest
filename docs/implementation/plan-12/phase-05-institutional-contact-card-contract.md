# PLAN 12 — Phase 5 Institutional Contact Card Contract
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Executive Summary

This contract documents the component architecture, content specifications, privacy boundaries, and unassigned state behaviors for **Program Coordinator** and **Organization Moderator** contact cards under **Plan 12 Phase 5 — Moderator and Coordinator Contact Cards**.

### Key Contract Highlights
1. **Contact Card Inventory**:
   - **Program Coordinator Card**: Displays current active Academic Program Coordinator.
   - **Organization Moderator Card**: Displays current active Student Organization Faculty Moderator.
2. **Approved Visual Identity**:
   - Canonical full name, official role badge, scope badge (`Scope: <Program/Org>`), designation title, and official `@ndmu.edu.ph` email mailto link with accessible ARIA label.
   - Avatar with initials fallback.
3. **Strict Privacy Filtering**:
   - Prohibited private fields (`personal phone`, `home address`, `HR evaluation dossier`, `password_hash`) are completely excluded (`Prohibited fields = 0`).
4. **Informative Unassigned Presentation**:
   - Unassigned coordinators/moderators render neutral, non-broken messaging: *"Program coordinator not yet assigned"* / *"Organization moderator not yet assigned"*.

---

# 2. Phase 5 Completion Matrix

```text
========================================================================
PLAN 12 — PHASE 5 MODERATOR AND COORDINATOR CONTACT CARDS
========================================================================
Program Coordinator Card: PASS
Organization Moderator Card: PASS
Approved Fields Rendered: Full Name, Role, Scope, Designation, Email, Avatar
Prohibited Fields Rendered: 0
Unassigned State Semantics: PASS (Neutral messages)
Historical Contact Leakage: 0
========================================================================
```
