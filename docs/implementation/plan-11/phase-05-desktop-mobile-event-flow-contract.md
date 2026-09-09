# PLAN 11 — Phase 5 Desktop/Mobile Event Flow Contract
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Desktop vs Mobile Event Flow Comparison

### 1.1 Desktop Persistent Mode (`>= 1024px`)
```text
User Action (Click / Enter key on Nav Item)
  ↓
React Router Link component receives event
  ↓
Push/replace history entry in client router (URL updates)
  ↓
Sidebar Link executes onClick: invokes onCloseMobile()
  ↓
MainLayout receives callback: sets mobileOpen = false
  ↓
MainLayout renders with persistent CSS (lg:static lg:translate-x-0)
  ↓
Sidebar remains 100% visible; Outlet content renders new page view.
```

### 1.2 Mobile Overlay Mode (`< 1024px`)
```text
User Action (Tap / Enter key on Nav Item in Drawer)
  ↓
React Router Link component receives event
  ↓
Push/replace history entry in client router (URL updates)
  ↓
Sidebar Link executes onClick: invokes onCloseMobile()
  ↓
MainLayout receives callback: sets mobileOpen = false
  ↓
MainLayout applies -translate-x-full (Drawer slides closed)
  ↓
Backdrop is dismissed; Outlet content renders new page view.
```
