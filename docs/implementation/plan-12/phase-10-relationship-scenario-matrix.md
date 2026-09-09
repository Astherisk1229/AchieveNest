# PLAN 12 — Phase 10 Relationship Scenario Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. 15-Scenario Relationship Matrix

| Scenario Index | Profile Context | Expected UI State | Observed Status |
|---|---|---|---|
| **Scenario 1** | Complete Student Profile | All 5 sections render canonical data | **PASS** |
| **Scenario 2** | Student With No Org | Shows "Student organization not yet assigned" | **PASS** |
| **Scenario 3** | Org With No Moderator | Shows "Organization moderator not yet assigned"| **PASS** |
| **Scenario 4** | Program With No Coordinator | Shows "Program coordinator not yet assigned" | **PASS** |
| **Scenario 5** | Multiple Valid Assignments | Policy enforces 1 active max | **NOT APPLICABLE** |
| **Scenario 6** | Conflicting Active Assignments| Controlled unavailable state | **PASS** |
| **Scenario 7** | Multi-Program Coordinator | Scoped to student's enrolled program | **PASS** |
| **Scenario 8** | OSAD Changes Program | Instant refresh to new program/college/coord | **PASS** |
| **Scenario 9** | OSAD Changes Org/Mod | Instant refresh to new organization/moderator | **PASS** |
| **Scenario 10**| Long Names / Missing Photos | Text wraps cleanly; fallback avatars used | **PASS** |
| **Scenario 11**| Master Data College Color | Matches `colleges.acronym_badge_color` | **PASS** |
| **Scenario 12**| Loading / Error / Retry | Explicit loading spinner; non-destructive retry | **PASS** |
| **Scenario 13**| First-Login Landing | Direct transition to profile after activation | **PASS** |
| **Scenario 14**| Missing Profile Link | Controlled support card without stack trace | **PASS** |
| **Scenario 15**| Keyboard / Screen Reader | Logical tab order, visible focus, ARIA labels | **PASS** |
