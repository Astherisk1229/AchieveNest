# PLAN 11 — Phase 10 Router/Shell Stability Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Shell Structure & Mount Lifecycle

```text
<Routes>
  └── <Route element={<LayoutShell />}>
        └── <MainLayout>
              ├── <Sidebar />
              ├── <Topbar />
              └── <Suspense fallback={<RouteLoadingFallback />}>
                    └── <Outlet />
```

---

# 2. Key Stability Invariants
- `MainLayout remount on child route change`: **NO (0)**
- `Sidebar remount on child route change`: **NO (0)**
- `Pathname-based shell keys`: **0**
- `Duplicate shared-layout wrappers`: **0**
- `Content-scoped Suspense`: `<Outlet />` is the only changing region during chunk loading; `Sidebar` and `Topbar` remain stationary and interactive.
