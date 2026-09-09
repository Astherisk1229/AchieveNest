# AchieveNest Plan 08 — Dependent UI & Reporting Consistency Summary
## Downstream Alignment, Safe Neutral Fallbacks, Numeric AY Sorting & Repository Sweep

---

## 1. Downstream Alignment & Shared Helpers

- **Contract Location**: [`frontend/src/contracts/studentAccountContract.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/contracts/studentAccountContract.js)
- **`formatStudentSexDisplay(sex, fallback = 'Not yet provided')`**: Standardizes Sex display across tables, cards, and profiles, ensuring legacy `NULL` values render neutrally (e.g. `'—'`) without errors.
- **`compareAcademicYears(ay1, ay2, descending = true)`**: Sorts academic years numerically using the integer start year (`Number(ay.split('-')[0])`), guaranteeing consistent chronological order (e.g. `2027-2028`, `2026-2027`, `2025-2026`).

---

## 2. OSAD Student Accounts Page Alignment

In [`frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/pages/osad-admin/OSADStudentAccountsPage.jsx):
- **Filter**: `YEAR_LEVELS` is defined strictly as `['all', ...STUDENT_YEAR_LEVELS]`, completely excluding `Graduate`.
- **Table & Mobile View**: Uses `formatStudentSexDisplay(user.sex, '—')` to display valid canonical Sex or safe neutral fallbacks.

---

## 3. Graduate Status Separation & Repository Sweep

A full repository search across `frontend/src` and `backend/app` confirmed:
- **`Graduate` under Current Year Level logic: 0 occurrences**.
- All legitimate references to `graduated` or graduation ceremonies represent distinct lifecycle statuses (`enrollment_status`, alumni lists) rather than current academic year levels.
