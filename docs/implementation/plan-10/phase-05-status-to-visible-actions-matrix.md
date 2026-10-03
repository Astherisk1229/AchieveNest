# PLAN 10 — Phase 5 Status-to-Visible-Actions Matrix
## AchieveNest — Student Accounts Table Information Architecture, College Color & Status UX

---

# 1. State-to-Visible-Actions Mapping

| Lifecycle State | Primary Action (Inline) | Overflow Menu Actions (`⋯`) | Notes & Invariants |
|---|---|---|---|
| **Pending First Login** | `View Details` | `Reset Temporary Password` | Only visible to authorized OSAD admin; generates new one-time credential. |
| **Active** | `View Details` | `Reset Password` (Admin manual reset) | No temporary password handoff unless manual reset is confirmed. |
| **Locked** | `View Details` | None | No invented unlock action without backend authorization. |
| **Disabled / Suspended** | `View Details` | None | Read-only historical viewing until reactivation flow is authorized. |
| **Archived** | `View Details` | None | Read-only historical context; no mutation actions. |
| **Unknown** | `View Details` | None | Safe fallback; all mutation actions suppressed. |
