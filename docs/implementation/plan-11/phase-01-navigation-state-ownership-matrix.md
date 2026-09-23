# PLAN 11 — Phase 1 Navigation State Ownership Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. State Variable Inventory & Ownership

| State Variable | Owner Component | Current Meaning / Usage | Desktop Effect | Mobile Effect | Persisted in Storage? |
|---|---|---|---|---|---|
| `isSidebarOpen` | `MainLayout.jsx` | Combined boolean for mobile drawer and desktop visibility | `false` applies `lg:hidden` (Disappears) | `false` applies `-translate-x-full` (Closes drawer) | **No** (Defaults to `true`) |
| `searchTerm` | `Sidebar.jsx` | Filters sidebar navigation items | Local state | Local state | **No** |
| `activeRoleContext`| `AuthContext.jsx`| Active role persona | Recomputes navigation | Recomputes navigation | **Yes** (`localStorage`) |

---

# 2. Defect Analysis: Boolean Collision
- In current code, `isSidebarOpen` conflates two fundamentally different operational concepts:
  1. `mobileOpen` (Overlay drawer open/closed on `< 1024px`).
  2. `desktopCollapsed` or `desktopVisible` (Sidebar visibility on `>= 1024px`).
- When a user clicks a navigation link, `Sidebar.jsx` calls `onCloseMobile()` -> `setIsSidebarOpen(false)`, triggering `lg:hidden` on desktop!
