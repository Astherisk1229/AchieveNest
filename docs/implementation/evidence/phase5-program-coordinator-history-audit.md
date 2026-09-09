# Phase 5 Evidence: Reassignment, Removal & History Audit

## Execution Timestamp
2026-09-01T11:23:00+08:00
Database: `achievenest_local`

---

## 1. Controlled History Trace Example

### Scenario Execution:
1. **Creation**: Program `INTG_TEST` created under College of Engineering and Technology.
   - Assignment Count: `0` (Unassigned).
2. **Initial Assignment**: Assigned to Coordinator A (`Cynthia Ramos`).
   - Row 1: `is_active = 1`, `effective_from = 2026-09-01`, `effective_until = NULL`.
3. **Reassignment**: Reassigned from Coordinator A to Coordinator B (`Carlos Mendoza`).
   - Row 1 (A): `is_active = 0`, `effective_from = 2026-09-01`, `effective_until = 2026-09-01`.
   - Row 2 (B): `is_active = 1`, `effective_from = 2026-09-01`, `effective_until = NULL`.
4. **Removal / Unassignment**: Coordinator B unassigned.
   - Row 1 (A): `is_active = 0`, `effective_from = 2026-09-01`, `effective_until = 2026-09-01`.
   - Row 2 (B): `is_active = 0`, `effective_from = 2026-09-01`, `effective_until = 2026-09-01`.
   - Program coverage status: `Unassigned / Needs Coordinator`.
   - Total Historical Rows Retained: `2`.

---

## 2. Hard-Delete Audit
```powershell
Get-ChildItem backend -Recurse -Include *.php |
    Select-String "program_coordinator_assignments|DELETE FROM|delete\("
```
**Finding**: No hard-deletes (`DELETE FROM program_coordinator_assignments`) occur during standard coverage mutations, removals, or reassignments. All coverage removals execute soft deactivation (`is_active = 0`, `effective_until = CURRENT_DATE`).
