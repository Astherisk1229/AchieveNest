# PLAN 11 — Phase 3 Router & Layout Hierarchy Report
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Executive Summary

This report documents the structural integrity, layout boundaries, and router component hierarchy under **Plan 11 Phase 3 — Layout and Router Stability**.

### Key Architectural Verifications
1. **Stable Shell Hierarchy**:
   - `App.jsx` mounts `LayoutShell` at the layout route level.
   - `LayoutShell` renders `MainLayout`, which hosts `Sidebar`, `Topbar`, and the content `<Outlet />`.
2. **Content-Scoped Suspense & Error Boundaries**:
   - `Suspense fallback={<RouteLoadingFallback />}` is placed directly inside `MainLayout` wrapping `<Outlet />`, ensuring navigation controls (`Sidebar` and `Topbar`) remain permanently visible during lazy chunk loads.
3. **Zero Shell Remount Triggers**:
   - Confirmed `0` pathname-based keys (`key={location.pathname}`) on `MainLayout`, `Sidebar`, or `LayoutShell`.

---

# 2. Router & Layout Hierarchy Diagram

```text
<Routes>
  ├── Public Routes (/, /login, /reset-password, /change-password, /403, /verify/certificate/:id)
  │
  └── Authenticated Layout Routes
        └── <Route element={<LayoutShell ... />}>
              └── <MainLayout currentUser={currentUser}>
                    ├── <Sidebar /> (#main-sidebar - Persistent >= 1024px)
                    ├── <Topbar /> (Stationary header)
                    └── <main> (Scrollable workspace)
                          └── <Suspense fallback={<RouteLoadingFallback />}>
                                └── <Outlet context={{ currentUser }} /> (Child View)
```
