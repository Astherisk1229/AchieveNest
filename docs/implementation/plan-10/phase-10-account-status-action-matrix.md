# PLAN 10 — Phase 10 Account Status & Action Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Status-to-Action Binding

| Canonical Lifecycle State | Badge Display Label | Styling Token | Permitted Row Actions | Security Rules |
|---|---|---|---|---|
| **`pending_first_login`** | **Pending First Login** | `bg-amber-50 text-amber-800` | View Details, Reset Temp Password | Generates new one-time credential |
| **`active`** | **Active** | `bg-emerald-50 text-emerald-800` | View Details, Reset Password | Temp credential handoff suppressed |
| **`locked`** | **Locked** | `bg-rose-50 text-rose-800` | View Details | No invented unlock button |
| **`disabled` / `suspended`** | **Suspended / Disabled** | `bg-slate-100 text-slate-700` | View Details | Read-only historical viewing |
| **`archived`** | **Archived** | `bg-slate-100 text-slate-500` | View Details | Read-only historical viewing |
| **`unknown`** | **Unknown** | `bg-slate-100 text-slate-600` | View Details | All mutation actions suppressed |

---

# 2. Strict Semantic Isolation Note
```text
========================================================================
ACCOUNT STATUS != ENROLLMENT STATUS != YEAR LEVEL
========================================================================
Account Status: Authentication access and password change state.
Enrollment Status: Registrar enrollment state (Enrolled / Graduated).
Year Level: Academic progression (1st Year - 5th Year).
```
