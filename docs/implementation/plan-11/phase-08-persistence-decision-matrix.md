# PLAN 11 — Phase 8 Persistence Decision Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Authoritative Persistence Policy Matrix

| Navigation State Property | Policy Decision | Justification / Technical Rationale |
|---|---|---|
| **`navigationMode`** | **DO NOT PERSIST** | Mode must derive dynamically from the current viewport width (`1024px` breakpoint). Persisting mode causes incorrect layout during window resizes. |
| **`mobileOpen`** | **DO NOT PERSIST** | Overlay drawers are ephemeral interaction states. Persisting an open drawer creates visual obstruction upon reload. |
| **`activeRoute`** | **DO NOT PERSIST** | Route state is fully owned by React Router and browser history (`window.location`). |
| **`desktopCollapsed`** | **NOT APPLICABLE** | AchieveNest implements a standard expanded 256px (`w-64`) persistent desktop sidebar. |
| **`expandedGroups`** | **NOT APPLICABLE** | Sidebar navigation sections use static headers rather than accordion collapsible groups. |
