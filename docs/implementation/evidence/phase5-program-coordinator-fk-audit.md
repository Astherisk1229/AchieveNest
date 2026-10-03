# Phase 5 Evidence: Foreign-Key & Orphan Integrity Audit

## Execution Timestamp
2026-09-01T11:23:00+08:00
Database: `achievenest_local`

---

## 1. Academic Programs -> Colleges Foreign Key Check
```sql
SELECT ap.id, ap.code, ap.name
FROM academic_programs ap
LEFT JOIN colleges c ON c.id = ap.college_id
WHERE c.id IS NULL;
```
**Result**: 0 rows returned. (PASS)

---

## 2. Program Coordinator Assignments -> Academic Programs Foreign Key Check
```sql
SELECT pca.id, pca.academic_program_id
FROM program_coordinator_assignments pca
LEFT JOIN academic_programs ap ON ap.id = pca.academic_program_id
WHERE ap.id IS NULL;
```
**Result**: 0 rows returned. (PASS)

---

## 3. Program Coordinator Assignments -> Personnel Profiles Foreign Key Check
```sql
SELECT pca.id, pca.personnel_profile_id
FROM program_coordinator_assignments pca
LEFT JOIN profiles p ON p.id = pca.personnel_profile_id
WHERE p.id IS NULL;
```
**Result**: 0 rows returned. (PASS)

---

## 4. HR Personnel Program Affiliations -> Profiles & Academic Programs Foreign Key Check
```sql
SELECT ppa.id
FROM personnel_program_affiliations ppa
LEFT JOIN profiles p ON p.id = ppa.personnel_profile_id
LEFT JOIN academic_programs ap ON ap.id = ppa.academic_program_id
WHERE p.id IS NULL OR ap.id IS NULL;
```
**Result**: 0 rows returned. (PASS)

---

## Summary
All relational references across Academic Programs, Colleges, Personnel Profiles, and Coordinator Coverage assignments satisfy referential integrity with zero orphaned records across both active and historical rows.
