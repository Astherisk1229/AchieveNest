# PLAN 10 — Phase 4 Canonical Status Mapping Contract
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. Raw-to-Display Mapping Specifications

| Raw `profiles.status` | `must_change_password` | Status Key | Display Label | Badge Theme & Styling | Semantic State |
|---|---|---|---|---|---|
| `'active'` | `1` (true) | `pending_first_login` | **Pending First Login** | Amber pill (`bg-amber-50 text-amber-800 border-amber-200`) | Provisioned, awaiting initial login password change |
| `'active'` | `0` (false) | `active` | **Active** | Emerald pill (`bg-emerald-50 text-emerald-800 border-emerald-200`) | Usable, first-login completed |
| `'locked'` | Any | `locked` | **Locked** | Rose pill (`bg-rose-50 text-rose-800 border-rose-200`) | Account temporarily locked |
| `'suspended'` / `'disabled'` | Any | `disabled` | **Suspended / Disabled** | Slate pill (`bg-slate-100 text-slate-700 border-slate-300`) | Administrative deactivation |
| `'archived'` | Any | `archived` | **Archived** | Neutral Slate (`bg-slate-100 text-slate-500 border-slate-200`) | Historical, non-operational |
| `NULL` / Unsupported | Any | `unknown` | **Unknown** | Neutral Gray (`bg-slate-100 text-slate-600 border-slate-200`) | Missing/unrecognized data |
