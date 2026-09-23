# Organizational Side Conditional UI — Plan D2 Phase D2-1

## Conditional Rules
- **Academic Side** (`organizational_side = 'academic'`):
  - Primary Assignment: **College Dropdown** + Academic Programs multi-select.
  - Department dropdown is hidden / unassigned (`administrative_unit_id = null`).
- **Non-Academic Side** (`organizational_side = 'non_academic'`):
  - Primary Assignment: **Department Dropdown** (from seeded administrative units).
  - College & Academic Programs are hidden / unassigned (`college_id = null`, `academic_program_ids = []`).

## Group Guard Enforcements
- Faculty is strictly restricted to Academic organizational side.
- Non-Teaching Faculty can belong to Academic or Non-Academic organizational sides.
