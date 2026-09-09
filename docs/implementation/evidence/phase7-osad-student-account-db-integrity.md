# AchieveNest — Plan 03 Phase 7 DB Integrity Evidence

## 1. Schema & Column Assertions

- **Table**: `profiles`
- **Column**: `sex` (`VARCHAR(20) NULL`)
- **Location**: In `profiles` table after `full_name`.
- **Duplicate Subtype Columns**: **0** (Verified `student_profiles` has no `sex` column).

---

## 2. Integrity Verification Query Results

```sql
-- 1. Sex Domain Integrity
SELECT id, sex FROM profiles 
WHERE sex IS NOT NULL AND sex NOT IN ('Male', 'Female', 'Prefer not to say');
-- Result: 0 rows (PASS)

-- 2. Year Level Cache Drift
SELECT sp.profile_id, sp.year_level AS profile_yl, spe.year_level AS enrollment_yl
FROM student_profiles sp
JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
WHERE sp.year_level <> spe.year_level;
-- Result: 0 rows (PASS - 0 drift)

-- 3. Program Authority Resolution
SELECT spe.id, spe.academic_program_id
FROM student_program_enrollments spe
LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
WHERE spe.is_active = 1 AND ap.id IS NULL;
-- Result: 0 rows (PASS - 100% resolve to valid academic_programs)

-- 4. College Authority Resolution
SELECT ap.id, ap.name, ap.college_id
FROM academic_programs ap
LEFT JOIN colleges c ON c.id = ap.college_id
WHERE ap.status = 'active' AND c.id IS NULL;
-- Result: 0 rows (PASS - 100% resolve to valid colleges)

-- 5. Orphan Student Profiles
SELECT sp.profile_id FROM student_profiles sp 
LEFT JOIN profiles p ON p.id = sp.profile_id 
WHERE p.id IS NULL;
-- Result: 0 rows (PASS)

-- 6. Orphan Enrollments
SELECT spe.id FROM student_program_enrollments spe 
LEFT JOIN student_profiles sp ON sp.profile_id = spe.student_profile_id 
WHERE sp.profile_id IS NULL;
-- Result: 0 rows (PASS)

-- 7. Duplicate Institutional IDs
SELECT institutional_id, COUNT(*) as cnt FROM profiles 
GROUP BY institutional_id HAVING cnt > 1;
-- Result: 0 rows (PASS)

-- 8. Duplicate Emails
SELECT email, COUNT(*) as cnt FROM profiles 
GROUP BY email HAVING cnt > 1;
-- Result: 0 rows (PASS)
```

---

## 3. Transaction Rollback & Partial Persistence

- Test creation with simulated failure yielded **0 partial persistence**.
- Database state remained completely pristine after rollback.
