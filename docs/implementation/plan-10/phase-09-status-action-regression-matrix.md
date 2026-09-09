# PLAN 10 — Phase 9 Status & Action Regression Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Lifecycle State & Action Verification

| Lifecycle State | Resolved Label | Badge Class | Permitted Actions | Security Check |
|---|---|---|---|---|
| **Pending First Login** | `Pending First Login` | `bg-amber-50 text-amber-800` | View Details, Reset Temp Password | 0 plaintext credentials shown |
| **Active** | `Active` | `bg-emerald-50 text-emerald-800` | View Details, Reset Password | Temp credential handoff suppressed |
| **Locked** | `Locked` | `bg-rose-50 text-rose-800` | View Details | 0 invented recovery actions |
| **Suspended / Disabled** | `Suspended / Disabled` | `bg-slate-100 text-slate-700` | View Details | 0 invented enable actions |
| **Archived** | `Archived` | `bg-slate-100 text-slate-500` | View Details | Read-only historical viewing |
| **Unknown** | `Unknown` | `bg-slate-100 text-slate-600` | View Details | All mutations suppressed |
