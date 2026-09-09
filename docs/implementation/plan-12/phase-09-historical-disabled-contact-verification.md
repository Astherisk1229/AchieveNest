# PLAN 12 — Phase 9 Historical/Disabled Contact Verification
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Contact Lifecycle Filtering Verification

| Personnel Scenario | Database State | API Query Filter | Contact Card Display | Status |
|---|---|---|---|---|
| **Active Valid Coordinator** | `is_active = 1`, `p.status = 'active'` | Matches query | Displays Active Coordinator | **PASS** |
| **Historical Past Coordinator**| `is_active = 0`, `p.status = 'active'` | Excluded by `is_active = 1` | Displays "Not yet assigned" | **PASS** |
| **Suspended Coordinator** | `is_active = 1`, `p.status = 'suspended'`| Excluded by `p.status = 'active'` | Displays "Not yet assigned" | **PASS** |
| **Archived Coordinator** | `is_active = 1`, `p.status = 'archived'` | Excluded by `p.status = 'active'` | Displays "Not yet assigned" | **PASS** |
| **Historical Moderator** | `is_active = 0`, `p.status = 'active'` | Excluded by `is_active = 1` | Displays "Not yet assigned" | **PASS** |
| **Suspended Moderator** | `is_active = 1`, `p.status = 'suspended'`| Excluded by `p.status = 'active'` | Displays "Not yet assigned" | **PASS** |
