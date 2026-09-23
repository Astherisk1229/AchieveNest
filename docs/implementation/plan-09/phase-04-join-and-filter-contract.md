# PLAN 09 — Phase 4 Join & Filter Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Join Architecture Contract

```sql
SELECT 
    p.id, p.institutional_id, p.email, p.first_name, p.middle_name, p.last_name, p.full_name, p.sex, p.status,
    lac.must_change_password AS credential_must_change_password,
    CASE
        WHEN lac.profile_id IS NULL THEN 'missing'
        WHEN lac.must_change_password IS NULL THEN 'invalid'
        ELSE 'valid'
    END AS credential_integrity_status,
    sp.year_level, sp.enrollment_status,
    ap.id AS academic_program_id, ap.code AS program_code, ap.name AS program_name,
    c.id AS college_id, c.code AS college_code, c.name AS college_name
FROM profiles p
LEFT JOIN local_auth_credentials lac ON lac.profile_id = p.id
JOIN student_profiles sp ON sp.profile_id = p.id
LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
LEFT JOIN colleges c ON c.id = ap.college_id
WHERE p.account_type = 'student';
```

---

# 2. Join Decision Matrix

| Join Target | Mechanism | Category | Safety Justification |
|---|---|---|---|
| `student_profiles sp` | `JOIN sp ON sp.profile_id = p.id` | **Required** | Ensures only accounts with student profiles are listed. Zero valid students are omitted. |
| `local_auth_credentials lac` | `LEFT JOIN lac ON lac.profile_id = p.id` | **Safe Optional** | Permits accounts with missing/external credentials to be audited rather than silently dropped. |
| `student_program_enrollments spe` | `LEFT JOIN spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1` | **Safe Optional** | Guarantees unplaced or legacy students appear with `program: null` rather than disappearing. `is_active = 1` prevents row multiplication. |
| `academic_programs ap` | `LEFT JOIN ap ON ap.id = spe.academic_program_id` | **Safe Optional** | Preserves student visibility even if program reference is unassigned. |
| `colleges c` | `LEFT JOIN c ON c.id = ap.college_id` | **Safe Optional** | Preserves student visibility even if college reference is unassigned. |

---

# 3. Filter Semantics & Validation Rules

| Filter Parameter | HTTP Query Key | Accepted Values | Query Logic | Error Handling |
|---|---|---|---|---|
| **Search Query** | `search` | String (Trimmed) | `(full_name LIKE %?% OR institutional_id LIKE %?% OR email LIKE %?%)` | Safe wildcard escaping via CodeIgniter builder |
| **College Filter** | `college_id` | UUID | `c.id = ?` | Ignored if empty string |
| **Program Filter** | `program_id` | UUID | `ap.id = ?` | Ignored if empty string |
| **Year Level Filter** | `year_level` | `'1st Year'` to `'5th Year'`, `'all'` | `sp.year_level = ?` | Rejects invalid strings with HTTP `422 VALIDATION_FAILED` |
| **Status Filter** | `status` | `'active'`, `'suspended'`, `'archived'`, `'all'` | `p.status = ?` | Ignored if not in whitelist |
