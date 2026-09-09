# PLAN 11 — Phase 1 Sidebar Component & Router Map
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Component Hierarchy & Router Outlet Map

```text
App.jsx (Router Root)
  └── LayoutShell (Route Wrapper with Role Guard)
        └── MainLayout.jsx (Shell Container & State Owner)
              ├── Sidebar.jsx (#main-sidebar - Nav Items & Links)
              │     ├── Brand Header
              │     ├── Search Input
              │     ├── Role Context Badge
              │     ├── Navigation Links (<Link onClick={onCloseMobile}>)
              │     └── AdminOnboardingGuideWidget (Docked)
              ├── Topbar.jsx (Header Bar & Hamburger Trigger)
              └── <main> Workspace Container
                    └── <Outlet /> (Child Route View)
```

---

# 2. Key File Responsibilities

| File Path | Component Name | Architectural Responsibility |
|---|---|---|
| `frontend/src/components/layout/MainLayout.jsx` | `MainLayout` | Owns `isSidebarOpen` state, backdrop overlay, topbar trigger binding, and main scroll container. |
| `frontend/src/components/layout/Sidebar.jsx` | `Sidebar` | Renders authorized role navigation items and handles item click events. |
| `frontend/src/components/layout/Topbar.jsx` | `Topbar` | Renders stationary header bar, user avatar, and mobile/desktop sidebar toggle button. |
| `frontend/src/App.jsx` | `LayoutShell` | Wraps authenticated routes in `MainLayout` with suspense fallback and `<Outlet />`. |
