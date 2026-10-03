# PLAN 11 — Phase 4 Breakpoint Transition Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Responsive Transition Matrix

| Initial State | Window Resize Action | Final Viewport Tier | Final Mode | Sidebar Appearance | Backdrop State |
|---|---|---|---|---|---|
| **Mobile Overlay (Closed)** | Resize `375px -> 1280px` | Desktop (`xl`) | `persistent` | Static persistent (`w-64`) | Removed (`lg:hidden`) |
| **Mobile Overlay (Open)** | Resize `768px -> 1440px` | Wide Desktop (`2xl`)| `persistent` | Static persistent (`w-64`) | Removed (`lg:hidden`) |
| **Desktop Persistent** | Resize `1280px -> 768px` | Tablet (`md`) | `overlay` | Off-canvas (`-translate-x-full`) | Hidden |
| **Rapid Resize Simulation** | Oscillate `1020px <-> 1030px`| Desktop/Tablet | Synced | Deterministic (`>= 1024px`) | Synced |
| **Orientation Change** | Portrait `768px -> 1024px` | Laptop (`lg`) | `persistent` | Static persistent (`w-64`) | Removed |
