# PLAN 10 — Phase 2 Column Removal Safety & Test Impact Report
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Removal Safety Assessment

Every column removed or merged from the default table was evaluated against three safety criteria:

1. **Information Loss Prevention**: `Enrollment`, `Email`, `Sex`, and `Organization` remain present in database queries, API responses, and the **View Details** modal.
2. **Workflow Non-Interference**: OSAD administrators never use the default `Enrollment` column for operational filtering or account mutations.
3. **Sort/Filter Preservation**: Toolbar search continues to match `Email`, `Program`, `Student ID`, and `Name`. Toolbar filters continue to support `College`, `Program`, `Year Level`, `Sex`, and `Account Status`.

---

# 2. Existing Test Impact Audit

| Test Suite | Affected Area | Impact Level | Phase for Test Update |
|---|---|---|---|
| `OSADStudentAccountPhase3.test.jsx` | Table column headers | Low (Updates header expectations from 10 to 4 columns) | Phase 6 |
| `OSADStudentAccountPhase4.test.jsx` | Table column headers | Low (Updates header expectations from 10 to 4 columns) | Phase 6 |
| `OSADPlan09Phase5AuthoritativeRefresh.test.jsx` | Post-create rendering | None (Test targets API state, not table headers) | N/A |
| `OSADPlan09Phase9ComprehensiveTesting.test.jsx` | Synchronization logic | None (Test targets service queries) | N/A |
