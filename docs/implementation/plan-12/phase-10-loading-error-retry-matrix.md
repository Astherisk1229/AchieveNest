# PLAN 12 — Phase 10 Loading/Error/Retry Matrix
## AchieveNest — Student Profile & Institutional Relationship Visibility

---

# 1. State Handling Matrix

| Runtime State | Visual State Rendered | User Action Available |
|---|---|---|
| **Initial Loading** | Centered animated spinner + "Loading authoritative student profile..." | Non-blocking |
| **Partial Moderator Query Failure**| Header & Academic visible; Moderator card shows "Temporarily unavailable" | In-line non-destructive retry |
| **Partial Coordinator Query Failure**| Header & Academic visible; Coordinator card shows "Temporarily unavailable" | In-line non-destructive retry |
| **Total Query Failure (500/Network)**| Rose alert card with error description | "Retry" action button |
| **Successful Retry Execution** | Replaces error state with canonical profile without full-page reload | Normal interaction |
