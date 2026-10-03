# PLAN 11 — Phase 2 Unified Navigation State Model
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Executive Summary

This document defines the unified navigation state architecture, responsive mode derivation, and lifecycle transition rules delivered under **Plan 11 Phase 2 — Unified Navigation State Model**.

Phase 2 formally remediates the Phase 1 root cause by decomposing the overloaded `isSidebarOpen` boolean into distinct, isolated state responsibilities.

### Key State Model Highlights
1. **Separation of Concerns**:
   - `mobileOpen`: Controls the off-canvas drawer on `< 1024px` (`lg` breakpoint).
   - Persistent Mode (`>= 1024px`): Desktop sidebar is permanently mounted with `lg:translate-x-0` and `lg:static`.
2. **Zero Desktop Sidebar Disappearance**:
   - Navigation links invoking `onCloseMobile()` set `mobileOpen = false`, which has **zero** effect on desktop sidebar layout, eliminating the `lg:hidden` defect completely.
3. **Router Authority**:
   - Active route highlighting is derived directly from `useLocation().pathname` and search parameters.

---

# 2. State Model Definitions

```text
========================================================================
UNIFIED NAVIGATION STATE ARCHITECTURE
========================================================================

1. navigationMode
   - Value: "persistent" (>= 1024px) | "overlay" (< 1024px)
   - Authority: Derived from Tailwind lg media query.

2. mobileOpen
   - Value: boolean (true = overlay open, false = overlay closed)
   - Scope: Transient React state in MainLayout.jsx. Never persisted.

3. activeRoute
   - Value: URL pathname + search query string
   - Authority: React Router (location.pathname / searchParams).

4. desktopCollapsed
   - Value: false (Standard expanded sidebar)
   - Note: Retained as false in current layout.
========================================================================
```
