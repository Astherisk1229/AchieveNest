# PLAN 12 — Phase 3 Moderator Active-State Rule
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Organization Moderator Resolution Query

```sql
SELECT p.id, p.full_name, p.first_name, p.last_name, p.email,
       p.designation_title, p.avatar_url
FROM organization_moderator_assignments oma
JOIN profiles p ON p.id = oma.personnel_profile_id
WHERE oma.organization_id = ? 
  AND oma.is_active = 1 
  AND p.status = 'active'
LIMIT 1
```

---

# 2. Key Criteria
1. `oma.is_active = 1`: The assignment is marked active.
2. `p.status = 'active'`: The personnel profile account is in active status.
3. If no matching row is returned, the moderator field resolves to `null` with `has_moderator = false`.
