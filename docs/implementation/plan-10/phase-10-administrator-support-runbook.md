# PLAN 10 — Phase 10 Administrator & Support Runbook
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Administrator Operational Guide

### 1.1 Reading the 4-Column Directory
- **Column 1 (Student)**: Scan student full name (`Last, First`) and institutional ID.
- **Column 2 (Academic Placement)**: Identify academic degree program (`BS Computer Science`), year level (`3rd Year`), and color-coded college acronym badge (`[CEAC]`).
- **Column 3 (Account Status)**: Inspect access and activation status (`Active` vs `Pending First Login`).
- **Column 4 (Actions)**: Click `View Details` to view full metadata, or use the `⋯` menu to trigger temporary password resets.

---

# 2. Diagnostic & Troubleshooting Checklist

### 2.1 Student Appears Missing
1. **Search**: Check the search bar in the toolbar. Clear search query if active.
2. **Filters**: Check active filter chips bar (College, Program, Year, Sex, Status). Click `Clear All` to reset.
3. **Pagination**: Check footer pagination controls. Ensure page is not set beyond matching records.
4. **Server Connection**: If a red banner appears, click `Retry` to refresh the table.

### 2.2 College Badge Color Discrepancy
1. Check `colleges` master record in database or Academic Management view.
2. Verify `colleges.acronym_badge_color` value format (`#RRGGBB`).
3. If NULL or invalid hex, the badge automatically defaults to `#16834A`.
4. Update the color in the College record; the Student Accounts table will reflect the change upon the next refresh.
