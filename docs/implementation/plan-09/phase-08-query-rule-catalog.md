# PLAN 09 — Phase 8 Reconciliation Query & Rule Catalog
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Reconciliation Rule & Query Catalog

The reconciliation utility evaluates 16 structured rules using deterministic SQL queries:

### Rule 1: Orphan Student Accounts (`ORPHAN_STUDENT_ACCOUNT`)
- **SQL Logic**: `SELECT p.id FROM profiles p LEFT JOIN student_profiles sp ON sp.profile_id = p.id WHERE p.account_type = 'student' AND sp.profile_id IS NULL`
- **Expected Count**: `0`

### Rule 2: Orphan Student Profiles (`ORPHAN_STUDENT_PROFILE`)
- **SQL Logic**: `SELECT sp.profile_id FROM student_profiles sp LEFT JOIN profiles p ON p.id = sp.profile_id WHERE p.id IS NULL`
- **Expected Count**: `0`

### Rule 3: Missing Student Role Assignments (`MISSING_STUDENT_ROLE`)
- **SQL Logic**: `SELECT p.id FROM profiles p JOIN student_profiles sp ON sp.profile_id = p.id LEFT JOIN profile_roles pr ON pr.profile_id = p.id LEFT JOIN roles r ON r.id = pr.role_id AND r.role_key = 'student' WHERE p.account_type = 'student' AND r.id IS NULL`
- **Expected Count**: `0`

### Rule 4: Missing Active Program Enrollments (`MISSING_REQUIRED_ENROLLMENT`)
- **SQL Logic**: `SELECT p.id FROM profiles p JOIN student_profiles sp ON sp.profile_id = p.id LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1 WHERE p.account_type = 'student' AND spe.id IS NULL`
- **Expected Count**: `0`

### Rule 5: Duplicate Student Institutional IDs (`DUPLICATE_STUDENT_ID`)
- **SQL Logic**: `SELECT institutional_id, COUNT(*) FROM profiles WHERE account_type = 'student' GROUP BY institutional_id HAVING COUNT(*) > 1`
- **Expected Count**: `0`

### Rule 6: Duplicate Institutional Emails (`DUPLICATE_INSTITUTIONAL_EMAIL`)
- **SQL Logic**: `SELECT LOWER(TRIM(email)), COUNT(*) FROM profiles WHERE email IS NOT NULL GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1`
- **Expected Count**: `0`

### Rule 7: Invalid Academic Program References (`INVALID_PROGRAM_REFERENCE`)
- **SQL Logic**: `SELECT spe.id FROM student_program_enrollments spe LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id WHERE ap.id IS NULL`
- **Expected Count**: `0`

### Rule 8: Invalid College References (`INVALID_COLLEGE_REFERENCE`)
- **SQL Logic**: `SELECT ap.id FROM academic_programs ap LEFT JOIN colleges c ON c.id = ap.college_id WHERE c.id IS NULL`
- **Expected Count**: `0`

### Rule 9: Invalid Year Levels (`INVALID_YEAR_LEVEL`)
- **SQL Logic**: `SELECT sp.profile_id FROM student_profiles sp WHERE sp.year_level NOT IN ('1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year')`
- **Expected Count**: `0`

### Rule 10: Canonical Student Population Parity (`COUNT_PARITY_MATCH`)
- **SQL Logic**: Canonical DB count (`COUNT(DISTINCT p.id)`) compared to authoritative listing endpoint query count.
- **Expected Match**: `100% Exact Match`
