# PLAN 12 — Phase 3 Coordinator Active-State Rule
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Program Coordinator Resolution Query

```sql
SELECT p.id, p.full_name, p.first_name, p.last_name, p.email,
       p.designation_title, p.avatar_url
FROM program_coordinator_assignments pca
JOIN profiles p ON p.id = pca.personnel_profile_id
WHERE pca.academic_program_id = ? 
  AND pca.is_active = 1 
  AND p.status = 'active'
LIMIT 1
```

---

# 2. Key Criteria
1. `pca.is_active = 1`: The assignment is active.
2. `p.status = 'active'`: The personnel account is active.
3. Multi-program coordinators covering multiple programs resolve accurately according to the specific student's enrolled `academic_program_id`.
