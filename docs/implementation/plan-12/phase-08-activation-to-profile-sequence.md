# PLAN 12 — Phase 8 Activation-to-Profile Sequence
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. Step-by-Step State & Transition Sequence

```text
Step 1: Student Login (Temporary Password)
   │
   ▼
Step 2: Auth Response: must_change_password = true
   │
   ▼
Step 3: Route Guard: Restrict access to /change-password
   │
   ▼
Step 4: Student Submits Valid New Password (POST /api/v1/auth/change-password)
   │
   ▼
Step 5: Server updates password_hash, sets must_change_password = false
   │
   ▼
Step 6: Frontend establishes active session token & updates AuthContext
   │
   ▼
Step 7: Single Client-Side Transition to /student/account (or /student/dashboard)
   │
   ▼
Step 8: StudentInstitutionalProfileView mounts and calls GET /api/v1/student/profile
   │
   ▼
Step 9: Authoritative institutional relationships render immediately
```
