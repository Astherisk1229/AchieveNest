# PLAN 11 — Phase 2 State Ownership Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Authoritative State Ownership

| State Property | Owner Component | Source of Authority | Scope & Lifetime | Mutation Triggers |
|---|---|---|---|---|
| `navigationMode` | `MainLayout.jsx` / CSS | Tailwind `lg` (1024px) breakpoint | Viewport session | Window resize |
| `mobileOpen` | `MainLayout.jsx` | Local React State (`useState(false)`)| Transient session | Hamburger toggle, Nav click, Backdrop, Esc |
| `activeRoute` | `Sidebar.jsx` | `useLocation()` / `useSearchParams()`| Router lifecycle | Internal client navigation, history |
| `searchTerm` | `Sidebar.jsx` | Local React State (`useState('')`) | Component lifecycle | User text input in sidebar search |
| `activeRoleContext`| `AuthContext.jsx`| Central Auth State (`localStorage`)| Authenticated session | Role switch selector |
