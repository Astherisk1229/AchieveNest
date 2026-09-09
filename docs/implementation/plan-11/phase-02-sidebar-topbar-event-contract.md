# PLAN 11 — Phase 2 Sidebar & Topbar Event Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Component Event Contract

```text
+-----------------------------------------------------------------------+
| MainLayout (Owner of mobileOpen)                                     |
|   ├── mobileOpen: boolean                                             |
|   └── setMobileOpen: Dispatch<SetStateAction<boolean>>                |
+-----------------------------------------------------------------------+
        │                                       │
        ▼                                       ▼
+-----------------------------+   +-------------------------------------+
| Topbar                      |   | Sidebar                             |
| Props:                      |   | Props:                              |
| - isSidebarOpen: mobileOpen |   | - currentUser: UserSession          |
| - onToggleSidebar: () => ...|   | - onRoleChange: (role) => ...       |
|                             |   | - onCloseMobile: () => setMobileOpen|
+-----------------------------+   +-------------------------------------+
```

---

# 2. Invariant Rules
- `Sidebar.jsx` emits `onCloseMobile` on link click.
- `MainLayout.jsx` receives `onCloseMobile` and sets `mobileOpen(false)`.
- `MainLayout.jsx` applies `lg:translate-x-0` without `lg:hidden`, ensuring the desktop layout ignores `mobileOpen`.
