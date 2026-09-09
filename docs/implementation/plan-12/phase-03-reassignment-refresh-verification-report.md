# PLAN 12 — Phase 3 Reassignment/Refresh Verification Report
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Authoritative Refresh Verification

| Administrative Action | Database Change | Student Profile Result on Next Fetch |
|---|---|---|
| **OSAD Changes Program Coordinator** | Updates old assignment `is_active = 0`, inserts new `is_active = 1` | Instant update to new coordinator; zero cached old name |
| **OSAD Changes Org Moderator** | Updates old assignment `is_active = 0`, inserts new `is_active = 1` | Instant update to new moderator; zero cached old name |
| **Registrar Changes Student Program**| Updates old enrollment `is_active = 0`, inserts new `is_active = 1` | Resolves new Program, College, Coordinator, & Org |
| **Personnel Account Suspended** | Updates `profiles.status = 'suspended'` | Coordinator/Moderator suppressed from contact card |

---

# 2. Key Invariant
- Student profiles have **0** static snapshot copies of moderator/coordinator names. Every profile fetch queries canonical relational tables dynamically.
