# PLAN 10 — Phase 7 Frontend Mapping Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Frontend Field Consumption Rules

| API Field | Frontend Consumer | Presentation Usage | Fallback Rule |
|---|---|---|---|
| `full_name` | `formatLastNameFirst` | Column 1 (Student Name) | `first_name + ' ' + last_name` |
| `student_id` | Direct String | Column 1 (Student ID subtext) | `institutional_id` |
| `program` | Direct String | Column 2 (Program Title) | `'No active enrollment'` |
| `year_level` | Direct String | Column 2 (Year Level text) | `'1st Year'` |
| `college` | Direct String | Column 2 (College Badge text) | `'CEAC'` |
| `college_color` | Dynamic inline style | Column 2 (College Badge background) | `'#16834A'` (NDMU Emerald) |
| `status` + `must_change_password` | `resolveStudentAccountStatus` | Column 3 (Account Status Badge) | `'Unknown'` (Neutral Slate) |
