# PLAN 12 — Phase 7 Relationship Invalidation Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Invalidation Mapping

| Authoritative Database Event | Profile Data Layer Affected | Query Invalidation Trigger | Refetch Behavior |
|---|---|---|---|
| **Student Program Reassignment** | Program, College, Coordinator | `student-profile` query key | Next page entry / component mount |
| **College Linkage Update** | College Name, Acronym, Badge Color | `student-profile` query key | Next page entry / component mount |
| **Organization Affiliation Update**| Organization Name, Code, Scope, Moderator| `student-profile` query key | Next page entry / component mount |
| **Program Coordinator Assignment**| Active Coordinator Card | `student-profile` query key | Next page entry / component mount |
| **Org Moderator Assignment** | Active Moderator Card | `student-profile` query key | Next page entry / component mount |
| **Personnel Suspension / Archive** | Contact Visibility Filter | `student-profile` query key | Next page entry / component mount |
| **First-Login Activation Complete**| Safe Account Status & Placement | `student-profile` query key | Immediate upon portal landing |
