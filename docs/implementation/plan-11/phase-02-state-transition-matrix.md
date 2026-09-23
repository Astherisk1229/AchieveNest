# PLAN 11 — Phase 2 State Transition Matrix
## AchieveNest — Responsive Sidebar Navigation State & Route Transition Stability

---

# 1. Deterministic State Transitions

| User / System Event | Current Mode | `mobileOpen` State | Desktop Sidebar | Route / URL |
|---|---|---|---|---|
| **Desktop Link Click** | Persistent (`>= lg`) | Ignored (`false`) | **Remains Visible (`lg:translate-x-0`)** | Updates to target path |
| **Mobile Link Click** | Overlay (`< lg`) | Transitions `true -> false` | Hidden off-screen | Updates to target path |
| **Hamburger Toggle (Desktop)**| Persistent (`>= lg`) | Ignored | Remains Visible | Unchanged |
| **Hamburger Toggle (Mobile)** | Overlay (`< lg`) | Toggles `prev -> !prev` | Renders off-canvas drawer | Unchanged |
| **Backdrop Click (Mobile)** | Overlay (`< lg`) | Transitions `true -> false` | N/A | Unchanged |
| **Escape Key Pressed (Mobile)**| Overlay (`< lg`) | Transitions `true -> false` | N/A | Unchanged |
| **Escape Key Pressed (Desktop)**| Persistent (`>= lg`) | Ignored | Remains Visible | Unchanged |
| **Resize: Mobile -> Desktop** | Transitions to `persistent` | Ignored (`false`) | Displays Persistent Sidebar | Unchanged |
| **Resize: Desktop -> Mobile** | Transitions to `overlay` | Initialized to `false` | Stored in Off-canvas position | Unchanged |
