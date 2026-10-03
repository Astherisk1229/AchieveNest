# PLAN 11 — Phase 1 Setter & Effect Trace
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. State Setter Call-Site Inventory

| Caller Component | Trigger Event | Invocation Code | Impact on Desktop | Impact on Mobile |
|---|---|---|---|---|
| `Sidebar.jsx` (L181) | `<Link>` Nav item clicked | `onClick={() => onCloseMobile?.()}` | **Disappears (`lg:hidden`)** | Closes overlay drawer (Expected) |
| `Sidebar.jsx` (L106) | Brand Logo clicked | `onClick={() => onCloseMobile?.()}` | **Disappears (`lg:hidden`)** | Closes overlay drawer (Expected) |
| `Sidebar.jsx` (L122) | Explicit `X` button clicked | `onClick={onCloseMobile}` | N/A (Hidden on lg) | Closes overlay drawer (Expected) |
| `MainLayout.jsx` (L93)| Keyboard `Escape` pressed | `setIsSidebarOpen(false)` | Disappears (`lg:hidden`) | Closes overlay drawer (Expected) |
| `MainLayout.jsx` (L107)| Backdrop clicked | `onClick={() => setIsSidebarOpen(false)}` | N/A (Hidden on lg) | Closes overlay drawer (Expected) |
| `Topbar.jsx` (L61) | Hamburger button clicked | `onClick={onToggleSidebar}` | Toggles desktop visibility | Toggles mobile drawer |

---

# 2. Execution Sequence on Desktop Navigation Click
```text
1. User clicks navigation link (e.g. "Student Accounts") on desktop (>= 1024px)
2. Sidebar.jsx: Link.onClick executes -> invokes onCloseMobile()
3. MainLayout.jsx: onCloseMobile callback runs -> executes setIsSidebarOpen(false)
4. MainLayout.jsx: React re-renders with isSidebarOpen = false
5. MainLayout.jsx: Main sidebar container evaluates class template:
   isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'
   -> evaluates to 'lg:hidden'
6. Result: Desktop sidebar disappears completely from the page.
```
