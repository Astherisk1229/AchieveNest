# PLAN 10 — Phase 5 Destructive Action & Confirmation Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Action Risk Classification & Confirmation Rules

| Action | Risk Category | Requires Modal Confirmation? | Consequence Explanation Required? | Reversible? | Audit Event Emitted? |
|---|---|---|---|---|---|
| **View Details** | `NAVIGATION` | No | No | N/A | No |
| **Reset Password** | `SENSITIVE MUTATION` | **Yes** (Confirm modal) | **Yes** ("Student will be required to change password on next login") | Yes | **Yes** (`STUDENT_PASSWORD_RESET`) |
| **Archive Account** *(Future)* | `DESTRUCTIVE` | **Yes** (Destructive modal) | **Yes** ("Account access will be suspended and removed from active directories") | Yes | **Yes** (`STUDENT_ARCHIVED`) |
