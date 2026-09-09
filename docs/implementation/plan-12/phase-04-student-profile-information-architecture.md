# PLAN 12 — Phase 4 Student Profile Information Architecture
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Executive Summary

This specification outlines the clean, readable 5-tier student profile visual architecture established under **Plan 12 Phase 4 — Student Profile Information Architecture**.

### Key Architectural Highlights
1. **5 Primary Visual Sections**:
   - **Profile Header**: Student Full Name, Student ID, Program Title, Year Level, and College Brand Color Badge.
   - **Academic Information**: Read-only institutional records (`Academic Year`, `Year Level`, `Degree Program`, `College / Faculty`) with 0 disabled edit icons.
   - **Student Organization**: Affiliated organization name, scope, category, or informative neutral message if unassigned.
   - **Your Institutional Contacts**: Clear, dedicated cards for Program Coordinator and Organization Moderator with official `@ndmu.edu.ph` institutional contact details.
   - **Account & Security**: Safe lifecycle state, password change action, and official notice directing corrections to OSAD / Academic Office.
2. **Read-Only Institutional Clarity**:
   - Students cannot self-edit institutional data; 0 fake or disabled edit icons are rendered.
3. **Master-Data Driven College Identity**:
   - College brand color is dynamically rendered from `colleges.acronym_badge_color`. College is also textually identified (`code` and `name`) to preserve accessibility.
4. **Privacy & Security Exclusions**:
   - Prohibited private fields (`password_hash`, personal phone, home address, HR evaluation dossiers) are strictly excluded from the rendering pipeline.

---

# 2. Phase 4 Architecture Matrix

```text
========================================================================
PLAN 12 — PHASE 4 STUDENT PROFILE INFORMATION ARCHITECTURE
========================================================================
Section 1 — Profile Header: PASS
Section 2 — Academic Information: PASS (Read-Only)
Section 3 — Student Organization: PASS
Section 4 — Your Institutional Contacts: PASS
Section 5 — Account and Security: PASS
Disabled Institutional Edit Icons: 0
Color-Only Identification: 0
Prohibited Fields Rendered: 0
========================================================================
```
