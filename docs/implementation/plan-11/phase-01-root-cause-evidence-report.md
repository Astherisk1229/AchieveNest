# PLAN 11 — Phase 1 Root Cause Evidence Report
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Authoritative Root Cause Statement

```text
========================================================================
PRIMARY ROOT CAUSE:
Unconditional invocation of mobile drawer close callback (onCloseMobile)
on every navigation link click within Sidebar.jsx, paired with a unified
boolean (isSidebarOpen) in MainLayout.jsx that applies 'lg:hidden' to the
desktop sidebar when set to false.

TRIGGER:
User clicks any primary navigation link (<Link to={item.path}>).

STATE / COMPONENT OWNER:
- Sidebar.jsx: Calls onCloseMobile?.() unconditionally on Link click (L106, L181).
- MainLayout.jsx: Receives onCloseMobile -> calls setIsSidebarOpen(false) ->
  evaluates 'lg:hidden' on #main-sidebar container (L116, L122).

AFFECTED FILES:
1. frontend/src/components/layout/Sidebar.jsx
2. frontend/src/components/layout/MainLayout.jsx
3. frontend/src/components/layout/Topbar.jsx

CONTRIBUTING CAUSES:
1. Conflation of mobile drawer open/close state with desktop persistent visibility.
2. Lack of viewport-aware check before invoking drawer dismissal handlers.
========================================================================
```
