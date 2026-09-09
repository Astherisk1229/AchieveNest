# PLAN 12 — Phase 7 Role/Account Cache Isolation Audit
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Cache Partitioning & Context Isolation

| Scenario | Cache Action | Security Verdict |
|---|---|---|
| **Account Switch (User A -> User B)** | Keys partitioned by user ID (`user-A` vs `user-B`) | **PASS (0 Cross-Account Leaks)** |
| **Role Switch (Student -> Personnel)** | Keys partitioned by role (`student` vs `personnel`) | **PASS (0 Cross-Role Leaks)** |
| **Logout** | Session tokens and active user cache purged | **PASS (0 Residual Storage Leaks)** |
| **Public vs Private Profile** | Distinct query keys (`public-portfolio` vs `student-profile`) | **PASS (0 Surface Collisions)** |
