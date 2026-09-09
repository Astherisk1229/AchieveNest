# AchieveNest Plan 08 — Dynamic Academic Year Design Note
## Baseline 2025 Justification, Generator Architecture, Timezone Authority & Annual Rollover

---

## 1. Baseline Lower Bound Decision: 2025

The lower bound `EARLIEST_ACADEMIC_YEAR_START = 2025` is authoritative based on:
1. **Institutional History**: AchieveNest was commissioned for NDMU starting in Academic Year 2025–2026.
2. **Database Audit Evidence**: 100% of historical student records in `student_program_enrollments` fall between `2025-2026` and `2026-2027`. Zero pre-2025 records exist.
3. **Immutability Policy**: Historical enrollments prior to the system's operational launch are archived in legacy registrar files and not part of the active live provisioning scope.

---

## 2. Generator Implementation Architecture

The generator is implemented in [`frontend/src/utils/academicYearGenerator.js`](file:///c:/Users/Admin/Documents/AchieveNest/frontend/src/utils/academicYearGenerator.js):
- `generateAcademicYearOptions(earliestYear = 2025, currentYear)`: Returns select option objects with placeholder and newest-first ordering (e.g. `2026-2027`, `2025-2026`).
- `getAcademicYearValues(earliestYear = 2025, currentYear)`: Returns pure array of valid string values.
- `getDefaultAcademicYear(currentYear)`: Returns the default starting academic year (e.g. `2026-2027` when calendar year is 2026).

---

## 3. Server Authority & Timezone Alignment

- **Frontend Role**: Generates user-friendly dropdown options for usability.
- **Backend Role**: Final authority on all submissions. Validates that `start_year <= (int)date('Y')` in timezone `Asia/Manila`.
- **Automatic Rollover**: On January 1 of each new calendar year, the generator and validator automatically increment the upper bound (e.g. to `2027-2028` on Jan 1, 2027) without manual code modification or redeployment.
