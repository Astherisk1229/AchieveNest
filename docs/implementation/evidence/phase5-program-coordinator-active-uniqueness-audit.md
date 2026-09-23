# Phase 5 Evidence: Active Uniqueness & Cardinality Audit

## Execution Timestamp
2026-09-01T11:23:00+08:00
Database: `achievenest_local`

---

## 1. Maximum One Active Coordinator per Academic Program
```sql
SELECT
    academic_program_id,
    COUNT(*) AS active_count
FROM program_coordinator_assignments
WHERE is_active = 1
GROUP BY academic_program_id
HAVING COUNT(*) > 1;
```
**Result**: 0 rows returned. (PASS)

---

## 2. Duplicate Active (Personnel, Program) Pairs
```sql
SELECT
    personnel_profile_id,
    academic_program_id,
    COUNT(*) AS active_count
FROM program_coordinator_assignments
WHERE is_active = 1
GROUP BY personnel_profile_id, academic_program_id
HAVING COUNT(*) > 1;
```
**Result**: 0 rows returned. (PASS)

---

## 3. Database-Level Unique Constraint Enforcement
```sql
SELECT
    CONSTRAINT_NAME,
    TABLE_NAME,
    CONSTRAINT_TYPE
FROM information_schema.TABLE_CONSTRAINTS
WHERE TABLE_SCHEMA = 'achievenest_local'
  AND TABLE_NAME = 'program_coordinator_assignments'
  AND CONSTRAINT_NAME = 'uq_active_program_coordinator';
```
**Result**:
- `CONSTRAINT_NAME`: `uq_active_program_coordinator`
- `TABLE_NAME`: `program_coordinator_assignments`
- `CONSTRAINT_TYPE`: `UNIQUE`

---

## 4. Multi-Program Coordinator Verification
```sql
SELECT
    p.full_name,
    COUNT(pca.id) AS active_program_count
FROM program_coordinator_assignments pca
JOIN profiles p ON p.id = pca.personnel_profile_id
WHERE pca.is_active = 1
GROUP BY pca.personnel_profile_id, p.full_name
ORDER BY active_program_count DESC;
```
**Result**: Supported and verified. One coordinator holding multiple distinct academic programs does not violate cardinality or uniqueness.
