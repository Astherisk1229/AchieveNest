# AchieveNest Plan 08 — Backend & Database Enforcement Summary
## Migration 000056, MySQL CHECK Constraints, Transitional Sex Policy & Zero Partial Records

---

## 1. Migration 000056 Details

Migration file [`backend/app/Database/Migrations/2026-09-02-000056_AddPlan08CanonicalCheckConstraints.php`](file:///c:/Users/Admin/Documents/AchieveNest/backend/app/Database/Migrations/2026-09-02-000056_AddPlan08CanonicalCheckConstraints.php) adds four native MySQL `CHECK` constraints:

```sql
-- 1. Student Profiles Year Level
ALTER TABLE `student_profiles`
ADD CONSTRAINT `chk_student_profiles_year_level`
CHECK (`year_level` IS NULL OR `year_level` IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'));

-- 2. Student Program Enrollments Year Level
ALTER TABLE `student_program_enrollments`
ADD CONSTRAINT `chk_student_enrollments_year_level`
CHECK (`year_level` IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'));

-- 3. Student Program Enrollments Academic Year
ALTER TABLE `student_program_enrollments`
ADD CONSTRAINT `chk_student_enrollments_academic_year`
CHECK (`academic_year` REGEXP '^[0-9]{4}-[0-9]{4}$');

-- 4. Profiles Sex (Transitional Protection)
ALTER TABLE `profiles`
ADD CONSTRAINT `chk_profiles_sex`
CHECK (`sex` IS NULL OR `sex` IN ('Male', 'Female', 'Prefer not to say'));
```

---

## 2. Transitional Sex Constraint Justification

- **Why `sex IS NULL` is Permitted**: 74 legacy Student records have `sex = NULL`. Imposing a strict `NOT NULL` at the database level before authoritative registrar verification would require artificial backfilling (violating the No-Inference Rule).
- **Why It Is Safe**: All application-level write paths (`TargetProvisioningController::manualStudent`, imports, updates) strictly require non-null canonical Sex (`Male`, `Female`, `Prefer not to say`). The DB constraint guarantees that no invalid non-null text (such as `'Unknown'`, `'Other'`, `'M'`, `'F'`, or injection strings) can be persisted.

---

## 3. Zero-Partial-Record Guarantee

The provisioning workflow is wrapped in a database transaction (`$db->transStart()`). If validation fails at any point (e.g. invalid sex, duplicate email, duplicate institutional ID, or constraint violation), CodeIgniter rolls back all mutations, guaranteeing **0 orphan records** across `profiles`, `student_profiles`, `student_program_enrollments`, `profile_roles`, and `local_auth_credentials`.
