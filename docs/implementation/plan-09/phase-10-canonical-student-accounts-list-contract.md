# PLAN 09 — Canonical Student Accounts List Contract
## AchieveNest — Student Account Persistence, Listing Synchronization & Creation Integrity

---

# 1. Authoritative Endpoint Specification

- **Endpoint**: `GET /api/v1/osad/students`
- **Controller**: `App\Controllers\Api\TargetProvisioningController::listStudents`
- **Authorization Scope**: OSAD Administrator (`Bearer` Token with role `osad_admin`)
- **Base Entity**: `profiles p` WHERE `p.account_type = 'student'`

---

# 2. SQL Join Specifications & Parity

```sql
SELECT 
    p.id,
    p.institutional_id AS student_id,
    p.institutional_id,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) AS full_name,
    p.email,
    p.sex,
    p.status,
    p.created_at,
    sp.year_level,
    sp.enrollment_status,
    spe.academic_program_id,
    ap.name AS program_name,
    ap.code AS program_code,
    c.name AS college_name,
    c.code AS college_code,
    c.code AS college,
    lac.must_change_password
FROM profiles p
JOIN student_profiles sp ON sp.profile_id = p.id
LEFT JOIN student_program_enrollments spe ON spe.student_profile_id = sp.profile_id AND spe.is_active = 1
LEFT JOIN academic_programs ap ON ap.id = spe.academic_program_id
LEFT JOIN colleges c ON c.id = ap.college_id
LEFT JOIN local_auth_credentials lac ON lac.profile_id = p.id
WHERE p.account_type = 'student'
ORDER BY p.last_name ASC, p.first_name ASC, p.id ASC;
```

### Join Classification
- `JOIN student_profiles sp`: **REQUIRED** (All valid student accounts have a 1:1 `student_profiles` row).
- `LEFT JOIN student_program_enrollments spe`: **OPTIONAL** (Students without active placement are not dropped).
- `LEFT JOIN academic_programs ap`: **OPTIONAL** (Preserves student visibility even if program reference is unassigned).
- `LEFT JOIN colleges c`: **OPTIONAL** (Preserves student visibility even if college reference is unassigned).
- `LEFT JOIN local_auth_credentials lac`: **OPTIONAL** (Preserves student visibility even if local credentials are being reset).

---

# 3. Canonical Count & Sorting Semantics

- **Deterministic Sort Order**: `p.last_name ASC, p.first_name ASC, p.id ASC` (guarantees zero row drift between pagination pages).
- **Count Invariant**: `COUNT(DISTINCT p.id)` under default query matches `GET /api/v1/osad/students` total exactly (`103 == 103`).
